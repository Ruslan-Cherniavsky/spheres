import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useTranslation } from '../i18n/useTranslation';

export default function LoginPage() {
  const { user, loading, error, signIn, signUp, signInWithGoogle, sendVerification, reloadUser, clearError } =
    useAuthStore();
  const t = useTranslation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [verificationSent, setVerificationSent] = useState(false);

  // Authenticated + verified → go to account
  if (user && user.emailVerified) {
    return <Navigate to="/account" replace />;
  }

  // Authenticated but not verified → show verification screen
  if (user && !user.emailVerified) {
    return (
      <div className="page-center">
        <div className="auth-card">
          <h1 className="app-title">{t.app.title}</h1>
          <div className="verify-section">
            <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>
              {t.auth.verifyEmailTitle}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5, marginBottom: '1rem' }}>
              {t.auth.verifyEmailMessage}
            </p>
            {verificationSent && (
              <p style={{ color: 'var(--success)', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
                {t.auth.verificationSent}
              </p>
            )}
            <button
              className="btn btn-secondary"
              onClick={async () => {
                await sendVerification();
                setVerificationSent(true);
              }}
              style={{ marginBottom: '0.5rem', width: '100%' }}
            >
              {t.auth.resendVerification}
            </button>
            <button
              className="btn btn-primary"
              onClick={async () => {
                await reloadUser();
              }}
              style={{ width: '100%' }}
            >
              {t.auth.checkVerification}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      if (mode === 'signin') {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
    } catch {
      // error is set in store
    }
  };

  return (
    <div className="page-center">
      <div className="auth-card">
        <h1 className="app-title">{t.app.title}</h1>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label htmlFor="email">{t.auth.email}</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">{t.auth.password}</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            />
          </div>

          {error && (
            <p className="error-text">{error}</p>
          )}

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {mode === 'signin' ? t.auth.signIn : t.auth.signUp}
          </button>
        </form>

        <p className="auth-switch">
          {mode === 'signin' ? t.auth.noAccount : t.auth.hasAccount}{' '}
          <button
            className="link-btn"
            onClick={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin');
              clearError();
            }}
          >
            {mode === 'signin' ? t.auth.signUp : t.auth.signIn}
          </button>
        </p>

        <div className="divider">
          <span>or</span>
        </div>

        <button
          className="btn btn-google"
          onClick={signInWithGoogle}
          disabled={loading}
        >
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          {t.auth.googleSignIn}
        </button>
      </div>
    </div>
  );
}
