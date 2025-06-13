import { Injectable, Logger } from '@nestjs/common';

import { AdminService } from '@/admins/admin.service';
import { UserService } from '@/users/user.service';

@Injectable()
export class AuthService {
	private readonly logger = new Logger(AuthService.name);

	constructor(
		private readonly adminService: AdminService,
		private readonly userService: UserService,
	) {}
}
