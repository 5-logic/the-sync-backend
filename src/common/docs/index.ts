// Tự động import tất cả docs
import { AdminDocs } from '@/common/docs/admin.docs';
import { AuthDocs } from '@/common/docs/auth.docs';

export { AdminDocs, AuthDocs };

export const DOCS_MAP = {
	admin: AdminDocs,
	auth: AuthDocs,
} as const;

export type DocsModules = keyof typeof DOCS_MAP;
