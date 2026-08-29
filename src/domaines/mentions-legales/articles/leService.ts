import { Building2, Copyright, FileText } from "lucide-react";
import type { SectionLegale } from "@/domaines/mentions-legales/types";
import { REGIME, PRODUIT, EDITEUR, HEBERGEUR_SITE, HEBERGEUR } from "@/domaines/mentions-legales/identite";

/* QUI EDITE, CE QUI EST A QUI, CE QU ON PEUT EN FAIRE.
 *
 * Les trois premiers articles : l identite de l editeur, la propriete
 * intellectuelle, et les conditions d usage.
 *
 * Ces articles vivaient dans contenu.ts avec l identite de l editeur
 * et les types : cinq cent soixante-six lignes ou le lecteur qui
 * cherchait « mes donnees » devait faire defiler la propriete
 * intellectuelle. La coupe suit ce qu on vient chercher. */
export const LE_SERVICE: SectionLegale[] = [
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

];
