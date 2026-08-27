-- ═══════════════════════════════════════════════════════════════
-- ON PEUT ENFIN TROUVER QUELQU'UN
--
-- RELEVÉ : 0 amitié en base. Ce n'est pas non plus un désintérêt.
--
-- La recherche d'alliés interroge `profiles` en `ilike` sur
-- display_name. Or `profiles` n'a qu'UNE politique de lecture :
-- « auth.uid() = id ». On ne lit que sa propre ligne — et la requête
-- s'exclut elle-même de ses résultats. Elle ne pouvait donc RIEN
-- rendre, jamais, quelle que soit la recherche. Vérifié en endossant
-- le rôle : « select count(*) from profiles » rend 1 ligne, la sienne.
-- Sans allié, pas de messagerie : la porte qu'on vient d'ouvrir
-- donnerait sur une pièce vide.
--
-- ═══ 1. UNE RECHERCHE QUI RESPECTE LE CHOIX DE CHACUN ═══
--
-- SECURITY DEFINER pour voir la table, mais la fonction ne rend que
-- les profils qui ont accepté d'être trouvés
-- (`community_profile_discoverable`). C'est précisément le sens de ce
-- réglage : le décocher doit rendre introuvable, et jusqu'ici il ne
-- changeait rien puisque personne n'était trouvable de toute façon.
--
-- Les blocages sont respectés dans LES DEUX SENS. Celui que j'ai
-- bloqué ne remonte pas ; celui qui m'a bloqué non plus — et cette
-- seconde moitié était impossible côté client, qui ne peut pas lire
-- les blocages d'autrui. Le filtre « dans les deux sens » du hook
-- était donc à moitié décoratif.
--
-- Les jokers de l'utilisateur sont neutralisés : une recherche sur
-- « % » ne doit pas rendre l'annuaire entier.
--
-- ═══ 2. UN ALLIÉ N'EST PAS UN INCONNU ═══
--
-- `profils_publics` accordait la visibilité à trois titres : profil
-- découvrable, soi-même, ou compagnon de guilde. Pas l'amitié. Un
-- allié qui a décoché « découvrable » serait donc apparu « Agent
-- Inconnu » dans la liste des conversations — alors qu'on a
-- explicitement accepté son alliance. On accepte une amitié en
-- sachant que l'autre nous verra ; c'est un consentement donné.
-- ═══════════════════════════════════════════════════════════════

-- ── 1. La visibilité s'étend aux alliés ────────────────────────

create or replace function public.profils_publics(p_ids uuid[])
returns table(
  id uuid, nom text, avatar text,
  decouvrable boolean, partage_objectifs boolean,
  vu_a timestamp with time zone
)
language sql
stable
security definer
set search_path to 'public'
as $function$
  select
    p.id,
    case when v.visible then p.display_name else null end,
    case when v.visible then p.avatar_url   else null end,
    v.visible,
    p.share_goals_progress,
    case when v.visible and p.show_activity_status then p.last_seen_at else null end
  from profiles p
  cross join lateral (
    select (
      p.community_profile_discoverable
      or p.id = auth.uid()
      or exists (
        select 1
          from guild_members a
          join guild_members b on b.guild_id = a.guild_id
         where a.user_id = auth.uid() and b.user_id = p.id
      )
      -- NOUVEAU : une alliance acceptée vaut consentement à être vu
      -- par son allié. Sans cela, on ne saurait pas à qui l'on écrit.
      or exists (
        select 1 from friendships f
         where f.status = 'accepted'
           and ((f.sender_id = auth.uid() and f.receiver_id = p.id)
             or (f.receiver_id = auth.uid() and f.sender_id = p.id))
      )
    ) as visible
  ) v
  where p.id = any(p_ids);
$function$;

-- ── 2. La recherche ────────────────────────────────────────────

create or replace function public.chercher_profils(p_requete text)
returns table(id uuid, nom text, avatar text)
language sql
stable
security definer
set search_path to 'public'
as $$
  select p.id, p.display_name, p.avatar_url
  from profiles p
  where
    -- Deux caractères au moins : en dessous, la recherche rendrait
    -- l'annuaire et ne serait plus une recherche.
    length(btrim(coalesce(p_requete, ''))) >= 2
    and p.id <> auth.uid()
    and p.community_profile_discoverable
    and p.display_name is not null
    -- Les jokers saisis sont traités comme des caractères ordinaires.
    and p.display_name ilike
        '%' || replace(replace(replace(btrim(p_requete), '\', '\'), '%', '\%'), '_', '\_') || '%'
        escape '\'
    and not exists (
      select 1 from blocked_users b
      where (b.user_id = auth.uid() and b.blocked_user_id = p.id)
         or (b.user_id = p.id and b.blocked_user_id = auth.uid())
    )
  order by
    -- Ce qui commence par la recherche passe devant ce qui la contient.
    case when p.display_name ilike btrim(p_requete) || '%' then 0 else 1 end,
    p.display_name
  limit 20;
$$;

comment on function public.chercher_profils(text) is
  'Recherche par nom affiché parmi les profils découvrables, hors soi-même et hors blocages dans les deux sens. Remplace la lecture directe de profiles, que RLS réduisait à sa propre ligne.';

revoke all on function public.chercher_profils(text) from public;
grant execute on function public.chercher_profils(text) to authenticated;

-- ── 3. Vérification dans la transaction ────────────────────────

do $$
begin
  if not exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'chercher_profils' and p.prosecdef
  ) then
    raise exception 'chercher_profils absente ou non SECURITY DEFINER.';
  end if;

  if (select pg_get_functiondef(p.oid) not like '%friendships%'
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = 'profils_publics') then
    raise exception 'profils_publics ne tient pas compte des alliances.';
  end if;
end $$;

-- ═══════════════════════════════════════════════════════════════
-- POUR ANNULER — à exécuter à la main :
--
--   drop function public.chercher_profils(text);
--   -- et retirer la branche « friendships » de profils_publics.
--
-- Annuler rend la recherche d'alliés à nouveau incapable de rendre
-- quoi que ce soit. Ne le faire que pour diagnostiquer.
-- ═══════════════════════════════════════════════════════════════
