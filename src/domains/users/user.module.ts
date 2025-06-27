import { Module } from '@nestjs/common';

import { UserService } from '@/users/user.service';

@Module({
	providers: [UserService],
	exports: [UserService],
})
export class UserModule {}
