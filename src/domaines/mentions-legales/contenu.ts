import {
  Building2, Copyright, FileText, Database, Share2, ShieldCheck,
  UserCog, Clock, Trash2, Users, Scale, Mail, type LucideIcon,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   CONDITIONS ET MENTIONS LÉGALES — LE FOND

   Le texte vivait dans le JSX, entrelacé à cinq cents lignes de
   cartes à halo : le modifier demandait de naviguer dans des balises,
   et le traduire aurait voulu dire tout recopier.

   Il est ici, en données. La page ne fait plus que le rendre.

   CE QUI A ÉTÉ CORRIGÉ EN LE REPRENANT — vérifié dans le code et la
   base, pas supposé :

     Le document parlait de « The Pact », © 2024–2025, « Version V3.5,
     dernière mise à jour décembre 2025 », et donnait une adresse de
     contact sur un domaine qui n'est pas celui du produit.

     Sa section « Données collectées » listait quatre catégories
     génériques et affirmait qu'aucune donnée superflue n'était
     recueillie — sans mentionner la santé, la finance, le journal,
     les messages ni le calendrier, que l'application enregistre
     pourtant.

     Ses « tiers de confiance » n'étaient nommés nulle part, alors que
     M.I.A transmet les entrées de journal et les relevés de santé
     à un modèle de Google.

     Il était intégralement en anglais.

   CE QUI N'EST PAS DU RESSORT DU CODE : la validité des clauses
   elles-mêmes. Ce fichier décrit fidèlement ce que l'application
   fait ; il ne remplace pas une relecture juridique.
   ═══════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════
   SOUS QUEL RÉGIME CE SERVICE EST ÉDITÉ

   « particulier » — personne physique éditant à titre NON
   professionnel. L'article 6-III-2 de la LCEN l'autorise à ne pas
   publier son nom ni son adresse, pour préserver son anonymat, À DEUX
   CONDITIONS : les avoir communiqués à son hébergeur, et publier en
   échange le nom et l'adresse de celui-ci. Les comptes Cloudflare et
   Supabase sont ouverts à l'identité réelle de l'éditeur : la première
   condition est remplie de fait, la seconde par la section ci-dessous.

   « professionnel » — toute activité commerciale. Le régime complet
   s'applique alors : nom, forme juridique, adresse, immatriculation,
   directeur de la publication, tous publics.

   ═══ CE QUI FAIT BASCULER LE RÉGIME, ET QUAND ═══

   LE JOUR OÙ L'ENCAISSEMENT EST BRANCHÉ. Aujourd'hui la boutique
   affiche des prix en euros mais `handlePackPurchase` ne fait
   qu'annoncer « le paiement n'est pas encore branché » — aucune
   intégration Stripe, PayPal ou équivalent n'existe dans le dépôt,
   vérifié le 28/08/2026. Le service ne vend rien, donc rien n'est
   commercial.

   Le premier commit qui encaisse un euro rend ce fichier faux. Passer
   REGIME à "professionnel" fera réapparaître l'avertissement de la
   page tant que les cinq champs restent vides — c'est voulu, c'est le
   rappel.

   ═══ CE QUE CE RÉGIME NE DISPENSE PAS DE FAIRE ═══

   LE RGPD EST UN TEXTE SÉPARÉ, et l'anonymat de la LCEN ne s'y étend
   pas. Le responsable de traitement doit rester identifiable et
   joignable, et ce service collecte des données de santé, catégorie
   particulière. D'où `courriel`, qui reste obligatoire dans les deux
   régimes : c'est par là que passent les demandes d'accès, de
   rectification et d'effacement.

   Ce fichier décrit ce que l'application fait et ce que les textes
   demandent. Il ne remplace pas une relecture juridique.
   ═══════════════════════════════════════════════════════════════ */

export type Regime = "particulier" | "professionnel";

export const REGIME: Regime = "particulier";

/**
 * L'IDENTITÉ DE L'ÉDITEUR.
 *
 * En régime « particulier », seul `courriel` est requis : les autres
 * champs peuvent rester vides sans que la page le signale, parce que
 * les taire est un droit et non un oubli. En régime « professionnel »,
 * tous deviennent obligatoires et la page redit ce qui manque.
 */
export const EDITEUR = {
  /** Raison sociale ou nom complet. Facultatif en régime particulier. */
  nom: "",
  /** Forme juridique et capital, s'il y a une société. */
  forme: "",
  /** Adresse postale complète. Facultative en régime particulier. */
  adresse: "",
  /** SIREN / SIRET, ou numéro d'immatriculation équivalent. */
  immatriculation: "",
  /** Directeur de la publication. */
  directeur: "",
  /** Adresse de contact. REQUISE DANS LES DEUX RÉGIMES — voir le RGPD ci-dessus. */
  courriel: "support.overwrite@gmail.com",
};

/** Les champs que le régime en vigueur rend obligatoires. */
export const CHAMPS_REQUIS: (keyof typeof EDITEUR)[] =
  REGIME === "particulier"
    ? ["courriel"]
    : ["nom", "forme", "adresse", "immatriculation", "directeur", "courriel"];

/* L'HÉBERGEUR DU SITE ET CELUI DES DONNÉES NE SONT PAS LE MÊME, et la
   LCEN vise d'abord celui qui met le contenu à disposition du public.
   Ne nommer que Supabase était donc incomplet : c'est Cloudflare qui
   sert l'application. Les deux sont désormais cités, chacun pour ce
   qu'il héberge. */

export const HEBERGEUR_SITE = {
  nom: "Cloudflare, Inc.",
  detail: "101 Townsend St., San Francisco, CA 94107, États-Unis",
  role: "Hébergement de l'application (Cloudflare Workers).",
};

export const HEBERGEUR = {
  nom: "Supabase, Inc.",
  detail: "970 Toa Payoh North, Singapour",
  region: "Région d'hébergement des données : eu-west-2 (Londres, Royaume-Uni)",
};

/** La version du document et sa date, affichées en pied de page. */
export const VERSION = "2026.08";
export const MISE_A_JOUR = "25 août 2026";

/** Le nom du produit, en un seul endroit. */
export const PRODUIT = "Overwrite";

export interface Article {
  /** Le numéro d'article, pour pouvoir s'y référer. */
  n: number;
  titre: string;
  /** Un paragraphe, ou une liste à puces. */
  corps: (string | string[])[];
  /** Une phrase mise en évidence, à la fin de l'article. */
  souligne?: string;
  /** Un avertissement, en rouge. */
  alerte?: string;
}

export interface SectionLegale {
  /** L'intitulé du panneau. */
  code: string;
  icone: LucideIcon;
  ton?: "neutre" | "actif" | "alerte" | "danger";
  etat?: string;
  intro?: string;
  articles: Article[];
}

export const SECTIONS: SectionLegale[] = [
  {
    code: "Éditeur et hébergeur",
    icone: Building2,
    intro:
      "Qui édite ce service, où il est hébergé, et à qui écrire.",
    articles: [
      {
        n: 1,
        titre: "Éditeur du service",
        corps:
          REGIME === "particulier"
            ? [
                `${PRODUIT} est édité par une personne physique, à titre non professionnel. Le service ne vend rien et ne perçoit aucun paiement.`,
                "L'article 6-III-2 de la loi pour la confiance dans l'économie numérique permet à un éditeur non professionnel de ne pas rendre publiques son identité et son adresse, à condition de les avoir communiquées à son hébergeur — ce qui est le cas — et de publier en échange les coordonnées de celui-ci, données à l'article suivant.",
                `Pour toute demande — légale, ou portant sur tes données — écris à ${EDITEUR.courriel}. Cette adresse est relevée : c'est par elle que passent les demandes d'accès, de rectification et d'effacement.`,
                "Sur réquisition de l'autorité judiciaire, l'hébergeur communique l'identité de l'éditeur. L'anonymat vaut à l'égard du public, pas de la justice.",
              ]
            : [
                `${PRODUIT} est édité par la personne ou l'entité désignée ci-dessous, qui en assure la publication et la responsabilité.`,
              ],
      },
      {
        n: 2,
        titre: "Hébergement",
        corps: [
          `L'application ${PRODUIT} est hébergée par ${HEBERGEUR_SITE.nom}, ${HEBERGEUR_SITE.detail}.`,
          `Les données sont hébergées séparément par ${HEBERGEUR.nom}, ${HEBERGEUR.detail}.`,
          HEBERGEUR.region,
          "Le Royaume-Uni ne fait plus partie de l'Union européenne. Les transferts vers ce pays s'appuient sur la décision d'adéquation dont il bénéficie.",
        ],
      },
    ],
  },

  {
    code: "Propriété intellectuelle",
    icone: Copyright,
    articles: [
      {
        n: 3,
        titre: "Droits sur l'application",
        corps: [
          `© 2024–${new Date().getFullYear()} ${PRODUIT}. Tous droits réservés.`,
          "Les contenus, éléments visuels, interfaces, animations, logos, textes, graphismes, code source et fonctionnalités de l'application sont la propriété exclusive de son éditeur.",
          "Toute reproduction, distribution, modification, décompilation ou réutilisation, totale ou partielle, est interdite sans accord écrit préalable.",
        ],
      },
      {
        n: 4,
        titre: "Ce que tu écris t'appartient",
        corps: [
          "Les contenus que tu crées — objectifs, notes, entrées de journal, données financières, relevés — restent tiens.",
          "Tu accordes à l'éditeur le droit strictement nécessaire pour les héberger, les afficher et les traiter afin de faire fonctionner le service. Ce droit prend fin à la suppression de ton compte.",
        ],
      },
    ],
  },

  {
    code: "Conditions d'utilisation",
    icone: FileText,
    articles: [
      {
        n: 5,
        titre: "Acceptation",
        corps: [
          `En créant un compte ou en utilisant ${PRODUIT}, tu acceptes les présentes conditions ainsi que les lois et règlements applicables.`,
        ],
        souligne: "Si tu n'es pas d'accord avec ces conditions, n'utilise pas l'application.",
      },
      {
        n: 6,
        titre: "Objet du service",
        corps: [
          `${PRODUIT} est une application de développement personnel, d'organisation et de progression : suivi d'objectifs, d'habitudes, de finances et de bien-être.`,
          "Elle est destinée à un usage personnel, licite et responsable.",
        ],
      },
      {
        n: 7,
        titre: "Âge minimum",
        corps: [
          "Le service n'est pas destiné aux personnes de moins de 15 ans. En créant un compte, tu déclares avoir au moins cet âge, ou disposer de l'autorisation de la personne titulaire de l'autorité parentale.",
        ],
      },
      {
        n: 8,
        titre: "Ta responsabilité sur ce que tu publies",
        corps: [
          "Tu es seul responsable des contenus que tu crées, déposes, conserves ou partages, notamment :",
          [
            "objectifs, étapes et plans",
            "notes et entrées de journal",
            "données financières",
            "messages échangés avec d'autres membres",
            "images et fichiers déposés",
          ],
          "L'éditeur ne vérifie, ne valide ni ne cautionne les contenus des membres. Les décisions que tu prends à partir de l'application relèvent de toi.",
        ],
      },
      {
        n: 9,
        titre: "Usages interdits",
        corps: [
          "Le service ne doit pas servir à :",
          [
            "préparer, organiser, promouvoir ou faciliter une activité illicite",
            "conserver ou diffuser des contenus illégaux, nuisibles, abusifs, frauduleux ou trompeurs",
            "enfreindre une loi locale, nationale ou internationale",
            "porter atteinte aux droits, à la vie privée ou à la sécurité d'autrui",
            "détourner les outils financiers à des fins illégales ou trompeuses",
            "harceler, menacer ou maltraiter d'autres membres",
          ],
        ],
        alerte: "Toute tentative de détourner l'application de son usage licite est interdite.",
      },
      {
        n: 10,
        titre: "Mesures en cas de manquement",
        corps: [
          "En cas de manquement, l'éditeur peut :",
          [
            "suspendre temporairement l'accès",
            "fermer définitivement le compte",
            "retirer un contenu",
            "restreindre certaines fonctionnalités",
            "coopérer avec les autorités lorsque la loi l'impose",
          ],
          "Une mesure peut être prise sans préavis lorsque le manquement est manifeste ou qu'il met en danger d'autres personnes.",
        ],
      },
      {
        n: 11,
        titre: "Aucun conseil professionnel",
        corps: [
          "L'application ne fournit ni conseil juridique, ni conseil financier, ni conseil médical, ni accompagnement psychologique.",
          "Le module de suivi du bien-être propose des observations à titre informatif. Ce n'est pas un dispositif médical, il ne pose aucun diagnostic et ne remplace l'avis d'aucun professionnel de santé.",
          "Les statistiques, projections et suggestions — y compris celles produites par M.I.A — sont indicatives. Tes décisions restent les tiennes.",
        ],
      },
    ],
  },

  {
    code: "Données personnelles",
    icone: Database,
    intro:
      "Ce que l'application enregistre réellement, et pourquoi.",
    articles: [
      {
        n: 12,
        titre: "Données collectées",
        corps: [
          "Selon les modules que tu actives, l'application enregistre :",
          [
            "compte : adresse électronique, identifiant, mot de passe chiffré, second facteur si tu l'actives",
            "profil : pseudonyme, avatar, titre, biographie, préférences d'affichage et de langue",
            "pacte : objectifs, étapes, habitudes, rangs, échéances",
            "journal : entrées, humeurs, réflexions",
            "finance : revenus, dépenses, dépenses récurrentes, budgets, patrimoine",
            "bien-être : sommeil, activité, humeur, stress, charge mentale, hydratation",
            "organisation : tâches, événements du calendrier, séances de concentration",
            "social : messages, publications, réactions, membres bloqués, appartenance à une guilde",
            "technique : journal de sécurité (connexions, changements de mot de passe), abonnements aux notifications, erreurs applicatives",
          ],
        ],
        souligne:
          "Les données de bien-être touchent à ta santé. Le module correspondant peut être désactivé, et ses relevés supprimés, sans affecter le reste.",
      },
      {
        n: 13,
        titre: "Pourquoi ces données sont traitées",
        corps: [
          "Fournir le service que tu demandes : sans les données que tu saisis, l'application n'a rien à afficher ni à calculer.",
          "Assurer la sécurité du compte : le journal de sécurité et le second facteur servent à détecter et à empêcher les accès non autorisés.",
          "Améliorer le service : les erreurs applicatives sont collectées pour être corrigées.",
          "Certains traitements reposent sur ton consentement et se désactivent depuis les réglages : M.I.A, les notifications, l'affichage du statut d'activité, la visibilité du profil.",
        ],
      },
      {
        n: 14,
        titre: "Stockage sur ton appareil",
        corps: [
          "L'application conserve dans ton navigateur des préférences d'affichage : thème, langue, réglages sonores, forme de certaines listes, fond de la page de concentration.",
          "Ces éléments ne servent ni à la publicité ni au suivi. Vider les données du site les efface.",
        ],
      },
    ],
  },

  {
    code: "Où vont ces données",
    icone: Share2,
    ton: "alerte",
    etat: "3 destinataires",
    intro:
      "Les prestataires qui reçoivent une partie des données, et ce que chacun reçoit.",
    articles: [
      {
        n: 15,
        titre: "Aucune vente",
        corps: [
          "Tes données personnelles ne sont ni vendues, ni louées, ni échangées.",
        ],
      },
      {
        n: 16,
        titre: "Hébergement et base de données",
        corps: [
          `${HEBERGEUR.nom} héberge la base de données, l'authentification, les fichiers déposés et les fonctions serveur. ${HEBERGEUR.region}.`,
        ],
      },
      {
        n: 17,
        titre: "Modèle d'intelligence artificielle",
        corps: [
          "M.I.A et les observations de bien-être s'appuient sur un modèle de langage fourni par Google (Gemini), hébergé aux États-Unis.",
          "Lui sont transmis, au moment où tu utilises ces fonctions :",
          [
            "tes entrées de journal récentes, pour que M.I.A s'en souvienne",
            "tes objectifs et étapes en cours",
            "tes relevés de bien-être, lorsque tu demandes des observations",
            "les messages que tu échanges avec M.I.A",
          ],
          "Des représentations vectorielles de tes entrées de journal sont calculées puis conservées dans la base pour permettre à M.I.A de retrouver un souvenir pertinent.",
        ],
        alerte:
          "Si tu ne veux pas que ces contenus quittent l'application, n'utilise pas M.I.A ni les observations de bien-être. Aucune autre fonction ne les transmet.",
      },
      {
        n: 18,
        titre: "Suivi des erreurs",
        corps: [
          "Sentry reçoit les erreurs applicatives : message, pile d'appels, page concernée, et un identifiant technique de session.",
          "L'enregistrement des sessions est désactivé.",
        ],
      },
      {
        n: 19,
        titre: "Notifications",
        corps: [
          "Si tu actives les notifications, l'adresse d'abonnement fournie par ton navigateur est enregistrée. L'envoi transite alors par le service de notification de l'éditeur de ton navigateur ou de ton système.",
        ],
      },
    ],
  },

  {
    code: "Sécurité et conservation",
    icone: ShieldCheck,
    articles: [
      {
        n: 20,
        titre: "Sécurité",
        corps: [
          "Les échanges sont chiffrés en transit, les données chiffrées au repos, et l'accès à chaque enregistrement est restreint à son propriétaire au niveau de la base.",
          "Un second facteur peut être activé, avec des codes de secours.",
          "Aucun système ne garantit une protection absolue. La confidentialité de tes identifiants relève de toi.",
        ],
      },
      {
        n: 21,
        titre: "Durée de conservation",
        corps: [
          "Tes données sont conservées tant que ton compte existe.",
          "À la suppression du compte, elles sont effacées de la base.",
          "Le journal de sécurité et les traces techniques nécessaires à la prévention de la fraude peuvent être conservés plus longtemps lorsque la loi l'impose.",
          "Les sauvegardes de la base disparaissent au terme de leur cycle de rotation.",
        ],
      },
    ],
  },

  {
    code: "Tes droits",
    icone: UserCog,
    articles: [
      {
        n: 22,
        titre: "Ce que tu peux exiger",
        corps: [
          "Conformément à la réglementation applicable, dont le RGPD, tu disposes des droits suivants :",
          [
            "accéder à tes données",
            "les rectifier ou les mettre à jour",
            "en demander l'effacement",
            "en obtenir une copie exploitable",
            "t'opposer à un traitement",
            "en demander la limitation",
            "retirer ton consentement à tout moment, pour les traitements qui en dépendent",
          ],
          "La plupart de ces droits s'exercent directement depuis les réglages : Mes données pour l'export et la suppression, Confidentialité pour la visibilité, Notifications pour les envois.",
        ],
      },
      {
        n: 23,
        titre: "Réclamation",
        corps: [
          "Si une réponse ne te satisfait pas, tu peux saisir l'autorité de contrôle compétente. En France, la Commission nationale de l'informatique et des libertés (CNIL), 3 place de Fontenoy, 75007 Paris — www.cnil.fr.",
        ],
      },
    ],
  },

  {
    code: "Suppression du compte",
    icone: Trash2,
    ton: "danger",
    articles: [
      {
        n: 24,
        titre: "Fermer ton compte",
        corps: [
          "Tu peux demander la suppression de ton compte à tout moment.",
          "À la suppression :",
          [
            "le compte est effacé, ainsi que l'ensemble des données qui s'y rattachent",
            "les guildes dont tu es propriétaire sont dissoutes",
            "certaines traces peuvent être conservées le temps qu'impose la loi",
          ],
        ],
        alerte:
          "L'opération est définitive. Pense à exporter tes données avant, depuis Mes données.",
      },
    ],
  },

  {
    code: "Entre membres, et responsabilité",
    icone: Users,
    articles: [
      {
        n: 25,
        titre: "Échanges entre membres",
        corps: [
          "Tu restes responsable de tes communications.",
          "Les conversations ne sont pas surveillées de façon systématique.",
          "Le blocage et le signalement sont à ta disposition ; l'abus, le harcèlement ou le détournement peuvent entraîner une mesure.",
        ],
      },
      {
        n: 26,
        titre: "Limitation de responsabilité",
        corps: [
          "Dans les limites permises par la loi, l'éditeur ne répond pas :",
          [
            "des contenus publiés par les membres",
            "des décisions prises à partir des données ou projections affichées",
            "des conséquences financières ou personnelles de ces décisions",
            "d'un usage détourné de l'application",
            "d'une perte de données provoquée par une manipulation de ta part",
          ],
          "Rien dans les présentes ne limite la responsabilité qui ne peut l'être en droit, notamment en cas de faute lourde ou d'atteinte aux personnes.",
        ],
      },
      {
        n: 27,
        titre: "Disponibilité",
        corps: [
          "Le service est fourni en l'état, sans garantie de disponibilité continue. Des interruptions peuvent survenir pour maintenance ou pour une cause extérieure.",
        ],
      },
    ],
  },

  {
    code: "Modifications, droit applicable",
    icone: Scale,
    articles: [
      {
        n: 28,
        titre: "Évolution des présentes conditions",
        corps: [
          "Elles peuvent être mises à jour. Toute modification substantielle est signalée dans l'application.",
          "La version en vigueur est celle affichée sur cette page, avec sa date.",
        ],
        souligne: "Continuer d'utiliser le service après une mise à jour vaut acceptation.",
      },
      {
        n: 29,
        titre: "Droit applicable",
        corps: [
          "Les présentes conditions sont régies par le droit français.",
          "En cas de litige, une solution amiable sera recherchée avant toute action. À défaut, les tribunaux français sont compétents, sous réserve des règles protectrices dont bénéficient les consommateurs.",
        ],
      },
    ],
  },

  {
    code: "Contact",
    icone: Mail,
    articles: [
      {
        n: 30,
        titre: "Nous écrire",
        corps: [
          "Pour une question juridique, une demande relative à tes données ou un problème de compte, écris à l'adresse indiquée en tête de page.",
          "Les demandes relatives aux données reçoivent une réponse dans un délai d'un mois, prolongeable lorsque la demande est complexe.",
        ],
      },
    ],
  },
];
