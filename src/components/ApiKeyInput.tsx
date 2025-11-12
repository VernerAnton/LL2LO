import { useState } from 'react';

interface ApiKeyInputProps {
  existingKey: string | null;
  onSave: (key: string) => void;
  onRemove: () => void;
  theme: 'light' | 'dark';
}

export function ApiKeyInput({ existingKey, onSave, onRemove, theme }: ApiKeyInputProps) {
  const [isEditing, setIsEditing] = useState(!existingKey);
  const [keyInput, setKeyInput] = useState('');

  const handleSave = () => {
    if (keyInput.trim()) {
      onSave(keyInput.trim());
      setKeyInput('');
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

  if (existingKey && !isEditing) {
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
              [ GEMINI API KEY SAVED ]
            </div>
            <div style={{
              fontFamily: 'Courier New, monospace',
              fontSize: '0.875rem',
              color: textColor
            }}>
              {existingKey.slice(0, 8)}...{existingKey.slice(-4)}
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
            [ CHANGE KEY ]
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
        [ ENTER GEMINI API KEY ]
      </div>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <input
          type="text"
          value={keyInput}
          onChange={(e) => setKeyInput(e.target.value)}
          placeholder="AIza..."
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
          disabled={!keyInput.trim()}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'none',
            border: `2px solid ${borderColor}`,
            color: textColor,
            fontFamily: 'Courier New, monospace',
            fontWeight: 'bold',
            cursor: keyInput.trim() ? 'pointer' : 'not-allowed',
            letterSpacing: '0.05em',
            fontSize: '0.875rem',
            opacity: keyInput.trim() ? 1 : 0.5
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
        Get your API key from: https://aistudio.google.com/apikey
      </div>
    </div>
  );
}
