import { Module } from '@nestjs/common';

import { RequestStudentController } from '@/requests/controllers';
import { RequestStudentService } from '@/requests/services';
import { RequestService } from '@/requests/services/request.service';

@Module({
	controllers: [RequestStudentController],
	providers: [RequestService, RequestStudentService],
})
export class RequestModule {}
