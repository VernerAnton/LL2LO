/**
 * Google Slides Service
 *
 * Handles creation of Google Slides presentations from extracted candidate data.
 * Layout: 2 columns × 4 rows = 8 text boxes per slide (4 candidates)
 * - Left column: Education only
 * - Right column: Name (ALL CAPS) + Work history
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

  // Conversion: 1 cm = 360000 EMU (English Metric Units)
  private static readonly CM_TO_EMU = 360000;

  // Layout configuration (in cm, converted to EMU for API)
  private static readonly LAYOUT = {
    education: { x: 1.9, w: 10.02 },    // Left column
    experience: { x: 12.22, w: 13.15 }, // Right column
    rows: [
      { y: 1.75, h: 3.3 },  // Row 1
      { y: 5.05, h: 3.3 },  // Row 2
      { y: 8.35, h: 3.3 },  // Row 3
      { y: 11.65, h: 3.3 }, // Row 4
    ],
  };

  /**
   * Convert cm to EMU
   */
  private static cmToEmu(cm: number): number {
    return Math.round(cm * this.CM_TO_EMU);
  }

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
   * Create a presentation with candidates in 2-column, 4-row layout
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

      console.log('📊 Creating presentation...');
      console.log('   Token set:', window.gapi.client.getToken() !== null);

      // Step 1: Create presentation
      const createResponse = await window.gapi.client.request({
        path: `${this.SLIDES_API_BASE}/presentations`,
        method: 'POST',
        body: { title }
      });

      if (!createResponse || !createResponse.result) {
        throw new Error('No response from Slides API');
      }

      const presentationId = createResponse.result.presentationId;
      console.log(`✅ Created presentation: ${presentationId}`);

      // Step 2: Add candidate slides (4 candidates per slide)
      await this.addCandidateSlides(presentationId, candidates);

      // Step 3: Generate presentation URL
      const presentationUrl = `https://docs.google.com/presentation/d/${presentationId}/edit`;

      console.log(`✅ Presentation ready: ${presentationUrl}`);

      return {
        success: true,
        presentationId,
        presentationUrl
      };

    } catch (error: any) {
      console.error('❌ Failed to create presentation:', error);
      console.error('   Error details:', {
        message: error.message,
        status: error.status,
        result: error.result
      });
      return {
        success: false,
        error: error.result?.error?.message || error.message || 'Unknown error'
      };
    }
  }

  /**
   * Add slides with candidates (4 per slide)
   */
  private static async addCandidateSlides(
    presentationId: string,
    candidates: CandidateData[]
  ): Promise<void> {
    // Group candidates into batches of 4
    const candidateBatches: CandidateData[][] = [];
    for (let i = 0; i < candidates.length; i += 4) {
      candidateBatches.push(candidates.slice(i, i + 4));
    }

    console.log(`📄 Creating ${candidateBatches.length} slides for ${candidates.length} candidates`);

    // Process each batch (each batch = one slide)
    for (let batchIndex = 0; batchIndex < candidateBatches.length; batchIndex++) {
      const batch = candidateBatches[batchIndex];
      await this.createSlideWithCandidates(presentationId, batch, batchIndex);
    }
  }

  /**
   * Create a single slide with up to 4 candidates
   */
  private static async createSlideWithCandidates(
    presentationId: string,
    candidates: CandidateData[],
    slideIndex: number
  ): Promise<void> {
    const requests: any[] = [];

    // Create slide
    const slideId = `slide_${slideIndex}_${Date.now()}`;
    requests.push({
      createSlide: {
        objectId: slideId,
        slideLayoutReference: {
          predefinedLayout: 'BLANK'
        }
      }
    });

    // Add text boxes for each candidate (2 boxes per candidate: education + experience)
    candidates.forEach((candidate, index) => {
      const row = this.LAYOUT.rows[index];

      // Left box: Education
      const educationBoxId = `edu_${slideIndex}_${index}_${Date.now()}`;
      requests.push(...this.createEducationBox(
        slideId,
        educationBoxId,
        candidate,
        row
      ));

      // Right box: Name + Work
      const experienceBoxId = `exp_${slideIndex}_${index}_${Date.now()}`;
      requests.push(...this.createExperienceBox(
        slideId,
        experienceBoxId,
        candidate,
        row
      ));
    });

    // Execute batch update
    await window.gapi.client.request({
      path: `${this.SLIDES_API_BASE}/presentations/${presentationId}:batchUpdate`,
      method: 'POST',
      body: { requests }
    });

    console.log(`  ✅ Slide ${slideIndex + 1} created with ${candidates.length} candidates`);
  }

  /**
   * Create education text box (left column)
   */
  private static createEducationBox(
    slideId: string,
    boxId: string,
    candidate: CandidateData,
    row: { y: number; h: number }
  ): any[] {
    const requests: any[] = [];
    const layout = this.LAYOUT.education;

    // Create text box
    requests.push({
      createShape: {
        objectId: boxId,
        shapeType: 'TEXT_BOX',
        elementProperties: {
          pageObjectId: slideId,
          size: {
            width: { magnitude: this.cmToEmu(layout.w), unit: 'EMU' },
            height: { magnitude: this.cmToEmu(row.h), unit: 'EMU' }
          },
          transform: {
            scaleX: 1,
            scaleY: 1,
            translateX: this.cmToEmu(layout.x),
            translateY: this.cmToEmu(row.y),
            unit: 'EMU'
          }
        }
      }
    });

    // Format education text
    const text = this.formatEducationText(candidate);

    // Insert text
    requests.push({
      insertText: {
        objectId: boxId,
        text: text
      }
    });

    // Style the text - default 10pt with autofit
    requests.push({
      updateParagraphStyle: {
        objectId: boxId,
        style: {
          lineSpacing: 100,
          spaceAbove: { magnitude: 0, unit: 'PT' },
          spaceBelow: { magnitude: 0, unit: 'PT' }
        },
        fields: 'lineSpacing,spaceAbove,spaceBelow'
      }
    });

    // Set default font size 10pt
    requests.push({
      updateTextStyle: {
        objectId: boxId,
        style: {
          fontSize: { magnitude: 10, unit: 'PT' }
        },
        fields: 'fontSize'
      }
    });

    // Enable autofit to shrink text if needed
    requests.push({
      updateShapeProperties: {
        objectId: boxId,
        shapeProperties: {
          autofit: {
            autofitType: 'SHAPE_AUTOFIT'
          }
        },
        fields: 'autofit'
      }
    });

    // Make institution names bold
    const boldRanges = this.getInstitutionBoldRanges(candidate, text);
    boldRanges.forEach(range => {
      requests.push({
        updateTextStyle: {
          objectId: boxId,
          textRange: {
            type: 'FIXED_RANGE',
            startIndex: range.start,
            endIndex: range.end
          },
          style: {
            bold: true
          },
          fields: 'bold'
        }
      });
    });

    return requests;
  }

  /**
   * Create experience text box (right column) - Name + Work
   */
  private static createExperienceBox(
    slideId: string,
    boxId: string,
    candidate: CandidateData,
    row: { y: number; h: number }
  ): any[] {
    const requests: any[] = [];
    const layout = this.LAYOUT.experience;

    // Create text box
    requests.push({
      createShape: {
        objectId: boxId,
        shapeType: 'TEXT_BOX',
        elementProperties: {
          pageObjectId: slideId,
          size: {
            width: { magnitude: this.cmToEmu(layout.w), unit: 'EMU' },
            height: { magnitude: this.cmToEmu(row.h), unit: 'EMU' }
          },
          transform: {
            scaleX: 1,
            scaleY: 1,
            translateX: this.cmToEmu(layout.x),
            translateY: this.cmToEmu(row.y),
            unit: 'EMU'
          }
        }
      }
    });

    // Format name + work text
    const text = this.formatExperienceText(candidate);

    // Insert text
    requests.push({
      insertText: {
        objectId: boxId,
        text: text
      }
    });

    // Style the text - default 10pt with autofit
    requests.push({
      updateParagraphStyle: {
        objectId: boxId,
        style: {
          lineSpacing: 100,
          spaceAbove: { magnitude: 0, unit: 'PT' },
          spaceBelow: { magnitude: 0, unit: 'PT' }
        },
        fields: 'lineSpacing,spaceAbove,spaceBelow'
      }
    });

    // Set default font size 10pt
    requests.push({
      updateTextStyle: {
        objectId: boxId,
        style: {
          fontSize: { magnitude: 10, unit: 'PT' }
        },
        fields: 'fontSize'
      }
    });

    // Enable autofit to shrink text if needed
    requests.push({
      updateShapeProperties: {
        objectId: boxId,
        shapeProperties: {
          autofit: {
            autofitType: 'SHAPE_AUTOFIT'
          }
        },
        fields: 'autofit'
      }
    });

    // Make name bold (first line, which is ALL CAPS)
    const nameLength = candidate.name.toUpperCase().length;
    requests.push({
      updateTextStyle: {
        objectId: boxId,
        textRange: {
          type: 'FIXED_RANGE',
          startIndex: 0,
          endIndex: nameLength
        },
        style: {
          bold: true
        },
        fields: 'bold'
      }
    });

    return requests;
  }

  /**
   * Format education text: Institution (bold) then • Degree (not bold)
   */
  private static formatEducationText(candidate: CandidateData): string {
    const lines: string[] = [];

    if (candidate.education.length > 0) {
      candidate.education.forEach(edu => {
        lines.push(edu.institution);
        lines.push(`• ${edu.degree}`);
      });
    } else {
      lines.push('No education listed');
    }

    return lines.join('\n');
  }

  /**
   * Format experience text: NAME (ALL CAPS) then • Company — Role (dates)
   */
  private static formatExperienceText(candidate: CandidateData): string {
    const lines: string[] = [];

    // Name in ALL CAPS
    lines.push(candidate.name.toUpperCase());

    // Work history with dates
    if (candidate.workHistory.length > 0) {
      candidate.workHistory.forEach(work => {
        const datesPart = work.dates ? ` (${work.dates})` : '';
        lines.push(`• ${work.company} — ${work.jobTitle}${datesPart}`);
      });
    } else {
      lines.push('• No work history listed');
    }

    return lines.join('\n');
  }

  /**
   * Get character ranges for institution names (to make them bold)
   */
  private static getInstitutionBoldRanges(
    candidate: CandidateData,
    text: string
  ): Array<{ start: number; end: number }> {
    const ranges: Array<{ start: number; end: number }> = [];
    let currentIndex = 0;

    candidate.education.forEach(edu => {
      const institutionIndex = text.indexOf(edu.institution, currentIndex);
      if (institutionIndex !== -1) {
        ranges.push({
          start: institutionIndex,
          end: institutionIndex + edu.institution.length
        });
        currentIndex = institutionIndex + edu.institution.length;
      }
    });

    return ranges;
  }
}
