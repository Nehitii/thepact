import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, Network } from "lucide-react";

/* EN-TETE DES OBJECTIFS
 *
 * Remplace un DSPageHeader "hud" qui affichait un logotype GOALS centre
 * sur quatre lignes de hauteur et ne disait rien : le titre de la page
 * est deja dans la barre laterale, en surbrillance.
 *
 * Le bandeau porte desormais les trois nombres qu'on vient chercher —
 * combien d'objectifs, combien ouverts, combien franchis — dans le meme
 * langage que Statistiques : chanfrein a 45 degres, equerres, rayure de
 * danger, etiquette jaune. Les libelles passent par t() : les cles
 * existaient deja en francais et en anglais, la barre d'outils les
 * ignorait et codait l'anglais en dur.
 */

interface Props {
  total: number;
  actifs: number;
  franchis: number;
}

export function GoalsHeader({ total, actifs, franchis }: Props) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const pct = total > 0 ? Math.round((franchis / total) * 100) : 0;

  return (
    <div className="cp-cadre">
      <section className="cp-fond ana-panneau ana-bandeau-panneau">
        <span className="cp-balayage" />
        <span className="cp-equerre cp-equerre-hg" />
        <span className="cp-equerre cp-equerre-bd" />

        <header className="gl-tete">
          {/* Titre volontairement en dur, et non t("goals.title") : la page
              doit s'appeler "Goals" pour l'instant, quelle que soit la
              langue de l'interface. A repasser par la traduction le jour
              ou le nom se stabilise. */}
          <h1 className="gl-titre font-orbitron">
            Goal<span className="gl-titre-accent">s</span>
          </h1>
          <span className="cp-tag gl-titre-tag">{pct}% ACQUIS</span>
          <span className="ana-panneau-fil" />
          <div className="gl-actions">
            <button
              type="button"
              onClick={() => navigate("/goals/graph")}
              className="gl-btn"
              aria-label={t("goals.graph")}
            >
              <Network className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden md:inline">{t("goals.graph")}</span>
            </button>
            {/* Le bouton porte l'action principale de la page : il respire,
                et un reflet le traverse. Les deux effets sont lents et de
                faible amplitude — un clignotement rapide se lit comme une
                alerte, pas comme une invitation. */}
            <button
              type="button"
              onClick={() => navigate("/goals/new")}
              className="gl-btn gl-btn-primaire gl-btn-appel"
            >
              <span className="gl-btn-reflet" aria-hidden="true" />
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>{t("goals.createGoal")}</span>
            </button>
          </div>
        </header>

        <div className="cp-danger ana-bandeau-rayure" />

        <div className="ana-bandeau">
          <Compteur valeur={total} libelle={t("goals.totalLabel")} teinte="hsl(var(--primary))" />
          <Compteur valeur={actifs} libelle={t("goals.activeLabel")} teinte="#ffab00" />
          <Compteur valeur={franchis} libelle={t("goals.doneLabel")} teinte="#00ff88" pct={pct} />
        </div>
      </section>
    </div>
  );
}

function Compteur({ valeur, libelle, teinte, pct }: {
  valeur: number; libelle: string; teinte: string; pct?: number;
}) {
  return (
    <div className="ana-compteur">
      {pct !== undefined && (
        <span
          className="ana-jauge"
          style={{
            ["--c" as string]: teinte,
            ["--p" as string]: `${Math.min(100, Math.max(0, pct))}%`,
          }}
        />
      )}
      <span className="ana-compteur-txt">
        <span
          className="ana-compteur-val font-orbitron"
          style={{ color: teinte, textShadow: `0 0 14px ${teinte}55` }}
        >
          {valeur}
        </span>
        <span className="ana-compteur-lib ds-t-label">{libelle}</span>
      </span>
    </div>
  );
}
