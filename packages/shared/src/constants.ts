import type { AuraType, SupportedLanguage } from './types';

/**
 * Aura spectrum: top (enlightened/cyan) → middle (neutral/white) → bottom (hopelessness/crimson)
 * SOS is a special pulsing red state outside the normal spectrum.
 */
export const AURA_COLORS: Record<AuraType, string> = {
  enlightened:   '#00f0ff',
  inspiration:   '#40e8f8',
  joy:           '#70dce8',
  gratitude:     '#98d2dc',
  confidence:    '#b8ccd2',
  calm:          '#cccece',
  neutral:       '#d8d8d8',
  doubt:         '#d8c4b4',
  anxiety:       '#dc9e7a',
  sadness:       '#e07858',
  apathy:        '#e45838',
  irritation:    '#e83820',
  anger:         '#ee1818',
  despair:       '#f40808',
  hopelessness:  '#ff0000',
  sos:           '#ff0000',
};

export const AURA_LIST: AuraType[] = [
  'enlightened', 'inspiration', 'joy', 'gratitude', 'confidence',
  'calm', 'neutral', 'doubt', 'anxiety', 'sadness',
  'apathy', 'irritation', 'anger', 'despair', 'hopelessness',
];

export const AURA_LABELS: Record<AuraType, Record<SupportedLanguage, string>> = {
  enlightened:   { en: 'Enlightened Unity', he: 'אחדות מוארת',      ru: 'Просветление' },
  inspiration:   { en: 'Inspiration',       he: 'השראה',            ru: 'Вдохновение' },
  joy:           { en: 'Joy',               he: 'שמחה',             ru: 'Радость' },
  gratitude:     { en: 'Gratitude',         he: 'הכרת תודה',       ru: 'Благодарность' },
  confidence:    { en: 'Confidence',        he: 'ביטחון',           ru: 'Уверенность' },
  calm:          { en: 'Calm',              he: 'רוגע',             ru: 'Спокойствие' },
  neutral:       { en: 'Neutral',           he: 'ניטרלי',           ru: 'Нейтральный' },
  doubt:         { en: 'Doubt',             he: 'ספק',              ru: 'Сомнение' },
  anxiety:       { en: 'Anxiety',           he: 'חרדה',             ru: 'Тревога' },
  sadness:       { en: 'Sadness',           he: 'עצב',              ru: 'Грусть' },
  apathy:        { en: 'Apathy',            he: 'אדישות',           ru: 'Апатия' },
  irritation:    { en: 'Irritation',        he: 'עצבנות',           ru: 'Раздражение' },
  anger:         { en: 'Anger',             he: 'כעס',              ru: 'Гнев' },
  despair:       { en: 'Despair',           he: 'ייאוש',            ru: 'Отчаяние' },
  hopelessness:  { en: 'Hopelessness',      he: 'חוסר תקווה',      ru: 'Безнадёжность' },
  sos:           { en: 'SOS',               he: 'SOS',              ru: 'SOS' },
};

export const WORLD_CONFIG = {
  defaultWorldId: 'global-1',
  maxPlayersPerWorld: 50,
  positionUpdateRateHz: 10,
  proximityThreshold: 8,
  contactCooldownMs: 15_000,
  chatRateLimitMs: 200,
  worldBounds: { min: -200, max: 200 },
  boostMultiplier: 2.5,
  baseMoveSpeed: 0.3,
} as const;

export const CORE_VALUE = {
  min: -1,
  max: 1,
  default: 0,
  ratingStep: 0.05,
} as const;

export const SUPPORTED_LANGUAGES: readonly SupportedLanguage[] = ['en', 'he', 'ru'];

/**
 * Maps a value on the [-1, 1] spectrum to a color.
 * -1 = deep crimson, 0 = clean white, +1 = bright cyan.
 * Used for BOTH core rendering and aura spectrum visualization.
 */
export function spectrumColor(t: number): { r: number; g: number; b: number } {
  const clamped = Math.max(-1, Math.min(1, t));
  if (clamped >= 0) {
    const p = clamped;
    return {
      r: Math.round(255 - p * 255),
      g: Math.round(255 - p * 15),
      b: Math.round(255),
    };
  } else {
    const p = -clamped;
    return {
      r: Math.round(255),
      g: Math.round(255 - p * 215),
      b: Math.round(255 - p * 255),
    };
  }
}
