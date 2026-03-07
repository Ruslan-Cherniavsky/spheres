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
  contactRequestTimeoutMs: 30_000,
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

/**
 * Derives rings color from aura color.
 * Same hue, reduced saturation (60%), lower brightness.
 * Rings feel structural, not like glow.
 */
export function auraToRingsColor(auraHex: string): string {
  const r = parseInt(auraHex.slice(1, 3), 16) / 255;
  const g = parseInt(auraHex.slice(3, 5), 16) / 255;
  const b = parseInt(auraHex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  const newS = Math.min(s * 0.20, 0.30);
  const newL = Math.min(l * 0.52, 0.52);
  return hslToHex(h, newS, newL);
}

function hslToHex(h: number, s: number, l: number): string {
  let r: number, g: number, b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return '#' + [r, g, b].map((x) => Math.round(x * 255).toString(16).padStart(2, '0')).join('');
}

function hue2rgb(p: number, q: number, t: number): number {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}

/** Maps coreValue (-1..1) to karma ring count (1..7). 0 = 4 rings (default). */
export function coreValueToRingCount(coreValue: number): number {
  const t = (coreValue - CORE_VALUE.min) / (CORE_VALUE.max - CORE_VALUE.min);
  return Math.round(t * 6) + 1;
}

const RING_INNER = 0.58;
const RING_OUTER = 1.1;
const RING_GAP = 0.012;
const GAP_SCALE = [0.6, 1.2, 0.9, 1.15, 0.95, 1.8];
const WIDTH_SCALE = [0.7, 1.1, 0.95, 1.6, 0.88, 1.7, 0.92];

export interface RingBand {
  inner: number;
  outer: number;
  opacityScale: number;
  zOff: number;
}

/** Ring layout for karma rings. 1–3 rings scale up; 4–7 use fixed size. */
export function getRingLayout(count: number): RingBand[] {
  const sizeScale = count < 4 ? count / 4 : 1;
  const fullSpan = RING_OUTER - RING_INNER;
  const totalSpace = fullSpan * sizeScale;
  const gaps =
    count > 1
      ? Array.from({ length: count - 1 }, (_, i) => RING_GAP * (GAP_SCALE[i % GAP_SCALE.length] ?? 1))
      : [];
  const totalGaps = gaps.reduce((a, b) => a + b, 0);
  const bandArea = totalSpace - totalGaps;

  const baseScales =
    count > 1 ? Array.from({ length: count }, (_, i) => 0.5 + (0.5 * i) / (count - 1)) : [1];
  const widthJitter = baseScales.map((s, i) => s * (WIDTH_SCALE[i % WIDTH_SCALE.length] ?? 1));
  const norm = bandArea / widthJitter.reduce((a, b) => a + b, 0);

  const rings: RingBand[] = [];
  let cursor = RING_INNER;
  for (let i = 0; i < count; i++) {
    const width = widthJitter[i] * norm;
    rings.push({
      inner: cursor,
      outer: cursor + width,
      opacityScale: 1 - i * (0.4 / 7),
      zOff: i * 0.004,
    });
    cursor += width + (gaps[i] ?? 0);
  }
  return rings;
}

export const SUPPORTED_LANGUAGES: readonly SupportedLanguage[] = ['en', 'he', 'ru'];

/**
 * Maps a value on the [-1, 1] spectrum to a color.
 * -1 = deep crimson, 0 = clean white, +1 = bright cyan.
 * Used for aura spectrum visualization (core now follows aura).
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
      g: Math.round(255 - p * 255),
      b: Math.round(255 - p * 255),
    };
  }
}
