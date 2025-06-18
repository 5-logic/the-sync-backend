import {
	ConflictException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';

import { CreateGroupDto } from '@/groups/dto/create-group.dto';
import { UpdateGroupDto } from '@/groups/dto/update-group.dto';
import { PrismaService } from '@/providers/prisma/prisma.service';

@Injectable()
export class GroupService {
	private readonly logger = new Logger(GroupService.name);

	constructor(private readonly prisma: PrismaService) {}

	private async validateSemester(semesterId: string) {
		const semester = await this.prisma.semester.findUnique({
			where: { id: semesterId },
		});
		if (!semester) {
			throw new NotFoundException(`Semester with id ${semesterId} not found`);
		}
	}

	private async validateThesis(thesisId: string) {
		const thesis = await this.prisma.thesis.findUnique({
			where: { id: thesisId },
		});
		if (!thesis) {
			throw new NotFoundException(`Thesis with id ${thesisId} not found`);
		}
	}

	async create(createGroupDto: CreateGroupDto) {
		try {
			await this.validateSemester(createGroupDto.semesterId);

			const existingGroup = await this.prisma.group.findUnique({
				where: { code: createGroupDto.code },
			});
			if (existingGroup) {
				throw new ConflictException(
					`Group with code ${createGroupDto.code} already exists`,
				);
			}

			if (createGroupDto.thesisId) {
				await this.validateThesis(createGroupDto.thesisId);
			}

			const group = await this.prisma.group.create({
				data: createGroupDto,
			});

			this.logger.log(`Group "${group.name}" created with id: ${group.id}`);
			return group;
		} catch (error) {
			this.logger.error('Error creating group', error);
			throw error;
		}
	}

	async findAll() {
		try {
			const groups = await this.prisma.group.findMany({
				include: {
					semester: true,
					thesis: true,
					studentGroupParticipations: {
						include: {
							student: {
								include: {
									user: true,
								},
							},
						},
					},
				},
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
				include: {
					semester: true,
					thesis: true,
					studentGroupParticipations: {
						include: {
							student: {
								include: {
									user: true,
								},
							},
						},
					},
				},
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

	async update(id: string, updateGroupDto: UpdateGroupDto) {
		try {
			this.logger.log(`Updating group with id: ${id}`);

			const existingGroup = await this.prisma.group.findUnique({
				where: { id },
			});
			if (!existingGroup) {
				throw new NotFoundException(`Group with id ${id} not found`);
			}

			if (updateGroupDto.semesterId) {
				await this.validateSemester(updateGroupDto.semesterId);
			}
			if (updateGroupDto.thesisId) {
				await this.validateThesis(updateGroupDto.thesisId);
			}

			const group = await this.prisma.group.update({
				where: { id },
				data: updateGroupDto,
			});

			this.logger.log(`Group updated with ID: ${group.id}`);
			return group;
		} catch (error) {
			this.logger.error('Error updating group', error);
			throw error;
		}
	}
}
