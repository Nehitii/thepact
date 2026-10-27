
import type { SectionLegale } from "@/domaines/mentions-legales/types";
/* Reexporte : la page les importait d ici avant la coupe. */
export * from "@/domaines/mentions-legales/identite";
import { LE_SERVICE } from "@/domaines/mentions-legales/articles/leService";
import { LES_DONNEES } from "@/domaines/mentions-legales/articles/lesDonnees";
import { LES_REGLES } from "@/domaines/mentions-legales/articles/lesRegles";

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

/* L ORDRE DU DOCUMENT, EN UNE LIGNE.
   Il etait jusqu ici la consequence de l ordre d ecriture dans un
   tableau de quatre cents lignes — donc invisible, donc fragile. */
export const SECTIONS: SectionLegale[] = [...LE_SERVICE, ...LES_DONNEES, ...LES_REGLES];
