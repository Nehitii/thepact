/**
 * LE MODULE SANTE.
 *
 * Ce barrel exportait dix-neuf composants. Quinze d entre eux ne
 * servaient plus a rien depuis la refonte de la page — cartes de
 * metrique, graphes, defis hebdomadaires, analyses automatiques — et
 * c est en partie ce fichier qui les maintenait en vie aux yeux d une
 * recherche rapide : exportes, donc apparemment utilises. Ils ont ete
 * supprimes ; celui-ci ne liste plus que ce qui existe.
 *
 * A NOTER : plus rien n importe depuis « @/components/health ». Les
 * consommateurs passent tous par le chemin direct du fichier, y compris
 * le design system pour HUDFrame et HealthBioMesh. Ce barrel est donc
 * conserve par prudence, pas par necessite.
 */

/* La page, dans son ordre de lecture. */
export { EnTeteDossier } from "./EnTeteDossier";
export { Corps } from "./Corps";
export { JournalDuCorps } from "./JournalDuCorps";
export { Respiration } from "./Respiration";

/* Les fenetres. */
export { HealthDailyCheckin } from "./HealthDailyCheckin";
export { HealthSettingsModal } from "./HealthSettingsModal";
export { HealthMoodSelector } from "./HealthMoodSelector";

/* Deux pieces qui vivent ici mais servent le design system : DSPanel
   pour l une, DSBackground pour l autre. Leur place serait plutot dans
   components/ds, mais les deplacer touche onze pages. */
export { HUDFrame } from "./HUDFrame";
export { HealthBioMesh } from "./HealthBioMesh";
