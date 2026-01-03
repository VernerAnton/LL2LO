// Gemini AI service for CV data extraction using REST API with User Pays billing
import type { CandidateData, WorkExperience, Education, GeminiModel, ApiTier } from '../types';
import { RateLimiter } from './rateLimiter';
import { GoogleAuthService } from './googleAuthService';

// Rate limiter instance (initially configured for free tier)
const rateLimiter = new RateLimiter(6000);

export interface ExtractionResult {
  success: boolean;
  data?: CandidateData;
  error?: string;
}

export class GeminiService {
  private static userProjectId: string | null = null;
  private static retryDelays: number[] = [6000, 12000, 18000]; // Default: Free tier

  /**
   * Set user's Google Cloud Project ID for billing
   */
  static setUserProjectId(projectId: string): void {
    this.userProjectId = projectId;
    console.log(`🔧 User Project ID set: ${projectId}`);
  }

  /**
   * Configure rate limiting based on API tier
   */
  static setApiTier(tier: ApiTier): void {
    if (tier === 'free') {
      // Free tier: 10 RPM
      rateLimiter.setDelay(6000); // 6s between requests
      this.retryDelays = [6000, 12000, 18000]; // 6s, 12s, 18s
      console.log('🔧 API Tier: FREE (10 RPM, slower retries)');
    } else {
      // Paid tier: 600 RPM (safe buffer under 1000 RPM limit)
      rateLimiter.setDelay(100); // 100ms between requests
      this.retryDelays = [1000, 2000, 4000]; // 1s, 2s, 4s
      console.log('🔧 API Tier: PAID (600 RPM, fast retries)');
    }
  }

  /**
   * Extract structured data from a single CV text
   */
  static async extractCVData(
    cvText: string,
    model: GeminiModel = 'gemini-2.5-flash'
  ): Promise<ExtractionResult> {
    if (!this.userProjectId) {
      return {
        success: false,
        error: 'Project ID not set. Please enter your Google Cloud Project ID.',
      };
    }

    const token = GoogleAuthService.getAccessToken();
    if (!token) {
      return {
        success: false,
        error: 'Not authenticated. Please sign in with Google.',
      };
    }

    // Use rate limiter to queue the request
    return rateLimiter.enqueue(async () => {
      return this.extractWithRetry(cvText, model, token);
    });
  }

  /**
   * Extract with retry logic (3 attempts with tier-appropriate delays)
   */
  private static async extractWithRetry(
    cvText: string,
    model: GeminiModel,
    token: string,
    attempt: number = 1
  ): Promise<ExtractionResult> {
    const maxAttempts = 3;

    try {
      const result = await this.performExtraction(cvText, model, token);
      return result;
    } catch (error: any) {
      console.error(`❌ Extraction attempt ${attempt} failed:`, error.message);

      if (attempt < maxAttempts) {
        const delay = this.retryDelays[attempt - 1];
        console.log(`⏳ Retrying in ${delay / 1000}s... (attempt ${attempt + 1}/${maxAttempts})`);
        await this.sleep(delay);
        return this.extractWithRetry(cvText, model, token, attempt + 1);
      }

      return {
        success: false,
        error: `Failed after ${maxAttempts} attempts: ${error.message}`,
      };
    }
  }

  /**
   * Perform the actual extraction using Gemini REST API
   */
  private static async performExtraction(
    cvText: string,
    modelName: GeminiModel,
    token: string
  ): Promise<ExtractionResult> {
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

Return the data as JSON with this exact structure:
{
  "name": "Full Name",
  "workHistory": [
    {
      "company": "Company Name",
      "jobTitle": "Job Title",
      "dates": "MM/YYYY - MM/YYYY"
    }
  ],
  "education": [
    {
      "institution": "Institution Name",
      "degree": "Degree Name",
      "dates": "YYYY - YYYY"
    }
  ]
}

CV Text:
${cvText}
`;

    // Map model names to API endpoints
    const modelEndpointMap: Record<GeminiModel, string> = {
      'gemini-2.5-flash': 'gemini-1.5-flash',
      'gemini-2.5-pro': 'gemini-1.5-pro',
      'gemini-3-pro-preview': 'gemini-1.5-pro', // Fallback to 1.5-pro for now
    };

    const apiModel = modelEndpointMap[modelName] || 'gemini-1.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${apiModel}:generateContent`;

    console.log(`🤖 Calling Gemini API: ${apiModel}`);
    console.log(`💰 Billing to project: ${this.userProjectId}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Goog-User-Project': this.userProjectId!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 2048,
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error Response:', errorText);
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Parse response from Gemini API
    if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid response structure from Gemini API');
    }

    const responseText = data.candidates[0].content.parts[0].text;

    // Extract JSON from response (may be wrapped in markdown code blocks)
    let jsonText = responseText.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    let extractedData: any;
    try {
      extractedData = JSON.parse(jsonText);
    } catch (e) {
      console.error('❌ Failed to parse JSON:', jsonText);
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
