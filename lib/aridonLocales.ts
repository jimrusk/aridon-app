export const ARIDON_LOCALES = [
  { code: 'en', label: 'English', city: 'London', nativeLabel: 'English' },
  { code: 'kn', label: 'Kannada', city: 'Bengaluru', nativeLabel: 'ಕನ್ನಡ' },
  { code: 'ja', label: 'Japanese', city: 'Tokyo', nativeLabel: '日本語' },
  { code: 'ko', label: 'Korean', city: 'Seoul', nativeLabel: '한국어' },
  { code: 'de', label: 'German', city: 'Berlin', nativeLabel: 'Deutsch' },
  { code: 'fr', label: 'French', city: 'Paris', nativeLabel: 'Français' },
  { code: 'pt-BR', label: 'Brazilian Portuguese', city: 'São Paulo', nativeLabel: 'Português (Brasil)' },
  { code: 'es-MX', label: 'Mexican Spanish', city: 'Mexico City', nativeLabel: 'Español (México)' },
] as const;

export type AridonLocale = (typeof ARIDON_LOCALES)[number]['code'];

export const DEFAULT_ARIDON_LOCALE: AridonLocale = 'en';

export const ARIDON_LOCALE_CODES = new Set<string>(ARIDON_LOCALES.map((locale) => locale.code));

export function isAridonLocale(value: unknown): value is AridonLocale {
  return typeof value === 'string' && ARIDON_LOCALE_CODES.has(value);
}

export function getAridonLocale(code: AridonLocale) {
  return ARIDON_LOCALES.find((locale) => locale.code === code) || ARIDON_LOCALES[0];
}

export const LOCALE_DIRECTION: Record<AridonLocale, 'ltr' | 'rtl'> = {
  en: 'ltr',
  kn: 'ltr',
  ja: 'ltr',
  ko: 'ltr',
  de: 'ltr',
  fr: 'ltr',
  'pt-BR': 'ltr',
  'es-MX': 'ltr',
};
