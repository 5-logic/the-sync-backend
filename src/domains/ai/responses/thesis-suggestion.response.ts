export interface ThesisSuggestionResponse {
	reason: string;
	theses: ThesisSuggestion[];
}

export interface ThesisSuggestion {
	id: string;
	englishName: string;
	abbreviation: string;
	supervisor: string;
	compatibility: number;
}
