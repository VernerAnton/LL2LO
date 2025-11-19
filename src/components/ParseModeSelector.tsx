import type { ParseMode, ActualTheme } from '../types';

interface ParseModeSelectorProps {
  mode: ParseMode;
  onModeChange: (mode: ParseMode) => void;
  theme: ActualTheme;
}

export function ParseModeSelector({ mode, onModeChange, theme }: ParseModeSelectorProps) {
  return (
    <div className={`parse-mode-selector ${theme}-mode`}>
      <label className="mode-label">[ PARSE MODE ]</label>

      <div className="mode-buttons">
        <button
          className={`mode-button ${mode === 'longlist' ? 'active' : ''}`}
          onClick={() => onModeChange('longlist')}
        >
          [ LONGLIST ]
        </button>

        <button
          className={`mode-button ${mode === 'individual' ? 'active' : ''}`}
          onClick={() => onModeChange('individual')}
        >
          [ INDIVIDUAL CVs ]
        </button>
      </div>

      <div className="mode-description">
        {mode === 'longlist'
          ? '[ Splits multi-CV PDFs using "Page 1 of" detection ]'
          : '[ Each PDF file = 1 candidate (no splitting) ]'
        }
      </div>
    </div>
  );
}
