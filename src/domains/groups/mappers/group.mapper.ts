import { GroupResponse } from '@/groups/responses';

import {
	Group,
	Semester,
	Student,
	StudentGroupParticipation,
	User,
} from '~/generated/prisma';

type GroupData = Group & {
	semester: Semester;
	_count: {
		studentGroupParticipations: number;
	};
	studentGroupParticipations: (StudentGroupParticipation & {
		student: Student & { user: User };
	})[];
};

export const mapGroup = (group: GroupData): GroupResponse => ({
	id: group.id,
	code: group.code,
	name: group.name,
	projectDirection: group.projectDirection ?? undefined,
	semesterId: group.semesterId,
	thesisId: group.thesisId ?? undefined,
	semester: {
		id: group.semester.id,
		name: group.semester.name,
		code: group.semester.code,
		status: group.semester.status.toString(),
	},
	memberCount: group._count.studentGroupParticipations,
	leader: {
		id: group.studentGroupParticipations[0].studentId,
		fullName: group.studentGroupParticipations[0].student.user.fullName,
		studentCode: group.studentGroupParticipations[0].student.studentCode,
	},
	createdAt: group.createdAt.toISOString(),
	updatedAt: group.updatedAt.toISOString(),
});
