import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useUserStore } from '../stores/userStore';
import { useTranslation } from '../i18n/useTranslation';
import SpherePreview from '../components/SpherePreview';
import AuraPicker from '../components/AuraPicker';
import LanguageSelector from '../components/LanguageSelector';
import { AURA_COLORS, CORE_VALUE } from '@spheres/shared';

export default function AccountPage() {
  const { user, signOut } = useAuthStore();
  const { profile, language, aura, coreValue, loading, loadProfile, setAura, setLanguage } =
    useUserStore();
  const t = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !profile) {
      loadProfile(user.uid, user.email || '');
    }
  }, [user, profile, loadProfile]);

  if (loading || !profile) {
    return (
      <div className="page-center">
        <div className="spinner" />
      </div>
    );
  }

  const corePercent = ((coreValue - CORE_VALUE.min) / (CORE_VALUE.max - CORE_VALUE.min)) * 100;

  return (
    <div className="account-layout">
      {/* Left panel — settings */}
      <div className="account-panel">
        <h1 style={{ fontSize: '1.5rem', fontWeight: 300, letterSpacing: '0.3em', marginBottom: '2rem' }}>
          {t.account.title}
        </h1>

        <div className="setting-group">
          <label className="setting-label">{t.account.language}</label>
          <LanguageSelector current={language} onChange={setLanguage} />
        </div>

        <div className="setting-group">
          <label className="setting-label">{t.account.aura}</label>
          <AuraPicker current={aura} language={language} onChange={setAura} />
        </div>

        <div className="setting-group">
          <label className="setting-label">{t.account.coreValue}</label>
          <div className="core-bar">
            <div className="core-bar-fill" style={{ width: `${corePercent}%` }} />
            <span className="core-bar-label">{coreValue.toFixed(2)}</span>
          </div>
        </div>

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

      {/* Right panel — sphere preview */}
      <div className="sphere-preview-panel">
        <SpherePreview aura={aura} coreValue={coreValue} />
      </div>
    </div>
  );
}
