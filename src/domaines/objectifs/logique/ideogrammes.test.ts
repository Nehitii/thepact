import { describe, expect, it } from "vitest";
import { IDEOGRAMMES, ideogramme, _pourLaGarde } from "./ideogrammes";
import { ecritureDeLaVersion, empreinte } from "./sigil";
import { rosaceDuPacte } from "./rosace";

/* L ECRITURE DES VALEURS.
 *
 * Ce qui est tenu ici tient a une chose : le medaillon offre un anneau
 * de 23,4 px sur le sceau du tableau de bord. Tout ce qui suit est une
 * consequence de cette taille — un caractere trop dense, deux
 * caracteres trop proches, un trait qui sort de sa boite : a trente
 * pixels, chacun de ces defauts efface l ecriture.
 */

const { trace, ecart, ECART_MIN } = _pourLaGarde;

/** Les coordonnees d un chemin, dans l ordre. */
function points(d: string): [number, number][] {
  const jetons = d.split(/\s+/).filter(Boolean);
  const sortie: [number, number][] = [];
  for (let k = 0; k < jetons.length; k++) {
    const t = jetons[k];
    if (!/^[ML]/.test(t)) continue;
    const x = parseFloat(t.slice(1));
    const y = parseFloat(jetons[++k]);
    if (!Number.isNaN(x) && !Number.isNaN(y)) sortie.push([x, y]);
  }
  return sortie;
}

describe("Les ideogrammes des valeurs", () => {
  it("en donne vingt-quatre", () => {
    expect(IDEOGRAMMES).toHaveLength(24);
  });

  it("NE SORT JAMAIS DE LA BOITE UNITAIRE", () => {
    /* Le signe est pose au centre du medaillon et mis a l echelle
       depuis cette boite. Un point hors bornes deborde de l anneau et
       mord sur le disque voisin. */
    for (const d of IDEOGRAMMES) {
      for (const [x, y] of points(d)) {
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThanOrEqual(1);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(y).toBeLessThanOrEqual(1);
      }
    }
  });

  it("DEUX CARACTERES SE VOIENT DIFFERENTS, pas seulement leur chaine", () => {
    /* Ecarter les chemins identiques ne suffisait pas : le premier
       tirage rendait vingt-quatre chaines distinctes dont plusieurs
       paires etaient indiscernables a trente pixels — un coffre a mat
       court et le meme a mat long. On compare ce qu on voit. */
    const traces = IDEOGRAMMES.map(trace);
    let mini = Infinity;
    for (let i = 0; i < traces.length; i++) {
      for (let j = i + 1; j < traces.length; j++) {
        mini = Math.min(mini, ecart(traces[i], traces[j]));
      }
    }
    expect(mini).toBeGreaterThanOrEqual(ECART_MIN);
  });

  it("AUCUN N EST FAIT QUE DE TRAITS PARALLELES", () => {
    /* Un caractere se reconnait a ce qu un trait en croise un autre.
       La premiere grammaire posait ses elements dans des boites
       disjointes : six signes sur vingt-quatre n etaient que des barres
       empilees, et se lisaient comme un signe egal. */
    for (const d of IDEOGRAMMES) {
      const t = trace(d);
      /* Une trace qui n occupe qu une poignee de lignes ou de colonnes
         est un empilement, pas un caractere. */
      const lignes = new Set<number>();
      const colonnes = new Set<number>();
      t.forEach((plein, i) => {
        if (!plein) return;
        lignes.add(Math.floor(i / 7));
        colonnes.add(i % 7);
      });
      expect(lignes.size).toBeGreaterThanOrEqual(3);
      expect(colonnes.size).toBeGreaterThanOrEqual(3);
    }
  });

  it("reste dans le nombre de traits que trente pixels supportent", () => {
    for (const d of IDEOGRAMMES) {
      const n = (d.match(/[ML]/g) ?? []).length;
      expect(n).toBeGreaterThanOrEqual(4);
      expect(n).toBeLessThanOrEqual(14);
    }
  });

  it("rend toujours le meme caractere pour le meme indice", () => {
    expect(ideogramme(7)).toBe(ideogramme(7));
    expect(ideogramme(7)).not.toBe(ideogramme(8));
  });
});

describe("Les ecritures, une fois jurees, ne bougent plus", () => {
  /* UN SCEAU QUI BOUGE N EST PAS UN SCEAU. Ces empreintes sont des
     scellements : les faire changer demande une nouvelle version, pas
     une retouche. Elles echouent au premier trait deplace. */
  it("v1 garde la sienne", () => {
    expect(empreinte(ecritureDeLaVersion(1).signes.join("|"))).toBe(2448044856);
    expect(empreinte(ecritureDeLaVersion(1).valeurs.join("|"))).toBe(2448044856);
  });

  it("v2 garde la sienne, et l emploie pour les deux", () => {
    expect(empreinte(ecritureDeLaVersion(2).signes.join("|"))).toBe(912260830);
    expect(empreinte(ecritureDeLaVersion(2).valeurs.join("|"))).toBe(912260830);
  });

  it("V3 GARDE LES SIGNES DE LA V2 ET CHANGE LES VALEURS", () => {
    /* La bande epelle un nom lettre a lettre — le reseau lui va. Les
       medaillons portent chacun un mot entier, et recoivent une
       ecriture qui tient un mot. */
    expect(ecritureDeLaVersion(3).signes).toBe(ecritureDeLaVersion(2).signes);
    expect(empreinte(ecritureDeLaVersion(3).valeurs.join("|"))).toBe(2725785912);
  });

  it("une version inconnue retombe sur la v1 plutot que sur rien", () => {
    expect(ecritureDeLaVersion(99).signes).toBe(ecritureDeLaVersion(1).signes);
  });
});

describe("Deux valeurs d un meme pacte ne portent pas le meme caractere", () => {
  /* Le caractere se prenait a « empreinte(valeur) % 24 ». Sur un
     vocabulaire de vingt-quatre valeurs, 374 pactes a trois valeurs sur
     2 024 en affichaient deux identiques — 18,5 %. Le pacte de
     reference en faisait partie. */
  const MOTS = [
    "Liberté", "Discipline", "Création", "Excellence", "Apprentissage",
    "Développement personnel", "Courage", "Honnêteté", "Rigueur", "Curiosité",
    "Bienveillance", "Persévérance", "Équilibre", "Audace", "Patience",
    "Loyauté", "Simplicité", "Générosité", "Ambition", "Sérénité",
    "Justice", "Humilité", "Clarté", "Force",
  ];

  function repetitions(version: number): { doublons: number; total: number } {
    let doublons = 0, total = 0;
    for (let a = 0; a < MOTS.length; a++) {
      for (let b = a + 1; b < MOTS.length; b++) {
        for (let c = b + 1; c < MOTS.length; c++) {
          total++;
          const r = rosaceDuPacte("Ananta", [MOTS[a], MOTS[b], MOTS[c]], version);
          if (new Set(r.medaillons.map((m) => m.d)).size < 3) doublons++;
        }
      }
    }
    return { doublons, total };
  }

  it("EN V3, AUCUN — sur les deux mille vingt-quatre pactes possibles", () => {
    const { doublons, total } = repetitions(3);
    expect(total).toBe(2024);
    expect(doublons).toBe(0);
  });

  it("et les versions d avant gardent leurs repetitions, sinon leurs sceaux bougeraient", () => {
    /* La correction ne remonte pas : reparer en amont redessinerait
       les sceaux deja jures, ce que le versionnage empeche. */
    expect(repetitions(1).doublons).toBe(374);
    expect(repetitions(2).doublons).toBe(374);
  });

  it("le caractere cede a son voisin, il ne disparait pas", () => {
    const r = rosaceDuPacte("Ananta", ["Excellence", "Apprentissage"], 3);
    expect(r.medaillons).toHaveLength(2);
    expect(r.medaillons[0].d).not.toBe(r.medaillons[1].d);
    for (const m of r.medaillons) expect(IDEOGRAMMES).toContain(m.d);
  });
});
