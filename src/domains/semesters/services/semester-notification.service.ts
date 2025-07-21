import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SemesterNotificationService {
	private readonly logger = new Logger(SemesterNotificationService.name);
}
