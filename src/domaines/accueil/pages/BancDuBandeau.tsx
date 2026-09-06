import { useState } from "react";
import { NexusHeroBanner } from "@/domaines/accueil/composants/NexusHeroBanner";
import { IdentiteDuPacte, POLICES_DU_TITRE, EFFETS_DU_TITRE } from "@/domaines/objectifs";
import "@/socle/ds/banc.css";

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
 * IL NE LIT NI N ECRIT RIEN. Aucune requete, aucun pacte : les valeurs
 * viennent des menus. C est un decor, pas une session.
 */

/* LA VERSION DE L ALPHABET EST UN REGLAGE DU BANC, pas un detail.
   « pacts.sigil_version » a ete ajoutee avec « default 1 » : tous les
   pactes anterieurs sont donc en v1, et rien dans l application ne les
   fait passer en v2. Un pacte jure avant ce jour dessine encore
   l ancien alphabet — et son porteur ne verra jamais le nouveau, meme
   sur la derniere version du code. C est voulu (un sceau qui bouge
   n est pas un sceau) mais il faut pouvoir le CONSTATER. */
const VERSIONS = [
  { valeur: 3, nom: "v3 — ideogrammes sur les valeurs" },
  { valeur: 2, nom: "v2 — le reseau partout" },
  { valeur: 1, nom: "v1 — l ancien alphabet" },
];
const SYMBOLES = [
  "flame", "heart", "target", "sparkles", "phoenix",
  "compass", "citadel", "vortex", "shield",
];

export default function BancDuBandeau() {
  const [nom, setNom] = useState("Ananta");
  const [mantra, setMantra] = useState("Tenir ce qui est jure");
  const [symbole, setSymbole] = useState("flame");
  const [police, setPolice] = useState("orbitron");
  const [effet, setEffet] = useState("none");
  const [progression, setProgression] = useState(62);
  const [enCours, setEnCours] = useState(2);
  const [valeurs, setValeurs] = useState("Liberté, Discipline, Création");
  const [version, setVersion] = useState(3);
  /* L apercu de « Mon pacte » monte LE MEME bloc, reduit. Il se
     regarde ici pour la meme raison que le bandeau : la page de
     reglages est derriere la session. */
  const [reduit, setReduit] = useState(false);

  /* Une virgule seule ne fait pas une valeur. */
  const listeDesValeurs = valeurs.split(",").map((v) => v.trim()).filter(Boolean);

  return (
    <div className="banc">
      <aside className="banc-pupitre">
        <h1>Banc du bandeau</h1>
        <p className="banc-note">
          Rien n est lu en base. Le bandeau est le meme qu en production ;
          seules les valeurs viennent d ici.
        </p>

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
          <span>Progression : {progression} %</span>
          <input type="range" min={0} max={100} value={progression}
            onChange={(e) => setProgression(Number(e.target.value))} />
        </label>

        <label className="banc-champ">
          <span>Chantiers ouverts : {enCours}</span>
          <input type="range" min={0} max={8} value={enCours}
            onChange={(e) => setEnCours(Number(e.target.value))} />
        </label>

        <label className="banc-bascule">
          <input type="checkbox" checked={reduit} onChange={(e) => setReduit(e.target.checked)} />
          <span>Vue « Mon pacte » (bloc reduit)</span>
        </label>

      </aside>

      <div className="banc-scene">
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
        ) : (
        <NexusHeroBanner
          progression={progression}
          level={12}
          totalMissions={47}
          activeDays={91}
          pactName={nom}
          pactMantra={mantra}
          pactSymbol={symbole}
          valeurs={listeDesValeurs}
          sigilVersion={version}
          titleFont={police}
          titleEffect={effet}
          enCours={enCours}
          rankName="Architecte"
          rankProgress={64}
          rankXP={3200}
          rankXPTarget={5000}
          nextRankName="Bâtisseur"
        />
        )}
      </div>
    </div>
  );
}
