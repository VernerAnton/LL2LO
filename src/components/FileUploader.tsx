import { useState, DragEvent } from 'react';
import type { ParseMode } from '../types';

interface FileUploaderProps {
  onFileSelect: (files: File[]) => void;
  theme: 'light' | 'dark';
  disabled?: boolean;
  parseMode: ParseMode;
}

export function FileUploader({ onFileSelect, theme, disabled = false, parseMode }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const allowMultiple = parseMode === 'individual';

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
    const pdfFiles = files.filter(f => f.type === 'application/pdf');

    if (pdfFiles.length > 0) {
      const filesToSelect = allowMultiple ? pdfFiles : [pdfFiles[0]];
      setSelectedFiles(filesToSelect);
      onFileSelect(filesToSelect);
    } else {
      alert('Please upload PDF files');
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (fileList && fileList.length > 0) {
      const filesArray = Array.from(fileList);
      const pdfFiles = filesArray.filter(f => f.type === 'application/pdf');

      if (pdfFiles.length > 0) {
        const filesToSelect = allowMultiple ? pdfFiles : [pdfFiles[0]];
        setSelectedFiles(filesToSelect);
        onFileSelect(filesToSelect);
      } else {
        alert('Please upload PDF files');
      }
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
          multiple={allowMultiple}
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

        {selectedFiles.length > 0 ? (
          <>
            <div style={{
              fontWeight: 'bold',
              marginBottom: '0.5rem',
              color: textColor,
              pointerEvents: 'none'
            }}>
              {selectedFiles.length === 1
                ? `✓ ${selectedFiles[0].name}`
                : `✓ ${selectedFiles.length} files selected`
              }
            </div>
            <div style={{
              fontSize: '0.75rem',
              opacity: 0.7,
              color: textColor,
              pointerEvents: 'none'
            }}>
              {selectedFiles.length === 1
                ? `${(selectedFiles[0].size / 1024 / 1024).toFixed(2)} MB`
                : `${selectedFiles.map(f => f.name).join(', ')}`
              }
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
              {allowMultiple ? 'Drag & drop PDF files here' : 'Drag & drop PDF file here'}
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
        {allowMultiple
          ? 'Upload one or more PDF files (Individual mode)'
          : 'Upload one PDF file (Longlist mode)'
        }
      </div>
    </div>
  );
}
