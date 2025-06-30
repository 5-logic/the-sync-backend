import { registerAs } from '@nestjs/config';

import { CONFIG_TOKENS, PRODUCTION } from '@/configs/constant.config';

export const corsConfig = registerAs(CONFIG_TOKENS.CORS, () => {
	const allowedOrigins =
		process.env.ALLOWED_ORIGINS?.split(',').map((origin) => origin.trim()) ??
		[];

	return {
		origin: (origin: string): Promise<boolean> => {
			if (process.env.NODE_ENV !== PRODUCTION) {
				return Promise.resolve(true);
			}

			if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
				return Promise.resolve(true);
			}

			return Promise.resolve(false);
		},
		methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
		optionsSuccessStatus: 200,
	};
});

export type CORSConfig = ReturnType<typeof corsConfig>;
