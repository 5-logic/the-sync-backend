import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

import { PineconeProviderService, PrismaService } from '@/providers';
import { PINECONE_TOKENS } from '@/queue/pinecone/constants';
import { PineconeJobType } from '@/queue/pinecone/enums';

@Processor(PINECONE_TOKENS.STUDENT)
export class PineconeStudentProcessor extends WorkerHost {
	static readonly NAMESPACE = PINECONE_TOKENS.STUDENT + '-namespace';

	private readonly logger = new Logger(PineconeStudentProcessor.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly pinecone: PineconeProviderService,
	) {
		super();
	}

	async process(job: Job<string>): Promise<void> {
		try {
			switch (job.name as PineconeJobType) {
				case PineconeJobType.CREATE_OR_UPDATE: {
					await this.createOrUpdate(job.data);
					break;
				}
				case PineconeJobType.DELETE: {
					await this.delete(job.data);
					break;
				}

				default: {
					this.logger.warn(`Unknown job type: ${job.name}`);

					throw new Error(`Unknown job type: ${job.name}`);
				}
			}
		} catch (error) {
			this.logger.error(`Failed to process job ${job.id}:`, error);

			throw error;
		}
	}

	async createOrUpdate(id: string) {
		const student = await this.prisma.student.findUnique({
			where: { userId: id },
			include: {
				user: true,
				major: true,
				studentSkills: { include: { skill: true } },
				studentExpectedResponsibilities: { include: { responsibility: true } },
			},
		});

		if (!student) {
			this.logger.warn(`Student with ID ${id} not found.`);
			return;
		}

		// Prepare text for vectorization - skills and responsibilities
		const skillsText = student.studentSkills
			.map(
				(studentSkill) =>
					`${studentSkill.skill.name} (Level: ${studentSkill.level})`,
			)
			.join(', ');

		const responsibilitiesText = student.studentExpectedResponsibilities
			.map((responsibility) => responsibility.responsibility.name)
			.join(', ');

		const combinedText = `Skills: ${skillsText}. Expected Responsibilities: ${responsibilitiesText}`;

		// Generate embeddings for the combined text
		const embeddings = await this.pinecone.generateEmbeddings(combinedText);

		// Prepare metadata
		const metadata = {
			studentCode: student.studentCode,
			fullName: student.user.fullName,
			email: student.user.email,
			majorName: student.major.name,
			skillsCount: student.studentSkills.length,
			responsibilitiesCount: student.studentExpectedResponsibilities.length,
		};

		// Get Pinecone index
		const index = this.pinecone
			.getClient()
			.index(this.pinecone.getIndexName())
			.namespace(PineconeStudentProcessor.NAMESPACE);

		// Upsert to Pinecone
		await index.upsert([
			{
				id: student.userId,
				values: embeddings,
				metadata,
			},
		]);

		this.logger.log(
			`Student ${student.studentCode} upserted to Pinecone successfully.`,
		);
	}

	async delete(id: string) {
		const index = this.pinecone
			.getClient()
			.index(this.pinecone.getIndexName())
			.namespace(PineconeStudentProcessor.NAMESPACE);

		await index.deleteOne(id);

		this.logger.log(`Deleting student with ID: ${id} from Pinecone.`);
	}
}
