import { describe, expect, it } from "vitest";
import {
  AVANT_ECRITURE, DELAI_DEMONSTRATION, DELAI_FOCUS, DUREE_EXPLOSION,
  DUREE_EXPLOSION_IMMOBILE, DUREE_IMPLOSION, DUREE_MESSAGE_RUPTURE, DUREE_SINGULARITE,
  DUREE_SORTIE, IMAGES_MAX_DE_RETOUR, PAS_DE_RETOUR, PHASES_DE_SEQUENCE, SEUIL_DE_RUPTURE,
  apresEcriture, cleDeLAnnonce, cleDuMessage, dureeDeLaConclusion, enSequence,
  imagesDeRetour, priseTenable, retourDe, ruptureAuRelachement, type Phase,
} from "./sequence";
import { DUREE, avancementDuRituel } from "./rituel";

const TOUTES: Phase[] = [
  "attente", "montee", "critique",
  "implosion", "singularite", "explosion", "revelation", "verrouille",
];

describe("quand la sequence a pris la main", () => {
  it("reconnait les quatre phases de la conclusion", () => {
    expect(PHASES_DE_SEQUENCE).toEqual(["implosion", "singularite", "explosion", "revelation"]);
    for (const p of PHASES_DE_SEQUENCE) expect(enSequence(p)).toBe(true);
  });

  it("laisse les quatre autres phases hors sequence", () => {
    for (const p of ["attente", "montee", "critique", "verrouille"] as Phase[]) {
      expect(enSequence(p)).toBe(false);
    }
  });

  it("couvre les huit phases, sans en oublier ni en inventer", () => {
    expect(TOUTES.filter(enSequence)).toEqual(PHASES_DE_SEQUENCE);
    expect(TOUTES).toHaveLength(8);
  });
});

describe("la prise tenable", () => {
  /* TROIS CONDITIONS, ET CHACUNE SUFFIT A REFUSER. « pret » est la
     premiere : tant que la ligne du pacte n est pas lue, on ne sait pas
     si l appel du jour est deja fait, et laisser tenir ferait un second
     appel refuse en silence. */
  it("n accepte que si tout est reuni", () => {
    expect(priseTenable(true, "attente")).toBe(true);
    expect(priseTenable(true, "montee")).toBe(true);
    expect(priseTenable(true, "critique")).toBe(true);
  });

  it("refuse tant que la ligne n est pas lue", () => {
    for (const p of TOUTES) expect(priseTenable(false, p)).toBe(false);
  });

  it("refuse quand l appel du jour est deja fait", () => {
    expect(priseTenable(true, "verrouille")).toBe(false);
  });

  it("refuse pendant toute la conclusion", () => {
    for (const p of PHASES_DE_SEQUENCE) expect(priseTenable(true, p)).toBe(false);
  });
});

describe("le deroule de la conclusion", () => {
  it("joue l effondrement puis le point, avant d ecrire", () => {
    expect(AVANT_ECRITURE).toEqual([
      { phase: "implosion", attente: DUREE_IMPLOSION },
      { phase: "singularite", attente: DUREE_SINGULARITE },
    ]);
    expect(DUREE_IMPLOSION).toBe(500);
    expect(DUREE_SINGULARITE).toBe(200);
  });

  /* SEPT DIXIEMES DE SECONDE SEPARENT LA FIN DE L APPUI DE LA REQUETE.
     Pendant ce temps, quitter la page n annule rien : la course etait
     finie, l appel sera ecrit. C est le seul endroit du rituel ou la
     page peut disparaitre sans empecher une ecriture. */
  it("laisse sept dixiemes de seconde avant la requete", () => {
    expect(AVANT_ECRITURE.reduce((s, e) => s + e.attente, 0)).toBe(700);
  });

  it("joue le souffle puis la revelation, apres l ecriture", () => {
    expect(apresEcriture(false)).toEqual([
      { phase: "explosion", attente: DUREE_EXPLOSION },
      { phase: "revelation", attente: 0 },
    ]);
  });

  /* LE SOUFFLE DURE CINQ FOIS PLUS LONGTEMPS SANS MOUVEMENT. Sans
     a-coup, une onde d un dixieme de seconde ne se voit pas passer. */
  it("etire le souffle quand le mouvement est reduit", () => {
    expect(DUREE_EXPLOSION).toBe(100);
    expect(DUREE_EXPLOSION_IMMOBILE).toBe(500);
    expect(apresEcriture(true)[0].attente).toBe(DUREE_EXPLOSION_IMMOBILE);
    expect(apresEcriture(true)[0].attente / apresEcriture(false)[0].attente).toBe(5);
  });

  /* LA REVELATION N A PAS DE DUREE. Elle restait trois secondes puis
     s effacait toute seule ; ce qu on vient de gagner ne doit pas etre
     chasse par une minuterie. Une attente nulle, c est un bouton qui
     la quitte. */
  it("ne met aucune minuterie sur la revelation", () => {
    for (const immobile of [false, true]) {
      const derniere = apresEcriture(immobile).at(-1);
      expect(derniere?.phase).toBe("revelation");
      expect(derniere?.attente).toBe(0);
    }
  });

  it("compte huit dixiemes de seconde en tout, douze sans mouvement", () => {
    expect(dureeDeLaConclusion(false)).toBe(800);
    expect(dureeDeLaConclusion(true)).toBe(1200);
  });

  it("enchaine les quatre phases dans l ordre", () => {
    const ordre = [...AVANT_ECRITURE, ...apresEcriture(false)].map((e) => e.phase);
    expect(ordre).toEqual(PHASES_DE_SEQUENCE);
  });

  /* CHAQUE APPEL REND SES PROPRES ETAPES : deux conclusions qui se
     suivent ne partagent aucun objet. */
  it("ne rend pas deux fois le meme tableau", () => {
    expect(apresEcriture(false)).not.toBe(apresEcriture(false));
    expect(apresEcriture(false)).toEqual(apresEcriture(false));
  });

  it("nomme les trois minuteries qui restent", () => {
    expect(DUREE_SORTIE).toBe(620);
    expect(DELAI_FOCUS).toBe(900);
    expect(DELAI_DEMONSTRATION).toBe(50);
    /* Le clavier reprend la main APRES que la revelation soit posee. */
    expect(DELAI_FOCUS).toBeGreaterThan(dureeDeLaConclusion(false) - 700);
  });
});

describe("lacher la prise", () => {
  it("ne disperse rien sur un faux depart", () => {
    expect(ruptureAuRelachement(0)).toBe(false);
    expect(ruptureAuRelachement(0.01)).toBe(false);
  });

  /* LA COMPARAISON EST STRICTE : cinq pour cent pile n est pas encore
     une rupture. Une image de plus, et elle en devient une. */
  it("compte a partir de cinq pour cent, exclus", () => {
    expect(SEUIL_DE_RUPTURE).toBe(0.05);
    expect(ruptureAuRelachement(0.05)).toBe(false);
    expect(ruptureAuRelachement(0.050001)).toBe(true);
    expect(ruptureAuRelachement(1)).toBe(true);
  });
});

describe("le retour a zero", () => {
  it("retire cinq centiemes par image", () => {
    expect(PAS_DE_RETOUR).toBe(0.05);
    expect(retourDe(1)).toBeCloseTo(0.95, 12);
    expect(retourDe(0.5)).toBeCloseTo(0.45, 12);
  });

  it("s arrete a zero, jamais en dessous", () => {
    expect(retourDe(0.02)).toBe(0);
    expect(retourDe(0)).toBe(0);
  });

  /* LA BORNE DE CETTE BOUCLE N EST PAS DECORATIVE. Ecrite sans borne,
     elle a fait PENDRE le balayage de mutations : la mutation qui
     remplace la soustraction par une addition rend une descente qui
     remonte, et une boucle synchrone que vitest ne peut pas
     interrompre. Un test doit echouer, jamais pendre. */
  it("descend en vingt images depuis le sommet", () => {
    expect(imagesDeRetour(1)).toBe(20);
    let p = 1, images = 0;
    while (p > 0 && images < IMAGES_MAX_DE_RETOUR) { p = retourDe(p); images++; }
    expect(p).toBe(0);
    expect(images).toBe(20);
  });

  /* CINQ CENTIEMES NE SE SOUSTRAIENT PAS PROPREMENT.
   *
   * Depuis 0,2 la descente laisse 1,39e-17 apres quatre images : encore
   * strictement positif, donc une cinquieme image. La division en
   * annonce quatre — elle se trompe pour dix valeurs de depart sur
   * cent. C est pour cela que ce compte SIMULE au lieu de diviser. */
  it("compte une image de plus que la division, sur dix departs sur cent", () => {
    let desaccords = 0;
    for (let i = 0; i <= 100; i++) {
      const p = i / 100;
      if (imagesDeRetour(p) !== Math.ceil(p / PAS_DE_RETOUR)) desaccords++;
    }
    expect(desaccords).toBe(10);
    expect(imagesDeRetour(0.2)).toBe(5);
    expect(Math.ceil(0.2 / PAS_DE_RETOUR)).toBe(4);
    expect(imagesDeRetour(0.5)).toBe(11);
    expect(Math.floor(0.5 / PAS_DE_RETOUR)).toBe(10);
  });

  /* LE RESIDU SE VOIT A L ECRAN, UNE IMAGE. La boucle de la page
     continue tant que `p > 0`, et le compte a rebours s affiche des que
     `p > 0` : sur cette derniere image, l ecran reaffiche « 20.0s »
     pendant un seizieme de seconde. Constate, non corrige. */
  it("laisse un residu strictement positif avant la derniere image", () => {
    let p = 0.2;
    for (let i = 0; i < 4; i++) p = retourDe(p);
    expect(p).toBeGreaterThan(0);
    expect(p).toBeLessThan(1e-16);
    expect(retourDe(p)).toBe(0);
  });

  it("ne compte rien depuis zero, une image depuis le seuil", () => {
    expect(imagesDeRetour(0)).toBe(0);
    expect(imagesDeRetour(PAS_DE_RETOUR)).toBe(1);
  });

  /* LA BORNE DU COMPTE NE SERT A RIEN AUJOURD HUI, ET ON LA GARDE.
   *
   * Le balayage de mutations y a survecu — la retirer ne change aucun
   * resultat. C est du code DOMINE par la propriete testee ici : le pas
   * fait STRICTEMENT descendre, donc la boucle finit toujours. La borne
   * n est pas une decision, c est un filet.
   *
   * CE QUI LA REND VIVANTE, ON L A DEJA VU : un pas qui remonterait.
   * C est exactement la mutation qui, faute de cette borne dans le
   * test, a fait PENDRE le premier balayage au lieu de le faire
   * echouer. La borne existe pour que la prochaine echoue. */
  it("descend strictement, ce qui rend la borne inutile — pour l instant", () => {
    for (let i = 1; i <= 1000; i++) {
      const p = i / 1000;
      expect(retourDe(p)).toBeLessThan(p);
    }
    expect(retourDe(1e-18)).toBe(0);
    expect(IMAGES_MAX_DE_RETOUR).toBeGreaterThan(imagesDeRetour(1));
  });

  /* LES DEUX MOITIES DE LA MEME JAUGE N ONT PAS LA MEME HORLOGE.
   *
   * La MONTEE se calcule sur le temps ecoule : vingt secondes font un,
   * sur n importe quel ecran. La DESCENTE se compte en images : vingt
   * images, quelle que soit leur duree. Monter est donc identique
   * partout, redescendre non — et cela ne se voit dans aucun des deux
   * fichiers pris separement. */
  it("monte au temps et redescend a l image", () => {
    const depart = 1_000_000;
    for (const duree of [1000 / 60, 1000 / 144]) {
      /* La montee ignore la cadence d images : seul l instant compte. */
      expect(avancementDuRituel(depart + DUREE, depart, 1)).toBe(1);
      expect(avancementDuRituel(depart + DUREE / 2, depart, 1)).toBeCloseTo(0.5, 12);
      /* La descente, elle, ne connait que le nombre d images. */
      expect(imagesDeRetour(1) * duree).toBeCloseTo(20 * duree, 10);
    }
    expect(imagesDeRetour(1) * (1000 / 60)).toBeCloseTo(333.33, 2);
    expect(imagesDeRetour(1) * (1000 / 144)).toBeCloseTo(138.89, 2);
  });

  /* LA DESCENTE SE COMPTE EN IMAGES, PAS EN SECONDES : sur un ecran a
   * cent quarante-quatre hertz elle prend deux fois moins de temps que
   * sur un ecran a soixante. Constate, non corrige — la faire dependre
   * du temps ecoule changerait ce que l ecran montre. */
  it("dure deux fois moins longtemps sur un ecran rapide", () => {
    const secondes = (hertz: number) => imagesDeRetour(1) / hertz;
    expect(secondes(60)).toBeCloseTo(0.3333, 4);
    expect(secondes(144)).toBeCloseTo(0.1389, 4);
    expect(secondes(60) / secondes(144)).toBeCloseTo(2.4, 10);
  });

  it("laisse le message de rupture deux secondes et demie", () => {
    expect(DUREE_MESSAGE_RUPTURE).toBe(2500);
    /* Le message survit largement a la descente de la jauge. */
    expect(DUREE_MESSAGE_RUPTURE / 1000).toBeGreaterThan(imagesDeRetour(1) / 60);
  });
});

describe("les deux echelles de texte", () => {
  it("dit ce qu il faut a l ecran, phase par phase", () => {
    expect(cleDuMessage("attente", false)).toBe("thecall.awaiting");
    expect(cleDuMessage("montee", false)).toBe("thecall.rising");
    expect(cleDuMessage("critique", false)).toBe("thecall.critical");
  });

  /* « RELACHE TOT » PASSE DEVANT TOUT LE RESTE, meme la phase
     critique : c est le seul texte qui reagit a un geste plutot qu a
     un etat. */
  it("fait passer le relachement devant la phase", () => {
    for (const p of TOUTES) expect(cleDuMessage(p, true)).toBe("thecall.fading");
  });

  /* A L ARRET, L ECRAN DIT « EN ATTENTE » ALORS QUE L APPEL DU JOUR
     EST DEJA FAIT. Le message n a pas de cas pour « verrouille » ni
     pour la sequence : il retombe sur le defaut. Constate, non
     corrige. */
  it("retombe sur « en attente » pour les cinq autres phases", () => {
    for (const p of ["implosion", "singularite", "explosion", "revelation", "verrouille"] as Phase[]) {
      expect(cleDuMessage(p, false)).toBe("thecall.awaiting");
    }
  });

  it("annonce autre chose que ce qui est ecrit", () => {
    expect(cleDeLAnnonce("montee")).toBe("thecall.syncing");
    expect(cleDuMessage("montee", false)).toBe("thecall.rising");
    expect(cleDeLAnnonce("verrouille")).toBe("thecall.announceDone");
    expect(cleDuMessage("verrouille", false)).toBe("thecall.awaiting");
  });

  it("dit la meme chose que l ecran au moment critique", () => {
    expect(cleDeLAnnonce("critique")).toBe(cleDuMessage("critique", false));
  });

  /* PENDANT TOUTE LA CONCLUSION, LA REGION VIVE SE TAIT. Huit dixiemes
     de seconde d effondrement, de souffle et de revelation ne sont
     annonces par rien ; l achevement ne s entend qu une fois la
     revelation quittee. Constate, non corrige. */
  it("se tait pendant les quatre phases de la conclusion", () => {
    for (const p of PHASES_DE_SEQUENCE) expect(cleDeLAnnonce(p)).toBe("");
  });

  it("se tait aussi au repos", () => {
    expect(cleDeLAnnonce("attente")).toBe("");
  });

  /* « RELACHE TOT » NE S ENTEND JAMAIS : l annonce ne prend pas ce
     drapeau en compte. Un lecteur d ecran ne sait pas que la prise a
     ete perdue. Constate, non corrige. */
  it("n annonce jamais un relachement", () => {
    const annonces = TOUTES.map(cleDeLAnnonce);
    expect(annonces).not.toContain("thecall.fading");
  });

  /* LE TABLEAU ENTIER, POUR QUE L ECART SE LISE D UN COUP. */
  it("tient dans ce tableau, et rien d autre", () => {
    expect(TOUTES.map((p) => [p, cleDuMessage(p, false), cleDeLAnnonce(p)])).toEqual([
      ["attente", "thecall.awaiting", ""],
      ["montee", "thecall.rising", "thecall.syncing"],
      ["critique", "thecall.critical", "thecall.critical"],
      ["implosion", "thecall.awaiting", ""],
      ["singularite", "thecall.awaiting", ""],
      ["explosion", "thecall.awaiting", ""],
      ["revelation", "thecall.awaiting", ""],
      ["verrouille", "thecall.awaiting", "thecall.announceDone"],
    ]);
  });
});
