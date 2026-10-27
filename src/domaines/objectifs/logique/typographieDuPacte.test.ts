import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  POLICES_DU_TITRE, EFFETS_DU_TITRE, POLICE_PAR_DEFAUT,
  familleDeLaPolice, styleDeLEffet,
} from "./typographieDuPacte";

/* ON N OFFRE PAS UNE FONTE QU ON N EMBARQUE PAS.
 *
 * « Mon pacte » proposait cinq polices sous leur nom propre — Orbitron,
 * Rajdhani, Share Tech, Space Grotesk, Inter — et en dessinait l apercu
 * dans la fonte annoncee. Deux d entre elles n existaient nulle part
 * dans le depot : ni @font-face, ni fichier dans « public/fonts », ni
 * lien externe. Le navigateur retombait donc sur son sans-serif
 * generique, identique pour les deux, et l ecran de choix affirmait le
 * contraire.
 *
 * Mesure au canvas, avant correction : « 'Space Grotesk', sans-serif »
 * et « 'Inter', sans-serif » rendaient « Overwrite 0123 » a 369,5 px,
 * exactement la largeur du sans-serif du systeme. Orbitron faisait
 * 423 px, Rajdhani 282,8 : celles-la existaient.
 *
 * Un test qui se contenterait de compter les entrees n aurait rien vu.
 * Celui-ci LIT LA FEUILLE et confronte l offre a ce qui est declare.
 */

/** Les familles reellement declarees en @font-face dans la feuille globale. */
function famillesEmbarquees(): Set<string> {
  const feuille = readFileSync("src/index.css", "utf8");
  const familles = new Set<string>();
  for (const bloc of feuille.split("@font-face").slice(1)) {
    const corps = bloc.slice(0, bloc.indexOf("}"));
    const m = /font-family:\s*['"]([^'"]+)['"]/.exec(corps);
    if (m) familles.add(m[1]);
  }
  return familles;
}

/** « 'JetBrains Mono', ui-monospace, monospace » → « JetBrains Mono ». */
function premiereFamille(pile: string): string {
  return pile.split(",")[0].trim().replace(/^['"]|['"]$/g, "");
}

describe("La typographie du pacte", () => {
  it("N OFFRE QUE DES FONTES QUE L APPLICATION EMBARQUE", () => {
    const embarquees = famillesEmbarquees();
    /* Si cette liste est vide, c est le test qui est casse, pas le code. */
    expect(embarquees.size).toBeGreaterThan(2);

    const manquantes = POLICES_DU_TITRE
      .map((p) => premiereFamille(p.famille))
      .filter((f) => !embarquees.has(f));
    expect(manquantes).toEqual([]);
  });

  it("appelle chaque fonte par son nom, pas par celui d une autre", () => {
    /* « share-tech-mono » etait presentee comme « Share Tech » et
       servait du JetBrains Mono. La cle reste — des pactes la portent
       en base — mais le nom affiche est celui de la fonte servie. */
    for (const p of POLICES_DU_TITRE) {
      expect(premiereFamille(p.famille)).toBe(p.nom);
    }
  });

  it("rattrape les deux cles fantomes sur une fonte reelle", () => {
    /* Des pactes ont ete jures sous « space-grotesk » et « inter ». On
       ne peut pas les laisser tomber sur le sans-serif du systeme :
       il n est pas le meme d une machine a l autre. */
    for (const fantome of ["space-grotesk", "inter"]) {
      const famille = familleDeLaPolice(fantome);
      expect(POLICES_DU_TITRE.some((p) => p.famille === famille)).toBe(true);
      expect(famille).not.toBe(familleDeLaPolice(POLICE_PAR_DEFAUT));
    }
  });

  it("rend la police par defaut plutot que rien, sur une cle illisible", () => {
    const defaut = familleDeLaPolice(POLICE_PAR_DEFAUT);
    expect(familleDeLaPolice(null)).toBe(defaut);
    expect(familleDeLaPolice(undefined)).toBe(defaut);
    expect(familleDeLaPolice("")).toBe(defaut);
    expect(familleDeLaPolice("une-police-qui-n-a-jamais-existe")).toBe(defaut);
  });

  it("LE THEME CHANGE LA NATURE DE L EFFET, PAS SEULEMENT SA TEINTE", () => {
    /* Sur le noir la lumiere s ajoute ; sur le papier elle ne peut que
       salir, et le halo devient une bavure d encre. L ecran de choix
       supposait le sombre et montrait donc un halo a qui allait
       recevoir une bavure. */
    const plaque = styleDeLEffet("cyan-glow", true);
    const papier = styleDeLEffet("cyan-glow", false);
    expect(plaque.textShadow).toBeTruthy();
    expect(papier.textShadow).toBeTruthy();
    expect(papier.textShadow).not.toBe(plaque.textShadow);
  });

  it("donne un style a CHAQUE effet offert, dans les deux themes", () => {
    /* « Parasites » valait « {} » du cote du choix et une animation du
       cote du bandeau : l apercu ne montrait rien de ce qu on
       choisissait. Un effet offert qui ne fait rien est un mensonge —
       sauf « aucun », qui promet justement de ne rien faire. */
    for (const e of EFFETS_DU_TITRE) {
      for (const sombre of [true, false]) {
        const style = styleDeLEffet(e.cle, sombre);
        if (e.cle === "none") expect(style).toEqual({});
        else expect(Object.keys(style).length).toBeGreaterThan(0);
      }
    }
  });

  it("ne rend rien plutot que de planter sur un effet inconnu", () => {
    expect(styleDeLEffet("un-effet-retire", true)).toEqual({});
    expect(styleDeLEffet(null, false)).toEqual({});
  });
});
