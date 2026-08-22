import { useTranslation } from "react-i18next";
import { SlidersHorizontal } from "lucide-react";
import { imc, trancheIMC, placeSurEchelle, type TrancheIMC } from "@/lib/health/journee";

interface Props {
  tailleCm: number | null | undefined;
  poidsKg: number | null | undefined;
  onRegler: () => void;
}

/* Les quatre tranches de l OMS, dans l ordre de l echelle. */
const TRANCHES: TrancheIMC[] = ["maigreur", "normal", "surpoids", "obesite"];

const TON: Record<TrancheIMC, string> = {
  maigreur: "var(--hlt-cyan)",
  normal: "var(--hlt-vert)",
  surpoids: "var(--hlt-jaune)",
  obesite: "var(--hlt-rouge)",
};

/**
 * OU J EN SUIS, EN TROIS CHIFFRES.
 *
 * L IMC s affichait brut : 23.148148148148149. Quinze decimales pour
 * une mesure qui n en supporte pas une seconde — et le reste de la
 * page se lisait a l avenant.
 *
 * Trois nombres suffisent : ce qu on pese, ce qu on mesure, et ce que
 * les deux donnent. L echelle sous l IMC dit la tranche sans qu on ait
 * a connaitre les bornes par coeur — et sans jamais parler de
 * diagnostic, parce que ce n en est pas un.
 */
export function Corps({ tailleCm, poidsKg, onRegler }: Props) {
  const { t, i18n } = useTranslation();

  const valeur = imc(tailleCm, poidsKg);
  const tranche = trancheIMC(valeur);
  const place = placeSurEchelle(valeur);

  return (
    <section>
      <h2 className="hlt-titre">{t("health.body.title", "Le corps")}</h2>

      <div className="hlt-corps">
        <div className="hlt-mesure" data-vide={poidsKg ? "0" : "1"}>
          <u>{t("health.body.weight", "Poids")}</u>
          <b>{poidsKg ?? "—"}<i>kg</i></b>
        </div>

        <div className="hlt-mesure" data-vide={tailleCm ? "0" : "1"}>
          <u>{t("health.body.height", "Taille")}</u>
          <b>{tailleCm ?? "—"}<i>cm</i></b>
        </div>

        <div className="hlt-mesure" data-vide={valeur === null ? "1" : "0"} style={{ gridColumn: "span 2" }}>
          <u>{t("health.body.bmi", "Indice de masse corporelle")}</u>
          <b style={tranche ? { color: TON[tranche] } : undefined}>
            {/* 21.7 en francais s ecrit 21,7 : toLocaleString le sait,
                le rendu direct d un nombre non. */}
            {valeur === null ? "—" : valeur.toLocaleString(i18n.language, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
          </b>
          <span>
            {tranche
              ? t(`health.body.range.${tranche}`, tranche)
              : t("health.body.needsBoth", "Renseigne ta taille et ton poids.")}
          </span>

          {valeur !== null && (
            <div className="hlt-echelle" aria-hidden="true">
              <div className="hlt-echelle-barre">
                {TRANCHES.map((tr) => (
                  <i key={tr} data-t={tr === tranche ? "ici" : undefined} style={{ ["--ton" as string]: TON[tr] }} />
                ))}
                {/* Le curseur dit la position exacte, la ou les quatre
                    pavés ne disent que la tranche. */}
                <span className="hlt-echelle-curseur" style={{ left: `${place}%` }} />
              </div>
              <div className="hlt-echelle-mots">
                <span>15</span><span>18,5</span><span>25</span><span>30</span><span>35</span>
              </div>
            </div>
          )}

          <button type="button" className="hlt-regler" onClick={onRegler}>
            <SlidersHorizontal aria-hidden="true" style={{ width: 12, height: 12, display: "inline", marginRight: 7, verticalAlign: -1 }} />
            {t("health.body.adjust", "Régler")}
          </button>
        </div>
      </div>
    </section>
  );
}
