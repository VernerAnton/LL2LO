import { useState, useEffect } from 'react';
import './App.css';
import { ThemeToggle } from './components/ThemeToggle';
import { ApiKeyInput } from './components/ApiKeyInput';
import { TemplateInput } from './components/TemplateInput';
import { ParseModeSelector } from './components/ParseModeSelector';
import { FileUploader } from './components/FileUploader';
import { ProgressIndicator } from './components/ProgressIndicator';
import { GoogleSignIn } from './components/GoogleSignIn';
import { ManualCopyOutput } from './components/ManualCopyOutput';
import { StorageService } from './services/storageService';
import { PDFService } from './services/pdfService';
import { GeminiService } from './services/geminiService';
import { SlidesService } from './services/slidesService';
import { GoogleAuthService, type GoogleAuthState } from './services/googleAuthService';
import type { Theme, ActualTheme, ProcessingStatus, CandidateData, ProcessingError, GeminiModel, ParseMode } from './types';

function App() {
  // Theme state - track both preference and actual theme
  const [themePreference, setThemePreference] = useState<Theme>(() => StorageService.getTheme());
  const [actualTheme, setActualTheme] = useState<ActualTheme>(() => StorageService.getActualTheme());

  // API key state
  const [geminiApiKey, setGeminiApiKey] = useState<string | null>(() =>
    StorageService.getGeminiKey()
  );

  // Template presentation ID state
  const [templateId, setTemplateId] = useState<string | null>(() =>
    StorageService.getTemplateId()
  );

  // File and processing state
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>('idle');
  const [_parsedCVs, setParsedCVs] = useState<any[]>([]);
  const [extractedCandidates, setExtractedCandidates] = useState<CandidateData[]>([]);
  const [failedExtractions, setFailedExtractions] = useState<ProcessingError[]>([]);
  const [progressCurrent, setProgressCurrent] = useState(0);
  const [progressTotal, setProgressTotal] = useState(0);
  const [selectedModel, setSelectedModel] = useState<GeminiModel>('gemini-2.5-flash');

  // Parse mode state
  const [parseMode, setParseMode] = useState<ParseMode>(() =>
    StorageService.getParseMode()
  );

  // Google auth state
  const [googleAuth, setGoogleAuth] = useState<GoogleAuthState>({
    isAuthenticated: false,
    accessToken: null,
    userEmail: null,
  });

  // Slides generation state
  const [generatedSlidesUrl, setGeneratedSlidesUrl] = useState<string | null>(null);
  const [isGeneratingSlides, setIsGeneratingSlides] = useState(false);

  // Reset feedback state
  const [justReset, setJustReset] = useState(false);

  // Initialize Google Auth and Slides API on mount
  useEffect(() => {
    GoogleAuthService.initialize()
      .then(() => {
        console.log('✅ Google Auth initialized');
        // Set up auth state change listener
        GoogleAuthService.onAuthStateChange((state) => {
          setGoogleAuth(state);

          // Initialize Slides API when authenticated
          if (state.isAuthenticated) {
            SlidesService.initialize()
              .then(() => console.log('✅ Google Slides API initialized'))
              .catch((error) => console.error('❌ Failed to initialize Slides API:', error));
          }
        });
      })
      .catch((error) => {
        console.error('❌ Failed to initialize Google Auth:', error);
      });
  }, []);

  // Initialize Gemini when API key is available
  useEffect(() => {
    if (geminiApiKey) {
      GeminiService.initialize(geminiApiKey);
      console.log('✅ Gemini AI initialized');
    }
  }, [geminiApiKey]);

  // Update body class when actual theme changes
  useEffect(() => {
    document.body.className = `${actualTheme}-mode`;
  }, [actualTheme]);

  // Listen for system theme changes when in 'system' mode
  useEffect(() => {
    if (themePreference !== 'system') {
      return; // Only listen when in auto mode
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      const newActualTheme: ActualTheme = e.matches ? 'dark' : 'light';
      setActualTheme(newActualTheme);
    };

    // Add listener for system theme changes
    mediaQuery.addEventListener('change', handleSystemThemeChange);

    // Cleanup listener on unmount or when preference changes
    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, [themePreference]);

  // Theme toggle handler - cycles through: system → light → dark → system
  const handleThemeToggle = () => {
    let newPreference: Theme;

    if (themePreference === 'system') {
      newPreference = 'light';
    } else if (themePreference === 'light') {
      newPreference = 'dark';
    } else {
      newPreference = 'system';
    }

    setThemePreference(newPreference);
    StorageService.saveTheme(newPreference);

    // Update actual theme
    if (newPreference === 'system') {
      setActualTheme(StorageService.getActualTheme());
    } else {
      setActualTheme(newPreference);
    }
  };

  // API key handlers
  const handleSaveApiKey = (key: string) => {
    setGeminiApiKey(key);
    StorageService.saveGeminiKey(key);
  };

  const handleRemoveApiKey = () => {
    setGeminiApiKey(null);
    StorageService.removeGeminiKey();
  };

  // Template handlers
  const handleSaveTemplate = (id: string) => {
    setTemplateId(id);
    StorageService.saveTemplateId(id);
  };

  const handleRemoveTemplate = () => {
    setTemplateId(null);
    StorageService.removeTemplateId();
  };

  // Parse mode handler
  const handleParseModeChange = (mode: ParseMode) => {
    setParseMode(mode);
    StorageService.saveParseMode(mode);
    console.log(`📋 Parse mode changed to: ${mode}`);
  };

  // Google auth handlers
  const handleGoogleSignIn = () => {
    GoogleAuthService.signIn();
  };

  const handleGoogleSignOut = () => {
    GoogleAuthService.signOut();
  };

  // File upload handler
  const handleFileSelect = async (files: File[]) => {
    setUploadedFiles(files);
    setParsedCVs([]);
    setExtractedCandidates([]);
    setFailedExtractions([]);
    setGeneratedSlidesUrl(null);
    setProcessingStatus('idle');
  };

  // Reset handler - clears all processing state
  const handleReset = () => {
    setUploadedFiles([]);
    setParsedCVs([]);
    setExtractedCandidates([]);
    setFailedExtractions([]);
    setProcessingStatus('idle');
    setProgressCurrent(0);
    setProgressTotal(0);
    setGeneratedSlidesUrl(null);
    setIsGeneratingSlides(false);

    // Show reset feedback
    setJustReset(true);
    setTimeout(() => setJustReset(false), 1500);

    // Note: User preferences persist (geminiApiKey, theme, templateId, selectedModel, googleAuth)
  };

  // Parse PDF and extract data handler
  const handleParsePDF = async () => {
    if (uploadedFiles.length === 0) {
      alert('Please upload at least one PDF file first');
      return;
    }

    if (!geminiApiKey) {
      alert('Please enter your Gemini API key first');
      return;
    }

    try {
      // Step 1: Parse PDF(s) based on mode
      setProcessingStatus('parsing');
      setProgressCurrent(0);
      setProgressTotal(0);

      console.log(`📄 Parsing ${uploadedFiles.length} PDF file(s) in ${parseMode} mode...`);

      const allCVs: any[] = [];

      // Parse each file according to the selected mode
      for (let fileIndex = 0; fileIndex < uploadedFiles.length; fileIndex++) {
        const file = uploadedFiles[fileIndex];
        console.log(`\n📄 Processing file ${fileIndex + 1}/${uploadedFiles.length}: ${file.name}`);

        if (parseMode === 'longlist') {
          // LONGLIST MODE: Split multi-CV PDF using "Page 1 of" detection
          const cvs = await PDFService.parseAndSplit(file);
          console.log(`   ✅ Found ${cvs.length} CVs in ${file.name}`);
          allCVs.push(...cvs);
        } else {
          // INDIVIDUAL MODE: Each PDF = 1 CV (no splitting)
          const pageTexts = await PDFService.parsePDF(file);
          const pageCount = await PDFService.getPageCount(file);
          const pageNumbers = Array.from({ length: pageCount }, (_, i) => i + 1);

          const cv = {
            text: pageTexts.join('\n\n'),
            pageNumbers: pageNumbers,
            fileName: file.name
          };

          console.log(`   ✅ Parsed ${file.name} (${pageCount} pages)`);
          allCVs.push(cv);
        }
      }

      setParsedCVs(allCVs);
      setProgressTotal(allCVs.length);

      console.log(`\n✅ Parsing complete! Total CVs to extract: ${allCVs.length}`);

      // Step 2: Extract data using Gemini AI
      setProcessingStatus('extracting');
      setProgressCurrent(0);

      const candidates: CandidateData[] = [];
      const errors: ProcessingError[] = [];

      console.log(`🤖 Starting Gemini extraction for ${allCVs.length} CVs...`);

      for (let i = 0; i < allCVs.length; i++) {
        const cv = allCVs[i];
        console.log(`\n🔍 Extracting CV ${i + 1}/${allCVs.length}...`);

        setProgressCurrent(i + 1);

        const result = await GeminiService.extractCVData(cv.text, selectedModel);

        if (result.success && result.data) {
          candidates.push(result.data);
          console.log(`✅ Extracted: ${result.data.name}`);
          console.log(`   - Work history: ${result.data.workHistory.length} entries`);
          console.log(`   - Education: ${result.data.education.length} entries`);
        } else {
          const error: ProcessingError = {
            candidateIndex: i,
            error: result.error || 'Unknown error',
            rawText: cv.text,
          };
          errors.push(error);
          console.error(`❌ Failed to extract CV ${i + 1}: ${result.error}`);
        }
      }

      setExtractedCandidates(candidates);
      setFailedExtractions(errors);
      setProcessingStatus('done');

      console.log('\n════════════════════════════════════════');
      console.log(`✅ Extraction complete!`);
      console.log(`   - Successful: ${candidates.length}/${allCVs.length}`);
      console.log(`   - Failed: ${errors.length}/${allCVs.length}`);
      console.log('════════════════════════════════════════');

      if (errors.length > 0) {
        console.warn('\n⚠️ Failed extractions:');
        errors.forEach((err) => {
          console.warn(`   CV ${err.candidateIndex + 1}: ${err.error}`);
        });
      }

    } catch (error) {
      console.error('❌ Error during processing:', error);
      setProcessingStatus('error');
      alert('Error during processing: ' + (error as Error).message);
    }
  };

  // Generate Google Slides handler
  const handleGenerateSlides = async () => {
    if (!googleAuth.isAuthenticated) {
      alert('Please sign in with Google first');
      return;
    }

    if (extractedCandidates.length === 0) {
      alert('No candidates to generate slides for');
      return;
    }

    try {
      setIsGeneratingSlides(true);
      setProcessingStatus('generating');
      console.log(`📊 Generating Google Slides for ${extractedCandidates.length} candidates...`);

      const result = await SlidesService.createPresentation(
        extractedCandidates,
        `CV Candidates - ${new Date().toLocaleDateString()}`,
        templateId || undefined // Pass template ID if available
      );

      if (result.success && result.presentationUrl) {
        setGeneratedSlidesUrl(result.presentationUrl);
        setProcessingStatus('done');
        console.log(`✅ Presentation created: ${result.presentationUrl}`);
      } else {
        throw new Error(result.error || 'Failed to create presentation');
      }

    } catch (error) {
      console.error('❌ Error generating slides:', error);
      setProcessingStatus('error');
      alert('Error generating slides: ' + (error as Error).message);
    } finally {
      setIsGeneratingSlides(false);
    }
  };

  const borderColor = actualTheme === 'dark' ? '#e0e0e0' : '#2a2a2a';
  const bgColor = actualTheme === 'dark' ? '#2a2a2a' : '#fefdfb';
  const textColor = actualTheme === 'dark' ? '#e0e0e0' : '#2a2a2a';

  const canProcess = uploadedFiles.length > 0 && geminiApiKey && processingStatus === 'idle';

  return (
    <div className="container">
      <div className="header">
        <ThemeToggle
          themePreference={themePreference}
          actualTheme={actualTheme}
          onToggle={handleThemeToggle}
        />
        <div className="title">════ LL2PP ════</div>
        <button
          className="reset-button"
          onClick={handleReset}
          title="Reset application"
          style={{
            borderColor: justReset ? '#4CAF50' : undefined,
            color: justReset ? '#4CAF50' : undefined,
            transition: 'all 0.3s ease'
          }}
        >
          {justReset ? '[ ✓ CLEARED ]' : '[ ↻ RESET ]'}
        </button>
      </div>

      <div className="subtitle">
        [ LongList to Presentation - Convert CV PDFs to Google Slides ]
      </div>

      <ApiKeyInput
        existingKey={geminiApiKey}
        onSave={handleSaveApiKey}
        onRemove={handleRemoveApiKey}
        theme={actualTheme}
      />

      <GoogleSignIn
        isAuthenticated={googleAuth.isAuthenticated}
        userEmail={googleAuth.userEmail}
        onSignIn={handleGoogleSignIn}
        onSignOut={handleGoogleSignOut}
        theme={actualTheme}
      />

      <TemplateInput
        existingTemplateId={templateId}
        onSave={handleSaveTemplate}
        onRemove={handleRemoveTemplate}
        theme={actualTheme}
      />

      <ParseModeSelector
        mode={parseMode}
        onModeChange={handleParseModeChange}
        theme={actualTheme}
      />

      <FileUploader
        onFileSelect={handleFileSelect}
        theme={actualTheme}
        disabled={processingStatus !== 'idle' && processingStatus !== 'done' && processingStatus !== 'error'}
      />

      {/* AI Model Selector */}
      {uploadedFiles.length > 0 && geminiApiKey && (
        <div style={{
          padding: '1.5rem',
          border: `2px solid ${borderColor}`,
          background: bgColor,
          boxShadow: `4px 4px 0px ${borderColor}`,
          marginBottom: '1.5rem'
        }}>
          <div style={{
            fontSize: '0.875rem',
            fontWeight: 'bold',
            marginBottom: '1rem',
            letterSpacing: '0.1em',
            color: textColor
          }}>
            [ 🤖 SELECT AI MODEL ]
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => setSelectedModel('gemini-2.5-flash')}
              style={{
                padding: '0.75rem 1.5rem',
                background: selectedModel === 'gemini-2.5-flash' ? textColor : 'none',
                border: `2px solid ${borderColor}`,
                color: selectedModel === 'gemini-2.5-flash' ? bgColor : textColor,
                fontFamily: 'Courier New, monospace',
                fontWeight: 'bold',
                cursor: 'pointer',
                letterSpacing: '0.1em',
                fontSize: '0.875rem'
              }}
            >
              2.5 FLASH
            </button>

            <button
              onClick={() => setSelectedModel('gemini-2.5-pro')}
              style={{
                padding: '0.75rem 1.5rem',
                background: selectedModel === 'gemini-2.5-pro' ? textColor : 'none',
                border: `2px solid ${borderColor}`,
                color: selectedModel === 'gemini-2.5-pro' ? bgColor : textColor,
                fontFamily: 'Courier New, monospace',
                fontWeight: 'bold',
                cursor: 'pointer',
                letterSpacing: '0.1em',
                fontSize: '0.875rem'
              }}
            >
              2.5 PRO
            </button>

            <button
              onClick={() => setSelectedModel('gemini-3-pro-preview')}
              style={{
                padding: '0.75rem 1.5rem',
                background: selectedModel === 'gemini-3-pro-preview' ? textColor : 'none',
                border: `2px solid ${borderColor}`,
                color: selectedModel === 'gemini-3-pro-preview' ? bgColor : textColor,
                fontFamily: 'Courier New, monospace',
                fontWeight: 'bold',
                cursor: 'pointer',
                letterSpacing: '0.1em',
                fontSize: '0.875rem'
              }}
            >
              3.0 PRO 🆕
            </button>
          </div>

          <div style={{
            fontSize: '0.75rem',
            opacity: 0.6,
            marginTop: '0.75rem',
            textAlign: 'center',
            color: textColor
          }}>
            {selectedModel === 'gemini-2.5-flash' && '⚡ Fast processing, good for most CVs'}
            {selectedModel === 'gemini-2.5-pro' && '🎯 More reliable extraction, slower'}
            {selectedModel === 'gemini-3-pro-preview' && '🚀 Latest model, best accuracy (Nov 2025)'}
          </div>
        </div>
      )}

      <ProgressIndicator
        status={processingStatus}
        current={progressCurrent}
        total={progressTotal}
        theme={actualTheme}
      />

      {uploadedFiles.length > 0 && geminiApiKey && (
        <div style={{
          padding: '1.5rem',
          border: `2px solid ${borderColor}`,
          background: bgColor,
          boxShadow: `4px 4px 0px ${borderColor}`,
          marginBottom: '1.5rem',
          textAlign: 'center'
        }}>
          <button
            onClick={handleParsePDF}
            disabled={!canProcess}
            style={{
              padding: '1rem 2rem',
              background: 'none',
              border: `2px solid ${borderColor}`,
              color: textColor,
              fontFamily: 'Courier New, monospace',
              fontWeight: 'bold',
              cursor: canProcess ? 'pointer' : 'not-allowed',
              letterSpacing: '0.1em',
              fontSize: '1rem',
              opacity: canProcess ? 1 : 0.5
            }}
          >
            [ 🚀 PROCESS CVs ]
          </button>
          <div style={{
            fontSize: '0.75rem',
            opacity: 0.6,
            marginTop: '0.5rem',
            color: textColor
          }}>
            Parse PDF(s) + Extract with Gemini AI
          </div>
        </div>
      )}

      {/* Generate Slides Button - MOVED ABOVE candidates list for easier access */}
      {extractedCandidates.length > 0 && !generatedSlidesUrl && (
        <div style={{
          padding: '1.5rem',
          border: `2px solid ${borderColor}`,
          background: bgColor,
          boxShadow: `4px 4px 0px ${borderColor}`,
          marginBottom: '1.5rem',
          textAlign: 'center'
        }}>
          <button
            onClick={handleGenerateSlides}
            disabled={!googleAuth.isAuthenticated || isGeneratingSlides}
            style={{
              padding: '1rem 2rem',
              background: 'none',
              border: `2px solid ${borderColor}`,
              color: textColor,
              fontFamily: 'Courier New, monospace',
              fontWeight: 'bold',
              cursor: (googleAuth.isAuthenticated && !isGeneratingSlides) ? 'pointer' : 'not-allowed',
              letterSpacing: '0.1em',
              fontSize: '1rem',
              opacity: (googleAuth.isAuthenticated && !isGeneratingSlides) ? 1 : 0.5
            }}
          >
            {isGeneratingSlides ? '[ ⏳ GENERATING... ]' : '[ 📊 GENERATE GOOGLE SLIDES ]'}
          </button>
          <div style={{
            fontSize: '0.75rem',
            opacity: 0.6,
            marginTop: '0.5rem',
            color: textColor
          }}>
            {googleAuth.isAuthenticated
              ? `Create presentation with ${extractedCandidates.length} candidates`
              : 'Sign in with Google to generate slides'}
          </div>
        </div>
      )}

      {/* Generated Slides URL */}
      {generatedSlidesUrl && (
        <div style={{
          padding: '1.5rem',
          border: `2px solid #4CAF50`,
          background: bgColor,
          boxShadow: `4px 4px 0px #4CAF50`,
          marginBottom: '1.5rem'
        }}>
          <div style={{
            fontSize: '0.875rem',
            fontWeight: 'bold',
            marginBottom: '1rem',
            letterSpacing: '0.1em',
            color: '#4CAF50'
          }}>
            [ ✅ PRESENTATION CREATED ]
          </div>
          <a
            href={generatedSlidesUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#4CAF50',
              textDecoration: 'underline',
              fontSize: '0.875rem',
              fontFamily: 'Courier New, monospace',
              wordBreak: 'break-all'
            }}
          >
            {generatedSlidesUrl}
          </a>
          <div style={{
            fontSize: '0.75rem',
            opacity: 0.6,
            marginTop: '0.5rem',
            color: textColor
          }}>
            Click to open in Google Slides
          </div>
        </div>
      )}

      {extractedCandidates.length > 0 && (
        <div style={{
          padding: '1.5rem',
          border: `2px solid ${borderColor}`,
          background: bgColor,
          boxShadow: `4px 4px 0px ${borderColor}`,
          marginBottom: '1.5rem'
        }}>
          <div style={{
            fontSize: '0.875rem',
            fontWeight: 'bold',
            marginBottom: '1rem',
            letterSpacing: '0.1em',
            color: textColor
          }}>
            [ ✅ EXTRACTED CANDIDATES: {extractedCandidates.length} ]
          </div>
          {extractedCandidates.map((candidate, index) => (
            <div
              key={index}
              style={{
                padding: '1rem',
                border: `1px solid ${borderColor}`,
                marginBottom: '1rem',
                background: actualTheme === 'dark' ? '#1a1a1a' : '#fff'
              }}
            >
              <div style={{
                fontWeight: 'bold',
                fontSize: '1rem',
                marginBottom: '0.75rem',
                color: textColor
              }}>
                {index + 1}. {candidate.name}
              </div>

              {/* Work History */}
              <div style={{
                marginBottom: '0.75rem'
              }}>
                <div style={{
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  marginBottom: '0.25rem',
                  color: textColor,
                  opacity: 0.8
                }}>
                  WORK HISTORY:
                </div>
                {candidate.workHistory.length > 0 ? (
                  candidate.workHistory.map((work, wIdx) => (
                    <div
                      key={wIdx}
                      style={{
                        fontSize: '0.75rem',
                        marginLeft: '1rem',
                        marginBottom: '0.25rem',
                        color: textColor,
                        opacity: 0.7
                      }}
                    >
                      • {work.jobTitle} at {work.company}
                      {work.dates && ` (${work.dates})`}
                    </div>
                  ))
                ) : (
                  <div style={{
                    fontSize: '0.75rem',
                    marginLeft: '1rem',
                    color: textColor,
                    opacity: 0.5
                  }}>
                    No work history found
                  </div>
                )}
              </div>

              {/* Education */}
              <div>
                <div style={{
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  marginBottom: '0.25rem',
                  color: textColor,
                  opacity: 0.8
                }}>
                  EDUCATION:
                </div>
                {candidate.education.length > 0 ? (
                  candidate.education.map((edu, eIdx) => (
                    <div
                      key={eIdx}
                      style={{
                        fontSize: '0.75rem',
                        marginLeft: '1rem',
                        marginBottom: '0.25rem',
                        color: textColor,
                        opacity: 0.7
                      }}
                    >
                      • {edu.degree} from {edu.institution}
                      {edu.dates && ` (${edu.dates})`}
                    </div>
                  ))
                ) : (
                  <div style={{
                    fontSize: '0.75rem',
                    marginLeft: '1rem',
                    color: textColor,
                    opacity: 0.5
                  }}>
                    No education found
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Manual Copy Output */}
      {extractedCandidates.length > 0 && (
        <ManualCopyOutput
          candidates={extractedCandidates}
          theme={actualTheme}
        />
      )}

      {failedExtractions.length > 0 && (
        <div style={{
          padding: '1.5rem',
          border: `2px solid #ff6b6b`,
          background: bgColor,
          boxShadow: `4px 4px 0px #ff6b6b`,
          marginBottom: '1.5rem'
        }}>
          <div style={{
            fontSize: '0.875rem',
            fontWeight: 'bold',
            marginBottom: '1rem',
            letterSpacing: '0.1em',
            color: '#ff6b6b'
          }}>
            [ ⚠️ FAILED EXTRACTIONS: {failedExtractions.length} ]
          </div>
          {failedExtractions.map((error, index) => (
            <div
              key={index}
              style={{
                padding: '1rem',
                border: `1px solid #ff6b6b`,
                marginBottom: '0.5rem',
                background: actualTheme === 'dark' ? '#1a1a1a' : '#fff'
              }}
            >
              <div style={{
                fontWeight: 'bold',
                marginBottom: '0.5rem',
                color: textColor
              }}>
                CV {error.candidateIndex + 1}
                {error.candidateName && ` - ${error.candidateName}`}
              </div>
              <div style={{
                fontSize: '0.75rem',
                color: '#ff6b6b'
              }}>
                Error: {error.error}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="footer">
        [ Phase 2: ✅ PDF Parsing | ✅ Gemini Extraction | ✅ Google Slides | Ready to Test! ]
      </div>
    </div>
  );
}

export default App;
