import { describe, expect, it } from "vitest";
import { DUREE_DU_CODE_MS, generate6DigitCode } from "./totp.ts";
import {
  EXPEDITEUR_PAR_DEFAUT,
  MINUTES_DU_CODE,
  MS_PAR_MINUTE,
  corpsDuCourriel,
  expediteur,
  sujetDuCourriel,
} from "./courriel.ts";

describe("le delai annonce", () => {
  /* LA PHRASE ET LA CONSTANTE SONT LA MEME CHOSE. Le seul test qui
     compte ici : si l une bouge, l autre suit. */
  it("est celui que la constante decide", () => {
    expect(MINUTES_DU_CODE).toBe(DUREE_DU_CODE_MS / MS_PAR_MINUTE);
    expect(corpsDuCourriel("123456")).toContain(`expires in ${MINUTES_DU_CODE} minutes`);
  });

  /* POSER `MINUTES_DU_CODE = 5` A LA MAIN SURVIT AU BALAYAGE, ET C EST
     ATTENDU : au delai d aujourd hui, un cinq ecrit et un cinq calcule
     sont le meme nombre — aucun test ne peut les distinguer. Ce qui
     epingle le lien, ce sont les deux mutations voisines, toutes deux
     attrapees : poser une AUTRE valeur a la main, et deplacer
     `DUREE_DU_CODE_MS` a dix minutes en figeant la phrase. La seconde
     est exactement la panne que ce module existe pour empecher. */
  it("vaut cinq minutes aujourd hui", () => {
    expect(DUREE_DU_CODE_MS).toBe(300_000);
    expect(MINUTES_DU_CODE).toBe(5);
    expect(corpsDuCourriel("123456")).toContain("This code expires in 5 minutes.");
  });
});

describe("corpsDuCourriel — ce que quelqu un recoit", () => {
  /* L EMPREINTE DU MESSAGE. On ne peut pas relire un courriel apres
     l avoir envoye : ces phrases exactes sont ce qui a ete verifie
     octet pour octet contre l etat d avant le decoupage (1011 octets,
     identiques). Les changer est un acte, pas un effet de bord. */
  it("porte les phrases exactes d avant le decoupage", () => {
    const html = corpsDuCourriel("123456");
    expect(html).toHaveLength(1011);
    expect(html).toContain('<h1 style="color: #1a1a2e; font-size: 24px; margin: 0;">Pacte</h1>');
    expect(html).toContain("Two-Factor Authentication");
    expect(html).toContain("Your verification code is:");
    expect(html).toContain("This code expires in 5 minutes.<br/>If you didn't request this, you can safely ignore it.");
  });

  it("montre le code une fois et une seule", () => {
    const html = corpsDuCourriel("482913");
    expect(html.split("482913")).toHaveLength(2);
  });

  it("ne garde rien d un envoi a l autre", () => {
    expect(corpsDuCourriel("111111")).not.toContain("222222");
    expect(corpsDuCourriel("111111").replace("111111", "222222")).toBe(corpsDuCourriel("222222"));
  });
});

describe("le code n est pas echappe, et c est sans danger", () => {
  /* LE FAIT BRUT : ce qu on passe entre dans le HTML tel quel. */
  it("insere ce qu on lui donne sans le transformer", () => {
    expect(corpsDuCourriel("<b>x</b>")).toContain("<b>x</b>");
  });

  /* CE QUI REND LE FAIT INOFFENSIF, ET QUI VIT AILLEURS : le seul
     appelant passe `generate6DigitCode()`, qui ne rend que six
     chiffres. Le jour ou un code viendrait d un corps de requete, ce
     test-ci tiendrait toujours et le precedent deviendrait une faille. */
  it("ne recoit que des chiffres de son unique fabricant", () => {
    for (let i = 0; i < 500; i++) {
      const code = generate6DigitCode();
      expect(code).toMatch(/^[0-9]{6}$/);
    }
  });
});

describe("sujetDuCourriel", () => {
  /* LE CODE OUVRE L OBJET : il se lit dans la notification, sans
     ouvrir le message — donc aussi sur un ecran verrouille. */
  it("commence par le code", () => {
    expect(sujetDuCourriel("482913")).toBe("482913 — Your Pacte verification code");
    expect(sujetDuCourriel("482913").startsWith("482913")).toBe(true);
  });

  it("porte un tiret cadratin, pas un trait d union", () => {
    expect(sujetDuCourriel("000000")).toContain("—");
    expect(sujetDuCourriel("000000")).not.toContain(" - ");
  });
});

describe("expediteur — le repli", () => {
  it("prend l adresse configuree quand il y en a une", () => {
    expect(expediteur("Pacte <no-reply@exemple.fr>")).toBe("Pacte <no-reply@exemple.fr>");
  });

  it("retombe sur le defaut quand rien n est configure", () => {
    expect(expediteur(undefined)).toBe(EXPEDITEUR_PAR_DEFAUT);
    expect(expediteur(null)).toBe(EXPEDITEUR_PAR_DEFAUT);
  });

  /* C EST `||` ET NON `??`, ET LA DIFFERENCE SE VOIT ICI : une
     variable d environnement declaree mais vide — la ligne
     `RESEND_FROM_EMAIL=` d un `.env` — retombe sur le defaut. Avec
     `??`, le courriel partirait avec un expediteur vide et Resend le
     refuserait sans qu on sache pourquoi. */
  it("retombe sur le defaut pour une adresse vide", () => {
    expect(expediteur("")).toBe(EXPEDITEUR_PAR_DEFAUT);
    expect(EXPEDITEUR_PAR_DEFAUT).toBe("Pacte <onboarding@resend.dev>");
  });

  /* CE QU IL NE FAIT PAS : il ne verifie pas la forme. Une valeur
     posee mais absurde part telle quelle, et l echec arrivera chez
     Resend, pas ici. */
  it("ne verifie pas ce qu on lui donne", () => {
    expect(expediteur("   ")).toBe("   ");
    expect(expediteur("pas une adresse")).toBe("pas une adresse");
  });
});
