import { describe, expect, it } from "vitest";
import {
  empreinteDeLAtelier,
  quelqueChoseAPerdre,
  type ChampsDeLAtelier,
} from "./empreinteDeLAtelier";

const CHAMPS: ChampsDeLAtelier = {
  editName: "Apprendre le piano",
  editDifficulty: "moyen",
  editTags: ["musique"],
  editNotes: "",
  editStartDate: "2026-01-01",
  editCompletionDate: "",
  editImage: "",
  editStepItems: [{ dbId: "e1", name: "Gammes" }],
  editCostItems: [{ id: "c1", name: "Metronome", price: 29 }],
  editMembresIds: [],
  editRegle: { difficulties: ["easy"], excludeCompleted: false },
  editVivant: false,
  editDuree: 0,
};

describe("empreinteDeLAtelier", () => {
  it("rend la meme chaine pour deux fois les memes champs", () => {
    expect(empreinteDeLAtelier(CHAMPS)).toBe(empreinteDeLAtelier({ ...CHAMPS }));
  });

  /* CHAQUE CHAMP DOIT ETRE VU. Le risque n est pas qu un champ de trop
     entre dans l empreinte, c est qu il en manque un : le garde-fou
     cesse alors de remarquer ce champ-la, en silence. */
  const AUTREMENT: { [K in keyof ChampsDeLAtelier]: ChampsDeLAtelier[K] } = {
    editName: "Apprendre la guitare",
    editDifficulty: "difficile",
    editTags: ["musique", "quotidien"],
    editNotes: "commencer doucement",
    editStartDate: "2026-02-01",
    editCompletionDate: "2026-12-31",
    editImage: "photo.png",
    editStepItems: [{ dbId: "e1", name: "Arpeges" }],
    editCostItems: [{ id: "c1", name: "Metronome", price: 35 }],
    editMembresIds: ["m1"],
    editRegle: { difficulties: ["hard"], excludeCompleted: true },
    editVivant: true,
    editDuree: 30,
  };
  for (const champ of Object.keys(AUTREMENT) as (keyof ChampsDeLAtelier)[]) {
    it(`remarque un changement de ${champ}`, () => {
      const modifie = { ...CHAMPS, [champ]: AUTREMENT[champ] } as ChampsDeLAtelier;
      expect(empreinteDeLAtelier(modifie)).not.toBe(empreinteDeLAtelier(CHAMPS));
    });
  }

  /* D UNE ETAPE, ON NE RETIENT QUE SON IDENTITE ET SON NOM. Sinon un
     champ recalcule a l affichage ferait croire a une saisie. */
  it("ignore ce qu une etape porte en plus de son identite et de son nom", () => {
    const enrichie = {
      ...CHAMPS,
      editStepItems: [
        { dbId: "e1", name: "Gammes", ordre: 3, fait: true, calculeALAffichage: 42 },
      ],
    } as unknown as ChampsDeLAtelier;
    expect(empreinteDeLAtelier(enrichie)).toBe(empreinteDeLAtelier(CHAMPS));
  });

  it("remarque une etape renommee", () => {
    const renommee = { ...CHAMPS, editStepItems: [{ dbId: "e1", name: "Gammes " }] };
    expect(empreinteDeLAtelier(renommee)).not.toBe(empreinteDeLAtelier(CHAMPS));
  });

  it("remarque une etape remplacee par une autre du meme nom", () => {
    const remplacee = { ...CHAMPS, editStepItems: [{ dbId: "e2", name: "Gammes" }] };
    expect(empreinteDeLAtelier(remplacee)).not.toBe(empreinteDeLAtelier(CHAMPS));
  });

  /* UNE ETAPE PAS ENCORE ENREGISTREE N A PAS D IDENTITE. Elle compte
     quand meme : c est une saisie a perdre. */
  it("remarque une etape ajoutee mais jamais enregistree", () => {
    const ajoutee = {
      ...CHAMPS,
      editStepItems: [...CHAMPS.editStepItems, { name: "Dechiffrage" }],
    };
    expect(empreinteDeLAtelier(ajoutee)).not.toBe(empreinteDeLAtelier(CHAMPS));
  });

  it("remarque deux etiquettes remises dans un autre ordre", () => {
    const a = empreinteDeLAtelier({ ...CHAMPS, editTags: ["musique", "quotidien"] });
    const b = empreinteDeLAtelier({ ...CHAMPS, editTags: ["quotidien", "musique"] });
    expect(a).not.toBe(b);
  });
});

describe("quelqueChoseAPerdre", () => {
  /* LE DIALOGUE N A JAMAIS ETE OUVERT : il n y a rien a comparer, et
     demander confirmation serait absurde. */
  it("ne retient personne quand aucune photographie n a ete prise", () => {
    expect(quelqueChoseAPerdre("", empreinteDeLAtelier(CHAMPS))).toBe(false);
    expect(quelqueChoseAPerdre(null, empreinteDeLAtelier(CHAMPS))).toBe(false);
  });

  it("laisse fermer quand rien n a bouge", () => {
    const p = empreinteDeLAtelier(CHAMPS);
    expect(quelqueChoseAPerdre(p, p)).toBe(false);
  });

  it("retient quand un champ a bouge", () => {
    const avant = empreinteDeLAtelier(CHAMPS);
    const apres = empreinteDeLAtelier({ ...CHAMPS, editNotes: "une note" });
    expect(quelqueChoseAPerdre(avant, apres)).toBe(true);
  });

  /* REVENIR EN ARRIERE N EST PAS UNE MODIFICATION. Taper puis effacer
     doit laisser fermer sans confirmation. */
  it("laisse fermer quand une saisie a ete annulee a la main", () => {
    const avant = empreinteDeLAtelier(CHAMPS);
    const apres = empreinteDeLAtelier({ ...CHAMPS, editNotes: "" });
    expect(quelqueChoseAPerdre(avant, apres)).toBe(false);
  });
});
