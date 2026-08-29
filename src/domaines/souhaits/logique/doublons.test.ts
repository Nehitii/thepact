import { describe, it, expect } from "vitest";
import { normaliserNom, trouverDoublon } from "./doublons";

/* ═══════════════════════════════════════════════════════════════
   POURQUOI CE FICHIER EXISTE MAINTENANT ET PAS AVANT.

   Ces deux fonctions vivaient en tête de `pages/Wishlist.tsx`, une
   page de 1 081 lignes. Elles y étaient pures — ni React, ni requête,
   ni état — mais on ne pouvait pas les appeler sans monter la page,
   donc ses hooks, donc Supabase.

   Sorties, elles se testent en trois lignes. C'est le gain de
   l'étape 5 qui ne se mesure pas en octets : ce qu'on découpe, on
   peut enfin l'interroger.

   LA RÈGLE MÉTIER, ET SON PIÈGE : deux articles font doublon quand ils
   portent le même nom ET pointent le même objectif. Le même nom sous
   deux objectifs différents n'en est pas un — « casque » pour le
   bureau et « casque » pour le vélo sont deux choses.
   ═══════════════════════════════════════════════════════════════ */

const article = (id: string, name: string, goal_id: string | null = null) => ({ id, name, goal_id });

describe("normaliser un nom", () => {
  it("ignore la casse et les espaces de bord", () => {
    expect(normaliserNom("  Casque Audio  ")).toBe("casque audio");
  });

  it("réduit toute suite d'espaces à un seul", () => {
    expect(normaliserNom("casque\t\n  audio")).toBe("casque audio");
  });
});

describe("reconnaître un doublon", () => {
  const liste = [
    article("a", "Casque audio", "objectif-bureau"),
    article("b", "Clavier", null),
  ];

  it("reconnaît le même nom écrit autrement, sous le même objectif", () => {
    expect(trouverDoublon({ items: liste, name: "  CASQUE   AUDIO ", goalId: "objectif-bureau" })?.id).toBe("a");
  });

  it("ne reconnaît PAS le même nom sous un autre objectif", () => {
    /* Le piège de la règle : c'est la paire (nom, objectif) qui compte. */
    expect(trouverDoublon({ items: liste, name: "Casque audio", goalId: "objectif-velo" })).toBeNull();
  });

  it("traite « aucun objectif » comme une valeur, pas comme un joker", () => {
    expect(trouverDoublon({ items: liste, name: "Clavier", goalId: null })?.id).toBe("b");
    expect(trouverDoublon({ items: liste, name: "Clavier", goalId: "objectif-bureau" })).toBeNull();
  });

  it("s'exclut lui-même en édition, sinon un article serait son propre doublon", () => {
    expect(trouverDoublon({ items: liste, name: "Casque audio", goalId: "objectif-bureau", excludeId: "a" })).toBeNull();
  });

  it("rend null quand rien ne correspond", () => {
    expect(trouverDoublon({ items: liste, name: "Souris", goalId: null })).toBeNull();
  });
});
