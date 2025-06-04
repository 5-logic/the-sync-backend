import { Injectable, Logger } from '@nestjs/common';

import { CreateGroupDto } from '@/groups/dto/create-group.dto';
import { UpdateGroupDto } from '@/groups/dto/update-group.dto';
import { PrismaService } from '@/providers/prisma.service';

@Injectable()
export class GroupService {
	private readonly logger = new Logger(GroupService.name);

	constructor(private readonly prisma: PrismaService) {}

	async create(createGroupDto: CreateGroupDto, leaderId: string) {
		try {
			const newGroup = await this.prisma.group.create({
				data: { ...createGroupDto, leaderId },
			});

			this.logger.log(`Group created with ID: ${newGroup.id}`);
			this.logger.debug(`Group`, newGroup);

			return newGroup;
		} catch (error) {
			this.logger.error('Error creating group', error);
			throw error;
		}
	}

	async findAll() {
		try {
			const groups = await this.prisma.group.findMany();

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
				this.logger.warn(`Group with ID ${id} not found`);
				return null;
			}

			this.logger.log(`Group found with ID: ${group.id}`);
			return group;
		} catch (error) {
			this.logger.error('Error fetching group', error);
			throw error;
		}
	}

	async update(id: string, updateGroupDto: UpdateGroupDto, leaderId: string) {
		try {
			const updatedGroup = await this.prisma.group.update({
				where: { id },
				data: { ...updateGroupDto, leaderId },
			});

			this.logger.log(`Group updated with ID: ${updatedGroup.id}`);
			this.logger.debug(`Updated Group`, updatedGroup);

			return updatedGroup;
		} catch (error) {
			this.logger.error('Error updating group', error);
			throw error;
		}
	}

	async remove(id: string) {
		try {
			const deletedGroup = await this.prisma.group.delete({
				where: { id },
			});

			this.logger.log(`Group deleted with ID: ${deletedGroup.id}`);
			return deletedGroup;
		} catch (error) {
			this.logger.error('Error deleting group', error);
			throw error;
		}
	}
}
