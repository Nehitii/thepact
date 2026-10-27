import { describe, expect, it } from "vitest";
import {
  cheminDeLaVille, fenetres, graineDuTexte, guilloche, numeroDuDocument, ondes,
  rayonsDeLaCouronne, silhouetteDeVille, tirage,
} from "./dessinsDuBandeau";

/* ═══════════════════════════════════════════════════════════════
   CE QUE CE FICHIER PROTÈGE

   Tout décor des variantes est tiré du nom du pacte : la couronne,
   la ville, le numéro du document. La promesse est celle du sceau —
   même pacte, même dessin. Un tirage qui dépendrait de l'heure ou de
   l'appareil la romprait sans que rien ne casse : on verrait juste
   une autre ville à chaque visite.
   ═══════════════════════════════════════════════════════════════ */

describe("le tirage", () => {
  it("rend la même suite pour la même graine", () => {
    const a = tirage(graineDuTexte("Ananta"));
    const b = tirage(graineDuTexte("Ananta"));
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it("reste entre 0 et 1", () => {
    const h = tirage(42);
    for (let i = 0; i < 1000; i++) {
      const v = h();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("sépare deux noms voisins", () => {
    expect(graineDuTexte("Ananta")).not.toBe(graineDuTexte("Anantb"));
  });
});

describe("le numéro du document", () => {
  it("fait neuf signes, sans O ni I", () => {
    const n = numeroDuDocument("Ananta");
    expect(n).toMatch(/^[0-9A-HJ-NP-Z]{9}$/);
  });

  it("ne dépend ni de la casse ni des espaces autour", () => {
    expect(numeroDuDocument(" ananta ")).toBe(numeroDuDocument("Ananta"));
  });
});

describe("la couronne", () => {
  it("porte des jets plus longs à l'équateur qu'aux pôles", () => {
    const rayons = rayonsDeLaCouronne("Ananta", 720);
    const moyenne = (liste: typeof rayons) => liste.reduce((s, r) => s + r.longueur, 0) / liste.length;
    const equateur = rayons.filter((r) => Math.abs(Math.cos((r.angle * Math.PI) / 180)) > 0.9);
    const poles = rayons.filter((r) => Math.abs(Math.cos((r.angle * Math.PI) / 180)) < 0.2);
    expect(moyenne(equateur)).toBeGreaterThan(moyenne(poles));
  });

  it("est la même d'un chargement à l'autre", () => {
    expect(rayonsDeLaCouronne("Ananta")).toEqual(rayonsDeLaCouronne("Ananta"));
  });
});

describe("la ville", () => {
  it("couvre toute la bande, sans trou ni débord", () => {
    const ville = silhouetteDeVille("Ananta", 1000);
    const fin = ville.at(-1)!;
    expect(ville[0].x).toBe(0);
    expect(fin.x + fin.largeur).toBeCloseTo(1000);
    for (const im of ville) expect(im.hauteur + im.antenne).toBeLessThanOrEqual(1);
  });

  it("se dessine en un chemin fermé", () => {
    const d = cheminDeLaVille(silhouetteDeVille("Ananta"));
    expect(d.startsWith("M0 100")).toBe(true);
    expect(d.endsWith("Z")).toBe(true);
    expect(d).not.toMatch(/NaN/);
  });

  it("allume quelques fenêtres, jamais hors des immeubles", () => {
    const ville = silhouetteDeVille("Ananta");
    const allumees = fenetres(ville, "Ananta");
    expect(allumees.length).toBeGreaterThan(0);
    for (const f of allumees) {
      const im = ville.find((i) => f.x >= i.x && f.x <= i.x + i.largeur)!;
      expect(f.y).toBeGreaterThanOrEqual(100 - im.hauteur * 100);
    }
  });
});

describe("les guillochis", () => {
  it("referment la rosace sur son point de départ", () => {
    const d = guilloche(96, 36, 30);
    const [x0, y0] = d.slice(1, d.indexOf("L")).split(" ").map(Number);
    const dernier = d.slice(d.lastIndexOf("L") + 1, -1).split(" ").map(Number);
    expect(dernier[0]).toBeCloseTo(x0, 1);
    expect(dernier[1]).toBeCloseTo(y0, 1);
  });

  it("tracent autant d'ondes qu'on en demande", () => {
    const lignes = ondes(12, 400, 120, 80, 6);
    expect(lignes).toHaveLength(12);
    for (const l of lignes) expect(l.startsWith("M0 ")).toBe(true);
  });
});
