import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { ROLE_KEY } from '@/auth/decorators/roles.decorator';
import { Role } from '@/auth/enums/role.enum';
import { UserPayload } from '@/auth/interfaces/user-payload.interface';

@Injectable()
export class RoleGuard implements CanActivate {
	constructor(private readonly reflector: Reflector) {}

	canActivate(context: ExecutionContext): boolean {
		const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLE_KEY, [
			context.getHandler(),
			context.getClass(),
		]);

		if (!requiredRoles) {
			return true;
		}

		const request = context.switchToHttp().getRequest();
		const user: UserPayload = request.user;

		if (!user) {
			return false;
		}

		return requiredRoles.includes(user.role);
	}
}
