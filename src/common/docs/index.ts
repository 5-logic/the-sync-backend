// Tự động import tất cả docs
import { AdminDocs } from '@/common/docs/admin.docs';
import { AuthDocs } from '@/common/docs/auth.docs';
import { GroupDocs } from '@/common/docs/group.docs';
import { LecturerDocs } from '@/common/docs/lecturer.docs';
import { MajorDocs } from '@/common/docs/major.docs';
import { MilestoneDocs } from '@/common/docs/milestone.docs';
import { ResponsibilityDocs } from '@/common/docs/responsibility.docs';
import { SemesterDocs } from '@/common/docs/semester.docs';
import { SkillSetDocs } from '@/common/docs/skill-set.docs';
import { StudentDocs } from '@/common/docs/student.docs';

export {
	AdminDocs,
	AuthDocs,
	GroupDocs,
	LecturerDocs,
	MajorDocs,
	MilestoneDocs,
	ResponsibilityDocs,
	SemesterDocs,
	SkillSetDocs,
	StudentDocs,
};

export const DOCS_MAP = {
	admin: AdminDocs,
	auth: AuthDocs,
	group: GroupDocs,
	lecturer: LecturerDocs,
	major: MajorDocs,
	milestone: MilestoneDocs,
	responsibility: ResponsibilityDocs,
	semester: SemesterDocs,
	skillSet: SkillSetDocs,
	student: StudentDocs,
} as const;

export type DocsModules = keyof typeof DOCS_MAP;
