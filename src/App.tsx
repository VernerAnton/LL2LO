import { useState, useEffect } from 'react';
import './App.css';
import { ThemeToggle } from './components/ThemeToggle';
import { ApiKeyInput } from './components/ApiKeyInput';
import { FileUploader } from './components/FileUploader';
import { ProgressIndicator } from './components/ProgressIndicator';
import { StorageService } from './services/storageService';
import { PDFService } from './services/pdfService';
import type { Theme, ProcessingStatus, ParsedCV } from './types';

function App() {
  // Theme state
  const [theme, setTheme] = useState<Theme>(() => StorageService.getTheme());

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

  // Update body class when theme changes
  useEffect(() => {
    document.body.className = `${theme}-mode`;
  }, [theme]);

  // Theme toggle handler
  const handleThemeToggle = () => {
    const newTheme: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    StorageService.saveTheme(newTheme);
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

  const borderColor = theme === 'dark' ? '#e0e0e0' : '#2a2a2a';
  const bgColor = theme === 'dark' ? '#2a2a2a' : '#fefdfb';
  const textColor = theme === 'dark' ? '#e0e0e0' : '#2a2a2a';

  const canProcess = uploadedFile && geminiApiKey && processingStatus === 'idle';

  return (
    <div className="container">
      <div className="header">
        <ThemeToggle theme={theme} onToggle={handleThemeToggle} />
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
        theme={theme}
      />

      <FileUploader
        onFileSelect={handleFileSelect}
        theme={theme}
        disabled={processingStatus !== 'idle' && processingStatus !== 'done' && processingStatus !== 'error'}
      />

      <ProgressIndicator
        status={processingStatus}
        current={progressCurrent}
        total={progressTotal}
        theme={theme}
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
                background: theme === 'dark' ? '#1a1a1a' : '#fff'
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
