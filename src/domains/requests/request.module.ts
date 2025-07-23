import { Module } from '@nestjs/common';

import { EmailModule } from '@/queue/email/email.module';
import { RequestStudentController } from '@/requests/controllers';
import { RequestStudentService } from '@/requests/services';
import { RequestService } from '@/requests/services/request.service';

@Module({
	imports: [EmailModule],
	controllers: [RequestStudentController],
	providers: [RequestStudentService, RequestService],
})
export class RequestModule {}
