import { MilestoneResponse } from '@/milestones/responses';

import { Milestone } from '~/generated/prisma';

export const mapMilestone = (milestone: Milestone): MilestoneResponse => ({
	id: milestone.id,
	name: milestone.name,
	startDate: milestone.startDate.toISOString(),
	endDate: milestone.endDate.toISOString(),
	semesterId: milestone.semesterId,
	note: milestone.note || '', // Ensure note is always a string
	documents: milestone.documents,
	createdAt: milestone.createdAt.toISOString(),
	updatedAt: milestone.updatedAt.toISOString(),
});
