

# Centrer /the-call — Supprimer le scroll inutile

## Problème
Le conteneur racine utilise `min-h-screen` + `overflow-y-auto` + un `pb-[50vh]` sur le wrapper du bouton, ce qui crée un espace scrollable inutile sous le contenu.

## Correction dans `src/pages/TheCall.tsx`

1. **Conteneur racine (ligne 316)** : remplacer `min-h-screen overflow-y-auto` par `h-screen overflow-hidden` pour verrouiller la page à la taille exacte du viewport sans scroll.

2. **Wrapper du bouton (ligne 355)** : retirer `pb-[50vh]` qui pousse le contenu vers le haut et crée l'espace scrollable. Le `flex items-center justify-center` du parent (`flex-1`) centre déjà naturellement le bouton.

Aucun autre fichier impacté.

