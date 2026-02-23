import { useState } from 'react';
import { useWorldStore } from '../../stores/worldStore';
import { useUserStore } from '../../stores/userStore';
import { useTranslation } from '../../i18n/useTranslation';

const RATING_VALUES = [-2, -1, 0, 1, 2] as const;

export default function RatingOverlay() {
  const contactState = useWorldStore((s) => s.contactState);
  const submitRating = useWorldStore((s) => s.submitRating);
  const skipRating = useWorldStore((s) => s.skipRating);
  const language = useUserStore((s) => s.language);
  const t = useTranslation(language);

  const [selected, setSelected] = useState<number | null>(null);

  if (contactState !== 'rating') return null;

  return (
    <div className="rating-overlay">
      <div className="rating-panel">
        <p className="rating-title">{t.rating.title}</p>

        <div className="rating-options">
          {RATING_VALUES.map((val, i) => (
            <button
              key={val}
              className={`rating-option ${selected === val ? 'selected' : ''}`}
              onClick={() => setSelected(val)}
              data-value={val}
            >
              <span className="rating-value">{val > 0 ? `+${val}` : val}</span>
              <span className="rating-label">{t.rating.labels[i]}</span>
            </button>
          ))}
        </div>

        <div className="rating-actions">
          <button className="btn btn-secondary" onClick={skipRating}>
            {t.rating.skip}
          </button>
          <button
            className="btn btn-primary"
            disabled={selected === null}
            onClick={() => {
              if (selected !== null) {
                submitRating(selected);
                setSelected(null);
              }
            }}
          >
            {t.rating.submit}
          </button>
        </div>
      </div>
    </div>
  );
}
