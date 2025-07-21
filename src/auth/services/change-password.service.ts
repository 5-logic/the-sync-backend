import { Injectable, Logger } from '@nestjs/common';

import { ChangePasswordDto } from '@/auth/dtos';
import { UserService } from '@/users/index';

@Injectable()
export class ChangePasswordService {
	private readonly logger = new Logger(ChangePasswordService.name);

	constructor(private readonly userService: UserService) {}

	async changePassword(userId: string, dto: ChangePasswordDto) {
		try {
			await this.userService.changePassword(userId, dto);

			return;
		} catch (error) {
			this.logger.error('Error during password change', error);

			throw error;
		}
	}
}
