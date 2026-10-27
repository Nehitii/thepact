-- ═══════════════════════════════════════════════════════════════════
-- RESTAURE DEPUIS LE REGISTRE DE LA BASE, LE 06/09/2026
-- ═══════════════════════════════════════════════════════════════════
--
-- Cette migration a ete APPLIQUEE en production le 2026-08-23
-- sans qu un fichier soit ecrit dans le depot. Elle n existait plus
-- que dans « supabase_migrations.schema_migrations », qui garde le SQL
-- de chaque migration en plus de son numero.
--
-- Le contenu ci-dessous est celui du registre, mot pour mot — la prose
-- d origine comprise. Rien n a ete reecrit.
--
-- NE PAS LA REJOUER : elle est deja appliquee. Elle est ici pour que
-- « supabase/migrations » redevienne un compte rendu fidele du schema,
-- et pour qu un environnement neuf puisse etre reconstruit.
-- ═══════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════
-- LES GUILDES FANTOMES, ET CE QUI LES A LAISSEES NAITRE
-- ═══════════════════════════════════════════════════════════════
--
-- Six guildes, cinq du meme nom, toutes fondees par le meme
-- utilisateur. Les cinq « Nirvata » n'ont JAMAIS eu de membre, ni un
-- message, ni un objectif, ni une annonce, ni une ligne d'activite.
-- Trois le 15 mars, deux le 2 avril.
--
-- L'ordre compte : le menage precede la contrainte, sinon l'index
-- unique refuse de naitre sur des lignes qui la violent deja. C'est
-- Postgres qui l'a rappele au premier essai.

-- ── 1. Le menage ──
--
-- Les cinq guildes sont designees par leur IDENTIFIANT, et non par
-- leur nom : « Ananta » et toute future « Nirvata » habitee restent
-- hors d'atteinte, quoi qu'il arrive. Et meme designees, elles ne
-- partent que si elles sont bien vides de tout.

delete from public.guilds g
where g.id in (
  'a8c46f8b-2779-40c4-94b5-a1eec4662406',
  'c01ca9d0-5121-4c6e-a219-a2611d981eb8',
  'f1303eaa-a80e-4995-819b-5c5dc83e81a8',
  '18e989f5-b9dd-475d-9f01-b235c645f0ec',
  'e4a8ec37-8d3f-4eaf-884a-beb625d1420b'
)
  and not exists (select 1 from public.guild_members m where m.guild_id = g.id)
  and not exists (select 1 from public.guild_messages m where m.guild_id = g.id)
  and not exists (select 1 from public.guild_goals x where x.guild_id = g.id)
  and not exists (select 1 from public.guild_announcements a where a.guild_id = g.id)
  and not exists (select 1 from public.guild_activity_log l where l.guild_id = g.id);

-- ── 2. Le fondateur est rattache a sa guilde par la base ──
--
-- La creation inserait la guilde et laissait au client le soin
-- d'ajouter son auteur dans guild_members. Si ce second appel
-- echouait — ou n'etait jamais fait — la guilde naissait sans
-- personne : invisible dans « mes guildes », donc impossible a
-- rejoindre ou a supprimer depuis l'interface. C'est exactement
-- l'etat des cinq lignes qu'on vient de retirer.

create or replace function public.fondateur_membre_de_sa_guilde()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.guild_members (guild_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists trg_fondateur_membre on public.guilds;
create trigger trg_fondateur_membre
  after insert on public.guilds
  for each row execute function public.fondateur_membre_de_sa_guilde();

-- ── 3. Deux guildes du meme nom, pour un meme fondateur ──
--
-- La contrainte ignore la casse. Deux personnes differentes peuvent
-- nommer leur guilde pareil ; une meme personne ne le peut plus. Le
-- formulaire pouvait deja verifier — cela ne suffisait pas, puisque
-- le defaut vient d'un envoi repete.

create unique index if not exists idx_guildes_nom_unique_par_fondateur
  on public.guilds (owner_id, lower(name));
