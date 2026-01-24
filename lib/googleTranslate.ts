// Google Cloud Translation API integration
const GOOGLE_TRANSLATE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_TRANSLATE_API_KEY || "";
const TRANSLATE_API_URL = "https://translation.googleapis.com/language/translate/v2";

// Log API key status on load
console.log('🔧 Google Translate Service initialized');
console.log('🔑 API Key configured:', GOOGLE_TRANSLATE_API_KEY ? `Yes (${GOOGLE_TRANSLATE_API_KEY.substring(0, 10)}...)` : 'No');
console.log('🌐 Translation API URL:', TRANSLATE_API_URL);

interface TranslationCache {
  [key: string]: {
    [lang: string]: string;
  };
}

class GoogleTranslateService {
  private cache: TranslationCache = {};
  private cacheKey = "translation-cache-v2";
  private pendingRequests: Map<string, Promise<string>> = new Map();

  constructor() {
    // Load cache from localStorage
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(this.cacheKey);
        if (cached) {
          this.cache = JSON.parse(cached);
        }
      } catch (e) {
        console.error("Failed to load translation cache:", e);
      }
    }
  }

  async translate(text: string, targetLang: string, sourceLang?: string): Promise<string> {
    if (!text || !text.trim()) return text;
    // Only skip if target matches source (if known) or if target is English AND source is English (or implied)
    if (targetLang === sourceLang) return text;
    if (targetLang === "en" && sourceLang === "en") return text;

    // Check if API key is configured
    if (!GOOGLE_TRANSLATE_API_KEY) {
      console.warn("❌ Google Translate API key not configured");
      return text;
    }

    console.log(`🌍 Translating to ${targetLang} (from ${sourceLang || 'auto'}):`, text.substring(0, 50) + '...');
    const cacheKey = `${text.trim()}_${sourceLang || 'auto'}`;

    // Check cache first
    if (this.cache[cacheKey]?.[targetLang]) {
      console.log('💾 Using cached translation');
      return this.cache[cacheKey][targetLang];
    }

    // Check if request is already pending
    const pendingKey = `${cacheKey}-${targetLang}`;
    if (this.pendingRequests.has(pendingKey)) {
      return this.pendingRequests.get(pendingKey)!;
    }

    // Make new translation request
    const translationPromise = this.fetchTranslation(text, targetLang, sourceLang);
    this.pendingRequests.set(pendingKey, translationPromise);

    try {
      const result = await translationPromise;
      return result;
    } finally {
      this.pendingRequests.delete(pendingKey);
    }
  }

  private async fetchTranslation(text: string, targetLang: string, sourceLang?: string): Promise<string> {
    try {
      console.log('📡 Making API request to Google Translate...');

      const payload: any = {
        q: text,
        target: targetLang,
        format: "text",
      };

      // Only add source if provided
      if (sourceLang) {
        payload.source = sourceLang;
      }

      const response = await fetch(
        `${TRANSLATE_API_URL}?key=${GOOGLE_TRANSLATE_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      console.log('📥 API Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ Translation API error:', response.status, errorData);
        throw new Error(`Translation API error: ${response.status} - ${errorData}`);
      }

      const data = await response.json();
      const translatedText = data.data?.translations?.[0]?.translatedText || text;

      console.log('✅ Translation successful:', translatedText.substring(0, 50) + '...');

      // Cache the translation
      const cacheKey = text.trim();
      if (!this.cache[cacheKey]) {
        this.cache[cacheKey] = {};
      }
      this.cache[cacheKey][targetLang] = translatedText;

      // Save cache to localStorage (with error handling for quota)
      this.saveCache();

      return translatedText;
    } catch (error) {
      console.error("❌ Translation error:", error);
      return text; // Fallback to original text
    }
  }

  async translateBatch(texts: string[], targetLang: string): Promise<string[]> {
    console.log(`🔄 Batch translating ${texts.length} texts to ${targetLang}`);

    if (targetLang === "en") {
      console.log('⏩ Skipping translation - target is English');
      return texts;
    }

    // Check if API key is configured
    if (!GOOGLE_TRANSLATE_API_KEY) {
      console.warn("❌ Google Translate API key not configured for batch translation");
      return texts;
    }

    try {
      // Filter out empty texts and get unique ones
      const uniqueTexts = [...new Set(texts.filter((t) => t && t.trim()))];

      // Check which texts are already cached
      const uncachedTexts: string[] = [];
      const results: string[] = new Array(texts.length);

      texts.forEach((text, index) => {
        // Assume English source for batch for now or update signature later
        const cacheKey = `${text.trim()}_en`;
        if (this.cache[cacheKey]?.[targetLang]) {
          results[index] = this.cache[cacheKey][targetLang];
        } else if (text && text.trim()) {
          if (!uncachedTexts.includes(text)) {
            uncachedTexts.push(text);
          }
        } else {
          results[index] = text;
        }
      });

      // Translate uncached texts in one batch
      if (uncachedTexts.length > 0) {
        console.log(`📡 Translating ${uncachedTexts.length} uncached texts...`);
        const response = await fetch(
          `${TRANSLATE_API_URL}?key=${GOOGLE_TRANSLATE_API_KEY}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              q: uncachedTexts,
              target: targetLang,
              source: "en",
              format: "text",
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const translations = data.data?.translations || [];
          console.log(`✅ Batch translation successful: ${translations.length} translations received`);

          // Cache the translations
          uncachedTexts.forEach((text, idx) => {
            const translatedText = translations[idx]?.translatedText || text;
            const cacheKey = `${text.trim()}_en`;
            if (!this.cache[cacheKey]) {
              this.cache[cacheKey] = {};
            }
            this.cache[cacheKey][targetLang] = translatedText;
          });

          this.saveCache();
        } else {
          console.error(`❌ Batch translation API error: ${response.status}`);
        }
      } else {
        console.log('💾 All texts found in cache');
      }

      // Fill in the results
      texts.forEach((text, index) => {
        if (results[index] === undefined) {
          const cacheKey = text.trim();
          results[index] = this.cache[cacheKey]?.[targetLang] || text;
        }
      });

      return results;
    } catch (error) {
      console.error("Batch translation error:", error);
      return texts; // Fallback to original texts
    }
  }

  private saveCache() {
    if (typeof window !== "undefined") {
      try {
        // Limit cache size to prevent localStorage quota issues
        const cacheEntries = Object.entries(this.cache);
        if (cacheEntries.length > 1000) {
          // Keep only the most recent 1000 entries
          this.cache = Object.fromEntries(cacheEntries.slice(-1000));
        }
        localStorage.setItem(this.cacheKey, JSON.stringify(this.cache));
      } catch (e) {
        // If localStorage is full, clear old cache
        try {
          localStorage.removeItem("translation-cache"); // Remove old cache key
          localStorage.setItem(this.cacheKey, JSON.stringify(this.cache));
        } catch (e2) {
          console.error("Failed to save translation cache:", e2);
        }
      }
    }
  }

  clearCache() {
    this.cache = {};
    if (typeof window !== "undefined") {
      localStorage.removeItem(this.cacheKey);
      localStorage.removeItem("translation-cache"); // Remove old cache key too
    }
  }

  getCacheSize(): number {
    return Object.keys(this.cache).length;
  }
}

export const googleTranslate = new GoogleTranslateService();

