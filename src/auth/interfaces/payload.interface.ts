import { Role } from '@/auth/enums/role.enum';

export interface JwtPayload {
	sub: string;
	role: Role;
	iat?: number;
	exp?: number;
}
