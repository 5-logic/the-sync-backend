import {
	ConflictException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';

import { CreateGroupDto, UpdateGroupDto } from '@/groups/dto';
import { PrismaService } from '@/providers/prisma/prisma.service';

import { SemesterStatus } from '~/generated/prisma';

@Injectable()
export class GroupService {
	private readonly logger = new Logger(GroupService.name);

	constructor(private readonly prisma: PrismaService) {}

	private async validateStudentIsLeader(userId: string, groupId: string) {
		const participation = await this.prisma.studentGroupParticipation.findFirst(
			{
				where: {
					studentId: userId,
					groupId: groupId,
				},
			},
		);

		if (!participation) {
			throw new NotFoundException(
				`Student is not a member of group ${groupId}`,
			);
		}

		if (!participation.isLeader) {
			throw new ConflictException(
				`Only group leader can update group information`,
			);
		}
	}

	private async validateStudentEnrollment(userId: string, semesterId: string) {
		const enrollment = await this.prisma.enrollment.findUnique({
			where: {
				studentId_semesterId: {
					studentId: userId,
					semesterId: semesterId,
				},
			},
		});

		if (!enrollment) {
			throw new NotFoundException(
				`Student is not enrolled in semester ${semesterId}`,
			);
		}
	}

	private async validateSemester(semesterId: string) {
		const semester = await this.prisma.semester.findUnique({
			where: { id: semesterId },
		});

		if (!semester) {
			throw new NotFoundException(`Semester with ID ${semesterId} not found`);
		}

		if (semester.status !== SemesterStatus.Picking) {
			throw new ConflictException(
				`Cannot create/update group. Semester status must be ${SemesterStatus.Picking}, current status is ${semester.status}`,
			);
		}
	}

	async create(userId: string, dto: CreateGroupDto) {
		try {
			await this.validateSemester(dto.semesterId);

			// Validate that the user is a student enrolled in the semester
			await this.validateStudentEnrollment(userId, dto.semesterId);

			const existingGroup = await this.prisma.group.findUnique({
				where: { code: dto.code },
			});

			if (existingGroup) {
				throw new ConflictException(
					`Group with code ${dto.code} already exists`,
				);
			}

			// Create group and add student as leader in a transaction
			const result = await this.prisma.$transaction(async (prisma) => {
				// Create the group
				const group = await prisma.group.create({
					data: {
						code: dto.code,
						name: dto.name,
						projectDirection: dto.projectDirection,
						semesterId: dto.semesterId,
					},
				});

				// Add the student to the group as leader
				await prisma.studentGroupParticipation.create({
					data: {
						studentId: userId,
						groupId: group.id,
						semesterId: dto.semesterId,
						isLeader: true,
					},
				});

				return group;
			});

			this.logger.log(
				`Group "${result.name}" created with ID: ${result.id} by student ${userId}`,
			);

			return result;
		} catch (error) {
			this.logger.error('Error creating group', error);

			throw error;
		}
	}

	async findAll() {
		try {
			const groups = await this.prisma.group.findMany({
				orderBy: { createdAt: 'desc' },
			});

			this.logger.log(`Found ${groups.length} groups`);

			return groups;
		} catch (error) {
			this.logger.error('Error fetching groups', error);

			throw error;
		}
	}

	async findOne(id: string) {
		try {
			const group = await this.prisma.group.findUnique({
				where: { id },
			});

			if (!group) {
				throw new NotFoundException(`Group with id ${id} not found`);
			}

			this.logger.log(`Group found with ID: ${group.id}`);

			return group;
		} catch (error) {
			this.logger.error('Error fetching group', error);

			throw error;
		}
	}

	async update(id: string, userId: string, dto: UpdateGroupDto) {
		try {
			this.logger.log(`Updating group with ID: ${id}`);

			const existingGroup = await this.prisma.group.findUnique({
				where: { id },
			});

			if (!existingGroup) {
				throw new NotFoundException(`Group with ID ${id} not found`);
			}

			// Check if user is the leader of the group
			await this.validateStudentIsLeader(userId, id);

			// Validate semester status for update
			await this.validateSemester(existingGroup.semesterId);

			const group = await this.prisma.group.update({
				where: { id },
				data: dto,
			});

			this.logger.log(`Group updated with ID: ${group.id}`);

			return group;
		} catch (error) {
			this.logger.error('Error updating group', error);

			throw error;
		}
	}
}
