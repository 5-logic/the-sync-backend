import { Injectable, Logger } from '@nestjs/common';

import { CreateGroupDto } from '@/groups/dto/create-group.dto';
import { UpdateGroupDto } from '@/groups/dto/update-group.dto';
import { PrismaService } from '@/providers/prisma.service';

@Injectable()
export class GroupService {
	private readonly logger = new Logger(GroupService.name);

	constructor(private readonly prisma: PrismaService) {}

	async create(createGroupDto: CreateGroupDto, leaderId: string): Promise<any> {
		try {
			const newGroup = await this.prisma.group.create({
				data: { ...createGroupDto, leaderId },
				include: {
					lecturers: { select: { userId: true } },
					trackingDetails: { select: { id: true } },
				},
			});

			this.logger.log(`Group created with ID: ${newGroup.id}`);
			this.logger.debug(`Group`, newGroup);

			return {
				...newGroup,
				lecturers: newGroup.lecturers?.map((l) => l.userId) ?? [],
				trackingDetails: newGroup.trackingDetails?.map((td) => td.id) ?? [],
			};
		} catch (error) {
			this.logger.error('Error creating group', error);
			throw error;
		}
	}

	async findAll(): Promise<any> {
		try {
			const groups = await this.prisma.group.findMany({
				include: {
					lecturers: { select: { userId: true } },
					trackingDetails: { select: { id: true } },
				},
			});

			this.logger.log(`Found ${groups.length} groups`);

			return {
				groups: groups.map((g) => ({
					...g,
					lecturers: g.lecturers?.map((l) => l.userId) ?? [],
					trackingDetails: g.trackingDetails?.map((td) => td.id) ?? [],
				})),
			};
		} catch (error) {
			this.logger.error('Error fetching groups', error);
			throw error;
		}
	}

	async findOne(id: string): Promise<any> {
		try {
			const group = await this.prisma.group.findUnique({
				where: { id },
				include: {
					lecturers: { select: { userId: true } },
					trackingDetails: { select: { id: true } },
				},
			});

			if (!group) {
				this.logger.warn(`Group with ID ${id} not found`);
				return null;
			}

			this.logger.log(`Group found with ID: ${group.id}`);
			return {
				...group,
				lecturers: group.lecturers?.map((l) => l.userId) ?? [],
				trackingDetails: group.trackingDetails?.map((td) => td.id) ?? [],
			};
		} catch (error) {
			this.logger.error('Error fetching group', error);
			throw error;
		}
	}

	async update(
		id: string,
		updateGroupDto: UpdateGroupDto,
		leaderId: string,
	): Promise<any> {
		try {
			const updatedGroup = await this.prisma.group.update({
				where: { id },
				data: { ...updateGroupDto, leaderId },
				include: {
					lecturers: { select: { userId: true } },
					trackingDetails: { select: { id: true } },
				},
			});

			this.logger.log(`Group updated with ID: ${updatedGroup.id}`);
			this.logger.debug(`Updated Group`, updatedGroup);

			return {
				...updatedGroup,
				lecturers: updatedGroup.lecturers?.map((l) => l.userId) ?? [],
				trackingDetails: updatedGroup.trackingDetails?.map((td) => td.id) ?? [],
			};
		} catch (error) {
			this.logger.error('Error updating group', error);
			throw error;
		}
	}

	async remove(id: string): Promise<any> {
		try {
			const deletedGroup = await this.prisma.group.delete({
				where: { id },
			});

			this.logger.log(`Group deleted with ID: ${deletedGroup.id}`);
			return {
				status: 'success',
				message: `Group with ID ${deletedGroup.id} deleted successfully`,
			};
		} catch (error) {
			this.logger.error('Error deleting group', error);
			throw error;
		}
	}
}
