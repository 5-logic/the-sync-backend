export interface StudentSuggestion {
	student: {
		userId: string;
		fullName: string;
		email: string;
		studentCode: string;
	};
	similarityScore: number;
	matchPercentage: number;
}

export interface GroupSuggestionResponse {
	group: {
		id: string;
		code: string;
		name: string;
		thesis?: {
			id: string;
			englishName: string;
			vietnameseName: string;
			description?: string;
		} | null;
	};
	suggestions: StudentSuggestion[];
	queryContext: string;
}

export interface StudentGroupCompatibilityResponse {
	student: {
		id: string;
		name: string;
		email: string;
	};
	group: {
		id: string;
		code: string;
		name: string;
		thesis?: {
			englishName: string;
			vietnameseName: string;
			description?: string;
		} | null;
	};
	compatibilityScore: number;
	recommendation: string;
}
