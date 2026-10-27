import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
import { LocalizedText } from '../interfaces/general/general';

/** Language existing titles were written in (backend `EVILFLOWERS_DEFAULT_LANGUAGE`). */
export const DEFAULT_CONTENT_LANGUAGE = 'sk';

/** Languages feed titles and category labels are entered in, Slovak first. */
export const CONTENT_LANGUAGES = [DEFAULT_CONTENT_LANGUAGE, 'en'];

/** Treat a plain string (older API responses) as the Slovak translation. */
export function toLocalized(value: LocalizedText | string | null | undefined): LocalizedText {
  if (!value) return {};
  if (typeof value === 'string') return { [DEFAULT_CONTENT_LANGUAGE]: value };
  return value;
}

/**
 * Pick the translation for `language` from a localized text sent by the API
 * ({ sk: '…', en: '…' }). Falls back to the default content language, then English,
 * then any translation. A plain string is returned as is.
 */
export function localize(value: LocalizedText | string | null | undefined, language: string = i18next.language): string {
  if (!value) return '';
  if (typeof value === 'string') return value;

  const code = (language || '').slice(0, 2).toLowerCase();
  for (const candidate of [code, DEFAULT_CONTENT_LANGUAGE, 'en']) {
    if (candidate && value[candidate]?.trim()) return value[candidate];
  }
  return Object.values(value).find((text) => text?.trim()) ?? '';
}

/** `localize` bound to the current UI language; components re-render when it changes. */
export function useLocalize() {
  const { i18n } = useTranslation();
  return useCallback(
    (value: LocalizedText | string | null | undefined) => localize(value, i18n.language),
    [i18n.language]
  );
}

/** Drop empty translations before sending a localized text to the API. */
export function cleanLocalized(value: LocalizedText): LocalizedText {
  return Object.fromEntries(
    Object.entries(value)
      .map(([code, text]) => [code, text.trim()] as const)
      .filter(([, text]) => text)
  );
}

/** True when any translation of `value` contains `query` (case-insensitive). */
export function localizedIncludes(value: LocalizedText | string | null | undefined, query: string): boolean {
  if (!value) return false;
  const q = query.toLowerCase();
  const texts = typeof value === 'string' ? [value] : Object.values(value);
  return texts.some((text) => text?.toLowerCase().includes(q));
}
