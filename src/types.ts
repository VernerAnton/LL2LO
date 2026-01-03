// Core types for LL2PP application

export type Theme = 'system' | 'light' | 'dark'; // User's preference
export type ActualTheme = 'light' | 'dark'; // What actually gets applied to UI

export type ProcessingStatus = 'idle' | 'parsing' | 'extracting' | 'generating' | 'done' | 'error';

// AI Provider types
export type AiProvider = 'openai' | 'anthropic';

export type OpenAIModel = 'gpt-4' | 'gpt-4-turbo' | 'gpt-3.5-turbo';
export type AnthropicModel = 'claude-3-5-sonnet-20241022' | 'claude-3-opus-20240229' | 'claude-3-haiku-20240307';

export type OutputMethod = 'slides' | 'manual';

export type ParseMode = 'longlist' | 'individual';

export interface WorkExperience {
  jobTitle: string;
  company: string;
  dates?: string; // Format: "MM/YYYY - MM/YYYY"
}

export interface Education {
  degree: string;
  institution: string;
  dates?: string; // Format: "MM/YYYY - MM/YYYY"
}

export interface CandidateData {
  name: string;
  workHistory: WorkExperience[];
  education: Education[];
  rawText?: string; // Original CV text for debugging
}

export interface ParsedCV {
  pageNumbers: number[];
  text: string;
}

export interface ProcessingError {
  candidateIndex: number;
  candidateName?: string;
  error: string;
  rawText?: string;
}

export interface AppState {
  theme: Theme;
  apiKey: string | null;
  aiProvider: AiProvider;
  outputMethod: OutputMethod;
  uploadedFile: File | null;
  processingStatus: ProcessingStatus;
  parsedCVs: ParsedCV[];
  extractedCandidates: CandidateData[];
  failedExtractions: ProcessingError[];
  progressCurrent: number;
  progressTotal: number;
  generatedSlidesUrl: string | null;
}
