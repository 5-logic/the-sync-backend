import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { CONFIG_TOKENS } from '@/configs';

@Injectable()
export class JwtAccessAuthGuard extends AuthGuard(CONFIG_TOKENS.JWT_ACCESS) {}
