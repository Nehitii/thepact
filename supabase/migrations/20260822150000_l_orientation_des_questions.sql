-- L ORIENTATION DES QUESTIONS
--
-- Les questions du journal sont passees de quinze a cent soixante-neuf
-- par langue, en huit familles. L utilisateur choisit lesquelles il veut
-- voir tomber.
--
-- NULL OU TABLEAU VIDE VAUT TOUTES LES FAMILLES, et la difference entre
-- les deux est conservee : null veut dire « n a jamais choisi », vide
-- veut dire « a tout decoche ». Les deux produisent le meme tirage —
-- c est famillesRetenues() qui le decide, cote client — mais on ne perd
-- pas l information.
--
-- On ne veut surtout pas qu un journal se retrouve sans question parce
-- que l utilisateur a tout decoche : ce serait le punir d avoir essaye
-- le reglage.

alter table public.profiles
  add column if not exists journal_prompt_families text[];

comment on column public.profiles.journal_prompt_families is
  'Familles de questions du journal choisies par l utilisateur. NULL ou tableau vide = toutes. Les valeurs correspondent a journal_prompts.category.';
