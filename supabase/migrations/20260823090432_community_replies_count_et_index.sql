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
-- COMPTER LES REPONSES EN BASE, ET NON DANS LE NAVIGATEUR
-- ═══════════════════════════════════════════════════════════════
--
-- Le fil comptait les reponses en rapatriant TOUTES leurs lignes :
--   select post_id from community_replies where post_id in (...)
-- puis un comptage cote client. Vingt publications a cinquante
-- reponses font mille lignes transferees pour obtenir vingt nombres.
--
-- Les reactions sont deja comptees ici, par trg_reaction_counts. On
-- applique aux reponses exactement le meme traitement.

alter table public.community_posts
  add column if not exists replies_count integer not null default 0;

comment on column public.community_posts.replies_count is
  'Maintenu par trg_replies_count. Evite de rapatrier les lignes de reponses pour les compter.';

-- Reprise de l'existant.
update public.community_posts p
set replies_count = coalesce((
  select count(*) from public.community_replies r where r.post_id = p.id
), 0);

create or replace function public.maj_compte_reponses()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.community_posts
       set replies_count = replies_count + 1
     where id = new.post_id;
    return new;
  end if;

  if tg_op = 'DELETE' then
    update public.community_posts
       set replies_count = greatest(replies_count - 1, 0)
     where id = old.post_id;
    return old;
  end if;

  return null;
end;
$$;

drop trigger if exists trg_replies_count on public.community_replies;
create trigger trg_replies_count
  after insert or delete on public.community_replies
  for each row execute function public.maj_compte_reponses();

-- ═══════════════════════════════════════════════════════════════
-- LES DEUX LECTURES DU FIL ONT LEUR INDEX
-- ═══════════════════════════════════════════════════════════════
--
-- Le tri « populaire » ordonnait sur support_count sans index : un
-- balayage complet suivi d'un tri, des que la table grossit. Et le
-- fil filtre par nature sans qu'aucun index ne couvre le couple
-- (nature, date).

create index if not exists idx_community_posts_populaire
  on public.community_posts (support_count desc, created_at desc)
  where is_public;

create index if not exists idx_community_posts_nature_date
  on public.community_posts (post_type, created_at desc)
  where is_public;
