import generatePassword from 'generate-password';

export function generateStrongPassword(): string {
	return generatePassword.generate({
		length: 12,
		numbers: true,
		symbols: true,
		uppercase: true,
		lowercase: true,
		strict: true,
	});
}
