import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// Force reload on JSON changes
import en from "@/i18n/locales/en.json";
import fr from "@/i18n/locales/fr.json";

export const DEFAULT_LANGUAGE = "en" as const;
export type SupportedLanguage = "en" | "fr";

if (!i18n.isInitialized) {
  i18n
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: en },
        fr: { translation: fr },
      },
      lng: DEFAULT_LANGUAGE,
      fallbackLng: DEFAULT_LANGUAGE,
      interpolation: {
        escapeValue: false,
      },
      returnNull: false,
      returnEmptyString: false,
      saveMissing: true,
      missingKeyHandler: (_lngs, _ns, key) => {
        // eslint-disable-next-line no-console
        console.warn(`[i18n] Missing key: ${key}`);
      },
    });
}

export default i18n;
