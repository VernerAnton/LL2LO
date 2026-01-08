# Template Folder

## 📋 Purpose

This folder is for **reference templates** only. The app generates slides programmatically using PptxGenJS.

### Optional: Store Your Template Here

You can place your 4-up candidate slide template here as a visual reference:

1. **Filename**: `template.pptx` (for consistency)
2. **Format**: PowerPoint `.pptx` file
3. **Purpose**: Visual reference for layout and styling

### How the App Works

The app does **NOT** load your template file. Instead, it:
1. Creates slides from scratch using PptxGenJS
2. Uses coordinates defined in `src/services/layoutConfig.ts`
3. Generates a 4-up grid layout (2 columns × 2 rows)
4. Fills in candidate data programmatically

### Customizing the Layout

To match your template's look:

1. **Coordinates**: Edit `src/services/layoutConfig.ts`
   - Adjust `slots` positions (x, y, w, h in inches)
   - Modify colors (hex values)
   - Change font sizes

2. **Styling**: The generated slides will have:
   - Candidate name (bold, dark gray)
   - Current role (medium gray)
   - Work history (bulleted list, light gray)
   - Education (footer, lightest gray)

### Generated Output

The app creates: `Candidates_[count]_[date].pptx`

This file is compatible with:
- LibreOffice Impress
- Microsoft PowerPoint
- Google Slides (via upload)
