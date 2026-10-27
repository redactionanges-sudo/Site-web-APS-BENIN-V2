import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

// In-memory server-side cache
const translationCache = new Map<string, string>();
const MAX_CACHE_SIZE = 3000;

// Rate limit protection for Gemini Free Tier (strictly 5 RPM limit)
let rateLimitedUntil = 0;
const recentRequestTimestamps: number[] = [];
const RATE_LIMIT_WINDOW_MS = 60000;
const MAX_REQUESTS_PER_WINDOW = 4; // Safely stay under the 5 RPM ceiling

function getCacheKey(text: string, context?: string): string {
  return `${context || 'general'}::${text.trim()}`;
}

function setInCache(key: string, val: string) {
  if (translationCache.size >= MAX_CACHE_SIZE) {
    const firstKey = translationCache.keys().next().value;
    if (firstKey) translationCache.delete(firstKey);
  }
  translationCache.set(key, val);
}

function canMakeGeminiRequest(): boolean {
  const now = Date.now();
  if (now < rateLimitedUntil) {
    return false;
  }
  // Remove timestamps older than 60 seconds
  while (
    recentRequestTimestamps.length > 0 &&
    now - recentRequestTimestamps[0] > RATE_LIMIT_WINDOW_MS
  ) {
    recentRequestTimestamps.shift();
  }
  return recentRequestTimestamps.length < MAX_REQUESTS_PER_WINDOW;
}

function recordGeminiRequest(): void {
  recentRequestTimestamps.push(Date.now());
}

function triggerCooldown(ms = 65000): void {
  rateLimitedUntil = Date.now() + ms;
}

function parseJsonArraySafely(raw?: string | null): string[] | null {
  if (!raw) return null;
  let text = raw.trim();

  // Strip markdown code fences if present
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }

  try {
    const res = JSON.parse(text);
    if (Array.isArray(res)) return res.map((item) => String(item ?? ''));
    if (res && Array.isArray(res.translations)) {
      return res.translations.map((item: any) => String(item ?? ''));
    }
  } catch {}

  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start !== -1 && end > start) {
    try {
      const slice = text.slice(start, end + 1);
      const res = JSON.parse(slice);
      if (Array.isArray(res)) return res.map((item) => String(item ?? ''));
    } catch {}
  }
  return null;
}

const SYSTEM_INSTRUCTION = `You are an expert official bilingual translator for AGISSONS POUR SAUVER (APS-BÉNIN), an accredited NGO based in Comè, Department of Mono, Republic of Benin. APS-BÉNIN works for human rights, gender equality, sexual and reproductive health and rights (SRHR / DSSR), youth empowerment, and socio-economic support for vulnerable communities.

Your task is to translate French content into accurate, natural, professional English suited for international donors, institutional partners (UN, USAID, EU, NGOs), and the public.

MANDATORY RULES:
1. PRESERVE PROPER NOUNS & PLACES EXACTLY:
   - "AGISSONS POUR SAUVER", "APS-BÉNIN", "APS-BENIN"
   - Beninese towns and departments: "Comè", "Mono", "Bénin", "Benin", "Grand-Popo", "Athiémé", "Houéyogbé", "Bopa", "Lokossa", "Djacoṭé", "Djacoṭé-Comè", "Cotonou"
   - Names of people, partners, and institutions
2. PRESERVE ALL FORMATTING, HTML, AND SPECIAL DATA:
   - Keep all HTML tags intact (<p>, </p>, <strong>, <em>, <ul>, <ol>, <li>, <h3>, <h4>, <a>, <br>, <blockquote>, etc.)
   - Do NOT delete, reorder, or break tags
   - Keep all URLs, email addresses, phone numbers, numbers, dates, and amounts (FCFA, XOF, EUR, USD) intact
3. ADAPT HUMANITARIAN TERMINOLOGY ACCURATELY:
   - "Droits en santé sexuelle et reproductive (DSSR)" -> "Sexual and Reproductive Health and Rights (SRHR)"
   - "Violences basées sur le genre (VBG)" -> "Gender-Based Violence (GBV)"
   - "Appel d'offres" -> "Call for Tenders"
   - "Termes de référence (TDR)" -> "Terms of Reference (TOR)"
   - "Recrutement" -> "Recruitment"
   - "Stage" -> "Internship"
   - "Volontariat" -> "Volunteering"
   - "Consultation" -> "Consultancy"
   - "En cours" -> "In Progress"
   - "Clôturée" -> "Closed"
   - "Bailleurs" -> "Donors / Funding Partners"
4. OUTPUT DISCIPLINE:
   - Output ONLY the translated content or JSON structure. Never add conversational filler, preambles, or explanations.`;

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY not configured', fallback: true },
        { status: 200 }
      );
    }

    const body = await req.json();
    const { text, texts, fields, context } = body;

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        timeout: 8000,
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const withTimeout = async <T>(promise: Promise<T>, ms = 8000): Promise<T> => {
      let timer: NodeJS.Timeout;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`Timeout of ${ms}ms exceeded`)), ms);
      });
      try {
        return await Promise.race([promise, timeoutPromise]);
      } finally {
        // @ts-expect-error timer used after assignment
        if (timer) clearTimeout(timer);
      }
    };

    // Helper for single text translation with rate limit guard & cache
    const translateSingleText = async (src: string, ctx?: string): Promise<string> => {
      const trimmed = src.trim();
      if (!trimmed) return src;

      const cacheKey = getCacheKey(trimmed, ctx);
      if (translationCache.has(cacheKey)) {
        return translationCache.get(cacheKey)!;
      }

      // Check rate limit safety before calling
      if (!canMakeGeminiRequest()) {
        return trimmed;
      }

      try {
        recordGeminiRequest();
        const response = await withTimeout(
          ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: trimmed,
            config: {
              systemInstruction: SYSTEM_INSTRUCTION,
              temperature: 0.1,
            },
          }),
          8000
        );
        const translation = response.text?.trim() || trimmed;
        setInCache(cacheKey, translation);
        return translation;
      } catch (err: any) {
        const errMsg = String(err?.message || err);
        if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota')) {
          triggerCooldown(65000);
          console.warn('Gemini Free Tier rate limit (5 RPM) reached. Activating 65s cooldown fallback.');
        } else if (
          errMsg.includes('Timeout') ||
          errMsg.includes('timeout') ||
          errMsg.includes('HeadersTimeoutError') ||
          errMsg.includes('fetch failed')
        ) {
          console.warn('Gemini request timeout or network latency; returning original text fallback.');
        } else {
          console.warn('Translation error, using fallback:', errMsg.slice(0, 100));
        }
        return trimmed;
      }
    };

    // 1. Single string translation
    if (typeof text === 'string') {
      const translation = await translateSingleText(text, context);
      return NextResponse.json({ translation });
    }

    // 2. Batch array of strings
    if (Array.isArray(texts)) {
      if (texts.length === 0) {
        return NextResponse.json({ translations: [] });
      }

      const results: string[] = new Array(texts.length);
      const toTranslateIndices: number[] = [];
      const toTranslateTexts: string[] = [];

      texts.forEach((item, idx) => {
        if (!item || typeof item !== 'string' || !item.trim()) {
          results[idx] = item || '';
          return;
        }
        const cacheKey = getCacheKey(item.trim(), context);
        if (translationCache.has(cacheKey)) {
          results[idx] = translationCache.get(cacheKey)!;
        } else {
          // Pre-fill with original text as default safe fallback
          results[idx] = item;
          toTranslateIndices.push(idx);
          toTranslateTexts.push(item);
        }
      });

      // If all items were cached or nothing to translate, return immediately
      if (toTranslateIndices.length === 0) {
        return NextResponse.json({ translations: results });
      }

      // If we cannot make a Gemini request due to cooldown or RPM limits, return fallback without crashing
      if (!canMakeGeminiRequest()) {
        return NextResponse.json({ translations: results, fallback: true });
      }

      try {
        recordGeminiRequest();
        const prompt = JSON.stringify(toTranslateTexts);
        const response = await withTimeout(
          ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: `Translate the following JSON array of French texts into English. Return ONLY a valid JSON array of strings of identical length and ordering:\n${prompt}`,
            config: {
              systemInstruction: SYSTEM_INSTRUCTION,
              responseMimeType: 'application/json',
              temperature: 0.1,
            },
          }),
          8000
        );

        const parsed = parseJsonArraySafely(response.text);
        if (Array.isArray(parsed) && parsed.length === toTranslateTexts.length) {
          parsed.forEach((translated, i) => {
            const originalIdx = toTranslateIndices[i];
            const originalText = toTranslateTexts[i];
            const safeTranslation = String(translated || originalText);
            results[originalIdx] = safeTranslation;
            setInCache(getCacheKey(originalText.trim(), context), safeTranslation);
          });
        } else if (Array.isArray(parsed) && parsed.length > 0) {
          // Partial match: assign what we have safely
          parsed.forEach((translated, i) => {
            if (i < toTranslateIndices.length) {
              const originalIdx = toTranslateIndices[i];
              const originalText = toTranslateTexts[i];
              const safeTranslation = String(translated || originalText);
              results[originalIdx] = safeTranslation;
              setInCache(getCacheKey(originalText.trim(), context), safeTranslation);
            }
          });
        }
      } catch (e: any) {
        const errMsg = String(e?.message || e);
        if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota')) {
          triggerCooldown(65000);
          console.warn('Gemini Free Tier rate limit (5 RPM) reached during batch. Activating 65s cooldown fallback.');
        } else if (
          errMsg.includes('Timeout') ||
          errMsg.includes('timeout') ||
          errMsg.includes('HeadersTimeoutError') ||
          errMsg.includes('fetch failed')
        ) {
          console.warn('Batch translation timed out or network error; using original text fallback.');
        } else {
          console.warn('Batch translation failed, safely returning original text:', errMsg.slice(0, 100));
        }
        // Fallback: results already contains the original text. DO NOT run Promise.all parallel fallback requests.
      }

      return NextResponse.json({ translations: results });
    }

    // 3. Key-value fields object
    if (fields && typeof fields === 'object') {
      const keys = Object.keys(fields);
      const values = keys.map((k) => String(fields[k] || ''));
      const translatedMap: Record<string, string> = {};
      const toTranslateIndices: number[] = [];
      const toTranslateTexts: string[] = [];

      keys.forEach((key, idx) => {
        const val = values[idx];
        if (!val || !val.trim()) {
          translatedMap[key] = val;
          return;
        }
        const cacheKey = getCacheKey(val.trim(), `${context}_${key}`);
        if (translationCache.has(cacheKey)) {
          translatedMap[key] = translationCache.get(cacheKey)!;
        } else {
          // Pre-fill with original text as safe fallback
          translatedMap[key] = val;
          toTranslateIndices.push(idx);
          toTranslateTexts.push(val);
        }
      });

      if (toTranslateIndices.length === 0) {
        return NextResponse.json({ translatedFields: translatedMap });
      }

      if (!canMakeGeminiRequest()) {
        return NextResponse.json({ translatedFields: translatedMap, fallback: true });
      }

      try {
        recordGeminiRequest();
        const prompt = JSON.stringify(toTranslateTexts);
        const response = await withTimeout(
          ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: `Translate the following JSON array of French fields into English. Return ONLY a valid JSON array of strings in identical order:\n${prompt}`,
            config: {
              systemInstruction: SYSTEM_INSTRUCTION,
              responseMimeType: 'application/json',
              temperature: 0.1,
            },
          }),
          8000
        );

        const parsed = parseJsonArraySafely(response.text);
        if (Array.isArray(parsed) && parsed.length === toTranslateTexts.length) {
          toTranslateIndices.forEach((origIdx, i) => {
            const k = keys[origIdx];
            const origVal = values[origIdx];
            const transVal = String(parsed[i] || origVal);
            translatedMap[k] = transVal;
            setInCache(getCacheKey(origVal.trim(), `${context}_${k}`), transVal);
          });
        } else if (Array.isArray(parsed) && parsed.length > 0) {
          toTranslateIndices.forEach((origIdx, i) => {
            if (i < parsed.length) {
              const k = keys[origIdx];
              const origVal = values[origIdx];
              const transVal = String(parsed[i] || origVal);
              translatedMap[k] = transVal;
              setInCache(getCacheKey(origVal.trim(), `${context}_${k}`), transVal);
            }
          });
        }
      } catch (e: any) {
        const errMsg = String(e?.message || e);
        if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota')) {
          triggerCooldown(65000);
          console.warn('Gemini Free Tier rate limit reached during fields translation. Activating 65s cooldown.');
        } else if (
          errMsg.includes('Timeout') ||
          errMsg.includes('timeout') ||
          errMsg.includes('HeadersTimeoutError') ||
          errMsg.includes('fetch failed')
        ) {
          console.warn('Fields translation timed out or network error; using original text fallback.');
        } else {
          console.warn('Object fields batch translation failed, safely returning original text:', errMsg.slice(0, 100));
        }
        // Fallback: translatedMap is already populated with original text. DO NOT run Promise.all fallback!
      }

      // Ensure all keys are filled
      keys.forEach((k) => {
        if (translatedMap[k] === undefined) {
          translatedMap[k] = fields[k] || '';
        }
      });

      return NextResponse.json({ translatedFields: translatedMap });
    }

    return NextResponse.json(
      { error: 'Invalid payload: provide text, texts, or fields' },
      { status: 400 }
    );
  } catch (err: any) {
    console.warn('Translation API route warning:', err?.message || err);
    return NextResponse.json(
      { error: err?.message || 'Translation unavailable', fallback: true },
      { status: 200 } // Return 200 with fallback to avoid breaking client views
    );
  }
}
