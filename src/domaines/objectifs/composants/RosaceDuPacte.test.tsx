import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RosaceDuPacte, _couronnes } from "./RosaceDuPacte";

/* LE SCEAU SE CONSTRUIT DECLARATION PAR DECLARATION.
 *
 * Il ne se construisait pas : il apparaissait d un bloc au dernier
 * ecran de la forge. Deux causes distinctes, l une dans la structure,
 * l autre dans le rendu.
 *
 *   1. « rosaceDuPacte » sortait par un retour anticipe des que le nom
 *      etait vide — et le nom est la DERNIERE declaration. Les valeurs
 *      etaient donc toujours jurees avant lui : leurs medaillons
 *      n existaient pas tant qu on n avait pas nomme le pacte.
 *   2. L etoile, le moyeu et les graduations se dessinaient des le
 *      premier ecran, avant qu on ait rien choisi.
 *
 * ON MESURE LES COUCHES, PAS LES PIXELS. Chaque couche du dessin porte
 * son nom (« sceau-etoile », « sceau-medaillons »…) ; compter ses
 * enfants dit ce qui est tracé sans rien supposer de l apparence.
 *
 * Ce test suit l ordre reel de la forge — porteur, signe, valeurs,
 * phrase, nom — parce que c est cet ordre qui a produit le defaut.
 */

/** Ce que la couche « <nom> » a trace. Zero enfant = rien de tracé. */
function couche(hote: HTMLElement, nom: string): number {
  const g = hote.querySelector(`.sceau-${nom}`);
  return g ? g.children.length : -1;
}

interface Declare {
  signe?: boolean;
  valeurs?: string[];
  phrase?: boolean;
  nom?: string;
}

function poser({ signe = false, valeurs = [], phrase = false, nom = "" }: Declare) {
  const { container } = render(
    <RosaceDuPacte
      nom={nom}
      valeurs={valeurs}
      revele={{ signe, phrase }}
      progression={0.5}
    />,
  );
  const h = container as HTMLElement;
  return {
    etoile: couche(h, "etoile"),
    moyeu: couche(h, "moyeu"),
    grad: couche(h, "grad"),
    bande: couche(h, "bande"),
    medaillons: couche(h, "medaillons"),
    coeur: couche(h, "coeur"),
  };
}

describe("La rosace du pacte, pendant la forge", () => {
  it("ne trace rien tant que rien n est declare", () => {
    /* Le cadre attend. Il ne ment pas sur ce qu on a jure. */
    const r = poser({});
    expect(r.etoile).toBe(0);
    expect(r.moyeu).toBe(0);
    expect(r.grad).toBe(0);
    expect(r.bande).toBe(0);
    expect(r.medaillons).toBe(0);
    expect(r.coeur).toBe(0);
  });

  it("LE SIGNE allume l etoile et le moyeu, et rien d autre", () => {
    const r = poser({ signe: true });
    expect(r.etoile).toBeGreaterThan(0);
    expect(r.moyeu).toBeGreaterThan(0);
    expect(r.coeur).toBeGreaterThan(0);
    expect(r.medaillons).toBe(0);
    expect(r.bande).toBe(0);
  });

  it("LES VALEURS posent leurs medaillons — sans attendre le nom", () => {
    /* LE DEFAUT ETAIT ICI. Le nom vient apres les valeurs dans la
       forge ; un sceau qui exige le nom pour montrer les valeurs ne
       montre jamais les valeurs a leur ecran. */
    const avant = poser({ signe: true });
    const apres = poser({ signe: true, valeurs: ["Liberté", "Discipline", "Clarté"] });
    expect(avant.medaillons).toBe(0);
    expect(apres.medaillons).toBeGreaterThan(0);
    /* Sans nom : ni bande ni couronne de graduations. */
    expect(apres.bande).toBe(0);
  });

  it("LA PHRASE ouvre les graduations", () => {
    const avant = poser({ signe: true, valeurs: ["Liberté"] });
    const apres = poser({ signe: true, valeurs: ["Liberté"], phrase: true });
    expect(avant.grad).toBe(0);
    expect(apres.grad).toBeGreaterThan(0);
  });

  it("LE NOM ferme la figure : la bande, et elle seule, est ce qui manquait", () => {
    const sansNom = poser({ signe: true, valeurs: ["Liberté", "Discipline"], phrase: true });
    const avecNom = poser({ signe: true, valeurs: ["Liberté", "Discipline"], phrase: true, nom: "Ananta" });
    expect(sansNom.bande).toBe(0);
    expect(avecNom.bande).toBeGreaterThan(0);
    /* Ce qui etait deja la y est reste. */
    expect(avecNom.medaillons).toBeGreaterThanOrEqual(sansNom.medaillons);
    expect(avecNom.etoile).toBeGreaterThan(0);
    expect(avecNom.grad).toBeGreaterThan(0);
  });

  it("CHAQUE DECLARATION AJOUTE, AUCUNE NE RETIRE", () => {
    /* La preuve de la progressivite : le total ne redescend jamais le
       long de la forge. Un sceau qui perdrait des traits en avançant
       ne se construirait pas, il clignoterait. */
    const forge: Declare[] = [
      {},
      { signe: true },
      { signe: true, valeurs: ["Liberté", "Discipline", "Clarté"] },
      { signe: true, valeurs: ["Liberté", "Discipline", "Clarté"], phrase: true },
      { signe: true, valeurs: ["Liberté", "Discipline", "Clarté"], phrase: true, nom: "Ananta" },
    ];
    const totaux = forge.map((d) => {
      const r = poser(d);
      return r.etoile + r.moyeu + r.grad + r.bande + r.medaillons + r.coeur;
    });
    for (let i = 1; i < totaux.length; i++) {
      expect(totaux[i]).toBeGreaterThan(totaux[i - 1]);
    }
  });
});

/* LES COURONNES NE SE COUPENT PAS — verifie, plus seulement promis.
 *
 * La table des rayons affirme depuis le debut que « chaque famille a
 * la sienne, et n en sort pas ». C etait faux pour l etoile : sa
 * pointe tombait a 0,345 quand le disque du medaillon commence a
 * 0,328, et son contour de 2,4 px non mis a l echelle ajoutait encore
 * 0,011. Elle mordait de 3,0 px — et comme elle tourne, chacune de ses
 * pointes balayait tour a tour chaque medaillon.
 *
 * L etoile est la SEULE couche qui pouvait deborder : toutes les
 * autres se dessinent avant les medaillons et sont proprement percees
 * par leur disque, qui est plein. Elle passe apres, donc par-dessus.
 */
describe("Les couronnes du sceau", () => {
  /** La moitie d un trait non mis a l echelle, en unites du viewBox. */
  const enUnites = (px: number) => (px / 2) / (253 / 2.4);

  it("L ETOILE RESTE HORS DES DISQUES DES MEDAILLONS", () => {
    const { medaillon, medaillonRayon, etoile, etoileTrait } = _couronnes;
    const bordDuDisque = medaillon - medaillonRayon;
    const bordDeLEtoile = etoile + enUnites(etoileTrait);
    expect(bordDeLEtoile).toBeLessThan(bordDuDisque);
    /* Et pas de justesse : une garde d au moins deux pixels, sinon le
       contact revient au premier reglage de rayon. */
    expect((bordDuDisque - bordDeLEtoile) * (253 / 2.4)).toBeGreaterThan(2);
  });

  it("le coeur reste sous l etoile, qui le couvre", () => {
    /* L etoile rayonne DE DERRIERE le coeur : ses sommets interieurs
       doivent rester dans le disque du coeur, qui est plein. */
    const { etoile, coeur } = _couronnes;
    expect(etoile * 0.38).toBeLessThan(coeur);
  });

  it("les pointes exterieures restent detachees de l anneau de garde", () => {
    const { pointe, pointeEcart, pointeLong } = _couronnes;
    expect(pointeEcart).toBeGreaterThan(0);
    /* Et rien ne sort du viewBox, qui s arrete a 1,2. */
    expect(pointe + pointeEcart + pointeLong).toBeLessThan(1.2);
  });
});
