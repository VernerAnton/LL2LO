// localStorage/sessionStorage wrapper with type safety

const STORAGE_KEYS = {
  GEMINI_API_KEY: 'gemini_api_key',
  THEME: 'theme',
  SELECTED_MODEL: 'selected_model',
} as const;

export class StorageService {
  /**
   * Save Gemini API key to localStorage
   */
  static saveGeminiKey(key: string): void {
    localStorage.setItem(STORAGE_KEYS.GEMINI_API_KEY, key);
  }

  /**
   * Get Gemini API key from localStorage
   */
  static getGeminiKey(): string | null {
    return localStorage.getItem(STORAGE_KEYS.GEMINI_API_KEY);
  }

  /**
   * Remove Gemini API key from localStorage
   */
  static removeGeminiKey(): void {
    localStorage.removeItem(STORAGE_KEYS.GEMINI_API_KEY);
  }

  /**
   * Save theme preference (system/light/dark)
   */
  static saveTheme(theme: 'system' | 'light' | 'dark'): void {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }

  /**
   * Get theme preference
   * Returns user's preference: 'system', 'light', or 'dark'
   * Defaults to 'system' (auto) for first-time users
   */
  static getTheme(): 'system' | 'light' | 'dark' {
    const stored = localStorage.getItem(STORAGE_KEYS.THEME);

    if (stored === 'system' || stored === 'light' || stored === 'dark') {
      return stored;
    }

    // Default to system (auto) for first-time users
    return 'system';
  }

  /**
   * Get the actual theme to apply to UI
   * Resolves 'system' preference to 'light' or 'dark' based on OS setting
   */
  static getActualTheme(): 'light' | 'dark' {
    const preference = this.getTheme();

    if (preference === 'system') {
      // Detect system preference
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        return 'light';
      }
      // Final fallback: dark mode (for Finland winters 🌙)
      return 'dark';
    }

    return preference; // 'light' or 'dark'
  }

  /**
   * Save selected Gemini model
   */
  static saveSelectedModel(model: string): void {
    localStorage.setItem(STORAGE_KEYS.SELECTED_MODEL, model);
  }

  /**
   * Get selected Gemini model
   */
  static getSelectedModel(): string {
    return localStorage.getItem(STORAGE_KEYS.SELECTED_MODEL) || 'gemini-2.5-flash';
  }

  /**
   * Clear all app data from storage
   */
  static clearAll(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }
}
