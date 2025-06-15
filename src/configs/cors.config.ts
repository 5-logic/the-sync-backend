import { registerAs } from '@nestjs/config';

export const corsConfig = registerAs('cors-config', () => {
	const allowedOrigins =
		process.env.ALLOWED_ORIGINS?.split(',').map((origin) => origin.trim()) ||
		[];

	return {
		origin: (
			origin: string,
			callback: (arg0: Error | null, arg1: boolean) => void,
		) => {
			if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
				callback(null, true);
			} else {
				callback(new Error('Not allowed by CORS'), false);
			}
		},
		optionsSuccessStatus: 200,
	};
});
