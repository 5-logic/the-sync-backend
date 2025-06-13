import { Module } from '@nestjs/common';

import { PrismaService } from '@/providers/prisma/prisma.service';
import { UserService } from '@/users/user.service';

@Module({
	providers: [UserService, PrismaService],
	exports: [UserService],
})
export class UserModule {}
