import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
	Inject,
	Injectable,
	Logger,
	NotFoundException,
	UnauthorizedException,
} from '@nestjs/common';
import { Cache } from 'cache-manager';

import { OTP_CACHE_KEY, OTP_TTL } from '@/auth/constants';
import {
	RequestPasswordResetDto,
	VerifyOtpAndResetPasswordDto,
} from '@/auth/dtos';
import { EmailJobType, EmailQueueService } from '@/queue';
import { UserService } from '@/users/index';
import { generateOTP, generateStrongPassword } from '@/utils';

@Injectable()
export class PasswordResetService {
	private readonly logger = new Logger(PasswordResetService.name);

	constructor(
		@Inject(CACHE_MANAGER) private readonly cache: Cache,
		private readonly userService: UserService,
		private readonly email: EmailQueueService,
	) {}

	async request(dto: RequestPasswordResetDto): Promise<void> {
		this.logger.log(`Password reset requested for email: ${dto.email}`);

		try {
			// Find user by email
			const user = await this.userService.findOne({ email: dto.email });

			if (!user?.isActive) {
				throw new NotFoundException('User not found or inactive');
			}

			// Generate OTP
			const otpCode = generateOTP();

			// Store OTP in cache with 10 minutes TTL
			const key = `${OTP_CACHE_KEY}:${dto.email}`;
			await this.cache.set(key, { otpCode, userId: user.id }, OTP_TTL);

			// Send OTP email
			await this.email.sendEmail(EmailJobType.SEND_OTP, {
				to: dto.email,
				subject: 'Password Reset OTP - TheSync',
				context: {
					fullName: user.fullName,
					otpCode,
				},
			});

			this.logger.log(`OTP sent for password reset: ${dto.email}`);

			return;
		} catch (error) {
			this.logger.error('Error during password reset request', error);

			throw error;
		}
	}

	async verify(dto: VerifyOtpAndResetPasswordDto): Promise<void> {
		this.logger.log(
			`Verifying OTP and resetting password for email: ${dto.email}`,
		);

		try {
			// Find user
			const user = await this.userService.findOne({ email: dto.email });

			if (!user?.isActive) {
				throw new NotFoundException('User not found or inactive');
			}

			// Check OTP in cache
			const key = `${OTP_CACHE_KEY}:${dto.email}`;
			const cached = await this.cache.get<{
				otpCode: string;
				userId: string;
			}>(key);

			if (!cached || cached.otpCode !== dto.otpCode) {
				throw new UnauthorizedException('Invalid or expired OTP code');
			}

			// Generate new password
			const newPassword = generateStrongPassword();

			// Update user password
			await this.userService.updatePassword(user.id, newPassword);

			// Remove OTP from cache
			await this.cache.del(key);

			// Send new password email
			await this.email.sendEmail(EmailJobType.SEND_RESET_PASSWORD, {
				to: dto.email,
				subject: 'Your New Password - TheSync',
				context: {
					fullName: user.fullName,
					email: dto.email,
					newPassword,
				},
			});

			this.logger.log(`Password reset completed for user: ${dto.email}`);

			return;
		} catch (error) {
			this.logger.error(
				'Error during OTP verification and password reset',
				error,
			);

			throw error;
		}
	}
}
