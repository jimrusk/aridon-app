'use client';

import { useEffect, useRef, useState } from 'react';
import { ARIDON_LOCALES, DEFAULT_ARIDON_LOCALE, type AridonLocale, isAridonLocale } from '../../lib/aridonLocales';

const STORAGE_KEY = 'aridon_locale';
const CACHE_KEY_PREFIX = 'aridon_translation_cache_v1_';
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE', 'PRE', 'SVG', 'PATH']);
const ATTRIBUTE_NAMES = ['placeholder', 'title', 'aria-label'] as const;

type AttrName = (typeof ATTRIBUTE_NAMES)[number];
type TranslationCache = Record<string, string>;

function looksTranslatable(value: string) {
  const text = value.trim();
  if (text.length < 2 || text.length > 1_200) return false;
  if (/^(https?:\/\/|www\.|mailto:|tel:)/i.test(text)) return false;
  if (/^[\d\s.,:$%+\-–—/()#]+$/.test(text)) return false;
  if (/^[A-Z0-9_.\-/]{2,30}$/.test(text) && !text.includes(' ')) return false;
  return /[A-Za-z]/.test(text);
}

function shouldSkipElement(element: Element | null) {
  if (!element) return true;
  if (SKIP_TAGS.has(element.tagName)) return true;
  if (element.closest('[data-no-translate="true"]')) return true;
  if (element.closest('[contenteditable="true"]')) return true;
  return false;
}

function loadCache(locale: AridonLocale): TranslationCache {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(`${CACHE_KEY_PREFIX}${locale}`);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function saveCache(locale: AridonLocale, cache: TranslationCache) {
  try {
    const entries = Object.entries(cache);
    const trimmed = entries.length > 1_500 ? Object.fromEntries(entries.slice(entries.length - 1_500)) : cache;
    window.localStorage.setItem(`${CACHE_KEY_PREFIX}${locale}`, JSON.stringify(trimmed));
  } catch {
    // Translation still works without local cache when storage is unavailable.
  }
}

export default function GlobalLanguageLayer() {
  const [locale, setLocale] = useState<AridonLocale>(DEFAULT_ARIDON_LOCALE);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const originalText = useRef(new WeakMap<Text, string>());
  const lastRenderedText = useRef(new WeakMap<Text, string>());
  const originalAttrs = useRef(new WeakMap<Element, Partial<Record<AttrName, string>>>());
  const lastRenderedAttrs = useRef(new WeakMap<Element, Partial<Record<AttrName, string>>>());
  const cacheRef = useRef<TranslationCache>({});
  const scheduled = useRef<number | null>(null);
  const activeRun = useRef(0);

  useEffect(() => {
    const urlLocale = new URL(window.location.href).searchParams.get('lang');
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const initial = isAridonLocale(urlLocale) ? urlLocale : isAridonLocale(stored) ? stored : DEFAULT_ARIDON_LOCALE;
    setLocale(initial);
    cacheRef.current = loadCache(initial);
    document.documentElement.lang = initial;
    document.cookie = `aridon_locale=${encodeURIComponent(initial)}; path=/; max-age=31536000; samesite=lax`;
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(STORAGE_KEY, locale);
    cacheRef.current = loadCache(locale);
    document.documentElement.lang = locale;
    document.cookie = `aridon_locale=${encodeURIComponent(locale)}; path=/; max-age=31536000; samesite=lax`;

    const url = new URL(window.location.href);
    if (locale === DEFAULT_ARIDON_LOCALE) url.searchParams.delete('lang');
    else url.searchParams.set('lang', locale);
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);

    const run = ++activeRun.current;
    void translateDocument(locale, run);

    const observer = new MutationObserver(() => scheduleTranslation(locale));
    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: [...ATTRIBUTE_NAMES] });
    return () => observer.disconnect();
  }, [locale, ready]);

  function scheduleTranslation(targetLocale: AridonLocale) {
    if (scheduled.current !== null) window.clearTimeout(scheduled.current);
    scheduled.current = window.setTimeout(() => {
      scheduled.current = null;
      const run = ++activeRun.current;
      void translateDocument(targetLocale, run);
    }, 180);
  }

  async function translateDocument(targetLocale: AridonLocale, run: number) {
    if (!document.body) return;
    setBusy(targetLocale !== 'en');

    const textNodes: Text[] = [];
    const elements: Element[] = [];
    const values = new Set<string>();

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let current = walker.nextNode();
    while (current) {
      const node = current as Text;
      const parent = node.parentElement;
      if (!shouldSkipElement(parent)) {
        const now = node.textContent || '';
        const priorRendered = lastRenderedText.current.get(node);
        if (!originalText.current.has(node) || (priorRendered !== undefined && now !== priorRendered)) {
          originalText.current.set(node, now);
        }
        const original = originalText.current.get(node) || '';
        if (looksTranslatable(original)) {
          textNodes.push(node);
          values.add(original.trim());
        }
      }
      current = walker.nextNode();
    }

    for (const element of Array.from(document.querySelectorAll('*'))) {
      if (shouldSkipElement(element)) continue;
      let originals = originalAttrs.current.get(element) || {};
      let rendered = lastRenderedAttrs.current.get(element) || {};
      let touched = false;
      for (const attr of ATTRIBUTE_NAMES) {
        const now = element.getAttribute(attr);
        if (!now) continue;
        if (!(attr in originals) || (rendered[attr] !== undefined && now !== rendered[attr])) originals[attr] = now;
        const original = originals[attr] || '';
        if (looksTranslatable(original)) values.add(original.trim());
        touched = true;
      }
      if (touched) {
        originalAttrs.current.set(element, originals);
        elements.push(element);
      }
    }

    if (targetLocale === 'en') {
      for (const node of textNodes) {
        const original = originalText.current.get(node) || node.textContent || '';
        if (node.textContent !== original) node.textContent = original;
        lastRenderedText.current.set(node, original);
      }
      for (const element of elements) {
        const originals = originalAttrs.current.get(element) || {};
        const rendered: Partial<Record<AttrName, string>> = {};
        for (const attr of ATTRIBUTE_NAMES) {
          const original = originals[attr];
          if (original !== undefined) {
            if (element.getAttribute(attr) !== original) element.setAttribute(attr, original);
            rendered[attr] = original;
          }
        }
        lastRenderedAttrs.current.set(element, rendered);
      }
      setBusy(false);
      return;
    }

    const cache = cacheRef.current;
    const missing = Array.from(values).filter((value) => !cache[value]);

    for (let index = 0; index < missing.length; index += 70) {
      if (run !== activeRun.current) return;
      const batch = missing.slice(index, index + 70);
      try {
        const response = await fetch('/api/i18n/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ locale: targetLocale, strings: batch }),
        });
        if (!response.ok) continue;
        const data = await response.json();
        if (!Array.isArray(data?.translations) || data.translations.length !== batch.length) continue;
        batch.forEach((source, itemIndex) => {
          const translated = data.translations[itemIndex];
          if (typeof translated === 'string' && translated.trim()) cache[source] = translated;
        });
        saveCache(targetLocale, cache);
      } catch (error) {
        console.warn('Aridon localization batch failed', error);
      }
    }

    if (run !== activeRun.current) return;

    for (const node of textNodes) {
      const original = originalText.current.get(node) || '';
      const trimmed = original.trim();
      const translated = cache[trimmed];
      if (!translated) continue;
      const leading = original.match(/^\s*/)?.[0] || '';
      const trailing = original.match(/\s*$/)?.[0] || '';
      const desired = `${leading}${translated}${trailing}`;
      if (node.textContent !== desired) node.textContent = desired;
      lastRenderedText.current.set(node, desired);
    }

    for (const element of elements) {
      const originals = originalAttrs.current.get(element) || {};
      const rendered: Partial<Record<AttrName, string>> = {};
      for (const attr of ATTRIBUTE_NAMES) {
        const original = originals[attr];
        if (!original) continue;
        const translated = cache[original.trim()];
        const desired = translated || original;
        if (element.getAttribute(attr) !== desired) element.setAttribute(attr, desired);
        rendered[attr] = desired;
      }
      lastRenderedAttrs.current.set(element, rendered);
    }

    setBusy(false);
  }

  return (
    <div
      data-no-translate="true"
      style={{
        position: 'fixed',
        right: 14,
        bottom: 14,
        zIndex: 2147483000,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 10px',
        borderRadius: 14,
        background: 'rgba(7,16,29,.94)',
        border: '1px solid rgba(158,240,207,.32)',
        boxShadow: '0 12px 34px rgba(0,0,0,.28)',
        color: '#fff',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <span aria-hidden="true" style={{ fontSize: 16 }}>🌐</span>
      <select
        aria-label="Aridon language"
        value={locale}
        onChange={(event) => setLocale(event.target.value as AridonLocale)}
        style={{
          border: 0,
          background: 'transparent',
          color: '#fff',
          fontWeight: 800,
          fontSize: 13,
          outline: 'none',
          maxWidth: 175,
        }}
      >
        {ARIDON_LOCALES.map((option) => (
          <option key={option.code} value={option.code} style={{ color: '#111' }}>
            {option.nativeLabel} · {option.city}
          </option>
        ))}
      </select>
      {busy ? <span title="Translating" style={{ fontSize: 11, color: '#9EF0CF' }}>•••</span> : null}
    </div>
  );
}
