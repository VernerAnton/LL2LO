import { useState, useEffect } from 'react';
import './App.css';
import { ThemeToggle } from './components/ThemeToggle';
import { ApiKeyInput } from './components/ApiKeyInput';
import { TemplateInput } from './components/TemplateInput';
import { FileUploader } from './components/FileUploader';
import { ProgressIndicator } from './components/ProgressIndicator';
import { GoogleSignIn } from './components/GoogleSignIn';
import { ManualCopyOutput } from './components/ManualCopyOutput';
import { StorageService } from './services/storageService';
import { PDFService } from './services/pdfService';
import { GeminiService } from './services/geminiService';
import { SlidesService } from './services/slidesService';
import { GoogleAuthService, type GoogleAuthState } from './services/googleAuthService';
import type { Theme, ActualTheme, ProcessingStatus, CandidateData, ProcessingError, GeminiModel } from './types';

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
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>('idle');
  const [_parsedCVs, setParsedCVs] = useState<any[]>([]);
  const [extractedCandidates, setExtractedCandidates] = useState<CandidateData[]>([]);
  const [failedExtractions, setFailedExtractions] = useState<ProcessingError[]>([]);
  const [progressCurrent, setProgressCurrent] = useState(0);
  const [progressTotal, setProgressTotal] = useState(0);
  const [selectedModel, setSelectedModel] = useState<GeminiModel>('gemini-2.5-flash');

  // Google auth state
  const [googleAuth, setGoogleAuth] = useState<GoogleAuthState>({
    isAuthenticated: false,
    accessToken: null,
    userEmail: null,
  });

  // Slides generation state
  const [generatedSlidesUrl, setGeneratedSlidesUrl] = useState<string | null>(null);
  const [isGeneratingSlides, setIsGeneratingSlides] = useState(false);

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

  // Google auth handlers
  const handleGoogleSignIn = () => {
    GoogleAuthService.signIn();
  };

  const handleGoogleSignOut = () => {
    GoogleAuthService.signOut();
  };

  // File upload handler
  const handleFileSelect = async (file: File) => {
    setUploadedFile(file);
    setParsedCVs([]);
    setExtractedCandidates([]);
    setFailedExtractions([]);
    setGeneratedSlidesUrl(null);
    setProcessingStatus('idle');
  };

  // Parse PDF and extract data handler
  const handleParsePDF = async () => {
    if (!uploadedFile) {
      alert('Please upload a PDF file first');
      return;
    }

    if (!geminiApiKey) {
      alert('Please enter your Gemini API key first');
      return;
    }

    try {
      // Step 1: Parse PDF
      setProcessingStatus('parsing');
      setProgressCurrent(0);
      setProgressTotal(0);

      console.log('📄 Parsing PDF...');
      const cvs = await PDFService.parseAndSplit(uploadedFile);

      setParsedCVs(cvs);
      setProgressTotal(cvs.length);

      console.log(`✅ Parsing complete! Found ${cvs.length} CVs`);

      // Step 2: Extract data using Gemini AI
      setProcessingStatus('extracting');
      setProgressCurrent(0);

      const candidates: CandidateData[] = [];
      const errors: ProcessingError[] = [];

      console.log(`🤖 Starting Gemini extraction for ${cvs.length} CVs...`);

      for (let i = 0; i < cvs.length; i++) {
        const cv = cvs[i];
        console.log(`\n🔍 Extracting CV ${i + 1}/${cvs.length}...`);

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
      console.log(`   - Successful: ${candidates.length}/${cvs.length}`);
      console.log(`   - Failed: ${errors.length}/${cvs.length}`);
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

  const canProcess = uploadedFile && geminiApiKey && processingStatus === 'idle';

  return (
    <div className="container">
      <div className="header">
        <ThemeToggle
          themePreference={themePreference}
          actualTheme={actualTheme}
          onToggle={handleThemeToggle}
        />
        <div className="title">════ LL2PP ════</div>
        <div style={{ width: '80px' }}></div>
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

      <FileUploader
        onFileSelect={handleFileSelect}
        theme={actualTheme}
        disabled={processingStatus !== 'idle' && processingStatus !== 'done' && processingStatus !== 'error'}
      />

      {/* AI Model Selector */}
      {uploadedFile && geminiApiKey && (
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

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
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
              FLASH (Fast)
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
              PRO (Accurate)
            </button>
          </div>

          <div style={{
            fontSize: '0.75rem',
            opacity: 0.6,
            marginTop: '0.75rem',
            textAlign: 'center',
            color: textColor
          }}>
            {selectedModel === 'gemini-2.5-flash'
              ? '⚡ Faster processing, may require retries for some CVs'
              : '🎯 More reliable extraction, slower processing'}
          </div>
        </div>
      )}

      <ProgressIndicator
        status={processingStatus}
        current={progressCurrent}
        total={progressTotal}
        theme={actualTheme}
      />

      {uploadedFile && geminiApiKey && (
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
            Parse PDF + Extract with Gemini AI
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
