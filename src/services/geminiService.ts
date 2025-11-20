// Gemini AI service for CV data extraction
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { CandidateData, WorkExperience, Education, GeminiModel } from '../types';
import { RateLimiter } from './rateLimiter';

// Rate limiter instance (6 seconds between requests = 10 RPM)
const rateLimiter = new RateLimiter(6000);

export interface ExtractionResult {
  success: boolean;
  data?: CandidateData;
  error?: string;
}

export class GeminiService {
  private static genAI: GoogleGenerativeAI | null = null;
  private static apiKey: string | null = null;

  /**
   * Initialize Gemini AI with API key
   */
  static initialize(apiKey: string): void {
    this.apiKey = apiKey;
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  /**
   * Extract structured data from a single CV text
   */
  static async extractCVData(
    cvText: string,
    model: GeminiModel = 'gemini-2.5-flash'
  ): Promise<ExtractionResult> {
    if (!this.genAI || !this.apiKey) {
      return {
        success: false,
        error: 'Gemini AI not initialized. Call initialize() first.',
      };
    }

    // Use rate limiter to queue the request
    return rateLimiter.enqueue(async () => {
      return this.extractWithRetry(cvText, model);
    });
  }

  /**
   * Extract with retry logic (3 attempts with rate-limit-respecting delays)
   */
  private static async extractWithRetry(
    cvText: string,
    model: GeminiModel,
    attempt: number = 1
  ): Promise<ExtractionResult> {
    const maxAttempts = 3;
    const delays = [6000, 12000, 18000]; // 6s, 12s, 18s (respects 10 RPM limit)

    try {
      const result = await this.performExtraction(cvText, model);
      return result;
    } catch (error: any) {
      console.error(`❌ Extraction attempt ${attempt} failed:`, error.message);

      if (attempt < maxAttempts) {
        const delay = delays[attempt - 1];
        console.log(`⏳ Retrying in ${delay / 1000}s... (attempt ${attempt + 1}/${maxAttempts})`);
        await this.sleep(delay);
        return this.extractWithRetry(cvText, model, attempt + 1);
      }

      return {
        success: false,
        error: `Failed after ${maxAttempts} attempts: ${error.message}`,
      };
    }
  }

  /**
   * Perform the actual extraction using Gemini API
   */
  private static async performExtraction(
    cvText: string,
    modelName: GeminiModel
  ): Promise<ExtractionResult> {
    const model = this.genAI!.getGenerativeModel({
      model: modelName,
      generationConfig: <any>{
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Full name of the candidate' },
            workHistory: {
              type: 'array',
              description: 'Last 5 work experiences (excluding board member roles)',
              items: {
                type: 'object',
                properties: {
                  company: { type: 'string' },
                  jobTitle: { type: 'string' },
                  dates: { type: 'string', description: 'Format: MM/YYYY - MM/YYYY or MM/YYYY - Present' },
                },
                required: ['company', 'jobTitle'],
              },
            },
            education: {
              type: 'array',
              description: 'All education entries',
              items: {
                type: 'object',
                properties: {
                  institution: { type: 'string' },
                  degree: { type: 'string' },
                  dates: { type: 'string', description: 'Format: YYYY - YYYY' },
                },
                required: ['institution', 'degree'],
              },
            },
          },
          required: ['name', 'workHistory', 'education'],
        },
      },
    });

    const prompt = `
Extract structured information from this CV. IMPORTANT instructions:

1. Extract the candidate's FULL NAME
2. Extract the LAST 5 WORK EXPERIENCES (most recent first)
   - EXCLUDE any "Board Member", "Board Director", or similar non-operational roles
   - ONLY include operational positions (jobs where the person actively works)
   - Format dates as: MM/YYYY - MM/YYYY (e.g., "01/2020 - 12/2022")
   - Use "Present" for current positions
3. Extract ALL EDUCATION entries
   - Format dates as: YYYY - YYYY (e.g., "2016 - 2018")

CV Text:
${cvText}
`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    let extractedData: any;
    try {
      extractedData = JSON.parse(text);
    } catch (e) {
      throw new Error('Failed to parse JSON response from Gemini');
    }

    // Validate and clean the data
    const candidateData: CandidateData = {
      name: extractedData.name || 'Unknown',
      workHistory: this.cleanWorkHistory(extractedData.workHistory || []),
      education: this.cleanEducation(extractedData.education || []),
      rawText: cvText,
    };

    // Additional client-side filtering for board member roles
    candidateData.workHistory = this.filterBoardMemberRoles(candidateData.workHistory);

    return {
      success: true,
      data: candidateData,
    };
  }

  /**
   * Clean and validate work history data
   */
  private static cleanWorkHistory(workHistory: any[]): WorkExperience[] {
    return workHistory
      .filter((item) => item.company && item.jobTitle)
      .slice(0, 5) // Ensure max 5 entries
      .map((item) => ({
        company: String(item.company).trim(),
        jobTitle: String(item.jobTitle).trim(),
        dates: item.dates ? String(item.dates).trim() : undefined,
      }));
  }

  /**
   * Clean and validate education data
   */
  private static cleanEducation(education: any[]): Education[] {
    return education
      .filter((item) => item.institution && item.degree)
      .map((item) => ({
        institution: String(item.institution).trim(),
        degree: String(item.degree).trim(),
        dates: item.dates ? String(item.dates).trim() : undefined,
      }));
  }

  /**
   * Filter out board member roles (client-side backup)
   */
  private static filterBoardMemberRoles(workHistory: WorkExperience[]): WorkExperience[] {
    const boardKeywords = [
      'board member',
      'board director',
      'advisory board',
      'board of directors',
      'non-executive director',
    ];

    return workHistory.filter((experience) => {
      const titleLower = experience.jobTitle.toLowerCase();
      return !boardKeywords.some((keyword) => titleLower.includes(keyword));
    });
  }

  /**
   * Sleep utility for retry delays
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Clear rate limiter queue
   */
  static clearQueue(): void {
    rateLimiter.clear();
  }

  /**
   * Get current queue length
   */
  static getQueueLength(): number {
    return rateLimiter.getQueueLength();
  }
}
