import { Module } from '@nestjs/common';

import { MajorController } from '@/majors/major.controller';
import { MajorService } from '@/majors/major.service';

@Module({
	controllers: [MajorController],
	providers: [MajorService],
})
export class MajorModule {}
