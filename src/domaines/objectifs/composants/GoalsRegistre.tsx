import React, { memo, useMemo, useState } from "react";
import { ChevronRight, Crown, Lock, Star } from "lucide-react";
import type { TFunction } from "i18next";
import { getStatusLabel, getDifficultyLabel } from "@/domaines/objectifs/logique/goalConstants";
import { teinteDuPalier } from "@/domaines/objectifs/hooks/useCarteObjectif";
import { membresDuGroupe, estFranchi, estPretAHonorer } from "@/domaines/objectifs/logique/superGoals";
import type { Goal } from "@/domaines/objectifs/hooks/useGoals";
import { useGoalSteps } from "@/domaines/objectifs/hooks/useGoalSteps";
import { useTranslation } from "react-i18next";
import { PREF } from "@/socle/outils/preferencesAffichage";

/* REGISTRE — la vue liste
 *
 * Les trois modes se partageaient deux usages. La barre montre les
 * objectifs un par un, la grille les montre en images, et la vue liste
 * refaisait la grille avec d'autres marges : meme hierarchie, memes
 * champs, aucun usage propre.
 *
 * Il restait une place vide : VOIR L'ENSEMBLE ET COMPARER. C'est ce que
 * le registre occupe. Une ligne par objectif, des colonnes alignees,
 * aucune image — trente-huit objectifs tiennent dans un ecran et se
 * lisent les uns contre les autres. Le palier, les etapes, l'avancement,
 * le poids en XP et l'etat se comparent colonne par colonne, ce qu'aucune
 * disposition en cartes ne permet.
 *
 * Le regroupement par constellation est une bascule, pas un mode a part.
 * Il repond a une autre question — « comment mon pacte est-il
 * structure ? » — sur les memes lignes, et rend lisible sans zoomer ce
 * que la page Constellation montre a 8px de texte.
 */

/* La table de couleurs qui vivait ici etait la bonne — c est elle qui
   a ete promue dans teinteDuPalier, contre celle de la vue barre. Elle
   n est plus recopiee, elle est importee.

   NOM_PALIER, en revanche, etait un defaut : « FACILE », « MOYEN »,
   « DIFFICILE » ecrits en dur, donc affiches en francais quelle que
   soit la langue choisie. Le registre etait la seule vue a ne pas
   traduire son palier. getDifficultyLabel s en charge ; la majuscule
   reste, c est le parti typographique de la vue. */

function teinte(g: Goal, couleurCustom: string): string {
  return teinteDuPalier(g.difficulty, couleurCustom).couleur;
}

function libellePalier(g: Goal, nomCustom: string, t: TFunction): string {
  return getDifficultyLabel(g.difficulty || "", t, nomCustom).toUpperCase();
}

/** Avancement d'un objectif, quel que soit son type.
 *
 * Trois mecaniques coexistent et se lisent a des endroits differents :
 * un objectif ordinaire compte ses etapes, une habitude compte ses jours
 * coches, et un groupe compte ses objectifs membres. Les lire tous dans
 * total_steps donnerait 0/0 pour les deux derniers — c'est ce que le
 * registre affichait pour les groupes.
 */
function avancement(g: Goal, membres?: Goal[]): { faits: number; total: number; pct: number } {
  let total: number;
  let faits: number;

  if (g.goal_type === "super") {
    total = membres?.length ?? 0;
    faits = (membres || []).filter(estFranchi).length;
  } else if (g.goal_type === "habit") {
    total = g.habit_duration_days || 0;
    faits = Array.isArray(g.habit_checks) ? g.habit_checks.filter(Boolean).length : 0;
  } else {
    total = g.totalStepsCount ?? g.total_steps ?? 0;
    faits = g.completedStepsCount ?? g.validated_steps ?? 0;
  }

  return { faits, total, pct: total > 0 ? Math.min(100, Math.round((faits / total) * 100)) : 0 };
}

/* Quatre etats, et non trois.
 *
 * Un groupe dont tous les membres sont franchis n'est pas « en
 * cours » : il n'attend plus de travail, il attend un geste. Confondre
 * les deux rendait ce moment invisible dans la seule vue qui affiche
 * un etat en toutes lettres. Le vivier n'est demande que pour cette
 * question — les appels qui portent sur un objectif ordinaire s'en
 * passent, il ne les concerne pas. */
type Etat = "attente" | "encours" | "pret" | "honore" | "zenith";
function etatDe(g: Goal, tous?: Goal[]): Etat {
  /* Le zenith passe devant l honneur dans la colonne d etat : c est la
     chose la plus rare que la ligne puisse dire, et elle n a la place
     que d un mot. L objectif reste honore pour tout le reste — les
     comptes, l XP, les constellations —, seul l affichage choisit le
     plus fort des deux. */
  if (g.auZenith) return "zenith";
  if (g.status === "fully_completed" || g.status === "validated") return "honore";
  if (tous && estPretAHonorer(g, tous)) return "pret";
  if (g.status === "in_progress") return "encours";
  return "attente";
}

interface Props {
  goals: Goal[];
  allGoals: Goal[];
  customDifficultyName?: string;
  customDifficultyColor?: string;
  onNavigate: (id: string) => void;
  onToggleFocus: (id: string, focus: boolean, e: React.MouseEvent) => void;
}


export const GoalsRegistre = memo(function GoalsRegistre({
  goals,
  allGoals,
  customDifficultyName = "",
  customDifficultyColor = "#a855f7",
  onNavigate,
  onToggleFocus,
}: Props) {
  const { t } = useTranslation();
  const [grouper, setGrouper] = useState<boolean>(() => {
    try { return localStorage.getItem(PREF.REGISTRE_GROUPE) === "1"; } catch { return false; }
  });

  /* Une seule ligne ouverte a la fois.
   *
   * Un accordeon a plusieurs volets ouverts redevient une longue liste :
   * on perd exactement ce que le registre apporte, la vue d ensemble. En
   * n en gardant qu un, la hauteur de la page reste stable et l oeil ne
   * quitte jamais la colonne qu il suivait.
   */
  const [ouvert, setOuvert] = useState<string | null>(null);

  /* Ce qui a deja ete ouvert reste monte.
   *
   * Le contenu n etait rendu que pendant l ouverture : a la fermeture il
   * disparaissait d un coup, le volet passait de 1fr a 0fr avec un
   * contenu vide — donc de sa hauteur a zero instantanement. L ouverture
   * s animait, la fermeture claquait. En gardant monte ce qui a servi,
   * les deux sens s animent, et la requete reste paresseuse : elle ne
   * part toujours qu a la premiere ouverture. */
  const [rendus, setRendus] = useState<Set<string>>(() => new Set());

  const ouvrir = (id: string) => {
    setRendus((r) => (r.has(id) ? r : new Set(r).add(id)));
    setOuvert((o) => (o === id ? null : id));
  };

  /* Les constellations se replient independamment les unes des autres.
   *
   * Le volet d une ligne et le pli d une section ne repondent pas a la
   * meme question : l un montre le detail d un objectif, l autre range
   * une partie du pacte. N en garder qu une ouverte reviendrait a
   * n afficher qu une constellation a la fois, ce qui viderait le mode
   * de son objet.
   *
   * Repliees par defaut : une constellation de dix-neuf objectifs
   * remplissait l ecran a elle seule et enterrait sa propre entete. On
   * memorise celles que l utilisateur ouvre — son rangement lui
   * survit d une visite a l autre. */
  const [constellations, setConstellations] = useState<Set<string>>(() => {
    try {
      const brut = localStorage.getItem(PREF.REGISTRE_CONSTELLATIONS);
      const lu = brut ? JSON.parse(brut) : [];
      return new Set<string>(Array.isArray(lu) ? (lu as string[]) : []);
    } catch { return new Set<string>(); }
  });

  const basculerConstellation = (cle: string) => {
    setConstellations((s) => {
      const n = new Set(s);
      if (n.has(cle)) n.delete(cle); else n.add(cle);
      try { localStorage.setItem(PREF.REGISTRE_CONSTELLATIONS, JSON.stringify([...n])); }
      catch { /* stockage indisponible */ }
      return n;
    });
  };

  const basculer = () => {
    setGrouper((v) => {
      const n = !v;
      try { localStorage.setItem(PREF.REGISTRE_GROUPE, n ? "1" : "0"); } catch { /* stockage indisponible */ }
      return n;
    });
  };

  /* Rattachement d'un objectif a son groupe. Deux mecanismes coexistent :
     un groupe declare liste ses membres, un groupe dynamique les capte
     par une regle. On resout les deux, sans quoi la moitie des objectifs
     tomberait dans "sans groupe" alors qu'ils appartiennent bien
     quelque part. */
  const sections = useMemo(() => {
    if (!grouper) return null;

    const supers = allGoals.filter((g) => g.goal_type === "super");
    const ordinaires = allGoals.filter((g) => g.goal_type !== "super");
    const affiches = new Set(goals.map((g) => g.id));

    const parGroupe = supers.map((s) => {
      const membres = membresDuGroupe(s, allGoals);
      // On ne montre que ce qui est sur la page courante : le registre
      // reste pagine, le regroupement ne le contourne pas.
      return { groupe: s, membres: membres.filter((m) => affiches.has(m.id)) };
    }).filter((s) => s.membres.length > 0);

    const rattaches = new Set(parGroupe.flatMap((s) => s.membres.map((m) => m.id)));
    const libres = goals.filter((g) => g.goal_type !== "super" && !rattaches.has(g.id));

    return { parGroupe, libres };
  }, [grouper, goals, allGoals]);

  const ligne = (g: Goal, indente = false) => {
    const couleur = teinte(g, customDifficultyColor);
    const membres = g.goal_type === "super" ? membresDuGroupe(g, allGoals) : undefined;
    const av = avancement(g, membres);
    const etat = etatDe(g, allGoals);
    const estOuvert = ouvert === g.id;
    // Un objectif sans etape et un groupe sans membre n'ont rien a deplier.
    const deployable = g.goal_type === "super" ? (membres?.length ?? 0) > 0 : av.total > 0;

    return (
      <div key={g.id} className={`rg-bloc${estOuvert ? " est-ouvert" : ""}`}>
        <div
          className={`rg-l${indente ? " rg-l--fils" : ""}`}
          style={{ ["--t" as string]: couleur }}
          role="button"
          tabIndex={0}
          onClick={() => onNavigate(g.id)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onNavigate(g.id); }
          }}
        >
          {indente && <span className="rg-branche" aria-hidden="true" />}

          {/* Le chevron deplie, la ligne ouvre l'objectif. Deux gestes
              distincts pour deux intentions distinctes : consulter le
              detail sur place, ou quitter la liste. */}
          {deployable ? (
            <button
              type="button"
              className="rg-chevron"
              aria-expanded={estOuvert}
              aria-label={estOuvert ? "Replier" : "Déplier"}
              onClick={(e) => { e.stopPropagation(); ouvrir(g.id); }}
            >
              <ChevronRight size={13} aria-hidden="true" />
            </button>
          ) : (
            <span className="rg-chevron rg-chevron--vide" aria-hidden="true" />
          )}

          <span className="rg-palier">{libellePalier(g, customDifficultyName, t)}</span>
          <span className="rg-nom">
            {g.goal_type === "super" && <Crown size={10} aria-hidden="true" />}
            {g.is_locked && <Lock size={10} aria-hidden="true" />}
            {g.name}
          </span>
          <span className="rg-etapes">
            {av.faits}<i>/{av.total}</i>
          </span>
          <span className="gr-jauge" aria-hidden="true">
            {Array.from({ length: 14 }, (_, i) => (
              <u key={i} className={i < Math.round((av.pct / 100) * 14) ? "on" : ""} />
            ))}
          </span>
          <span className="rg-xp">{g.potential_score ?? 0}</span>
          <span className={`rg-etat rg-etat--${etat}`}>
            {etat === "zenith"
              ? "✦ Zénith"
              : etat === "pret"
                ? "À honorer"
                : getStatusLabel(g.status || "not_started", t)}
          </span>
          <button
            type="button"
            className={`rg-focus${g.is_focus ? " active" : ""}`}
            onClick={(e) => { e.stopPropagation(); onToggleFocus(g.id, !!g.is_focus, e); }}
            aria-label={g.is_focus
              ? t("goals.focus.remove", "Retirer du focus")
              : t("goals.focus.set", "Mettre en focus")}
          >
            <Star size={12} fill={g.is_focus ? couleur : "none"} stroke={couleur} />
          </button>
        </div>

        {/* Le volet est toujours dans le DOM : c'est ce qui permet
            d'animer sa hauteur sans la mesurer en JavaScript. */}
        <div className="gr-volet" style={{ ["--t" as string]: couleur }}>
          <div className="gr-volet-in">
            {(estOuvert || rendus.has(g.id)) && (
              g.goal_type === "super"
                ? <MembresDuGroupe membres={membres || []} onNavigate={onNavigate}
                    customDifficultyName={customDifficultyName}
                    customDifficultyColor={customDifficultyColor} />
                : <EtapesDeLObjectif goalId={g.id} />
            )}
          </div>
        </div>
      </div>
    );
  };

  /* Une constellation : son entete, et le pli qui contient ses lignes.
     Le chevron replie, l entete ouvre le groupe — le meme partage des
     gestes que sur les lignes. */
  const constellation = (
    cle: string,
    lignes: Goal[],
    entete: React.ReactNode,
    opts: { libres?: boolean; onNavigate?: () => void } = {},
  ) => {
    const deplie = constellations.has(cle);
    const nav = opts.onNavigate;
    return (
      <div key={cle} className={`rg-section${deplie ? " est-ouvert" : ""}`}>
        <div
          className={`rg-groupe${opts.libres ? " rg-groupe--libres" : ""}`}
          role={nav ? "button" : undefined}
          tabIndex={nav ? 0 : undefined}
          onClick={nav}
          onKeyDown={nav ? (e) => {
            if (e.key === "Enter" || e.key === " ") { e.preventDefault(); nav(); }
          } : undefined}
        >
          <button
            type="button"
            className="rg-chevron rg-chevron--groupe"
            aria-expanded={deplie}
            aria-label={deplie ? "Replier la constellation" : "Déplier la constellation"}
            onClick={(e) => { e.stopPropagation(); basculerConstellation(cle); }}
          >
            <ChevronRight size={13} aria-hidden="true" />
          </button>
          {entete}
        </div>
        <div className="rg-pli">
          <div className="rg-pli-in">{lignes.map((g) => ligne(g, true))}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="gr-registre">
      <div className="rg-barre">
        <span className="rg-titre ds-t-label">Registre</span>
        <span className="rg-fil" />
        <button
          type="button"
          role="switch"
          aria-checked={grouper}
          onClick={basculer}
          className="gl-bascule"
          data-actif={grouper}
          title="Ranger les objectifs sous le groupe auquel ils appartiennent, plutôt qu'à plat."
        >
          <span className="gl-bascule-piste" aria-hidden="true">
            <span className="gl-bascule-bloc" />
          </span>
          <span className="gl-bascule-txt ds-t-label">Par constellation</span>
        </button>
      </div>

      <div className="rg-tete" aria-hidden="true">
        {/* La colonne du chevron a besoin de sa cellule : sans elle, chaque
            libelle glisse d une colonne vers la gauche et mord sur le
            suivant. L en-tete et les lignes partagent la meme grille, ils
            doivent donc avoir le meme nombre de cellules. */}
        <span />
        <span>Palier</span>
        <span>Objectif</span>
        <span>Étapes</span>
        <span>Avancement</span>
        <span>XP</span>
        <span>État</span>
        <span />
      </div>

      {sections ? (
        <>
          {sections.parGroupe.map(({ groupe, membres }) => {
            const faits = membres.filter((m) => etatDe(m) === "honore").length;
            return constellation(
              groupe.id,
              membres,
              <>
                <Crown size={11} aria-hidden="true" />
                <b>{groupe.name}</b>
                <span className="rg-fil" />
                {/* Une constellation repliee doit suffire a decider si on
                    l ouvre. Au-dela de douze membres, une pastille par
                    objectif devient illisible : on passe a une jauge, qui
                    dit la meme chose a taille constante. */}
                {membres.length <= 12 ? (
                  <span className="rg-pastilles" aria-hidden="true">
                    {membres.map((m) => (
                      <u key={m.id} className={etatDe(m) === "honore" ? "on" : ""} />
                    ))}
                  </span>
                ) : (
                  <span className="rg-groupe-jauge" aria-hidden="true">
                    {Array.from({ length: 14 }, (_, i) => (
                      <u key={i} className={i < Math.round((faits / membres.length) * 14) ? "on" : ""} />
                    ))}
                  </span>
                )}
                <span className="rg-compte">{faits}/{membres.length}</span>
              </>,
              { onNavigate: () => onNavigate(groupe.id) },
            );
          })}

          {sections.libres.length > 0 && constellation(
            "__libres",
            sections.libres,
            <>
              <b>Sans groupe</b>
              <span className="rg-fil" />
              <span className="rg-compte">{sections.libres.length}</span>
            </>,
            { libres: true },
          )}
        </>
      ) : (
        goals.map((g) => ligne(g))
      )}
    </div>
  );
});

/* Membres d un groupe, dans le volet. Volontairement plus sobres que les
   lignes principales : ce sont des enfants, pas des pairs. */
function MembresDuGroupe({ membres, onNavigate, customDifficultyName, customDifficultyColor }: {
  membres: Goal[];
  onNavigate: (id: string) => void;
  customDifficultyName: string;
  customDifficultyColor: string;
}) {
  const { t } = useTranslation();
  return (
    <div className="rg-membres">
      {membres.map((m) => {
        const av = avancement(m);
        return (
          <button key={m.id} type="button" className="rg-membre"
            style={{ ["--t" as string]: teinte(m, customDifficultyColor) }}
            onClick={(e) => { e.stopPropagation(); onNavigate(m.id); }}>
            <span className="rg-membre-p">{libellePalier(m, customDifficultyName, t)}</span>
            <span className="rg-membre-n">{m.name}</span>
            <span className="rg-membre-j" aria-hidden="true">
              {Array.from({ length: 10 }, (_, i) => (
                <u key={i} className={i < Math.round((av.pct / 100) * 10) ? "on" : ""} />
              ))}
            </span>
            <span className="rg-membre-c">{av.faits}/{av.total}</span>
          </button>
        );
      })}
    </div>
  );
}

/* Etapes d un objectif. Elles ne sont demandees qu a l ouverture — voir
   useGoalSteps. */
function EtapesDeLObjectif({ goalId }: { goalId: string }) {
  const { data: etapes = [], isLoading } = useGoalSteps(goalId);

  if (isLoading) return <p className="rg-attente">Chargement…</p>;
  if (etapes.length === 0) return <p className="rg-attente">Aucune étape.</p>;

  return (
    <ol className="rg-etapes-liste">
      {etapes.map((e, i) => {
        const faite = e.status === "completed" || e.status === "validated";
        return (
          <li key={e.id} className={faite ? "faite" : ""}>
            <span className="rg-etape-n">{String(i + 1).padStart(2, "0")}</span>
            <span className="rg-etape-coche" aria-hidden="true">{faite ? "✓" : ""}</span>
            <span className="rg-etape-t">{e.title || "Sans titre"}</span>
          </li>
        );
      })}
    </ol>
  );
}

export default GoalsRegistre;
