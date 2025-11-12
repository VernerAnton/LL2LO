import { Theme } from '../types';

interface ThemeToggleProps {
  theme: Theme;
  onToggle: () => void;
}

export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
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
        style={{
          background: 'none',
          border: 'none',
          fontSize: '1.5rem',
          cursor: 'pointer',
          padding: 0
        }}
      >
        {theme === 'dark' ? '🌙' : '☀️'}
      </button>
    </div>
  );
}
