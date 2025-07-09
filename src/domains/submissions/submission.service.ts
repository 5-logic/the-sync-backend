import { Injectable } from '@nestjs/common';

import { CreateSubmissionDto, UpdateSubmissionDto } from '@/submissions/dto';

@Injectable()
export class SubmissionService {
	create(createSubmissionDto: CreateSubmissionDto) {
		return `This action adds a new submission with data: ${JSON.stringify(createSubmissionDto)}`;
	}

	findAll() {
		return `This action returns all submission`;
	}

	findOne(id: number) {
		return `This action returns a #${id} submission`;
	}

	update(id: number, updateSubmissionDto: UpdateSubmissionDto) {
		return `This action updates a #${id} submission with data: ${JSON.stringify(updateSubmissionDto)}`;
	}

	remove(id: number) {
		return `This action removes a #${id} submission`;
	}
}
