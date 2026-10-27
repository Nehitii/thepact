# Overwrite — icônes d'application / favicons

Vectorisées depuis ton logo d'origine (tracé exact, pas une réinterprétation).

## Contenu

- `svg/` — sources vectorielles
  - `overwrite-icon-dark.svg` — fond #20202A, symbole dégradé blanc → violet
  - `overwrite-icon-purple.svg` — fond dégradé #8A5CFF → #6D30FF, symbole blanc
  - `overwrite-icon-light.svg` — fond blanc, symbole dégradé #A78BFA → #6D30FF
  - `*-compact.svg` — version pour les tailles ≤ 48 px
  - `overwrite-symbol.svg` — symbole seul, fond transparent
- `png/` — 16, 32, 48, 64, 128, 180, 192, 256, 512 px par variante
- `favicon.ico` — multi-résolutions 16 → 256, variante violette

## Réglages appliqués

- Symbole à 88 % de la largeur de l'icône, centrage géométrique.
- Contour : squircle (superellipse n=5), comme les icônes iOS.
- Tailles ≤ 48 px : version compacte, le « O » passe à 62 % de l'icône et les
  lignes glitch sortent du cadre, sinon elles disparaissent au rendu.

## Mise en place web

```html
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" href="/overwrite-symbol.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/overwrite-purple-180.png">
```

## Pour régénérer

Le script `build.py` reconstruit tout le pack. La variable `RATIO` pilote la
taille du symbole, `CORE_SMALL` celle des petites tailles.
