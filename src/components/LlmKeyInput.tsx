import { useState } from 'react';
import type { AiProvider, ActualTheme } from '../types';

interface LlmKeyInputProps {
  existingKey: string | null;
  provider: AiProvider;
  onSave: (key: string) => void;
  onRemove: () => void;
  onProviderChange: (provider: AiProvider) => void;
  theme: ActualTheme;
}

export function LlmKeyInput({
  existingKey,
  provider,
  onSave,
  onRemove,
  onProviderChange,
  theme,
}: LlmKeyInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [showKey, setShowKey] = useState(false);

  const borderColor = theme === 'dark' ? '#e0e0e0' : '#2a2a2a';
  const bgColor = theme === 'dark' ? '#2a2a2a' : '#fefdfb';
  const textColor = theme === 'dark' ? '#e0e0e0' : '#2a2a2a';

  const handleSave = () => {
    if (inputValue.trim()) {
      onSave(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    }
  };

  return (
    <div
      style={{
        padding: '1.5rem',
        border: `2px solid ${borderColor}`,
        background: bgColor,
        boxShadow: `4px 4px 0px ${borderColor}`,
        marginBottom: '1.5rem',
      }}
    >
      <div
        style={{
          fontSize: '0.875rem',
          fontWeight: 'bold',
          marginBottom: '1rem',
          letterSpacing: '0.1em',
          color: textColor,
        }}
      >
        [ API KEY CONFIGURATION ]
      </div>

      {/* Provider Selection */}
      <div style={{ marginBottom: '1rem' }}>
        <label
          style={{
            display: 'block',
            fontSize: '0.75rem',
            marginBottom: '0.5rem',
            opacity: 0.8,
            color: textColor,
          }}
        >
          AI PROVIDER:
        </label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => onProviderChange('anthropic')}
            style={{
              padding: '0.5rem 1rem',
              background: provider === 'anthropic' ? textColor : 'none',
              border: `2px solid ${borderColor}`,
              color: provider === 'anthropic' ? bgColor : textColor,
              fontFamily: 'Courier New, monospace',
              fontWeight: 'bold',
              cursor: 'pointer',
              letterSpacing: '0.1em',
              fontSize: '0.75rem',
            }}
          >
            [ ANTHROPIC ]
          </button>
          <button
            onClick={() => onProviderChange('openai')}
            style={{
              padding: '0.5rem 1rem',
              background: provider === 'openai' ? textColor : 'none',
              border: `2px solid ${borderColor}`,
              color: provider === 'openai' ? bgColor : textColor,
              fontFamily: 'Courier New, monospace',
              fontWeight: 'bold',
              cursor: 'pointer',
              letterSpacing: '0.1em',
              fontSize: '0.75rem',
            }}
          >
            [ OPENAI ]
          </button>
        </div>
      </div>

      {existingKey ? (
        /* Show existing key status */
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: '0.5rem',
            }}
          >
            <div
              style={{
                flex: 1,
                padding: '0.75rem',
                border: `1px solid ${borderColor}`,
                background: theme === 'dark' ? '#1a1a1a' : '#fff',
                fontFamily: 'Courier New, monospace',
                fontSize: '0.875rem',
                color: textColor,
              }}
            >
              {showKey ? existingKey : '●'.repeat(20)}
            </div>
            <button
              onClick={() => setShowKey(!showKey)}
              style={{
                padding: '0.75rem 1rem',
                background: 'none',
                border: `2px solid ${borderColor}`,
                color: textColor,
                fontFamily: 'Courier New, monospace',
                fontWeight: 'bold',
                cursor: 'pointer',
                letterSpacing: '0.1em',
                fontSize: '0.75rem',
              }}
            >
              {showKey ? '[ HIDE ]' : '[ SHOW ]'}
            </button>
            <button
              onClick={onRemove}
              style={{
                padding: '0.75rem 1rem',
                background: 'none',
                border: `2px solid #ff6b6b`,
                color: '#ff6b6b',
                fontFamily: 'Courier New, monospace',
                fontWeight: 'bold',
                cursor: 'pointer',
                letterSpacing: '0.1em',
                fontSize: '0.75rem',
              }}
            >
              [ REMOVE ]
            </button>
          </div>
          <div
            style={{
              fontSize: '0.75rem',
              opacity: 0.6,
              color: textColor,
            }}
          >
            ✅ API key saved (stored in browser localStorage)
          </div>
        </div>
      ) : (
        /* Show input for new key */
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '0.75rem',
              marginBottom: '0.5rem',
              opacity: 0.8,
              color: textColor,
            }}
          >
            {provider === 'anthropic' ? 'ANTHROPIC API KEY (sk-ant-...)' : 'OPENAI API KEY (sk-...)'}:
          </label>
          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              marginBottom: '0.5rem',
            }}
          >
            <input
              type="password"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                provider === 'anthropic'
                  ? 'sk-ant-api03-...'
                  : 'sk-proj-...'
              }
              style={{
                flex: 1,
                padding: '0.75rem',
                border: `2px solid ${borderColor}`,
                background: theme === 'dark' ? '#1a1a1a' : '#fff',
                color: textColor,
                fontFamily: 'Courier New, monospace',
                fontSize: '0.875rem',
              }}
            />
            <button
              onClick={handleSave}
              disabled={!inputValue.trim()}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'none',
                border: `2px solid ${borderColor}`,
                color: textColor,
                fontFamily: 'Courier New, monospace',
                fontWeight: 'bold',
                cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
                letterSpacing: '0.1em',
                fontSize: '0.875rem',
                opacity: inputValue.trim() ? 1 : 0.5,
              }}
            >
              [ SAVE ]
            </button>
          </div>
          <div
            style={{
              fontSize: '0.75rem',
              opacity: 0.6,
              lineHeight: '1.4',
              color: textColor,
            }}
          >
            🔒 Your API key is stored locally in your browser and never sent to any server except
            the AI provider you choose.
          </div>
        </div>
      )}
    </div>
  );
}
