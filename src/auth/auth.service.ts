import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
	Inject,
	Injectable,
	Logger,
	UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Cache } from 'cache-manager';

import { AdminService } from '@/admins/admin.service';
import { AdminLoginDto, RefreshDto, UserLoginDto } from '@/auth/dto';
import { Role } from '@/auth/enums/role.enum';
import { CachePayload, JwtPayload } from '@/auth/interfaces';
import {
	CONSTANTS,
	JWTAccessConfig,
	JWTRefreshConfig,
	jwtAccessConfig,
	jwtRefreshConfig,
} from '@/configs';
import { UserService } from '@/users/user.service';
import { generateIdentifier } from '@/utils';

@Injectable()
export class AuthService {
	private readonly logger = new Logger(AuthService.name);
	static readonly CACHE_KEY = 'cache:auth';

	constructor(
		@Inject(jwtAccessConfig.KEY)
		private readonly jwtAccessConfiguration: JWTAccessConfig,
		@Inject(jwtRefreshConfig.KEY)
		private readonly jwtRefreshConfiguration: JWTRefreshConfig,
		@Inject(CACHE_MANAGER) private readonly cache: Cache,
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
				CONSTANTS.TTL,
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
				CONSTANTS.TTL,
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
				{ accessPayload, refreshPayload },
				CONSTANTS.TTL,
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
				CONSTANTS.TTL,
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
