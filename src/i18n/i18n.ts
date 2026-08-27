import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// Force reload on JSON changes
import en from "@/i18n/locales/en.json";
import fr from "@/i18n/locales/fr.json";

/* LA LANGUE PAR DÉFAUT EST CELLE DE L'APPLICATION.
   Elle valait « en » — l'héritage de l'échafaudage. Conséquence : tout
   visiteur NON CONNECTÉ voyait l'anglais. L'écran d'authentification,
   les mentions légales, la page 404 : les trois seules pages publiques,
   toutes en anglais, dans une application dont le document légal, les
   consignes de M.I.A, les notifications et la majorité des chaînes
   sources sont en français.

   Ça contredisait aussi `<html lang="fr">`, posé le 27/08 au motif que
   l'interface est française — un lecteur d'écran annonçait du français
   et lisait de l'anglais.

   Un compte garde sa propre langue : `I18nProvider` lit
   `profiles.language` dès qu'une session existe. Seul le AVANT change. */
export const DEFAULT_LANGUAGE = "fr" as const;
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
        console.warn(`[i18n] Missing key: ${key}`);
      },
    });
}

export default i18n;
