import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { chercherGeste } from "./gestes";
import type { EtatDuJour } from "@/domaines/mia/types";

/* Le fuseau est fixe : le report calcule une date civile, et cela n a
   de sens que dans un fuseau connu. */
const FUSEAU_AVANT = process.env.TZ;
beforeAll(() => { process.env.TZ = "Europe/Paris"; });
afterAll(() => {
  if (FUSEAU_AVANT === undefined) delete process.env.TZ;
  else process.env.TZ = FUSEAU_AVANT;
});
afterEach(() => { vi.useRealTimers(); });

const etat = (...noms: string[]) => ({
  taches: { prochaines: noms.map((nom, i) => ({ id: "t" + i, nom })) },
} as unknown as EtatDuJour);

const LISTE = etat("Courses", "Réunion équipe", "Réunion client", "Pain de mie");

/* ═══════════════════════════════════════════════════════════════
   CE QU ELLE FAIT SANS DEMANDER LA PERMISSION AU MODELE.

   Chaque geste reconnu ici economise DEUX requetes sur un quota de
   vingt par minute. Mais il agit aussi sur les donnees sans qu un
   modele ait relu l intention : un geste pose sur la mauvaise ligne
   coute plus cher qu un geste refuse.
   ═══════════════════════════════════════════════════════════════ */
describe("quand elle ne fait rien", () => {
  it("ne fait rien sans etat du jour", () => {
    expect(chercherGeste("coche courses", undefined)).toBeNull();
  });

  it("ne fait rien sur une question vide ou sans verbe", () => {
    for (const q of ["", "   ", "bonjour", "raconte moi une blague"]) {
      expect(chercherGeste(q, LISTE), JSON.stringify(q)).toBeNull();
    }
  });

  /* ═══ « FAIT » N ETAIT PAS UN ORDRE, C ETAIT UN PARTICIPE ═══
     L imperatif de « faire » est « fais » ; « fait courses » ne se dit
     pas. Ces deux mots ne servaient donc aucune formulation naturelle,
     mais ils figurent dans une phrase francaise sur deux — et des
     qu ils apparaissaient, M.I.A. cherchait une tache au lieu de
     laisser la question aller au modele.

     MESURE : sur dix phrases ordinaires, DIX etaient happees ; sans ces
     deux mots, quatre. Et pas une commande legitime n est perdue. */
  it("laisse passer les phrases ou « fait » n est qu un participe", () => {
    for (const q of [
      "il fait beau aujourd hui",
      "qu est-ce qui fait que je suis fatigue",
      "ca fait combien de jours que je tiens",
      "j ai fait quoi hier",
      "quel temps fait-il",
      "c est fait",
    ]) {
      expect(chercherGeste(q, LISTE), JSON.stringify(q)).toBeNull();
    }
  });

  /* ═══ CONSTATE : TROIS PARTICIPES RESTENT, ET ILS HAPPENT ENCORE ═══
     « termine », « valide » et « fini » sont a la fois des imperatifs
     et des participes. Les retirer couterait de vraies commandes —
     « termine les courses » est une phrase qu on ecrit. Le prix est
     qu une question comme « montre-moi ce que j ai valide ce mois »
     recoit « je ne trouve pas … » au lieu d une reponse.

     Les separer demanderait de lire la grammaire, pas les mots. */
  it("happe encore une question qui emploie « valide » ou « termine »", () => {
    expect(chercherGeste("montre moi ce que j ai valide ce mois", LISTE)?.intention)
      .toBe("cocher-introuvable");
    expect(chercherGeste("j ai termine ma journee et toi", LISTE)?.intention)
      .toBe("cocher-introuvable");
  });

  /* ═══ AUCUNE SUPPRESSION N EST OUTILLEE ═══
     « Ce qui n est pas outille ne peut pas arriver. » Les cinq types
     d action sont ouvrir, cocher, ajouter, reporter, focus — et une
     demande de suppression ne trouve donc rien. */
  it("ne sait pas supprimer, et ne fait rien quand on le lui demande", () => {
    for (const q of ["supprime courses", "efface la tache courses", "retire courses",
      "annule courses", "vide la liste de taches"]) {
      const g = chercherGeste(q, LISTE);
      expect(g?.action?.type, q).not.toBe("supprimer");
      if (g?.action) {
        expect(["naviguer", "cocher", "ajouter", "reporter", "focus"], q).toContain(g.action.type);
      }
    }
  });
});

/* ═══════════════════════════════════════════════════════════════
   OUVRIR — LE MOT LE PLUS PRECIS GAGNE, PAS LE PREMIER TROUVE.

   « ouvre la liste de souhaits » contient « liste », qui appartient au
   todo. Rendre la premiere page dont un mot-cle figure envoyait donc
   vers les taches. On garde la correspondance dont le mot-cle est le
   plus LONG — « souhaits » bat « liste ».
   ═══════════════════════════════════════════════════════════════ */
describe("ouvrir une page", () => {
  const vers = (q: string) => {
    const g = chercherGeste(q, LISTE);
    return g?.action?.type === "naviguer" ? g.action.vers : null;
  };

  it("laisse le mot le plus long l emporter", () => {
    expect(vers("ouvre la liste de souhaits")).toBe("/wishlist");
    expect(vers("ouvre la liste")).toBe("/todo");
  });

  it("comprend les synonymes de chaque page", () => {
    expect(vers("ouvre le journal")).toBe("/journal");
    expect(vers("montre mes objectifs")).toBe("/goals");
    expect(vers("affiche les stats")).toBe("/analytics");
    expect(vers("va au tableau de bord")).toBe("/");
    expect(vers("emmene moi dans la boutique")).toBe("/shop");
  });

  it("ignore la casse et les accents", () => {
    expect(vers("Ouvre la SANTÉ")).toBe("/health");
  });

  /* UN VERBE SANS PAGE NE MENE NULLE PART — et laisse la suite du
     fichier essayer ses autres intentions. */
  it("ne navigue pas quand aucune page n est nommee", () => {
    expect(vers("ouvre ça")).toBeNull();
  });
});

describe("lancer un focus", () => {
  it("demande le verbe ET le nom", () => {
    expect(chercherGeste("lance une seance de focus", LISTE)?.action).toEqual({ type: "focus" });
    expect(chercherGeste("demarre la concentration", LISTE)?.action).toEqual({ type: "focus" });
    /* Le nom seul mene a la page, pas au lancement. */
    expect(chercherGeste("ouvre focus", LISTE)?.action).toEqual({ type: "naviguer", vers: "/focus" });
  });

  /* ELLE OUVRE, ELLE NE LANCE PAS. Le texte le dit : « A toi de lancer
     la seance. » Demarrer un minuteur a la place de quelqu un est un
     geste qu on ne reprend pas. */
  it("ouvre la page sans demarrer la seance", () => {
    expect(chercherGeste("lance un focus", LISTE)?.texte).toContain("À toi de lancer");
  });

  /* LE VERBE SEUL NE SUFFIT PAS. « lance » et « commence » servent a
     tout ; sans le nom, ouvrir Focus serait une reponse au hasard. */
  it("ne lance rien quand le nom manque", () => {
    for (const q of ["lance la machine", "commence par le debut", "demarre"]) {
      expect(chercherGeste(q, LISTE)?.action?.type, q).not.toBe("focus");
    }
  });
});

/* ═══════════════════════════════════════════════════════════════
   COCHER — ELLE NE DEVINE PAS.

   Quand deux taches peuvent correspondre, elle demande laquelle. Quand
   aucune ne correspond, elle le dit. Dans les deux cas, aucune action
   n est rendue : le composant n a rien a executer.
   ═══════════════════════════════════════════════════════════════ */
describe("cocher une tache", () => {
  it("coche celle qui correspond", () => {
    expect(chercherGeste("coche courses", LISTE)?.action)
      .toEqual({ type: "cocher", id: "t0", nom: "Courses" });
  });

  it("retire les articles et le mot « tache » avant de chercher", () => {
    for (const q of ["coche la tache courses", "termine mes courses", "valide la course"]) {
      expect(chercherGeste(q, LISTE)?.action, q).toEqual({ type: "cocher", id: "t0", nom: "Courses" });
    }
  });

  /* ELLE TOLERE LA FAUTE DE FRAPPE, jusqu a trois caracteres d ecart.
     Au-dela, elle prefere ne rien trouver plutot que de cocher a cote. */
  it("tolere une faute de frappe, pas un autre mot", () => {
    expect(chercherGeste("coche coursse", LISTE)?.action)
      .toEqual({ type: "cocher", id: "t0", nom: "Courses" });
    expect(chercherGeste("coche brouette", LISTE)?.intention).toBe("cocher-introuvable");
  });

  it("dit qu elle ne trouve pas, sans rien faire", () => {
    const g = chercherGeste("coche vidange", LISTE);
    expect(g?.intention).toBe("cocher-introuvable");
    expect(g?.action).toBeUndefined();
    expect(g?.texte).toContain("vidange");
  });

  it("demande laquelle quand deux se valent, sans rien faire", () => {
    const g = chercherGeste("coche reunion", LISTE);
    expect(g?.intention).toBe("cocher-ambigu");
    expect(g?.action).toBeUndefined();
    expect(g?.texte).toContain("Réunion équipe");
    expect(g?.texte).toContain("Réunion client");
  });

  /* MOINS DE TROIS LETTRES NE CHERCHE RIEN. Deux caracteres suffisent a
     etre CONTENUS dans presque n importe quel nom : sans ce plancher,
     « coche do » cocherait « Dossier fiscal » — et une tache cochee par
     erreur ne se voit pas passer. */
  it("ne cherche pas sur une cible de moins de trois lettres", () => {
    const court = etat("Dossier fiscal", "Douche");
    expect(chercherGeste("coche do", court)?.intention).toBe("cocher-introuvable");
    /* Trois lettres, et elle cherche de nouveau. */
    expect(chercherGeste("coche dou", court)?.action)
      .toEqual({ type: "cocher", id: "t1", nom: "Douche" });
  });

  /* ═══ LA PLUS PROCHE D ABORD ═══
     « course » est contenu dans « Courses » — ressemblance parfaite — et
     ressemble de loin a « Coursier ». Trier a l envers cocherait le
     coursier. */
  it("coche la plus proche, pas la plus lointaine", () => {
    const deux = etat("Courses", "Coursier");
    expect(chercherGeste("coche course", deux)?.action)
      .toEqual({ type: "cocher", id: "t0", nom: "Courses" });
  });

  it("ne fait rien quand rien ne suit le verbe", () => {
    expect(chercherGeste("coche la tache", LISTE)).toBeNull();
  });
});

/* ═══════════════════════════════════════════════════════════════
   REPORTER — TROIS CORRECTIONS TENUES ICI.

   1. APRES-DEMAIN D ABORD. « apres-demain » contient « demain » :
      tester « demain » en premier attrapait les deux et reportait d UN
      jour au lieu de deux. La branche a deux jours ne pouvait pas se
      declencher.

   2. ELLE NE DEVINE PAS ICI NON PLUS. Cocher demandait deja laquelle
      quand deux taches se valaient ; reporter prenait la premiere
      venue, alors que l en-tete promet le contraire pour les deux.

   3. LE JOUR EST CELUI QU ON VIT. Ajouter des millisecondes puis lire
      la date en UTC decalait le report d un jour entre minuit et
      l heure du fuseau : « demain », a une heure du matin, renvoyait a
      aujourd hui.
   ═══════════════════════════════════════════════════════════════ */
describe("reporter une tache", () => {
  const quand = (q: string) => {
    const g = chercherGeste(q, LISTE);
    return g?.action?.type === "reporter" ? g.action.a : null;
  };

  it("reporte a demain, a apres-demain, ou a la semaine", () => {
    vi.setSystemTime(new Date("2026-08-31T10:00:00"));
    expect(quand("reporte courses a demain")).toBe("2026-09-01");
    expect(quand("reporte courses a apres-demain")).toBe("2026-09-02");
    expect(quand("reporte courses à après-demain")).toBe("2026-09-02");
    expect(quand("reporte courses a la semaine prochaine")).toBe("2026-09-07");
  });

  /* MEME A UNE HEURE DU MATIN. C est la fenetre ou l ancienne date en
     UTC renvoyait au jour meme. */
  it("garde le bon jour quelle que soit l heure", () => {
    for (const heure of ["00:30", "01:30", "10:00", "23:30"]) {
      vi.setSystemTime(new Date(`2026-08-31T${heure}:00`));
      expect(quand("reporte courses a demain"), heure).toBe("2026-09-01");
    }
  });

  it("annonce la date en toutes lettres", () => {
    vi.setSystemTime(new Date("2026-08-31T10:00:00"));
    expect(chercherGeste("reporte courses a demain", LISTE)?.texte).toContain("1 septembre");
  });

  /* UNE SEMAINE, C EST PLUS QU UN REPORT — l expression change. */
  it("prend un air severe quand on repousse d une semaine", () => {
    vi.setSystemTime(new Date("2026-08-31T10:00:00"));
    expect(chercherGeste("reporte courses a demain", LISTE)?.expression).toBe("contente");
    expect(chercherGeste("reporte courses a la semaine prochaine", LISTE)?.expression).toBe("severe");
  });

  it("ne fait rien quand on ne dit pas a quand", () => {
    expect(chercherGeste("reporte courses", LISTE)).toBeNull();
    expect(chercherGeste("decale courses", LISTE)).toBeNull();
  });

  it("demande laquelle quand deux se valent, sans rien faire", () => {
    vi.setSystemTime(new Date("2026-08-31T10:00:00"));
    const g = chercherGeste("reporte reunion a demain", LISTE);
    expect(g?.intention).toBe("reporter-ambigu");
    expect(g?.action).toBeUndefined();
    expect(g?.texte).toContain("Réunion équipe");
    expect(g?.texte).toContain("Réunion client");
  });

  it("dit qu elle ne trouve pas, sans rien faire", () => {
    vi.setSystemTime(new Date("2026-08-31T10:00:00"));
    const g = chercherGeste("reporte vidange a demain", LISTE);
    expect(g?.intention).toBe("reporter-introuvable");
    expect(g?.action).toBeUndefined();
  });
});

/* ═══════════════════════════════════════════════════════════════
   AJOUTER — LE DEUX-POINTS SE CHERCHE DANS LA QUESTION.

   `aplatir` retire toute ponctuation : la mise a plat n a JAMAIS
   contenu de deux-points, et la porte qui devait s ouvrir dessus ne
   s ouvrait jamais. « ajoute : acheter du pain » ne declenchait rien,
   alors que la ligne juste en dessous sait deja lire ce qui suit le
   signe.
   ═══════════════════════════════════════════════════════════════ */
describe("ajouter une tache", () => {
  const nom = (q: string) => {
    const g = chercherGeste(q, LISTE);
    return g?.action?.type === "ajouter" ? g.action.nom : null;
  };

  it("ajoute ce qui suit le deux-points, avec ou sans le mot « tache »", () => {
    expect(nom("ajoute une tache : acheter du pain")).toBe("acheter du pain");
    expect(nom("ajoute : acheter du pain")).toBe("acheter du pain");
    expect(nom("note : rappeler le dentiste")).toBe("rappeler le dentiste");
  });

  it("ajoute ce qui suit le verbe quand le mot « tache » est la", () => {
    expect(nom("ajoute la tache courses de printemps")).toBe("courses printemps");
  });

  /* SANS DEUX-POINTS NI LE MOT « TACHE », ELLE NE DEVINE PAS : « ajoute
     du sel » n est pas forcement une tache. */
  it("ne devine pas une tache sans signe ni mot-clef", () => {
    expect(chercherGeste("ajoute acheter du pain", LISTE)).toBeNull();
  });

  it("refuse un nom trop court", () => {
    expect(chercherGeste("ajoute une tache : a", LISTE)).toBeNull();
    expect(chercherGeste("ajoute une tache :   ", LISTE)).toBeNull();
  });

  it("retire les guillemets", () => {
    expect(nom("ajoute une tache : « acheter du pain »")).toBe("acheter du pain");
  });

  /* DEUX CENTS CARACTERES AU PLUS. Une question longue collee dans la
     console ne doit pas devenir une tache illisible. */
  it("coupe un nom trop long a deux cents caracteres", () => {
    const long = "x".repeat(500);
    expect(nom(`ajoute une tache : ${long}`)).toHaveLength(200);
  });
});

/* ═══════════════════════════════════════════════════════════════
   UNE MUTATION QUE CES TESTS N ATTRAPENT PAS, ET POURQUOI.

   Balayage du 31/08/2026 : vingt mutations, dix-neuf attrapees.

   LE PLAFOND DE LA DISTANCE DE LEVENSHTEIN est un reglage de COUT, pas
   de resultat. Il coupe le calcul des que l ecart depasse quatre —
   d abord sur la difference de longueur, puis ligne par ligne — mais le
   filtre qui suit ne garde de toute facon que les scores inferieurs ou
   egaux a trois. Le relever ne change donc aucune tache trouvee ; ca ne
   change que le nombre de cases remplies dans la matrice, sur une liste
   de taches ouvertes qui en compte quelques dizaines.
   ═══════════════════════════════════════════════════════════════ */
