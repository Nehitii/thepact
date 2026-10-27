import { describe, expect, it } from "vitest";
import { nombre } from "./nombre";

describe("lire une mesure", () => {
  it("laisse passer un nombre", () => {
    expect(nombre(1.15, 1)).toBe(1.15);
    expect(nombre(-4, 0)).toBe(-4);
  });

  it("lit un nombre ecrit en texte", () => {
    expect(nombre("1.15", 1)).toBe(1.15);
    expect(nombre("-6.5", 0)).toBe(-6.5);
    expect(nombre("  2 ", 1)).toBe(2);
  });

  it("retombe sur le defaut quand il n y a rien", () => {
    expect(nombre(null, 1)).toBe(1);
    expect(nombre(undefined, 0)).toBe(0);
    expect(nombre("", 1)).toBe(1);
  });

  it("retombe sur le defaut devant un texte illisible", () => {
    expect(nombre("beaucoup", 1)).toBe(1);
    expect(nombre("px", 0)).toBe(0);
  });

  /* ═══ ZERO EST UNE MESURE, PAS UNE ABSENCE ═══
   *
   * C est le seul point ou cette fonction differe du `Number(v) || d`
   * qu ecrivait la barre laterale : celui-la rendait le defaut pour
   * zero. Une echelle de zero — un cadre qu on veut invisible —
   * revenait donc a taille normale dans la barre laterale, et restait
   * invisible partout ailleurs. */
  it("garde le zero, la ou un test de verite le remplacerait", () => {
    expect(nombre(0, 1)).toBe(0);
    expect(nombre("0", 1)).toBe(0);
    expect(Number(0) || 1).toBe(1);
  });

  /* `parseFloat` PLUTOT QUE `Number` : ce qui vient de la base peut
     porter une unite, et on veut le nombre qui commence la chaine. */
  it("lit le nombre qui commence la chaine, unite comprise", () => {
    expect(nombre("1.15px", 1)).toBe(1.15);
    expect(Number("1.15px")).toBeNaN();
  });

  /* `Number.isFinite` PLUTOT QU UN TEST DE VERITE : il refuse aussi les
     infinis, qu un `||` laisserait passer et qui feraient un
     `scale(Infinity)`. */
  it("refuse NaN et les infinis", () => {
    expect(nombre(NaN, 1)).toBe(1);
    expect(nombre(Infinity, 1)).toBe(1);
    expect(nombre(-Infinity, 0)).toBe(0);
    expect(nombre("Infinity", 1)).toBe(1);
  });

  it("rend le defaut tel qu on le lui donne", () => {
    expect(nombre(null, 42)).toBe(42);
    expect(nombre("nawak", -1)).toBe(-1);
  });

  /* ═══ LE `?? ""` NE DECIDE RIEN, ET ON LE GARDE ═══
   *
   * Le balayage de mutations a survecu a sa suppression, et c est
   * juste : `parseFloat` convertit lui-meme son argument en texte, et
   * « null » comme « undefined » s y lisent NaN — que le garde suivant
   * refuse. Le repli est la pour le TYPE et pour le lecteur, pas pour
   * le resultat. Code DOMINE par la conversion de `parseFloat`. */
  it("passe par le meme chemin sans le repli explicite", () => {
    expect(parseFloat(null as unknown as string)).toBeNaN();
    expect(parseFloat(undefined as unknown as string)).toBeNaN();
    expect(nombre(null, 7)).toBe(parseFloat(null as unknown as string) || 7);
  });

  /* ═══ UN NOMBRE PASSE SANS ALLER-RETOUR PAR LE TEXTE ═══
   *
   * Le raccourci `typeof v === "number" ? v : ...` rend la valeur
   * INTACTE. Sans lui, elle ferait un detour par `String` puis
   * `parseFloat` — ce qui, pour presque tout, redonne le meme double.
   * Presque : le zero negatif y perd son signe. Aucune colonne ne
   * range un zero negatif — Postgres le normalise — mais c est la
   * seule valeur qui distingue les deux chemins, et le raccourci est
   * ce qui la preserve. */
  it("rend un nombre intact, zero negatif compris", () => {
    expect(Object.is(nombre(-0, 1), -0)).toBe(true);
    expect(Object.is(parseFloat(String(-0)), -0)).toBe(false);
    expect(nombre(0.1 + 0.2, 0)).toBe(0.30000000000000004);
  });

  /* LES TROIS MESURES D UN CADRE, TELLES QU ELLES ARRIVENT. Releve du
     30/08/2026 : 31 cadres, echelles de 1 a 1,75, decalages de 0 a 6,5.
     La requete de la carte les rend en TEXTE. */
  it("lit les mesures d un cadre venues en texte", () => {
    expect(nombre("1.75", 1)).toBe(1.75);
    expect(nombre("6.5", 0)).toBe(6.5);
    expect(nombre("0.5", 0)).toBe(0.5);
  });
});
