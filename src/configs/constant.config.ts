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
} as const;

export const CONFIG_QUEUES = {
	EMAIL: 'email',
} as const;

export const CONSTANTS = {
	TIMEOUT: 20 * 60 * 1000, // 20 minutes in milliseconds
	BODY_LIMIT: '50mb', // 50MB
	PRODUCTION: 'production',
	TTL: 60 * 60 * 1000, // 1 hours in milliseconds
	LRU_SIZE: 10000, // 10000 items
} as const;
