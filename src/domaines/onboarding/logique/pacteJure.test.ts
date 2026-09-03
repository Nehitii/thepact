/* CE QUE LE SECOND PASSAGE RETROUVE, ET CE QU IL NE RETROUVE PAS.
 *
 * Le rite abrege etait inatteignable ; en le branchant, le vrai risque
 * n est plus qu on n y arrive pas, c est qu on y arrive LES MAINS
 * VIDES : « useSceller » fait un upsert sur le pacte et REMPLACE les
 * valeurs. Un etat mal repris n echoue pas — il ecrase le pacte en
 * silence, et le sceau change de dessin.
 */
import { describe, expect, it } from "vitest";
import { etatDuPacteJure, type PacteRelu } from "./pacteJure";
import { pacteDeclare, pretASceller } from "./rite";

const relu = (p: Partial<PacteRelu> = {}): PacteRelu => ({
  nomDuPorteur: "Nehiti",
  nom: "Ananta",
  mantra: "Tenir ce qui est jure",
  symbole: "flame",
  couleur: "violet",
  valeurs: ["Liberté", "Discipline", "Création"],
  ...p,
});

describe("etatDuPacteJure : on repart de ce qui a ete jure", () => {
  it("reprend le nom, la phrase, le signe, la teinte et les valeurs", () => {
    const e = etatDuPacteJure(relu());
    expect(e.nomDuPorteur).toBe("Nehiti");
    expect(e.nomDuPacte).toBe("Ananta");
    expect(e.mantra).toBe("Tenir ce qui est jure");
    expect(e.symbole).toBe("flame");
    expect(e.couleur).toBe("violet");
    expect(e.valeurs).toEqual(["Liberté", "Discipline", "Création"]);
  });

  it("GARDE L ORDRE DES VALEURS : c est lui qui dessine la corde du sceau", () => {
    /* Deux porteurs qui ont choisi les memes valeurs dans un ordre
       different n ont pas le meme sceau. Relire trie autrement
       redessinerait un sceau que personne n a jure. */
    const e = etatDuPacteJure(relu({ valeurs: ["Création", "Liberté", "Discipline"] }));
    expect(e.valeurs).toEqual(["Création", "Liberté", "Discipline"]);
  });

  it("NE REPREND NI LE CONSENTEMENT NI LA SIGNATURE", () => {
    /* Jurer de nouveau est le sujet meme du second passage : un
       consentement recopie n en serait pas un. */
    const e = etatDuPacteJure(relu());
    expect(e.clausesAcceptees).toBe(false);
    expect(e.signe).toBe(false);
  });

  it("ne reprend pas d objectif : le rite abrege saute la rencontre", () => {
    expect(etatDuPacteJure(relu()).objectif).toBeNull();
  });

  it("rend un pacte DECLARE mais pas encore pret a sceller", () => {
    /* La distinction est tout l interet : il y a de quoi sceller, et il
       reste a le vouloir. */
    const e = etatDuPacteJure(relu());
    expect(pacteDeclare(e)).toBe(true);
    expect(pretASceller(e)).toBe(false);
  });

  it("survit a une base qui rend des nuls, sans inventer de valeur par defaut", () => {
    /* Un pacte sans signe ne doit pas revenir « flame » : ce serait le
       defaut deguise en choix qu on vient de supprimer. */
    const e = etatDuPacteJure({
      nomDuPorteur: null, nom: null, mantra: null,
      symbole: null, couleur: null, valeurs: [],
    });
    expect(e.nomDuPacte).toBe("");
    expect(e.symbole).toBe("");
    expect(e.couleur).toBe("");
    expect(pacteDeclare(e)).toBe(false);
  });

  it("copie les valeurs plutot que de les partager", () => {
    /* Le tableau vient d une reponse en cache : le muter depuis le rite
       modifierait ce que le cache rendra ensuite. */
    const source = ["Liberté"];
    const e = etatDuPacteJure(relu({ valeurs: source }));
    expect(e.valeurs).not.toBe(source);
  });
});
