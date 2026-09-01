/* CE QU ON A LE DROIT DE SUPPRIMER, ET CE QU ON NE TOUCHE PAS.
 *
 * `ranks.logo_url` porte indifferemment une image televersee dans notre
 * depot et une adresse collee depuis n importe ou. Supprimer un palier
 * doit emporter la premiere — sinon chaque essai laisse un fichier
 * orphelin — et ne jamais tenter la seconde.
 *
 * Toute la sensibilite est dans cette distinction, et elle est ici.
 */
import { describe, expect, it } from "vitest";
import {
  CACHE_UN_AN, DEPOT_EMBLEMES, TAILLE_MAX, cheminDeLEmbleme, cheminPourNouvelEmbleme,
} from "./emblemeDePalier";

const PUBLIQUE = "https://upfethjdvrgmmfgfvqdo.supabase.co/storage/v1/object/public/rank-images/";

describe("cheminDeLEmbleme : ce qui vient de notre depot", () => {
  it("rend le chemin d une image televersee", () => {
    expect(cheminDeLEmbleme(PUBLIQUE + "abc-123/1788000000000.webp"))
      .toBe("abc-123/1788000000000.webp");
  });

  it("laisse tomber la chaine de requete, qui n est pas le chemin", () => {
    expect(cheminDeLEmbleme(PUBLIQUE + "abc/1.webp?v=2")).toBe("abc/1.webp");
    expect(cheminDeLEmbleme(PUBLIQUE + "abc/1.webp#haut")).toBe("abc/1.webp");
  });

  it("deplie ce que l adresse a encode", () => {
    expect(cheminDeLEmbleme(PUBLIQUE + "abc/mon%20embleme.webp")).toBe("abc/mon embleme.webp");
  });

  it("REFUSE une adresse exterieure", () => {
    for (const a of [
      "https://exemple.fr/embleme.png",
      "https://upload.wikimedia.org/logo.svg",
      "data:image/png;base64,iVBORw0KGgo=",
    ]) expect(cheminDeLEmbleme(a), a).toBeNull();
  });

  it("REFUSE un autre depot du projet", () => {
    /* C EST LA GARDE QUI COMPTE. Chercher seulement « rank-images »
       attraperait un depot dont le nom commence pareil, et une adresse
       exterieure qui contiendrait le mot. */
    for (const a of [
      PUBLIQUE.replace("rank-images", "finance-icons") + "abc/1.webp",
      PUBLIQUE.replace("rank-images", "rank-images-anciens") + "abc/1.webp",
      "https://exemple.fr/rank-images/1.webp",
    ]) expect(cheminDeLEmbleme(a), a).toBeNull();
  });

  it("REFUSE une adresse qui ne designe aucun objet", () => {
    /* Une adresse qui s arrete sur le marqueur viserait la racine du
       depot. */
    expect(cheminDeLEmbleme(PUBLIQUE)).toBeNull();
    expect(cheminDeLEmbleme(PUBLIQUE + "?v=1")).toBeNull();
  });

  it("REFUSE ce qui n est pas une chaine", () => {
    for (const a of [null, undefined, "", 42, {}])
      expect(cheminDeLEmbleme(a as string), String(a)).toBeNull();
  });
});

describe("cheminPourNouvelEmbleme", () => {
  it("met l identifiant en premier, comme la regle du depot l exige", () => {
    /* `auth.uid()::text = (storage.foldername(name))[1]` : un chemin
       qui commencerait autrement serait refuse a l ecriture. */
    const c = cheminPourNouvelEmbleme("abc-123", "webp");
    expect(c.split("/")[0]).toBe("abc-123");
    expect(c).toMatch(/^abc-123\/\d+\.webp$/);
  });

  it("horodate, ce qui autorise le cache d un an", () => {
    /* Une image remplacee a une NOUVELLE adresse : un an de cache ne
       peut donc jamais servir une version perimee. */
    const a = cheminPourNouvelEmbleme("u", "webp");
    expect(Number(a.split("/")[1].replace(".webp", ""))).toBeGreaterThan(1_700_000_000_000);
    expect(CACHE_UN_AN).toBe("31536000");
  });

  it("garde l extension qu on lui donne", () => {
    expect(cheminPourNouvelEmbleme("u", "gif")).toMatch(/\.gif$/);
  });

  it("ce qu on ecrit est ce qu on saura relire", () => {
    const chemin = cheminPourNouvelEmbleme("abc-123", "webp");
    expect(cheminDeLEmbleme(PUBLIQUE + chemin)).toBe(chemin);
  });
});

describe("les constantes du depot", () => {
  it("nomme le depot que la migration cree", () => {
    expect(DEPOT_EMBLEMES).toBe("rank-images");
  });

  it("plafonne l entree a deux mega-octets, comme les logos de creancier", () => {
    expect(TAILLE_MAX).toBe(2 * 1024 * 1024);
  });
});
