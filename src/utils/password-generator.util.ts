import { generate } from 'generate-password';

export const generateStrongPassword = (): string => {
	return generate({
		length: 12,
		numbers: true,
		symbols: true,
		uppercase: true,
		lowercase: true,
		strict: true,
	});
};
