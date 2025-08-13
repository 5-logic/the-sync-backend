import {
	ConflictException,
	ForbiddenException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';

@Injectable()
export class ThesisApplicationService {
	private readonly logger = new Logger(ThesisApplicationService.name);

	public getApplicationInclude() {
		return {
			group: {
				include: {
					studentGroupParticipations: {
						include: {
							student: {
								include: {
									user: {
										omit: { password: true },
									},
								},
							},
						},
					},
				},
			},
			thesis: {
				include: {
					lecturer: {
						include: {
							user: {
								omit: { password: true },
							},
						},
					},
				},
			},
		};
	}

	public validateSemesterStatus(semester: any, semesterId: string) {
		if (!semester) {
			this.logger.warn(`Semester with ID ${semesterId} not found`);
			throw new NotFoundException('Semester not found');
		}

		if (semester.status !== 'Picking') {
			this.logger.warn(
				`Semester ${semesterId} is not in Picking phase. Current status: ${semester.status}`,
			);
			throw new ConflictException(
				'Thesis applications can only be submitted during the Picking phase',
			);
		}
	}

	public validateStudent(student: any, userId: string, semesterId: string) {
		if (!student) {
			this.logger.warn(`Student with ID ${userId} not found`);
			throw new NotFoundException('Student not found');
		}

		if (student.enrollments.length === 0) {
			this.logger.warn(
				`Student with ID ${userId} is not enrolled in semester ${semesterId} with NotYet status`,
			);
			throw new ForbiddenException(
				'You must be enrolled in this semester with NotYet status to apply for thesis',
			);
		}
	}

	public validateThesis(thesis: any, thesisId: string, semesterId: string) {
		if (!thesis) {
			this.logger.warn(`Thesis with ID ${thesisId} not found`);
			throw new NotFoundException('Thesis not found');
		}

		if (thesis.status !== 'Approved') {
			this.logger.warn(
				`Thesis ${thesisId} is not approved for application. Current status: ${thesis.status}`,
			);
			throw new ConflictException('Only approved theses can be applied for');
		}

		if (!thesis.isPublish) {
			this.logger.warn(`Thesis ${thesisId} is not published`);
			throw new ConflictException('Only published theses can be applied for');
		}

		if (thesis.semesterId !== semesterId) {
			this.logger.warn(
				`Thesis ${thesisId} is not in the target semester ${semesterId}`,
			);
			throw new ConflictException(
				'Thesis must be in the same semester as the application',
			);
		}

		if (thesis.groupId) {
			this.logger.warn(
				`Thesis ${thesisId} is already assigned to group ${thesis.groupId}`,
			);
			throw new ConflictException(
				'This thesis is already assigned to another group',
			);
		}
	}
}
