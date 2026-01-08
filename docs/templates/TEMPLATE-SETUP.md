# Template Setup Guide

## Overview

The LL2LO generator uses a **programmatic slide master** to recreate your template design. Since PptxGenJS cannot load external PPTX files, the template's visual elements (colors, logo, layout) are defined in code.

## Current Implementation

The slide master is defined in `src/services/slideGenerator.ts` using the `defineTemplateMaster()` method.

### What's Included:
- ✅ **Yellow/cream background boxes** (2-column layout)
- ✅ **Company logo** (top-right corner)
- ✅ **Precise coordinates** matching your template design
- ✅ **8-box layout** (2 columns × 4 rows)

## Required Setup

### 1. Extract Logo from Template

1. Open your template PPTX file (`suorahaku-template.pptx`)
2. Right-click on the **suorahaku-toimisto logo**
3. Select **"Save as Picture..."**
4. Save as `suorahaku-logo.png` (PNG with transparent background preferred)
5. Place in: `/public/assets/suorahaku-logo.png`

### 2. Verify Logo Path

The code expects the logo at:
```
public/assets/suorahaku-logo.png
```

If you use a different name or format (`.jpg`), update `slideGenerator.ts:205`:
```typescript
path: 'assets/suorahaku-logo.png'  // Change to your filename
```

### 3. Adjust Colors (Optional)

If the yellow/cream colors don't match your template exactly, adjust the hex codes in `slideGenerator.ts:184` and `slideGenerator.ts:194`:

```typescript
// Left column (Education)
fill: { color: 'FFF9E6' }  // Light yellow/cream

// Right column (Experience)
fill: { color: 'FFFEF5' }  // Very light yellow/cream
```

**How to find hex codes:**
1. Open your template in PowerPoint
2. Click on a yellow box
3. Format Shape → Fill → More Colors → Custom
4. Copy the hex code (without #)

### 4. Adjust Logo Size/Position (Optional)

If the logo appears too large/small or misaligned, adjust in `slideGenerator.ts:201-204`:

```typescript
{
  image: {
    x: 9.5,    // Horizontal position (inches from left)
    y: 0.3,    // Vertical position (inches from top)
    w: 1.0,    // Width in inches
    h: 0.4,    // Height in inches
    path: 'assets/suorahaku-logo.png'
  }
}
```

## Testing

1. Add your logo to `public/assets/suorahaku-logo.png`
2. Run the app: `npm run dev`
3. Generate a test presentation
4. Check if colors and logo match your template
5. Adjust colors/position if needed

## Reference Template (Optional)

You can still keep your original template PPTX in `docs/templates/` for reference:
- `docs/templates/suorahaku-template.pptx` ← Your original design reference

This helps when you need to check exact colors, spacing, or logo placement.

## Technical Details

**Why not load the PPTX directly?**
- PptxGenJS (the library we use) doesn't support loading external PPTX files as templates
- It's designed to generate presentations from scratch
- The slide master approach recreates your design programmatically

**Advantages:**
- ✅ Same visual result as using a template
- ✅ Full control over styling
- ✅ No external dependencies
- ✅ Logo and colors always consistent
- ✅ Easy to modify colors/logo programmatically

**Limitations:**
- ⚠️ Requires manual color/position adjustments if template changes
- ⚠️ Logo must be extracted as a separate image file
