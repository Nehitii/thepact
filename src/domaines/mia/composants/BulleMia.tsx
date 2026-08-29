/* UNE BULLE DE CONVERSATION, ET CE QU ELLE PORTE.
 *
 * `Bulle`, `Actes` et `Sources` vivaient au bas de `MiaConsole.tsx`,
 * qui faisait 978 lignes. Elles en sortent TELLES QUELLES : on deplace,
 * on ne reecrit pas.
 *
 * Les trois vont ensemble et pas ailleurs : une bulle rend ses actes et
 * ses sources, et rien d autre ne les rend. Les separer en trois
 * fichiers aurait fait trois fichiers qui ne se lisent qu ensemble.
 */
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useNavigate } from "react-router-dom";
import type { ActeMia, MetaMessageMia, SourceMia } from "@/domaines/mia/hooks/useMia";
import { quandDit } from "@/domaines/mia/logique/quand";
import { ReseauMia } from "@/domaines/mia/composants/ReseauMia";

export function Bulle({
  role,
  contenu,
  meta,
  enCours = false,
  quand,
}: {
  role: string;
  contenu: string;
  meta: MetaMessageMia | null;
  enCours?: boolean;
  quand?: string;
}) {
  const heure = quand ? quandDit(quand) : "";
  if (role === "user") {
    return (
      <div className="mia-dit" data-role="user">
        <div className="mia-bulle" data-role="user">
          {contenu}
        </div>
        {heure && <time className="mia-quand" dateTime={quand}>{heure}</time>}
      </div>
    );
  }
  /* LE VISAGE N'EST PLUS ICI.
     Une pastille de sa tête à côté de chaque réponse répétait dix fois
     dans une conversation ce que le bandeau dit une fois, en grand. Son
     état vit là-haut ; ici il ne reste que la marque du réseau. */
  const couche = meta?.couche;
  return (
    <div className="mia-bulle" data-role="assistant">
      <div className="mia-signature">
        <ReseauMia etat={enCours ? "travail" : "reponse"} taille={12} />
        <span>M.I.A</span>
        {/* D'OÙ VIENT CETTE RÉPONSE. Ce n'est pas de la mise au point :
            c'est ce qui apprend, en deux jours, quelles questions sont
            gratuites — et donc lesquelles poser sans hésiter. */}
        {couche && <em className={`mia-couche mia-couche-${couche}`}>{couche === "reflexe" ? "réflexe" : "geste"}</em>}
        {heure && <time className="mia-quand" dateTime={quand}>{heure}</time>}
      </div>
      <div className="mia-texte">
        {contenu ? (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{contenu}</ReactMarkdown>
        ) : (
          <p style={{ opacity: 0.6 }}>…</p>
        )}
      </div>
      {meta?.actions?.length ? <Actes actes={meta.actions} /> : null}
      {meta?.citations?.length ? <Sources sources={meta.citations} /> : null}
    </div>
  );
}

/* Ce que M.I.A a fait. Les pastilles vertes arrondies disaient
   « Tâche ajoutée : … » détachées du texte ; c'est un relevé, pas une
   décoration, et un relevé se lit en colonne. */
const ACTES: Record<string, { verbe: string; route?: (id?: string) => string }> = {
  create_goal: { verbe: "objectif créé", route: (id) => `/goals/${id}` },
  create_habit_goal: { verbe: "habitude créée", route: (id) => `/goals/${id}` },
  create_todo: { verbe: "tâche ajoutée", route: () => "/todo" },
  complete_todo: { verbe: "tâche cochée", route: () => "/todo" },
  reschedule_todo: { verbe: "tâche replanifiée", route: () => "/todo" },
  complete_step: { verbe: "étape cochée" },
  add_step: { verbe: "étape ajoutée" },
  reschedule_step: { verbe: "étape replanifiée" },
  create_journal_entry: { verbe: "entrée écrite", route: () => "/journal" },
  create_calendar_event: { verbe: "évènement posé", route: () => "/calendar" },
  add_wishlist_item: { verbe: "souhait ajouté", route: () => "/wishlist" },
};

function Actes({ actes }: { actes: ActeMia[] }) {
  const navigate = useNavigate();
  return (
    <div className="mia-actes">
      {actes.map((a, i) => {
        const meta = ACTES[a.tool] ?? { verbe: a.tool };
        const ouvrable = a.status === "ok" && !!meta.route;
        return (
          <div key={`${a.tool}-${i}`} className="mia-acte" data-etat={a.status}>
            <i />
            {meta.verbe} <b title={a.error ?? a.label}>{a.label}</b>
            {ouvrable && (
              <button
                type="button"
                className="mia-acte-lien"
                onClick={() => navigate(meta.route!(a.ref_id))}
              >
                ouvrir
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* « /reviews » n existe plus. La revue hebdomadaire vit dans une
   modale du tableau de bord : c est la qu on envoie. Quant aux
   decisions, plus aucun ecran ne les montre — le bouton ne s affiche
   que si le type figure ici, donc l entree retiree ne casse rien. */
const OU_VA: Record<string, (id: string) => string> = {
  journal_entry: () => "/journal",
  weekly_review: () => "/",
  goal: (id) => `/goals/${id}`,
};

const NOM_SOURCE: Record<string, string> = {
  journal_entry: "Journal",
  decision: "Décision",
  weekly_review: "Revue",
  goal: "Objectif",
};

function Sources({ sources }: { sources: SourceMia[] }) {
  const navigate = useNavigate();
  return (
    <div className="mia-sources">
      {sources.slice(0, 6).map((s, i) => (
        <button
          key={`${s.source_type}-${s.source_id}-${i}`}
          type="button"
          className="mia-source"
          title={s.snippet}
          onClick={() => {
            const aller = OU_VA[s.source_type];
            if (aller) navigate(aller(s.source_id));
          }}
        >
          {NOM_SOURCE[s.source_type] ?? s.source_type}
        </button>
      ))}
    </div>
  );
}
