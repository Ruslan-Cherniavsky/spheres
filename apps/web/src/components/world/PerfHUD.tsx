import type { PerfProfile, PresetName } from '../../hooks/usePerfProfile';
import { PRESET_ORDER } from '../../hooks/usePerfProfile';

interface Props {
  fps: number;
  profile: PerfProfile;
  onPresetChange?: (preset: PresetName) => void;
}

const wrap: React.CSSProperties = {
  position: 'fixed',
  top: 'max(52px, calc(env(safe-area-inset-top) + 52px))',
  right: 8,
  padding: '6px 10px',
  background: 'rgba(0, 0, 0, 0.6)',
  color: '#9ef',
  font: '11px/1.3 ui-monospace, SFMono-Regular, Menlo, monospace',
  borderRadius: 4,
  zIndex: 9999,
  letterSpacing: 0.3,
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  minWidth: 180,
  pointerEvents: 'auto',
  userSelect: 'none',
};

const stats: React.CSSProperties = {
  whiteSpace: 'pre',
};

const presets: React.CSSProperties = {
  display: 'flex',
  gap: 4,
  flexWrap: 'wrap',
};

const btnBase: React.CSSProperties = {
  padding: '2px 6px',
  background: 'transparent',
  border: '1px solid rgba(158, 238, 255, 0.3)',
  color: '#9ef',
  font: 'inherit',
  cursor: 'pointer',
  borderRadius: 3,
};

const btnActive: React.CSSProperties = {
  ...btnBase,
  background: '#9ef',
  color: '#000',
  borderColor: '#9ef',
};

export default function PerfHUD({ fps, profile, onPresetChange }: Props) {
  const ms = fps > 0 ? (1000 / fps).toFixed(1) : '—';
  const status = profile.preset === 'auto' ? (profile.measured ? 'auto-locked' : 'probing') : 'forced';

  return (
    <div style={wrap}>
      <div style={stats}>
        {`fps  ${fps.toFixed(0).padStart(3, ' ')}   ${ms} ms\n` +
          `dpr  ${profile.dpr.toFixed(2)}   bloom ${profile.bloom}\n` +
          `det  ${profile.lowDetail ? 'low ' : 'full'}   ${status}`}
      </div>
      {onPresetChange && (
        <div style={presets}>
          {PRESET_ORDER.map((p) => (
            <button
              key={p}
              type="button"
              style={profile.preset === p ? btnActive : btnBase}
              onClick={() => onPresetChange(p)}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
