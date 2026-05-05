import type { PerfProfile } from '../../hooks/usePerfProfile';

interface Props {
  fps: number;
  profile: PerfProfile;
}

const styles: React.CSSProperties = {
  position: 'fixed',
  top: 8,
  right: 8,
  padding: '6px 10px',
  background: 'rgba(0, 0, 0, 0.55)',
  color: '#9ef',
  font: '11px/1.3 ui-monospace, SFMono-Regular, Menlo, monospace',
  borderRadius: 4,
  pointerEvents: 'none',
  zIndex: 9999,
  whiteSpace: 'pre',
  letterSpacing: 0.3,
};

export default function PerfHUD({ fps, profile }: Props) {
  const ms = fps > 0 ? (1000 / fps).toFixed(1) : '—';
  const status = profile.measured ? 'locked' : 'probing';
  return (
    <div style={styles}>
      {`fps  ${fps.toFixed(0).padStart(3, ' ')}   ${ms} ms\n` +
        `dpr  ${profile.dpr.toFixed(2)}   bloom ${profile.bloom}\n` +
        `det  ${profile.lowDetail ? 'low ' : 'full'}   ${status}`}
    </div>
  );
}
