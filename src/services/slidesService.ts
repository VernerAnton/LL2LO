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

  // Conversion: 1 inch = 914400 EMU (English Metric Units)
  private static readonly INCH_TO_EMU = 914400;

  // Layout configuration (in inches, converted to EMU for API)
  private static readonly LAYOUT = {
    education: { x: 0.76, w: 3.94 },   // Left column
    experience: { x: 4.82, w: 5.18 },  // Right column
    rows: [
      { y: 0.72, h: 1.5 },  // Row 1
      { y: 2.41, h: 1.5 },  // Row 2
      { y: 4.16, h: 1.5 },  // Row 3
      { y: 5.9, h: 1.5 },   // Row 4
    ],
  };

  /**
   * Convert inches to EMU
   */
  private static inchToEmu(inches: number): number {
    return Math.round(inches * this.INCH_TO_EMU);
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
   * PHASE 1: Copy template presentation using Drive API
   */
  private static async copyPresentation(
    templateId: string,
    title: string
  ): Promise<string> {
    console.log('📋 Phase 1: Copying template presentation...');

    const response = await window.gapi.client.request({
      path: `https://www.googleapis.com/drive/v3/files/${templateId}/copy`,
      method: 'POST',
      body: { name: title }
    });

    if (!response || !response.result || !response.result.id) {
      throw new Error('Failed to copy template presentation');
    }

    const newPresentationId = response.result.id;
    console.log(`✅ Template copied. New presentation ID: ${newPresentationId}`);

    return newPresentationId;
  }

  /**
   * PHASE 2: Get Slide 2's objectId
   */
  private static async getSlideObjectId(
    presentationId: string,
    slideIndex: number = 1
  ): Promise<string> {
    console.log(`📄 Phase 2: Getting objectId for slide at index ${slideIndex}...`);

    const response = await window.gapi.client.request({
      path: `${this.SLIDES_API_BASE}/presentations/${presentationId}?fields=slides.objectId`,
      method: 'GET'
    });

    const slides = response.result.slides;
    if (!slides || slides.length <= slideIndex) {
      throw new Error(`Template must have at least ${slideIndex + 1} slides`);
    }

    const slideObjectId = slides[slideIndex].objectId;
    console.log(`✅ Slide ${slideIndex + 1} objectId: ${slideObjectId}`);

    return slideObjectId;
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
      console.log('   Template ID:', templateId || 'None (creating blank)');

      let presentationId: string;

      if (templateId) {
        // PHASE 1: Copy the template (Drive API)
        presentationId = await this.copyPresentation(templateId, title);

        // PHASE 2-4: Duplicate slides and add text boxes
        await this.duplicateAndPopulateSlides(presentationId, candidates);
      } else {
        // Fallback: Create blank presentation
        const createResponse = await window.gapi.client.request({
          path: `${this.SLIDES_API_BASE}/presentations`,
          method: 'POST',
          body: { title }
        });

        if (!createResponse || !createResponse.result) {
          throw new Error('No response from Slides API');
        }

        presentationId = createResponse.result.presentationId;
        console.log(`✅ Created blank presentation: ${presentationId}`);

        // Add candidate slides (4 candidates per slide)
        await this.addCandidateSlides(presentationId, candidates);
      }

      // Generate presentation URL
      const presentationUrl = `https://docs.google.com/presentation/d/${presentationId}/edit`;

      console.log(`✅ Presentation ready: ${presentationUrl}`);

      return {
        success: true,
        presentationId,
        presentationUrl
      };

    } catch (error: any) {
      console.error('❌ Failed to create presentation:', error);
      console.error('   Full error object:', JSON.stringify(error, null, 2));
      console.error('   Error body:', error.body);
      console.error('   Error result:', error.result);
      return {
        success: false,
        error: error.result?.error?.message || error.message || 'Unknown error'
      };
    }
  }

  /**
   * PHASE 2-4: Duplicate slides and populate with candidate data
   * Uses original Slide 2 for first batch, duplicates for remaining batches
   */
  private static async duplicateAndPopulateSlides(
    presentationId: string,
    candidates: CandidateData[]
  ): Promise<void> {
    const timestamp = Date.now();

    // PHASE 2: Calculate slides needed
    const candidatesPerSlide = 4;
    const totalSlidesNeeded = Math.ceil(candidates.length / candidatesPerSlide);
    const duplicationsNeeded = Math.max(0, totalSlidesNeeded - 1);

    console.log(`📊 Phase 2: Need ${totalSlidesNeeded} slides for ${candidates.length} candidates`);
    console.log(`   Using original Slide 2 + ${duplicationsNeeded} duplications`);

    // Get Slide 2's objectId
    const slide2ObjectId = await this.getSlideObjectId(presentationId, 1);

    // PHASE 3: Build all requests
    console.log('📝 Phase 3: Building batch requests...');
    const allRequests: any[] = [];

    // Build list of target slide IDs
    const duplicatedSlideIds: string[] = [];
    for (let i = 0; i < duplicationsNeeded; i++) {
      duplicatedSlideIds.push(`candidate_slide_${i}_${timestamp}`);
    }

    const targetSlideIds = [slide2ObjectId, ...duplicatedSlideIds];

    // Add duplication requests (for slides 2, 3, 4, ...)
    duplicatedSlideIds.forEach((newSlideId, index) => {
      console.log(`   Duplication ${index + 1}: ${slide2ObjectId} → ${newSlideId}`);
      allRequests.push({
        duplicateObject: {
          objectId: slide2ObjectId,
          objectIds: {
            [slide2ObjectId]: newSlideId
          }
        }
      });
    });

    // Add text box creation requests for ALL slides
    for (let slideIdx = 0; slideIdx < totalSlidesNeeded; slideIdx++) {
      const startIdx = slideIdx * candidatesPerSlide;
      const candidateBatch = candidates.slice(startIdx, startIdx + candidatesPerSlide);
      const targetSlideId = targetSlideIds[slideIdx];

      console.log(`   Slide ${slideIdx + 1} (${targetSlideId}): ${candidateBatch.length} candidates`);

      candidateBatch.forEach((candidate, rowIdx) => {
        const row = this.LAYOUT.rows[rowIdx];

        // Education box (left column)
        const eduBoxId = `edu_s${slideIdx}_c${rowIdx}_${timestamp}`;
        allRequests.push(...this.createEducationBox(targetSlideId, eduBoxId, candidate, row));

        // Experience box (right column)
        const expBoxId = `exp_s${slideIdx}_c${rowIdx}_${timestamp}`;
        allRequests.push(...this.createExperienceBox(targetSlideId, expBoxId, candidate, row));
      });
    }

    // PHASE 4: Execute single atomic batch
    console.log(`🚀 Phase 4: Executing ${allRequests.length} requests in ONE atomic batch...`);

    try {
      await window.gapi.client.request({
        path: `${this.SLIDES_API_BASE}/presentations/${presentationId}:batchUpdate`,
        method: 'POST',
        body: { requests: allRequests }
      });

      console.log(`✅ All slides created successfully!`);
      console.log(`   ${totalSlidesNeeded} slides with ${candidates.length} total candidates`);
    } catch (error: any) {
      console.error('❌ Batch update failed:', error);
      console.error('   Full error:', JSON.stringify(error, null, 2));
      console.error('   Error body:', error.body);
      console.error('   Total requests:', allRequests.length);
      throw error;
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
    console.log(`  📝 Sending ${requests.length} requests for slide ${slideIndex + 1}...`);

    try {
      await window.gapi.client.request({
        path: `${this.SLIDES_API_BASE}/presentations/${presentationId}:batchUpdate`,
        method: 'POST',
        body: { requests }
      });

      console.log(`  ✅ Slide ${slideIndex + 1} created with ${candidates.length} candidates`);
    } catch (error: any) {
      console.error(`  ❌ Failed to create slide ${slideIndex + 1}:`, error);
      console.error('  Full batch update error:', JSON.stringify(error, null, 2));
      console.error('  Error body:', error.body);
      console.error('  Requests that failed:', JSON.stringify(requests, null, 2));
      throw error;
    }
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
            width: { magnitude: this.inchToEmu(layout.w), unit: 'EMU' },
            height: { magnitude: this.inchToEmu(row.h), unit: 'EMU' }
          },
          transform: {
            scaleX: 1,
            scaleY: 1,
            translateX: this.inchToEmu(layout.x),
            translateY: this.inchToEmu(row.y),
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

    // Set vertical alignment to MIDDLE
    requests.push({
      updateShapeProperties: {
        objectId: boxId,
        shapeProperties: {
          contentAlignment: 'MIDDLE'
        },
        fields: 'contentAlignment'
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
            width: { magnitude: this.inchToEmu(layout.w), unit: 'EMU' },
            height: { magnitude: this.inchToEmu(row.h), unit: 'EMU' }
          },
          transform: {
            scaleX: 1,
            scaleY: 1,
            translateX: this.inchToEmu(layout.x),
            translateY: this.inchToEmu(row.y),
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

    // Set vertical alignment to MIDDLE
    requests.push({
      updateShapeProperties: {
        objectId: boxId,
        shapeProperties: {
          contentAlignment: 'MIDDLE'
        },
        fields: 'contentAlignment'
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
