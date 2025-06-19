import { Inject, UnauthorizedException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { JwtPayload } from '@/auth/interfaces/payload.interface';
import { UserPayload } from '@/auth/interfaces/user-payload.interface';
import { jwtAccessConfig } from '@/configs/jwt-access.config';

export class JwtAccessStrategy extends PassportStrategy(
	Strategy,
	'jwt-access',
) {
	constructor(
		@Inject(jwtAccessConfig.KEY)
		private readonly jwtAccessConfiguration: ConfigType<typeof jwtAccessConfig>,
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
