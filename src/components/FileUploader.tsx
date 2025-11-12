import { useState, DragEvent } from 'react';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  theme: 'light' | 'dark';
  disabled?: boolean;
}

export function FileUploader({ onFileSelect, theme, disabled = false }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    const pdfFile = files.find(f => f.type === 'application/pdf');

    if (pdfFile) {
      setSelectedFile(pdfFile);
      onFileSelect(pdfFile);
    } else {
      alert('Please upload a PDF file');
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      onFileSelect(file);
    } else {
      alert('Please upload a PDF file');
    }
  };

  const borderColor = theme === 'dark' ? '#e0e0e0' : '#2a2a2a';
  const bgColor = theme === 'dark' ? '#2a2a2a' : '#fefdfb';
  const textColor = theme === 'dark' ? '#e0e0e0' : '#2a2a2a';

  return (
    <div style={{
      padding: '1.5rem',
      border: `2px solid ${borderColor}`,
      background: bgColor,
      boxShadow: `4px 4px 0px ${borderColor}`,
      marginBottom: '1.5rem',
      opacity: disabled ? 0.6 : 1
    }}>
      <div style={{
        fontSize: '0.875rem',
        fontWeight: 'bold',
        marginBottom: '1rem',
        letterSpacing: '0.1em',
        color: textColor
      }}>
        [ UPLOAD CV PDF ]
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${borderColor}`,
          padding: '3rem 2rem',
          textAlign: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          background: isDragging ? (theme === 'dark' ? '#333' : '#f0f0f0') : 'transparent',
          transition: 'background 0.2s',
          position: 'relative'
        }}
      >
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileInput}
          disabled={disabled}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            opacity: 0,
            cursor: disabled ? 'not-allowed' : 'pointer'
          }}
        />

        <div style={{
          fontSize: '2rem',
          marginBottom: '1rem',
          pointerEvents: 'none'
        }}>
          📄
        </div>

        {selectedFile ? (
          <>
            <div style={{
              fontWeight: 'bold',
              marginBottom: '0.5rem',
              color: textColor,
              pointerEvents: 'none'
            }}>
              ✓ {selectedFile.name}
            </div>
            <div style={{
              fontSize: '0.75rem',
              opacity: 0.7,
              color: textColor,
              pointerEvents: 'none'
            }}>
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </div>
          </>
        ) : (
          <>
            <div style={{
              fontWeight: 'bold',
              marginBottom: '0.5rem',
              color: textColor,
              pointerEvents: 'none'
            }}>
              Drag & drop PDF here
            </div>
            <div style={{
              fontSize: '0.75rem',
              opacity: 0.7,
              color: textColor,
              pointerEvents: 'none'
            }}>
              or click to browse
            </div>
          </>
        )}
      </div>

      <div style={{
        fontSize: '0.75rem',
        opacity: 0.6,
        marginTop: '0.5rem',
        color: textColor
      }}>
        Upload a PDF containing multiple CVs (LinkedIn exports)
      </div>
    </div>
  );
}
