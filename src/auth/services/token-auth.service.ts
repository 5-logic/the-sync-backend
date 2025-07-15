import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { JwtPayload } from '@/auth/interfaces';
import {
	JWTAccessConfig,
	JWTRefreshConfig,
	jwtAccessConfig,
	jwtRefreshConfig,
} from '@/configs';

@Injectable()
export class TokenAuthService {
	constructor(
		@Inject(jwtAccessConfig.KEY)
		private readonly jwtAccessConfiguration: JWTAccessConfig,
		@Inject(jwtRefreshConfig.KEY)
		private readonly jwtRefreshConfiguration: JWTRefreshConfig,
		private readonly jwtService: JwtService,
	) {}

	async generateAccessToken(payload: JwtPayload): Promise<string> {
		return await this.jwtService.signAsync(payload, {
			secret: this.jwtAccessConfiguration.secret,
			expiresIn: this.jwtAccessConfiguration.signOptions?.expiresIn,
		});
	}

	async generateRefreshToken(payload: JwtPayload): Promise<string> {
		return await this.jwtService.signAsync(payload, {
			secret: this.jwtRefreshConfiguration.secret,
			expiresIn: this.jwtRefreshConfiguration.signOptions?.expiresIn,
		});
	}

	async verifyToken(token: string): Promise<JwtPayload> {
		return await this.jwtService.verifyAsync<JwtPayload>(token, {
			secret: this.jwtAccessConfiguration.secret,
		});
	}
}
