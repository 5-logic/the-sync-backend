import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
	Inject,
	Injectable,
	Logger,
	UnauthorizedException,
} from '@nestjs/common';
import { Cache } from 'cache-manager';

import { CACHE_KEY, TOKEN_CACHE_TTL } from '@/auth/constants';
import { RefreshDto, UserLoginDto } from '@/auth/dtos';
import { Role } from '@/auth/enums';
import { CachePayload, JwtPayload } from '@/auth/interfaces';
import { LoginResponse, RefreshResponse } from '@/auth/responses';
import { TokenAuthService } from '@/auth/services/token-auth.service';
import { UserService } from '@/users/index';
import { generateIdentifier } from '@/utils';

@Injectable()
export class UserAuthService {
	private readonly logger = new Logger(UserAuthService.name);

	constructor(
		@Inject(CACHE_MANAGER) private readonly cache: Cache,
		private readonly userService: UserService,
		private readonly tokenService: TokenAuthService,
	) {}

	async login(dto: UserLoginDto): Promise<LoginResponse> {
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

			const accessToken =
				await this.tokenService.generateAccessToken(accessPayload);
			const refreshToken =
				await this.tokenService.generateRefreshToken(refreshPayload);

			const key = `${CACHE_KEY}:${user.id}`;
			await this.cache.set(
				key,
				{ accessIdentifier, refreshIdentifier },
				TOKEN_CACHE_TTL,
			);

			const result: LoginResponse = {
				accessToken,
				refreshToken,
			};

			return result;
		} catch (error) {
			this.logger.error('Error during user login', error);

			throw error;
		}
	}

	async refresh(dto: RefreshDto): Promise<RefreshResponse> {
		try {
			const decoded: JwtPayload = await this.tokenService.verifyRefreshToken(
				dto.refreshToken,
			);

			if (!decoded || decoded.role === Role.ADMIN) {
				throw new UnauthorizedException('Invalid refresh token');
			}

			if (decoded.exp && decoded.exp < Date.now() / 1000) {
				throw new UnauthorizedException('Refresh token has expired');
			}

			const key = `${CACHE_KEY}:${decoded.sub}`;
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

			const accessToken =
				await this.tokenService.generateAccessToken(accessPayload);

			await this.cache.set(
				key,
				{ accessIdentifier, refreshIdentifier },
				TOKEN_CACHE_TTL,
			);

			const result: RefreshResponse = {
				accessToken,
			};

			return result;
		} catch (error) {
			this.logger.error('Error during user refresh', error);

			throw error;
		}
	}
}
