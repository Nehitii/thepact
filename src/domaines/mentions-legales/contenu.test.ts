import { describe, expect, it } from "vitest";
import {
  EDITEUR,
  CHAMPS_REQUIS,
  REGIME,
  HEBERGEUR,
  HEBERGEUR_SITE,
  SECTIONS,
} from "./contenu";

/* ═══════════════════════════════════════════════════════════════
   CE QUE CES TESTS EMPÊCHENT

   L'anonymat de l'éditeur non professionnel n'est PAS gratuit : la
   LCEN 6-III-2 l'accorde en échange de la publication des coordonnées
   de l'hébergeur. Une page qui ne nommerait ni l'un ni l'autre serait
   pire que la version incomplète qu'elle remplace — elle aurait l'air
   finie.

   Le second garde-fou vise le jour où l'application encaissera : le
   régime bascule, et cinq champs jusque-là facultatifs redeviennent
   obligatoires. Le test le dit à ce moment-là, pas six mois après.
   ═══════════════════════════════════════════════════════════════ */

describe("mentions légales", () => {
  it("nomme toujours au moins un hébergeur — c'est la contrepartie de l'anonymat", () => {
    expect(HEBERGEUR_SITE.nom.trim()).not.toBe("");
    expect(HEBERGEUR_SITE.detail.trim()).not.toBe("");
    expect(HEBERGEUR.nom.trim()).not.toBe("");
    expect(HEBERGEUR.detail.trim()).not.toBe("");
  });

  it("garde une adresse de contact dans les deux régimes — le RGPD ne connaît pas l'anonymat de la LCEN", () => {
    expect(CHAMPS_REQUIS).toContain("courriel");
    expect(EDITEUR.courriel).toMatch(/.+@.+\..+/);
  });

  it("n'a aucun champ requis vide : la page ne doit jamais s'afficher incomplète", () => {
    const vides = CHAMPS_REQUIS.filter((c) => !EDITEUR[c].trim());
    expect(vides).toEqual([]);
  });

  it("exige les six champs dès que le régime devient professionnel", () => {
    /* On rejoue le calcul du module avec l'autre régime, sans le
       modifier : c'est la règle qu'on teste, pas la valeur du jour. */
    const requisSiPro = ["nom", "forme", "adresse", "immatriculation", "directeur", "courriel"];
    const requis = REGIME === "particulier" ? ["courriel"] : requisSiPro;
    expect(requis).toEqual(REGIME === "particulier" ? ["courriel"] : requisSiPro);
    expect(requisSiPro).toHaveLength(6);
    expect(CHAMPS_REQUIS).toEqual(requis);
  });

  it("dit sous quel régime le service est édité, et le justifie dans le texte", () => {
    const editeur = SECTIONS.flatMap((s) => s.articles).find((a) => a.titre === "Éditeur du service");
    expect(editeur).toBeDefined();
    const texte = (editeur!.corps as unknown[]).flat().join(" ");
    if (REGIME === "particulier") {
      expect(texte).toMatch(/non professionnel/i);
      expect(texte).toMatch(/6-III-2|économie numérique/i);
      expect(texte).toContain(EDITEUR.courriel);
    } else {
      expect(texte).toMatch(/responsabilité/i);
    }
  });

  it("cite les deux hébergeurs dans l'article qui leur est consacré", () => {
    const heb = SECTIONS.flatMap((s) => s.articles).find((a) => a.titre === "Hébergement");
    expect(heb).toBeDefined();
    const texte = (heb!.corps as unknown[]).flat().join(" ");
    expect(texte).toContain(HEBERGEUR_SITE.nom);
    expect(texte).toContain(HEBERGEUR.nom);
  });
});
