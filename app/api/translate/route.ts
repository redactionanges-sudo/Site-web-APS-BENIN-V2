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

    // 1. Single string translation
    if (typeof text === 'string') {
      const trimmed = text.trim();
      if (!trimmed) {
        return NextResponse.json({ translation: text });
      }

      const cacheKey = getCacheKey(trimmed, context);
      if (translationCache.has(cacheKey)) {
        return NextResponse.json({ translation: translationCache.get(cacheKey) });
      }

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

        try {
          const raw = response.text?.trim() || '[]';
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length === toTranslateTexts.length) {
            parsed.forEach((translated, i) => {
              const originalIdx = toTranslateIndices[i];
              const originalText = toTranslateTexts[i];
              results[originalIdx] = translated;
              setInCache(getCacheKey(originalText.trim(), context), translated);
            });
          } else {
            toTranslateIndices.forEach((origIdx, i) => {
              results[origIdx] = (parsed && parsed[i]) || toTranslateTexts[i];
            });
          }
        } catch (e) {
          console.error('Failed to parse batch translation response:', e);
          toTranslateIndices.forEach((origIdx, i) => {
            results[origIdx] = toTranslateTexts[i];
          });
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

        try {
          const raw = response.text?.trim() || '[]';
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            toTranslateIndices.forEach((origIdx, i) => {
              const k = keys[origIdx];
              const origVal = values[origIdx];
              const transVal = parsed[i] || origVal;
              translatedMap[k] = transVal;
              setInCache(getCacheKey(origVal.trim(), `${context}_${k}`), transVal);
            });
          }
        } catch (e) {
          console.error('Failed to parse object fields translation response:', e);
          toTranslateIndices.forEach((origIdx) => {
            const k = keys[origIdx];
            translatedMap[k] = values[origIdx];
          });
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
