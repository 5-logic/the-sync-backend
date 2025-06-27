export const CONFIG_TOKENS = {
	REDIS: 'redis',
	CORS: 'cors',
	JWT_ACCESS: 'jwt-access',
	JWT_REFRESH: 'jwt-refresh',
	EMAIL: 'email',
} as const;

export const CONFIG_MOUNTS = {
	BULL_BOARD: 'bull-board',
	SWAGGER: 'swagger',
	SWAGGER_RAW: 'swagger/json',
};

export const CONFIG_QUEUES = {
	EMAIL: 'email',
};

export const TIMEOUT = 20 * 60 * 1000; // 20 minutes in milliseconds
