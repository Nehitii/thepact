import { describe, expect, it } from "vitest";
import {
  AMPLITUDE_DU_SOUFFLE, apresUneOuverture, apresUneTape, CYCLE_DU_SOUFFLE,
  DEBUT_DE_NUIT, estNuitProfonde, FENETRE_DES_OUVERTURES, FIN_DE_NUIT,
  MS_POUR_UN_APPUI_LONG, MS_POUR_UNE_TAPE, natureDeLAppui,
  OUBLI_DES_TAPES, OUVERTURES_POUR_LE_SECRET, souffle, TAPES_POUR_LE_SECRET,
} from "./noteDuDiable";

describe("estNuitProfonde — elle enjambe minuit", () => {
  /* C EST POUR CELA QUE LE TEST EST UN « OU » : « de 23 h a 4 h » ne
     s ecrit pas « heure >= 23 && heure < 4 », qui n est jamais vrai. */
  it("couvre les deux cotes de minuit", () => {
    expect(estNuitProfonde(23)).toBe(true);
    expect(estNuitProfonde(0)).toBe(true);
    expect(estNuitProfonde(3)).toBe(true);
  });

  it("s arrete a quatre heures, borne exclue", () => {
    expect(estNuitProfonde(FIN_DE_NUIT - 1)).toBe(true);
    expect(estNuitProfonde(FIN_DE_NUIT)).toBe(false);
  });

  it("commence a vingt-trois heures, borne comprise", () => {
    expect(estNuitProfonde(DEBUT_DE_NUIT)).toBe(true);
    expect(estNuitProfonde(DEBUT_DE_NUIT - 1)).toBe(false);
  });

  /* CINQ HEURES SUR VINGT-QUATRE. Si le « ou » devenait un « et »,
     aucune heure ne passerait ; si les bornes s inversaient, dix-neuf
     passeraient. */
  it("couvre exactement cinq heures sur vingt-quatre", () => {
    const nuit = [...Array(24).keys()].filter(estNuitProfonde);
    expect(nuit).toEqual([0, 1, 2, 3, 23]);
  });
});

describe("apresUneTape — sept tapes, puis le compte repart", () => {
  it("compte a partir de un", () => {
    expect(apresUneTape(0)).toEqual({ compte: 1, revele: false });
  });

  it("ne revele rien avant la septieme", () => {
    for (let n = 0; n < TAPES_POUR_LE_SECRET - 1; n++) {
      expect(apresUneTape(n).revele).toBe(false);
    }
  });

  it("revele a la septieme, pas a la sixieme", () => {
    expect(apresUneTape(TAPES_POUR_LE_SECRET - 2).revele).toBe(false);
    expect(apresUneTape(TAPES_POUR_LE_SECRET - 1).revele).toBe(true);
  });

  /* SANS LA REMISE A ZERO, la huitieme tape rouvrirait le secret,
     puis la neuvieme : ce qui devait etre rare deviendrait continu. */
  it("remet le compte a zero en revelant", () => {
    expect(apresUneTape(TAPES_POUR_LE_SECRET - 1)).toEqual({ compte: 0, revele: true });
  });

  it("demande sept tapes de suite pour revenir au secret", () => {
    let compte = 0;
    const revelations: number[] = [];
    for (let tape = 1; tape <= 14; tape++) {
      const suite = apresUneTape(compte);
      compte = suite.compte;
      if (suite.revele) revelations.push(tape);
    }
    expect(revelations).toEqual([7, 14]);
  });

  it("oublie les tapes au bout de deux secondes", () => {
    expect(OUBLI_DES_TAPES).toBe(2000);
  });
});

describe("apresUneOuverture — trois ouvertures en une minute", () => {
  const T = 1_000_000;

  it("garde la premiere ouverture sans rien reveler", () => {
    expect(apresUneOuverture([], T)).toEqual({ horodatages: [T], revele: false });
  });

  it("revele a la troisieme", () => {
    const a = apresUneOuverture([], T);
    const b = apresUneOuverture(a.horodatages, T + 1000);
    const c = apresUneOuverture(b.horodatages, T + 2000);
    expect([a.revele, b.revele, c.revele]).toEqual([false, false, true]);
  });

  /* LA FENETRE GLISSE : trois ouvertures espacees de plus d une
     minute ne revelent rien. */
  it("ne revele rien quand les ouvertures sont trop espacees", () => {
    let etat = apresUneOuverture([], T);
    for (const t of [T + 61_000, T + 122_000]) {
      etat = apresUneOuverture(etat.horodatages, t);
      expect(etat.revele).toBe(false);
      expect(etat.horodatages).toHaveLength(1);
    }
  });

  it("ecarte une ouverture a la milliseconde pres", () => {
    const vieille = T - FENETRE_DES_OUVERTURES;
    expect(apresUneOuverture([vieille], T).horodatages).toEqual([T]);
    expect(apresUneOuverture([vieille + 1], T).horodatages).toEqual([vieille + 1, T]);
  });

  /* LA FENETRE DURE UNE MINUTE, ET ON L ECRIT EN CLAIR.
     Le balayage de mutations a montre ce trou : la retrecir a trente
     secondes passait tous les tests, parce qu ils exprimaient tous
     leurs instants PAR RAPPORT a la constante — la comparer a
     elle-meme ne prouve rien. Une ouverture d il y a quarante-cinq
     secondes doit encore compter. */
  it("dure une minute, pas moins", () => {
    expect(FENETRE_DES_OUVERTURES).toBe(60_000);
    const a = apresUneOuverture([], T);
    const b = apresUneOuverture(a.horodatages, T + 45_000);
    expect(b.horodatages).toHaveLength(2);
    expect(apresUneOuverture(b.horodatages, T + 50_000).revele).toBe(true);
  });

  /* MEME REMISE A ZERO QUE POUR LES TAPES : le secret ne se rouvre
     pas a chaque ouverture suivante. */
  it("vide la liste en revelant", () => {
    expect(apresUneOuverture([T, T + 1], T + 3)).toEqual({ horodatages: [], revele: true });
  });

  it("ne modifie pas la liste qu on lui donne", () => {
    const origine = [T];
    apresUneOuverture(origine, T + 1000);
    expect(origine).toEqual([T]);
  });

  it("demande bien trois ouvertures, pas deux", () => {
    expect(OUVERTURES_POUR_LE_SECRET).toBe(3);
    const a = apresUneOuverture([], T);
    expect(apresUneOuverture(a.horodatages, T + 100).revele).toBe(false);
  });
});

describe("natureDeLAppui — un appui bref est deux choses a la fois", () => {
  /* LES DEUX REPONSES SONT INDEPENDANTES, et ce n est pas un oubli :
     c est ce qui permet aux deux secrets d avancer sur le meme
     geste. */
  it("compte un appui bref comme une tape ET comme une ouverture", () => {
    expect(natureDeLAppui(100)).toEqual({ compteCommeTape: true, ouvreLaFiche: true });
  });

  it("cesse de compter comme une tape a trois cents millisecondes", () => {
    expect(natureDeLAppui(MS_POUR_UNE_TAPE - 1).compteCommeTape).toBe(true);
    expect(natureDeLAppui(MS_POUR_UNE_TAPE).compteCommeTape).toBe(false);
  });

  /* ENTRE LES DEUX SEUILS, l appui ouvre la fiche sans compter comme
     une tape : c est la zone du clic ordinaire. */
  it("ouvre la fiche sans compter comme une tape entre les deux seuils", () => {
    expect(natureDeLAppui(1000)).toEqual({ compteCommeTape: false, ouvreLaFiche: true });
  });

  it("cesse d ouvrir la fiche a six secondes, borne comprise", () => {
    expect(natureDeLAppui(MS_POUR_UN_APPUI_LONG - 1).ouvreLaFiche).toBe(true);
    expect(natureDeLAppui(MS_POUR_UN_APPUI_LONG).ouvreLaFiche).toBe(false);
  });

  it("ne fait rien d un appui tres long", () => {
    expect(natureDeLAppui(10_000)).toEqual({ compteCommeTape: false, ouvreLaFiche: false });
  });

  it("garde les deux seuils dans le bon ordre", () => {
    expect(MS_POUR_UNE_TAPE).toBeLessThan(MS_POUR_UN_APPUI_LONG);
  });

  /* LES DEUX SEUILS SONT ECRITS EN CLAIR, pour la meme raison que la
     fenetre des ouvertures : allonger celui de la tape a cinq cents
     millisecondes passait tous les tests, qui ne le comparaient qu a
     lui-meme. Un appui de quatre cents millisecondes n est PAS une
     tape. */
  it("place la tape a trois cents millisecondes et l appui long a six secondes", () => {
    expect(MS_POUR_UNE_TAPE).toBe(300);
    expect(MS_POUR_UN_APPUI_LONG).toBe(6000);
    expect(natureDeLAppui(400).compteCommeTape).toBe(false);
    expect(natureDeLAppui(200).compteCommeTape).toBe(true);
  });
});

describe("souffle — une lueur qui ne s inverse jamais", () => {
  /* SANS LE RECENTRAGE DU SINUS, la moitie du cycle donnerait une
     intensite NEGATIVE et la lueur s inverserait une seconde sur
     deux. */
  it("ne descend jamais sous zero", () => {
    for (let t = 0; t <= 16; t += 0.25) {
      expect(souffle(t)).toBeGreaterThanOrEqual(0);
    }
  });

  it("ne depasse jamais l amplitude", () => {
    for (let t = 0; t <= 16; t += 0.25) {
      expect(souffle(t)).toBeLessThanOrEqual(AMPLITUDE_DU_SOUFFLE + 1e-12);
    }
  });

  it("part du milieu, monte au sommet au quart du cycle", () => {
    expect(souffle(0)).toBeCloseTo(AMPLITUDE_DU_SOUFFLE / 2, 12);
    expect(souffle(CYCLE_DU_SOUFFLE / 4)).toBeCloseTo(AMPLITUDE_DU_SOUFFLE, 12);
    expect(souffle((CYCLE_DU_SOUFFLE * 3) / 4)).toBeCloseTo(0, 12);
  });

  /* UN CYCLE DE HUIT SECONDES : la valeur revient a l identique. */
  it("boucle sur huit secondes", () => {
    expect(CYCLE_DU_SOUFFLE).toBe(8);
    for (const t of [0, 1.7, 5.25]) {
      expect(souffle(t + CYCLE_DU_SOUFFLE)).toBeCloseTo(souffle(t), 10);
    }
  });

  /* LA VALEUR EST CELLE QUI ETAIT CALCULEE AVANT LA COUPE :
     Math.sin(t * Math.PI / 4) * 0.5 + 0.5, puis * 0.15. */
  it("rend exactement ce que la page calculait avant", () => {
    for (const t of [0, 0.5, 1, 2.3, 7.9]) {
      const avant = (Math.sin((t * Math.PI) / 4) * 0.5 + 0.5) * 0.15;
      expect(souffle(t)).toBeCloseTo(avant, 12);
    }
  });
});
