import { Module } from '@nestjs/common';

import { RequestService } from '@/domains/requests/request.service';
import { EmailModule } from '@/queue/email/email.module';
import { RequestController } from '@/requests/request.controller';

@Module({
	imports: [EmailModule],
	controllers: [RequestController],
	providers: [RequestService],
})
export class RequestModule {}
