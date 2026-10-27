-- ═══════════════════════════════════════════════════════════════
-- L'ADMINISTRATION A ENFIN UN ANNUAIRE
--
-- La liste déroulante « écrire à une personne » se remplissait avec
-- « from('profiles').select('id, display_name') ». Même piège que la
-- diffusion : `profiles` ne rend que sa propre ligne. La liste
-- contenait donc UN nom — celui de l'administrateur — et viser
-- quelqu'un d'autre était impossible depuis l'écran.
--
-- Plus largement : un panneau d'administration sans liste
-- d'utilisateurs n'administre rien. Celle-ci est la seule vue
-- d'ensemble du peuplement de l'application.
--
-- Ce qu'elle NE rend PAS : ni adresse e-mail, ni jeton, ni rien qui
-- serve à autre chose qu'identifier et dater. Un écran d'administration
-- n'a pas besoin des adresses pour fonctionner, et ce qui n'est pas
-- envoyé ne peut pas fuiter.
-- ═══════════════════════════════════════════════════════════════

create or replace function public.annuaire_utilisateurs(p_recherche text default null)
returns table(
  user_id uuid,
  nom text,
  inscrit_le timestamptz,
  derniere_connexion timestamptz,
  est_admin boolean
)
language sql
stable
security definer
set search_path to 'public'
as $$
  select
    p.id,
    coalesce(nullif(btrim(p.display_name), ''), 'Sans nom'),
    u.created_at,
    u.last_sign_in_at,
    exists (select 1 from user_roles r
             where r.user_id = p.id and r.role = 'admin'::app_role)
  from profiles p
  left join auth.users u on u.id = p.id
  where has_role(auth.uid(), 'admin'::app_role)
    and (
      p_recherche is null
      or btrim(p_recherche) = ''
      -- Les jokers saisis restent des caractères ordinaires.
      or p.display_name ilike '%' ||
         replace(replace(replace(btrim(p_recherche), '\', '\'), '%', '\%'), '_', '\_')
         || '%' escape '\'
    )
  order by u.last_sign_in_at desc nulls last, p.display_name
  limit 200;
$$;

comment on function public.annuaire_utilisateurs(text) is
  'Liste des utilisateurs pour l''administration : identifiant, nom affiché, inscription, dernière connexion, rôle. Aucune adresse e-mail. Réservée aux administrateurs.';

revoke all on function public.annuaire_utilisateurs(text) from public, anon;
grant execute on function public.annuaire_utilisateurs(text) to authenticated;

do $$
begin
  if has_function_privilege('anon', 'public.annuaire_utilisateurs(text)', 'EXECUTE') then
    raise exception 'anon peut lire l''annuaire.';
  end if;
end $$;

-- ═══════════════════════════════════════════════════════════════
-- POUR ANNULER :  drop function public.annuaire_utilisateurs(text);
-- L'écran d'administration perd alors sa liste d'utilisateurs et ne
-- peut plus viser personne nommément.
-- ═══════════════════════════════════════════════════════════════
