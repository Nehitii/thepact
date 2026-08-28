import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, Network } from "lucide-react";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { Telemetrie } from "@/socle/ds/Telemetrie";

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
  /** Objectifs en brigade, sur les trois places. */
  brigade: number;
  plafondBrigade: number;
  /** Bornes du pacte. Absentes tant qu'il n'est pas chargé. */
  debutPacte?: string | null;
  finPacte?: string | null;
  /** Date du dernier objectif franchi, si elle existe. */
  dernierFranchi?: string | null;
}

export function GoalsHeader({
  total, actifs, franchis, brigade, plafondBrigade, debutPacte, finPacte, dernierFranchi,
}: Props) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const pct = total > 0 ? Math.round((franchis / total) * 100) : 0;

  /* Segments du relevé — uniquement des valeurs derivees de l'etat reel.
     Chacun n'est ajoute que si sa donnee existe : mieux vaut un releve
     court qu'un segment invente pour meubler. */
  const segments: string[] = [];
  if (debutPacte && finPacte) {
    try {
      const debut = parseISO(debutPacte);
      const fin = parseISO(finPacte);
      const total_j = differenceInCalendarDays(fin, debut);
      const ecoules = differenceInCalendarDays(new Date(), debut);
      if (total_j > 0 && ecoules >= 0) {
        segments.push(`JOUR ${Math.min(ecoules, total_j)}/${total_j}`);
        const pctTemps = Math.round((Math.min(ecoules, total_j) / total_j) * 100);
        segments.push(`TEMPS ${pctTemps}%`);
        // L'ecart entre l'avancement et le temps consomme : la seule
        // valeur du releve qui ne se lit nulle part ailleurs.
        const ecart = pct - pctTemps;
        segments.push(`ÉCART ${ecart >= 0 ? "+" : "−"}${Math.abs(ecart)} PTS`);
      }
    } catch { /* dates illisibles : on n'affiche rien plutot qu'un faux */ }
  }
  segments.push(`${franchis}/${total} FRANCHIS`);
  segments.push(`${actifs} EN COURS`);
  segments.push(`BRIGADE ${brigade}/${plafondBrigade}`);
  if (dernierFranchi) {
    try {
      const j = differenceInCalendarDays(new Date(), parseISO(dernierFranchi));
      if (j >= 0) {
        segments.push(j === 0 ? "DERNIER FRANCHI AUJOURD'HUI" : `DERNIER FRANCHI IL Y A ${j} J`);
      }
    } catch { /* idem */ }
  }

  return (
    <div className="cp-cadre">
      <section className="cp-fond ana-panneau ana-bandeau-panneau cp-avec-telemetrie">
        <span className="cp-charge" />
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
            {/* Le bouton porte l action principale de la page.

                Le premier jet y faisait glisser un reflet — un effet de
                vitrine, propre mais sans rapport avec le reste. Cyberpunk
                2077 ne fait pas briller, il fait DECROCHER : l image se
                dedouble en rouge et cyan, des tranches horizontales se
                decalent, et tout revient en place.

                Deux choses font la difference entre une vraie glitch et un
                clignotement. D abord steps(1) : l animation saute d un etat
                a l autre sans interpoler — une interpolation donnerait un
                mouvement fluide, donc organique, exactement le contraire.
                Ensuite le rythme : quatre-vingt-cinq pour cent du cycle ne
                se passe rien. Une glitch permanente devient un motif, et un
                motif ne surprend plus. */}
            <button
              type="button"
              onClick={() => navigate("/goals/new")}
              className="gl-btn gl-btn-primaire gl-btn-appel"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              {/* Le texte est repete dans data-texte : les deux calques
                  decales sont des pseudo-elements qui lisent cet attribut. */}
              <span className="gl-glitch" data-texte={t("goals.createGoal")}>
                {t("goals.createGoal")}
              </span>
            </button>
          </div>
        </header>

        <div className="cp-danger ana-bandeau-rayure" />

        {/* Total dominant, puis sa decomposition.

            Trois compteurs de meme poids posaient trois mesures cote a cote
            sans dire qu elles n en font qu une : 38 = 25 + 13. La hierarchie
            est desormais explicite — un nombre principal, deux details qui
            s additionnent pour le reconstituer — et les deux jauges rendent
            le rapport lisible avant meme les chiffres.

            Ce traitement ne vaut que parce que les parts composent le tout.
            Sur Statistiques les trois compteurs sont independants ; les
            decomposer ainsi y serait faux. */}
        <div className="gl-bilan">
          <div className="gl-bilan-total">
            <b className="font-orbitron">{total}</b>
            <span className="ds-t-label">{t("goals.totalLabel")}</span>
          </div>
          <span className="gl-bilan-sep" />
          <div className="gl-bilan-detail">
            <Part libelle={t("goals.activeLabel")} valeur={actifs} total={total} teinte="#ffab00" />
            <Part libelle={t("goals.doneLabel")} valeur={franchis} total={total} teinte="#00ff88" />
            <Part
              libelle={t("brigade.label", "Brigade")}
              valeur={brigade}
              total={plafondBrigade}
              teinte="#fcee0a"
            />
          </div>
        </div>

        <Telemetrie segments={segments} />
      </section>
    </div>
  );
}

/** Une part du total : libelle, jauge segmentee, nombre. La largeur de la
 *  jauge est la part reelle, pas une valeur decorative. */
function Part({ libelle, valeur, total, teinte }: {
  libelle: string; valeur: number; total: number; teinte: string;
}) {
  const pct = total > 0 ? (valeur / total) * 100 : 0;
  return (
    /* La teinte descend sur le conteneur plutot que sur chaque
       enfant : la jauge la veut en neon — le contraste sy joue avec le
       creux quelle remplit — la ou le chiffre est du TEXTE, et doit
       pouvoir sassombrir en theme clair. Voir .gl-part-val. */
    <div className="gl-part" style={{ ["--c" as string]: teinte }}>
      <span className="gl-part-nom ds-t-label">{libelle}</span>
      <span className="cp-segments gl-part-jauge">
        <i style={{ width: `${pct}%` }} />
      </span>
      <span className="gl-part-val font-orbitron">{valeur}</span>
    </div>
  );
}
