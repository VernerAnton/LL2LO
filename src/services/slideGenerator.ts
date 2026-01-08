// PPTX slide generation service using PptxGenJS
// Generates 4-up candidate slides from extracted CV data
import PptxGenJS from 'pptxgenjs';
import type { CandidateData } from '../types';
import { layoutConfig } from './layoutConfig';

// Configuration for overflow handling
const OVERFLOW_CONFIG = {
  maxExperienceBullets: 5,   // Limit work history to top 5 roles
  maxEducationChars: 120,    // Warn if education text exceeds this
};

export interface GenerationResult {
  success: boolean;
  count: number;
  error?: string;
}

export class SlideGenerator {
  /**
   * Main function to generate the presentation
   */
  static async generate(candidates: CandidateData[]): Promise<GenerationResult> {
    try {
      // Validate input
      if (!candidates || candidates.length === 0) {
        return {
          success: false,
          count: 0,
          error: 'No candidates to generate. Please extract CV data first.'
        };
      }

      console.log(`📊 Starting presentation generation for ${candidates.length} candidates...`);

      const prs = new PptxGenJS();

      // 1. Set up presentation properties
      prs.layout = 'LAYOUT_WIDE'; // 16:9 widescreen
      prs.author = 'LL2LO - LongList to LibreOffice';
      prs.title = `Candidate Longlist - ${new Date().toLocaleDateString()}`;

      // 2. Process Candidates in Batches of 4
      const totalSlides = Math.ceil(candidates.length / 4);
      let slideCount = 0;

      for (let i = 0; i < candidates.length; i += 4) {
        slideCount++;
        console.log(`📄 Generating slide ${slideCount} of ${totalSlides}...`);

        const group = candidates.slice(i, i + 4);

        // Create a new slide
        const slide = prs.addSlide();

        // 3. Place each candidate in their slot
        group.forEach((candidate, idx) => {
          this.addCandidateToSlide(slide, candidate, idx);
        });
      }

      // 4. Save with descriptive filename
      const filename = `Candidates_${candidates.length}_${new Date().toISOString().slice(0, 10)}.pptx`;
      console.log(`💾 Saving presentation: ${filename}`);
      await prs.writeFile({ fileName: filename });

      console.log(`✅ Presentation generated successfully: ${slideCount} slides, ${candidates.length} candidates`);

      return { success: true, count: candidates.length };

    } catch (error: any) {
      console.error('❌ Generation Error:', error);
      return {
        success: false,
        count: 0,
        error: error.message || 'Unknown error during presentation generation'
      };
    }
  }

  /**
   * Maps a CandidateData object to a specific slot on the slide
   * Uses 2-column layout: Education (left) and Experience (right)
   * Format matches LinkedIn export: Name in CAPS, Company - Job Title dates
   */
  private static addCandidateToSlide(slide: any, candidate: CandidateData, slotIndex: number) {
    if (slotIndex >= layoutConfig.slots.length) return;

    const slot = layoutConfig.slots[slotIndex];
    const { fonts, colors } = layoutConfig;

    // --- DATA PREPARATION ---
    // 1. Experience: Format WorkHistory array into bulleted list
    // Format: Company - Job Title dates
    // Limit to top 5 items to prevent overflow
    const experienceText = candidate.workHistory.length > 0
      ? candidate.workHistory
          .slice(0, OVERFLOW_CONFIG.maxExperienceBullets)
          .map(w => {
            const dateStr = w.dates ? ` ${w.dates}` : '';
            return `${w.company} - ${w.jobTitle}${dateStr}`;
          })
          .join('\n')
      : 'No operational experience found (board positions filtered)';

    // 2. Education: Format Education array
    // Institution on its own line, then bullet with degree below
    const educationText = candidate.education
      .map(e => {
        const dateStr = e.dates ? ` · (${e.dates})` : '';
        return `${e.institution}\n• ${e.degree}${dateStr}`;
      })
      .join('\n');

    // --- LEFT COLUMN: EDUCATION ---
    if (educationText) {
      slide.addText(educationText, {
        x: slot.education.x,
        y: slot.education.y,
        w: slot.education.w,
        h: slot.education.h,
        fontSize: fonts.education,
        color: this.hexToRgb(colors.education),
        fit: 'shrink',
        wrap: true,
        valign: 'top',
        lineSpacing: 12
      });
    }

    // --- RIGHT COLUMN: NAME + EXPERIENCE ---

    // A. NAME (top of right column, in CAPS and bold)
    slide.addText(candidate.name.toUpperCase(), {
      x: slot.experience.x,
      y: slot.experience.y,
      w: slot.experience.w,
      h: 0.25,
      fontSize: fonts.name,
      color: this.hexToRgb(colors.name),
      bold: true,
      fit: 'shrink',
      wrap: true,
      valign: 'top'
    });

    // B. WORK HISTORY (Bulleted List below name)
    // More space for work history since we removed the role line
    slide.addText(experienceText, {
      x: slot.experience.x,
      y: slot.experience.y + 0.30,
      w: slot.experience.w,
      h: slot.experience.h - 0.35, // Use most of the box height minus name
      fontSize: fonts.experience,
      color: this.hexToRgb(colors.experience),
      bullet: true,
      fit: 'shrink',
      wrap: true,
      valign: 'top'
    });
  }

  /**
   * Helper: PptxGenJS wants colors without '#' prefix
   */
  private static hexToRgb(hex: string): string {
    return hex.replace('#', '');
  }
}
