export class EmailJobDto {
	to: string;
	subject: string;
	context: Record<string, any>;
}
