import { registerAs } from '@nestjs/config';

import { CONFIG_TOKENS } from '@/configs/constant.config';

export const emailConfig = registerAs(CONFIG_TOKENS.EMAIL, () => ({
	host: process.env.SMTP_HOST ?? 'smtp.gmail.com',
	port: parseInt(process.env.SMTP_PORT ?? '587', 10),
	user: process.env.SMTP_USER,
	pass: process.env.SMTP_PASS,
}));

export type EmailConfig = ReturnType<typeof emailConfig>;
