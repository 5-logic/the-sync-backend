import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
	Inject,
	Injectable,
	Logger,
	UnauthorizedException,
} from '@nestjs/common';
import { Cache } from 'cache-manager';

import { AdminService } from '@/admins/index';
import { CACHE_KEY, TOKEN_CACHE_TTL } from '@/auth/constants';
import { AdminLoginDto, RefreshDto } from '@/auth/dtos';
import { Role } from '@/auth/enums';
import { CachePayload, JwtPayload } from '@/auth/interfaces';
import { LoginResponse, RefreshResponse } from '@/auth/responses';
import { TokenAuthService } from '@/auth/services/token-auth.service';
import { generateIdentifier } from '@/utils';

@Injectable()
export class AdminAuthService {
	private readonly logger = new Logger(AdminAuthService.name);

	constructor(
		@Inject(CACHE_MANAGER) private readonly cache: Cache,
		private readonly adminService: AdminService,
		private readonly tokenService: TokenAuthService,
	) {}

	async login(dto: AdminLoginDto): Promise<LoginResponse> {
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

			const accessToken =
				await this.tokenService.generateAccessToken(accessPayload);

			const refreshToken =
				await this.tokenService.generateRefreshToken(refreshPayload);

			const key = `${CACHE_KEY}:${admin.id}`;
			await this.cache.set(
				key,
				{
					accessIdentifier: accessIdentifier,
					refreshIdentifier: refreshIdentifier,
				},
				TOKEN_CACHE_TTL,
			);

			const result: LoginResponse = {
				accessToken,
				refreshToken,
			};

			return result;
		} catch (error) {
			this.logger.error('Error during admin login', error);

			throw error;
		}
	}

	async refresh(dto: RefreshDto): Promise<RefreshResponse> {
		try {
			const decoded: JwtPayload = await this.tokenService.verifyRefreshToken(
				dto.refreshToken,
			);

			if (!decoded || decoded.role !== Role.ADMIN) {
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

			const accessToken =
				await this.tokenService.generateAccessToken(accessPayload);

			await this.cache.set(
				key,
				{
					accessIdentifier: accessIdentifier,
					refreshIdentifier: refreshIdentifier,
				},
				TOKEN_CACHE_TTL,
			);

			const result: RefreshResponse = {
				accessToken,
			};

			return result;
		} catch (error) {
			this.logger.error('Error during admin refresh', error);

			throw error;
		}
	}
}
