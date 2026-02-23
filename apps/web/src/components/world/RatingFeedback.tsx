import { useWorldStore } from '../../stores/worldStore';

export default function RatingFeedback() {
  const feedback = useWorldStore((s) => s.ratingFeedback);

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
      {label} received
    </div>
  );
}
