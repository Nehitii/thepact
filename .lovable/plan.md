
## Objectif
Rendre toutes les cases du mois strictement égales dans `/calendar`, même avec beaucoup d’événements ou des titres longs.

## Constat
Le correctif précédent a bien figé la hauteur, mais pas la logique complète de dimensionnement :
- `MonthView.tsx` utilise encore des semaines rendues comme plusieurs grilles séparées
- les colonnes sont en `repeat(7, 1fr)`, donc leur largeur peut encore être influencée par le contenu
- les cartes d’événement et leurs wrappers ne verrouillent pas assez le shrink (`min-w-0`) et le débordement horizontal

Résultat : certaines colonnes/cases paraissent visuellement “tordues” ou non homogènes.

## Plan de correction
1. **Refondre la grille du mois dans `MonthView.tsx`**
   - utiliser une définition de colonnes robuste : `32px repeat(7, minmax(0, 1fr))`
   - partager exactement la même grille entre l’en-tête et le corps
   - remplacer la logique “une grille par semaine” par un body plus strict pour éviter les différences de calcul entre rangées

2. **Verrouiller les dimensions des cellules**
   - ajouter `min-w-0`, `min-h-0` et `overflow-hidden` aux cases jour
   - conserver une hauteur fixe par cellule
   - laisser uniquement la zone d’événements scroller en vertical, jamais la cellule elle-même

3. **Empêcher les événements de pousser la grille**
   - dans `EventCard.tsx`, forcer `max-w-full` + `overflow-hidden` au bon niveau
   - sur le wrapper draggable et la colonne d’événements, ajouter `min-w-0` et `overflow-x-hidden`
   - garder le texte tronqué sans autoriser l’élargissement implicite des colonnes

4. **Uniformiser le rendu visuel**
   - harmoniser les séparateurs/bordures pour que toutes les cases aient exactement le même contour
   - supprimer les effets de double-bordure qui accentuent visuellement l’impression de déformation

## Détail technique
Le vrai problème vient surtout du fait que, dans une grille CSS, `1fr` se comporte comme un track qui garde un minimum lié au contenu. Avec des titres longs ou des éléments non rétrécissables, certaines colonnes refusent de se contracter proprement. Le bon pattern ici est :
- `minmax(0, 1fr)` pour les colonnes
- `min-w-0` sur les items/grid children
- `overflow-x-hidden` sur les conteneurs internes

## Fichiers à modifier
- `src/components/calendar/views/MonthView.tsx`
- `src/components/calendar/EventCard.tsx`

## Vérification prévue
- mois avec cellules vides
- mois avec beaucoup d’événements sur quelques jours
- titres très longs
- événements normaux + deadlines virtuelles
- contrôle desktop et largeur intermédiaire pour vérifier que toutes les cases restent parfaitement égales
