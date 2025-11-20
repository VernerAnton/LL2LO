// Core types for LL2PP application

export type Theme = 'system' | 'light' | 'dark'; // User's preference
export type ActualTheme = 'light' | 'dark'; // What actually gets applied to UI

export type ProcessingStatus = 'idle' | 'parsing' | 'extracting' | 'generating' | 'done' | 'error';

export type GeminiModel = 'gemini-2.5-flash' | 'gemini-2.5-pro' | 'gemini-3-pro-preview';

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

export interface GoogleAuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  userEmail: string | null;
}

export interface AppState {
  theme: Theme;
  geminiApiKey: string | null;
  selectedModel: GeminiModel;
  outputMethod: OutputMethod;
  uploadedFile: File | null;
  processingStatus: ProcessingStatus;
  parsedCVs: ParsedCV[];
  extractedCandidates: CandidateData[];
  failedExtractions: ProcessingError[];
  progressCurrent: number;
  progressTotal: number;
  generatedSlidesUrl: string | null;
  googleAuth: GoogleAuthState;
}
