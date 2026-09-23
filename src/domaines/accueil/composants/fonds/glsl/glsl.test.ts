import { describe, expect, it } from "vitest";
import { SOMMETS_PLEIN_ECRAN } from "../gl";
import { AURORE } from "./aurore";
import { FOND_DERIVE, FRAGMENTS_DERIVE, SOMMETS_DERIVE } from "./derive";
import { FRAGMENTS_ESSAIM, SOMMETS_ESSAIM } from "./essaim";
import { HORIZON } from "./horizon";
import { NEBULEUSE } from "./nebuleuse";
import { ORBITE } from "./orbite";

/* ═══════════════════════════════════════════════════════════════
   CE QUE CE FICHIER PROTÈGE

   Un shader ne se compile qu'au moment où la carte graphique le reçoit,
   et chaque carte a son avis. Ce qui passe sur le poste de développement
   peut échouer sur un téléphone — et le fond retombe alors en silence
   sur le ciel CSS, sans que personne ne le voie.

   On ne peut pas compiler ici, sans carte. On vérifie donc ce que les
   compilateurs les plus stricts (ANGLE, les pilotes mobiles) refusent
   et que les autres laissent passer :
   - un caractère hors ASCII, même dans un commentaire ;
   - une boucle dont la borne n'est pas une constante ;
   - une fonction de GLSL ES 3 (`round`, `tanh`) dans un programme 1.00 ;
   - un fragment sans précision déclarée.
   ═══════════════════════════════════════════════════════════════ */

const PROGRAMMES = {
  SOMMETS_PLEIN_ECRAN, NEBULEUSE, HORIZON, AURORE, ORBITE,
  SOMMETS_ESSAIM, FRAGMENTS_ESSAIM, SOMMETS_DERIVE, FRAGMENTS_DERIVE, FOND_DERIVE,
};

describe.each(Object.entries(PROGRAMMES))("le programme %s", (_, source) => {
  it("ne contient que de l'ASCII", () => {
    const intrus = [...source].filter((c) => c.charCodeAt(0) > 127);
    expect(intrus).toEqual([]);
  });

  it("a une et une seule fonction main", () => {
    expect(source.match(/void main\s*\(/g)).toHaveLength(1);
  });

  it("reste en GLSL ES 1.00", () => {
    expect(source).not.toMatch(/#version|\bround\s*\(|\btanh\s*\(|\btexture\s*\(/);
  });

  it("ne boucle que sur des bornes constantes", () => {
    const boucles = source.match(/for\s*\([^)]*\)/g) ?? [];
    for (const boucle of boucles) {
      expect(boucle).toMatch(/^for \(int (\w+) = 0; \1 < \d+; \1\+\+\)$/);
    }
  });

  it("déclare sa précision s'il colore des pixels", () => {
    if (source.includes("gl_FragColor")) expect(source).toMatch(/precision (highp|mediump) float;/);
  });
});
