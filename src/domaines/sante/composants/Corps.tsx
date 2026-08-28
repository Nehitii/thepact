import { useTranslation } from "react-i18next";
import { SlidersHorizontal } from "lucide-react";
import { imc, trancheIMC, placeSurEchelle, type TrancheIMC } from "@/domaines/sante/logique/journee";

interface Props {
  tailleCm: number | null | undefined;
  poidsKg: number | null | undefined;
  onRegler: () => void;
}

/* Les quatre tranches de l OMS, du bas de l echelle vers le haut, avec
   la part qu elles occupent entre 15 et 35. */
const TRANCHES: { id: TrancheIMC; part: number }[] = [
  { id: "maigreur", part: 17.5 },
  { id: "normal", part: 32.5 },
  { id: "surpoids", part: 25 },
  { id: "obesite", part: 25 },
];

const TON: Record<TrancheIMC, string> = {
  maigreur: "var(--hlt-cyan)",
  normal: "var(--hlt-vert)",
  surpoids: "var(--hlt-jaune)",
  obesite: "var(--hlt-rouge)",
};

/**
 * LA COLONNE FIGEE DU DOSSIER.
 *
 * Poids et taille ne changent pas d un jour a l autre : ils n ont rien
 * a faire dans le flux du journal. Ils tiennent la colonne de gauche,
 * collante au defilement — la partie du dossier qu on ne remplit pas,
 * qu on consulte.
 *
 * L IMC s affichait brut : 23.148148148148149. Il est arrondi au
 * dixieme et formate selon la langue, donc 21,7 en francais. La jauge
 * est verticale parce que c est une jauge, pas une frise : on y lit une
 * hauteur, pas une progression.
 */
export function Corps({ tailleCm, poidsKg, onRegler }: Props) {
  const { t, i18n } = useTranslation();

  const valeur = imc(tailleCm, poidsKg);
  const tranche = trancheIMC(valeur);
  const place = placeSurEchelle(valeur);

  return (
    <aside className="hlt-fiche">
      <h2 className="hlt-titre">{t("health.body.title", "Le corps")}</h2>

      <div className="hlt-fiche-plaque">
        <div className="hlt-ligne" data-vide={poidsKg ? "0" : "1"}>
          <u>{t("health.body.weight", "Poids")}</u>
          <b>{poidsKg ?? "—"}<i>kg</i></b>
        </div>

        <div className="hlt-ligne" data-vide={tailleCm ? "0" : "1"}>
          <u>{t("health.body.height", "Taille")}</u>
          <b>{tailleCm ?? "—"}<i>cm</i></b>
        </div>

        <div className="hlt-imc" data-vide={valeur === null ? "1" : "0"}>
          <u>{t("health.bmi.title", "IMC")}</u>

          <div className="hlt-imc-corps">
            <div className="hlt-imc-mots">
              <b style={tranche ? { color: TON[tranche] } : undefined}>
                {valeur === null
                  ? "—"
                  : valeur.toLocaleString(i18n.language, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
              </b>
              <span>
                {tranche
                  ? t(`health.body.range.${tranche}`, tranche)
                  : t("health.body.needsBoth", "Renseigne ta taille et ton poids.")}
              </span>
            </div>

            {valeur !== null && (
              <div className="hlt-jauge" aria-hidden="true">
                <div className="hlt-jauge-barre">
                  {/* Empilees du bas vers le haut : colonne inversee. */}
                  {TRANCHES.map((tr) => (
                    <i
                      key={tr.id}
                      style={{ flex: tr.part, background: tr.id === tranche ? TON[tr.id] : undefined }}
                    />
                  ))}
                  <span className="hlt-jauge-curseur" style={{ bottom: `${place}%` }} />
                </div>
                <div className="hlt-jauge-mots">
                  <span>35</span><span>30</span><span>25</span><span>18,5</span><span>15</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <button type="button" className="hlt-regler" onClick={onRegler}>
          <SlidersHorizontal aria-hidden="true" />
          {t("health.body.adjust", "Régler")}
        </button>
      </div>
    </aside>
  );
}
