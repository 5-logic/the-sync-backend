import {
	ConflictException,
	ForbiddenException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';

import { CONSTANTS } from '@/configs';
import { PrismaService } from '@/providers';
import {
	CreateInviteRequestDto,
	CreateJoinRequestDto,
	UpdateRequestStatusDto,
} from '@/requests/dtos';
import { mapRequest } from '@/requests/mappers';
import { RequestResponse } from '@/requests/responses';
import { RequestService } from '@/requests/services/request.service';

import { RequestStatus, RequestType } from '~/generated/prisma';

@Injectable()
export class RequestStudentService {
	private readonly logger = new Logger(RequestStudentService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly requestService: RequestService,
	) {}

	async createJoinRequest(
		userId: string,
		dto: CreateJoinRequestDto,
	): Promise<RequestResponse> {
		this.logger.log(
			`Creating join request for user: ${userId} to group: ${dto.groupId}`,
		);

		try {
			const group = await this.prisma.group.findUnique({
				where: { id: dto.groupId },
				include: { semester: true },
			});

			if (!group) {
				throw new NotFoundException(`Group not found`);
			}

			await this.requestService.validateSemesterStatus(group.semesterId);

			await this.requestService.validateStudentEnrollment(
				userId,
				group.semesterId,
			);

			await this.requestService.validateStudentNotInGroup(
				userId,
				group.semesterId,
			);

			await this.requestService.validateNoPendingJoinRequest(userId);

			await this.requestService.validateGroupCapacity(dto.groupId);

			const request = await this.prisma.request.create({
				data: {
					type: RequestType.Join,
					status: RequestStatus.Pending,
					studentId: userId,
					groupId: dto.groupId,
				},
				include: {
					student: {
						include: {
							user: {
								select: {
									id: true,
									fullName: true,
									email: true,
								},
							},
						},
					},
				},
			});

			this.logger.log(
				`Student ${userId} sent join request to group ${group.code}`,
			);

			const groupLeader = await this.prisma.studentGroupParticipation.findFirst(
				{
					where: {
						groupId: dto.groupId,
						isLeader: true,
					},
					include: {
						student: {
							include: {
								user: true,
							},
						},
					},
				},
			);

			if (!groupLeader) {
				this.logger.error(`Group leader not found for group ${dto.groupId}`);

				throw new NotFoundException(`Group leader not found`);
			}

			await this.requestService.sendJoinRequestNotification(
				{
					fullName: groupLeader.student.user.fullName,
					email: groupLeader.student.user.email,
				},
				{
					fullName: request.student.user.fullName,
					email: request.student.user.email,
				},
				{
					code: group.code,
					name: group.name,
					semester: { name: group.semester.name },
				},
			);

			const result: RequestResponse = mapRequest(request);

			return result;
		} catch (error) {
			this.logger.error('Error creating join request', error);

			throw error;
		}
	}

	async createInviteRequest(
		userId: string,
		groupId: string,
		dto: CreateInviteRequestDto,
	): Promise<RequestResponse[]> {
		this.logger.log(
			`Creating invite requests for group: ${groupId} by user: ${userId}`,
		);

		try {
			const group = await this.prisma.group.findUnique({
				where: { id: groupId },
				include: { semester: true },
			});

			if (!group) {
				throw new NotFoundException(`Group not found`);
			}

			await this.requestService.validateSemesterStatus(group.semesterId);

			await this.requestService.validateStudentIsGroupLeader(userId, groupId);

			const currentMemberCount =
				await this.prisma.studentGroupParticipation.count({
					where: { groupId: groupId },
				});

			if (currentMemberCount + dto.studentIds.length > 5) {
				throw new ConflictException(
					`Cannot invite ${dto.studentIds.length} students. Group capacity would be exceeded. Current members: ${currentMemberCount}, Maximum: 5`,
				);
			}

			for (const studentId of dto.studentIds) {
				await this.requestService.validateStudentEnrollment(
					studentId,
					group.semesterId,
				);

				await this.requestService.validateStudentNotInGroup(
					studentId,
					group.semesterId,
				);

				await this.requestService.validateNoPendingInviteRequest(
					studentId,
					groupId,
				);
			}

			const requests = await this.prisma.$transaction(
				async (txn) => {
					const createdRequests: any[] = [];
					for (const studentId of dto.studentIds) {
						const request = await txn.request.create({
							data: {
								type: RequestType.Invite,
								status: RequestStatus.Pending,
								studentId: studentId,
								groupId: groupId,
							},
							include: {
								student: {
									include: {
										user: {
											select: {
												id: true,
												fullName: true,
												email: true,
											},
										},
									},
								},
							},
						});
						createdRequests.push(request);
					}
					return createdRequests;
				},
				{ timeout: CONSTANTS.TIMEOUT },
			);

			this.logger.log(
				`Group ${group.code} sent invite requests to ${dto.studentIds.length} students: ${dto.studentIds.join(', ')}`,
			);

			const groupLeader = await this.prisma.studentGroupParticipation.findFirst(
				{
					where: {
						groupId: groupId,
						isLeader: true,
					},
					include: {
						student: {
							include: {
								user: true,
							},
						},
					},
				},
			);

			if (!groupLeader) {
				this.logger.error(`Group leader not found for group ${groupId}`);

				throw new NotFoundException(`Group leader not found`);
			}

			await Promise.allSettled(
				requests.map((request) =>
					this.requestService.sendInviteRequestNotification(
						{
							fullName: groupLeader.student.user.fullName,
							email: groupLeader.student.user.email,
						},
						{
							fullName: request.student.user.fullName,
							email: request.student.user.email,
						},
						{
							code: group.code,
							name: group.name,
							semester: { name: group.semester.name },
						},
					),
				),
			);

			const result: RequestResponse[] = requests.map(mapRequest);

			return result;
		} catch (error) {
			this.logger.error('Error creating invite requests', error);

			throw error;
		}
	}

	async getStudentRequests(userId: string) {
		try {
			const requests = await this.prisma.request.findMany({
				where: {
					studentId: userId,
				},
				include: {
					student: {
						include: {
							user: {
								select: {
									id: true,
									fullName: true,
									email: true,
								},
							},
						},
					},
					group: {
						select: {
							id: true,
							code: true,
							name: true,
							semester: {
								select: {
									id: true,
									name: true,
									code: true,
								},
							},
						},
					},
				},
				orderBy: { createdAt: 'desc' },
			});

			this.logger.log(
				`Found ${requests.length} requests for student ${userId}`,
			);
			return requests;
		} catch (error) {
			this.logger.error('Error fetching student requests', error);

			throw error;
		}
	}

	async getGroupRequests(userId: string, groupId: string) {
		try {
			this.logger.log(`Fetching requests for group: ${groupId}`);

			await this.requestService.validateStudentIsGroupLeader(userId, groupId);

			const requests = await this.prisma.request.findMany({
				where: {
					groupId: groupId,
				},
				include: {
					student: {
						include: {
							user: {
								select: {
									id: true,
									fullName: true,
									email: true,
								},
							},
						},
					},
					group: {
						select: {
							id: true,
							code: true,
							name: true,
						},
					},
				},
				orderBy: { createdAt: 'desc' },
			});

			this.logger.log(`Found ${requests.length} requests for group ${groupId}`);
			return requests;
		} catch (error) {
			this.logger.error('Error fetching group requests', error);

			throw error;
		}
	}

	async findOne(userId: string, requestId: string) {
		try {
			this.logger.log(`Fetching request: ${requestId} for user: ${userId}`);

			const request = await this.prisma.request.findUnique({
				where: { id: requestId },
				include: {
					student: {
						include: {
							user: {
								select: {
									id: true,
									fullName: true,
									email: true,
								},
							},
						},
					},
					group: {
						select: {
							id: true,
							code: true,
							name: true,
							semester: {
								select: {
									id: true,
									name: true,
									code: true,
								},
							},
						},
					},
				},
			});

			if (!request) {
				throw new NotFoundException(`Request not found`);
			}

			const isStudent = request.studentId === userId;
			const isGroupLeader = await this.prisma.studentGroupParticipation
				.findFirst({
					where: {
						studentId: userId,
						groupId: request.groupId,
						isLeader: true,
					},
				})
				.then((participation) => !!participation);

			if (!isStudent && !isGroupLeader) {
				throw new ForbiddenException(
					`You don't have permission to view this request`,
				);
			}

			this.logger.log(`Request found with ID: ${requestId}`);
			return request;
		} catch (error) {
			this.logger.error('Error fetching request', error);

			throw error;
		}
	}

	async updateRequestStatus(
		userId: string,
		requestId: string,
		dto: UpdateRequestStatusDto,
	): Promise<RequestResponse> {
		this.logger.log(
			`Updating request status for request: ${requestId} by user: ${userId}`,
		);

		try {
			const request = await this.prisma.request.findUnique({
				where: { id: requestId },
				include: {
					student: true,
					group: {
						include: {
							semester: true,
						},
					},
				},
			});

			if (!request) {
				throw new NotFoundException(`Request not found`);
			}

			if (request.status !== RequestStatus.Pending) {
				throw new ConflictException(
					`Request has already been ${request.status.toLowerCase()}`,
				);
			}

			await this.requestService.validateUpdatePermissions(
				userId,
				request,
				dto.status,
			);

			if (dto.status === RequestStatus.Approved) {
				await this.requestService.validateRequestApproval(request);
			}

			const result = await this.prisma.$transaction(async (prisma) => {
				const updatedRequest = await prisma.request.update({
					where: { id: requestId },
					data: { status: dto.status },
					include: {
						student: {
							include: {
								user: {
									select: {
										id: true,
										fullName: true,
										email: true,
									},
								},
							},
						},
						group: {
							select: {
								id: true,
								code: true,
								name: true,
							},
						},
					},
				});

				if (dto.status === RequestStatus.Approved) {
					await prisma.studentGroupParticipation.create({
						data: {
							studentId: request.studentId,
							groupId: request.groupId,
							semesterId: request.group.semesterId,
							isLeader: false,
						},
					});

					await prisma.request.updateMany({
						where: {
							studentId: request.studentId,
							status: RequestStatus.Pending,
							id: { not: requestId },
						},
						data: { status: RequestStatus.Rejected },
					});
				}

				const result: RequestResponse = mapRequest(updatedRequest);

				return result;
			});

			this.logger.log(
				`Request ${requestId} ${dto.status.toLowerCase()} by user ${userId}`,
			);

			await this.requestService.sendRequestStatusUpdateNotification(
				requestId,
				dto.status,
			);

			return result;
		} catch (error) {
			this.logger.error('Error updating request status', error);

			throw error;
		}
	}

	async cancelRequest(
		userId: string,
		requestId: string,
	): Promise<RequestResponse> {
		this.logger.log(`Cancelling request: ${requestId} by user: ${userId}`);

		try {
			const request = await this.prisma.request.findUnique({
				where: { id: requestId },
			});

			if (!request) {
				throw new NotFoundException(`Request not found`);
			}

			if (request.studentId !== userId) {
				throw new ForbiddenException(
					`Only the student who sent the request can cancel it`,
				);
			}

			if (request.status !== RequestStatus.Pending) {
				throw new ConflictException(
					`Cannot cancel a request that is not pending`,
				);
			}

			const cancelledRequest = await this.prisma.request.update({
				where: { id: requestId },
				data: { status: RequestStatus.Cancelled },
				include: {
					student: {
						include: {
							user: {
								select: {
									id: true,
									fullName: true,
									email: true,
								},
							},
						},
					},
					group: {
						select: {
							id: true,
							code: true,
							name: true,
						},
					},
				},
			});

			this.logger.log(`Request ${requestId} cancelled by student ${userId}`);

			const result: RequestResponse = mapRequest(cancelledRequest);

			return result;
		} catch (error) {
			this.logger.error('Error cancelling request', error);

			throw error;
		}
	}
}
