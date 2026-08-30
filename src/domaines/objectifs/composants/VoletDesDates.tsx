import { Calendar } from "lucide-react";
import { useTranslation } from "react-i18next";

/* ═══════════════════════════════════════════════════════════════
   LES DEUX DATES D UN OBJECTIF, ET LA CASE QUI DECIDE SI LA
   PREMIERE EXISTE.

   Elles n ont pas le meme statut, et le volet le montre :

     LE DEPART SE DECLARE. Le champ etait pre-rempli avec le jour
     courant — accepter le formulaire sans y toucher posait donc une
     date que personne n avait choisie. Seize des trente-huit objectifs
     du compte portaient ainsi le jour de leur import, et rien ne
     distinguait cette date d une date voulue.

     Decochee — et elle l est au depart — la case laisse la colonne
     NULLE. Aucune des quatre distinctions de temps ne peut alors se
     declencher : ce qui ne se mesure pas n est pas une performance
     (succes/logique/honneurDuTemps.ts).

     L ECHEANCE NE SE DECLARE PAS DE LA MEME FACON : elle est
     facultative depuis toujours, et son absence n a jamais rien
     signifie d autre que « pas de compte a rebours ».
   ═══════════════════════════════════════════════════════════════ */
export interface VoletDesDates {
  departConnu: boolean;
  onDepartConnu: (connu: boolean) => void;
  depart: string;
  onDepart: (jour: string) => void;
  echeance: string;
  onEcheance: (jour: string) => void;
}

export function VoletDesDates({
  departConnu, onDepartConnu, depart, onDepart, echeance, onEcheance,
}: VoletDesDates) {
  const { t } = useTranslation();

  /* DECOCHER EFFACE. Une date qui resterait invisible dans l etat et
     partirait quand meme a l enregistrement serait pire que pas de case
     du tout. */
  const basculer = (connu: boolean) => {
    onDepartConnu(connu);
    if (!connu) onDepart("");
  };

  return (
    <section className="ge-volet">
      <header className="ge-tete">
        <Calendar size={12} aria-hidden="true" />
        {t("goals.edit.dates", "Calendrier")}
      </header>
      <div className="ge-corps-volet">
        <div className="ge-duo">
          <div className="ge-champ">
            <label className="ge-bascule" htmlFor="ge-depart-connu">
              <input
                id="ge-depart-connu"
                type="checkbox"
                checked={departConnu}
                onChange={(e) => basculer(e.target.checked)}
              />
              {t("goals.edit.departConnu", "Je sais quand j'ai commencé")}
            </label>
            <input
              id="ge-debut"
              type="date"
              value={depart}
              disabled={!departConnu}
              onChange={(e) => onDepart(e.target.value)}
              aria-label={t("goals.detail.startDate", "Début")}
            />
          </div>
          <div className="ge-champ">
            <label className="ge-etiquette" htmlFor="ge-echeance">
              {t("goals.edit.deadline", "Échéance")}
            </label>
            <input
              id="ge-echeance"
              type="date"
              value={echeance}
              onChange={(e) => onEcheance(e.target.value)}
            />
          </div>
        </div>
        <p className="ge-aide">
          {t(
            "goals.edit.departHint",
            "Sans date de départ, l'objectif ne compte aucune durée — et ne peut gagner aucune distinction de temps.",
          )}
        </p>
        <p className="ge-aide">
          {t("goals.edit.deadlineHint", "Une échéance allume le compte à rebours sur la carte de l'objectif.")}
        </p>
      </div>
    </section>
  );
}
