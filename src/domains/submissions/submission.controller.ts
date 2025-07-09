import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Patch,
	Post,
} from '@nestjs/common';

import { CreateSubmissionDto, UpdateSubmissionDto } from '@/submissions/dto';
import { SubmissionService } from '@/submissions/submission.service';

@Controller('submission')
export class SubmissionController {
	constructor(private readonly submissionService: SubmissionService) {}

	@Post()
	create(@Body() createSubmissionDto: CreateSubmissionDto) {
		return this.submissionService.create(createSubmissionDto);
	}

	@Get()
	findAll() {
		return this.submissionService.findAll();
	}

	@Get(':id')
	findOne(@Param('id') id: string) {
		return this.submissionService.findOne(+id);
	}

	@Patch(':id')
	update(
		@Param('id') id: string,
		@Body() updateSubmissionDto: UpdateSubmissionDto,
	) {
		return this.submissionService.update(+id, updateSubmissionDto);
	}

	@Delete(':id')
	remove(@Param('id') id: string) {
		return this.submissionService.remove(+id);
	}
}
