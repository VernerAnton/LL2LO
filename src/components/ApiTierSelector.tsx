import type { ApiTier, ActualTheme } from '../types';

interface ApiTierSelectorProps {
  tier: ApiTier;
  onTierChange: (tier: ApiTier) => void;
  theme: ActualTheme;
}

export function ApiTierSelector({ tier, onTierChange, theme }: ApiTierSelectorProps) {
  return (
    <div className={`parse-mode-selector ${theme}-mode`}>
      <label className="mode-label">[ 🔑 API TIER ]</label>

      <div className="mode-buttons">
        <button
          className={`mode-button ${tier === 'free' ? 'active' : ''}`}
          onClick={() => onTierChange('free')}
        >
          [ FREE ]
        </button>

        <button
          className={`mode-button ${tier === 'paid' ? 'active' : ''}`}
          onClick={() => onTierChange('paid')}
        >
          [ PAID ]
        </button>
      </div>

      <div className="mode-description">
        {tier === 'free'
          ? '[ 10 requests/min - 6s delays between requests ]'
          : '[ 600 requests/min - 100ms delays (60x faster!) ]'
        }
      </div>
    </div>
  );
}
