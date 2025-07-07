// Tự động import tất cả docs
import { AuthDocs } from '@/common/docs/auth.docs';

export * from '@/common/docs/auth.docs';

export const DOCS_MAP = {
	auth: AuthDocs,
} as const;

export type DocsModules = keyof typeof DOCS_MAP;
