import { useEffect, useState, type ComponentType } from "react";
import { NexusHeroBanner } from "@/domaines/accueil/composants/NexusHeroBanner";
import { JaugeDuNom } from "@/domaines/accueil/composants/bandeau/JaugeDuNom";
import { Eclipse } from "@/domaines/accueil/composants/bandeau/Eclipse";
import { Enseigne } from "@/domaines/accueil/composants/bandeau/Enseigne";
import { PieceDuPacte } from "@/domaines/accueil/composants/bandeau/PieceDuPacte";
import { Stele } from "@/domaines/accueil/composants/bandeau/Stele";
import { PlanLarge } from "@/domaines/accueil/composants/bandeau/PlanLarge";
import { PlancheDesInterrupteurs } from "@/domaines/accueil/composants/bandeau/PlancheDesInterrupteurs";
import { INTERRUPTEURS, lireLInterrupteur } from "@/domaines/accueil/logique/interrupteurs";
import { useSansMouvementAuBanc } from "@/domaines/accueil/hooks/useSansMouvementAuBanc";
import { IdentiteDuPacte, POLICES_DU_TITRE, EFFETS_DU_TITRE } from "@/domaines/objectifs";
import { TEINTES_DU_PACTE } from "@/socle/ds/fonds/catalogue";
import { jourDecale } from "@/socle/outils/jour";
import type { MesureProgression, ProprietesDuBandeau } from "@/domaines/accueil/types";
import {
  ECUSSON_D_ESSAI, EMBLEMES, SYMBOLES, TEINTES_DE_PALIER, VERSIONS,
} from "@/domaines/accueil/logique/choixDuBancDuBandeau";
import "@/socle/ds/banc.css";
import "@/domaines/accueil/banc-du-bandeau.css";

/* LE BANC D ESSAI DU BANDEAU.
 *
 * Le tableau de bord est derriere la session, la double
 * authentification et un pacte deja jure. Pour regarder son bandeau il
 * fallait donc se connecter, ce qui suffit a ne pas le regarder — et
 * ce qu on ne regarde pas, on ne le corrige pas. C est le meme
 * raisonnement que pour le banc du rite, et il vaut deux fois ici :
 * la police, l effet, le symbole et le sceau se combinent, et c est la
 * COMBINAISON qu il faut voir. Quatre polices, six effets, neuf
 * symboles : deux cent seize bandeaux qu aucune capture isolee ne
 * couvre.
 *
 * LES VARIANTES PASSENT SOUS LES MEMES REGLAGES. Chacune recoit les
 * proprietes exactes du bandeau actuel ; chaque reglage du pupitre
 * s applique donc a toutes. Une variante qui ne tient qu avec
 * « Ananta » en Orbitron n est pas une variante, c est une maquette :
 * c est ici qu on le voit, avec un nom de cinquante signes en
 * JetBrains Mono.
 *
 * Clavier : ← → changent de variante, P ouvre la planche — toutes les
 * variantes l une sous l autre, comme une planche-contact —, H masque le
 * pupitre. L adresse fait de meme : « ?variante=piece&planche=1&pupitre=0&clair=1 »,
 * et fixe au besoin « nom », « police », « effet », « teinte » et « progression ».
 *
 * IL NE LIT NI N ECRIT RIEN. Aucune requete, aucun pacte : les valeurs
 * viennent des menus. C est un decor, pas une session.
 */

interface Variante {
  id: string;
  nom: string;
  idee: string;
  Composant: ComponentType<ProprietesDuBandeau>;
}

const VARIANTES: readonly Variante[] = [
  {
    id: "actuel", nom: "Ancien bandeau",
    idee: "Le bandeau d’avant l’enseigne : la singularité, le nom, la raison, quatre compteurs. Gardé pour comparer.",
    Composant: NexusHeroBanner,
  },
  {
    id: "jauge", nom: "A · Le nom-jauge",
    idee: "Le nom est la jauge : ses lettres se remplissent de lumière à mesure que le pacte avance.",
    Composant: JaugeDuNom,
  },
  {
    id: "eclipse", nom: "B · L’éclipse",
    idee: "Le sceau est la lune ; la progression, la magnitude de l’éclipse. À 100 %, la totalité.",
    Composant: Eclipse,
  },
  {
    id: "enseigne", nom: "C · L’enseigne — en service",
    idee: "Le nom en tubes de néon sur un mur de béton ; un tube faiblit quand aucun chantier n’est ouvert.",
    Composant: Enseigne,
  },
  {
    id: "interrupteurs", nom: "C · Les interrupteurs de l’enseigne",
    idee: "Les sept commandes de mesure côte à côte, chacune manœuvrable. Celle de l’enseigne se choisit dans ce pupitre.",
    Composant: PlancheDesInterrupteurs,
  },
  {
    id: "piece", nom: "D · La pièce",
    idee: "La carte d’identité du pacte : guillochis, film holographique, zone lisible par machine vérifiable.",
    Composant: PieceDuPacte,
  },
  {
    id: "stele", nom: "E · La stèle",
    idee: "Le pacte gravé : capitales romaines, chiffres romains, un sillon que l’émail remplit.",
    Composant: Stele,
  },
  {
    id: "plan", nom: "F · Le plan large",
    idee: "Le plan d’ouverture d’un film : le soleil se lève avec la progression, les chiffres sont le générique.",
    Composant: PlanLarge,
  },
];

/* L ADRESSE OUVRE LE BANC OU L ON VEUT : « ?variante=stele&pupitre=0 ».
   Une variante se montre par un lien, et une capture se refait a
   l identique. */
const parametre = (cle: string) => new URLSearchParams(window.location.search).get(cle);

export default function BancDuBandeau() {
  const [variante, setVariante] = useState(() => parametre("variante") ?? "enseigne");
  const [planche, setPlanche] = useState(() => parametre("planche") === "1");
  const [pupitre, setPupitre] = useState(() => parametre("pupitre") !== "0");
  const [jour, setJour] = useState(() => parametre("clair") === "1");
  const [nom, setNom] = useState(() => parametre("nom") ?? "Ananta");
  const [mantra, setMantra] = useState("Tenir ce qui est juré");
  const [symbole, setSymbole] = useState("flame");
  const [police, setPolice] = useState(() => parametre("police") ?? "orbitron");
  const [effet, setEffet] = useState(() => parametre("effet") ?? "none");
  const [teinte, setTeinte] = useState(() => parametre("teinte") ?? "violet");
  const [progression, setProgression] = useState(() => Number(parametre("progression") ?? 62));
  const [mesure, setMesure] = useState<MesureProgression>("goals");
  const [enCours, setEnCours] = useState(2);
  const [niveau, setNiveau] = useState(12);
  const [missions, setMissions] = useState(47);
  const [jours, setJours] = useState(91);
  const [terme, setTerme] = useState("2027-06-30");
  const [valeurs, setValeurs] = useState("Liberté, Discipline, Création");
  /* « ?embleme=aucun » ou « ?embleme=marque » : les trois cas du palier. */
  const [embleme, setEmbleme] = useState(() => {
    const voulu = parametre("embleme");
    return voulu === "aucun" ? "" : voulu === "marque" ? EMBLEMES[1].valeur : ECUSSON_D_ESSAI;
  });
  const [teintePalier, setTeintePalier] = useState("#f5b93a");
  const [avancePalier, setAvancePalier] = useState(64);
  const [interrupteur, setInterrupteur] = useState(() => lireLInterrupteur(parametre("interrupteur")));
  const [version, setVersion] = useState(4);
  /* L apercu de « Mon pacte » monte LE MEME bloc, reduit. Il se
     regarde ici pour la meme raison que le bandeau : la page de
     reglages est derriere la session. */
  const [reduit, setReduit] = useState(false);

  /* Une virgule seule ne fait pas une valeur. */
  const listeDesValeurs = valeurs.split(",").map((v) => v.trim()).filter(Boolean);
  const active = VARIANTES.find((v) => v.id === variante) ?? VARIANTES[0];

  /* « ?mouvement=0 » coupe le mouvement comme le reglage du profil :
     chaque variante s affiche d emblee dans son etat final. */
  useSansMouvementAuBanc(parametre("mouvement") === "0");

  /* La bascule agit sur la racine, comme le vrai selecteur de theme. */
  useEffect(() => {
    const racine = document.documentElement;
    const avant = { clair: racine.classList.contains("light"), sombre: racine.classList.contains("dark") };
    racine.classList.toggle("light", jour);
    racine.classList.toggle("dark", !jour);
    return () => {
      racine.classList.toggle("light", avant.clair);
      racine.classList.toggle("dark", avant.sombre);
    };
  }, [jour]);

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

  /* LES DEUX MESURES NE DONNENT PAS LE MEME CHIFFRE. Par etapes, on
     avance a chaque pas franchi : le chiffre est plus haut. Le banc en
     derive un plausible, pour que basculer se VOIE sur chaque variante. */
  const affichee = mesure === "steps" ? Math.min(100, Math.round(progression * 1.12 + 4)) : progression;

  const proprietes: ProprietesDuBandeau = {
    progression: affichee,
    mesure,
    onChangerMesure: () => setMesure((m) => (m === "goals" ? "steps" : "goals")),
    level: niveau,
    totalMissions: missions,
    activeDays: jours,
    pactName: nom,
    pactMantra: mantra,
    pactSymbol: symbole,
    valeurs: listeDesValeurs,
    sigilVersion: version,
    titleFont: police,
    titleEffect: effet,
    enCours,
    rankName: "Architecte",
    rankLogoUrl: embleme || null,
    rankTeinte: teintePalier || null,
    rankProgress: avancePalier,
    rankXP: Math.round(5000 * avancePalier / 100),
    rankXPTarget: 5000,
    nextRankName: "Bâtisseur",
    teinte,
    jureLe: jourDecale(-jours),
    terme: terme || null,
    interrupteur,
  };

  return (
    <div className="banc" data-pupitre={pupitre ? undefined : "masque"}>
      <aside className="banc-pupitre">
        <h1>Banc du bandeau</h1>
        <p className="banc-note">
          Rien n est lu en base. Chaque réglage s applique à toutes les
          variantes. ← → changent de variante, P ouvre la planche, H masque ce pupitre.
        </p>

        <label className="banc-champ">
          <span>Variante</span>
          <select value={variante} onChange={(e) => setVariante(e.target.value)}>
            {VARIANTES.map((v) => <option key={v.id} value={v.id}>{v.nom}</option>)}
          </select>
        </label>
        <p className="banc-note bdb-idee">{active.idee}</p>

        <label className="banc-champ">
          <span>Interrupteur de l’enseigne</span>
          <select value={interrupteur} onChange={(e) => setInterrupteur(lireLInterrupteur(e.target.value))}>
            {INTERRUPTEURS.map((i) => <option key={i.id} value={i.id}>{i.nom}</option>)}
          </select>
        </label>

        <label className="banc-bascule">
          <input type="checkbox" checked={planche} onChange={(e) => setPlanche(e.target.checked)} />
          <span>Planche : toutes les variantes</span>
        </label>
        <label className="banc-bascule">
          <input type="checkbox" checked={jour} onChange={(e) => setJour(e.target.checked)} />
          <span>Thème clair</span>
        </label>

        <label className="banc-champ">
          <span>Nom du pacte</span>
          <input className="banc-saisie" value={nom} onChange={(e) => setNom(e.target.value)} maxLength={50} />
        </label>

        <label className="banc-champ">
          <span>Sa raison</span>
          <input className="banc-saisie" value={mantra} onChange={(e) => setMantra(e.target.value)} maxLength={200} />
        </label>

        <label className="banc-champ">
          <span>Police du titre</span>
          <select value={police} onChange={(e) => setPolice(e.target.value)}>
            {POLICES_DU_TITRE.map((p) => <option key={p.cle} value={p.cle}>{p.nom}</option>)}
          </select>
        </label>

        <label className="banc-champ">
          <span>Effet du titre</span>
          <select value={effet} onChange={(e) => setEffet(e.target.value)}>
            {EFFETS_DU_TITRE.map((e) => <option key={e.cle} value={e.cle}>{e.nom}</option>)}
          </select>
        </label>

        <label className="banc-champ">
          <span>Teinte du pacte</span>
          <select value={teinte} onChange={(e) => setTeinte(e.target.value)}>
            {Object.keys(TEINTES_DU_PACTE).map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>

        <label className="banc-champ">
          <span>Symbole</span>
          <select value={symbole} onChange={(e) => setSymbole(e.target.value)}>
            {SYMBOLES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>

        <label className="banc-champ">
          <span>Valeurs jurees (separees par des virgules)</span>
          <input className="banc-saisie" value={valeurs}
            onChange={(e) => setValeurs(e.target.value)} />
        </label>

        <label className="banc-champ">
          <span>Alphabet du sceau</span>
          <select value={version} onChange={(e) => setVersion(Number(e.target.value))}>
            {VERSIONS.map((v) => <option key={v.valeur} value={v.valeur}>{v.nom}</option>)}
          </select>
        </label>

        <label className="banc-champ">
          <span>Progression : {progression} % {mesure === "steps" ? `(étapes : ${affichee} %)` : ""}</span>
          <input type="range" min={0} max={100} value={progression}
            onChange={(e) => setProgression(Number(e.target.value))} />
        </label>

        <label className="banc-champ">
          <span>Chantiers ouverts : {enCours}</span>
          <input type="range" min={0} max={8} value={enCours}
            onChange={(e) => setEnCours(Number(e.target.value))} />
        </label>

        <label className="banc-champ">
          <span>Emblème du palier</span>
          <select value={embleme} onChange={(e) => setEmbleme(e.target.value)}>
            {EMBLEMES.map((e) => <option key={e.nom} value={e.valeur}>{e.nom}</option>)}
          </select>
        </label>

        <label className="banc-champ">
          <span>Teinte du palier</span>
          <select value={teintePalier} onChange={(e) => setTeintePalier(e.target.value)}>
            {TEINTES_DE_PALIER.map((t) => <option key={t.nom} value={t.valeur}>{t.nom}</option>)}
          </select>
        </label>

        <label className="banc-champ">
          <span>Avancement dans le palier : {avancePalier} %</span>
          <input type="range" min={0} max={100} value={avancePalier}
            onChange={(e) => setAvancePalier(Number(e.target.value))} />
        </label>

        <label className="banc-champ">
          <span>Niveau : {niveau}</span>
          <input type="range" min={1} max={60} value={niveau}
            onChange={(e) => setNiveau(Number(e.target.value))} />
        </label>

        <label className="banc-champ">
          <span>Missions : {missions}</span>
          <input type="range" min={0} max={400} value={missions}
            onChange={(e) => setMissions(Number(e.target.value))} />
        </label>

        <label className="banc-champ">
          <span>Jours depuis le serment : {jours}</span>
          <input type="range" min={1} max={1500} value={jours}
            onChange={(e) => setJours(Number(e.target.value))} />
        </label>

        <label className="banc-champ">
          <span>Échéance (vide : aucune)</span>
          <input className="banc-saisie" type="date" value={terme} onChange={(e) => setTerme(e.target.value)} />
        </label>

        <label className="banc-bascule">
          <input type="checkbox" checked={reduit} onChange={(e) => setReduit(e.target.checked)} />
          <span>Vue « Mon pacte » (bloc reduit)</span>
        </label>
      </aside>

      <div className="banc-scene bdb-scene">
        {reduit ? (
          <div style={{ maxWidth: 520, margin: "24px auto", padding: 16 }}>
            <IdentiteDuPacte
              compact
              commeTitre={false}
              nom={nom}
              mantra={mantra}
              symbole={symbole}
              valeurs={listeDesValeurs}
              version={version}
              police={police}
              effet={effet}
              progression={progression}
              enCours={enCours}
            />
          </div>
        ) : planche ? (
          VARIANTES.map(({ id, nom: titre, idee, Composant }) => (
            <section key={id} className="bdb-epreuve" aria-label={titre}>
              <p className="bdb-legende"><b>{titre}</b> {idee}</p>
              <div className="bdb-colonne"><Composant {...proprietes} /></div>
            </section>
          ))
        ) : (
          <div className="bdb-colonne" key={active.id}>
            <active.Composant {...proprietes} />
          </div>
        )}
      </div>
    </div>
  );
}
