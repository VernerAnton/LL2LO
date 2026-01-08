# Template Setup Checklist

## Quick Setup (3 Steps)

### ✅ Step 1: Extract Logo
1. Open your template PPTX file
2. Right-click the **suorahaku-toimisto logo**
3. "Save as Picture..." → save as `suorahaku-logo.png`
4. Move to: `public/assets/suorahaku-logo.png`

### ✅ Step 2: Test Generation
```bash
npm run dev
```
- Upload a test PDF
- Generate slides
- Check if colors and logo look correct

### ✅ Step 3: Fine-tune (if needed)
If colors don't match exactly:
- Open `src/services/slideGenerator.ts`
- Find `defineTemplateMaster()` method (line 172)
- Adjust hex colors on lines 184 and 194

If logo is too big/small:
- Adjust `w` and `h` values on lines 203-204

---

## What Changed

**New Files:**
- `public/assets/` ← Put your logo here
- `public/assets/README.md` ← Logo extraction guide
- `docs/templates/TEMPLATE-SETUP.md` ← Detailed setup guide

**Modified Files:**
- `src/services/slideGenerator.ts` ← Added slide master with your template design

**How It Works:**
Instead of loading your PPTX template, the code now **programmatically recreates** it:
- Yellow background boxes (2 columns)
- Your logo (top-right)
- Same layout coordinates

This achieves the same visual result as using a template!

---

## Optional: Keep Template for Reference

You can still keep your original template PPTX in the repo:
```bash
# Create templates folder
mkdir -p docs/templates

# Add your template (for reference only)
cp /path/to/your/template.pptx docs/templates/suorahaku-template.pptx
```

---

## Need Help?

See `docs/templates/TEMPLATE-SETUP.md` for detailed instructions on:
- Finding exact hex color codes from your template
- Adjusting logo size and position
- Technical details about the slide master approach
