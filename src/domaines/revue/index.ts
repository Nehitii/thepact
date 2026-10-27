/* LA REVUE HEBDOMADAIRE — le rendez-vous du dimanche.
 *
 * Elle possede sa table, `weekly_reviews`, et personne d autre ne la
 * touche : c est ce qui en fait un domaine plutot qu un composant de
 * l accueil. Le releve du 29/08 l a montre — un seul appelant
 * (pages/Home), mais une donnee a soi.
 *
 * LA REGLE QUI A TRANCHE, ET QUI VAUT POUR LES DEUX SENS : un fichier
 * a un seul appelant descend chez cet appelant (c est ce qui a envoye
 * DynamicLucideIcon chez les succes et HabitHeatmap chez les
 * objectifs) — SAUF s il possede sa propre table. Une donnee dont un
 * seul module connait la forme reste un domaine, meme si une seule
 * page l affiche aujourd hui.
 *
 * SA FEUILLE ETAIT GLOBALE, ELLE NE L EST PLUS. `revue.css` etait
 * chargee par main.tsx pour tout le monde. Ses cinquante selecteurs
 * commencent tous par `.rv-`, aucun autre fichier ne les cite, et
 * `theme-clair.css` n en reprend aucun : rien ne depend de son ordre
 * de chargement. Elle descend donc ici et suit le modal, contrairement
 * a celles de l accueil dont l ordre est disputé.
 */
export { WeeklyReviewModal } from "./composants/WeeklyReviewModal";
