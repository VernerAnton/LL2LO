# Assets Folder

## Required Images

This folder contains all background images used in the presentation generation.

### 1. Template Background Image (`template-background.png`)
Place your full template slide here as `template-background.png`.

**Required:**
- File name: `template-background.png` (or `.jpg`)
- Recommended format: PNG (better quality) or JPG (smaller file size)
- Location: `public/assets/template-background.png`

This image will be used as the background for candidate slides (4-up layout), preserving your template's:
- Colors and styling
- Logo placement
- Layout boxes
- Any other visual elements

### 2. First Slide Background (`first-slide.png`)
Place your intro/title slide background here as `first-slide.png`.

**Required:**
- File name: `first-slide.png` (or `.jpg`)
- Location: `public/assets/first-slide.png`
- This will be the first slide of every generated presentation
- A text box with "LONGLIST\nJob Title\nDate" will be added on top

### 3. Last Slide Background (`last-slide.png`)
Place your conclusion/outro slide background here as `last-slide.png`.

**Required:**
- File name: `last-slide.png` (or `.jpg`)
- Location: `public/assets/last-slide.png`
- This will be the last slide of every generated presentation
- No text boxes will be added (pure background)

## Exporting Template Slide as Image

**From PowerPoint:**
1. Open your template PPTX file
2. Right-click on the slide thumbnail (left panel)
3. Select **"Save as Picture..."**
4. Choose PNG or JPG format
5. Save as `template-background.png`
6. Move to this folder (`public/assets/`)

**Alternative Method:**
1. Open the slide in PowerPoint
2. File → Export → Change File Type → PNG/JPG
3. Select "Just This One" (current slide)
4. Save as `template-background.png`
5. Move to this folder

**Note:** Make sure to export at the correct resolution (1920x1080 for 16:9 slides is recommended for best quality).
