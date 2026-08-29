import { Mail, Scale, Users } from "lucide-react";
import type { SectionLegale } from "@/domaines/mentions-legales/types";

/* ENTRE MEMBRES, LES CHANGEMENTS, ET A QUI ECRIRE.
 *
 * Les trois derniers articles.
 *
 * Ces articles vivaient dans contenu.ts avec l identite de l editeur
 * et les types : cinq cent soixante-six lignes ou le lecteur qui
 * cherchait « mes donnees » devait faire defiler la propriete
 * intellectuelle. La coupe suit ce qu on vient chercher. */
export const LES_REGLES: SectionLegale[] = [
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
