import { AdminDocs } from '@/common/docs/admin.docs';
import { AuthDocs } from '@/common/docs/auth.docs';
import { ChecklistItemDocs } from '@/common/docs/checklist-item.docs';
import { ChecklistDocs } from '@/common/docs/checklist.docs';
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
	ChecklistItemDocs,
	ChecklistDocs,
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
	checklistItem: ChecklistItemDocs,
	checklist: ChecklistDocs,
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

export { SwaggerDoc } from '@/common/docs/swagger-docs.decorator';
