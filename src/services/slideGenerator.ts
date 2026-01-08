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
      const prs = new PptxGenJS();

      // 1. Set up presentation properties
      prs.layout = 'LAYOUT_WIDE'; // 16:9 widescreen
      prs.author = 'LL2LO - LongList to LibreOffice';
      prs.title = `Candidate Longlist - ${new Date().toLocaleDateString()}`;

      // 2. Process Candidates in Batches of 4
      for (let i = 0; i < candidates.length; i += 4) {
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
   */
  private static addCandidateToSlide(slide: any, candidate: CandidateData, slotIndex: number) {
    if (slotIndex >= layoutConfig.slots.length) return;

    const slot = layoutConfig.slots[slotIndex];
    const { fonts, colors } = layoutConfig;

    // --- DATA PREPARATION ---
    // 1. Role: Use the most recent job title
    const currentRole = candidate.workHistory[0]?.jobTitle || 'Candidate';

    // 2. Experience: Format WorkHistory array into bulleted list
    // Limit to top 5 items to prevent overflow
    const experienceText = candidate.workHistory
      .slice(0, OVERFLOW_CONFIG.maxExperienceBullets)
      .map(w => {
        const dateStr = w.dates ? ` (${w.dates})` : '';
        return `${w.jobTitle} at ${w.company}${dateStr}`;
      })
      .join('\n');

    // 3. Education: Format Education array
    // Institution on its own line, then bullet with degree below
    const educationText = candidate.education
      .map(e => {
        const dateStr = e.dates ? ` · (${e.dates})` : '';
        return `${e.institution}\n• ${e.degree}${dateStr}`;
      })
      .join('\n');

    // --- DRAWING TEXT BOXES ---

    // A. NAME
    slide.addText(candidate.name, {
      x: slot.x,
      y: slot.y,
      w: slot.w,
      h: 0.3,
      fontSize: fonts.name,
      color: this.hexToRgb(colors.name),
      bold: true,
      fit: 'shrink', // Auto-shrink text if name is long
      valign: 'bottom'
    });

    // B. ROLE (Below Name)
    slide.addText(currentRole, {
      x: slot.x,
      y: slot.y + 0.32,
      w: slot.w,
      h: 0.25,
      fontSize: fonts.role,
      color: this.hexToRgb(colors.role),
      fit: 'shrink',
      valign: 'top'
    });

    // C. EXPERIENCE (Bulleted List)
    if (experienceText) {
      slide.addText(experienceText, {
        x: slot.x,
        y: slot.y + 0.60,
        w: slot.w,
        h: 0.65,
        fontSize: fonts.experience,
        color: this.hexToRgb(colors.experience),
        bullet: true,
        fit: 'shrink', // Shrinks list to fit box
        wrap: true,
        valign: 'top'
      });
    }

    // D. EDUCATION (Footer - no bullets, custom formatting)
    if (educationText) {
      slide.addText(educationText, {
        x: slot.x,
        y: slot.y + 1.25,
        w: slot.w,
        h: 0.25,
        fontSize: fonts.education,
        color: this.hexToRgb(colors.education),
        fit: 'shrink',
        valign: 'bottom',
        lineSpacing: 10 // Tighter line spacing for education
      });
    }
  }

  /**
   * Helper: PptxGenJS wants colors without '#' prefix
   */
  private static hexToRgb(hex: string): string {
    return hex.replace('#', '');
  }
}
