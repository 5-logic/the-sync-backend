import { AdminDocs } from '@/common/docs/admin.docs';
import { AuthDocs } from '@/common/docs/auth.docs';
import { LecturerDocs } from '@/common/docs/lecturer.docs';
import { SemesterDocs } from '@/common/docs/semester.docs';
import { StudentDocs } from '@/common/docs/student.docs';

export { AdminDocs, AuthDocs, LecturerDocs, SemesterDocs, StudentDocs };

export const DOCS_MAP = {
	admin: AdminDocs,
	auth: AuthDocs,
	lecturer: LecturerDocs,
	semester: SemesterDocs,
	student: StudentDocs,
} as const;

export type DocsModules = keyof typeof DOCS_MAP;
