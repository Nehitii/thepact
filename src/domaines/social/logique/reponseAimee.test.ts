/* CE QU ON AFFICHE AVANT QUE LE SERVEUR REPONDE.
 *
 * Un compteur optimiste se trompe sans bruit : il descend sous zero,
 * il double au second clic, ou il corrige la liste partagee sur place
 * et il ne reste plus rien a remettre si la base refuse. Aucune de ces
 * trois fautes ne casse quoi que ce soit — elles affichent seulement
 * un chiffre faux, ce qui est exactement ce qu on ne verra pas.
 */
import { describe, expect, it } from "vitest";
import {
  apresLeGeste, compteAMontrer, gesteAttendu, type ReponseAimable,
} from "./reponseAimee";

const rep = (id: string, likes = 0, aimee = false): ReponseAimable =>
  ({ id, likes_count: likes, aimee_par_moi: aimee });

describe("gesteAttendu : un bouton, deux gestes", () => {
  it("pose quand ce n est pas encore aime", () => {
    expect(gesteAttendu(rep("a"))).toBe(true);
    expect(gesteAttendu({ id: "a" })).toBe(true);
    expect(gesteAttendu({ id: "a", aimee_par_moi: null })).toBe(true);
  });

  it("retire quand c est deja aime", () => {
    expect(gesteAttendu(rep("a", 3, true))).toBe(false);
  });
});

describe("apresLeGeste", () => {
  const liste = [rep("a", 2), rep("b", 0, true), rep("c", 7)];

  it("pose : le compte monte, la marque suit", () => {
    const apres = apresLeGeste(liste, "a", true);
    expect(apres[0]).toEqual({ id: "a", likes_count: 3, aimee_par_moi: true });
  });

  it("retire : le compte descend, la marque suit", () => {
    const apres = apresLeGeste([rep("a", 4, true)], "a", false);
    expect(apres[0]).toEqual({ id: "a", likes_count: 3, aimee_par_moi: false });
  });

  it("NE DESCEND PAS SOUS ZERO", () => {
    /* Deux onglets ouverts, un cache un peu vieux, et le retrait
       s applique a un compteur deja a zero. « -1 j aime » est un
       chiffre que personne ne devrait voir. */
    expect(apresLeGeste([rep("a", 0, true)], "a", false)[0].likes_count).toBe(0);
    expect(apresLeGeste<ReponseAimable>([{ id: "a" }], "a", false)[0].likes_count).toBe(0);
  });

  it("ne touche qu a la reponse designee", () => {
    const apres = apresLeGeste(liste, "a", true);
    expect(apres[1]).toBe(liste[1]);
    expect(apres[2]).toBe(liste[2]);
  });

  it("NE MODIFIE PAS la liste recue — le cache est partage", () => {
    /* La corriger sur place ferait mentir toute vue qui la lit deja,
       et le retour arriere n aurait plus rien a restaurer. */
    const avant = JSON.stringify(liste);
    const apres = apresLeGeste(liste, "a", true);
    expect(JSON.stringify(liste)).toBe(avant);
    expect(apres).not.toBe(liste);
  });

  it("un identifiant inconnu ne touche a rien", () => {
    expect(apresLeGeste(liste, "zzz", true)).toEqual(liste);
  });

  it("un compte absent part de zero", () => {
    expect(apresLeGeste<ReponseAimable>([{ id: "a" }], "a", true)[0].likes_count).toBe(1);
  });

  it("l aller-retour ramene exactement au depart", () => {
    const depart = [rep("a", 5)];
    const pose = apresLeGeste(depart, "a", true);
    const retire = apresLeGeste(pose, "a", false);
    expect(retire[0]).toEqual({ id: "a", likes_count: 5, aimee_par_moi: false });
  });
});

describe("compteAMontrer : zero ne se montre pas", () => {
  it("rend le compte des qu il y en a un", () => {
    expect(compteAMontrer(rep("a", 1))).toBe(1);
    expect(compteAMontrer(rep("a", 42))).toBe(42);
  });

  it("se tait a zero, et quand il n y a rien", () => {
    /* Un « 0 » a cote de chaque commentaire est du bruit : il occupe
       la place, il se lit comme une note, et il ne rapporte rien. */
    expect(compteAMontrer(rep("a", 0))).toBeNull();
    expect(compteAMontrer({ id: "a" })).toBeNull();
    expect(compteAMontrer({ id: "a", likes_count: null })).toBeNull();
  });
});
