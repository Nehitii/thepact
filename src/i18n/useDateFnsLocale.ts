import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { enUS, fr } from "date-fns/locale";

export function useDateFnsLocale() {
  const { i18n } = useTranslation();
  return useMemo(() => {
    return i18n.language === "fr" ? fr : enUS;
  }, [i18n.language]);
}
