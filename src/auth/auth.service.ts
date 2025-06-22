import {
	Inject,
	Injectable,
	Logger,
	UnauthorizedException,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { AdminService } from '@/admins/admin.service';
import { AdminLoginDto } from '@/auth/dto/auth.admin.dto';
import { RefreshDto } from '@/auth/dto/auth.refresh.dto';
import { UserLoginDto } from '@/auth/dto/auth.user.dto';
import { Role } from '@/auth/enums/role.enum';
import { JwtPayload } from '@/auth/interfaces/payload.interface';
import { jwtAccessConfig } from '@/configs/jwt-access.config';
import { jwtRefreshConfig } from '@/configs/jwt-refresh.config';
import { UserService } from '@/users/user.service';

@Injectable()
export class AuthService {
	private readonly logger = new Logger(AuthService.name);

	constructor(
		@Inject(jwtAccessConfig.KEY)
		private readonly jwtAccessConfiguration: ConfigType<typeof jwtAccessConfig>,
		@Inject(jwtRefreshConfig.KEY)
		private readonly jwtRefreshConfiguration: ConfigType<
			typeof jwtRefreshConfig
		>,
		private readonly adminService: AdminService,
		private readonly userService: UserService,
		private readonly jwtService: JwtService,
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

			const payload: JwtPayload = {
				sub: admin.id,
				role: Role.ADMIN,
			};

			const accessToken = await this.generateAccessToken(payload);

			const refreshToken = await this.generateRefreshToken(payload);

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

			const admin = await this.adminService.findOne(decoded.sub);

			if (!admin) {
				throw new UnauthorizedException('Admin not found');
			}

			const payload: JwtPayload = {
				sub: admin.id,
				role: Role.ADMIN,
			};

			const accessToken = await this.generateAccessToken(payload);

			return { accessToken };
		} catch (error) {
			this.logger.error('Error during admin refresh', error);

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

			const payload: JwtPayload = {
				sub: user.id,
				role: role,
			};

			const accessToken = await this.generateAccessToken(payload);
			const refreshToken = await this.generateRefreshToken(payload);

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

			const user = await this.userService.findOne({ id: decoded.sub });

			if (!user?.isActive) {
				throw new UnauthorizedException('User not found');
			}

			const role = await this.userService.checkRole(user.id);

			if (!role) {
				throw new UnauthorizedException('User role not found');
			}

			const payload: JwtPayload = {
				sub: user.id,
				role: role,
			};

			const accessToken = await this.generateAccessToken(payload);

			return { accessToken };
		} catch (error) {
			this.logger.error('Error during user refresh', error);

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
