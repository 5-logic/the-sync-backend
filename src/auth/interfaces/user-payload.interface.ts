import { Role } from '@/auth/enums/role.enum';

export interface UserPayload {
	id: string;
	role: Role;
}
