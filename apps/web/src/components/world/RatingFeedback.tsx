import { useWorldStore } from '../../stores/worldStore';
import { useTranslation } from '../../i18n/useTranslation';

export default function RatingFeedback() {
  const feedback = useWorldStore((s) => s.ratingFeedback);
  const rateBlocked = useWorldStore((s) => s.rateBlocked);
  const rateBlockedTimeLeft = useWorldStore((s) => s.rateBlockedTimeLeft);
  const t = useTranslation();

  if (rateBlocked) {
    return (
      <div className="rate-blocked-overlay">
        <div className="rate-blocked-panel">
          <p className="rate-blocked-title">{t.rating.rateBlockedTitle}</p>
          <p className="rate-blocked-body">{t.rating.rateBlockedBody}</p>
          {rateBlockedTimeLeft && (() => {
            const [before, after] = t.rating.rateBlockedTimer.split('{time}');
            return (
              <p className="rate-blocked-timer">
                {before}<strong>{rateBlockedTimeLeft}</strong>{after ?? ''}
              </p>
            );
          })()}
        </div>
      </div>
    );
  }

  if (!feedback) return null;

  const isPositive = feedback.value > 0;
  const isNeutral = feedback.value === 0;
  const label = isNeutral
    ? '0'
    : isPositive
      ? `+${feedback.value}`
      : `${feedback.value}`;

  return (
    <div
      className={`rating-feedback ${isPositive ? 'positive' : isNeutral ? 'neutral' : 'negative'}`}
      key={feedback.timestamp}
    >
      {label} {t.rating.received}
    </div>
  );
}
