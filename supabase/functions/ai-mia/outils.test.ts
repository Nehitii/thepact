import { describe, expect, it } from "vitest";
import {
  OUTILS_LECTURE_SEULE, OUTILS_QUI_ECRIVENT, OUTILS_QUI_LISENT,
  outilsNonClasses, TOOLS, verifierLaClassification,
} from "./classement";
import { TOOLS } from "./outils";

const noms = () => TOOLS.map((o) => o.function.name);

describe("la classification des outils", () => {
  /* CE CONTROLE NE S EXECUTAIT QU AU DEMARRAGE A FROID DE LA FONCTION
     DEPLOYEE : personne ne le voyait echouer avant la mise en ligne.
     Ici il tourne a chaque commit. */
  it("ne laisse aucun outil non classe", () => {
    expect(outilsNonClasses()).toEqual([]);
    expect(() => verifierLaClassification()).not.toThrow();
  });

  it("classe chaque outil d un cote ou de l autre", () => {
    for (const n of noms()) {
      expect(OUTILS_QUI_ECRIVENT.has(n) || OUTILS_QUI_LISENT.has(n)).toBe(true);
    }
  });

  /* AUCUN OUTIL DES DEUX COTES A LA FOIS : un outil a la fois lecteur
     et redacteur serait offert en mode lecture seule tout en
     ecrivant. */
  it("ne classe aucun outil des deux cotes", () => {
    for (const n of noms()) {
      expect(OUTILS_QUI_ECRIVENT.has(n) && OUTILS_QUI_LISENT.has(n)).toBe(false);
    }
  });

  /* LES DEUX COLONNES NE NOMMENT QUE DES OUTILS QUI EXISTENT. Un nom
     mal orthographie dans OUTILS_QUI_ECRIVENT ferait passer l outil
     reel du cote lecture, en silence. */
  it("ne nomme aucun outil inexistant", () => {
    const existants = new Set(noms());
    for (const n of [...OUTILS_QUI_ECRIVENT, ...OUTILS_QUI_LISENT]) {
      expect(existants.has(n)).toBe(true);
    }
  });

  it("couvre tous les outils, sans reste des deux cotes", () => {
    expect(OUTILS_QUI_ECRIVENT.size + OUTILS_QUI_LISENT.size).toBe(TOOLS.length);
  });
});

describe("le mode lecture seule", () => {
  it("ne garde que les outils qui n ecrivent pas", () => {
    for (const o of OUTILS_LECTURE_SEULE) {
      expect(OUTILS_QUI_ECRIVENT.has(o.function.name)).toBe(false);
    }
  });

  it("garde exactement les outils de lecture", () => {
    expect(OUTILS_LECTURE_SEULE.map((o) => o.function.name).sort())
      .toEqual([...OUTILS_QUI_LISENT].sort());
  });

  /* IL EN RESTE, ET PAS QU UN : un mode lecture seule vide ne servirait
     a rien, et serait le symptome d une classification qui a bascule
     entierement du mauvais cote. */
  it("laisse une douzaine d outils au mode lecture seule", () => {
    expect(OUTILS_LECTURE_SEULE.length).toBe(12);
    expect(OUTILS_QUI_ECRIVENT.size).toBe(11);
  });
});

describe("les schemas d outils", () => {
  it("declare chaque outil comme une fonction nommee", () => {
    for (const o of TOOLS) {
      expect(o.type).toBe("function");
      expect(typeof o.function.name).toBe("string");
      expect(o.function.name.length).toBeGreaterThan(0);
    }
  });

  it("ne declare pas deux fois le meme nom", () => {
    expect(new Set(noms()).size).toBe(TOOLS.length);
  });

  /* CHAQUE OUTIL DECRIT CE QU IL FAIT : c est ce texte, et lui seul,
     qui apprend au modele quand l appeler. */
  it("decrit chaque outil au modele", () => {
    for (const o of TOOLS) {
      expect(typeof o.function.description).toBe("string");
      expect(o.function.description.length).toBeGreaterThan(10);
    }
  });
});

/* ═══════════════════════════════════════════════════════════════
   LE CONTROLE VU EN TRAIN D ECHOUER.

   Le balayage de mutations a laisse survivre « ne plus signaler les
   outils non classes » et « inverser le filtre » : les deux
   passaient, parce que la classification reelle est juste et que la
   branche d erreur n etait donc atteinte par RIEN. Un test qui ne
   voit jamais un garde refuser ne prouve pas qu il refuse.
   ═══════════════════════════════════════════════════════════════ */
describe("le controle, mis en echec expres", () => {
  it("signale un outil qu aucune colonne ne reclame", () => {
    expect(outilsNonClasses(["create_todo", "outil_fantome"])).toEqual(["outil_fantome"]);
  });

  it("refuse de demarrer sur un outil non classe", () => {
    expect(() => verifierLaClassification(["outil_fantome"])).toThrow(/outil_fantome/);
  });

  it("nomme TOUS les outils non classes, pas seulement le premier", () => {
    expect(() => verifierLaClassification(["fantome_un", "fantome_deux"]))
      .toThrow(/fantome_un, fantome_deux/);
  });

  /* UN OUTIL CLASSE D UN SEUL COTE SUFFIT : le filtre demande
     l absence des DEUX colonnes, pas la presence des deux. */
  it("ne signale pas un outil classe d un seul cote", () => {
    expect(outilsNonClasses(["create_todo"])).toEqual([]);
    expect(outilsNonClasses(["list_todos"])).toEqual([]);
  });

  it("ne signale rien sur une liste vide", () => {
    expect(outilsNonClasses([])).toEqual([]);
    expect(() => verifierLaClassification([])).not.toThrow();
  });
});
