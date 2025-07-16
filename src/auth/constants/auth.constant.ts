export const AUTH_API_TAGS = 'Auth';

export const BASE_AUTH_PATH = 'auth';

export const CACHE_KEY = 'cache:' + BASE_AUTH_PATH;

export const AUTH_CONSTANTS = {
	ADMIN_AUTH: BASE_AUTH_PATH + '/admin',
	USER_AUTH: BASE_AUTH_PATH + '/user',
	PASSWORD_RESET: BASE_AUTH_PATH + '/password-reset',
	CHANGE_PASSWORD: BASE_AUTH_PATH + '/change-password',
};

export const TOKEN_CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

export const OTP_CACHE_KEY = 'cache:otp';
export const OTP_TTL = 10 * 60 * 1000; // 10 minutes in milliseconds
