-- L ETAPE ULTIME, ET LE ZENITH QU ELLE OUVRE.
--
-- Un objectif promet quelque chose ; l honorer, c est tenir cette
-- promesse. Il manquait un moyen de dire qu on est alle au-dela — non
-- pas d en avoir fait davantage, mais d avoir vise plus haut que ce
-- qu on s etait fixe. L exemple qui a fait naitre l idee : l objectif
-- est le permis A1, l etape ultime est le permis A.
--
-- Elle porte donc trois regles, et pas une de plus.
--
-- ELLE NE COMPTE PAS DANS L AVANCEMENT. C est ce qui en fait un bonus
-- et non une etape de plus : si elle entrait au denominateur, un
-- objectif de cinq etapes plus l ultime ne pourrait jamais atteindre
-- cent pour cent sans elle, et il faudrait la faire pour honorer
-- l objectif. Les compteurs validated_steps et total_steps l ignorent,
-- partout ou ils s ecrivent.
--
-- IL N Y EN A QU UNE. « L » etape ultime, au singulier : un objectif,
-- un depassement. L index partiel ci-dessous en fait une regle de la
-- base et non une convention du code — deux ultimes sur le meme
-- objectif sont refuses.
--
-- ELLE NE RAPPORTE RIEN. Aucun XP, aucun compteur de succes. C est une
-- distinction, pas une monnaie : elle se voit, elle ne se compte pas.
-- Rien de l audit des compteurs n est donc remis en cause.
--
-- Le zenith lui-meme n est pas une colonne : c est le fait que
-- l etape ultime d un objectif soit franchie. Le deduire plutot que
-- l enregistrer evite d avoir deux verites a tenir d accord, et laisse
-- goals.status intact — donc les comptes d objectifs franchis, l XP,
-- les constellations et les succes tels qu ils sont.

alter table public.steps
  add column if not exists is_ultimate boolean not null default false;

comment on column public.steps.is_ultimate is
  'Etape ultime : exclue de l avancement, une seule par objectif, ouvre le zenith une fois franchie.';

-- Une seule par objectif, dit par la base.
create unique index if not exists steps_une_seule_ultime_par_objectif
  on public.steps (goal_id)
  where is_ultimate;
