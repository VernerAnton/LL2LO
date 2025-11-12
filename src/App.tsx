import { useState, useEffect } from 'react';
import './App.css';
import { ThemeToggle } from './components/ThemeToggle';
import { ApiKeyInput } from './components/ApiKeyInput';
import { FileUploader } from './components/FileUploader';
import { ProgressIndicator } from './components/ProgressIndicator';
import { GoogleSignIn } from './components/GoogleSignIn';
import { StorageService } from './services/storageService';
import { PDFService } from './services/pdfService';
import { GoogleAuthService, type GoogleAuthState } from './services/googleAuthService';
import type { Theme, ActualTheme, ProcessingStatus, ParsedCV } from './types';

function App() {
  // Theme state - track both preference and actual theme
  const [themePreference, setThemePreference] = useState<Theme>(() => StorageService.getTheme());
  const [actualTheme, setActualTheme] = useState<ActualTheme>(() => StorageService.getActualTheme());

  // API key state
  const [geminiApiKey, setGeminiApiKey] = useState<string | null>(() =>
    StorageService.getGeminiKey()
  );

  // File and processing state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>('idle');
  const [parsedCVs, setParsedCVs] = useState<ParsedCV[]>([]);
  const [progressCurrent, setProgressCurrent] = useState(0);
  const [progressTotal, setProgressTotal] = useState(0);

  // Google auth state
  const [googleAuth, setGoogleAuth] = useState<GoogleAuthState>({
    isAuthenticated: false,
    accessToken: null,
    userEmail: null,
  });

  // Initialize Google Auth on mount
  useEffect(() => {
    GoogleAuthService.initialize()
      .then(() => {
        console.log('✅ Google Auth initialized');
        // Set up auth state change listener
        GoogleAuthService.onAuthStateChange((state) => {
          setGoogleAuth(state);
        });
      })
      .catch((error) => {
        console.error('❌ Failed to initialize Google Auth:', error);
      });
  }, []);

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
    setProcessingStatus('idle');
  };

  // Parse PDF handler
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
      setProcessingStatus('parsing');
      setProgressCurrent(0);
      setProgressTotal(0);

      const cvs = await PDFService.parseAndSplit(uploadedFile);

      setParsedCVs(cvs);
      setProgressTotal(cvs.length);
      setProcessingStatus('done');

      console.log('✅ Parsing complete!');
      console.log(`Found ${cvs.length} CVs`);
      cvs.forEach((cv, index) => {
        console.log(`\nCV ${index + 1}:`);
        console.log(`Pages: ${cv.pageNumbers.join(', ')}`);
        console.log(`Text preview: ${cv.text.substring(0, 200)}...`);
      });

    } catch (error) {
      console.error('❌ Error parsing PDF:', error);
      setProcessingStatus('error');
      alert('Error parsing PDF: ' + (error as Error).message);
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

      <FileUploader
        onFileSelect={handleFileSelect}
        theme={actualTheme}
        disabled={processingStatus !== 'idle' && processingStatus !== 'done' && processingStatus !== 'error'}
      />

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
            [ PARSE PDF ]
          </button>
          <div style={{
            fontSize: '0.75rem',
            opacity: 0.6,
            marginTop: '0.5rem',
            color: textColor
          }}>
            Phase 1: PDF parsing only (Gemini extraction coming in Phase 2)
          </div>
        </div>
      )}

      {parsedCVs.length > 0 && (
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
            [ PARSED CVS: {parsedCVs.length} ]
          </div>
          {parsedCVs.map((cv, index) => (
            <div
              key={index}
              style={{
                padding: '1rem',
                border: `1px solid ${borderColor}`,
                marginBottom: '0.5rem',
                background: actualTheme === 'dark' ? '#1a1a1a' : '#fff'
              }}
            >
              <div style={{
                fontWeight: 'bold',
                marginBottom: '0.5rem',
                color: textColor
              }}>
                CV {index + 1}
              </div>
              <div style={{
                fontSize: '0.75rem',
                opacity: 0.7,
                color: textColor
              }}>
                Pages: {cv.pageNumbers.join(', ')}
              </div>
              <div style={{
                fontSize: '0.75rem',
                opacity: 0.7,
                marginTop: '0.25rem',
                color: textColor,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                Preview: {cv.text.substring(0, 100)}...
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="footer">
        [ Phase 1: Foundation Complete | Phase 2: Coming Soon - Gemini AI + Google Slides ]
      </div>
    </div>
  );
}

export default App;
