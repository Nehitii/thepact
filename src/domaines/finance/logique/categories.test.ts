import { describe, expect, it } from "vitest";
import en from "@/socle/i18n/locales/en.json";
import fr from "@/socle/i18n/locales/fr.json";
import {
  EXPENSE_CATEGORIES, INCOME_CATEGORIES, calculateActiveTotal, detectCategoryFromName,
  getCategoryByValue, getCategoryLabel, getCategoryTotals, getExpenseCategory,
  getIncomeCategory, getItemCategory, groupItemsByCategory, roundMoney,
} from "./categories";

const ligne = (name: string, amount: number, category?: string | null, is_active = true) =>
  ({ name, amount, category, is_active });

describe("les deux listes", () => {
  /* ═══ LA GARDE i18n NE VOIT PAS CES CLES-LA ═══
     Elle ne releve que les appels de traduction dont la cle est ecrite
     en toutes lettres dans le code. Ici la cle est un champ de DONNEE,
     lue au moment du rendu : une categorie ajoutee sans sa traduction
     afficherait « finance.categories.xxx » sur l ecran, et la chaine
     resterait verte. Ce test EST la garde.

     (Ecrire un appel de traduction en exemple dans ce commentaire
     suffirait d ailleurs a inventer une cle manquante : la garde lit
     les commentaires comme le reste. Constate en le faisant.) */
  it("porte une traduction dans les deux langues pour chaque categorie", () => {
    const lire = (o: unknown, k: string) =>
      k.split(".").reduce<unknown>((a, p) => (a as Record<string, unknown> | null)?.[p], o);
    const cles = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].map((c) => c.labelKey);
    expect(cles).toHaveLength(36);
    for (const k of new Set(cles)) {
      expect(typeof lire(fr, k), "fr " + k).toBe("string");
      expect(typeof lire(en, k), "en " + k).toBe("string");
    }
  });

  it("derive la cle de traduction du nom de la categorie", () => {
    for (const c of [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES]) {
      expect(c.labelKey).toBe("finance.categories." + c.value);
      expect(c.hexColor).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  /* `other` EST LE DERNIER DE CHAQUE LISTE, et c est ce qui fait tenir
     le dernier repli de `getCategoryByValue` : quand meme « other »
     manque, il prend la derniere entree. */
  it("ne cite chaque categorie qu une fois, et finit par « autre »", () => {
    for (const liste of [EXPENSE_CATEGORIES, INCOME_CATEGORIES]) {
      const valeurs = liste.map((c) => c.value);
      expect(new Set(valeurs).size).toBe(valeurs.length);
      expect(liste.at(-1)!.value).toBe("other");
    }
  });

  /* ═══ « LOUER » ET « LOUER » SONT LE MEME MOT DANS LES DEUX SENS ═══
     La depense `rent` est ce qu on loue ; le revenu `rental` est ce
     qu on percoit d un bien qu on possede. Les deux listes ne se
     croisent jamais dans un menu, donc le meme mot peut servir des deux
     cotes — mesure : les deux affichent « Location » en francais et
     « Rental » en anglais, et c est voulu. */
  it("laisse la depense et le revenu partager le mot « location »", () => {
    for (const langue of [fr, en]) {
      const c = (langue as { finance: { categories: Record<string, string> } }).finance.categories;
      expect(c.rent).toBe(c.rental);
    }
    expect(EXPENSE_CATEGORIES.some((c) => c.value === "rental")).toBe(false);
    expect(INCOME_CATEGORIES.some((c) => c.value === "rent")).toBe(false);
  });
});

describe("retrouver une categorie", () => {
  it("rend celle qu on nomme", () => {
    expect(getExpenseCategory("taxes").value).toBe("taxes");
    expect(getIncomeCategory("salary").value).toBe("salary");
  });

  /* UN NOM INCONNU NE FAIT PAS TOMBER L ECRAN : il tombe dans « autre ».
     C est le cas d une categorie retiree de la liste alors que des
     lignes la portent encore en base. */
  it("retombe sur « autre » pour un nom inconnu ou absent", () => {
    for (const v of ["salary", "inexistant", null, undefined, ""]) {
      expect(getExpenseCategory(v as string).value, String(v)).toBe("other");
    }
  });

  /* ═══ « AUTRE » EST CHERCHE PAR SON NOM, PAS PAR SA POSITION ═══
     Les deux listes du fichier finissent par « autre », si bien que
     « chercher autre » et « prendre la derniere » y donnent le meme
     resultat : les deux replis se recouvrent, et rien ne dit qu ils
     sont differents. Ils le sont — sur une liste ou « autre » n est pas
     en queue c est bien lui qui gagne, et sur une liste qui n en a pas
     c est la DERNIERE entree, pas la premiere. */
  it("cherche « autre » par son nom, et ne prend la derniere entree qu a defaut", () => {
    const autreEnTete = [getExpenseCategory("other"), getExpenseCategory("taxes")];
    expect(getCategoryByValue("inconnu", autreEnTete).value).toBe("other");
    const sansAutre = [getExpenseCategory("food"), getExpenseCategory("taxes")];
    expect(getCategoryByValue("inconnu", sansAutre).value).toBe("taxes");
    expect(getCategoryByValue(null, sansAutre).value).toBe("taxes");
  });

  /* ═══ CONSTATE, NON CORRIGE : LA LISTE VIDE REND `undefined` ═══
     La signature promet une `FinanceCategory`. Sur une liste vide, les
     trois replis echouent l un apres l autre et le dernier,
     `categories[categories.length - 1]`, vaut `undefined` — que le type
     ne laisse pas voir. Aucun appelant ne passe de liste vide
     aujourd hui : les deux seules listes sont des constantes du
     fichier. Le test dit ce qui arriverait, il ne le corrige pas. */
  it("rend undefined sur une liste vide, ce que son type ne dit pas", () => {
    expect(getCategoryByValue("housing", [])).toBeUndefined();
    expect(getCategoryByValue(null, [])).toBeUndefined();
  });
});

describe("l etiquette d une categorie", () => {
  const taxes = getExpenseCategory("taxes");

  it("passe par la traduction quand on lui en donne une", () => {
    expect(getCategoryLabel(taxes, ((k: string) => "[" + k + "]") as never))
      .toBe("[finance.categories.taxes]");
  });

  it("retombe sur l anglais quand aucune traduction n est fournie", () => {
    expect(getCategoryLabel(taxes)).toBe("Taxes");
    expect(getCategoryLabel(getIncomeCategory("freelance"))).toBe("Freelance");
  });

  /* TROIS CATEGORIES MANQUENT A LA TABLE DE REPLI — `banking`, `legal`
     et `telecom`, ajoutees apres elle. Elles s en tirent par le dernier
     recours, qui met une majuscule au nom brut. Ca marche parce que ces
     trois noms sont deja des mots anglais ; ce ne serait pas vrai d une
     categorie nommee en francais. */
  it("met une majuscule au nom brut quand la table de repli l ignore", () => {
    for (const [valeur, attendu] of [["banking", "Banking"], ["legal", "Legal"], ["telecom", "Telecom"]]) {
      expect(getCategoryLabel(getExpenseCategory(valeur))).toBe(attendu);
    }
  });

  it("donne la meme etiquette anglaise a la depense et au revenu de location", () => {
    expect(getCategoryLabel(getExpenseCategory("rent"))).toBe("Rental");
    expect(getCategoryLabel(getIncomeCategory("rental"))).toBe("Rental");
  });
});

/* ═══════════════════════════════════════════════════════════════
   DEVINER LA CATEGORIE D UN LIBELLE.

   Elle ne sert QU A LA CREATION, comme proposition : des qu une ligne
   porte une categorie en base, c est elle qui gagne. Mesure du
   30/08/2026 : les dix-neuf lignes du compte en portent une, donc cette
   fonction n a decide de rien sur cet ecran-la — et elle se tromperait
   sur onze d entre elles si elle devait le faire (« Amazon Prime » en
   achats plutot qu en loisir, « Bouygues Mobile » en charges plutot
   qu en telecom, « Copropriete Citya » nulle part).

   C est acceptable pour une proposition qu on corrige d un clic, et ce
   serait inacceptable pour un classement automatique. Le test dit
   laquelle des deux elle est.
   ═══════════════════════════════════════════════════════════════ */
describe("deviner la categorie d un libelle", () => {
  const dep = (nom: string) => detectCategoryFromName(nom, EXPENSE_CATEGORIES).value;
  const rev = (nom: string) => detectCategoryFromName(nom, INCOME_CATEGORIES).value;

  /* ═══ UN MOT-CLE EST UN MOT, PAS UNE SUITE DE LETTRES ═══
     La recherche se faisait en sous-chaine : « car » attrapait
     « Courses Carrefour » et le rangeait en transport, « rent »
     attrapait « Rentree scolaire » et le rangeait en logement. Deux mal
     classes sur dix libelles courants. */
  it("ne se laisse plus prendre aux mots contenus dans d autres", () => {
    expect(dep("Courses Carrefour")).toBe("food");
    expect(dep("Rentrée scolaire")).toBe("education");
  });

  it("tolere le pluriel dans les deux sens", () => {
    expect(dep("Abonnements")).toBe("subscriptions");
    expect(dep("Abonnement")).toBe("subscriptions");
    expect(dep("Course")).toBe("food");
    expect(dep("Courses")).toBe("food");
  });

  it("ignore les accents et la casse", () => {
    expect(dep("Éducation")).toBe("education");
    expect(dep("EDUCATION")).toBe("education");
    expect(dep("Électricité")).toBe("utilities");
  });

  /* LE DECOUPAGE SE FAIT SUR TOUTE LA PONCTUATION, pas seulement sur
     les espaces : un libelle porte des barres obliques, des virgules et
     des parentheses, et « Essence, peage » doit rester de l essence. */
  it("decoupe sur la ponctuation autant que sur les espaces", () => {
    expect(dep("Abonnement/Netflix")).toBe("subscriptions");
    expect(dep("Essence, péage")).toBe("transport");
    expect(dep("(Assurance)")).toBe("insurance");
  });

  /* UN MOT-CLE COMPOSE RESTE CHERCHE EN SOUS-CHAINE : « garde-meuble »
     et « social security » sont assez longs pour ne rien attraper par
     hasard, et le decoupage en mots les casserait en deux. */
  it("reconnait un mot-cle compose au milieu d une phrase", () => {
    expect(dep("Mon garde-meuble du mois")).toBe("rent");
    expect(rev("Ma social security")).toBe("pension");
  });

  /* ═══ L ORDRE DES CATEGORIES TRANCHE LES EX AEQUO ═══
     La boucle parcourt la table de mots-cles dans son ordre d ecriture
     et rend la PREMIERE qui matche. « location » appartient a `rent`
     comme a `rental` ; en depense c est `rent` qui gagne parce qu il
     vient avant. Deplacer une entree dans la table change donc des
     classements, en silence. */
  it("tranche par l ordre de la table quand deux categories matchent", () => {
    expect(dep("Location")).toBe("rent");
    /* « leasing » appartient a `rent`, « auto » a `transport` : `rent`
       est ecrit avant. */
    expect(dep("Leasing auto")).toBe("rent");
  });

  /* ═══ UN MOT-CLE QUI DESIGNE UNE CATEGORIE ABSENTE NE BLOQUE PAS ═══
     La boucle ne s arrete pas au premier mot-cle trouve, mais a la
     premiere categorie trouvee QUI EXISTE DANS LA LISTE DONNEE. C est
     ce qui permet a « Location » de tomber sur `rent` en depense et sur
     `rental` en revenu, avec la meme table. */
  it("passe son chemin quand la categorie trouvee n est pas dans la liste", () => {
    expect(rev("Location")).toBe("rental");
    expect(rev("Loyer perçu")).toBe("other");
  });

  /* ═══ CONSTATE, NON CORRIGE : UN REVENU NOMME « GIFT » TOMBE DANS
     « AUTRE » ═══
     La liste des revenus porte bien une categorie `gift`. Mais la table
     de mots-cles n a pas d entree `gift` : le mot est capte par
     `gifts`, la DEPENSE, qui n existe pas cote revenu — donc on passe
     son chemin, et plus rien ne matche. Une categorie visible dans le
     menu que la detection ne propose jamais. */
  it("ne propose jamais la categorie « cadeau » cote revenu", () => {
    expect(INCOME_CATEGORIES.some((c) => c.value === "gift")).toBe(true);
    expect(rev("Gift")).toBe("other");
    expect(rev("Cadeau d anniversaire")).toBe("other");
    expect(dep("Cadeau d anniversaire")).toBe("gifts");
  });

  it("retombe sur « autre » quand rien ne matche", () => {
    expect(dep("Zzz")).toBe("other");
    expect(dep("")).toBe("other");
  });
});

describe("la categorie d une ligne", () => {
  it("prefere la categorie enregistree a ce qu elle devinerait", () => {
    /* « Amazon Prime » serait devine en achats ; il est range en loisir,
       et c est le rangement qui gagne. */
    expect(getItemCategory(ligne("Amazon Prime", 69.9, "leisure"), EXPENSE_CATEGORIES).value)
      .toBe("leisure");
    expect(detectCategoryFromName("Amazon Prime", EXPENSE_CATEGORIES).value).toBe("shopping");
  });

  /* UNE CATEGORIE ENREGISTREE QUI N EXISTE PLUS REND LA MAIN A LA
     DEVINETTE — et non a « autre ». C est le bon choix : une categorie
     retiree de la liste laisse des lignes orphelines, et les deviner
     vaut mieux que les entasser. */
  it("redevine quand la categorie enregistree n existe plus", () => {
    expect(getItemCategory(ligne("Essence", 150, "categorie-retiree"), EXPENSE_CATEGORIES).value)
      .toBe("transport");
  });

  it("devine quand rien n est enregistre", () => {
    for (const c of [null, undefined, ""]) {
      expect(getItemCategory(ligne("Essence", 150, c), EXPENSE_CATEGORIES).value).toBe("transport");
    }
  });
});

describe("l argent", () => {
  it("arrondit au centime", () => {
    expect(roundMoney(0.1 + 0.2)).toBe(0.3);
    expect(roundMoney(1 / 3)).toBe(0.33);
    expect(roundMoney(2631.5999999999995)).toBe(2631.6);
  });

  /* ═══ L ARRONDI N EST PAS SYMETRIQUE AUTOUR DE ZERO ═══
     `Math.round` casse les egalites vers le HAUT, pas vers l exterieur :
     un demi-centime en plus monte, un demi-centime en moins monte
     aussi. Une depense de 0,125 devient 0,13, un remboursement de
     -0,125 devient -0,12. L ecart est d un centime et il ne concerne
     que les montants a trois decimales — le compte n en porte aucun
     (mesure du 30/08/2026 : zero, une ou deux decimales). */
  it("penche toujours vers le haut, meme en negatif", () => {
    expect(roundMoney(0.125)).toBe(0.13);
    expect(roundMoney(-0.125)).toBe(-0.12);
    expect(roundMoney(-0.126)).toBe(-0.13);
  });

  it("ne compte que les lignes actives, et arrondit une seule fois", () => {
    const lignes = [ligne("a", 0.1), ligne("b", 0.2), ligne("c", 999, null, false)];
    expect(calculateActiveTotal(lignes)).toBe(0.3);
    expect(calculateActiveTotal([])).toBe(0);
    expect(calculateActiveTotal([ligne("z", 5, null, false)])).toBe(0);
  });

  /* LE TOTAL DU COMPTE, RELEVE LE 30/08/2026 : seize depenses actives
     pour 2 631,60 et trois revenus pour 2 550, soit un solde de
     -81,60. Ce sont les nombres que l ecran affiche. */
  it("retrouve le total du compte", () => {
    const depenses = [
      ligne("Amazon Prime", 69.9), ligne("Assurance Marat", 9.85), ligne("AssurOpoil", 47.91),
      ligne("Bouygues Mobile", 6.99), ligne("CB Société générale", 16.1),
      ligne("Copropriété Citya", 554.61), ligne("Copropriété Pichet", 257.83),
      ligne("Croquette Lunalia", 28.99), ligne("Direct Assurance", 123.87), ligne("Essence", 150),
      ligne("Impôts Fonciers Marat", 84), ligne("Impôts fonciers Toussaint Louverture", 163),
      ligne("Loyer & charges", 760), ligne("Paypal", 141.75), ligne("Protection Juridique", 7.8),
      ligne("Taxe foncière", 209),
    ];
    expect(calculateActiveTotal(depenses)).toBe(2631.6);
    expect(calculateActiveTotal([ligne("Loyer Marat", 450), ligne("Loyer Toussaint Louverture", 500),
      ligne("Salaire Aquitel", 1600)])).toBe(2550);
  });
});

describe("les parts par categorie", () => {
  const items = [
    ligne("Loyer & charges", 760, "housing"), ligne("Paypal", 141.75, "housing"),
    ligne("Essence", 150, "transport"), ligne("Taxe foncière", 209, "taxes"),
    ligne("Ancienne", 999, "housing", false),
  ];

  it("additionne par categorie, du plus gros au plus petit", () => {
    const parts = getCategoryTotals(items, EXPENSE_CATEGORIES);
    expect(parts.map((p) => [p.name, p.value])).toEqual([
      ["housing", 901.75], ["taxes", 209], ["transport", 150],
    ]);
    expect(parts[0].color).toBe(getExpenseCategory("housing").hexColor);
  });

  it("porte l etiquette traduite quand on lui donne de quoi traduire", () => {
    const parts = getCategoryTotals(items, EXPENSE_CATEGORIES, ((k: string) => "[" + k + "]") as never);
    expect(parts[0].label).toBe("[finance.categories.housing]");
  });

  /* ═══ CONSTATE, NON CORRIGE : DEUX ARRONDIS DIFFERENTS DANS LE MEME
     FICHIER ═══
     `calculateActiveTotal` arrondit UNE FOIS, a la fin. Les parts, elles,
     arrondissent A CHAQUE ADDITION. Sur des montants a trois decimales
     les deux divergent : trois lignes de 0,005 font 0,03 en parts et
     0,02 en total. Les parts d un camembert peuvent donc ne pas sommer
     au total affiche a cote.

     MESURE SUR LE COMPTE : tous les montants ont au plus deux
     decimales, la somme des dix parts fait exactement 2 631,60, et
     l ecart n existe pas aujourd hui. Le corriger demanderait de
     choisir lequel des deux chiffres est le bon — et ce choix change ce
     que l ecran affiche. */
  it("diverge du total global sur les montants a trois decimales", () => {
    const fins = [ligne("a", 0.005), ligne("b", 0.005), ligne("c", 0.005)];
    const parts = getCategoryTotals(fins, EXPENSE_CATEGORIES);
    expect(parts[0].value).toBe(0.03);
    expect(calculateActiveTotal(fins)).toBe(0.02);
  });

  it("groupe les lignes sans en perdre", () => {
    const groupes = groupItemsByCategory(items, EXPENSE_CATEGORIES);
    expect([...groupes.keys()]).toEqual(["housing", "transport", "taxes"]);
    expect(groupes.get("housing")!.items.map((i) => i.name)).toEqual([
      "Loyer & charges", "Paypal", "Ancienne",
    ]);
    /* LE GROUPEMENT NE FILTRE PAS L ACTIVITE, LA SOMME SI. Une ligne
       eteinte reste visible dans son groupe et sort des totaux : c est
       ce qui permet de la rallumer sans la chercher. */
    expect([...groupes.values()].reduce((n, g) => n + g.items.length, 0)).toBe(items.length);
  });
});

/* ═══════════════════════════════════════════════════════════════
   UNE MUTATION QUE CES TESTS N ATTRAPENT PAS, ET POURQUOI.

   Balayage du 30/08/2026 : trente mutations, vingt-neuf attrapees.

   `if (!value) return …` EN TETE DE `getCategoryByValue` EST DOMINE PAR
   LE REPLI QUI SUIT. Retirer la garde ne change rien : `find(c =>
   c.value === null)` ne trouve jamais rien, et la ligne suivante
   retombe sur « autre » exactement de la meme facon. La garde dit
   l intention — « pas de nom, pas de recherche » — et economise un
   parcours de liste ; elle ne decide d aucun resultat.
   ═══════════════════════════════════════════════════════════════ */
