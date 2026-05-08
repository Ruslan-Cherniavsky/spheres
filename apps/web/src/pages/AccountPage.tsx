import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useUserStore } from '../stores/userStore';
import { useTranslation } from '../i18n/useTranslation';
import { useIsMobile } from '../hooks/useDeviceCapabilities';
import SpherePreview from '../components/SpherePreview';
import AuraPicker from '../components/AuraPicker';
import LanguageSelector from '../components/LanguageSelector';
import { AURA_COLORS, coreValueToRingCount } from '@spheres/shared';

const ONBOARD_STORAGE_KEY = (uid: string) => `spheres_onboard_v1:${uid}`;

export default function AccountPage() {
  const isMobile = useIsMobile();
  const { user, signOut } = useAuthStore();
  const { profile, language, aura, coreValue, loading, loadProfile, setAura, setLanguage } =
    useUserStore();
  const t = useTranslation();
  const navigate = useNavigate();

  const [showRings, setShowRings] = useState(false);
  const [showInfoPopup, setShowInfoPopup] = useState(false);
  const [showAboutPopup, setShowAboutPopup] = useState(false);
  const [showFeedbackPopup, setShowFeedbackPopup] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const onboardingPendingRef = useRef(false);
  const prevInfoPopupRef = useRef(false);

  useEffect(() => {
    if (user && !profile) {
      loadProfile(user.uid, user.email || '');
    }
  }, [user, profile, loadProfile]);

  useEffect(() => {
    if (!user?.uid || !profile) return;
    try {
      if (!localStorage.getItem(ONBOARD_STORAGE_KEY(user.uid))) {
        onboardingPendingRef.current = true;
        setShowInfoPopup(true);
      }
    } catch {
      /* skip if storage unavailable */
    }
  }, [user?.uid, profile]);

  useEffect(() => {
    if (prevInfoPopupRef.current && !showInfoPopup && onboardingPendingRef.current && user?.uid) {
      try {
        localStorage.setItem(ONBOARD_STORAGE_KEY(user.uid), '1');
      } catch {
        /* private mode */
      }
      onboardingPendingRef.current = false;
    }
    prevInfoPopupRef.current = showInfoPopup;
  }, [showInfoPopup, user?.uid]);

  useEffect(() => {
    if (!showInfoPopup && !showAboutPopup && !showFeedbackPopup) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowInfoPopup(false);
        setShowAboutPopup(false);
        setShowFeedbackPopup(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showInfoPopup, showAboutPopup, showFeedbackPopup]);

  if (loading || !profile) {
    return (
      <div className="page-center">
        <div className="spinner" />
      </div>
    );
  }

  const ringCount = coreValueToRingCount(coreValue);
  const ringsPercent = ((ringCount - 1) / 6) * 100;
  const feedbackSubject = `Spheres feedback (${user?.email ?? 'unknown-user'})`;

  const handleSendFeedback = () => {
    const text = feedbackText.trim();
    if (!text) return;
    const body = `${text}\n\n---\nFrom: ${user?.email ?? 'unknown'}\nUID: ${user?.uid ?? 'unknown'}`;
    const href = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent('nalsurion@gmail.com')}&su=${encodeURIComponent(feedbackSubject)}&body=${encodeURIComponent(body)}`;
    window.open(href, '_blank', 'noopener,noreferrer');
    setShowFeedbackPopup(false);
    setFeedbackText('');
  };

  return (
    <div className="account-layout">
      {/* Left panel — settings */}
      <div className="account-panel">
        {isMobile && (
          <div className="sphere-preview-card">
            <SpherePreview aura={aura} coreValue={coreValue} showRings={showRings} />
          </div>
        )}

        <h1 style={{ fontSize: '1.5rem', fontWeight: 300, letterSpacing: '0.3em', marginBottom: '2rem' }}>
          {t.account.title}
        </h1>

        <div className="setting-group">
          <label className="setting-label">{t.account.language}</label>
          <LanguageSelector current={language} onChange={setLanguage} />
        </div>

        <div className="setting-group setting-group--aura">
          <label className="setting-label">{t.account.aura}</label>
          <AuraPicker current={aura} language={language} onChange={setAura} />
        </div>

        <div className="setting-group">
          <label className="setting-label">{t.account.ringsLevel}</label>
          <div className="core-bar">
            <div className="core-bar-fill" style={{ width: `${ringsPercent}%` }} />
            <span className="core-bar-label">{ringCount} {t.account.rings}</span>
          </div>
          <div style={{ marginTop: '0.5rem', width: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ width: '100%' }}
            onClick={() => setShowRings((v) => !v)}
          >
            {showRings ? t.account.hideRings : t.account.seeRings}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ width: '100%', fontSize: '0.9rem', opacity: 0.9 }}
            onClick={() => setShowInfoPopup(true)}
          >
            {t.account.aboutAuraRings}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ width: '100%', fontSize: '0.9rem', opacity: 0.9 }}
            onClick={() => setShowAboutPopup(true)}
          >
            {t.account.aboutSpheres}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ width: '100%', fontSize: '0.9rem', opacity: 0.9 }}
            onClick={() => setShowFeedbackPopup(true)}
          >
            Leave a feedback
          </button>
          </div>
        </div>

        {showInfoPopup && (
          <div
            className="info-popup-overlay"
            onClick={() => setShowInfoPopup(false)}
            role="dialog"
            aria-modal="true"
            aria-label={t.account.infoTitle}
          >
            <div className="info-popup-panel" onClick={(e) => e.stopPropagation()}>
              <h2 className="info-popup-title">{t.account.infoTitle}</h2>
              <ul className="info-popup-list">
                {t.account.infoBullets.map((text, i) => (
                  <li key={i} className="info-popup-p">{text}</li>
                ))}
              </ul>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ width: '100%', marginTop: '1rem' }}
                onClick={() => setShowInfoPopup(false)}
              >
                {t.account.close}
              </button>
            </div>
          </div>
        )}

        {showAboutPopup && (
          <div
            className="info-popup-overlay"
            onClick={() => setShowAboutPopup(false)}
            role="dialog"
            aria-modal="true"
            aria-label={t.account.aboutSpheres}
          >
            <div className="info-popup-panel info-popup-panel--wide" onClick={(e) => e.stopPropagation()}>
              <h2 className="info-popup-title">{t.account.aboutSpheres}</h2>
              <div className="info-popup-about">
                {t.account.aboutSpheresContent.split(/\n\n+/).map((block, i) => {
                  const t2 = block.trim();
                  if (!t2) return null;
                  if (t2.startsWith('## ')) {
                    return <h3 key={i} className="info-popup-h3">{t2.slice(3)}</h3>;
                  }
                  if (t2 === '---') return <hr key={i} className="info-popup-hr" />;
                  if (t2.startsWith('- ')) {
                    const items = t2.split('\n').filter((l) => l.startsWith('- '));
                    return (
                      <ul key={i} className="info-popup-ul">
                        {items.map((item, j) => (
                          <li key={j}>{item.slice(2)}</li>
                        ))}
                      </ul>
                    );
                  }
                  const parts = t2.split(/(\*\*.+?\*\*)/g);
                  return (
                    <p key={i} className="info-popup-para">
                      {parts.map((part, j) =>
                        part.startsWith('**') && part.endsWith('**') ? (
                          <strong key={j}>{part.slice(2, -2)}</strong>
                        ) : (
                          part
                        )
                      )}
                    </p>
                  );
                })}
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ width: '100%', marginTop: '1rem' }}
                onClick={() => setShowAboutPopup(false)}
              >
                {t.account.close}
              </button>
            </div>
          </div>
        )}

        {showFeedbackPopup && (
          <div
            className="info-popup-overlay"
            onClick={() => setShowFeedbackPopup(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Leave a feedback"
          >
            <div className="info-popup-panel" onClick={(e) => e.stopPropagation()}>
              <h2 className="info-popup-title">Leave a feedback</h2>
              <p className="feedback-popup-subtitle">Share what you think about Spheres. Your mail app will open with this text.</p>
              <textarea
                className="feedback-textarea"
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Write your thoughts, ideas, or bugs..."
                rows={7}
                maxLength={4000}
              />
              <div className="feedback-popup-row">
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ width: '100%' }}
                  onClick={() => setShowFeedbackPopup(false)}
                >
                  {t.account.close}
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                  onClick={handleSendFeedback}
                  disabled={!feedbackText.trim()}
                >
                  Send to email
                </button>
              </div>
            </div>
          </div>
        )}

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button
            className="btn btn-primary btn-large"
            onClick={() => navigate('/world')}
            style={{
              boxShadow: `0 0 20px ${AURA_COLORS[aura]}40`,
            }}
          >
            {t.account.enterWorld}
          </button>
          <button className="btn btn-secondary" onClick={signOut}>
            {t.auth.signOut}
          </button>
        </div>
      </div>

      {/* Right panel — sphere preview (desktop only) */}
      {!isMobile && (
        <div className="sphere-preview-panel">
          <SpherePreview aura={aura} coreValue={coreValue} showRings={showRings} />
        </div>
      )}
    </div>
  );
}
