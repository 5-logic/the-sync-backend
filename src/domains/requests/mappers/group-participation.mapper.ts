import { StudentGroupParticipationResponse } from '@/requests/responses';

import { StudentGroupParticipation } from '~/generated/prisma';

export const mapStudentGroupParticipationResponse = (
	groupParticipation: StudentGroupParticipation,
): StudentGroupParticipationResponse => ({
	studentId: groupParticipation.studentId,
	groupId: groupParticipation.groupId,
	semesterId: groupParticipation.semesterId,
	isLeader: groupParticipation.isLeader,
});
