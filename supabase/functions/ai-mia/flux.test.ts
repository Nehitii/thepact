import { describe, expect, it } from "vitest";
import {
  absorberLaLigne, appelVide, chargeDeLaLigne, decouperLesLignes, FIN_DE_FLUX,
  fragmentDeLaLigne, PREFIXE_DONNEE, recoller, trame,
  type AppelOutil, type TourRecolle,
} from "./flux";

const tourVide = (): TourRecolle => ({ texte: "", outils: [] });
const donnee = (o: unknown) => `${PREFIXE_DONNEE}${JSON.stringify(o)}`;
const texte = (c: string) => donnee({ choices: [{ delta: { content: c } }] });

describe("decouperLesLignes — le dernier morceau est garde", () => {
  /* UN PAQUET RESEAU NE FINIT PAS SUR UNE FIN DE LIGNE : la derniere
     ligne est presque toujours coupee en plein milieu. Sans mise de
     cote, une ligne sur deux serait du JSON tronque — et « continue »
     l avalerait en silence, faisant disparaitre du texte au hasard. */
  it("garde la ligne incomplete pour la suite", () => {
    const d = decouperLesLignes("", "a\nb\nincom");
    expect(d.lignes).toEqual(["a", "b"]);
    expect(d.reste).toBe("incom");
  });

  it("recolle le reste devant le paquet suivant", () => {
    const un = decouperLesLignes("", "hel");
    const deux = decouperLesLignes(un.reste, "lo\n");
    expect(deux.lignes).toEqual(["hello"]);
  });

  /* QUAND LE PAQUET FINIT PILE SUR UNE FIN DE LIGNE, le reste est la
     chaine vide — exactement ce qu on veut recoller devant le
     suivant. */
  it("rend un reste vide quand le paquet finit sur une fin de ligne", () => {
    const d = decouperLesLignes("", "a\nb\n");
    expect(d.lignes).toEqual(["a", "b"]);
    expect(d.reste).toBe("");
  });

  it("ne rend aucune ligne sur un paquet sans fin de ligne", () => {
    expect(decouperLesLignes("", "abc")).toEqual({ lignes: [], reste: "abc" });
  });

  it("supporte un paquet vide", () => {
    expect(decouperLesLignes("dej", "")).toEqual({ lignes: [], reste: "dej" });
  });

  /* UNE LIGNE COUPEE EN TROIS PAQUETS se recolle quand meme. */
  it("recolle une ligne coupee en trois", () => {
    let reste = "";
    const toutes: string[] = [];
    for (const p of ['data: {"a"', ':1', "}\n"]) {
      const d = decouperLesLignes(reste, p);
      reste = d.reste;
      toutes.push(...d.lignes);
    }
    expect(toutes).toEqual(['data: {"a":1}']);
  });
});

describe("chargeDeLaLigne — ce qu une ligne porte, ou rien", () => {
  it("rend la charge d une ligne de donnees", () => {
    expect(chargeDeLaLigne('data: {"a":1}')).toBe('{"a":1}');
  });

  /* TOUT CE QUI N EST PAS UNE DONNEE EST IGNORE — y compris une
     donnee VIDE, qu un JSON.parse ferait lever. */
  it.each(["", ":ping", "event: message", "id: 42", "data:"])(
    "ignore « %s »",
    (ligne) => {
      expect(chargeDeLaLigne(ligne)).toBeNull();
    },
  );

  it("ignore la fin de flux", () => {
    expect(chargeDeLaLigne(`${PREFIXE_DONNEE}${FIN_DE_FLUX}`)).toBeNull();
    expect(FIN_DE_FLUX).toBe("[DONE]");
  });

  it("coupe les blancs autour de la charge", () => {
    expect(chargeDeLaLigne("data:   {}   ")).toBe("{}");
  });

  /* LE PREFIXE EST « data:  » AVEC SON ESPACE : le retirer par une
     longueur en dur casserait des que le prefixe changerait. */
  it("retire exactement le prefixe", () => {
    expect(PREFIXE_DONNEE).toBe("data: ");
    expect(chargeDeLaLigne("data: data: x")).toBe("data: x");
  });
});

describe("fragmentDeLaLigne — un fragment illisible est saute", () => {
  it("lit un fragment valide", () => {
    expect(fragmentDeLaLigne(texte("bonjour"))?.choices?.[0]?.delta?.content).toBe("bonjour");
  });

  /* LE FLUX CONTINUE : une ligne mal formee ne doit pas interrompre
     une reponse a moitie arrivee. */
  it.each(["data: {cassé", "data: {", "data: [1,2", "data: undefined"])(
    "rend rien pour « %s » sans lever",
    (ligne) => {
      expect(() => fragmentDeLaLigne(ligne)).not.toThrow();
      expect(fragmentDeLaLigne(ligne)).toBeNull();
    },
  );

  it("rend rien pour une ligne qui n est pas une donnee", () => {
    expect(fragmentDeLaLigne("event: ping")).toBeNull();
  });
});

describe("recoller — chaque champ se pose, les arguments s accumulent", () => {
  it("cree un appel vide au premier fragment", () => {
    const outils = recoller([], { index: 0, id: "a1" });
    expect(outils[0]).toEqual({ id: "a1", type: "function", function: { name: "", arguments: "" } });
  });

  /* LES ARGUMENTS ARRIVENT EN TRANCHES DE JSON QU IL FAUT CONCATENER :
     les poser garderait la derniere tranche seule, et le JSON.parse
     suivant echouerait sur un fragment. */
  it("accumule les arguments, tranche par tranche", () => {
    let outils: AppelOutil[] = [];
    for (const t of ['{"lim', 'it":', "20}"]) {
      outils = recoller(outils, { index: 0, function: { arguments: t } });
    }
    expect(outils[0].function.arguments).toBe('{"limit":20}');
    expect(JSON.parse(outils[0].function.arguments)).toEqual({ limit: 20 });
  });

  it("pose le nom une fois et ne le concatene pas", () => {
    let outils = recoller([], { index: 0, function: { name: "list_todos" } });
    outils = recoller(outils, { index: 0, function: { name: "list_todos" } });
    expect(outils[0].function.name).toBe("list_todos");
  });

  /* LE TEST SUR CHAQUE CHAMP N EST PAS DECORATIF : un fragment qui
     n apporte que des arguments a un `id` absent. Sans le test, on
     ecraserait l identifiant deja recu par une chaine vide, et le
     message de reponse ne pourrait plus etre rattache a son appel. */
  it("n efface pas l identifiant deja recu", () => {
    let outils = recoller([], { index: 0, id: "appel-1", function: { name: "n" } });
    outils = recoller(outils, { index: 0, function: { arguments: "{}" } });
    expect(outils[0].id).toBe("appel-1");
    expect(outils[0].function.name).toBe("n");
  });

  /* UN INDEX ABSENT VAUT ZERO : certains fournisseurs ne l envoient
     pas quand il n y a qu un seul appel. */
  it("traite un index absent comme zero", () => {
    const outils = recoller([], { id: "seul" });
    expect(outils[0].id).toBe("seul");
    expect(outils).toHaveLength(1);
  });

  it("range deux appels a leurs index respectifs", () => {
    let outils = recoller([], { index: 1, id: "b" });
    outils = recoller(outils, { index: 0, id: "a" });
    expect(outils.map((o) => o.id)).toEqual(["a", "b"]);
  });

  /* LA SIGNATURE DE PENSEE DOIT REVENIR AVEC L APPEL : Gemini 3
     REFUSE le tour suivant sans elle — 400 INVALID_ARGUMENT,
     « Function call is missing a thought_signature ». */
  it("transporte la signature de pensee", () => {
    const outils = recoller([], {
      index: 0, id: "a",
      extra_content: { google: { thought_signature: "sig-42" } },
    });
    expect(outils[0].extra_content).toEqual({ google: { thought_signature: "sig-42" } });
  });

  /* ELLE EST FUSIONNEE ET NON POSEE : elle peut arriver en plusieurs
     fragments. */
  it("fusionne une signature arrivee en deux fragments", () => {
    let outils = recoller([], { index: 0, extra_content: { google: { s: 1 } } });
    outils = recoller(outils, { index: 0, extra_content: { autre: { s: 2 } } });
    expect(outils[0].extra_content).toEqual({ google: { s: 1 }, autre: { s: 2 } });
  });

  it("ne pose aucune signature quand le modele n en envoie pas", () => {
    const outils = recoller([], { index: 0, id: "a" });
    expect(outils[0].extra_content).toBeUndefined();
  });

  it("part d un appel vide bien forme", () => {
    expect(appelVide()).toEqual({ id: "", type: "function", function: { name: "", arguments: "" } });
  });
});

describe("absorberLaLigne — un tour entier, ligne par ligne", () => {
  it("accumule le texte et le rend a diffuser", () => {
    const a = absorberLaLigne(texte("Bon"), tourVide());
    expect(a.aDiffuser).toBe("Bon");
    const b = absorberLaLigne(texte("jour"), a.tour);
    expect(b.tour.texte).toBe("Bonjour");
    expect(b.aDiffuser).toBe("jour");
  });

  it("ne diffuse rien pour une ligne sans contenu", () => {
    const a = absorberLaLigne("event: ping", tourVide());
    expect(a.aDiffuser).toBe("");
    expect(a.tour.texte).toBe("");
  });

  it("ne diffuse rien pour un fragment sans delta", () => {
    const a = absorberLaLigne(donnee({ choices: [{}] }), tourVide());
    expect(a.aDiffuser).toBe("");
  });

  it("recolle un appel d outil arrive en trois lignes", () => {
    let tour = tourVide();
    const lignes = [
      donnee({ choices: [{ delta: { tool_calls: [{ index: 0, id: "a1", function: { name: "list_todos" } }] } }] }),
      donnee({ choices: [{ delta: { tool_calls: [{ index: 0, function: { arguments: '{"lim' } }] } }] }),
      donnee({ choices: [{ delta: { tool_calls: [{ index: 0, function: { arguments: 'it":5}' } }] } }] }),
    ];
    for (const l of lignes) tour = absorberLaLigne(l, tour).tour;
    expect(tour.outils[0]).toEqual({
      id: "a1", type: "function",
      function: { name: "list_todos", arguments: '{"limit":5}' },
    });
  });

  /* DU TEXTE ET UN APPEL PEUVENT ARRIVER DANS LA MEME LIGNE. */
  it("prend le texte et l appel d une meme ligne", () => {
    const ligne = donnee({
      choices: [{ delta: { content: "je regarde", tool_calls: [{ index: 0, id: "a" }] } }],
    });
    const a = absorberLaLigne(ligne, tourVide());
    expect(a.tour.texte).toBe("je regarde");
    expect(a.tour.outils[0].id).toBe("a");
  });

  it("saute une ligne illisible sans perdre ce qui precede", () => {
    let tour = absorberLaLigne(texte("avant"), tourVide()).tour;
    tour = absorberLaLigne("data: {cassé", tour).tour;
    tour = absorberLaLigne(texte(" apres"), tour).tour;
    expect(tour.texte).toBe("avant apres");
  });

  it("ne cree aucun outil quand le modele n en appelle pas", () => {
    const a = absorberLaLigne(texte("bonjour"), tourVide());
    expect(a.tour.outils).toEqual([]);
  });
});

describe("trame — ce qui repart vers le client", () => {
  it("enveloppe le contenu dans une trame SSE", () => {
    expect(trame("salut")).toBe(
      'data: {"choices":[{"delta":{"content":"salut"}}]}\n\n',
    );
  });

  /* LA TRAME DOIT ETRE RELISIBLE PAR LE MEME LECTEUR : c est la
     garantie qu on ne casse pas le format en le reecrivant. */
  it("se relit avec les fonctions de lecture", () => {
    const ligne = trame("aller-retour").split("\n")[0];
    expect(absorberLaLigne(ligne, tourVide()).aDiffuser).toBe("aller-retour");
  });

  it("echappe ce qui casserait le JSON", () => {
    const ligne = trame('des "guillemets" et un \n saut').split("\n")[0];
    expect(absorberLaLigne(ligne, tourVide()).aDiffuser).toBe('des "guillemets" et un \n saut');
  });

  it("finit par une ligne vide, comme l exige le protocole", () => {
    expect(trame("x").endsWith("\n\n")).toBe(true);
  });
});

/* ═══════════════════════════════════════════════════════════════
   CE QUE LE BALAYAGE A LAISSE PASSER, ET POURQUOI.
   ═══════════════════════════════════════════════════════════════ */
describe("la charge vide, et la longueur du prefixe", () => {
  /* TROU — mes cas de ligne vide s arretaient tous au PREMIER garde :
     « data: » sans espace ne commence meme pas par le prefixe. Pour
     atteindre le second garde, il faut le prefixe COMPLET suivi de
     rien d autre que des blancs. Sans lui, chargeDeLaLigne rendrait
     la chaine vide au lieu de rien. */
  it.each(["data: ", "data:  ", "data: \t"])(
    "rend rien pour une donnee faite de blancs : %j",
    (ligne) => {
      expect(chargeDeLaLigne(ligne)).toBeNull();
    },
  );

  /* CE QUE CE GARDE EVITE EN AVAL : sans lui, la charge vide
     descendrait jusqu a JSON.parse("") — qui leve. La levee serait
     rattrapee, donc le resultat final serait le meme ; le garde est
     la pour ne pas fabriquer une exception qu on sait inutile. */
  it("evite un JSON.parse qu on sait voue a lever", () => {
    expect(() => JSON.parse("")).toThrow();
    expect(fragmentDeLaLigne("data: ")).toBeNull();
  });

  /* DOMINE — couper le prefixe a une longueur en dur donnerait une
     charge precedee d une espace, que le `.trim()` retire aussitot.
     Les deux ecritures sont donc equivalentes POUR TOUTE ENTREE, et
     le balayage l a montre. La longueur nommee est gardee parce
     qu elle survit a un changement de prefixe — ce que le balayage
     confirme par ailleurs : changer PREFIXE_DONNEE est bien
     attrape. */
  it("donne la meme charge avec la longueur nommee ou une longueur en dur", () => {
    const enDur = (ligne: string) => {
      if (!ligne.startsWith(PREFIXE_DONNEE)) return null;
      const charge = ligne.slice(5).trim();
      if (!charge || charge === FIN_DE_FLUX) return null;
      return charge;
    };
    for (const l of ['data: {"a":1}', "data:   {}   ", "data: [DONE]", "data: ", "autre"]) {
      expect(chargeDeLaLigne(l)).toBe(enDur(l));
    }
  });
});
