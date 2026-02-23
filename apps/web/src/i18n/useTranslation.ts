import { useUserStore } from '../stores/userStore';
import { getTranslations, type Translations } from './translations';

export function useTranslation(): Translations {
  const language = useUserStore((s) => s.language);
  return getTranslations(language);
}
