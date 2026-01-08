// AI service for CV data extraction - Provider Agnostic (OpenAI/Anthropic)
import type { CandidateData, WorkExperience, Education, AiProvider, AnthropicModel } from '../types';
import { RateLimiter } from './rateLimiter';

// Rate limiter instance (1 request per second to be safe)
const rateLimiter = new RateLimiter(1000);

export interface ExtractionResult {
  success: boolean;
  data?: CandidateData;
  error?: string;
}

export class AIService {
  private static apiKey: string | null = null;
  private static provider: AiProvider = 'anthropic';
  private static anthropicModel: AnthropicModel = 'claude-3-5-sonnet-20241022';
  private static retryDelays: number[] = [2000, 4000, 8000]; // 2s, 4s, 8s

  /**
   * Set API key for the AI provider
   */
  static setApiKey(key: string | null): void {
    this.apiKey = key;
    console.log(`🔧 API Key ${key ? 'set' : 'cleared'}`);
  }

  /**
   * Set AI provider (OpenAI or Anthropic)
   */
  static setProvider(provider: AiProvider): void {
    this.provider = provider;
    console.log(`🔧 AI Provider set to: ${provider}`);
  }

  /**
   * Set Anthropic model (Haiku, Sonnet, or Opus)
   */
  static setAnthropicModel(model: AnthropicModel): void {
    this.anthropicModel = model;
    console.log(`🔧 Anthropic Model set to: ${model}`);
  }

  /**
   * Extract structured data from a single CV text
   */
  static async extractCVData(cvText: string): Promise<ExtractionResult> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'API key not set. Please enter your API key.',
      };
    }

    // Use rate limiter to queue the request
    return rateLimiter.enqueue(async () => {
      return this.extractWithRetry(cvText);
    });
  }

  /**
   * Extract with retry logic (3 attempts with exponential backoff)
   */
  private static async extractWithRetry(
    cvText: string,
    attempt: number = 1
  ): Promise<ExtractionResult> {
    const maxAttempts = 3;

    try {
      const result = await this.performExtraction(cvText);
      return result;
    } catch (error: any) {
      console.error(`❌ Extraction attempt ${attempt} failed:`, error.message);

      if (attempt < maxAttempts) {
        const delay = this.retryDelays[attempt - 1];
        console.log(`⏳ Retrying in ${delay / 1000}s... (attempt ${attempt + 1}/${maxAttempts})`);
        await this.sleep(delay);
        return this.extractWithRetry(cvText, attempt + 1);
      }

      return {
        success: false,
        error: `Failed after ${maxAttempts} attempts: ${error.message}`,
      };
    }
  }

  /**
   * Perform the actual extraction using the selected AI provider
   */
  private static async performExtraction(cvText: string): Promise<ExtractionResult> {
    const prompt = this.buildExtractionPrompt(cvText);

    let responseText: string;

    if (this.provider === 'openai') {
      responseText = await this.callOpenAI(prompt);
    } else {
      responseText = await this.callAnthropic(prompt);
    }

    // Parse the JSON response
    const extractedData = this.parseResponse(responseText);

    // Validate and clean the data
    const candidateData: CandidateData = {
      name: extractedData.name || 'Unknown',
      workHistory: this.cleanWorkHistory(extractedData.workHistory || []),
      education: this.cleanEducation(extractedData.education || []),
      rawText: cvText,
    };

    // Filter out board member roles
    candidateData.workHistory = this.filterBoardMemberRoles(candidateData.workHistory);

    return {
      success: true,
      data: candidateData,
    };
  }

  /**
   * Build the extraction prompt with explicit formatting requirements
   */
  private static buildExtractionPrompt(cvText: string): string {
    return `You are a CV data extraction specialist. Extract structured information from the CV below.

CRITICAL INSTRUCTIONS:

1. FULL NAME
   - Extract the candidate's complete full name

2. WORK HISTORY (Maximum 5 most recent positions)
   - EXCLUDE all board positions including: Board Member, Board Director, Advisory Board, Board of Directors, Non-Executive Director, Supervisory Board, Board Observer, Board Advisor
   - ONLY include operational/employment positions where the person actively worked (CEO, CTO, Manager, Engineer, etc.)
   - If someone has both operational and board roles, ONLY include the operational ones
   - Extract: company name, job title, and dates
   - Date format REQUIRED: MM/YYYY - MM/YYYY (example: "03/2020 - 08/2023")
   - For current positions, use "Present" as end date (example: "01/2022 - Present")
   - List most recent position first

3. EDUCATION (ALL entries)
   - Extract: institution name, degree/program name, and dates
   - Date format REQUIRED: YYYY - YYYY (example: "2018 - 2020")
   - If dates missing, omit the dates field entirely
   - Include all education entries (no limit)

REQUIRED OUTPUT FORMAT (JSON only, no other text):
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
      "degree": "Degree/Program Name",
      "dates": "YYYY - YYYY"
    }
  ]
}

CV TEXT:
${cvText}`;
  }

  /**
   * Call OpenAI API
   */
  private static async callOpenAI(prompt: string): Promise<string> {
    const url = 'https://api.openai.com/v1/chat/completions';

    console.log('🤖 Calling OpenAI API...');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that extracts structured data from CVs. Always respond with valid JSON only, no additional text.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenAI API Error:', errorText);
      throw new Error(`OpenAI API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0]?.message?.content) {
      throw new Error('Invalid response structure from OpenAI API');
    }

    return data.choices[0].message.content;
  }

  /**
   * Call Anthropic API with selected model
   */
  private static async callAnthropic(prompt: string): Promise<string> {
    const url = 'https://api.anthropic.com/v1/messages';

    console.log(`🤖 Calling Anthropic API (${this.anthropicModel})...`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey!,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.anthropicModel,
        max_tokens: 2048,
        temperature: 0.1,
        system: 'You are a helpful assistant that extracts structured data from CVs. Always respond with valid JSON only, no additional text or explanations.',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Anthropic API Error:', errorText);
      throw new Error(`Anthropic API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.content || !data.content[0]?.text) {
      throw new Error('Invalid response structure from Anthropic API');
    }

    return data.content[0].text;
  }

  /**
   * Parse JSON response from AI (may be wrapped in markdown code blocks)
   */
  private static parseResponse(responseText: string): any {
    let jsonText = responseText.trim();

    // Remove markdown code blocks if present
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    try {
      return JSON.parse(jsonText);
    } catch (e) {
      console.error('❌ Failed to parse JSON:', jsonText);
      throw new Error('Failed to parse JSON response from AI');
    }
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
      'supervisory board',
      'board observer',
      'board advisor',
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

// Keep GeminiService as an alias for backwards compatibility during migration
export const GeminiService = AIService;
