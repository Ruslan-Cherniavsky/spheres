import { SUPPORTED_LANGUAGES } from '@spheres/shared';
import type { SupportedLanguage } from '@spheres/shared';

const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  en: 'English',
  he: 'עברית',
  ru: 'Русский',
};

export default function LanguageSelector({
  current,
  onChange,
}: {
  current: SupportedLanguage;
  onChange: (lang: SupportedLanguage) => void;
}) {
  return (
    <div style={{ display: 'flex', gap: '6px' }}>
      {SUPPORTED_LANGUAGES.map((lang) => {
        const isActive = lang === current;
        return (
          <button
            key={lang}
            onClick={() => onChange(lang)}
            style={{
              padding: '6px 14px',
              background: isActive ? 'var(--accent)' : 'var(--surface)',
              border: isActive ? '1px solid var(--accent)' : '1px solid var(--border)',
              borderRadius: '6px',
              color: isActive ? '#fff' : 'var(--text-secondary)',
              fontSize: '0.8rem',
              fontWeight: isActive ? 500 : 400,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {LANGUAGE_NAMES[lang]}
          </button>
        );
      })}
    </div>
  );
}
