/* LA VERSION DE L ALPHABET DU SIGIL.
 *
 * Le sceau d un pacte se CALCULE : ses glyphes se deduisent du nom et
 * des valeurs, et rien n en est stocke. C est ce qui permet de le
 * retrouver partout — carte d identite du pacte, guilde, pantheon —
 * sans le recopier nulle part.
 *
 * MAIS UN SCEAU QUI BOUGE N EST PAS UN SCEAU. Le dessin depend d un
 * alphabet de vingt-quatre traits, et la formule fait « modulo 24 » :
 * le jour ou l on en ajoute un vingt-cinquieme, TOUS les sceaux deja
 * jures changent de dessin, en silence, sans qu aucun code ne casse.
 * C est la seule chose de cette fonctionnalite qu on ne peut pas
 * reparer apres coup — un sceau se reconnait, ou il ne sert a rien.
 *
 * Cette colonne retient donc sous quelle version chaque pacte a ete
 * scelle. Le module « onboarding/logique/sigil.ts » dit laquelle il
 * produit aujourd hui, et saura toujours dessiner les anciennes.
 *
 * ELLE ARRIVE AVANT LE PREMIER RENDU HORS DE L ONBOARDING, et c est
 * volontaire : tant que le sigil ne parait que pendant le rite, il
 * n existe encore nulle part et rien ne peut bouger. Des qu il sort
 * sur une carte de pacte, il est trop tard pour la poser.
 *
 * DEFAUT A 1, POUR LES ANCIENS COMME POUR LES NEUFS. Les pactes deja
 * jures n ont jamais eu de sceau : le leur sera calcule pour la
 * premiere fois avec l alphabet courant, qui est bien le premier.
 */

alter table public.pacts
  add column sigil_version integer not null default 1;

/* Une version est un rang, pas une mesure : elle part a 1 et ne
   descend pas. La contrainte dit ce que le code suppose deja. */
alter table public.pacts
  add constraint chk_sigil_version_positive check (sigil_version >= 1);

comment on column public.pacts.sigil_version is
  'Version de l alphabet du sigil sous laquelle ce pacte a ete scelle. Voir src/domaines/onboarding/logique/sigil.ts.';
