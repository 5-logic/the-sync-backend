import { Module } from '@nestjs/common';

import { EmailModule } from '@/queue/email/email.module';
import { RequestsController } from '@/requests/requests.controller';
import { RequestsService } from '@/requests/requests.service';

@Module({
	imports: [EmailModule],
	controllers: [RequestsController],
	providers: [RequestsService],
})
export class RequestsModule {}
