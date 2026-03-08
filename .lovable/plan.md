
Objectif: corriger définitivement le centrage des icônes “Main interface” en mode sidebar réduite, en alignant leur structure sur celle de “Modules” et “Settings” (qui sont déjà corrects).

Constat après investigation
- Les icônes “Modules/Settings” sont rendues via un bouton compact unique (`h-10 w-10`, centrage direct), alors que les icônes “Main interface” passent par une structure différente (NavLink + wrapper tooltip externe + wrapper icône interne + `overflow-hidden`).
- Cette divergence de structure est la cause la plus probable du décalage visuel persistant.
- Aucun signal console/réseau lié au bug: c’est un problème purement layout/CSS.

Plan d’implémentation
1) Unifier le composant mini pour les icônes
- Créer une base de style unique pour les boutons/icônes en mode réduit (mêmes dimensions, même centrage).
- Réutiliser cette base pour:
  - les liens “Main interface” mini
  - les triggers “Modules” et “Settings” mini
- But: même DOM + mêmes classes = même centrage réel.

2) Refaire le rendu “Main interface” en mini comme un vrai bouton centré
- En mini, chaque item “Main interface” sera rendu dans un conteneur plein large (`w-full flex justify-center`) avec un lien de taille fixe (`h-10 w-10`, `grid place-items-center`, `p-0`, sans padding latéral caché).
- Retirer le `overflow-hidden` sur ces items en mini (garde seulement en expanded si nécessaire).

3) Uniformiser la gestion des tooltips en mini
- Remplacer le wrapper tooltip externe des items “Main interface” par la même approche que “Modules/Settings” (tooltip appliqué de façon identique).
- But: éviter toute différence de boîte/clonage Radix entre sections.

4) Stabiliser le badge unread sans impacter l’axe de centrage
- Positionner le badge mini de façon strictement absolue sur le coin de l’icône (sans affecter le flux), avec offsets constants.
- Vérifier que Friends/Inbox restent centrés même avec badge affiché.

5) Harmoniser le conteneur de navigation mini
- Conserver un seul schéma de padding horizontal en mini (pas de padding contradictoire entre sections).
- Vérifier que les séparateurs n’introduisent pas d’illusion de décalage.

Fichier concerné
- `src/components/layout/AppSidebar.tsx` (uniquement)

Critères de validation
- En mode réduit, les icônes Main interface ont exactement le même axe horizontal que:
  - logo “P”,
  - bouton collapse,
  - bouton Modules,
  - bouton Settings,
  - avatar footer.
- Vérifier sur `/shop` (route actuelle) + une route active différente (ex: `/goals`) pour confirmer que l’état actif ne décale rien.
- Vérifier avec et sans badges (Friends/Inbox).
