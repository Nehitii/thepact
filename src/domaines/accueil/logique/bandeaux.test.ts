import { describe, expect, it } from "vitest";
import {
  aLargeur, chiffreDeControle, facteurDuNom, interponctuer, ligneLisible, romain, sansAccents, zoneLisible,
} from "./bandeaux";

/* ═══════════════════════════════════════════════════════════════
   CE QUE CE FICHIER PROTÈGE

   Les variantes du bandeau écrivent les chiffres du pacte autrement —
   en romain sur la stèle, en zone lisible par machine sur la pièce
   d'identité. Un chiffre mal converti ne casse rien : il affiche un
   autre pacte que le sien, gravé dans la pierre.
   ═══════════════════════════════════════════════════════════════ */

describe("les chiffres romains", () => {
  it("écrivent les nombres du pacte", () => {
    expect(romain(12)).toBe("XII");
    expect(romain(47)).toBe("XLVII");
    expect(romain(91)).toBe("XCI");
    expect(romain(1057)).toBe("MLVII");
    expect(romain(2026)).toBe("MMXXVI");
    expect(romain(3999)).toBe("MMMCMXCIX");
  });

  it("n'inventent rien hors de leur domaine", () => {
    expect(romain(0)).toBe("0");
    expect(romain(4000)).toBe("4000");
  });
});

describe("la ligne lisible par machine", () => {
  it("met tout en capitales sans accent, les séparateurs en chevrons", () => {
    expect(ligneLisible(["P", "Ananta", "Liberté Discipline"], 30)).toBe("P<<ANANTA<<LIBERTE<DISCIPLINE<");
  });

  it("tient toujours sa longueur", () => {
    expect(ligneLisible(["Un nom de pacte vraiment très long, beaucoup trop long"])).toHaveLength(44);
    expect(ligneLisible(["A"])).toBe("A".padEnd(44, "<"));
  });

  it("retire les accents sans perdre les lettres", () => {
    expect(sansAccents("Création Élan Ça")).toBe("Creation Elan Ca");
  });

  it("complète les nombres de zéros", () => {
    expect(aLargeur(91, 4)).toBe("0091");
    expect(aLargeur(12345, 4)).toBe("2345");
  });
});

describe("le chiffre de contrôle", () => {
  /* Les trois valeurs du spécimen de l'OACI (Doc 9303) : si le calcul
     s'en écarte, la zone de la pièce ne se vérifie plus. */
  it("rend ceux du spécimen de l'OACI", () => {
    expect(chiffreDeControle("L898902C3")).toBe("6");
    expect(chiffreDeControle("740812")).toBe("2");
    expect(chiffreDeControle("120415")).toBe("9");
  });

  it("compte le chevron pour zéro", () => {
    expect(chiffreDeControle("<<<")).toBe("0");
  });
});

describe("la zone lisible de la pièce", () => {
  const champs = {
    numero: "4KX7PZ0Q2",
    jureLe: "2026-06-24",
    terme: "2027-06-30",
    nom: "Ananta",
    valeurs: ["Liberté", "Discipline", "Création"],
    niveau: 12,
    missions: 47,
    jours: 91,
    progression: 62,
    rang: "Architecte",
  };

  it("tient trois lignes de trente signes", () => {
    const zone = zoneLisible(champs);
    expect(zone).toHaveLength(3);
    for (const ligne of zone) expect(ligne).toMatch(/^[A-Z0-9<]{30}$/);
  });

  it("écrit le numéro, les jours et le nom à leur place", () => {
    const [un, deux, trois] = zoneLisible(champs);
    expect(un.startsWith("I<OVW4KX7PZ0Q2")).toBe(true);
    expect(un.slice(15, 29)).toBe("01200470091062");
    expect(deux.slice(0, 6)).toBe("260624");
    expect(deux.slice(8, 14)).toBe("270630");
    expect(deux.slice(15, 18)).toBe("OVW");
    expect(trois).toBe("ANANTA<<LIBERTE<DISCIPLINE<CRE");
  });

  it("porte des contrôles qui se vérifient", () => {
    const [un, deux] = zoneLisible(champs);
    expect(un[14]).toBe(chiffreDeControle("4KX7PZ0Q2"));
    expect(deux[6]).toBe(chiffreDeControle("260624"));
    expect(deux[14]).toBe(chiffreDeControle("270630"));
  });

  it("écrit une échéance absente en chevrons", () => {
    const [, deux] = zoneLisible({ ...champs, terme: null });
    expect(deux.slice(8, 15)).toBe("<<<<<<<");
  });
});

describe("l'interponctuation", () => {
  it("sépare les mots d'un point, en capitales accentuées", () => {
    expect(interponctuer("Tenir ce qui est juré")).toBe("TENIR·CE·QUI·EST·JURÉ");
    expect(interponctuer("  deux   espaces ")).toBe("DEUX·ESPACES");
  });
});

describe("la taille du nom", () => {
  it("laisse les noms courts à leur pleine taille", () => {
    expect(facteurDuNom("Ananta")).toBe(1);
  });

  it("réduit les noms longs, sans descendre sous un tiers", () => {
    expect(facteurDuNom("Seize caractères")).toBeCloseTo(0.5);
    expect(facteurDuNom("x".repeat(50))).toBe(0.34);
  });
});
