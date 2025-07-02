import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Cache } from 'cache-manager';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { AuthService } from '@/auth/auth.service';
import { CachePayload, JwtPayload, UserPayload } from '@/auth/interfaces';
import { CONFIG_TOKENS, JWTAccessConfig, jwtAccessConfig } from '@/configs';

export class JwtAccessStrategy extends PassportStrategy(
	Strategy,
	CONFIG_TOKENS.JWT_ACCESS,
) {
	constructor(
		@Inject(jwtAccessConfig.KEY)
		private readonly jwtAccessConfiguration: JWTAccessConfig,
		@Inject(CACHE_MANAGER) private readonly cache: Cache,
	) {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			secretOrKey: jwtAccessConfiguration.secret!,
			ignoreExpiration: false,
		});
	}

	async validate(payload: JwtPayload): Promise<UserPayload> {
		if (!payload.sub || !payload.role) {
			throw new UnauthorizedException('Invalid access token payload');
		}

		const key = `${AuthService.CACHE_KEY}:${payload.sub}`;
		const cache = await this.cache.get<CachePayload>(key);

		if (
			!cache ||
			!cache.accessToken ||
			!cache.identifier ||
			cache.identifier !== payload.identifier
		) {
			throw new UnauthorizedException('Access token is invalid or expired');
		}

		const userPayload: UserPayload = {
			id: payload.sub,
			role: payload.role,
		};

		return userPayload;
	}
}
