'use client';

// In-memory cache for fast lookup during session
const memoryCache = new Map<string, string>();
// Pending in-flight promises to avoid duplicate requests
const inFlight = new Map<string, Promise<string>>();

const STORAGE_PREFIX = 'aps_trans_v1:';

function getStorageKey(text: string): string {
  // Simple hash for long strings
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return `${STORAGE_PREFIX}${hash}_${text.slice(0, 24).replace(/[^a-zA-Z0-9]/g, '_')}`;
}

export function getCachedTranslation(text?: string | null): string | null {
  if (!text || typeof window === 'undefined') return null;
  const trimmed = text.trim();
  if (!trimmed) return trimmed;

  if (memoryCache.has(trimmed)) {
    return memoryCache.get(trimmed)!;
  }

  try {
    const key = getStorageKey(trimmed);
    const stored = localStorage.getItem(key);
    if (stored) {
      memoryCache.set(trimmed, stored);
      return stored;
    }
  } catch {
    // localStorage may be disabled or quota reached
  }

  return null;
}

export function saveCachedTranslation(original: string, translated: string) {
  if (!original || !translated || typeof window === 'undefined') return;
  const trimmed = original.trim();
  memoryCache.set(trimmed, translated);

  try {
    const key = getStorageKey(trimmed);
    localStorage.setItem(key, translated);
  } catch {
    // ignore quota errors
  }
}

/**
 * Translates a single text from FR to EN using the server endpoint.
 * Caches in memory and localStorage.
 */
export async function clientTranslateText(text: string, context?: string): Promise<string> {
  if (!text || !text.trim()) return text;
  const trimmed = text.trim();

  // Check cache first
  const cached = getCachedTranslation(trimmed);
  if (cached) return cached;

  // Check in-flight
  if (inFlight.has(trimmed)) {
    return inFlight.get(trimmed)!;
  }

  const promise = (async () => {
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: trimmed, context }),
      });

      if (!res.ok) {
        console.warn(`Translation API HTTP ${res.status}`);
        return trimmed;
      }

      const data = await res.json();
      const translation = data.translation || trimmed;
      saveCachedTranslation(trimmed, translation);

      // Dispatch event to notify any waiting components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('aps_translation_updated', {
            detail: { original: trimmed, translation },
          })
        );
      }

      return translation;
    } catch (e) {
      console.warn('clientTranslateText error:', e);
      return trimmed;
    } finally {
      inFlight.delete(trimmed);
    }
  })();

  inFlight.set(trimmed, promise);
  return promise;
}

/**
 * Batch translates an array of texts.
 */
export async function clientTranslateBatch(texts: string[], context?: string): Promise<string[]> {
  if (!texts || texts.length === 0) return [];

  const results: string[] = new Array(texts.length);
  const toFetchIndices: number[] = [];
  const toFetchTexts: string[] = [];

  texts.forEach((t, idx) => {
    if (!t || !t.trim()) {
      results[idx] = t || '';
      return;
    }
    const cached = getCachedTranslation(t.trim());
    if (cached) {
      results[idx] = cached;
    } else {
      toFetchIndices.push(idx);
      toFetchTexts.push(t);
    }
  });

  if (toFetchIndices.length === 0) {
    return results;
  }

  try {
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts: toFetchTexts, context }),
    });

    if (res.ok) {
      const data = await res.json();
      const translations: string[] = data.translations || [];
      toFetchIndices.forEach((origIdx, i) => {
        const trans = translations[i] || toFetchTexts[i];
        results[origIdx] = trans;
        saveCachedTranslation(toFetchTexts[i], trans);
      });

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('aps_translation_updated'));
      }
    } else {
      toFetchIndices.forEach((origIdx, i) => {
        results[origIdx] = toFetchTexts[i];
      });
    }
  } catch (err) {
    console.warn('Batch translation error:', err);
    toFetchIndices.forEach((origIdx, i) => {
      results[origIdx] = toFetchTexts[i];
    });
  }

  return results;
}

/**
 * Batch translates fields of an object from French to English.
 */
export async function clientTranslateFields(
  fields: Record<string, string>,
  context?: string
): Promise<Record<string, string>> {
  const keys = Object.keys(fields);
  if (keys.length === 0) return {};

  const values = keys.map((k) => fields[k]);
  const translatedValues = await clientTranslateBatch(values, context);

  const out: Record<string, string> = {};
  keys.forEach((k, i) => {
    out[k] = translatedValues[i] || fields[k];
  });
  return out;
}
