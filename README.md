# LL2LO - LongList to LibreOffice

**Convert CV PDFs to Presentation Slides - Completely Client-Side, Provider-Agnostic**

## Overview

LL2LO (formerly LL2PP) is a web-based tool that automates the extraction of candidate information from CV/resume PDFs and generates professional presentation slides. The project has undergone a strategic architectural pivot from a Google-dependent ecosystem to a **provider-agnostic, client-side architecture**.

## Key Features

- **PDF Parsing**: Extract text and data from CV PDFs (supports both individual CVs and longlist documents)
- **AI-Powered Extraction**: Use LLM APIs (Claude, OpenAI, or compatible providers) to extract structured candidate data
- **Presentation Generation**: Create downloadable `.pptx` files compatible with LibreOffice Impress, Microsoft PowerPoint, and Google Slides
- **Complete Privacy**: All processing happens client-side in your browser - no data leaves your machine except API calls to your chosen LLM provider
- **BYOK (Bring Your Own Key)**: Use your own API keys for complete control and transparency

## Architecture

### Current Status: 🚧 Migration in Progress

We are transitioning from a Google-centric architecture to a universal, provider-agnostic system:

### Old Architecture (Deprecated)
- ❌ Google OAuth (required sign-in)
- ❌ Google Cloud Project ID (user pays billing)
- ❌ Google Slides API (cloud-based presentation generation)
- ❌ Vertex AI/Gemini (Google-specific AI service)

### New Architecture (Target)
- ✅ **No Authentication Required** - Just open and use
- ✅ **BYOK Model** - Bring your own OpenAI/Anthropic API key
- ✅ **Client-Side PPTX Generation** - Uses PptxGenJS or LibreOffice-compatible libraries
- ✅ **localStorage Settings** - No server, no database, just browser storage
- ✅ **Offline-Capable** - Works without internet (after initial load)

## Why the Migration?

### Problems with Google-Bound Architecture
1. **Trust & Safety Barriers**: Requesting Google OAuth scopes for Drive/Slides triggered "phishing" and "credential harvesting" flags
2. **Complex Billing**: Required users to set up Google Cloud Projects with billing enabled
3. **Approval Process**: Needed Google's verification for restricted scopes (weeks/months of delay)
4. **Vendor Lock-In**: Completely dependent on Google's ecosystem

### Benefits of Provider-Agnostic Architecture
1. **Immediate Deployment** - No approval processes, deploy anywhere instantly
2. **User Privacy** - No credentials harvested, all data stays local
3. **Flexibility** - Choose your preferred LLM provider (Claude 3.5 Sonnet, GPT-4, etc.)
4. **Simplicity** - No OAuth flows, no server setup, just a static web app
5. **Universal Compatibility** - Generated `.pptx` files work with all major presentation software

## Technology Stack

### Core Technologies
- **Frontend**: React + TypeScript
- **PDF Processing**: PDF.js (client-side PDF parsing)
- **AI Integration**: Direct REST API calls to OpenAI/Anthropic
- **Presentation Engine**: PptxGenJS (targeting LibreOffice Impress compatibility)
- **Storage**: Browser localStorage

### AI Provider Support (Planned)
- OpenAI (GPT-4, GPT-3.5)
- Anthropic (Claude 3.5 Sonnet, Claude 3 Opus/Haiku)
- Any OpenAI-compatible API endpoint

## Migration Roadmap

### ✅ Phase 1: Cleanup (COMPLETED)
- [x] Remove Google OAuth service
- [x] Remove Google Slides API integration
- [x] Remove Google Cloud Project ID requirements
- [x] Remove API tier system (free/paid Google quotas)
- [x] Rename `geminiService.ts` → `aiService.ts`
- [x] Update branding: "LongList to LibreOffice"

### 🚧 Phase 2: AI Service Refactor (NEXT)
- [ ] Refactor `aiService.ts` to support OpenAI/Anthropic
- [ ] Implement BYOK authentication pattern
- [ ] Add API key validation and error handling
- [ ] Create `LlmKeyInput.tsx` component
- [ ] Update localStorage service for API key management

### 📋 Phase 3: PPTX Generation (PLANNED)
- [ ] Implement `pptxService.ts` using PptxGenJS
- [ ] Design LibreOffice-optimized slide templates
- [ ] Implement candidate data → slide mapping
- [ ] Add download functionality for `.pptx` files
- [ ] Test compatibility with LibreOffice Impress, PowerPoint, Google Slides

### 🎯 Phase 4: Polish & Deploy (PLANNED)
- [ ] Add comprehensive error handling
- [ ] Implement usage analytics (privacy-respecting)
- [ ] Create user documentation
- [ ] Deploy as static site (Netlify, Vercel, GitHub Pages)
- [ ] Add example CVs and demo mode

## Current File Structure

```
src/
├── components/
│   ├── FileUploader.tsx         # PDF file upload interface
│   ├── ManualCopyOutput.tsx     # Fallback text output
│   ├── ParseModeSelector.tsx    # Longlist vs individual mode
│   ├── ProgressIndicator.tsx    # Processing status display
│   └── ThemeToggle.tsx          # Dark/light/system theme
├── services/
│   ├── aiService.ts             # LLM integration (in migration)
│   ├── pdfService.ts            # PDF parsing logic
│   ├── rateLimiter.ts           # API rate limiting
│   └── storageService.ts        # localStorage wrapper
├── types.ts                     # TypeScript type definitions
└── App.tsx                      # Main application component
```

## Development Status

**Current Branch**: `claude/plan-provider-agnostic-migration-5Noxb`

### Recent Changes
- Removed 1,393 lines of Google-specific code
- Deleted 6 Google-dependent components
- Simplified authentication and billing logic
- Prepared codebase for provider-agnostic refactor

### Known Issues
- Build errors expected (Phase 1 cleanup complete, Phase 2 in progress)
- `aiService.ts` still references deleted Google services
- No API key input UI yet
- No PPTX generation implemented yet

## Contributing

This project is currently undergoing active architectural migration. Contributions are welcome, but please coordinate with the maintainer to avoid conflicts with ongoing refactoring work.

## License

[To be determined]

## Contact

For questions or collaboration, please open an issue on GitHub.

---

**Note**: This is a work in progress. The application is being transformed from a Google Workspace add-on into a universal, privacy-first CV processing tool. Check the roadmap above for current status.
