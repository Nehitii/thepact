import { useEffect, useState, type ComponentType } from "react";
import { CountdownPanel } from "@/domaines/accueil/composants/CountdownPanel";
import { CompteChantier } from "@/domaines/accueil/composants/compte/CompteChantier";
import { CompteNixies } from "@/domaines/accueil/composants/compte/CompteNixies";
import { CompteRuban } from "@/domaines/accueil/composants/compte/CompteRuban";
import { CompteMeche } from "@/domaines/accueil/composants/compte/CompteMeche";
import { AccesRue } from "@/domaines/accueil/composants/acces/AccesRue";
import { PointeuseNuit } from "@/domaines/accueil/composants/ordres/pointeuse/PointeuseNuit";
import { useSansMouvementAuBanc } from "@/domaines/accueil/hooks/useSansMouvementAuBanc";
import { instantDeLaFin, instantDuDebut } from "@/domaines/accueil/logique/compteARebours";
import { scenarioDe } from "@/domaines/accueil/logique/scenariosDesOrdres";
import type { ProprietesDuCompte } from "@/domaines/accueil/types";
import "@/socle/ds/banc.css";
import "@/domaines/accueil/banc-du-bandeau.css";

/* LE BANC DU COMPTE A REBOURS.
 *
 * Les refontes du compte a rebours a leur place : sous le temps « Agir »
 * de l accueil — la rue et l atelier de nuit —, a 2,5 rem, comme sur
 * l accueil. Chacune recoit les proprietes de l ancien panneau, qui
 * ouvre la liste pour comparer.
 *
 * LE PUPITRE JOUE LE TEMPS : un pacte (celui en cours, un mois, trois
 * ans, sans date de fin) et un moment de sa vie — avant l ouverture, le
 * troisieme jour, nominal, attention, critique, trente-six heures,
 * quarante minutes, le terme passe. L heure reelle reste au choix. La
 * planche montre toutes les propositions a un moment, ou une
 * proposition a tous les moments.
 *
 * Clavier : ← → changent de proposition, P ouvre la planche, H masque le
 * pupitre. L adresse fait de meme : « ?variante=ruban&moment=critique
 * &pacte=mois&planche=moments&ordres=0&pupitre=0&mouvement=0 ».
 *
 * IL NE LIT NI N ECRIT RIEN. */

interface Variante {
  id: string;
  nom: string;
  idee: string;
  Composant: ComponentType<ProprietesDuCompte>;
}

const VARIANTES: readonly Variante[] = [
  { id: "ancien", nom: "Panneau actuel", idee: "La règle de 150 px : le gros chiffre, la phase en couleur, la durée tracée du début au terme et le curseur d’aujourd’hui.", Composant: CountdownPanel },
  { id: "chantier", nom: "A · Le panneau de chantier", idee: "Un panneau à messages variables, diodes orange entre deux bandes de hachures : « Fin des travaux dans 270 jours », l’avancement en segments, un gyrophare qui s’allume à l’attention et tourne dans la dernière ligne droite. Dessous, la plaque du chantier.", Composant: CompteChantier },
  { id: "nixies", nom: "B · Les nixies et le galvanomètre", idee: "Un boîtier d’instrument, bakélite et laiton, de la famille de l’atelier de nuit : les jours en grands tubes nixie, un galvanomètre dont l’aiguille dit la part écoulée — le dernier quart du cadran est rouge —, le voyant de l’état et les deux bornes gravées.", Composant: CompteNixies },
  { id: "ruban", nom: "C · Le mètre ruban", idee: "Un mètre ruban sur le béton de la rue : le boîtier calé sur le terme, le crochet accroché à aujourd’hui, et le ruban tiré, c’est ce qui reste. Le dernier quart du pacte est imprimé en rouge ; derrière le crochet, un trait de craie depuis la croix du premier jour.", Composant: CompteRuban },
  { id: "meche", nom: "D · La mèche", idee: "Une mèche qui brûle depuis l’ouverture, la nuit, jusqu’au mortier du bouquet final planté au terme : derrière l’étincelle la cendre, devant la mèche verte, et le gros chiffre qui suit l’étincelle. Au terme, le bouquet part.", Composant: CompteMeche },
];

interface Pacte { id: string; nom: string; debut: string; fin: string | null }

const PACTES: readonly Pacte[] = [
  { id: "en-cours", nom: "Le pacte en cours : 24.06.2026 → 30.06.2027", debut: "2026-06-24", fin: "2027-06-30" },
  { id: "mois", nom: "Un mois : 20.09 → 19.10.2026", debut: "2026-09-20", fin: "2026-10-19" },
  { id: "trois-ans", nom: "Trois ans : 06.01.2025 → 05.01.2028", debut: "2025-01-06", fin: "2028-01-05" },
  { id: "sans-fin", nom: "Sans date de fin", debut: "2026-06-24", fin: null },
];

const JOUR = 86_400_000;
const HEURE = 3_600_000;

interface Moment {
  id: string;
  nom: string;
  /** L instant joue, entre le premier minuit et le terme ; rien : l heure reelle. */
  quand: ((debut: number, fin: number) => number) | null;
}

const MOMENTS: readonly Moment[] = [
  { id: "reel", nom: "L’heure réelle", quand: null },
  { id: "a-venir", nom: "Dix jours avant l’ouverture", quand: (d) => d - 10 * JOUR + 9 * HEURE },
  { id: "ouverture", nom: "Le troisième jour", quand: (d) => d + 2 * JOUR + 10 * HEURE },
  { id: "nominal", nom: "Nominal : un sixième écoulé", quand: (d, f) => d + (f - d) * 0.16 },
  { id: "attention", nom: "Attention : à mi-chemin", quand: (d, f) => d + (f - d) * 0.5 },
  { id: "critique", nom: "Critique : la dernière ligne droite", quand: (d, f) => d + (f - d) * 0.89 },
  { id: "heures", nom: "36 heures avant le terme", quand: (_, f) => f - 36 * HEURE },
  { id: "minutes", nom: "40 minutes avant le terme", quand: (_, f) => f - 40 * 60_000 },
  { id: "termine", nom: "Le terme passé de cinq jours", quand: (_, f) => f + 5 * JOUR },
];

type Planche = "non" | "propositions" | "moments";

const parametre = (cle: string) => new URLSearchParams(window.location.search).get(cle);
const MODULES = { "todo-list": true, journal: true, "track-health": true };
const ORDRES = scenarioDe("en-cours").ordres;
const nullePart = () => {};

function instantDuMoment(moment: Moment, pacte: Pacte): number | undefined {
  const debut = instantDuDebut(pacte.debut);
  const fin = pacte.fin ? instantDeLaFin(pacte.fin) : null;
  if (!moment.quand || debut === null || fin === null) return undefined;
  return Math.round(moment.quand(debut, fin));
}

export default function BancDuCompte() {
  const [variante, setVariante] = useState(() => parametre("variante") ?? "ruban");
  const [pacteId, setPacteId] = useState(() => parametre("pacte") ?? "en-cours");
  const [momentId, setMomentId] = useState(() => parametre("moment") ?? "reel");
  const [planche, setPlanche] = useState<Planche>(() => {
    const p = parametre("planche");
    return p === "moments" ? "moments" : p === "1" || p === "propositions" ? "propositions" : "non";
  });
  const [pupitre, setPupitre] = useState(() => parametre("pupitre") !== "0");
  const [avecOrdres, setAvecOrdres] = useState(() => parametre("ordres") !== "0");
  const active = VARIANTES.find((v) => v.id === variante) ?? VARIANTES[3];
  const pacte = PACTES.find((p) => p.id === pacteId) ?? PACTES[0];
  const moment = MOMENTS.find((m) => m.id === momentId) ?? MOMENTS[0];

  useSansMouvementAuBanc(parametre("mouvement") === "0");

  useEffect(() => {
    const auClavier = (e: KeyboardEvent) => {
      const cible = e.target as HTMLElement | null;
      if (cible && ["SELECT", "TEXTAREA", "INPUT"].includes(cible.tagName)) return;
      const pas = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (pas) {
        setVariante((id) => {
          const i = VARIANTES.findIndex((v) => v.id === id);
          return VARIANTES[(i + pas + VARIANTES.length) % VARIANTES.length].id;
        });
      } else if (e.key === "h" || e.key === "H") setPupitre((v) => !v);
      else if (e.key === "p" || e.key === "P") setPlanche((v) => (v === "non" ? "propositions" : "non"));
    };
    window.addEventListener("keydown", auClavier);
    return () => window.removeEventListener("keydown", auClavier);
  }, []);

  const proprietes = (m: Moment): ProprietesDuCompte => ({
    projectStartDate: pacte.debut,
    projectEndDate: pacte.fin,
    maintenant: instantDuMoment(m, pacte),
  });

  const ordres = avecOrdres && (
    <div className="bdo-agir">
      <AccesRue ownedModules={MODULES} onNaviguer={nullePart} />
      <PointeuseNuit ordres={ORDRES} onReclamer={nullePart} replie={false} onBasculerRepli={nullePart} />
    </div>
  );
  /* Sans date de fin, aucun panneau ne se montre : l accueil passe au
     monitoring. Le banc le dit au lieu de laisser un trou. */
  const absent = !pacte.fin && <p className="bdb-legende">Sans date de fin, le compte à rebours ne se montre pas.</p>;

  return (
    <div className="banc" data-pupitre={pupitre ? undefined : "masque"}>
      <aside className="banc-pupitre">
        <h1>Banc du compte à rebours</h1>
        <p className="banc-note">
          Rien n est lu en base. ← → changent de proposition, P ouvre la planche,
          H masque ce pupitre.
        </p>

        <label className="banc-champ">
          <span>Proposition</span>
          <select value={active.id} onChange={(e) => setVariante(e.target.value)}>
            {VARIANTES.map((v) => <option key={v.id} value={v.id}>{v.nom}</option>)}
          </select>
        </label>
        <p className="banc-note bdb-idee">{active.idee}</p>

        <label className="banc-champ">
          <span>Pacte</span>
          <select value={pacte.id} onChange={(e) => setPacteId(e.target.value)}>
            {PACTES.map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}
          </select>
        </label>
        <label className="banc-champ">
          <span>Moment</span>
          <select value={moment.id} onChange={(e) => setMomentId(e.target.value)}>
            {MOMENTS.map((m) => <option key={m.id} value={m.id}>{m.nom}</option>)}
          </select>
        </label>

        <label className="banc-champ">
          <span>Planche</span>
          <select value={planche} onChange={(e) => setPlanche(e.target.value as Planche)}>
            <option value="non">Une proposition, à sa place</option>
            <option value="propositions">Toutes les propositions, à ce moment</option>
            <option value="moments">Cette proposition, à tous les moments</option>
          </select>
        </label>
        <label className="banc-bascule">
          <input type="checkbox" checked={avecOrdres} onChange={(e) => setAvecOrdres(e.target.checked)} />
          <span>La rue et l’atelier au-dessus</span>
        </label>
      </aside>

      <div className="banc-scene bdb-scene">
        {planche === "propositions" ? (
          VARIANTES.map(({ id, nom, idee, Composant }) => (
            <section key={id} className="bdb-epreuve" aria-label={nom}>
              <p className="bdb-legende"><b>{nom}</b> {idee}</p>
              <div className="bdb-colonne">{absent}<Composant {...proprietes(moment)} /></div>
            </section>
          ))
        ) : planche === "moments" ? (
          MOMENTS.filter((m) => m.quand).map((m) => (
            <section key={m.id} className="bdb-epreuve" aria-label={m.nom}>
              <p className="bdb-legende"><b>{m.nom}</b> {active.nom}</p>
              <div className="bdb-colonne">{absent}<active.Composant {...proprietes(m)} /></div>
            </section>
          ))
        ) : (
          <div className="bdb-colonne bda-pile" key={active.id}>
            {ordres}
            {absent}
            <active.Composant {...proprietes(moment)} />
          </div>
        )}
      </div>
    </div>
  );
}
