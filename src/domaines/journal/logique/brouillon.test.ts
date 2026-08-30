import { describe, expect, it } from "vitest";
import {
  CLE_NEUVE, cleDuBrouillon, DELAI_BROUILLON, empreinteDesValeurs, estSale,
  faudraEcrireLeBrouillon, PREFIXE_BROUILLON, VALEURS_NEUVES, valeursDeLEntree,
  valeursNeuves, valeursRestaurees, type EntreeLue,
} from "./brouillon";

const tel = (h: string) => h;

describe("cleDuBrouillon", () => {
  it("range une entree existante sous son identifiant", () => {
    expect(cleDuBrouillon("abc-123")).toBe("journal-draft-abc-123");
  });

  /* TOUTES LES NOUVELLES ENTREES PARTAGENT UNE SEULE CLE : commencer
     une entree, la quitter sans enregistrer, puis en commencer une
     AUTRE fait revenir le brouillon de la premiere. Constate. */
  it.each([undefined, ""])("range toute entree neuve (%s) sous la meme cle", (id) => {
    expect(cleDuBrouillon(id as string | undefined)).toBe(
      id === "" ? PREFIXE_BROUILLON : `${PREFIXE_BROUILLON}${CLE_NEUVE}`,
    );
  });

  it("ne confond pas deux entrees existantes", () => {
    expect(cleDuBrouillon("un")).not.toBe(cleDuBrouillon("deux"));
  });
});

describe("valeursNeuves", () => {
  it("part des treize defauts", () => {
    expect(valeursNeuves()).toEqual(VALEURS_NEUVES);
    expect(Object.keys(VALEURS_NEUVES)).toHaveLength(13);
  });

  /* CINQ SUR DIX : le milieu de l echelle, pas zero. Une entree sans
     humeur declaree n est pas une entree au plus bas. */
  it("place l humeur et l energie au milieu de l echelle", () => {
    expect(valeursNeuves().valence).toBe(5);
    expect(valeursNeuves().energy).toBe(5);
  });

  it("enveloppe l amorce du jour dans un paragraphe", () => {
    expect(valeursNeuves("Quelle décision ?").content).toBe("<p>Quelle décision ?</p>");
  });

  it.each([undefined, ""])("laisse le contenu vide sans amorce (%s)", (a) => {
    expect(valeursNeuves(a as string | undefined).content).toBe("");
  });

  it("ne partage pas ses tableaux entre deux appels", () => {
    const a = valeursNeuves();
    a.tags.push("x");
    expect(valeursNeuves().tags).toEqual([]);
  });
});

describe("valeursDeLEntree — chaque colonne nulle retombe sur son defaut", () => {
  const pleine: EntreeLue = {
    title: "Un titre", content: "<p>du texte</p>",
    life_context: "au travail", valence_level: 8, energy_level: 2,
    linked_goal_id: "g1", tags: ["a"], accent_color: "amber",
    mood: "tension", font_id: "serif", size_id: "lg", align_id: "center",
    line_numbers: true,
  };

  it("emporte tout ce que l entree porte", () => {
    const v = valeursDeLEntree(pleine, tel);
    expect(v).toEqual({
      title: "Un titre", content: "<p>du texte</p>", lifeContext: "au travail",
      valence: 8, energy: 2, linkedGoalId: "g1", tags: ["a"], accentId: "amber",
      moodId: "tension", fontId: "serif", sizeId: "lg", alignId: "center",
      lineNums: true,
    });
  });

  it("retombe sur les defauts pour une entree nue", () => {
    const nue: EntreeLue = { title: "T", content: "" };
    expect(valeursDeLEntree(nue, tel)).toEqual({ ...VALEURS_NEUVES, title: "T", content: "" });
  });

  /* L OPERATEUR COMPTE : « ?? » pour les nombres et les booleens,
     parce que ZERO et FAUX sont des valeurs qu on veut garder. Avec
     « || », une humeur a zero remonterait a cinq. */
  it("garde une humeur a zero", () => {
    const v = valeursDeLEntree({ ...pleine, valence_level: 0, energy_level: 0 }, tel);
    expect(v.valence).toBe(0);
    expect(v.energy).toBe(0);
  });

  it("garde des numeros de ligne a faux", () => {
    expect(valeursDeLEntree({ ...pleine, line_numbers: false }, tel).lineNums).toBe(false);
  });

  /* MAIS « || » POUR LE CONTEXTE DE VIE : une chaine vide et une
     absence disent la meme chose ici. */
  it("traite un contexte de vie vide comme absent", () => {
    expect(valeursDeLEntree({ ...pleine, life_context: "" }, tel).lifeContext).toBe("");
    expect(valeursDeLEntree({ ...pleine, life_context: null }, tel).lifeContext).toBe("");
  });

  it("nettoie le contenu avec la fonction qu on lui donne", () => {
    const v = valeursDeLEntree(pleine, (h) => h.replace("<p>", "").replace("</p>", ""));
    expect(v.content).toBe("du texte");
  });

  it("traite un objectif lie absent comme aucun", () => {
    expect(valeursDeLEntree({ ...pleine, linked_goal_id: null }, tel).linkedGoalId).toBeNull();
    expect(valeursDeLEntree({ title: "T", content: "" }, tel).linkedGoalId).toBeNull();
  });

  it("traite des etiquettes absentes comme une liste vide", () => {
    expect(valeursDeLEntree({ ...pleine, tags: null }, tel).tags).toEqual([]);
  });
});

describe("valeursRestaurees — le brouillon recouvre le depart", () => {
  const depart = valeursNeuves();

  it("rend rien quand il n y a pas de brouillon", () => {
    expect(valeursRestaurees(depart, null)).toBeNull();
    expect(valeursRestaurees(depart, "")).toBeNull();
  });

  it("recouvre champ par champ", () => {
    const brut = JSON.stringify({ title: "Repris", valence: 9 });
    expect(valeursRestaurees(depart, brut)).toEqual({ ...depart, title: "Repris", valence: 9 });
  });

  /* LE DEPART SERT DE SOCLE : un champ ajoute depuis l ecriture du
     brouillon garde sa valeur d aujourd hui plutot que de devenir
     indefini. */
  it("garde les champs que le brouillon ne connait pas", () => {
    const vieux = JSON.stringify({ title: "Repris" });
    const r = valeursRestaurees(depart, vieux);
    expect(r?.moodId).toBe(VALEURS_NEUVES.moodId);
    expect(Object.keys(r ?? {})).toHaveLength(13);
  });

  /* UN BROUILLON VIEUX RECOUVRE UNE ENTREE MODIFIEE AILLEURS DEPUIS —
     depuis un autre onglet, ou une autre machine — sans rien
     demander. C est voulu pour ne pas perdre ce qui a ete tape, mais
     ce test le rend visible. */
  it("l emporte sur une entree modifiee ailleurs", () => {
    const depuisLaBase = valeursDeLEntree(
      { title: "Titre frais", content: "<p>frais</p>" }, tel,
    );
    const vieuxBrouillon = JSON.stringify({ title: "Titre d hier" });
    expect(valeursRestaurees(depuisLaBase, vieuxBrouillon)?.title).toBe("Titre d hier");
  });

  /* UN BROUILLON ILLISIBLE EST IGNORE, PAS EFFACE : le lire echoue,
     mais rien ne dit qu il ne redeviendra pas lisible. */
  it.each(["{cassé", "undefined", "[1,2", "{"])("ignore un brouillon illisible : %s", (brut) => {
    expect(valeursRestaurees(depart, brut)).toBeNull();
  });

  it("ne modifie pas le depart qu on lui donne", () => {
    const origine = valeursNeuves();
    valeursRestaurees(origine, JSON.stringify({ title: "Repris" }));
    expect(origine.title).toBe("");
  });
});

describe("estSale — la garde des modifications non enregistrees", () => {
  const depart = valeursNeuves();

  /* TANT QUE L EMPREINTE DE DEPART EST VIDE, RIEN N EST SALE : la
     fenetre n a pas fini de s ouvrir. Meme garde que l atelier des
     objectifs. */
  it("ne retient personne avant l ouverture", () => {
    expect(estSale("", depart)).toBe(false);
    expect(estSale("", { ...depart, title: "quelque chose" })).toBe(false);
  });

  it("laisse fermer quand rien n a bouge", () => {
    expect(estSale(empreinteDesValeurs(depart), depart)).toBe(false);
  });

  it("retient des qu un champ a bouge", () => {
    const e = empreinteDesValeurs(depart);
    expect(estSale(e, { ...depart, title: "x" })).toBe(true);
    expect(estSale(e, { ...depart, valence: 6 })).toBe(true);
    expect(estSale(e, { ...depart, tags: ["a"] })).toBe(true);
  });

  /* REVENIR EN ARRIERE N EST PAS UNE MODIFICATION. */
  it("laisse fermer quand la saisie a ete annulee a la main", () => {
    const e = empreinteDesValeurs(depart);
    expect(estSale(e, { ...valeursNeuves() })).toBe(false);
  });

  /* CHAQUE CHAMP DOIT ETRE VU : le risque n est pas qu un champ de
     trop entre dans l empreinte, c est qu il en manque un. */
  it.each(Object.keys(VALEURS_NEUVES))("remarque un changement de %s", (champ) => {
    const e = empreinteDesValeurs(depart);
    const autre = {
      title: "x", content: "<p>y</p>", lifeContext: "z", valence: 1, energy: 9,
      linkedGoalId: "g", tags: ["t"], accentId: "amber", moodId: "tension",
      fontId: "serif", sizeId: "lg", alignId: "center", lineNums: true,
    } as Record<string, unknown>;
    expect(estSale(e, { ...depart, [champ]: autre[champ] })).toBe(true);
  });
});

describe("faudraEcrireLeBrouillon", () => {
  const depart = valeursNeuves();

  it("n ecrit rien tant que rien n a bouge", () => {
    expect(faudraEcrireLeBrouillon(empreinteDesValeurs(depart), depart)).toBe(false);
  });

  it("n ecrit rien avant l ouverture", () => {
    expect(faudraEcrireLeBrouillon("", { ...depart, title: "x" })).toBe(false);
  });

  it("ecrit des qu un champ a bouge", () => {
    expect(faudraEcrireLeBrouillon(empreinteDesValeurs(depart), { ...depart, title: "x" })).toBe(true);
  });

  /* QUATRE CENTS MILLISECONDES : ecrire a chaque touche ferait une
     ecriture par caractere ; attendre plus perdrait ce qui vient
     d etre tape si l onglet se ferme. */
  it("attend quatre cents millisecondes", () => {
    expect(DELAI_BROUILLON).toBe(400);
  });
});

/* ═══════════════════════════════════════════════════════════════
   POURQUOI « ?? » EST INOBSERVABLE SUR UN CHAMP ET PAS SUR L AUTRE.

   Le balayage de mutations a attrape le passage de « ?? » a « || »
   sur l HUMEUR — dont le defaut vaut cinq — et l a laisse survivre
   sur les NUMEROS DE LIGNE, dont le defaut vaut faux. C est la meme
   ligne de code, et la difference tient entierement au defaut : quand
   il est lui-meme faux, les deux operateurs rendent la meme chose
   pour toute entree.

   Ce n est donc pas un trou dans les tests, c est du code domine PAR
   LA VALEUR DU DEFAUT. Le « ?? » reste le bon operateur : il est ce
   qui garde le code juste le jour ou ce defaut passerait a vrai.
   ═══════════════════════════════════════════════════════════════ */
describe("les deux operateurs, et ce qui les separe", () => {
  const nue: EntreeLue = { title: "T", content: "" };

  it("donne la meme chose sur les numeros de ligne, dont le defaut est faux", () => {
    expect(VALEURS_NEUVES.lineNums).toBe(false);
    for (const v of [true, false, null, undefined]) {
      const parNullish = v ?? VALEURS_NEUVES.lineNums;
      const parFalsy = v || VALEURS_NEUVES.lineNums;
      expect(parNullish).toBe(parFalsy);
      expect(valeursDeLEntree({ ...nue, line_numbers: v }, tel).lineNums).toBe(parNullish);
    }
  });

  /* AVEC UN DEFAUT A VRAI, les deux divergeraient sur un faux
     enregistre : « || » le remonterait a vrai, et l entree
     retrouverait des numeros de ligne que personne n a demandes. */
  it("divergerait si ce defaut passait a vrai", () => {
    const defautVrai = true;
    const enregistre: boolean | null = false;
    expect(enregistre ?? defautVrai).toBe(false);
    expect(enregistre || defautVrai).toBe(true);
  });

  /* SUR L HUMEUR, DONT LE DEFAUT VAUT CINQ, ils divergent deja : une
     humeur enregistree a zero remonterait a cinq. */
  it("diverge deja sur l humeur, dont le defaut vaut cinq", () => {
    expect(VALEURS_NEUVES.valence).toBe(5);
    const enregistree: number | null = 0;
    expect(enregistree ?? VALEURS_NEUVES.valence).toBe(0);
    expect(enregistree || VALEURS_NEUVES.valence).toBe(5);
    expect(valeursDeLEntree({ ...nue, valence_level: 0 }, tel).valence).toBe(0);
  });
});
