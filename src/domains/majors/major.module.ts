import { Module } from '@nestjs/common';

import { MajorController } from '@/majors/controllers';
import { MajorService } from '@/majors/services';

@Module({
	controllers: [MajorController],
	providers: [MajorService],
})
export class MajorModule {}
