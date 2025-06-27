import { Inject, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { JwtPayload } from '@/auth/interfaces/payload.interface';
import { UserPayload } from '@/auth/interfaces/user-payload.interface';
import { CONFIG_TOKENS } from '@/configs';
import { JWTAccessConfig, jwtAccessConfig } from '@/configs/jwt-access.config';

export class JwtAccessStrategy extends PassportStrategy(
	Strategy,
	CONFIG_TOKENS.JWT_ACCESS,
) {
	constructor(
		@Inject(jwtAccessConfig.KEY)
		private readonly jwtAccessConfiguration: JWTAccessConfig,
	) {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			secretOrKey: jwtAccessConfiguration.secret!,
			ignoreExpiration: false,
		});
	}

	validate(payload: JwtPayload): UserPayload {
		if (!payload.sub || !payload.role) {
			throw new UnauthorizedException('Invalid access token payload');
		}

		const userPayload: UserPayload = {
			id: payload.sub,
			role: payload.role,
		};

		return userPayload;
	}
}
