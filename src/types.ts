// Core types for LL2PP application

export type Theme = 'system' | 'light' | 'dark'; // User's preference
export type ActualTheme = 'light' | 'dark'; // What actually gets applied to UI

export type ProcessingStatus = 'idle' | 'parsing' | 'extracting' | 'generating' | 'done' | 'error';

// AI Provider types
export type AiProvider = 'openai' | 'anthropic';

export type OpenAIModel = 'gpt-4' | 'gpt-4-turbo' | 'gpt-3.5-turbo';
export type AnthropicModel =
  | 'claude-haiku-4-5'           // Haiku 4.5 - Fastest, cheapest ($0.25/1M in, $1.25/1M out)
  | 'claude-sonnet-4-5'          // Sonnet 4.5 - Balanced ($3/1M in, $15/1M out)
  | 'claude-opus-4-5-20251101';  // Opus 4.5 - Most capable ($15/1M in, $75/1M out)

export type OutputMethod = 'slides' | 'manual';

export type ParseMode = 'longlist' | 'individual';

// Concurrency level for parallel API requests (1-5)
export type ConcurrencyLevel = 1 | 2 | 3 | 4 | 5;

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
