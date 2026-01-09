# Template Setup Guide

## Overview

The LL2LO generator uses your **template slide as a background image**. Your full template slide (with colors, logo, layout boxes) is exported as a PNG/JPG and used as the background for all generated slides.

## Current Implementation

The slide master is defined in `src/services/slideGenerator.ts:173` using the `defineTemplateMaster()` method, which loads your template image as the slide background.

### What's Included:
- ✅ **Exact template design** (all visual elements preserved)
- ✅ **Company logo** (already positioned in the image)
- ✅ **Colors and styling** (exactly matching your template)
- ✅ **8-box layout** (2 columns × 4 rows)

## Required Setup

### 1. Export Template Slide as Image

**Method 1: Save as Picture (Recommended)**
1. Open your template PPTX file
2. Right-click on the slide thumbnail in the left panel
3. Select **"Save as Picture..."**
4. Choose **PNG format** (better quality)
5. Save as `template-background.png`
6. Move to: `public/assets/template-background.png`

**Method 2: Export via File Menu**
1. Open your template PPTX file
2. File → Export → Change File Type → **PNG** or **JPG**
3. Click "Save As"
4. Select **"Just This One"** (exports current slide only)
5. Save as `template-background.png`
6. Move to: `public/assets/template-background.png`

**Recommended Settings:**
- Format: PNG (best quality) or JPG (smaller file size)
- Resolution: 1920×1080 pixels (standard 16:9 HD)
- File name: `template-background.png`

### 2. Verify File Path

The code expects the background image at:
```
public/assets/template-background.png
```

If you use a different name or format, update `slideGenerator.ts:176`:
```typescript
background: { path: 'assets/template-background.png' }  // Change to your filename
```

## Testing

1. Add your template background to `public/assets/template-background.png`
2. Run the app: `npm run dev`
3. Upload a test PDF and generate slides
4. Check if the background appears correctly
5. Verify text is positioned properly on top of the background

## Keeping Template PPTX (Recommended)

Keep your original template PPTX in `docs/templates/` for easy updates:
```bash
mkdir -p docs/templates
cp /path/to/your/template.pptx docs/templates/suorahaku-template.pptx
```

**Why keep it?**
- If you need to change colors, logo, or layout
- Just update the PPTX and re-export as PNG/JPG
- No code changes needed

## Technical Details

**Why use a background image instead of loading the PPTX?**
- PptxGenJS doesn't support loading external PPTX files as templates
- Background image approach gives pixel-perfect results
- All visual elements (colors, logo, layout) are preserved exactly

**How It Works:**
1. Your template slide is exported as a PNG/JPG image
2. PptxGenJS uses this image as the slide background via `defineSlideMaster()`
3. Text is added on top using coordinates from `layoutConfig.ts`
4. Result: Slides look identical to your template

**Advantages:**
- ✅ **Pixel-perfect accuracy** - exact match to your template
- ✅ **Easy to update** - just re-export the image if template changes
- ✅ **No color matching** - all styling is in the image
- ✅ **Logo already positioned** - everything is in one file
- ✅ **Simple implementation** - one background image instead of complex code

**Limitations:**
- ⚠️ File size: PNG is ~100-500KB (JPG is smaller but lower quality)
- ⚠️ If template changes, must re-export the image
