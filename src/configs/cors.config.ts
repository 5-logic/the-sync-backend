import { registerAs } from '@nestjs/config';

import { CONFIG_TOKENS, CONSTANTS } from '@/configs/constant.config';

export const corsConfig = registerAs(CONFIG_TOKENS.CORS, () => {
	const allowedOrigins =
		process.env.ALLOWED_ORIGINS?.split(',').map((origin) => origin.trim()) ??
		[];

	return {
		origin: (
			requestOrigin: string,
			callback: (err: Error | null, origin?: boolean) => void,
		) => {
			if (process.env.NODE_ENV !== CONSTANTS.PRODUCTION) {
				callback(null, true);
				return;
			}

			if (allowedOrigins.indexOf(requestOrigin) !== -1 || !requestOrigin) {
				callback(null, true);
				return;
			}

			return callback(
				new Error(`Origin ${requestOrigin} not allowed by CORS`),
				false,
			);
		},
		optionsSuccessStatus: 200,
	};
});

export type CORSConfig = ReturnType<typeof corsConfig>;
