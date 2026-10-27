-- ═══════════════════════════════════════════════════════════════
-- UNE INSCRIPTION RECRÉE UN PROFIL ET UN RÔLE
--
-- Le déclencheur `on_auth_user_created` a été créé dans la toute
-- première migration, le 22/11/2025. Il n'existe plus en production, et
-- AUCUNE MIGRATION NE LE SUPPRIME. Il a donc disparu hors du dépôt — à
-- la main, ou par une opération de l'outil qui a servi à démarrer le
-- projet.
--
-- CONSÉQUENCE, LATENTE ET SÉRIEUSE : depuis sa disparition, une
-- inscription ne crée ni ligne `profiles` ni ligne `user_roles`. Rien
-- n'a pris le relais — vérifié le 28/08/2026 : aucun `insert` ni
-- `upsert` sur `profiles` dans src/, aucun dans les fonctions Edge.
-- `init_achievement_tracking()`, la seule chose appelée à la connexion,
-- ne crée que la ligne de suivi des succès.
--
-- Les quatre comptes existants ont leur profil parce qu'ils datent
-- d'avant. Le plus récent remonte au 03/02/2026 : personne ne s'est
-- inscrit depuis, et c'est la seule raison pour laquelle ça ne s'est
-- pas vu.
--
-- ═══ POURQUOI CE FICHIER NE SE CONTENTE PAS DE RECOLLER ═══
--
-- ATTACHER UN DÉCLENCHEUR CASSÉ À `auth.users` SERAIT PIRE QUE LE MAL :
-- une erreur dans la fonction fait échouer l'inscription ELLE-MÊME.
-- Aujourd'hui le compte se crée et l'application est vide ; demain le
-- compte ne se créerait pas du tout.
--
-- Les deux insertions ont donc été exécutées pour de vrai contre le
-- schéma d'aujourd'hui, dans une transaction annulée : profil créé,
-- rôle créé, rien conservé. Le schéma a beaucoup bougé depuis novembre
-- — `profiles` compte maintenant une vingtaine de colonnes NOT NULL —
-- mais toutes ont un défaut, sauf `id`.
--
-- ═══ CE QUI CHANGE PAR RAPPORT À L'ORIGINAL ═══
--
-- `ON CONFLICT DO NOTHING` sur les deux insertions. Sans lui, un profil
-- déjà présent — créé à la main, ou par une reprise — ferait lever le
-- déclencheur et bloquerait l'inscription. Un garde-fou ne doit pas
-- pouvoir devenir la panne.
--
-- Le reste est identique : SECURITY DEFINER, parce qu'il écrit dans des
-- tables protégées par RLS au moment où l'utilisateur n'a pas encore de
-- session ; et `search_path` fixé, comme les 89 autres fonctions
-- DEFINER du projet.
-- ═══════════════════════════════════════════════════════════════

begin;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', new.email))
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, 'user')
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

do $$
declare n int;
begin
  -- (a) le déclencheur existe et est actif.
  select count(*) into n
  from pg_trigger tg
  join pg_class cl on cl.oid = tg.tgrelid
  join pg_namespace ns on ns.oid = cl.relnamespace
  join pg_proc pr on pr.oid = tg.tgfoid
  where not tg.tgisinternal
    and ns.nspname = 'auth' and cl.relname = 'users'
    and pr.proname = 'handle_new_user'
    and tg.tgenabled = 'O';
  if n <> 1 then
    raise exception 'le déclencheur d''inscription n''est pas en place (trouvé %)', n;
  end if;

  -- (b) la fonction garde son search_path fixé.
  select count(*) into n
  from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
  where ns.nspname = 'public' and p.proname = 'handle_new_user'
    and p.prosecdef and p.proconfig is not null;
  if n <> 1 then
    raise exception 'handle_new_user doit rester SECURITY DEFINER avec un search_path fixé';
  end if;

  -- (c) LES COMPTES EXISTANTS N'ONT PAS BOUGÉ. Le déclencheur ne se
  --     déclenche qu'à l'insertion : rien ne devait changer ici, et on
  --     le vérifie plutôt que de le supposer.
  select count(*) into n from auth.users u
  where not exists (select 1 from public.profiles p where p.id = u.id);
  if n <> 0 then
    raise exception '% compte(s) sans profil — ce n''était pas le cas avant', n;
  end if;
end $$;

commit;
