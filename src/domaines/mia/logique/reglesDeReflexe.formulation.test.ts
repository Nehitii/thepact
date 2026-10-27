/* LES AIDES DE FORMULATION DE M.I.A.
 *
 * `reglesDeReflexe.ts` porte deux choses : la table des douze regles,
 * et les trois outils avec lesquels elles ecrivent leurs phrases. Le
 * fichier de test suivait cette couture — il la depassait aussi, de
 * quelques lignes au-dela du plafond de quatre cents. Il se coupe donc
 * la ou le sujet se coupait deja.
 *
 * Ici : les nombres a la francaise, les dates en clair, et le tirage
 * qui ne repete jamais la variante precedente. Trois fonctions courtes
 * dont chaque decision est invisible a la lecture — une espace fine
 * insecable au lieu d une espace, un mois abrege, une repetition.
 *
 * Voir `reglesDeReflexe.test.ts` pour la table elle-meme.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { choisir, dernier, enFrancais, nb } from "./reglesDeReflexe";

/* `dernier` est un etat de MODULE : il survit d un test a l autre et
   changerait la variante tiree. On le vide avant chaque cas. */
beforeEach(() => dernier.clear());

describe("nb : les nombres a la francaise", () => {
  it("ne separe rien en dessous de mille", () => {
    for (const n of [0, 1, 42, 999]) expect(nb(n)).toBe(String(n));
  });

  it("separe les milliers par une ESPACE FINE INSECABLE, et non par une espace", () => {
    /* U+202F, code 8239. Un test ecrit avec une espace ordinaire
       echouerait — et un `includes` ecrit ailleurs, en silence. */
    const mille = nb(1000);
    expect([...mille].map((c) => c.codePointAt(0))).toEqual([49, 8239, 48, 48, 48]);
    expect(mille).not.toBe("1 000");
    expect(nb(1234567)).toBe("1 234 567");
  });

  it("met une virgule aux decimales et garde le signe", () => {
    expect(nb(0.5)).toBe("0,5");
    expect(nb(-1500)).toBe("-1 500");
  });
});

describe("enFrancais : l echeance en clair", () => {
  it("rend le jour et le mois, sans annee", () => {
    expect(enFrancais("2026-08-26T22:00:00+00:00")).toBe("27 août");
    expect(enFrancais("2026-01-01T09:00:00+00:00")).toBe("1 janvier");
  });

  it("dit l absence plutot que de la taire", () => {
    expect(enFrancais(null)).toBe("sans échéance");
    expect(enFrancais("")).toBe("sans échéance");
  });

  it("NE DOIT PAS etre lu a midi, contrairement aux dates du reste du code", () => {
    /* MESURE AVANT DE CORRIGER, ET IL N Y AVAIT RIEN A CORRIGER.
       `vues.ts` et `gestes.ts` lisent leurs dates a « T12:00:00 »
       parce qu elles portent une DATE NUE, laquelle recule d un jour
       a l ouest de Greenwich si on la lit a minuit UTC. Le reflexe
       semble porter la meme faute ; il n en porte aucune.
       `todo_tasks.deadline` est un « timestamp with time zone » —
       verifie en base, la plus tardive vaut 2026-08-26 22:00:00+00,
       soit le 27 aout a Paris. C est un INSTANT : le rendre dans le
       fuseau du lecteur est juste, lui imposer midi le decalerait. */
    expect(enFrancais("2026-08-31")).toBe("31 août");   /* fuseau des tests : Europe/Paris */
    expect(enFrancais("2026-08-26T22:00:00+00:00")).toBe("27 août");
  });
});

describe("choisir : jamais deux fois la meme d affilee", () => {
  it("ne repete jamais la variante precedente, sur deux cents tirages", () => {
    const suite = Array.from({ length: 200 }, () => choisir("t", ["a", "b", "c"]));
    const repetitions = suite.filter((v, i) => i > 0 && v === suite[i - 1]);
    expect(repetitions).toEqual([]);
    expect(new Set(suite).size).toBe(3);
  });

  it("rend la variante unique sans la memoriser", () => {
    /* Le raccourci sort AVANT d ecrire dans `dernier` : une variante
       unique servie deux fois de suite ne bloque donc pas la meme
       chaine si elle reparait plus tard dans une liste plus longue. */
    expect(choisir("u", ["seule"])).toBe("seule");
    expect(choisir("u", ["seule"])).toBe("seule");
    expect(dernier.get("u")).toBeUndefined();
  });

  it("retombe sur la premiere quand toutes les variantes sont identiques", () => {
    expect(choisir("v", ["x", "x"])).toBe("x");
    expect(choisir("v", ["x", "x"])).toBe("x");
  });

  it("range le choix sous SON intention, pas sous une autre", () => {
    choisir("un", ["a", "b"]);
    expect(dernier.has("un")).toBe(true);
    expect(dernier.has("deux")).toBe(false);
  });
});

