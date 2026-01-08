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
      case 1: return 'Sequential (1 req/sec) - Slowest, safest';
      case 2: return 'Low parallel (2 concurrent) - Safe for all tiers';
      case 3: return 'Medium parallel (3 concurrent) - Recommended for Tier 1';
      case 4: return 'High parallel (4 concurrent) - Good for Tier 1+';
      case 5: return 'Max parallel (5 concurrent) - Fastest, may hit rate limits';
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
        }}
      >
        [ CONCURRENCY LEVEL ]
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
        💡 Higher concurrency = faster processing, but may hit API rate limits on lower tiers
      </div>
    </div>
  );
}
