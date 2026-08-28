import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { Settings as SettingsIcon } from "lucide-react";
import { useAuth } from "@/socle/contextes/AuthContext";
import { useProfile } from "@/domaines/profil";
import { laVeille } from "@/domaines/sante/logique/journee";

interface Props {
  /** Combien de journees closes attendent encore d etre relevees. */
  enAttente: number;
  onReglages: () => void;
}

/**
 * L EN-TETE D UN DOSSIER, PAS D UNE PAGE.
 *
 * La page portait le DSPageHeader partage par les onze autres : deux
 * anneaux qui tournent, un point qui pulse, et le mot SANTE en quarante
 * pixels au centre. Deux cent cinquante pixels de hauteur pour repeter
 * ce que la barre laterale surligne deja, et pas une donnee.
 *
 * Ici c est une bande de dossier. Elle dit a qui il appartient, quand
 * il a ete mis a jour, et — la seule chose qui vaille d etre lue en
 * haut d une page de sante — s il manque des entrees. Le mot SANTE
 * redescend au rang de classification, en neuf pixels.
 */
export function EnTeteDossier({ enAttente, onReglages }: Props) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: profil } = useProfile(user?.id);

  const nom = profil?.display_name || "AGENT_UNKNOWN";
  const initiale = nom.slice(0, 1).toUpperCase();

  return (
    <header className="hlt-tete">
      <div className="hlt-tete-id">
        {/* Le jeton chanfreine : la seule surface jaune de l en-tete
            quand le dossier est a jour. */}
        <span className="hlt-jeton" aria-hidden="true">{initiale}</span>
        <span className="hlt-tete-mots">
          <b>{t("health.file.ref", "Dossier bio")} // {nom}</b>
          <i>
            {t("health.file.classification", "Santé")}
            {" · "}
            {t("health.file.updated", "MAJ")} {format(laVeille(), "yyyy.MM.dd")}
          </i>
        </span>
      </div>

      <div className="hlt-tete-etat">
        <span className="hlt-etat" data-ton={enAttente > 0 ? "du" : "ok"}>
          {enAttente > 0
            ? t("health.file.missing", { count: enAttente })
            : t("health.file.upToDate", "Dossier à jour")}
        </span>
        <button
          type="button"
          className="hlt-engrenage"
          onClick={onReglages}
          aria-label={t("common.settings")}
        >
          <SettingsIcon aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
