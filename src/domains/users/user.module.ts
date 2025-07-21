import { Module } from '@nestjs/common';

import { UserService } from '@/users/services';

@Module({
	providers: [UserService],
	exports: [UserService],
})
export class UserModule {}
