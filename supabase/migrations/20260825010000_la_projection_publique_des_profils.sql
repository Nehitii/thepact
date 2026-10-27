-- LES RÉGLAGES DE CONFIDENTIALITÉ NE COMMANDAIENT RIEN.
--
-- `profiles` n'a qu'une seule politique SELECT : `auth.uid() = id`. Un
-- client ne peut donc lire que sa propre ligne — vérifié en direct :
-- deux profils demandés, un seul rendu.
--
-- Or six écrans lisaient `profiles` pour AUTRUI : le fil de la
-- communauté, ses réponses, les reels, le chat de guilde, les comptes
-- bloqués. Ils recevaient un tableau vide et retombaient sur `?? true`
-- puis sur « Anonyme ». Conséquences :
--
--   • personne n'avait de nom ni d'avatar dans la communauté ;
--   • couper « profil découvrable » ne changeait rien, puisque
--     l'absence de donnée produisait déjà le même résultat.
--
-- Cette fonction rend la projection publique et applique la règle CÔTÉ
-- SERVEUR : quand un profil n'est pas visible, son nom et son avatar ne
-- partent pas. Le client ne peut pas divulguer ce qu'il ne reçoit
-- jamais — c'est ce qui sépare un filtre d'affichage d'un contrôle de
-- confidentialité.
--
-- La règle de visibilité est celle de `carte_profil_public`, pour
-- qu'une seule définition gouverne : découvrable, ou soi-même, ou
-- compagnon de guilde.
create or replace function public.profils_publics(p_ids uuid[])
returns table (
  id uuid,
  nom text,
  avatar text,
  decouvrable boolean,
  partage_objectifs boolean
)
language sql
stable
security definer
set search_path to 'public'
as $$
  select
    p.id,
    case when v.visible then p.display_name else null end,
    case when v.visible then p.avatar_url   else null end,
    v.visible,
    p.share_goals_progress
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
    ) as visible
  ) v
  where p.id = any(p_ids);
$$;

comment on function public.profils_publics(uuid[]) is
  'Projection publique des profils : nom et avatar nuls quand le profil n''est pas visible pour l''appelant.';

revoke all on function public.profils_publics(uuid[]) from public;
grant execute on function public.profils_publics(uuid[]) to authenticated;
