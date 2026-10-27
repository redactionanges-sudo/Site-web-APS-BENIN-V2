import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

// In-memory server-side cache
const translationCache = new Map<string, string>();
const MAX_CACHE_SIZE = 2500;

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

function parseJsonArraySafely(raw?: string | null): any[] | null {
  if (!raw) return null;
  let text = raw.trim();
  // Strip markdown code fences if present
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }
  try {
    const res = JSON.parse(text);
    if (Array.isArray(res)) return res;
  } catch {}

  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start !== -1 && end > start) {
    try {
      const slice = text.slice(start, end + 1);
      const res = JSON.parse(slice);
      if (Array.isArray(res)) return res;
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
      console.warn('GEMINI_API_KEY is not configured on server.');
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
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    // Helper for single text translation with system prompt
    const translateSingleText = async (src: string, ctx?: string): Promise<string> => {
      const trimmed = src.trim();
      if (!trimmed) return src;
      const cacheKey = getCacheKey(trimmed, ctx);
      if (translationCache.has(cacheKey)) {
        return translationCache.get(cacheKey)!;
      }
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: trimmed,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            temperature: 0.1,
          },
        });
        const translation = response.text?.trim() || trimmed;
        setInCache(cacheKey, translation);
        return translation;
      } catch (err) {
        console.warn('Individual translation error:', err);
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
          toTranslateIndices.push(idx);
          toTranslateTexts.push(item);
        }
      });

      if (toTranslateIndices.length > 0) {
        let batchSucceeded = false;
        try {
          const prompt = JSON.stringify(toTranslateTexts);
          const response = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: `Translate the following JSON array of French texts into English. Return ONLY a valid JSON array of strings of identical length and ordering:\n${prompt}`,
            config: {
              systemInstruction: SYSTEM_INSTRUCTION,
              responseMimeType: 'application/json',
              temperature: 0.1,
            },
          });

          const parsed = parseJsonArraySafely(response.text);
          if (Array.isArray(parsed) && parsed.length === toTranslateTexts.length) {
            parsed.forEach((translated, i) => {
              const originalIdx = toTranslateIndices[i];
              const originalText = toTranslateTexts[i];
              results[originalIdx] = String(translated);
              setInCache(getCacheKey(originalText.trim(), context), String(translated));
            });
            batchSucceeded = true;
          }
        } catch (e) {
          console.warn('Batch translation parse failed, falling back to concurrent single translations:', e);
        }

        // If batch JSON parsing failed or had length mismatch, fall back to robust concurrent translation
        if (!batchSucceeded) {
          const fallbackPromises = toTranslateTexts.map(async (origText, i) => {
            const originalIdx = toTranslateIndices[i];
            const trans = await translateSingleText(origText, context);
            results[originalIdx] = trans;
          });
          await Promise.all(fallbackPromises);
        }
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
          toTranslateIndices.push(idx);
          toTranslateTexts.push(val);
        }
      });

      if (toTranslateIndices.length > 0) {
        let fieldsBatchSucceeded = false;
        try {
          const prompt = JSON.stringify(toTranslateTexts);
          const response = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: `Translate the following JSON array of French fields into English. Return ONLY a valid JSON array of strings in identical order:\n${prompt}`,
            config: {
              systemInstruction: SYSTEM_INSTRUCTION,
              responseMimeType: 'application/json',
              temperature: 0.1,
            },
          });

          const parsed = parseJsonArraySafely(response.text);
          if (Array.isArray(parsed) && parsed.length === toTranslateTexts.length) {
            toTranslateIndices.forEach((origIdx, i) => {
              const k = keys[origIdx];
              const origVal = values[origIdx];
              const transVal = String(parsed[i] || origVal);
              translatedMap[k] = transVal;
              setInCache(getCacheKey(origVal.trim(), `${context}_${k}`), transVal);
            });
            fieldsBatchSucceeded = true;
          }
        } catch (e) {
          console.warn('Object fields batch translation failed, falling back to concurrent single translations:', e);
        }

        if (!fieldsBatchSucceeded) {
          const fallbackPromises = toTranslateTexts.map(async (origVal, i) => {
            const origIdx = toTranslateIndices[i];
            const k = keys[origIdx];
            const trans = await translateSingleText(origVal, `${context}_${k}`);
            translatedMap[k] = trans;
          });
          await Promise.all(fallbackPromises);
        }
      }

      // Fill in any untouched keys
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
    console.error('Translation API route error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal translation error', fallback: true },
      { status: 500 }
    );
  }
}
