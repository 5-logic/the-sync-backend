import { Role } from '@/auth/enums/role.enum';

export interface JwtPayload {
	sub: string;
	role: Role;
	identifier: string;
	iat?: number;
	exp?: number;
}
