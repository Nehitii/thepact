-- LE CADRAGE D UNE IMAGE DE CREANCIER
--
-- Un logo n arrive pas au format de sa plaque. Certains sont larges,
-- d autres carres, certains sont blancs sur fond transparent et
-- disparaissent sur du blanc. Les poser tous de la meme facon revient
-- a bien afficher ceux qui tombaient juste et a maltraiter les autres.
--
-- On enregistre donc COMMENT l image se pose, pas seulement OU elle
-- est. Une seule colonne jsonb plutot que quatre colonnes : c est une
-- preference d affichage, elle grandira, et une migration par reglage
-- serait disproportionnee.
--
--   ajustement  « contenir » (le logo entier, cerne de vide) ou
--               « remplir » (la plaque entiere, bords rognes)
--   x, y        le point de l image qu on garde au centre, en %
--   zoom        de 100 a 300, pour un logo cerne de trop de marge
--   fond        « clair », « sombre » ou « teinte » — un logo blanc
--               sur transparent est invisible sur du blanc
--
-- Nul vaut « rien de regle » : voir CADRE_PAR_DEFAUT dans
-- src/lib/finance/cadre.ts. On n ecrit jamais un objet identique au
-- defaut, qui ferait croire a une intention la ou personne n a rien
-- choisi.

alter table public.recurring_expenses add column if not exists icon_cadre jsonb;
alter table public.recurring_income   add column if not exists icon_cadre jsonb;

comment on column public.recurring_expenses.icon_cadre is
  'Cadrage de icon_url : {ajustement, x, y, zoom, fond}. Nul = reglages par defaut.';
comment on column public.recurring_income.icon_cadre is
  'Cadrage de icon_url : {ajustement, x, y, zoom, fond}. Nul = reglages par defaut.';
