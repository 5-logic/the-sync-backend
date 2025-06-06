import { Module } from '@nestjs/common';

import { PrismaService } from '@/providers/prisma.service';
import { UserService } from '@/users/user.service';

@Module({
	providers: [UserService, PrismaService],
})
export class UserModule {}
