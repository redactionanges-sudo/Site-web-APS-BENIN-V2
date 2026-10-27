'use client';

// In-memory cache for fast lookup during session
const memoryCache = new Map<string, string>();
// Pending in-flight promises to avoid duplicate requests
const inFlight = new Map<string, Promise<string>>();

const STORAGE_PREFIX = 'aps_trans_v2:';

// Client-side cooldown guard (in ms) to avoid hammering server if quota is reached
let clientCooldownUntil = 0;

function getStorageKey(text: string): string {
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

// Queue for batching concurrent single translation requests into a single HTTP call
interface PendingQueueItem {
  text: string;
  context?: string;
  resolve: (val: string) => void;
}

let pendingBatchQueue: PendingQueueItem[] = [];
let batchDebounceTimer: NodeJS.Timeout | null = null;

function processBatchQueue() {
  batchDebounceTimer = null;
  if (pendingBatchQueue.length === 0) return;

  const currentBatch = pendingBatchQueue.splice(0, 25);
  const uniqueTextsToFetch: string[] = [];
  const textToItemsMap = new Map<string, PendingQueueItem[]>();

  currentBatch.forEach((item) => {
    const list = textToItemsMap.get(item.text) || [];
    list.push(item);
    textToItemsMap.set(item.text, list);

    if (!uniqueTextsToFetch.includes(item.text)) {
      uniqueTextsToFetch.push(item.text);
    }
  });

  // Call batch translation
  clientTranslateBatch(uniqueTextsToFetch, currentBatch[0]?.context)
    .then((translations) => {
      uniqueTextsToFetch.forEach((txt, idx) => {
        const trans = translations[idx] || txt;
        const items = textToItemsMap.get(txt) || [];
        items.forEach((item) => item.resolve(trans));
      });
    })
    .catch(() => {
      // Fallback: resolve all with their original text
      uniqueTextsToFetch.forEach((txt) => {
        const items = textToItemsMap.get(txt) || [];
        items.forEach((item) => item.resolve(txt));
      });
    });

  // If more items remain in queue, schedule next batch
  if (pendingBatchQueue.length > 0) {
    batchDebounceTimer = setTimeout(processBatchQueue, 150);
  }
}

/**
 * Translates a single text from FR to EN.
 * Automatically enqueues and batches concurrent calls into a single server request.
 */
export async function clientTranslateText(text: string, context?: string): Promise<string> {
  if (!text || !text.trim()) return text;
  const trimmed = text.trim();

  // 1. Check cache first
  const cached = getCachedTranslation(trimmed);
  if (cached) return cached;

  // 2. If in active client cooldown, return original text immediately without hitting server
  if (Date.now() < clientCooldownUntil) {
    return trimmed;
  }

  // 3. Check if already in-flight
  if (inFlight.has(trimmed)) {
    return inFlight.get(trimmed)!;
  }

  const promise = new Promise<string>((resolve) => {
    pendingBatchQueue.push({
      text: trimmed,
      context,
      resolve: (res) => {
        inFlight.delete(trimmed);
        resolve(res);
      },
    });

    if (!batchDebounceTimer) {
      batchDebounceTimer = setTimeout(processBatchQueue, 80);
    }
  });

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
      results[idx] = t; // Default fallback to original
      toFetchIndices.push(idx);
      toFetchTexts.push(t);
    }
  });

  if (toFetchIndices.length === 0) {
    return results;
  }

  // If in client-side cooldown, return original text without spamming server
  if (Date.now() < clientCooldownUntil) {
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
      if (data.fallback && data.rateLimited) {
        // Server notified us that rate limit is reached
        clientCooldownUntil = Date.now() + 30000;
      }

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
      if (res.status === 429) {
        clientCooldownUntil = Date.now() + 60000;
      }
    }
  } catch (err) {
    console.warn('Batch translation request error:', err);
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
