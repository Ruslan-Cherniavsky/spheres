import { useState } from 'react';
import AuraPicker from '../AuraPicker';
import { AURA_COLORS, WORLD_CONFIG } from '@spheres/shared';
import type { AuraType, SupportedLanguage } from '@spheres/shared';
import { useWorldStore } from '../../stores/worldStore';
import { useTranslation } from '../../i18n/useTranslation';

interface Props {
  aura: AuraType;
  language: SupportedLanguage;
  connected: boolean;
  pointerLocked: boolean;
  onAuraChange: (aura: AuraType) => void;
  onBack: () => void;
}

export default function WorldHUD({
  aura,
  language,
  connected,
  pointerLocked,
  onAuraChange,
  onBack,
}: Props) {
  const [showAuraPicker, setShowAuraPicker] = useState(false);
  const contactState = useWorldStore((s) => s.contactState);
  const t = useTranslation();

  return (
    <div className="world-hud">
      {/* ── Top bar ───────────────────────── */}
      <div className="hud-top">
        <div className="hud-status">
          <span className={`status-dot ${connected ? 'online' : 'offline'}`} />
          <span className="hud-text">{connected ? t.world.connected : t.world.offline}</span>
          <span className="hud-sep">|</span>
          <span className="hud-text-dim">{WORLD_CONFIG.defaultWorldId}</span>
        </div>
        <button className="hud-btn" onClick={onBack}>
          {t.world.back}
        </button>
      </div>

      {/* ── Bottom bar ────────────────────── */}
      <div className="hud-bottom">
        <div style={{ position: 'relative' }}>
          {showAuraPicker && !pointerLocked && (
            <div className="hud-aura-panel">
              <AuraPicker
                current={aura}
                language={language}
                onChange={(a) => {
                  onAuraChange(a);
                  setShowAuraPicker(false);
                }}
              />
            </div>
          )}
          <button
            className="hud-btn hud-aura-btn"
            onClick={() => setShowAuraPicker((v) => !v)}
            style={{ borderColor: AURA_COLORS[aura] }}
          >
            <span
              className="aura-dot"
              style={{
                background: AURA_COLORS[aura],
                boxShadow: `0 0 8px ${AURA_COLORS[aura]}`,
              }}
            />
            {t.world.changeAura}
          </button>
        </div>
      </div>

      {/* ── Controls hint ─────────────────── */}
      <div className="hud-controls">
        {contactState === 'chatting' ? (
          <span>{t.world.hintChatting}</span>
        ) : pointerLocked ? (
          <span>{t.world.hintFlying}</span>
        ) : (
          <span>{t.world.hintLocked}</span>
        )}
      </div>

      {/* ── Click to fly overlay ──────────── */}
      {!pointerLocked && contactState !== 'chatting' && (
        <div className="hud-center-hint">{t.world.hintLocked}</div>
      )}
    </div>
  );
}
