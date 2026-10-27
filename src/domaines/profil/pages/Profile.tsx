import { useEffect, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/socle/contextes/AuthContext";
import { useProfile } from "@/domaines/profil/hooks/useProfile";
import { ProfileAccountSettings, type VoletCompte } from "@/domaines/profil/composants/ProfileAccountSettings";
import { ProfileDevilNote } from "@/domaines/profil/composants/ProfileDevilNote";
import { useTranslation } from "react-i18next";
import { ConsoleReglages } from "@/domaines/profil/composants/ConsoleReglages";
import { dateCivileDepuisTexte } from "@/socle/outils/jour";
import { Loader2 } from "lucide-react";
import "@/socle/ds/reglages.css";

/* LES TROIS ONGLETS SONT DEVENUS DEUX SECTIONS DU RAIL.
 *
 * Ils vivaient dans un `useState` : la section Securite n avait pas
 * d adresse, ne se mettait pas en favori, ne survivait pas au
 * rechargement — et doublait la navigation, puisque le rail menait
 * deja ici. Les deux volets partagent la meme page et la meme requete
 * de profil ; seul le chemin change.
 *
 * La suppression du compte a rejoint « Mes donnees », aupres de la
 * reinitialisation : deux destructions, une seule zone sensible. */
export default function Profile() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { pathname } = useLocation();
  const { data: profile, isLoading } = useProfile(user?.id);
  const [isAtBottom, setIsAtBottom] = useState(false);

  const volet: VoletCompte = pathname.endsWith("/security") ? "securite" : "compte";

  const handleScroll = useCallback(() => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = window.innerHeight;
    setIsAtBottom(scrollHeight - (scrollTop + clientHeight) <= 50);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const initialData = profile
    ? {
        email: user?.email || "",
        displayName: profile.display_name || "",
        timezone: profile.timezone || "UTC",
        language: profile.language || "en",
        currency: profile.currency || "eur",
        /* `new Date("1996-02-02")` est minuit UTC, et ses composantes
           sont lues en local : a l ouest de Greenwich la date reculait
           d un jour, puis d un jour de plus a chaque enregistrement. */
        birthday: dateCivileDepuisTexte(profile.birthday),
        country: profile.country || "",
      }
    : null;

  return (
    <ConsoleReglages
      titre={t("profile.title")}
      note={volet === "securite"
        ? t("profile.securitySubtitle", "Ton mot de passe, ton second facteur, tes sessions.")
        : t("profile.subtitle")}
      flottant={user ? <ProfileDevilNote isVisible={isAtBottom} /> : null}
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : user && initialData ? (
        <ProfileAccountSettings userId={user.id} volet={volet} initialData={initialData} />
      ) : null}
    </ConsoleReglages>
  );
}
