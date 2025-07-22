import { registerAs } from '@nestjs/config';

import { CONFIG_TOKENS } from '@/configs/constant.config';

interface EmailInterface {
	host: string;
	port: number;
	user: string;
	pass: string;
}

export const emailConfig = registerAs(
	CONFIG_TOKENS.EMAIL,
	(): EmailInterface => {
		if (
			!process.env.SMTP_HOST ||
			!process.env.SMTP_PORT ||
			!process.env.SMTP_USER ||
			!process.env.SMTP_PASS
		) {
			throw new Error(
				'SMTP configuration is not properly set in environment variables',
			);
		}

		return {
			host: process.env.SMTP_HOST,
			port: parseInt(process.env.SMTP_PORT, 10),
			user: process.env.SMTP_USER,
			pass: process.env.SMTP_PASS,
		};
	},
);

export type EmailConfig = ReturnType<typeof emailConfig>;
