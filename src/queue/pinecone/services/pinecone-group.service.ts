import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

import { PINECONE_TOKENS } from '@/queue/pinecone/constants';
import { PineconeJobType } from '@/queue/pinecone/enums';

@Injectable()
export class PineconeGroupService {
	private static readonly BACKOFF_TYPE = 'exponential';
	private static readonly BACKOFF_DELAY = 2000;

	constructor(
		@InjectQueue(PINECONE_TOKENS.GROUP)
		private readonly queue: Queue<string>,
	) {}

	async processGroup(type: PineconeJobType, dto: string, delay?: number) {
		return await this.queue.add(type, dto, {
			delay: delay ?? 0,
			attempts: 3,
			backoff: {
				type: PineconeGroupService.BACKOFF_TYPE,
				delay: PineconeGroupService.BACKOFF_DELAY,
			},
		});
	}
}
