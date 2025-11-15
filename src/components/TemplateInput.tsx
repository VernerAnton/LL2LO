import { useState } from 'react';

interface TemplateInputProps {
  existingTemplateId: string | null;
  onSave: (id: string) => void;
  onRemove: () => void;
  theme: 'light' | 'dark';
}

export function TemplateInput({ existingTemplateId, onSave, onRemove, theme }: TemplateInputProps) {
  const [isEditing, setIsEditing] = useState(!existingTemplateId);
  const [urlInput, setUrlInput] = useState('');

  // Extract presentation ID from URL or use as-is if already an ID
  const extractTemplateId = (input: string): string | null => {
    const trimmed = input.trim();

    // Check if it's a full URL
    const urlMatch = trimmed.match(/\/presentation\/d\/([a-zA-Z0-9-_]+)/);
    if (urlMatch) {
      return urlMatch[1];
    }

    // Otherwise assume it's already an ID
    if (trimmed.length > 0) {
      return trimmed;
    }

    return null;
  };

  const handleSave = () => {
    const templateId = extractTemplateId(urlInput);
    if (templateId) {
      onSave(templateId);
      setUrlInput('');
      setIsEditing(false);
    }
  };

  const handleChange = () => {
    setIsEditing(true);
    onRemove();
  };

  const borderColor = theme === 'dark' ? '#e0e0e0' : '#2a2a2a';
  const bgColor = theme === 'dark' ? '#2a2a2a' : '#fefdfb';
  const textColor = theme === 'dark' ? '#e0e0e0' : '#2a2a2a';

  if (existingTemplateId && !isEditing) {
    return (
      <div style={{
        padding: '1.5rem',
        border: `2px solid ${borderColor}`,
        background: bgColor,
        boxShadow: `4px 4px 0px ${borderColor}`,
        marginBottom: '1.5rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{
              fontSize: '0.875rem',
              opacity: 0.7,
              marginBottom: '0.5rem',
              color: textColor
            }}>
              [ TEMPLATE SAVED ]
            </div>
            <div style={{
              fontFamily: 'Courier New, monospace',
              fontSize: '0.875rem',
              color: textColor
            }}>
              {existingTemplateId.slice(0, 12)}...
            </div>
          </div>
          <button
            onClick={handleChange}
            style={{
              padding: '0.5rem 1rem',
              background: 'none',
              border: `2px solid ${borderColor}`,
              color: textColor,
              fontFamily: 'Courier New, monospace',
              fontWeight: 'bold',
              cursor: 'pointer',
              letterSpacing: '0.05em',
              fontSize: '0.75rem'
            }}
          >
            [ CHANGE TEMPLATE ]
          </button>
        </div>
      </div>
    );
  }

  return (
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
        [ ENTER TEMPLATE PRESENTATION URL ]
      </div>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <input
          type="text"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="https://docs.google.com/presentation/d/..."
          style={{
            flex: 1,
            padding: '0.75rem',
            border: `2px solid ${borderColor}`,
            background: theme === 'dark' ? '#1a1a1a' : '#fff',
            color: textColor,
            fontFamily: 'Courier New, monospace',
            fontSize: '0.875rem'
          }}
          onKeyPress={(e) => e.key === 'Enter' && handleSave()}
        />
        <button
          onClick={handleSave}
          disabled={!urlInput.trim()}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'none',
            border: `2px solid ${borderColor}`,
            color: textColor,
            fontFamily: 'Courier New, monospace',
            fontWeight: 'bold',
            cursor: urlInput.trim() ? 'pointer' : 'not-allowed',
            letterSpacing: '0.05em',
            fontSize: '0.875rem',
            opacity: urlInput.trim() ? 1 : 0.5
          }}
        >
          [ SAVE ]
        </button>
      </div>
      <div style={{
        fontSize: '0.75rem',
        opacity: 0.6,
        marginTop: '0.5rem',
        color: textColor
      }}>
        First, make a copy of the master template (File → Make a Copy). Then paste YOUR copy's URL here. Slide 1 stays as-is, Slide 2 is used as the candidate template.
      </div>
    </div>
  );
}
