import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
	Inject,
	Injectable,
	Logger,
	NotFoundException,
	UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Cache } from 'cache-manager';

import { AdminService } from '@/admins/admin.service';
import {
	AdminLoginDto,
	RefreshDto,
	RequestPasswordResetDto,
	UserLoginDto,
	VerifyOtpAndResetPasswordDto,
} from '@/auth/dto';
import { Role } from '@/auth/enums/role.enum';
import { CachePayload, JwtPayload } from '@/auth/interfaces';
import {
	JWTAccessConfig,
	JWTRefreshConfig,
	jwtAccessConfig,
	jwtRefreshConfig,
} from '@/configs';
import { EmailQueueService } from '@/queue/email/email-queue.service';
import { EmailJobType } from '@/queue/email/enums/type.enum';
import { UserService } from '@/users/user.service';
import {
	generateIdentifier,
	generateOTP,
	generateStrongPassword,
} from '@/utils';

@Injectable()
export class AuthService {
	private readonly logger = new Logger(AuthService.name);
	private static readonly CACHE_TTL = 7 * 24 * 60 * 60 * 1000;
	static readonly CACHE_KEY = 'cache:auth';
	private static readonly OTP_CACHE_KEY = 'cache:otp';
	private static readonly OTP_TTL = 10 * 60 * 1000; // 10 minutes

	constructor(
		@Inject(jwtAccessConfig.KEY)
		private readonly jwtAccessConfiguration: JWTAccessConfig,
		@Inject(jwtRefreshConfig.KEY)
		private readonly jwtRefreshConfiguration: JWTRefreshConfig,
		@Inject(CACHE_MANAGER) private readonly cache: Cache,
		private readonly adminService: AdminService,
		private readonly userService: UserService,
		private readonly jwtService: JwtService,
		private readonly email: EmailQueueService,
	) {}

	async loginAdmin(dto: AdminLoginDto) {
		try {
			const admin = await this.adminService.validateAdmin(
				dto.username,
				dto.password,
			);

			if (!admin) {
				throw new UnauthorizedException('Not authorized');
			}

			const accessIdentifier = generateIdentifier();
			const refreshIdentifier = generateIdentifier();

			const accessPayload: JwtPayload = {
				sub: admin.id,
				role: Role.ADMIN,
				identifier: accessIdentifier,
			};

			const refreshPayload: JwtPayload = {
				sub: admin.id,
				role: Role.ADMIN,
				identifier: refreshIdentifier,
			};

			const accessToken = await this.generateAccessToken(accessPayload);

			const refreshToken = await this.generateRefreshToken(refreshPayload);

			const key = `${AuthService.CACHE_KEY}:${admin.id}`;
			await this.cache.set(
				key,
				{ accessIdentifier, refreshIdentifier },
				AuthService.CACHE_TTL,
			);

			return {
				accessToken,
				refreshToken,
			};
		} catch (error) {
			this.logger.error('Error during admin login', error);

			throw error;
		}
	}

	async refreshAdmin(dto: RefreshDto) {
		try {
			const { refreshToken } = dto;

			const decoded: JwtPayload = await this.jwtService.verifyAsync(
				refreshToken,
				{
					secret: this.jwtRefreshConfiguration.secret,
				},
			);

			if (!decoded || decoded.role !== Role.ADMIN) {
				throw new UnauthorizedException('Invalid refresh token');
			}

			if (decoded.exp && decoded.exp < Date.now() / 1000) {
				throw new UnauthorizedException('Refresh token has expired');
			}

			const key = `${AuthService.CACHE_KEY}:${decoded.sub}`;
			const cached = await this.cache.get<CachePayload>(key);

			if (!cached || cached.refreshIdentifier !== decoded.identifier) {
				throw new UnauthorizedException('Invalid or expired refresh token');
			}

			const admin = await this.adminService.findOne(decoded.sub);

			if (!admin) {
				throw new UnauthorizedException('Admin not found');
			}

			const accessIdentifier = generateIdentifier();
			const refreshIdentifier = cached.refreshIdentifier;

			const accessPayload: JwtPayload = {
				sub: admin.id,
				role: Role.ADMIN,
				identifier: accessIdentifier,
			};

			const accessToken = await this.generateAccessToken(accessPayload);

			await this.cache.set(
				key,
				{ accessIdentifier, refreshIdentifier },
				AuthService.CACHE_TTL,
			);

			return { accessToken };
		} catch (error) {
			this.logger.error('Error during admin refresh', error);

			throw error;
		}
	}

	async logoutAdmin(id: string) {
		try {
			const key = `${AuthService.CACHE_KEY}:${id}`;
			await this.cache.del(key);

			return;
		} catch (error) {
			this.logger.error('Error during admin logout', error);

			throw error;
		}
	}

	async loginUser(dto: UserLoginDto) {
		try {
			const user = await this.userService.validateUser(dto.email, dto.password);

			if (!user) {
				throw new UnauthorizedException('Not authorized');
			}

			const role = await this.userService.checkRole(user.id);

			if (!role) {
				throw new UnauthorizedException('User role not found');
			}

			const accessIdentifier = generateIdentifier();
			const refreshIdentifier = generateIdentifier();

			const accessPayload: JwtPayload = {
				sub: user.id,
				role: role,
				identifier: accessIdentifier,
			};

			const refreshPayload: JwtPayload = {
				sub: user.id,
				role: role,
				identifier: refreshIdentifier,
			};

			const accessToken = await this.generateAccessToken(accessPayload);
			const refreshToken = await this.generateRefreshToken(refreshPayload);

			const key = `${AuthService.CACHE_KEY}:${user.id}`;
			await this.cache.set(
				key,
				{ accessIdentifier, refreshIdentifier },
				AuthService.CACHE_TTL,
			);

			return {
				accessToken,
				refreshToken,
			};
		} catch (error) {
			this.logger.error('Error during user login', error);

			throw error;
		}
	}

	async refreshUser(dto: RefreshDto) {
		try {
			const { refreshToken } = dto;

			const decoded: JwtPayload = await this.jwtService.verifyAsync(
				refreshToken,
				{
					secret: this.jwtRefreshConfiguration.secret,
				},
			);

			if (!decoded || decoded.role === Role.ADMIN) {
				throw new UnauthorizedException('Invalid refresh token');
			}

			if (decoded.exp && decoded.exp < Date.now() / 1000) {
				throw new UnauthorizedException('Refresh token has expired');
			}

			const key = `${AuthService.CACHE_KEY}:${decoded.sub}`;
			const cached = await this.cache.get<CachePayload>(key);

			if (!cached || cached.refreshIdentifier !== decoded.identifier) {
				throw new UnauthorizedException('Invalid or expired refresh token');
			}

			const user = await this.userService.findOne({ id: decoded.sub });

			if (!user?.isActive) {
				throw new UnauthorizedException('User not found');
			}

			const role = await this.userService.checkRole(user.id);

			if (!role) {
				throw new UnauthorizedException('User role not found');
			}

			const accessIdentifier = generateIdentifier();
			const refreshIdentifier = cached.refreshIdentifier;

			const accessPayload: JwtPayload = {
				sub: user.id,
				role: role,
				identifier: accessIdentifier,
			};

			const accessToken = await this.generateAccessToken(accessPayload);

			await this.cache.set(
				key,
				{ accessIdentifier, refreshIdentifier },
				AuthService.CACHE_TTL,
			);

			return { accessToken };
		} catch (error) {
			this.logger.error('Error during user refresh', error);

			throw error;
		}
	}

	async logoutUser(id: string) {
		try {
			const key = `${AuthService.CACHE_KEY}:${id}`;
			await this.cache.del(key);

			return;
		} catch (error) {
			this.logger.error('Error during user logout', error);

			throw error;
		}
	}

	async requestPasswordReset(dto: RequestPasswordResetDto) {
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
			const key = `${AuthService.OTP_CACHE_KEY}:${dto.email}`;
			await this.cache.set(
				key,
				{ otpCode, userId: user.id },
				AuthService.OTP_TTL,
			);

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

	async verifyOtpAndResetPassword(dto: VerifyOtpAndResetPasswordDto) {
		try {
			// Find user
			const user = await this.userService.findOne({ email: dto.email });

			if (!user?.isActive) {
				throw new NotFoundException('User not found or inactive');
			}

			// Check OTP in cache
			const key = `${AuthService.OTP_CACHE_KEY}:${dto.email}`;
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

	async generateAccessToken(payload: JwtPayload) {
		return await this.jwtService.signAsync(payload, {
			secret: this.jwtAccessConfiguration.secret,
			expiresIn: this.jwtAccessConfiguration.signOptions?.expiresIn,
		});
	}

	async generateRefreshToken(payload: JwtPayload) {
		return await this.jwtService.signAsync(payload, {
			secret: this.jwtRefreshConfiguration.secret,
			expiresIn: this.jwtRefreshConfiguration.signOptions?.expiresIn,
		});
	}
}
