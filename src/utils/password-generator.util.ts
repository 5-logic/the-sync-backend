import { generate } from 'generate-password';

export const generateStrongPassword = (): string => {
	return generate({
		length: 32,
		numbers: true,
		symbols: false,
		uppercase: true,
		lowercase: true,
		strict: true,
	});
};
