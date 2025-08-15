import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

import { PINECONE_TOKENS } from '@/queue/pinecone/constants';
import { PineconeJobType } from '@/queue/pinecone/enums';
import { ThesisDetailResponse } from '@/theses/responses';

@Injectable()
export class PineconeThesisService {
	private static readonly BACKOFF_TYPE = 'exponential';
	private static readonly BACKOFF_DELAY = 2000;

	constructor(
		@InjectQueue(PINECONE_TOKENS.THESIS)
		private readonly queue: Queue<
			| ThesisDetailResponse
			| string
			| { id: string; metadata: Record<string, any> }
		>,
	) {}

	async processThesis(
		type: PineconeJobType,
		dto: ThesisDetailResponse | string,
		delay?: number,
	) {
		return await this.queue.add(type, dto, {
			delay: delay ?? 0,
			attempts: 3,
			backoff: {
				type: PineconeThesisService.BACKOFF_TYPE,
				delay: PineconeThesisService.BACKOFF_DELAY,
			},
		});
	}

	async processThesisMetadata(
		thesisId: string,
		metadata: Record<string, any>,
		delay?: number,
	) {
		return await this.queue.add(
			PineconeJobType.UPDATE_METADATA,
			{ id: thesisId, metadata },
			{
				delay: delay ?? 0,
				attempts: 3,
				backoff: {
					type: PineconeThesisService.BACKOFF_TYPE,
					delay: PineconeThesisService.BACKOFF_DELAY,
				},
			},
		);
	}

	async processDuplicateCheck(thesisId: string, delay?: number) {
		return await this.queue.add(PineconeJobType.CHECK_DUPLICATE, thesisId, {
			delay: delay ?? 0,
			attempts: 3,
			backoff: {
				type: PineconeThesisService.BACKOFF_TYPE,
				delay: PineconeThesisService.BACKOFF_DELAY,
			},
		});
	}
}
