export const cleanJsonResponse = (text: string | undefined): string => {
	return (
		text
			?.replace(/```json\s*/gi, '')
			?.replace(/```/g, '')
			?.trim() ?? ''
	);
};
