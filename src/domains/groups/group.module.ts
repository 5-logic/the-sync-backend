import { Module } from '@nestjs/common';

import { GroupController } from '@/groups/group.controller';
import { GroupService } from '@/groups/group.service';
import { PrismaService } from '@/providers/prisma/prisma.service';

@Module({
	controllers: [GroupController],
	providers: [GroupService, PrismaService],
})
export class GroupModule {}
