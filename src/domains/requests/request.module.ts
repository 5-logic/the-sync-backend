import { Module } from '@nestjs/common';

import { EmailModule } from '@/queue/email/email.module';
import { RequestController } from '@/requests/request.controller';

import { RequestService } from '~/src/domains/requests/request.service';

@Module({
	imports: [EmailModule],
	controllers: [RequestController],
	providers: [RequestService],
})
export class RequestModule {}
