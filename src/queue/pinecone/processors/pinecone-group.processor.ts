import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

import { PineconeProviderService, PrismaService } from '@/providers';
import { PINECONE_TOKENS } from '@/queue/pinecone/constants';
import { PineconeJobType } from '@/queue/pinecone/enums';

@Processor(PINECONE_TOKENS.GROUP)
export class PineconeGroupProcessor extends WorkerHost {
	static readonly NAMESPACE = PINECONE_TOKENS.GROUP + '-namespace';

	private readonly logger = new Logger(PineconeGroupProcessor.name);

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
		const group = await this.prisma.group.findUnique({
			where: { id },
			include: {
				semester: true,
				thesis: true,
				groupRequiredSkills: { include: { skill: true } },
				groupExpectedResponsibilities: { include: { responsibility: true } },
				studentGroupParticipations: {
					include: {
						student: {
							include: {
								user: true,
								studentSkills: { include: { skill: true } },
								studentExpectedResponsibilities: {
									include: { responsibility: true },
								},
							},
						},
					},
				},
			},
		});

		if (!group) {
			this.logger.warn(`Group with ID ${id} not found.`);
			return;
		}

		// Prepare text for vectorization - group skills, responsibilities and member skills/responsibilities
		const groupSkillsText = group.groupRequiredSkills
			.map((groupSkill) => groupSkill.skill.name)
			.join(', ');

		const groupResponsibilitiesText = group.groupExpectedResponsibilities
			.map((responsibility) => responsibility.responsibility.name)
			.join(', ');

		// Combine all member skills and responsibilities
		const memberSkillsText = group.studentGroupParticipations
			.flatMap((participation) =>
				participation.student.studentSkills.map(
					(studentSkill) =>
						`${studentSkill.skill.name} (Level: ${studentSkill.level})`,
				),
			)
			.join(', ');

		const memberResponsibilitiesText = group.studentGroupParticipations
			.flatMap((participation) =>
				participation.student.studentExpectedResponsibilities.map(
					(responsibility) => responsibility.responsibility.name,
				),
			)
			.join(', ');

		const combinedText = `Group Required Skills: ${groupSkillsText}. Group Expected Responsibilities: ${groupResponsibilitiesText}. Member Skills: ${memberSkillsText}. Member Responsibilities: ${memberResponsibilitiesText}`;

		// Prepare record data - Pinecone will automatically generate embeddings from text
		const record = {
			_id: group.id,
			text: combinedText,
			code: group.code,
			name: group.name,
			projectDirection: group.projectDirection ?? 'null',
			semesterId: group.semesterId,
			thesisId: group.thesisId ?? 'null',
			groupRequiredSkillsCount: group.groupRequiredSkills.length,
			groupExpectedResponsibilitiesCount:
				group.groupExpectedResponsibilities.length,
			memberCount: group.studentGroupParticipations.length,
		};

		// Get Pinecone index
		const index = this.pinecone
			.getClient()
			.index(this.pinecone.getIndexName())
			.namespace(PineconeGroupProcessor.NAMESPACE);

		// Upsert to Pinecone using upsertRecords - Pinecone will auto-generate embeddings
		await index.upsertRecords([record]);

		this.logger.log(`Group ${group.code} upserted to Pinecone successfully.`);
	}

	async delete(id: string) {
		const index = this.pinecone
			.getClient()
			.index(this.pinecone.getIndexName())
			.namespace(PineconeGroupProcessor.NAMESPACE);

		await index.deleteOne(id);

		this.logger.log(`Deleting group with ID: ${id} from Pinecone.`);
	}
}
