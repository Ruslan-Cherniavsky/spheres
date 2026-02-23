import { AURA_COLORS, AURA_LABELS, AURA_LIST } from '@spheres/shared';
import type { AuraType, SupportedLanguage } from '@spheres/shared';

export default function AuraPicker({
  current,
  language,
  onChange,
}: {
  current: AuraType;
  language: SupportedLanguage;
  onChange: (aura: AuraType) => void;
}) {
  return (
    <div className="aura-scale">
      {AURA_LIST.map((aura) => {
        const isActive = aura === current;
        const color = AURA_COLORS[aura];
        const isSOS = aura === 'sos';
        return (
          <button
            key={aura}
            className={`aura-scale-item ${isActive ? 'active' : ''} ${isSOS ? 'sos' : ''}`}
            onClick={() => onChange(aura)}
          >
            <span
              className="aura-scale-dot"
              style={{
                background: color,
                boxShadow: isActive ? `0 0 10px ${color}, 0 0 20px ${color}` : `0 0 4px ${color}`,
              }}
            />
            <span className="aura-scale-label">
              {AURA_LABELS[aura][language]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
