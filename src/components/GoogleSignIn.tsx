import type { ActualTheme } from '../types';

interface GoogleSignInProps {
  isAuthenticated: boolean;
  userEmail: string | null;
  onSignIn: () => void;
  onSignOut: () => void;
  theme: ActualTheme;
}

export function GoogleSignIn({
  isAuthenticated,
  userEmail,
  onSignIn,
  onSignOut,
  theme,
}: GoogleSignInProps) {
  const borderColor = theme === 'dark' ? '#e0e0e0' : '#2a2a2a';
  const bgColor = theme === 'dark' ? '#2a2a2a' : '#fefdfb';
  const textColor = theme === 'dark' ? '#e0e0e0' : '#2a2a2a';

  if (isAuthenticated && userEmail) {
    // Signed in state - GREEN BORDER to make it obvious
    return (
      <div
        style={{
          padding: '1.5rem',
          border: `3px solid #4CAF50`,
          background: bgColor,
          boxShadow: `4px 4px 0px #4CAF50`,
          marginBottom: '1.5rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '1rem',
                fontWeight: 'bold',
                marginBottom: '0.5rem',
                letterSpacing: '0.1em',
                color: '#4CAF50',
              }}
            >
              [ ✅ GOOGLE AUTHENTICATED ]
            </div>
            <div
              style={{
                fontSize: '0.875rem',
                opacity: 0.9,
                color: textColor,
              }}
            >
              {userEmail}
            </div>
          </div>
          <button
            onClick={onSignOut}
            style={{
              padding: '0.5rem 1rem',
              background: 'none',
              border: `2px solid ${borderColor}`,
              color: textColor,
              fontFamily: 'Courier New, monospace',
              fontWeight: 'bold',
              cursor: 'pointer',
              letterSpacing: '0.05em',
              fontSize: '0.75rem',
            }}
          >
            [ SIGN OUT ]
          </button>
        </div>
      </div>
    );
  }

  // Not signed in state
  return (
    <div
      style={{
        padding: '1.5rem',
        border: `2px solid ${borderColor}`,
        background: bgColor,
        boxShadow: `4px 4px 0px ${borderColor}`,
        marginBottom: '1.5rem',
        textAlign: 'center',
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
        [ GOOGLE SIGN-IN REQUIRED ]
      </div>
      <div
        style={{
          fontSize: '0.75rem',
          opacity: 0.7,
          marginBottom: '1rem',
          color: textColor,
        }}
      >
        Sign in to create Google Slides presentations
      </div>
      <button
        onClick={onSignIn}
        style={{
          padding: '1rem 2rem',
          background: 'none',
          border: `2px solid ${borderColor}`,
          color: textColor,
          fontFamily: 'Courier New, monospace',
          fontWeight: 'bold',
          cursor: 'pointer',
          letterSpacing: '0.1em',
          fontSize: '1rem',
        }}
      >
        [ 🔐 SIGN IN WITH GOOGLE ]
      </button>
      <div
        style={{
          fontSize: '0.75rem',
          opacity: 0.6,
          marginTop: '0.5rem',
          color: textColor,
        }}
      >
        Grants access to Google Slides & Drive
      </div>
    </div>
  );
}
