import { useState } from 'react';
import type { CandidateData, ActualTheme } from '../types';
import { SlideGenerator } from '../services/slideGenerator';

interface GenerateButtonProps {
  candidates: CandidateData[];
  theme: ActualTheme;
}

export function GenerateButton({ candidates, theme }: GenerateButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (candidates.length === 0) return;

    setIsGenerating(true);
    // Add a small delay so the user sees the spinner
    await new Promise(r => setTimeout(r, 500));

    const result = await SlideGenerator.generate(candidates);

    setIsGenerating(false);

    if (!result.success) {
      alert(`Error generating slides: ${result.error}`);
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
      textAlign: 'center'
    }}>
      <button
        onClick={handleGenerate}
        disabled={isGenerating || candidates.length === 0}
        style={{
          padding: '1rem 2rem',
          background: textColor, // Inverted for emphasis
          border: `2px solid ${borderColor}`,
          color: bgColor,
          fontFamily: 'Courier New, monospace',
          fontWeight: 'bold',
          cursor: isGenerating ? 'wait' : 'pointer',
          letterSpacing: '0.1em',
          fontSize: '1rem',
          boxShadow: `2px 2px 0px ${borderColor}`,
          opacity: isGenerating ? 0.7 : 1
        }}
      >
        {isGenerating ? '[ ⏳ GENERATING... ]' : '[ 💾 DOWNLOAD .PPTX ]'}
      </button>
      <div style={{
        fontSize: '0.75rem',
        opacity: 0.6,
        marginTop: '0.5rem',
        color: textColor
      }}>
        Compatible with PowerPoint, LibreOffice & Google Slides
      </div>
    </div>
  );
}
