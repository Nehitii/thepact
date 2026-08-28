/**
 * LA PORTE DU DOMAINE PROFIL.
 *
 * Le compte : qui on est, comment on se connecte, ce qu on affiche, ce
 * qu on garde pour soi. Onze choses sortent, et la raison est toujours
 * la meme — `profiles` est la table que la moitie de l application lit.
 *
 *   useProfile              la barre laterale, la porte protegee, quatre pages
 *   useProfileSettings      la barre laterale, les particules, la communaute
 *   useMfa                  la porte protegee et l ecran du second facteur
 *   useCarteProfil          la carte dans la barre laterale
 *   useFuseauDuProfil       la coquille, pour lire « aujourd hui » au bon fuseau
 *   chargerProfilsPublics   le chat de guilde, les messages, la presence,
 *                           les publications, les videos — six lecteurs
 *   SurvolProfil            les membres d une guilde, le classement
 *   CarteProfilPublic       la carte publique
 *   TitreCosmetique         le titre porte
 *   ProfilePreferencesSync  monte dans AppProviders
 *   AccentColorSync         idem
 *
 * LES DEUX DERNIERS SONT DES COMPOSANTS SANS RENDU : ils s installent
 * une fois dans les fournisseurs et synchronisent une preference. Ils
 * ne tirent donc aucun arbre d interface, et restent en export
 * statique — contrairement aux trois composants de la porte des succes,
 * qui ont du passer en differe apres mesure.
 *
 * CE QUI EST PARTI AILLEURS.
 *
 * `console-ui.tsx` et `settings-ui.tsx` vivaient sous `components/
 * profile/`, mais `console-ui` sert DIX-NEUF fichiers — dont la sante,
 * les succes et les mentions legales. Ce n est pas du profil, c est la
 * trousse d interface des reglages : Panneau, Reglage, Segmente, Jauge,
 * Bouton, Champ, Alerte. Elle a rejoint `components/ds/`, avec
 * `reglages.css`.
 *
 * Les rangs, les succes, les ordres du jour et le pantheon sont partis
 * au domaine `succes` (onzieme) : le releve annoncait « profil, 55
 * fichiers » et sa porte de vingt et un exports disait qu il y avait
 * deux domaines dedans.
 */
export { useProfile } from "./hooks/useProfile";
/* useProfileSettings EST PARTI AU SOCLE. Il lit les preferences
   d affichage sur profiles, et quatre lecteurs hors profil s en
   servent — la barre laterale, les particules, la communaute. La
   garde du socle l a signale : useParticleEffect, qui EST du socle,
   l importait a travers ce domaine. */
export { useMfa } from "./hooks/useMfa";
export { useCarteProfil } from "./hooks/useCarteProfil";
export type { CarteProfil } from "./hooks/useCarteProfil";
export { useFuseauDuProfil } from "./hooks/useFuseauDuProfil";
export { chargerProfilsPublics } from "./logique/profilsPublics";

/* LA CONSOLE DE REGLAGES. Sept ecrans de profil la portent, et celui
   de la sante aussi : sa route est `/profile/health`, il vit dans la
   meme console. Le domaine sante l emprunte donc par cette porte —
   la garde des domaines l a signale des qu elle a existe. */
export { ConsoleReglages } from "./composants/ConsoleReglages";

export { SurvolProfil } from "./composants/SurvolProfil";
export { CarteProfilPublic } from "./composants/CarteProfilPublic";
export { TitreCosmetique } from "./composants/TitreCosmetique";
export { ProfilePreferencesSync } from "./composants/ProfilePreferencesSync";
export { AccentColorSync } from "./composants/AccentColorSync";

/* Deux hooks que des ecrans non encore ranges appellent. */
export { useSoundSettings } from "./hooks/useSoundSettings";
export { useCodesDeSecours, motifLisible } from "./hooks/useCodesDeSecours";
