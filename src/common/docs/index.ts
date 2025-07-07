import { AdminDocs } from '@/common/docs/admin.docs';
import { AuthDocs } from '@/common/docs/auth.docs';
import { ChecklistsDocs } from '@/common/docs/checklists.docs';
import { GroupDocs } from '@/common/docs/group.docs';
import { LecturerDocs } from '@/common/docs/lecturer.docs';
import { MajorDocs } from '@/common/docs/major.docs';
import { MilestoneDocs } from '@/common/docs/milestone.docs';
import { RequestDocs } from '@/common/docs/request.docs';
import { ResponsibilityDocs } from '@/common/docs/responsibility.docs';
import { SemesterDocs } from '@/common/docs/semester.docs';
import { SkillSetDocs } from '@/common/docs/skill-set.docs';
import { StudentDocs } from '@/common/docs/student.docs';
import { SupervisionDocs } from '@/common/docs/supervision.docs';
import { ThesisDocs } from '@/common/docs/thesis.docs';

export {
	AdminDocs,
	AuthDocs,
	ChecklistsDocs,
	GroupDocs,
	LecturerDocs,
	MajorDocs,
	MilestoneDocs,
	RequestDocs,
	ResponsibilityDocs,
	SemesterDocs,
	SkillSetDocs,
	StudentDocs,
	SupervisionDocs,
	ThesisDocs,
};

export const DOCS_MAP = {
	admin: AdminDocs,
	auth: AuthDocs,
	checklists: ChecklistsDocs,
	group: GroupDocs,
	lecturer: LecturerDocs,
	major: MajorDocs,
	milestone: MilestoneDocs,
	request: RequestDocs,
	responsibility: ResponsibilityDocs,
	semester: SemesterDocs,
	skillSet: SkillSetDocs,
	student: StudentDocs,
	supervision: SupervisionDocs,
	thesis: ThesisDocs,
} as const;

export type DocsModules = keyof typeof DOCS_MAP;

// Export SwaggerDoc decorator
export { SwaggerDoc } from './swagger-docs.decorator';
