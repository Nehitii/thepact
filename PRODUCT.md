# Overwrite

Un journal de vie cyberpunk. On y tient ses objectifs, ses finances, ses
habitudes, ses souhaits — sous serment.

## Ce qui rend ce produit different

Tout est accroche a UN PACTE. Pas un profil, pas un compte : un pacte, que le
porteur declare et signe une fois, et qui donne son nom, son symbole, sa
couleur et ses valeurs a toute l application. Les objectifs pendent du pacte.
Le tableau de bord porte sa teinte. Le pantheon montre son sceau.

M.I.A. est la voix du systeme. Elle est seche, un peu cassante, jamais
mystique et jamais mieleuse. Elle constate, elle ne felicite pas.

## Le porteur

Une personne seule, qui se remet en ordre. Elle n arrive pas pour essayer un
outil : elle arrive pour jurer quelque chose. Le premier ecran doit donner ce
poids sans le mimer — pas de solennite empruntee, pas de fantasy.

## Verite du pacte (ce qu on ne change pas)

- **Neuf symboles** : flame, heart, target, sparkles, phoenix, compass,
  citadel, vortex, shield. Chacun a son animation propre — c est
  `PactVisual`, le logo vivant du pacte.
- **Un sceau deduit** : les glyphes viennent du nom du pacte et des valeurs.
  Meme pacte, meme dessin, pour toujours. `sigilDuPacte`, version d alphabet
  gravee dans `pacts.sigil_version`.
- **Un pacte par porteur** : `pacts_user_id_key`. Le second passage reecrit,
  il n insere pas.
- **Les valeurs sont ordonnees** : leur rang fait partie du sceau.

## Le rite (l onboarding)

Quatre actes, huit ecrans : l eveil, la rencontre, la forge, le scellement.
Le rite abrege (second passage) en saute six.

Interdits, poses par le porteur du produit :

- **Aucun son.** Nulle part.
- La ligne inachevee de M.I.A. ne se stocke pas.
- Les conditions restent une vraie case a cocher, decochee, avec de vrais
  liens, validee par un geste DISTINCT de la signature.
- M.I.A. reste seche. Jamais mystique.

## Marque

Violet `#6D30FF` → `#8A5CFF`. Fond profond `#20202A`. Le symbole « O »
glitche. Orbitron pour les titres, Rajdhani pour le corps.

## Contraintes techniques

- Aucun fichier au-dessus de 400 lignes (`npm run verifier`, etape `taille`).
- Couches : `logique/` < `hooks/` < `composants/` < `index`.
- D un autre domaine, on n importe que `@/domaines/<nom>`.
- Le glossaire refuse les synonymes (`scripts/glossaire.json`).
