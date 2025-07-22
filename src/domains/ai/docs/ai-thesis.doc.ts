import { ApiOperationOptions } from '@nestjs/swagger';

export const AIThesisDocs = {
	checkDuplicate: {
		summary: 'Check thesis duplicates using AI',
		description: `Check for potential duplicate theses using AI-powered analysis.\n\n- **Moderator and Lecturer access** (requires authentication and MODERATOR or LECTURER role).\n- Analyzes the specified thesis against the database to find potential duplicates.\n- Uses AI algorithms to compare thesis content, titles, and abstracts.\n- Returns a list of potentially similar theses with similarity scores.\n- Helps moderators and lecturers identify plagiarism or highly similar research topics.\n- Logs all duplicate check attempts and results.\n\n**Parameters:**\n- \`thesisId\`: Required - UUID of the thesis to check for duplicates.\n\n**Response includes:**\n- List of potentially duplicate theses\n- Similarity scores and matching criteria\n- Thesis information (title, abstract, author, etc.)\n- Confidence levels for each match\n\n**Use cases:**\n- Quality assurance during thesis review process\n- Plagiarism detection\n- Research topic overlap identification\n- Academic integrity enforcement\n- Lecturer supervision and guidance`,
	} as ApiOperationOptions,
};
