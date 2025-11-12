/**
 * Google Slides Service
 *
 * Handles creation of Google Slides presentations from extracted candidate data.
 * Features:
 * - Creates presentations via Google Slides API
 * - 2x2 grid layout (4 candidates per slide)
 * - Optional branded template support
 * - Automatic slide generation with formatted candidate data
 */

import type { CandidateData } from '../types';

export interface SlidesGenerationResult {
  success: boolean;
  presentationId?: string;
  presentationUrl?: string;
  error?: string;
}

export class SlidesService {
  private static readonly SLIDES_API_BASE = 'https://slides.googleapis.com/v1';

  // Slide dimensions (in points: 1 inch = 72 points)
  private static readonly SLIDE_WIDTH = 720; // 10 inches
  private static readonly SLIDE_HEIGHT = 405; // 5.625 inches (16:9 aspect ratio)

  // Card dimensions for 2x2 grid with padding
  private static readonly CARD_WIDTH = 320;
  private static readonly CARD_HEIGHT = 180;
  private static readonly CARD_PADDING = 20;
  private static readonly CARD_MARGIN = 10;

  /**
   * Initialize the Google Slides API
   */
  static async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!window.gapi) {
        reject(new Error('Google API client not loaded'));
        return;
      }

      window.gapi.load('client', async () => {
        try {
          await window.gapi.client.load('slides', 'v1');
          console.log('✅ Google Slides API loaded');
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  /**
   * Create a presentation with candidates in 2x2 grid layout
   * @param candidates Array of candidate data to include
   * @param title Presentation title
   * @param templateId Optional template presentation ID to copy from
   */
  static async createPresentation(
    candidates: CandidateData[],
    title: string = 'CV Candidates',
    templateId?: string
  ): Promise<SlidesGenerationResult> {
    try {
      if (!window.gapi || !window.gapi.client) {
        throw new Error('Google API client not initialized');
      }

      // Step 1: Create or copy presentation
      let presentationId: string;

      if (templateId) {
        // Copy from template using Drive API
        presentationId = await this.copyTemplate(templateId, title);
      } else {
        // Create blank presentation
        const createResponse = await window.gapi.client.request({
          path: `${this.SLIDES_API_BASE}/presentations`,
          method: 'POST',
          body: {
            title: title
          }
        });
        presentationId = createResponse.result.presentationId;
      }

      console.log(`📊 Created presentation: ${presentationId}`);

      // Step 2: Add candidate slides
      await this.addCandidateSlides(presentationId, candidates);

      // Step 3: Generate presentation URL
      const presentationUrl = `https://docs.google.com/presentation/d/${presentationId}/edit`;

      console.log(`✅ Presentation ready: ${presentationUrl}`);

      return {
        success: true,
        presentationId,
        presentationUrl
      };

    } catch (error) {
      console.error('❌ Failed to create presentation:', error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Copy a template presentation
   */
  private static async copyTemplate(templateId: string, title: string): Promise<string> {
    const response = await window.gapi.client.request({
      path: `https://www.googleapis.com/drive/v3/files/${templateId}/copy`,
      method: 'POST',
      body: {
        name: title
      }
    });
    return response.result.id;
  }

  /**
   * Add slides with candidates in 2x2 grid layout
   */
  private static async addCandidateSlides(
    presentationId: string,
    candidates: CandidateData[]
  ): Promise<void> {
    // Group candidates into batches of 4 (2x2 grid)
    const candidateBatches: CandidateData[][] = [];
    for (let i = 0; i < candidates.length; i += 4) {
      candidateBatches.push(candidates.slice(i, i + 4));
    }

    console.log(`📄 Creating ${candidateBatches.length} slides for ${candidates.length} candidates`);

    // Process each batch (each batch = one slide)
    for (let batchIndex = 0; batchIndex < candidateBatches.length; batchIndex++) {
      const batch = candidateBatches[batchIndex];
      await this.createSlideWithCandidates(presentationId, batch, batchIndex + 1);
    }
  }

  /**
   * Create a single slide with up to 4 candidates in 2x2 grid
   */
  private static async createSlideWithCandidates(
    presentationId: string,
    candidates: CandidateData[],
    slideNumber: number
  ): Promise<void> {
    const requests: any[] = [];

    // Create slide
    const slideId = `slide_${slideNumber}_${Date.now()}`;
    requests.push({
      createSlide: {
        objectId: slideId,
        slideLayoutReference: {
          predefinedLayout: 'BLANK'
        }
      }
    });

    // Add candidate cards in 2x2 grid
    // Positions: [0] top-left, [1] top-right, [2] bottom-left, [3] bottom-right
    const positions = [
      { x: this.CARD_MARGIN, y: this.CARD_MARGIN }, // Top-left
      { x: this.CARD_MARGIN * 2 + this.CARD_WIDTH, y: this.CARD_MARGIN }, // Top-right
      { x: this.CARD_MARGIN, y: this.CARD_MARGIN * 2 + this.CARD_HEIGHT }, // Bottom-left
      { x: this.CARD_MARGIN * 2 + this.CARD_WIDTH, y: this.CARD_MARGIN * 2 + this.CARD_HEIGHT } // Bottom-right
    ];

    candidates.forEach((candidate, index) => {
      const pos = positions[index];
      const cardRequests = this.createCandidateCard(
        slideId,
        candidate,
        pos.x,
        pos.y,
        index
      );
      requests.push(...cardRequests);
    });

    // Execute batch update
    await window.gapi.client.request({
      path: `${this.SLIDES_API_BASE}/presentations/${presentationId}:batchUpdate`,
      method: 'POST',
      body: { requests }
    });

    console.log(`  ✅ Slide ${slideNumber} created with ${candidates.length} candidates`);
  }

  /**
   * Create a candidate card with border, name, work history, and education
   */
  private static createCandidateCard(
    slideId: string,
    candidate: CandidateData,
    x: number,
    y: number,
    index: number
  ): any[] {
    const requests: any[] = [];
    const cardId = `card_${index}_${Date.now()}`;

    // Create border rectangle
    requests.push({
      createShape: {
        objectId: `${cardId}_border`,
        shapeType: 'RECTANGLE',
        elementProperties: {
          pageObjectId: slideId,
          size: {
            width: { magnitude: this.CARD_WIDTH, unit: 'PT' },
            height: { magnitude: this.CARD_HEIGHT, unit: 'PT' }
          },
          transform: {
            scaleX: 1,
            scaleY: 1,
            translateX: x,
            translateY: y,
            unit: 'PT'
          }
        }
      }
    });

    // Style the border
    requests.push({
      updateShapeProperties: {
        objectId: `${cardId}_border`,
        shapeProperties: {
          outline: {
            outlineFill: {
              solidFill: {
                color: { rgbColor: { red: 0.16, green: 0.16, blue: 0.16 } }
              }
            },
            weight: { magnitude: 2, unit: 'PT' }
          },
          shapeBackgroundFill: {
            solidFill: {
              color: { rgbColor: { red: 1, green: 1, blue: 1 } }
            }
          }
        },
        fields: 'outline,shapeBackgroundFill'
      }
    });

    // Format candidate data as text
    const text = this.formatCandidateText(candidate);

    // Create text box
    const textBoxId = `${cardId}_text`;
    requests.push({
      createShape: {
        objectId: textBoxId,
        shapeType: 'TEXT_BOX',
        elementProperties: {
          pageObjectId: slideId,
          size: {
            width: { magnitude: this.CARD_WIDTH - (this.CARD_PADDING * 2), unit: 'PT' },
            height: { magnitude: this.CARD_HEIGHT - (this.CARD_PADDING * 2), unit: 'PT' }
          },
          transform: {
            scaleX: 1,
            scaleY: 1,
            translateX: x + this.CARD_PADDING,
            translateY: y + this.CARD_PADDING,
            unit: 'PT'
          }
        }
      }
    });

    // Insert text content
    requests.push({
      insertText: {
        objectId: textBoxId,
        text: text
      }
    });

    // Style the text
    requests.push({
      updateTextStyle: {
        objectId: textBoxId,
        style: {
          fontFamily: 'Courier New',
          fontSize: { magnitude: 8, unit: 'PT' }
        },
        fields: 'fontFamily,fontSize'
      }
    });

    // Make name bold (first line)
    const nameLength = candidate.name.length;
    requests.push({
      updateTextStyle: {
        objectId: textBoxId,
        textRange: {
          type: 'FIXED_RANGE',
          startIndex: 0,
          endIndex: nameLength
        },
        style: {
          bold: true,
          fontSize: { magnitude: 10, unit: 'PT' }
        },
        fields: 'bold,fontSize'
      }
    });

    return requests;
  }

  /**
   * Format candidate data as plain text
   */
  private static formatCandidateText(candidate: CandidateData): string {
    const lines: string[] = [];

    // Name
    lines.push(candidate.name);
    lines.push('');

    // Work History
    if (candidate.workHistory.length > 0) {
      lines.push('WORK HISTORY:');
      candidate.workHistory.slice(0, 3).forEach(work => {
        lines.push(`• ${work.jobTitle}`);
        lines.push(`  ${work.company}`);
        if (work.dates) {
          lines.push(`  ${work.dates}`);
        }
      });
      if (candidate.workHistory.length > 3) {
        lines.push(`  ...and ${candidate.workHistory.length - 3} more`);
      }
      lines.push('');
    }

    // Education
    if (candidate.education.length > 0) {
      lines.push('EDUCATION:');
      candidate.education.slice(0, 2).forEach(edu => {
        lines.push(`• ${edu.degree}`);
        lines.push(`  ${edu.institution}`);
      });
      if (candidate.education.length > 2) {
        lines.push(`  ...and ${candidate.education.length - 2} more`);
      }
    }

    return lines.join('\n');
  }
}
