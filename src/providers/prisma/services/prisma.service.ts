import {
	Injectable,
	Logger,
	OnModuleDestroy,
	OnModuleInit,
} from '@nestjs/common';

import { PrismaClient } from '~/generated/prisma';

@Injectable()
export class PrismaService
	extends PrismaClient
	implements OnModuleInit, OnModuleDestroy
{
	private readonly logger = new Logger(PrismaService.name);

	async onModuleInit(): Promise<void> {
		this.logger.log('Connecting to the database...');

		await this.$connect();

		this.logger.log('Database connected successfully');
	}

	async onModuleDestroy(): Promise<void> {
		this.logger.log('Disconnecting from the database...');

		await this.$disconnect();

		this.logger.log('Database disconnected successfully');
	}
}
