import { CreateSubmissionDto } from './create-submission.dto';

export interface CreateSubmissionServiceDto extends CreateSubmissionDto {
	groupId: string;
	milestoneId: string;
}

export interface UpdateSubmissionServiceDto {
	documents?: string[];
}
