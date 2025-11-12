import { ProcessingStatus } from '../types';

interface ProgressIndicatorProps {
  status: ProcessingStatus;
  current: number;
  total: number;
  theme: 'light' | 'dark';
}

export function ProgressIndicator({ status, current, total, theme }: ProgressIndicatorProps) {
  if (status === 'idle') return null;

  const borderColor = theme === 'dark' ? '#e0e0e0' : '#2a2a2a';
  const bgColor = theme === 'dark' ? '#2a2a2a' : '#fefdfb';
  const textColor = theme === 'dark' ? '#e0e0e0' : '#2a2a2a';

  const getStatusText = () => {
    switch (status) {
      case 'parsing':
        return '[ PARSING PDF... ]';
      case 'extracting':
        return `[ EXTRACTING CV ${current} / ${total}... ]`;
      case 'generating':
        return '[ GENERATING SLIDES... ]';
      case 'done':
        return '[ ✓ COMPLETE ]';
      case 'error':
        return '[ ✗ ERROR ]';
      default:
        return '[ PROCESSING... ]';
    }
  };

  const getProgressBar = () => {
    if (status === 'extracting' && total > 0) {
      const percentage = (current / total) * 100;
      return (
        <div style={{
          width: '100%',
          height: '4px',
          background: theme === 'dark' ? '#1a1a1a' : '#ddd',
          marginTop: '1rem',
          position: 'relative'
        }}>
          <div style={{
            width: `${percentage}%`,
            height: '100%',
            background: borderColor,
            transition: 'width 0.3s'
          }} />
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{
      padding: '1.5rem',
      border: `2px solid ${borderColor}`,
      background: bgColor,
      boxShadow: `4px 4px 0px ${borderColor}`,
      marginBottom: '1.5rem',
      textAlign: 'center'
    }}>
      <div style={{
        fontSize: '0.875rem',
        fontWeight: 'bold',
        letterSpacing: '0.1em',
        color: textColor
      }}>
        {getStatusText()}
      </div>
      {getProgressBar()}
    </div>
  );
}
