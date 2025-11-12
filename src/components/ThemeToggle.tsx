import { Theme, ActualTheme } from '../types';

interface ThemeToggleProps {
  themePreference: Theme;
  actualTheme: ActualTheme;
  onToggle: () => void;
}

export function ThemeToggle({ themePreference, actualTheme, onToggle }: ThemeToggleProps) {
  // Determine button emoji and tooltip based on preference
  const getButtonContent = () => {
    if (themePreference === 'system') {
      return {
        emoji: '🌓',
        title: `Auto (${actualTheme})`
      };
    } else if (themePreference === 'light') {
      return {
        emoji: '🌙',
        title: 'Switch to dark'
      };
    } else {
      return {
        emoji: '☀️',
        title: 'Switch to system'
      };
    }
  };

  const { emoji, title } = getButtonContent();

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      fontWeight: 'bold',
      letterSpacing: '0.1em',
      fontSize: '0.875rem'
    }}>
      <span>[ MODE ]</span>
      <button
        onClick={onToggle}
        title={title}
        aria-label={title}
        style={{
          background: 'none',
          border: 'none',
          fontSize: '1.5rem',
          cursor: 'pointer',
          padding: 0,
          transition: 'transform 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        {emoji}
      </button>
    </div>
  );
}
