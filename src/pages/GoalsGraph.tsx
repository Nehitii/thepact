import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Position,
  type Edge,
  type Node,
} from "reactflow";
import "reactflow/dist/style.css";
import "@/styles/cyberpunk.css";
import "@/styles/graph.css";
import { useAuth } from "@/contexts/AuthContext";
import { usePact } from "@/hooks/usePact";
import { useGoals } from "@/hooks/useGoals";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DSPageShell, DSPageLoader } from "@/components/ds";
import { SpaceBackdrop } from "@/components/home/SpaceBackdrop";
import { filterGoalsByRule, decrireRegle, regleVaine, type SuperGoalRule } from "@/components/goals/super";
import { ArrowLeft, Plus } from "lucide-react";

/* ─────────────────────────────────────────────────────────────
   CONSTELLATION

   Cette page lisait une table de dependances restee vide : sur 38
   objectifs, aucune n'a jamais ete declaree. Le graphe affichait donc
   38 boites sans aucun lien. La fonctionnalite a depuis ete retiree,
   et cette page ne lit plus que la structure ci-dessous.

   Or la structure existe deja, ailleurs : un super-objectif rassemble
   des objectifs, soit nommement (child_goal_ids), soit par une regle
   (is_dynamic_super + super_goal_rule). Six super-objectifs, vingt-deux
   objectifs rattaches. C'est cette constellation-la qu'on dessine.

   Trois defauts corriges au passage, chacun invisible sans mesure :

   1. Le conteneur ReactFlow tombait a 0px de haut. ReactFlow exige un
      parent de hauteur explicite ; le panneau lui en donnait une, mais
      pas le div intermediaire. Rien ne s'affichait — pas une erreur, un
      rectangle vide.
   2. STATUS_COLORS ne connaissait que "completed", "pending" et
      "abandoned" : trois clefs qui n'existent nulle part en base. Les
      statuts reels sont fully_completed, not_started et in_progress.
      Mesure sur les noeuds rendus : 29 sur 38 tombaient sur le gris de
      repli.
   3. Sans arete, tous les noeuds se retrouvaient au meme etage du tri
      topologique — une colonne de 4070px. fitView demandait un zoom de
      0,11, minZoom le plafonnait a 0,2, et le texte finissait rendu a
      2,2px.
   ───────────────────────────────────────────────────────────── */

/* Couleur = DIFFICULTE, pas statut.
 *
 * La version precedente colorait par statut, ce qui repondait a une
 * question que la liste traite deja mieux. Dans un arbre de competences
 * la couleur dit la NATURE du noeud — ici son palier — et son etat se lit
 * a autre chose : un noeud acquis brille, un noeud verrouille est eteint.
 * On code donc deux informations sans les faire se disputer le meme canal.
 *
 * La palette est celle des cartes de la vue grille, a l identique : le
 * meme objectif ne peut pas changer de couleur selon l ecran ou on le
 * regarde. */
const PALIER: Record<string, string> = {
  easy: "#4ade80",
  medium: "#facc15",
  hard: "#fb923c",
  extreme: "#f87171",
  impossible: "#c084fc",
  custom: "#a855f7",
};

const NOM_PALIER: Record<string, string> = {
  easy: "FACILE", medium: "MOYEN", hard: "DIFFICILE",
  extreme: "EXTREME", impossible: "IMPOSSIBLE", custom: "CUSTOM",
};

type Etat = "acquis" | "encours" | "verrouille";

function etatDe(statut: string): Etat {
  if (statut === "fully_completed" || statut === "validated") return "acquis";
  if (statut === "in_progress") return "encours";
  return "verrouille";
}

function avancement(g: any): number {
  const habit = g.goal_type === "habit";
  const total = habit ? g.habit_duration_days || 0 : g.totalStepsCount ?? g.total_steps ?? 0;
  const fait = habit
    ? (Array.isArray(g.habit_checks) ? g.habit_checks.filter(Boolean).length : 0)
    : g.completedStepsCount ?? g.validated_steps ?? 0;
  return total > 0 ? Math.min(100, Math.round((fait / total) * 100)) : 0;
}

const JAUNE = "#fcee0a";

/* Disposition en amas.
 *
 * Un tri topologique en couches n'a de sens que pour un graphe oriente
 * profond. Ici la structure est plate et groupee : le moyeu et ses
 * satellites.
 *
 * Premiere tentative : un anneau de satellites autour de chaque moyeu.
 * Elle a produit huit chevauchements, mesure a l'appui. La raison est
 * arithmetique : pour cinq enfants le rayon valait 170px alors que le
 * moyeu s'etend deja sur 98px de demi-largeur et un satellite sur 84 —
 * il aurait fallu 212px au minimum, et davantage encore une fois
 * l'anneau ecrase verticalement. Grossir le rayon dilate l'ensemble et
 * rend le texte illisible a l'echelle d'ensemble.
 *
 * Le moyeu est donc pose a gauche et ses satellites empiles a sa droite,
 * sur UNE seule colonne. Aucun chevauchement n'est possible par
 * construction.
 *
 * La colonne unique n'est pas un detail de mise en page : avec deux
 * colonnes, l'arete qui relie le moyeu a un satellite de la seconde
 * passait forcement par-dessus une carte de la premiere, et le trace
 * devenait illisible. En n'en gardant qu'une, le couloir entre le moyeu
 * et la colonne n'accueille aucune carte : il est reserve aux aretes,
 * qui s'y deploient en eventail sans jamais croiser un noeud. */
const L_NOEUD = 196;
const H_NOEUD = 108;
const DECALAGE_MOYEU = 330;
const COLS_ENFANTS = 1;

function disposer(
  supers: { id: string; enfants: string[] }[],
  libres: string[],
): Map<string, { x: number; y: number }> {
  const pos = new Map<string, { x: number; y: number }>();
  const PAR_RANGEE = 2;
  const LARGEUR_AMAS = DECALAGE_MOYEU + COLS_ENFANTS * L_NOEUD + 70;

  let basDeRangee = 0;
  let hauteurRangee = 0;
  let yRangee = 0;

  supers.forEach((s, i) => {
    const col = i % PAR_RANGEE;
    if (col === 0 && i > 0) {
      yRangee += hauteurRangee + 90;
      hauteurRangee = 0;
    }
    const cx = col * LARGEUR_AMAS;
    const lignes = Math.max(1, Math.ceil(s.enfants.length / COLS_ENFANTS));
    const hauteurAmas = lignes * H_NOEUD;
    hauteurRangee = Math.max(hauteurRangee, hauteurAmas);

    // Le moyeu se centre verticalement sur la pile de ses satellites.
    pos.set(s.id, { x: cx, y: yRangee + (hauteurAmas - H_NOEUD) / 2 });

    s.enfants.forEach((id, k) => {
      if (pos.has(id)) return; // deja place par un autre amas
      pos.set(id, {
        x: cx + DECALAGE_MOYEU + (k % COLS_ENFANTS) * L_NOEUD,
        y: yRangee + Math.floor(k / COLS_ENFANTS) * H_NOEUD,
      });
    });
    basDeRangee = yRangee + hauteurRangee;
  });

  const basY = basDeRangee + 130;
  libres.forEach((id, k) => {
    if (pos.has(id)) return;
      pos.set(id, { x: (k % 5) * L_NOEUD, y: basY + Math.floor(k / 5) * H_NOEUD });
  });

  return pos;
}

export default function GoalsGraph() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: pact } = usePact(user?.id);
  const { data: goals = [], isLoading: chargementGoals } = useGoals(pact?.id);
  /* La regle ne trace plus d aretes : elle eclaire. Voir plus bas. */
  const [lentille, setLentille] = useState(false);

  const { nodes, edges, stats } = useMemo(() => {
    const parId = new Map(goals.map((g) => [g.id, g]));
    const supers = goals.filter((g) => g.goal_type === "super");
    const ordinaires = goals.filter((g) => g.goal_type !== "super");

    /* Un groupe declare relie ses membres ; un groupe automatique les
       capte par une regle. Les deux compositions se calculent ici, mais
       seule la premiere donnera des aretes — voir la lentille plus bas. */
    const amas = supers.map((s) => {
      const enfants = s.is_dynamic_super && s.super_goal_rule
        ? filterGoalsByRule(
            ordinaires.filter((g) => g.id !== s.id),
            s.super_goal_rule as SuperGoalRule,
          ).map((g) => g.id)
        : (s.child_goal_ids || []).filter((id) => parId.has(id));
      return { id: s.id, enfants, dynamique: !!s.is_dynamic_super };
    });

    /* UNE REGLE ECLAIRE, ELLE NE RELIE PAS.
     *
     * La bascule ajoutait les aretes des groupes automatiques. Celle du
     * pacte capte trente-deux objectifs sur trente-deux : on passait de
     * vingt-deux liens lisibles a cinquante-quatre, dont trente-deux qui
     * partaient tous du meme moyeu. Un enchevetrement ne montre rien.
     *
     * Un groupe automatique n est pas un arbre, c est un ENSEMBLE. On le
     * dessine donc comme tel : ses membres s allument, le reste
     * s eteint. Aucune arete, aucune position ne bouge — la lentille
     * change ce qu on regarde, pas la carte.
     */
    const amasTraces = amas.filter((a) => !a.dynamique);
    const rattaches = new Set<string>();
    amasTraces.forEach((a) => a.enfants.forEach((id) => rattaches.add(id)));
    const libres = ordinaires.filter((g) => !rattaches.has(g.id)).map((g) => g.id);

    const captesParRegle = new Set<string>();
    amas.filter((a) => a.dynamique).forEach((a) => a.enfants.forEach((id) => captesParRegle.add(id)));

    const pos = disposer(
      amasTraces.map((a) => ({ id: a.id, enfants: a.enfants })),
      libres,
    );
    // Un groupe automatique ne relie rien, mais il reste un moyeu visible.
    amas.filter((a) => !amasTraces.includes(a)).forEach((a, i) => {
      if (!pos.has(a.id)) pos.set(a.id, { x: -420, y: i * 150 });
    });

    const noeuds: Node[] = goals.map((g) => {
      const estSuper = g.goal_type === "super";
      const monAmas = amas.find((a) => a.id === g.id);
      const palier = g.difficulty || "easy";
      const teinte = estSuper ? JAUNE : PALIER[palier] || "#94a3b8";
      const etat = estSuper
        ? (monAmas && monAmas.enfants.length > 0
            && monAmas.enfants.every((id) => etatDe(parId.get(id)?.status || "") === "acquis")
            ? "acquis" : "encours")
        : etatDe(g.status);
      const pct = estSuper
        ? (monAmas && monAmas.enfants.length
            ? Math.round(monAmas.enfants.filter((id) => etatDe(parId.get(id)?.status || "") === "acquis").length
                / monAmas.enfants.length * 100)
            : 0)
        : avancement(g);

      return {
        id: g.id,
        position: pos.get(g.id) || { x: 0, y: 0 },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        className: [
          "gr-noeud",
          estSuper && "gr-noeud--moyeu",
          `gr-etat-${etat}`,
          lentille && (captesParRegle.has(g.id) || monAmas?.dynamique ? "gr-capte" : "gr-hors-portee"),
        ].filter(Boolean).join(" "),
        // La propriete personnalisee doit etre castee : le type CSSProperties
        // de React ne declare pas les variables --*.
        style: { ["--t" as string]: teinte } as React.CSSProperties,
        data: {
          label: (
            /* Un vrai conteneur, et non un Fragment : ReactFlow insere le
               label directement dans le noeud, sans div intermediaire. Les
               regles ecrites pour ".gr-noeud > div" ne correspondaient donc
               a rien et la hauteur n etait jamais appliquee — les cartes
               faisaient 173px au lieu de 84, d ou dix-sept chevauchements. */
            <span className="gr-carte">
              {g.image_url
                ? <img src={g.image_url} alt="" className="gr-img" loading="lazy" />
                : <span className="gr-img gr-img--absente" aria-hidden="true" />}
              <span className="gr-voile" />
              <span className="gr-corps">
                <span className="gr-haut">
                  <span className="gr-palier">
                    {estSuper ? (monAmas?.dynamique ? "DYNAMIQUE" : "GROUPE") : NOM_PALIER[palier] || palier}
                  </span>
                  {/* rien ici : la marque est en bas de carte */}
                </span>
                <span className="gr-nom">{g.name}</span>
                {etat === "acquis" ? (
                  /* Une bande pleine sur toute la largeur, avec le mot ecrit.
                     Le fanion d angle qui la precedait etait un signe a
                     decoder — or personne ne lit une legende pour comprendre
                     une carte. La bande occupe le meme espace que la jauge
                     qu elle remplace, et se lit a n importe quelle echelle. */
                  <span className="gr-acquis-bande">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12.5l5.2 5.2L20 6.9" /></svg>
                    HONORÉ
                  </span>
                ) : (
                  <span className="gr-jauge"><i style={{ width: `${pct}%` }} /></span>
                )}
              </span>
            </span>
          ),
        },
      };
    });

    const aretes: Edge[] = [];
    amasTraces.forEach((a) => {
      a.enfants.forEach((idEnfant) => {
        const enfant = parId.get(idEnfant);
        const teinte = PALIER[enfant?.difficulty || "easy"] || "#94a3b8";
        const acquis = etatDe(enfant?.status || "") === "acquis";
        /* Le lien porte la couleur du palier de l enfant et s allume
           lorsqu il est acquis : le courant passe. C est ce qui donne a
           l ensemble sa lecture d arbre de competences — on voit d un
           coup d oeil quelles branches sont alimentees. */
        aretes.push({
          id: `amas-${a.id}-${idEnfant}`,
          source: a.id,
          target: idEnfant,
          type: "smoothstep",
          zIndex: 0,
          pathOptions: { borderRadius: 26, offset: 18 },
          animated: acquis,
          className: "gr-arete",
          style: {
            stroke: teinte,
            strokeOpacity: acquis ? 0.95 : 0.34,
            strokeWidth: acquis ? 2.2 : 1.3,
          },
        });
      });
    });

    return {
      nodes: noeuds,
      edges: aretes,
      stats: {
        supers: supers.length,
        rattaches: rattaches.size,
        libres: libres.length,
        dependances: aretes.filter((e) => e.id.startsWith("dep-")).length,
        nomsDynamiques: supers.filter((g) => g.is_dynamic_super).map((g) => g.name),
        tailleDynamique: captesParRegle.size,
        eligibles: ordinaires.length,
        regles: supers
          .filter((g) => g.is_dynamic_super)
          .map((g) => decrireRegle(g.super_goal_rule as SuperGoalRule | null)),
        regleVaine: supers
          .filter((g) => g.is_dynamic_super)
          .some((g) => regleVaine(g.super_goal_rule as SuperGoalRule | null, captesParRegle.size, ordinaires.length)),
      },
    };
  }, [goals, lentille]);

  if (chargementGoals) {
    return <DSPageLoader message="LECTURE DE LA CONSTELLATION" />;
  }

  return (
    <DSPageShell width="full" padding="tight" background={<SpaceBackdrop />} className="!p-0">
      <div className="gr-page">
        <div className="cp-cadre gr-tete-cadre">
          <div className="cp-fond gr-tete">
            <span className="cp-equerre cp-equerre-hg" />
            {/* Le retour etait un lien pose AU-DESSUS du titre, dans une
                colonne : trop petit pour se voir, et detache de tout ce qui
                l'entourait. Il devient un bouton carre a gauche du titre, sur
                la meme ligne — la ou l'oeil cherche un retour, et la seule
                position qui le rattache a quelque chose. Il reprend le
                chanfrein et la cible tactile des autres boutons. */}
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="gr-retour"
              aria-label="Retour aux objectifs"
              title="Retour aux objectifs"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              {/* Le mot revient. Une icone seule dans un carre se remarque
                  toujours moins qu'un bouton libelle — et a cote d'un titre
                  en Orbitron de 26px, un carre vide de 36px disparait. */}
              <span className="gr-retour-mot">Retour</span>
            </button>
            <h1 className="gr-titre font-orbitron">
              Constellation
            </h1>

            <span className="ana-panneau-fil" />

            <div className="gr-chiffres">
              <span className="gr-chiffre"><b style={{ color: JAUNE }}>{stats.supers}</b> groupes</span>
              <span className="gr-chiffre"><b style={{ color: "#00d4ff" }}>{stats.rattaches}</b> rattachés</span>
              <span className="gr-chiffre"><b style={{ color: "#7089a0" }}>{stats.libres}</b> libres</span>
              {stats.dependances > 0 && (
                <span className="gr-chiffre"><b style={{ color: "#ff003c" }}>{stats.dependances}</b> dépendances</span>
              )}
            </div>

            {/* La regle se dit, elle ne se devine pas.

                La bascule annoncait « regle auto · 32 » : le nombre capte,
                jamais le critere. Or c est le critere qui explique le
                nombre — et ici qui revele que la regle ne trie rien, parce
                qu elle coche les six paliers sans autre condition. On
                l ecrit donc en toutes lettres, et on le dit quand elle
                prend tout. */}
            {stats.nomsDynamiques.length > 0 && (
              <button
                type="button"
                role="switch"
                aria-checked={lentille}
                onClick={() => setLentille((v) => !v)}
                className="gl-bascule gr-bascule"
                data-actif={lentille}
                data-vaine={stats.regleVaine ? "1" : "0"}
                title={
                  `${stats.nomsDynamiques.join(", ")} rassemble ses membres par une règle : ` +
                  `${stats.regles.join(" / ")}. Elle capte ${stats.tailleDynamique} objectifs ` +
                  `sur ${stats.eligibles}. ` +
                  (stats.regleVaine
                    ? "Elle prend tout le pacte : elle ne distingue rien tant qu'on ne la restreint pas."
                    : "Activer éclaire ce qu'elle capte et éteint le reste.")
                }
              >
                <span className="gl-bascule-piste" aria-hidden="true">
                  <span className="gl-bascule-bloc" />
                </span>
                <span className="gl-bascule-txt ds-t-label">
                  {stats.nomsDynamiques.join(" · ")}
                  <i className="gr-bascule-note">
                    {stats.regles.join(" / ")} · {stats.tailleDynamique}/{stats.eligibles}
                    {stats.regleVaine && <em className="gr-vaine"> ne trie rien</em>}
                  </i>
                </span>
              </button>
            )}
          </div>
        </div>

        {/* La hauteur est portee ici, en dur, et non par une classe flex :
            ReactFlow mesure son parent au montage et se replie a zero si
            celui-ci n'a pas de hauteur resolue a cet instant. C'est ce qui
            laissait un rectangle vide. */}
        <div className="cp-cadre gr-toile-cadre">
          <div className="cp-fond gr-toile">
            {nodes.length === 0 ? (
              <div className="gr-vide">
                <p className="ds-t-label">Aucun objectif à relier pour le moment.</p>
                <button type="button" onClick={() => navigate("/goals/new")} className="gl-btn gl-btn-primaire">
                  <Plus className="h-4 w-4" aria-hidden="true" /> {t("goals.createGoal")}
                </button>
              </div>
            ) : (
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodeClick={(_, n) => navigate(`/goals/${n.id}`)}
                fitView
                fitViewOptions={{ padding: 0.16 }}
                minZoom={0.08}
                maxZoom={1.6}
                proOptions={{ hideAttribution: true }}
              >
                <Background color="rgba(0,190,255,.14)" gap={26} />
                <Controls showInteractive={false} />
                <MiniMap
                  pannable
                  zoomable
                  maskColor="rgba(3,7,14,.78)"
                  nodeColor={(n) => {
                    const g = goals.find((x) => x.id === n.id);
                    if (!g) return "#7089a0";
                    return g.goal_type === "super" ? JAUNE : PALIER[g.difficulty || "easy"] || "#94a3b8";
                  }}
                />
              </ReactFlow>
            )}
          </div>
        </div>
      </div>
    </DSPageShell>
  );
}
