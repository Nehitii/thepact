import { useEffect, useState, type ComponentType } from "react";
import { QuickAccessPanel } from "@/domaines/accueil/composants/QuickAccessPanel";
import { Enseigne } from "@/domaines/accueil/composants/bandeau/Enseigne";
import { AccesRue } from "@/domaines/accueil/composants/acces/AccesRue";
import { AccesPupitre } from "@/domaines/accueil/composants/acces/AccesPupitre";
import { AccesClavier } from "@/domaines/accueil/composants/acces/AccesClavier";
import { AccesPanneaux } from "@/domaines/accueil/composants/acces/AccesPanneaux";
import { ECUSSON_D_ESSAI } from "@/domaines/accueil/logique/choixDuBancDuBandeau";
import { useSansMouvementAuBanc } from "@/domaines/accueil/hooks/useSansMouvementAuBanc";
import { jourDecale } from "@/socle/outils/jour";
import type { MesureProgression, ProprietesAccesRapide } from "@/domaines/accueil/types";
import "@/socle/ds/banc.css";
import "@/domaines/accueil/banc-du-bandeau.css";

/* LE BANC DE L ACCES RAPIDE.
 *
 * Quatre refontes de la barre d acces rapide, sous l enseigne du pacte
 * — c est la qu elles vivront, et c est avec elle qu elles doivent se
 * lire. Chacune recoit les proprietes exactes de la barre actuelle.
 *
 * LE PUPITRE FAIT VARIER CE QUI CHANGE LA BARRE : les modules achetes
 * (un module manquant verrouille son acces), le tirage (ouvert, ou pris
 * par une mission en cours). Les appuis ne quittent pas le banc : la
 * navigation est interceptee, et le pupitre dit ou l on serait alle.
 * La barre actuelle, elle, navigue pour de vrai — elle n a pas ce
 * crochet.
 *
 * Clavier : ← → changent de proposition, P ouvre la planche, H masque
 * le pupitre. L adresse fait de meme : « ?variante=rue&pupitre=0 »,
 * « &sante=0 » (module non achete), « &tirage=pris » ou « ouvert ».
 *
 * IL NE LIT NI N ECRIT RIEN. */

interface Variante {
  id: string;
  nom: string;
  idee: string;
  Composant: ComponentType<ProprietesAccesRapide>;
}

const VARIANTES: readonly Variante[] = [
  { id: "actuel", nom: "Actuel", idee: "La barre en service : sept cases HUD, des touches F1–F7 qui ne répondent pas, deux cases pour la même page.", Composant: QuickAccessPanel },
  { id: "rue", nom: "A · La rue", idee: "Six petites enseignes au néon sur le même béton que l’enseigne du pacte ; éteintes quand le module n’est pas acheté.", Composant: AccesRue },
  { id: "pupitre", nom: "B · Le pupitre", idee: "Des boutons-poussoirs lumineux sur une platine d’acier : un bouton à clé pour ce qui est à débloquer, un capot sur le tirage déjà pris.", Composant: AccesPupitre },
  { id: "clavier", nom: "C · Le clavier", idee: "Un pavé de touches à écran : chaque touche affiche son pictogramme, s’enfonce, et s’inverse quand l’outil est ouvert.", Composant: AccesClavier },
  { id: "panneaux", nom: "D · Les panneaux", idee: "La signalétique d’une station la nuit : pastille de couleur, nom, ce que fait l’accès, une flèche.", Composant: AccesPanneaux },
];

const parametre = (cle: string) => new URLSearchParams(window.location.search).get(cle);

export default function BancDeLAcces() {
  const [variante, setVariante] = useState(() => parametre("variante") ?? "rue");
  const [planche, setPlanche] = useState(() => parametre("planche") === "1");
  const [pupitre, setPupitre] = useState(() => parametre("pupitre") !== "0");
  const [avecEnseigne, setAvecEnseigne] = useState(() => parametre("enseigne") !== "0");
  const [taches, setTaches] = useState(() => parametre("taches") !== "0");
  const [journal, setJournal] = useState(() => parametre("journal") !== "0");
  const [sante, setSante] = useState(() => parametre("sante") !== "0");
  const [tirageOuvert, setTirageOuvert] = useState(() => parametre("tirage") === "ouvert");
  const [tirageDisponible, setTirageDisponible] = useState(() => parametre("tirage") !== "pris");
  const [mesure, setMesure] = useState<MesureProgression>("goals");
  const [dernier, setDernier] = useState("—");
  const active = VARIANTES.find((v) => v.id === variante) ?? VARIANTES[1];

  /* « ?mouvement=0 » : chaque proposition s affiche d emblee dans son
     etat final, comme au banc du bandeau. */
  useSansMouvementAuBanc(parametre("mouvement") === "0");

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

  const proprietes: ProprietesAccesRapide = {
    ownedModules: { "todo-list": taches, journal, "track-health": sante },
    missionRandomizerOuvert: tirageOuvert,
    missionRandomizerDisponible: tirageDisponible,
    onMissionRandomizer: () => {
      setTirageOuvert((v) => !v);
      setDernier(tirageOuvert ? "Tirage de mission fermé" : "Tirage de mission ouvert");
    },
    onWeeklyReview: () => setDernier("Revue de la semaine ouverte"),
    onNaviguer: (route) => setDernier(`Vers ${route}`),
  };

  const enseigne = avecEnseigne && (
    <Enseigne
      progression={mesure === "steps" ? 73 : 62}
      mesure={mesure}
      onChangerMesure={() => setMesure((m) => (m === "goals" ? "steps" : "goals"))}
      level={12}
      totalMissions={47}
      activeDays={91}
      pactName="Ananta"
      pactMantra="Tenir ce qui est juré"
      pactSymbol="flame"
      valeurs={["Liberté", "Discipline", "Création"]}
      sigilVersion={4}
      titleFont="orbitron"
      titleEffect="none"
      enCours={2}
      rankName="Architecte"
      rankLogoUrl={ECUSSON_D_ESSAI}
      rankTeinte="#f5b93a"
      rankProgress={64}
      rankXP={3200}
      rankXPTarget={5000}
      nextRankName="Bâtisseur"
      teinte="violet"
      jureLe={jourDecale(-91)}
      terme="2027-06-30"
    />
  );

  return (
    <div className="banc" data-pupitre={pupitre ? undefined : "masque"}>
      <aside className="banc-pupitre">
        <h1>Banc de l’accès rapide</h1>
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

        <label className="banc-bascule">
          <input type="checkbox" checked={planche} onChange={(e) => setPlanche(e.target.checked)} />
          <span>Planche : toutes les propositions</span>
        </label>
        <label className="banc-bascule">
          <input type="checkbox" checked={avecEnseigne} onChange={(e) => setAvecEnseigne(e.target.checked)} />
          <span>L’enseigne au-dessus</span>
        </label>

        <p className="banc-note">Modules achetés</p>
        <label className="banc-bascule">
          <input type="checkbox" checked={taches} onChange={(e) => setTaches(e.target.checked)} />
          <span>Tâches</span>
        </label>
        <label className="banc-bascule">
          <input type="checkbox" checked={journal} onChange={(e) => setJournal(e.target.checked)} />
          <span>Journal</span>
        </label>
        <label className="banc-bascule">
          <input type="checkbox" checked={sante} onChange={(e) => setSante(e.target.checked)} />
          <span>Santé</span>
        </label>

        <p className="banc-note">Tirage de mission</p>
        <label className="banc-bascule">
          <input type="checkbox" checked={tirageOuvert} onChange={(e) => setTirageOuvert(e.target.checked)} />
          <span>Ouvert sur la page</span>
        </label>
        <label className="banc-bascule">
          <input type="checkbox" checked={!tirageDisponible} onChange={(e) => setTirageDisponible(!e.target.checked)} />
          <span>Une mission est en cours</span>
        </label>

        <dl className="banc-etat">
          <dt>Dernier appui</dt>
          <dd>{dernier}</dd>
        </dl>
      </aside>

      <div className="banc-scene bdb-scene">
        {planche ? (
          <>
            {enseigne && <div className="bdb-colonne">{enseigne}</div>}
            {VARIANTES.map(({ id, nom, idee, Composant }) => (
              <section key={id} className="bdb-epreuve" aria-label={nom}>
                <p className="bdb-legende"><b>{nom}</b> {idee}</p>
                <div className="bdb-colonne"><Composant {...proprietes} /></div>
              </section>
            ))}
          </>
        ) : (
          <div className="bdb-colonne bda-pile" key={active.id}>
            {enseigne}
            <active.Composant {...proprietes} />
          </div>
        )}
      </div>
    </div>
  );
}
