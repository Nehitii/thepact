import { useEffect, useRef, useState, type ComponentType } from "react";
import { PanneauDesOrdres } from "@/domaines/succes";
import { EnseigneDEssai } from "@/domaines/accueil/composants/bandeau/EnseigneDEssai";
import { AccesRue } from "@/domaines/accueil/composants/acces/AccesRue";
import { OrdresVitrine } from "@/domaines/accueil/composants/ordres/OrdresVitrine";
import { OrdresPointeuse } from "@/domaines/accueil/composants/ordres/OrdresPointeuse";
import { OrdresCarnet } from "@/domaines/accueil/composants/ordres/OrdresCarnet";
import { OrdresArdoise } from "@/domaines/accueil/composants/ordres/OrdresArdoise";
import { PointeuseHorodateur } from "@/domaines/accueil/composants/ordres/pointeuse/PointeuseHorodateur";
import { PointeuseCasiers } from "@/domaines/accueil/composants/ordres/pointeuse/PointeuseCasiers";
import { PointeuseCarteDuJour } from "@/domaines/accueil/composants/ordres/pointeuse/PointeuseCarteDuJour";
import { PointeuseNuit } from "@/domaines/accueil/composants/ordres/pointeuse/PointeuseNuit";
import { useSansMouvementAuBanc } from "@/domaines/accueil/hooks/useSansMouvementAuBanc";
import { avancer, reclamer, SCENARIOS, scenarioDe } from "@/domaines/accueil/logique/scenariosDesOrdres";
import type { OrdreAffiche, ProprietesDesOrdres } from "@/domaines/accueil/types";
import "@/socle/ds/banc.css";
import "@/domaines/accueil/banc-du-bandeau.css";

/* LE BANC DES ORDRES DU JOUR.
 *
 * Les refontes du panneau des ordres, a leur place : sous l enseigne et
 * la rue d enseignes, comme sur l accueil. Chacune recoit les memes
 * proprietes, et l ancien panneau aussi — son dessin a ete detache de
 * ses requetes pour pouvoir se montrer ici.
 *
 * LE PUPITRE JOUE LA JOURNEE : un moment choisi (le matin, une prime a
 * prendre, la journee close…), un pas de plus sur chaque ordre, l heure
 * UTC pour voir la cloture approcher, et le repli. Prendre une prime
 * la prend pour de faux, apres le delai d une vraie requete.
 *
 * LA POINTEUSE A ETE RETENUE (23/09) ; ses quatre variantes suivent la
 * premiere, et la planche ne montre plus qu elles et le panneau actuel.
 *
 * Clavier : ← → changent de proposition, P ouvre la planche, H masque le
 * pupitre. L adresse fait de meme : « ?variante=casiers&journee=close
 * &heure=23:40&replie=1&rue=0&enseigne=0&pupitre=0&mouvement=0 ».
 *
 * IL NE LIT NI N ECRIT RIEN. */

function AncienPanneau(p: ProprietesDesOrdres) {
  return (
    <PanneauDesOrdres
      quests={p.ordres}
      isLoading={!!p.chargement}
      onReclamer={p.onReclamer}
      reclamationEnCours={!!p.enReclamation}
      maintenant={p.maintenant ?? 0}
      replie={p.replie}
      onBasculerRepli={p.onBasculerRepli}
    />
  );
}

interface Variante {
  id: string;
  nom: string;
  idee: string;
  Composant: ComponentType<ProprietesDesOrdres>;
  /** Sur la planche : la famille retenue — la pointeuse — et le panneau actuel. */
  planche: boolean;
}

/* La pointeuse a ete retenue le 23/09 ; ses variantes suivent la
   premiere. Les trois autres pistes restent au bout de la liste. */
const VARIANTES: readonly Variante[] = [
  { id: "ancien", nom: "Panneau actuel", idee: "Le panneau en service : sceaux hexagonaux, pistes, un bouton « Réclamer ».", Composant: AncienPanneau, planche: true },
  { id: "pointeuse", nom: "B · La pointeuse — la première", idee: "Des cartes de pointage dans un casier d’acier : un trou percé par geste, un bouton rouge pour pointer, un coup de tampon « Perçu ».", Composant: OrdresPointeuse, planche: true },
  { id: "horodateur", nom: "B1 · L’horodateur", idee: "La machine elle-même, à gauche du casier : un cadran à aiguilles, le secteur rouge du temps qui reste, une fente qui s’allume quand on pointe.", Composant: PointeuseHorodateur, planche: true },
  { id: "casiers", nom: "B2 · Les deux casiers", idee: "« À pointer » et « Pointées » : une carte pointée glisse d’un casier à l’autre. L’état d’un ordre devient une place.", Composant: PointeuseCasiers, planche: true },
  { id: "carte-du-jour", nom: "B3 · La carte du jour", idee: "Une seule carte de pointage réglée en lignes ; l’horodateur frappe l’heure en violet dans la colonne « Pointage ». La plus compacte.", Composant: PointeuseCarteDuJour, planche: true },
  { id: "nuit", nom: "B4 · L’atelier de nuit", idee: "Le casier scellé dans le béton de l’enseigne, sous une lampe grillagée ; une plaque émaillée de rue, des compteurs à tubes nixie.", Composant: PointeuseNuit, planche: true },
  { id: "vitrine", nom: "A · La vitrine", idee: "Chaque ordre est une enseigne dont les lettres s’allument à mesure qu’on avance ; atteint, il allume un « À prendre » qui clignote.", Composant: OrdresVitrine, planche: false },
  { id: "carnet", nom: "C · Le carnet à souches", idee: "Un ticket par ordre, talon et coupon : on détache le coupon pour toucher la prime, le talon garde la trace.", Composant: OrdresCarnet, planche: false },
  { id: "ardoise", nom: "D · L’ardoise", idee: "Les ordres à la craie comme un plat du jour : des bâtons pour compter, la prime entourée quand elle est à prendre, la ligne barrée une fois prise.", Composant: OrdresArdoise, planche: false },
];

const parametre = (cle: string) => new URLSearchParams(window.location.search).get(cle);
const MODULES = { "todo-list": true, journal: true, "track-health": true };
const nullePart = () => {};

/** « 23:40 » → minutes depuis minuit UTC. */
function lireLHeure(texte: string | null): number | null {
  const m = texte?.match(/^(\d{1,2}):(\d{2})$/);
  return m ? Math.min(1439, Number(m[1]) * 60 + Number(m[2])) : null;
}

export default function BancDesOrdres() {
  const [variante, setVariante] = useState(() => parametre("variante") ?? "horodateur");
  const [planche, setPlanche] = useState(() => parametre("planche") === "1");
  const [pupitre, setPupitre] = useState(() => parametre("pupitre") !== "0");
  const [avecEnseigne, setAvecEnseigne] = useState(() => parametre("enseigne") !== "0");
  const [avecRue, setAvecRue] = useState(() => parametre("rue") !== "0");
  const [scenario, setScenario] = useState(() => scenarioDe(parametre("journee")).id);
  const [ordres, setOrdres] = useState<OrdreAffiche[]>(() => scenarioDe(parametre("journee")).ordres);
  const [replie, setReplie] = useState(() => parametre("replie") === "1");
  const [heure, setHeure] = useState<number | null>(() => lireLHeure(parametre("heure")));
  const [enReclamation, setEnReclamation] = useState<string | null>(null);
  const [dernier, setDernier] = useState("—");
  const [horloge, setHorloge] = useState(() => Date.now());
  const minuterie = useRef<number>();
  const active = VARIANTES.find((v) => v.id === variante) ?? VARIANTES[1];
  const chargement = !!scenarioDe(scenario).chargement;

  useSansMouvementAuBanc(parametre("mouvement") === "0");

  useEffect(() => {
    const t = window.setInterval(() => setHorloge(Date.now()), 30_000);
    return () => window.clearInterval(t);
  }, []);
  useEffect(() => () => window.clearTimeout(minuterie.current), []);

  useEffect(() => {
    const auClavier = (e: KeyboardEvent) => {
      const cible = e.target as HTMLElement | null;
      if (cible instanceof HTMLInputElement && cible.type !== "checkbox") return;
      if (cible && ["SELECT", "TEXTAREA"].includes(cible.tagName)) return;
      const pas = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (pas) {
        setVariante((id) => {
          const i = VARIANTES.findIndex((v) => v.id === id);
          return VARIANTES[(i + pas + VARIANTES.length) % VARIANTES.length].id;
        });
      } else if (e.key === "h" || e.key === "H") setPupitre((v) => !v);
      else if (e.key === "p" || e.key === "P") setPlanche((v) => !v);
    };
    window.addEventListener("keydown", auClavier);
    return () => window.removeEventListener("keydown", auClavier);
  }, []);

  /* L heure imposee est prise sur le jour UTC courant. */
  const d = new Date(horloge);
  const maintenant = heure === null
    ? horloge
    : Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), Math.floor(heure / 60), heure % 60);

  const choisirLaJournee = (id: string) => {
    setScenario(id);
    setOrdres(scenarioDe(id).ordres);
    setEnReclamation(null);
  };

  const proprietes: ProprietesDesOrdres = {
    ordres,
    chargement,
    enReclamation,
    replie,
    maintenant,
    onBasculerRepli: () => setReplie((v) => !v),
    onReclamer: (id) => {
      if (enReclamation) return;
      setEnReclamation(id);
      /* Le temps d une vraie requete : c est lui qui montre l etat
         d attente de chaque refonte. */
      minuterie.current = window.setTimeout(() => {
        setOrdres((os) => os.map((o) => (o.id === id ? reclamer(o, Date.now()) : o)));
        setEnReclamation(null);
        const o = ordres.find((x) => x.id === id);
        if (o) setDernier(`+${o.reward_bonds} bonds — ${o.title}`);
      }, 700);
    },
  };

  const enseigne = avecEnseigne && <EnseigneDEssai />;
  const rue = avecRue && <AccesRue ownedModules={MODULES} onNaviguer={nullePart} />;

  return (
    <div className="banc" data-pupitre={pupitre ? undefined : "masque"}>
      <aside className="banc-pupitre">
        <h1>Banc des ordres du jour</h1>
        <p className="banc-note">
          Rien n est lu en base. ← → changent de proposition, P ouvre la planche,
          H masque ce pupitre.
        </p>

        <label className="banc-champ">
          <span>Proposition</span>
          <select value={variante} onChange={(e) => setVariante(e.target.value)}>
            {VARIANTES.map((v) => <option key={v.id} value={v.id}>{v.nom}</option>)}
          </select>
        </label>
        <p className="banc-note bdb-idee">{active.idee}</p>

        <label className="banc-champ">
          <span>Journée</span>
          <select value={scenario} onChange={(e) => choisirLaJournee(e.target.value)}>
            {SCENARIOS.map((s) => <option key={s.id} value={s.id}>{s.nom}</option>)}
          </select>
        </label>
        {ordres.length > 0 && (
          <div className="bdo-pas">
            {ordres.map((o) => (
              <button key={o.id} type="button" onClick={() => setOrdres((os) => os.map((x) => (x.id === o.id ? avancer(x) : x)))}
                disabled={o.status === "claimed" || o.progress >= o.target}>
                {o.title} : {o.progress}/{o.target} {o.kind === "focus_minutes" ? "+5" : "+1"}
              </button>
            ))}
          </div>
        )}

        <label className="banc-champ">
          <span>Heure UTC {heure === null ? "(réelle)" : `${String(Math.floor(heure / 60)).padStart(2, "0")}:${String(heure % 60).padStart(2, "0")}`}</span>
          <input type="range" min={0} max={1439} step={10} value={heure ?? new Date(horloge).getUTCHours() * 60}
            onChange={(e) => setHeure(Number(e.target.value))} />
        </label>
        <label className="banc-bascule">
          <input type="checkbox" checked={heure === null} onChange={(e) => setHeure(e.target.checked ? null : 18 * 60 + 48)} />
          <span>Heure réelle</span>
        </label>

        <label className="banc-bascule">
          <input type="checkbox" checked={replie} onChange={(e) => setReplie(e.target.checked)} />
          <span>Replié</span>
        </label>
        <label className="banc-bascule">
          <input type="checkbox" checked={planche} onChange={(e) => setPlanche(e.target.checked)} />
          <span>Planche : toutes les propositions</span>
        </label>
        <label className="banc-bascule">
          <input type="checkbox" checked={avecEnseigne} onChange={(e) => setAvecEnseigne(e.target.checked)} />
          <span>L’enseigne au-dessus</span>
        </label>
        <label className="banc-bascule">
          <input type="checkbox" checked={avecRue} onChange={(e) => setAvecRue(e.target.checked)} />
          <span>La rue d’enseignes au-dessus</span>
        </label>

        <dl className="banc-etat">
          <dt>Dernière prime</dt>
          <dd>{dernier}</dd>
        </dl>
      </aside>

      <div className="banc-scene bdb-scene">
        {planche ? (
          <>
            {(enseigne || rue) && <div className="bdb-colonne bda-pile bdb-epreuve">{enseigne}{rue}</div>}
            {VARIANTES.filter((v) => v.planche).map(({ id, nom, idee, Composant }) => (
              <section key={id} className="bdb-epreuve" aria-label={nom}>
                <p className="bdb-legende"><b>{nom}</b> {idee}</p>
                <div className="bdb-colonne"><Composant {...proprietes} /></div>
              </section>
            ))}
          </>
        ) : (
          <div className="bdb-colonne bda-pile" key={active.id}>
            {enseigne}
            <div className="bdo-agir">
              {rue}
              <active.Composant {...proprietes} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
