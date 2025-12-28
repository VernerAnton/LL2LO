import { useState, useEffect } from 'react';
import './App.css';
import { ThemeToggle } from './components/ThemeToggle';
import { ProjectIdInput } from './components/ProjectIdInput';
// Removed unused imports
// import { TemplateInput } from './components/TemplateInput'; 
import { ParseModeSelector } from './components/ParseModeSelector';
import { ApiTierSelector } from './components/ApiTierSelector';
import { FileUploader } from './components/FileUploader';
import { ProgressIndicator } from './components/ProgressIndicator';
import { GoogleSignIn } from './components/GoogleSignIn';
import { ManualCopyOutput } from './components/ManualCopyOutput';
import { StorageService } from './services/storageService';
import { PDFService } from './services/pdfService';
import { GeminiService } from './services/geminiService';
import { SlidesService } from './services/slidesService';
import { GoogleAuthService, type GoogleAuthState } from './services/googleAuthService';
import type { Theme, ActualTheme, ProcessingStatus, CandidateData, ProcessingError, GeminiModel, ParseMode, ApiTier } from './types';

function App() {
  const [themePreference, setThemePreference] = useState<Theme>(() => StorageService.getTheme());
  const [actualTheme, setActualTheme] = useState<ActualTheme>(() => StorageService.getActualTheme());

  const [userProjectId, setUserProjectId] = useState<string | null>(null);
  
  // Removed unused templateId variable
  // const templateId = null; 

  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>('idle');
  const [_parsedCVs, setParsedCVs] = useState<any[]>([]);
  const [extractedCandidates, setExtractedCandidates] = useState<CandidateData[]>([]);
  const [failedExtractions, setFailedExtractions] = useState<ProcessingError[]>([]);
  const [progressCurrent, setProgressCurrent] = useState(0);
  const [progressTotal, setProgressTotal] = useState(0);
  
  // Removed unused setSelectedModel since selectedModel is never updated in UI
  const [selectedModel] = useState<GeminiModel>('gemini-2.5-flash'); 
  
  const [parseMode, setParseMode] = useState<ParseMode>(() => StorageService.getParseMode());
  const [apiTier, setApiTier] = useState<ApiTier>(() => StorageService.getApiTier());
  
  const [googleAuth, setGoogleAuth] = useState<GoogleAuthState>({
    isAuthenticated: false,
    accessToken: null,
    userEmail: null,
  });

  const [generatedSlidesUrl, setGeneratedSlidesUrl] = useState<string | null>(null);
  const [isGeneratingSlides, setIsGeneratingSlides] = useState(false);
  const [justReset, setJustReset] = useState(false);
  const [fileUploaderKey, setFileUploaderKey] = useState(0);

  useEffect(() => {
    GoogleAuthService.initialize()
      .then(() => {
        console.log('✅ Google Auth initialized');
        GoogleAuthService.onAuthStateChange((state) => {
          setGoogleAuth(state);
          if (state.isAuthenticated) {
            SlidesService.initialize().catch(console.error);
          }
        });
      })
      .catch((error) => console.error('❌ Failed to initialize Google Auth:', error));
  }, []);

  useEffect(() => {
    if (userProjectId) {
      GeminiService.setUserProjectId(userProjectId);
    }
  }, [userProjectId]);

  useEffect(() => {
    GeminiService.setApiTier(apiTier);
  }, [apiTier]);

  useEffect(() => {
    document.body.className = `${actualTheme}-mode`;
  }, [actualTheme]);

  useEffect(() => {
    if (themePreference !== 'system') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => setActualTheme(e.matches ? 'dark' : 'light');
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [themePreference]);

  const handleThemeToggle = () => {
    let newPreference: Theme;
    if (themePreference === 'system') newPreference = 'light';
    else if (themePreference === 'light') newPreference = 'dark';
    else newPreference = 'system';
    
    setThemePreference(newPreference);
    StorageService.saveTheme(newPreference);
    setActualTheme(newPreference === 'system' ? StorageService.getActualTheme() : newPreference);
  };

  const handleSaveProjectId = (id: string) => setUserProjectId(id);
  const handleRemoveProjectId = () => setUserProjectId(null);

  // Removed unused Template handlers
  // const handleSaveTemplate = (id: string) => { console.log('Template saved:', id); }; 
  // const handleRemoveTemplate = () => { console.log('Template removed'); };

  const handleParseModeChange = (mode: ParseMode) => {
    setParseMode(mode);
    StorageService.saveParseMode(mode);
  };

  const handleApiTierChange = (tier: ApiTier) => {
    setApiTier(tier);
    StorageService.saveApiTier(tier);
  };

  const handleGoogleSignIn = () => GoogleAuthService.signIn();
  const handleGoogleSignOut = () => GoogleAuthService.signOut();

  const handleFileSelect = async (files: File[]) => {
    setUploadedFiles(files);
    setParsedCVs([]);
    setExtractedCandidates([]);
    setFailedExtractions([]);
    setGeneratedSlidesUrl(null);
    setProcessingStatus('idle');
  };

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
    setFileUploaderKey(prev => prev + 1);
    setJustReset(true);
    setTimeout(() => setJustReset(false), 1500);
  };

  const handleParsePDF = async () => {
    if (uploadedFiles.length === 0) {
      alert('Please upload at least one PDF file first');
      return;
    }

    if (!userProjectId) {
      alert('Please enter your Google Cloud Project ID first');
      return;
    }

    if (!googleAuth.isAuthenticated) {
      alert('Please sign in with Google to authenticate your project billing.');
      return;
    }

    try {
      setProcessingStatus('parsing');
      setProgressCurrent(0);
      setProgressTotal(0);

      const allCVs: any[] = [];

      for (let fileIndex = 0; fileIndex < uploadedFiles.length; fileIndex++) {
        const file = uploadedFiles[fileIndex];
        if (parseMode === 'longlist') {
          const cvs = await PDFService.parseAndSplit(file);
          allCVs.push(...cvs);
        } else {
          const pageTexts = await PDFService.parsePDF(file);
          const pageCount = await PDFService.getPageCount(file);
          const pageNumbers = Array.from({ length: pageCount }, (_, i) => i + 1);
          const cv = { text: pageTexts.join('\n\n'), pageNumbers: pageNumbers, fileName: file.name };
          allCVs.push(cv);
        }
      }

      setParsedCVs(allCVs);
      setProgressTotal(allCVs.length);
      setProcessingStatus('extracting');
      setProgressCurrent(0);

      const candidates: CandidateData[] = [];
      const errors: ProcessingError[] = [];

      for (let i = 0; i < allCVs.length; i++) {
        const cv = allCVs[i];
        setProgressCurrent(i + 1);
        const result = await GeminiService.extractCVData(cv.text, selectedModel);

        if (result.success && result.data) {
          candidates.push(result.data);
        } else {
          errors.push({
            candidateIndex: i,
            error: result.error || 'Unknown error',
            rawText: cv.text,
          });
        }
      }

      setExtractedCandidates(candidates);
      setFailedExtractions(errors);
      setProcessingStatus('done');

    } catch (error) {
      console.error('❌ Error during processing:', error);
      setProcessingStatus('error');
      alert('Error during processing: ' + (error as Error).message);
    }
  };

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

      // FIXED: Removed the 3rd argument (templateId) to match the new signature
      const result = await SlidesService.createPresentation(
        extractedCandidates,
        `CV Candidates - ${new Date().toLocaleDateString()}`
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

  const canProcess = uploadedFiles.length > 0 && userProjectId && googleAuth.isAuthenticated && processingStatus === 'idle';

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

      <ProjectIdInput
        existingProjectId={userProjectId}
        onSave={handleSaveProjectId}
        onRemove={handleRemoveProjectId}
        theme={actualTheme}
      />

      <GoogleSignIn
        isAuthenticated={googleAuth.isAuthenticated}
        userEmail={googleAuth.userEmail}
        onSignIn={handleGoogleSignIn}
        onSignOut={handleGoogleSignOut}
        theme={actualTheme}
      />

      {/* TemplateInput component removed visually to ensure compliance */}
      
      <ApiTierSelector
        tier={apiTier}
        onTierChange={handleApiTierChange}
        theme={actualTheme}
      />

      <ParseModeSelector
        mode={parseMode}
        onModeChange={handleParseModeChange}
        theme={actualTheme}
      />

      <FileUploader
        key={fileUploaderKey}
        onFileSelect={handleFileSelect}
        theme={actualTheme}
        disabled={processingStatus !== 'idle' && processingStatus !== 'done' && processingStatus !== 'error'}
        parseMode={parseMode}
      />

      {/* AI Model Selector Removed since it's hardcoded to Flash now to simplify UI */}
      
      <ProgressIndicator
        status={processingStatus}
        current={progressCurrent}
        total={progressTotal}
        theme={actualTheme}
      />

      {uploadedFiles.length > 0 && userProjectId && (
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

      {/* Generate Slides Button */}
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
              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.25rem', color: textColor, opacity: 0.8 }}>WORK HISTORY:</div>
                {candidate.workHistory.map((work, wIdx) => (
                  <div key={wIdx} style={{ fontSize: '0.75rem', marginLeft: '1rem', marginBottom: '0.25rem', color: textColor, opacity: 0.7 }}>
                    • {work.jobTitle} at {work.company} {work.dates && `(${work.dates})`}
                  </div>
                ))}
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.25rem', color: textColor, opacity: 0.8 }}>EDUCATION:</div>
                {candidate.education.map((edu, eIdx) => (
                  <div key={eIdx} style={{ fontSize: '0.75rem', marginLeft: '1rem', marginBottom: '0.25rem', color: textColor, opacity: 0.7 }}>
                    • {edu.degree} from {edu.institution} {edu.dates && `(${edu.dates})`}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

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
          {failedExtractions.map((error, index) => (
            <div key={index} style={{ padding: '1rem', border: `1px solid #ff6b6b`, marginBottom: '0.5rem', background: actualTheme === 'dark' ? '#1a1a1a' : '#fff' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: textColor }}>CV {error.candidateIndex + 1}</div>
              <div style={{ fontSize: '0.75rem', color: '#ff6b6b' }}>Error: {error.error}</div>
            </div>
          ))}
        </div>
      )}

      <div className="footer">
        [ ✅ PDF Parsing | ✅ Gemini Extraction | ✅ Google Slides | 🚀 App Ready! ]
      </div>
    </div>
  );
}

export default App;