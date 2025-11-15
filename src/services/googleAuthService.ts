// Google OAuth 2.0 service using Google Identity Services
// Handles authentication for Google Slides and Drive APIs

const CLIENT_ID = '815174038885-03a6vabiuh0m2fn4n93g2jj6ipu1aslv.apps.googleusercontent.com';

const SCOPES = [
  'https://www.googleapis.com/auth/presentations',
  'https://www.googleapis.com/auth/drive.file'
].join(' ');

// Declare global google object from Google Identity Services
declare global {
  interface Window {
    google?: any;
    gapi?: any;
  }
}

export interface GoogleAuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  userEmail: string | null;
}

export class GoogleAuthService {
  private static tokenClient: any = null;
  private static accessToken: string | null = null;
  private static userEmail: string | null = null;
  private static authStateCallback: ((state: GoogleAuthState) => void) | null = null;

  /**
   * Initialize Google API client and token client
   */
  static async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Wait for both scripts to load
      const checkScriptsLoaded = setInterval(() => {
        if (window.google && window.gapi) {
          clearInterval(checkScriptsLoaded);

          // Initialize gapi client for Slides API
          window.gapi.load('client', async () => {
            try {
              await window.gapi.client.init({
                discoveryDocs: ['https://slides.googleapis.com/$discovery/rest?version=v1'],
              });

              // Initialize token client for OAuth
              this.tokenClient = window.google.accounts.oauth2.initTokenClient({
                client_id: CLIENT_ID,
                scope: SCOPES,
                callback: (response: any) => {
                  if (response.error) {
                    console.error('OAuth error:', response.error);
                    this.updateAuthState(false, null, null);
                    return;
                  }

                  this.accessToken = response.access_token;
                  console.log('✅ Access token received');

                  // Set the access token for gapi client
                  window.gapi.client.setToken({ access_token: response.access_token });

                  // Update auth state immediately (before getting user info)
                  this.updateAuthState(true, this.accessToken, this.userEmail);

                  // Get user info asynchronously (don't block auth state update)
                  this.getUserInfo().then(() => {
                    console.log('✅ User info retrieved:', this.userEmail);
                    // Update again with email if it wasn't set before
                    if (this.userEmail) {
                      this.updateAuthState(true, this.accessToken, this.userEmail);
                    }
                  }).catch((error) => {
                    console.error('⚠️ Failed to get user info (but authentication still works):', error);
                  });
                },
              });

              resolve();
            } catch (error) {
              console.error('Failed to initialize Google API:', error);
              reject(error);
            }
          });
        }
      }, 100); // Check every 100ms

      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkScriptsLoaded);
        reject(new Error('Google scripts failed to load'));
      }, 10000);
    });
  }

  /**
   * Set callback for auth state changes
   */
  static onAuthStateChange(callback: (state: GoogleAuthState) => void): void {
    this.authStateCallback = callback;
  }

  /**
   * Update auth state and notify callback
   */
  private static updateAuthState(
    isAuthenticated: boolean,
    accessToken: string | null,
    userEmail: string | null
  ): void {
    this.accessToken = accessToken;
    this.userEmail = userEmail;

    if (this.authStateCallback) {
      this.authStateCallback({
        isAuthenticated,
        accessToken,
        userEmail,
      });
    }
  }

  /**
   * Get user info from Google
   */
  private static async getUserInfo(): Promise<void> {
    if (!this.accessToken) return;

    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      const data = await response.json();
      this.userEmail = data.email;
    } catch (error) {
      console.error('Failed to get user info:', error);
    }
  }

  /**
   * Sign in - triggers OAuth flow
   */
  static signIn(): void {
    if (!this.tokenClient) {
      console.error('Token client not initialized. Call initialize() first.');
      return;
    }

    this.tokenClient.requestAccessToken();
  }

  /**
   * Sign out - revoke access token
   */
  static signOut(): void {
    if (this.accessToken && window.google) {
      window.google.accounts.oauth2.revoke(this.accessToken, () => {
        console.log('Access token revoked');
      });
    }

    this.accessToken = null;
    this.userEmail = null;

    if (window.gapi && window.gapi.client) {
      window.gapi.client.setToken(null);
    }

    this.updateAuthState(false, null, null);
  }

  /**
   * Get current access token
   */
  static getAccessToken(): string | null {
    return this.accessToken;
  }

  /**
   * Get current user email
   */
  static getUserEmail(): string | null {
    return this.userEmail;
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    return this.accessToken !== null;
  }

  /**
   * Get current auth state
   */
  static getAuthState(): GoogleAuthState {
    return {
      isAuthenticated: this.isAuthenticated(),
      accessToken: this.accessToken,
      userEmail: this.userEmail,
    };
  }
}
