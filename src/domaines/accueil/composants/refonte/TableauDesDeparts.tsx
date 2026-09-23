import { useEffect, useState } from "react";
import { LIGNES } from "@/domaines/accueil/logique/scenarioEtendu";
import { MISSION } from "@/domaines/accueil/logique/scenarioDuTableau";
import { heure, lireDate } from "@/domaines/accueil/logique/lectureDuTableau";
import type { DonneesDuTableau } from "@/domaines/accueil/composants/refonte/communs";

/* LE TABLEAU DES DEPARTS, A VOLETS.
 *
 * Ce que le plan ne dit pas — l heure — le tableau le dit. Chaque
 * depart est une echeance : les ordres du jour qui tombent a 2 h, la
 * mission de samedi, la revue de dimanche, les etapes dues. Chaque
 * lettre est un volet qui defile avant de se poser, comme sur les
 * tableaux Solari des gares : c est le seul mouvement du monde, et il
 * dit quelque chose — l information vient d arriver.
 *
 * VALIDER UN ORDRE LE FAIT PARTIR. La ligne ne disparait pas : son
 * etat bascule a PARTI, lettre par lettre. */

const ALPHABET = " ABCDEFGHIJKLMNOPQRSTUVWXYZÀÂÉÈÊÎÔÛÇ0123456789:.-'’/+€";
const PAS_MS = 46;

function Volet({ lettre, delai }: { lettre: string; delai: number }) {
  const [vue, setVue] = useState(" ");
  useEffect(() => {
    const reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduit) { setVue(lettre); return; }
    let i = 0;
    const tours = 3 + Math.floor(Math.random() * 5);
    let minuteur = window.setTimeout(function tourner() {
      i += 1;
      if (i >= tours) { setVue(lettre); return; }
      setVue(ALPHABET[Math.floor(Math.random() * ALPHABET.length)]);
      minuteur = window.setTimeout(tourner, PAS_MS);
    }, delai);
    return () => window.clearTimeout(minuteur);
  }, [lettre, delai]);
  return <span className="rs-case" key={vue}><span>{vue}</span></span>;
}

function Volets({ texte, largeur, rang }: { texte: string; largeur: number; rang: number }) {
  const cases = texte.toUpperCase().padEnd(largeur, " ").slice(0, largeur).split("");
  /* Le texte entier pour l oreille, les volets pour l oeil : un lecteur
     d ecran epellerait sinon chaque case, espaces compris. */
  return (
    <span className="rs-volets">
      <span className="rs-lu">{texte}</span>
      <span aria-hidden="true">
        {cases.map((c, i) => <Volet key={i} lettre={c} delai={rang * 110 + i * 22} />)}
      </span>
    </span>
  );
}

/* L heure d un tableau de gare : huit cases, pas une de plus. Le jour
   en deux lettres, puis l heure — ou la date quand il n y a pas
   d heure. « SA 18:00 », « ME 30/09 ». */
function quandEnGare(d: Date, maintenant: Date, avecHeure: boolean): string {
  const memeJour = d.toDateString() === maintenant.toDateString()
    || d.getTime() - maintenant.getTime() < 12 * 3_600_000;
  if (memeJour && avecHeure) return heure(d);
  const jour = d.toLocaleDateString("fr-FR", { weekday: "short" }).slice(0, 2).toUpperCase();
  return avecHeure
    ? `${jour} ${heure(d)}`
    : `${jour} ${d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}`;
}

interface Depart {
  cle: string;
  quand: string;
  ligne?: { numero: string; couleur: string };
  vers: string;
  par: string;
  etat: string;
  ordre?: string;
}

export function TableauDesDeparts({ maintenant, ordres, aVenir, reclamer }: DonneesDuTableau) {
  const ligne = (objectif: string) => LIGNES.find((l) => l.objectif === objectif);
  const terminus = (objectif: string) => ligne(objectif)?.stations.at(-1)?.titre ?? "";
  const departs: Depart[] = [
    ...ordres.map((o) => ({
      cle: o.id, quand: "02:00", vers: o.titre, par: `ORDRE DU JOUR · ${o.progres}/${o.cible}`,
      etat: o.reclame ? "PARTI" : o.progres >= o.cible ? "À VALIDER" : "EN COURS", ordre: o.id,
    })),
    {
      cle: "mission", quand: quandEnGare(MISSION.echeance, maintenant, true),
      ligne: ligne("semi"), vers: terminus("semi"), par: MISSION.titre, etat: "À L’HEURE",
    },
    ...aVenir.filter((e) => e.genre === "revue" || e.genre === "etape").map((e) => {
      const objectif = e.genre === "etape"
        ? LIGNES.find((l) => l.stations.some((s) => s.titre === e.titre))?.objectif
        : undefined;
      return {
        cle: e.date + e.titre,
        quand: quandEnGare(lireDate(e.date), maintenant, e.date.includes("T")),
        ligne: objectif ? ligne(objectif) : undefined,
        vers: objectif ? terminus(objectif) : e.titre,
        par: objectif ? e.titre : "BILAN DE LA SEMAINE",
        etat: "À L’HEURE",
      };
    }),
  ];

  return (
    <section className="rs-departs" aria-labelledby="rs-departs">
      <header>
        <h2 id="rs-departs">Départs</h2>
        <p><b>{heure(maintenant)}</b> · prochains départs du réseau</p>
      </header>
      <table>
        <thead>
          <tr>
            <th scope="col">Heure</th><th scope="col">Ligne</th><th scope="col">Destination</th>
            <th scope="col">Par</th><th scope="col">État</th>
          </tr>
        </thead>
        <tbody>
          {departs.map((d, rang) => (
            <tr key={d.cle} data-etat={d.etat === "PARTI" ? "parti" : d.etat === "À VALIDER" ? "a-valider" : undefined}>
              <td><Volets texte={d.quand} largeur={8} rang={rang} /></td>
              <td>
                {d.ligne ? (
                  <span className="rs-puce" style={{ background: d.ligne.couleur }}>{d.ligne.numero}</span>
                ) : (
                  <span className="rs-puce rs-puce-neutre">{d.ordre ? "O" : "R"}</span>
                )}
              </td>
              <td><Volets texte={d.vers} largeur={22} rang={rang} /></td>
              <td className="rs-par"><Volets texte={d.par} largeur={24} rang={rang} /></td>
              <td>
                {d.etat === "À VALIDER" && d.ordre ? (
                  <button type="button" className="rs-valider" onClick={() => reclamer(d.ordre!)}>Valider</button>
                ) : (
                  <Volets texte={d.etat} largeur={9} rang={rang} />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
