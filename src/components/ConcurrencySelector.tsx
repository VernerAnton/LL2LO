import type { ConcurrencyLevel, ActualTheme } from '../types';

interface ConcurrencySelectorProps {
  level: ConcurrencyLevel;
  onLevelChange: (level: ConcurrencyLevel) => void;
  theme: ActualTheme;
}

export function ConcurrencySelector({ level, onLevelChange, theme }: ConcurrencySelectorProps) {
  const borderColor = theme === 'dark' ? '#e0e0e0' : '#2a2a2a';
  const bgColor = theme === 'dark' ? '#2a2a2a' : '#fefdfb';
  const textColor = theme === 'dark' ? '#e0e0e0' : '#2a2a2a';

  const levels: ConcurrencyLevel[] = [1, 2, 3, 4, 5];

  const getDescription = (lvl: ConcurrencyLevel): string => {
    switch (lvl) {
      case 1: return 'Sequential (1 req/sec) - Safest, best for free tier';
      case 2: return 'Low parallel (2 concurrent) - Safe for most use cases';
      case 3: return 'Medium parallel (3 concurrent) - May cause rate limits on free tier';
      case 4: return 'High parallel (4 concurrent) - Requires paid tier to avoid 429s';
      case 5: return 'Max parallel (5 concurrent) - Fastest, but will likely hit rate limits on free tier';
      default: return '';
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
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        <span>[ CONCURRENCY LEVEL ]</span>
        <span
          title="ℹ️ Free tier users: Use level 1 to avoid rate limits (429 errors). Higher levels process CVs faster but may exceed your rate limit."
          style={{
            cursor: 'help',
            fontSize: '0.875rem',
            opacity: 0.6,
          }}
        >
          ⓘ
        </span>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
        {levels.map((lvl) => (
          <button
            key={lvl}
            onClick={() => onLevelChange(lvl)}
            style={{
              padding: '0.75rem 1.25rem',
              background: level === lvl ? textColor : 'none',
              border: `2px solid ${borderColor}`,
              color: level === lvl ? bgColor : textColor,
              fontFamily: 'Courier New, monospace',
              fontWeight: 'bold',
              cursor: 'pointer',
              letterSpacing: '0.1em',
              fontSize: '1rem',
            }}
          >
            [ {lvl} ]
          </button>
        ))}
      </div>

      <div
        style={{
          fontSize: '0.75rem',
          opacity: 0.7,
          lineHeight: '1.4',
          color: textColor,
        }}
      >
        {getDescription(level)}
      </div>

      <div
        style={{
          fontSize: '0.65rem',
          opacity: 0.5,
          marginTop: '0.5rem',
          color: textColor,
        }}
      >
        ⚠️  Free tier users: Level 1 recommended to avoid rate limits. Higher levels may cause 429 errors.
      </div>
    </div>
  );
}
