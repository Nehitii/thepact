import { useCallback, useState } from "react";
import { LeRite, type ReglagesDuRite } from "@/domaines/onboarding/composants/LeRite";
import type { FormeDuGeste } from "@/domaines/onboarding/hooks/useGesteDeSignature";
import { VERSION_ALPHABET, sigilDuPacte } from "@/domaines/objectifs";
import {
  ETAT_VIDE, RITE_COMPLET, type Ecran, type EtatDuRite,
} from "@/domaines/onboarding/logique/rite";
import "@/domaines/onboarding/onboarding.css";
import "@/socle/ds/banc.css";

/* Un pacte deja declare, pour arriver directement au scellement sans
   retaper cinq fenetres. C est tout l objet du banc. */
const ETAT_REMPLI: EtatDuRite = {
  nomDuPorteur: "Nehiti",
  nomDuPacte: "Ananta",
  mantra: "Tenir ce qui est jure",
  symbole: "flame",
  couleur: "violet",
  valeurs: ["Liberté", "Discipline", "Création"],
  clausesAcceptees: false,
  signe: false,
  objectif: null,
};

/**
 * LE BANC D ESSAI DU RITE.
 *
 * Retravailler l onboarding demandait de creer un compte a chaque
 * passage : le rite ne se joue qu une fois, et il ecrit un pacte —
 * qu on ne peut avoir qu en un seul exemplaire. Autant dire qu on ne
 * le regardait pas. Ce qu on ne regarde pas, on ne le corrige pas.
 *
 * Le banc monte LE MEME RITE, avec deux differences et pas une de
 * plus :
 *
 *   IL N ECRIT RIEN. « onSceller » rend « true » sans toucher a la
 *   base, et affiche ce qui AURAIT ete ecrit — les cinq lignes, telles
 *   que « useSceller » les composerait.
 *
 *   IL SE PLACE OU L ON VEUT. N importe quel ecran, avec un pacte
 *   deja declare, le geste force, le mode sobre, le rite abrege.
 *
 * IL EST PUBLIC, et c est le point : pas de compte, pas de session,
 * pas de pacte a supprimer entre deux essais.
 */
export default function BancDuRite() {
  const [cle, setCle] = useState(0);
  const [abrege, setAbrege] = useState(false);
  const [depart, setDepart] = useState<Ecran>("eveil");
  const [prerempli, setPrerempli] = useState(false);
  const [sobre, setSobre] = useState<boolean | undefined>(undefined);
  const [forme, setForme] = useState<FormeDuGeste | undefined>(undefined);

  const [ecran, setEcran] = useState<Ecran>("eveil");
  const [etat, setEtat] = useState<EtatDuRite>(ETAT_VIDE);
  const [scelle, setScelle] = useState<EtatDuRite | null>(null);

  /* Rejouer = remonter le rite. La cle suffit : React jette l ancien
     et tout repart de l etat initial demande. */
  const rejouer = useCallback(() => {
    setScelle(null);
    setEtat(prerempli ? ETAT_REMPLI : ETAT_VIDE);
    setEcran(depart);
    setCle((k) => k + 1);
  }, [depart, prerempli]);

  const onSceller = useCallback(async (e: EtatDuRite) => {
    setScelle(e);
    return true;
  }, []);

  const reglages: ReglagesDuRite = { sobre, forme };
  const sigil = sigilDuPacte(etat.nomDuPacte, etat.valeurs);

  return (
    <div className="banc">
      <aside className="banc-pupitre">
        <h1>Banc du rite</h1>
        <p className="banc-note">
          Rien n est ecrit en base. Le rite est le meme qu en production ;
          seul le scellement est feint.
        </p>

        <label className="banc-champ">
          <span>Partir de</span>
          <select value={depart} onChange={(e) => setDepart(e.target.value as Ecran)}>
            {RITE_COMPLET.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
        </label>

        <label className="banc-bascule">
          <input type="checkbox" checked={prerempli} onChange={(e) => setPrerempli(e.target.checked)} />
          <span>Pacte deja declare</span>
        </label>

        <label className="banc-bascule">
          <input type="checkbox" checked={abrege} onChange={(e) => setAbrege(e.target.checked)} />
          <span>Rite abrege (second passage)</span>
        </label>

        <label className="banc-champ">
          <span>Mouvement</span>
          <select
            value={sobre === undefined ? "systeme" : sobre ? "sobre" : "anime"}
            onChange={(e) => setSobre(e.target.value === "systeme" ? undefined : e.target.value === "sobre")}
          >
            <option value="systeme">celui du systeme</option>
            <option value="anime">anime</option>
            <option value="sobre">sobre (reduced-motion)</option>
          </select>
        </label>

        <label className="banc-champ">
          <span>Signature</span>
          <select
            value={forme ?? "appareil"}
            onChange={(e) => setForme(e.target.value === "appareil" ? undefined : e.target.value as FormeDuGeste)}
          >
            <option value="appareil">celle de l appareil</option>
            <option value="maintien">maintien (souris)</option>
            <option value="trace">trace (doigt)</option>
          </select>
        </label>

        <button type="button" className="banc-rejouer" onClick={rejouer}>Rejouer</button>

        <dl className="banc-etat">
          <dt>ecran</dt><dd>{ecran}</dd>
          <dt>porteur</dt><dd>{etat.nomDuPorteur || "—"}</dd>
          <dt>pacte</dt><dd>{etat.nomDuPacte || "—"}</dd>
          <dt>phrase</dt><dd>{etat.mantra || "—"}</dd>
          <dt>sceau</dt><dd>{etat.symbole || "—"} · {etat.couleur || "—"}</dd>
          <dt>valeurs</dt><dd>{etat.valeurs.join(", ") || "aucune"}</dd>
          <dt>clauses</dt><dd>{etat.clausesAcceptees ? "acceptees" : "non"}</dd>
          <dt>signe</dt><dd>{etat.signe ? "oui" : "non"}</dd>
          <dt>sigil</dt><dd>{sigil.traits.length} traits · {sigil.ancres.length} ancres · v{VERSION_ALPHABET}</dd>
        </dl>

        {/* CE QUI AURAIT ETE ECRIT — les cinq lignes, telles que
            « useSceller » les composerait. C est la seule facon de
            relire une insertion sans la faire. */}
        {scelle && (
          <div className="banc-ecritures">
            <b>Ce qui aurait ete ecrit</b>
            <pre>{JSON.stringify({
              "profiles.display_name": scelle.nomDuPorteur.trim(),
              "pacts (upsert sur user_id)": {
                name: scelle.nomDuPacte.trim(),
                mantra: scelle.mantra.trim(),
                symbol: scelle.symbole,
                color: scelle.couleur,
                sigil_version: VERSION_ALPHABET,
              },
              "user_values (remplacees)": scelle.valeurs.map((label, rank) => ({ label, rank })),
              "goals": scelle.objectif ?? "aucun (rite abrege)",
            }, null, 2)}</pre>
          </div>
        )}
      </aside>

      <main className="banc-scene">
        <LeRite
          key={cle}
          abrege={abrege}
          onSceller={onSceller}
          pretAEcrire
          onQuitter={rejouer}
          ecranInitial={depart}
          etatInitial={prerempli ? ETAT_REMPLI : ETAT_VIDE}
          reglages={reglages}
          onEcranChange={setEcran}
          onEtatChange={setEtat}
        />
      </main>
    </div>
  );
}
