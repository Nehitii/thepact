import { Database, Share2, ShieldCheck, Trash2, UserCog } from "lucide-react";
import type { SectionLegale } from "@/domaines/mentions-legales/types";
import { HEBERGEUR } from "@/domaines/mentions-legales/identite";

/* CE QUI EST COLLECTE, OU CA VA, ET CE QU ON PEUT EN EXIGER.
 *
 * Cinq articles : les donnees personnelles, leurs destinataires, leur
 * securite, les droits qui s y attachent, et la suppression du compte.
 *
 * Ces articles vivaient dans contenu.ts avec l identite de l editeur
 * et les types : cinq cent soixante-six lignes ou le lecteur qui
 * cherchait « mes donnees » devait faire defiler la propriete
 * intellectuelle. La coupe suit ce qu on vient chercher. */
export const LES_DONNEES: SectionLegale[] = [
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

];
