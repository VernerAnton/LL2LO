# Template Setup Checklist

## Quick Setup (2 Steps)

### ✅ Step 1: Export Template Slide as Image
1. Open your template PPTX file
2. Right-click on the slide (in slide panel)
3. **"Save as Picture..."** → save as `template-background.png`
4. Move to: `public/assets/template-background.png`

**Tip:** Export as PNG for best quality, or JPG for smaller file size.

### ✅ Step 2: Test Generation
```bash
npm run dev
```
- Upload a test PDF
- Generate slides
- Verify the template background appears correctly with text on top

---

## What Changed

**New Files:**
- `public/assets/` ← Put your template background image here
- `public/assets/README.md` ← Image export instructions
- `docs/templates/TEMPLATE-SETUP.md` ← Detailed setup guide

**Modified Files:**
- `src/services/slideGenerator.ts` ← Uses template image as slide background

**How It Works:**
1. You export your template slide as a PNG/JPG image
2. The image is used as the background for all slides
3. Text is placed on top using the same layout coordinates
4. Result: Perfect match to your original template!

**Benefits:**
- ✅ Exact colors - no need to match hex codes
- ✅ Exact logo position - already in the image
- ✅ Exact layout - everything preserved
- ✅ Simple to update - just re-export the image

---

## Optional: Keep Template PPTX for Reference

You can keep your original template PPTX in the repo for future reference:
```bash
# Create templates folder
mkdir -p docs/templates

# Add your template (for reference only)
cp /path/to/your/template.pptx docs/templates/suorahaku-template.pptx
```

This way you always have the source file if you need to make changes and re-export.

---

## Need Help?

See `docs/templates/TEMPLATE-SETUP.md` for detailed instructions on exporting the slide image.
