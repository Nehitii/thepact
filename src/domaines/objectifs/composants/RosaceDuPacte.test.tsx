import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RosaceDuPacte, _couronnes } from "./RosaceDuPacte";

/* LE CERCLE SE CONSTRUIT DECLARATION PAR DECLARATION.
 *
 * Il ne se construisait pas : il apparaissait d un bloc au dernier
 * ecran de la forge — anneaux nus pendant quatre ecrans, puis la
 * figure entiere d un seul geste. On ne voyait pas ce qu on
 * fabriquait, on le decouvrait a la fin.
 *
 * ON MESURE LES COUCHES, PAS LES PIXELS. Chaque couche du dessin porte
 * son nom (« sceau-etoile », « sceau-medaillons »…) ; compter ses
 * enfants dit ce qui est trace sans rien supposer de l apparence.
 *
 * Ce test suit l ordre reel de la forge — porteur, signe, valeurs,
 * phrase, nom — parce que c est cet ordre qui a produit le defaut.
 */

/** Ce que la couche « <nom> » a trace. Zero enfant = rien de trace. */
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
    <RosaceDuPacte nom={nom} valeurs={valeurs} revele={{ signe, phrase }} progression={0.5} />,
  );
  const h = container as HTMLElement;
  return {
    construction: couche(h, "construction"),
    inscription: couche(h, "bande"),
    graduations: couche(h, "grad"),
    polygone: couche(h, "etoile"),
    medaillons: couche(h, "medaillons"),
    centre: couche(h, "coeur"),
  };
}

describe("Le cercle du pacte, pendant la forge", () => {
  it("ne trace rien tant que rien n est declare", () => {
    /* Le cadre attend. Il ne ment pas sur ce qu on a jure. */
    const r = poser({});
    expect(r.construction).toBe(0);
    expect(r.inscription).toBe(0);
    expect(r.graduations).toBe(0);
    expect(r.polygone).toBe(0);
    expect(r.medaillons).toBe(0);
    expect(r.centre).toBe(0);
  });

  it("LE SIGNE ouvre le polygone, ses noeuds et le centre", () => {
    const r = poser({ signe: true });
    expect(r.polygone).toBeGreaterThan(0);
    expect(r.centre).toBeGreaterThan(0);
    expect(r.construction).toBeGreaterThan(0);
    /* Les sommets sans valeur portent deja leur noeud : la figure est
       fermee avant meme qu on ait jure quoi que ce soit. */
    expect(r.medaillons).toBeGreaterThan(0);
    expect(r.inscription).toBe(0);
  });

  it("LES VALEURS posent leurs medaillons — sans attendre le nom", () => {
    /* LE DEFAUT ETAIT ICI. Le nom vient apres les valeurs dans la
       forge ; un sceau qui exige le nom pour montrer les valeurs ne
       montre jamais les valeurs a leur ecran. */
    const avant = poser({ signe: true });
    const apres = poser({ signe: true, valeurs: ["Liberté", "Discipline", "Clarté"] });
    expect(apres.medaillons).toBeGreaterThan(avant.medaillons);
    /* Sans nom : pas d inscription. */
    expect(apres.inscription).toBe(0);
  });

  it("LA PHRASE ouvre les graduations", () => {
    const avant = poser({ signe: true, valeurs: ["Liberté"] });
    const apres = poser({ signe: true, valeurs: ["Liberté"], phrase: true });
    expect(avant.graduations).toBe(0);
    expect(apres.graduations).toBeGreaterThan(0);
  });

  it("LE NOM ferme la figure : l inscription, et elle seule, est ce qui manquait", () => {
    const sansNom = poser({ signe: true, valeurs: ["Liberté", "Discipline"], phrase: true });
    const avecNom = poser({ signe: true, valeurs: ["Liberté", "Discipline"], phrase: true, nom: "Ananta" });
    expect(sansNom.inscription).toBe(0);
    expect(avecNom.inscription).toBeGreaterThan(0);
    /* Ce qui etait deja la y est reste. */
    expect(avecNom.polygone).toBeGreaterThan(0);
    expect(avecNom.graduations).toBeGreaterThan(0);
    expect(avecNom.centre).toBeGreaterThan(0);
  });

  it("CHAQUE DECLARATION AJOUTE, AUCUNE NE RETIRE", () => {
    /* La preuve de la progressivite : le total ne redescend jamais le
       long de la forge. Un sceau qui perdrait des traits en avancant ne
       se construirait pas, il clignoterait. */
    const forge: Declare[] = [
      {},
      { signe: true },
      { signe: true, valeurs: ["Liberté", "Discipline", "Clarté"] },
      { signe: true, valeurs: ["Liberté", "Discipline", "Clarté"], phrase: true },
      { signe: true, valeurs: ["Liberté", "Discipline", "Clarté"], phrase: true, nom: "Ananta" },
    ];
    const totaux = forge.map((d) => {
      const r = poser(d);
      return r.construction + r.inscription + r.graduations + r.polygone + r.medaillons + r.centre;
    });
    for (let i = 1; i < totaux.length; i++) {
      expect(totaux[i]).toBeGreaterThan(totaux[i - 1]);
    }
  });
});

/* LES COURONNES NE SE COUPENT PAS — verifie, plus seulement promis.
 *
 * La table des rayons affirme que « chaque famille a la sienne, et n en
 * sort pas ». C etait faux dans la figure precedente : la pointe de
 * l etoile tombait a 0,345 quand le disque du medaillon commencait a
 * 0,328, et son contour de 2,4 px non mis a l echelle ajoutait encore
 * 0,011. Elle mordait de trois pixels, et comme elle tournait, chacune
 * de ses pointes balayait tour a tour chaque medaillon.
 */
describe("Les couronnes du sceau", () => {
  const R = _couronnes;
  /** La moitie d un trait non mis a l echelle, en unites du viewBox. */
  const enUnites = (px: number) => (px / 2) / (253 / 2.4);
  const enPixels = (u: number) => u * (253 / 2.4);

  it("L INSCRIPTION TIENT ENTRE SES DEUX FILETS", () => {
    /* Une lettre est haute de « R.lettre » et centree sur son rayon :
       elle deborde donc de la moitie de chaque cote. Si elle mord sur
       un filet, la ligne se salit tout autour du cercle. */
    const haut = R.inscription + R.lettre / 2;
    const bas = R.inscription - R.lettre / 2;
    expect(haut).toBeLessThan(R.garde);
    expect(bas).toBeGreaterThan(R.filetHaut);
  });

  it("LES MEDAILLONS NE MORDENT NI SUR L INSCRIPTION NI SUR LE CENTRE", () => {
    /* Ils sont poses sur les sommets du polygone : leur disque s etend
       de part et d autre de ce rayon. */
    const dehors = R.polygone + R.medaillonRayon + enUnites(1.8);
    const dedans = R.polygone - R.medaillonRayon - enUnites(1.8);
    /* Ils peuvent chevaucher un filet — leur disque est plein et le
       perce proprement, c est ce que font les references. Mais pas les
       LETTRES : un medaillon pose sur du texte le hache. */
    expect(dehors).toBeLessThan(R.inscription - R.lettre / 2);
    expect(dedans).toBeGreaterThan(R.filetBas);
    expect(dedans).toBeGreaterThan(R.coeur);
  });

  it("LE CENTRE SERTIT LE LOGO SANS LE TOUCHER", () => {
    /* MESURE : le logo du pacte fait 0,606 unite de large. Le disque en
       faisait 0,56 — le logo le couvrait entierement, et le caractere
       qu on y posait n etait visible nulle part. A 0,34 il deborde tout
       autour, et ce debord doit rester visible : au moins deux pixels. */
    const LOGO = 0.606;
    expect(R.coeur * 2).toBeGreaterThan(LOGO);
    expect(enPixels(R.coeur - LOGO / 2)).toBeGreaterThan(2);
    /* Et il reste sous les graduations, qui l entourent. */
    expect(R.coeur).toBeLessThan(R.filetBasDeux);
  });

  it("les pointes exterieures restent detachees, et dans le viewBox", () => {
    expect(R.pointeEcart).toBeGreaterThan(0);
    expect(enPixels(R.pointeEcart)).toBeGreaterThan(2);
    expect(R.pointe + R.pointeEcart + R.pointeLong).toBeLessThan(1.2);
  });

  it("la piste de progression passe sous l anneau de garde", () => {
    /* Elle fait 3,4 px de large : sa moitie doit tenir sous la garde,
       sinon la jauge deborde du cadre. */
    expect(R.piste + enUnites(3.4)).toBeLessThanOrEqual(R.garde + enUnites(0.8));
  });
});
