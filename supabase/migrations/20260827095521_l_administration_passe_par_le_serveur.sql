-- ═══════════════════════════════════════════════════════════════
-- L'ADMINISTRATION PASSE PAR LE SERVEUR
--
-- ═══ 1. « ENVOYER À TOUS » ATTEIGNAIT UNE PERSONNE ═══
--
-- L'écran d'administration énumérait les destinataires depuis le
-- navigateur : « from('profiles').select('id') ». Or `profiles` n'a
-- qu'une politique de lecture — « auth.uid() = id ». MESURÉ en
-- endossant le rôle de l'administrateur : 1 profil rendu sur 4. La
-- diffusion partait donc vers l'administrateur lui-même, et le message
-- de succès annonçait « envoyé à 1 utilisateur ».
--
-- C'est la TROISIÈME fois que ce piège se referme dans ce dépôt : les
-- noms des conversations privées, la recherche d'alliés, et cette
-- diffusion. Toujours la même cause — du code client qui lit
-- `profiles` pour autrui. La règle qui en sort : ON N'ÉNUMÈRE JAMAIS
-- LES UTILISATEURS DEPUIS LE CLIENT.
--
-- ═══ 2. LE JOURNAL D'AUDIT NE POUVAIT PAS TENIR ═══
--
-- RELEVÉ : une seule ligne, datée du 8 mars, alors que 67 cosmétiques
-- ont été modifiés jusqu'au 24 août. Le client journalisait après coup,
-- dans un appel séparé dont l'erreur était ignorée : un refus passait
-- inaperçu.
--
-- Et la politique MFA restrictive était posée sur `admin_audit_log`
-- mais PAS sur `cosmetic_frames`. Le jour où un administrateur active
-- sa double authentification sans élever sa session, ses actions
-- passent et leurs traces sont refusées — le journal se tait
-- exactement quand il devient utile.
--
-- Ici, l'écriture du journal se fait DANS la même fonction et donc la
-- même transaction que l'action. Elle ne peut plus être ni oubliée, ni
-- refusée séparément, ni échouer en silence : si le journal ne
-- s'écrit pas, l'action n'a pas eu lieu.
--
-- ═══ 3. LA VOIE D'ACCÈS ═══
--
-- Le rôle seul ne suffit pas comme clé d'entrée : un jeton de session
-- volé le porte aussi. Ces fonctions exigent une session ÉLEVÉE
-- (aal2) — c'est-à-dire un second facteur présenté pour cette
-- session-là, pas seulement enrôlé sur le compte.
--
-- La machinerie existait déjà et ne servait presque à rien : la
-- politique `mfa_aal2_requis` dit « si tu as un facteur, utilise-le »,
-- ce qui ne protège personne tant que personne n'en a. Zéro facteur
-- vérifié en base au moment de cette migration. Ces fonctions-ci
-- exigent le second facteur FRANCHEMENT, sans le rendre facultatif.
--
-- Aucun risque d'enfermement : les écrans d'administration existants
-- continuent de fonctionner par leurs politiques actuelles. Seules les
-- fonctions créées ici demandent l'élévation, et l'écran d'entrée
-- conduit à l'enrôlement quand il manque.
-- ═══════════════════════════════════════════════════════════════

-- ── Le portier ─────────────────────────────────────────────────

create or replace function public.est_admin_eleve()
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select has_role(auth.uid(), 'admin'::app_role)
     and (select auth.jwt() ->> 'aal') = 'aal2';
$$;

comment on function public.est_admin_eleve() is
  'Administrateur ET session élevée par un second facteur (aal2). Le rôle seul ne suffit pas : un jeton volé le porte aussi.';

-- ── La diffusion ───────────────────────────────────────────────
--
-- Un destinataire nul vaut « à tout le monde ». Le compte rendu
-- distingue ce qui est parti de ce qui a été écarté : écrire une ligne
-- à quelqu'un qui a coupé la catégorie produit un avis qu'il ne verra
-- jamais — RELEVÉ : 64 des 66 avis en base sont dans ce cas. On ne
-- fabrique plus de décharge, et on dit combien on a écarté.

create or replace function public.diffuser_notification(
  p_titre            text,
  p_description      text default null,
  p_categorie        notification_category default 'system',
  p_priorite         notification_priority default 'informational',
  p_icone            text default 'bell',
  p_cta_label        text default null,
  p_cta_url          text default null,
  p_recompense_type  text default null,
  p_recompense_montant integer default null,
  p_recompense_cosmetique uuid default null,
  p_destinataire     uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_envoyes integer := 0;
  v_ecartes integer := 0;
  v_cibles  integer := 0;
begin
  if not est_admin_eleve() then
    raise exception 'Réservé aux administrateurs avec une session élevée (aal2).'
      using errcode = '42501';
  end if;

  if p_titre is null or btrim(p_titre) = '' then
    raise exception 'Un avis sans titre n''en est pas un.' using errcode = '22023';
  end if;

  -- Le lien d'action doit rester interne. Le client le vérifiait déjà ;
  -- le refuser ici empêche d'écrire une redirection ouverte dans la
  -- boîte de milliers de gens, quel que soit l'écran utilisé.
  if p_cta_url is not null
     and (left(p_cta_url, 1) <> '/' or left(p_cta_url, 2) = '//') then
    raise exception 'Le lien doit être un chemin interne commençant par « / ».'
      using errcode = '22023';
  end if;

  with cibles as (
    select p.id
    from profiles p
    where (p_destinataire is null or p.id = p_destinataire)
  ),
  retenues as (
    select c.id
    from cibles c
    left join notification_settings s on s.user_id = c.id
    where case p_categorie
            when 'system'    then coalesce(s.system_enabled, true)
            when 'progress'  then coalesce(s.progress_enabled, true)
            when 'social'    then coalesce(s.social_enabled, true)
            when 'marketing' then coalesce(s.marketing_enabled, true)
            else true
          end
  ),
  posees as (
    insert into notifications (
      user_id, title, description, category, priority, icon_key,
      cta_label, cta_url, reward_type, reward_amount,
      reward_cosmetic_id, reward_cosmetic_type
    )
    select
      r.id, btrim(p_titre), nullif(btrim(coalesce(p_description, '')), ''),
      p_categorie, p_priorite, coalesce(nullif(btrim(p_icone), ''), 'bell'),
      nullif(btrim(coalesce(p_cta_label, '')), ''), p_cta_url,
      p_recompense_type,
      case when p_recompense_type = 'bonds' then p_recompense_montant end,
      case when p_recompense_type is distinct from 'bonds' then p_recompense_cosmetique end,
      case when p_recompense_type is distinct from 'bonds' then p_recompense_type end
    from retenues r
    returning 1
  )
  select
    (select count(*) from posees),
    (select count(*) from cibles)
  into v_envoyes, v_cibles;

  v_ecartes := v_cibles - v_envoyes;

  if v_cibles = 0 then
    raise exception 'Aucun destinataire.' using errcode = '22023';
  end if;

  -- LA TRACE EST DANS LA MÊME TRANSACTION QUE L'ACTE.
  insert into admin_audit_log (admin_user_id, action, target_type, target_id, metadata)
  values (
    auth.uid(), 'diffusion', 'notification', p_destinataire::text,
    jsonb_build_object(
      'titre', btrim(p_titre),
      'categorie', p_categorie::text,
      'priorite', p_priorite::text,
      'cible', case when p_destinataire is null then 'tous' else 'une personne' end,
      'envoyes', v_envoyes,
      'ecartes', v_ecartes,
      'recompense', p_recompense_type
    )
  );

  return jsonb_build_object('envoyes', v_envoyes, 'ecartes', v_ecartes, 'cibles', v_cibles);
end;
$$;

comment on function public.diffuser_notification is
  'Diffuse un avis à tous les utilisateurs ou à un seul. Énumère côté serveur — le client ne voit qu''une ligne de profiles — respecte les préférences de catégorie, et journalise dans la même transaction.';

-- ── Le journal, lisible ────────────────────────────────────────
--
-- L'onglet « historique » lisait `notifications` sans filtre. RLS ne
-- rendant que les siennes, il montrait ce que l'administrateur avait
-- REÇU en le présentant comme ce qu'il avait ENVOYÉ. L'historique des
-- actes d'administration est dans le journal, pas chez les
-- destinataires.
--
-- `target_id` est du TEXTE dans cette table, pas un uuid : le type de
-- retour le dit, plutôt que de le supposer.

create or replace function public.journal_admin(p_limite integer default 50)
returns table(
  id uuid, quand timestamptz, qui text,
  action text, cible_type text, cible_id text, details jsonb
)
language sql
stable
security definer
set search_path to 'public'
as $$
  select l.id, l.created_at, coalesce(p.display_name, 'Compte supprimé'),
         l.action, l.target_type, l.target_id, l.metadata
  from admin_audit_log l
  left join profiles p on p.id = l.admin_user_id
  where has_role(auth.uid(), 'admin'::app_role)
  order by l.created_at desc
  limit greatest(1, least(coalesce(p_limite, 50), 200));
$$;

-- ── Qui détient les clés ───────────────────────────────────────
--
-- RELEVÉ : trois administrateurs sur quatre comptes, dont deux dont la
-- dernière connexion remonte à sept et neuf mois. Un identifiant
-- d'administrateur dormant est le plus facile à compromettre, et il
-- contourne tout le reste puisqu'il est légitime. Encore fallait-il
-- pouvoir les voir : `profiles` n'en montre qu'un, et
-- `auth.users.last_sign_in_at` n'est pas lisible du client.

create or replace function public.roster_admin()
returns table(
  user_id uuid, nom text, role text,
  depuis timestamptz, derniere_connexion timestamptz,
  a_un_second_facteur boolean, c_est_moi boolean
)
language sql
stable
security definer
set search_path to 'public'
as $$
  select
    r.user_id,
    coalesce(p.display_name, 'Sans nom'),
    r.role::text,
    r.created_at,
    u.last_sign_in_at,
    exists (select 1 from auth.mfa_factors f
             where f.user_id = r.user_id and f.status = 'verified'),
    r.user_id = auth.uid()
  from user_roles r
  left join profiles p on p.id = r.user_id
  left join auth.users u on u.id = r.user_id
  where has_role(auth.uid(), 'admin'::app_role)
  order by (r.role = 'admin') desc, u.last_sign_in_at desc nulls last;
$$;

-- ── Donner et retirer le rôle, sans pouvoir s'enfermer dehors ──

create or replace function public.changer_le_role(p_user_id uuid, p_admin boolean)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare v_restants integer;
begin
  if not est_admin_eleve() then
    raise exception 'Réservé aux administrateurs avec une session élevée (aal2).'
      using errcode = '42501';
  end if;

  if p_admin then
    insert into user_roles (user_id, role)
    values (p_user_id, 'admin'::app_role)
    on conflict do nothing;
  else
    -- DEUX VERROUS CONTRE L'ENFERMEMENT DEHORS. On ne retire pas son
    -- propre rôle — l'erreur d'un clic coûterait l'accès — et on ne
    -- retire jamais le dernier : plus personne ne pourrait en redonner.
    if p_user_id = auth.uid() then
      raise exception 'On ne retire pas son propre rôle d''administrateur.'
        using errcode = '42501';
    end if;
    select count(*) into v_restants
    from user_roles where role = 'admin'::app_role and user_id <> p_user_id;
    if v_restants = 0 then
      raise exception 'Il doit rester au moins un administrateur.'
        using errcode = '42501';
    end if;
    delete from user_roles where user_id = p_user_id and role = 'admin'::app_role;
  end if;

  insert into admin_audit_log (admin_user_id, action, target_type, target_id, metadata)
  values (auth.uid(), case when p_admin then 'role_donne' else 'role_retire' end,
          'user_role', p_user_id::text, jsonb_build_object('admin', p_admin));

  return jsonb_build_object('ok', true);
end;
$$;

-- ── Les droits d'exécution ─────────────────────────────────────
--
-- Supabase accorde EXECUTE à `public` par défaut : `anon` pouvait donc
-- appeler chaque fonction SECURITY DEFINER. Aucune n'était exploitable
-- — toutes vérifient `auth.uid()` — mais c'était ouvert par défaut au
-- lieu d'être fermé par défaut. On ferme, pour celles qui exigent de
-- toute façon une session.

revoke all on function public.est_admin_eleve() from public, anon;
revoke all on function public.diffuser_notification(text, text, notification_category, notification_priority, text, text, text, text, integer, uuid, uuid) from public, anon;
revoke all on function public.journal_admin(integer) from public, anon;
revoke all on function public.roster_admin() from public, anon;
revoke all on function public.changer_le_role(uuid, boolean) from public, anon;

grant execute on function public.est_admin_eleve() to authenticated;
grant execute on function public.diffuser_notification(text, text, notification_category, notification_priority, text, text, text, text, integer, uuid, uuid) to authenticated;
grant execute on function public.journal_admin(integer) to authenticated;
grant execute on function public.roster_admin() to authenticated;
grant execute on function public.changer_le_role(uuid, boolean) to authenticated;

revoke execute on function public.admin_grant_cosmetic(uuid, uuid, text) from anon;
revoke execute on function public.admin_reset_cosmetic(uuid, uuid) from anon;
revoke execute on function public.reset_pact_data(uuid) from anon;
revoke execute on function public.grant_achievement(text) from anon;
revoke execute on function public.claim_quest(uuid) from anon;
revoke execute on function public.claim_notification_reward(uuid) from anon;
revoke execute on function public.purchase_shop_item(uuid, text) from anon;
revoke execute on function public.purchase_bundle(uuid) from anon;
revoke execute on function public.purchase_daily_deal(uuid) from anon;
revoke execute on function public.peut_ecrire_a(uuid) from anon;
revoke execute on function public.chercher_profils(text) from anon;

-- ── Vérification dans la transaction ───────────────────────────

do $$
begin
  if has_function_privilege('anon', 'public.diffuser_notification(text, text, notification_category, notification_priority, text, text, text, text, integer, uuid, uuid)', 'EXECUTE') then
    raise exception 'anon peut encore diffuser.';
  end if;
  if not has_function_privilege('authenticated', 'public.roster_admin()', 'EXECUTE') then
    raise exception 'Un administrateur ne peut pas lire le roster.';
  end if;
end $$;

-- ═══════════════════════════════════════════════════════════════
-- POUR ANNULER — à exécuter à la main :
--
--   drop function public.diffuser_notification(text, text, notification_category, notification_priority, text, text, text, text, integer, uuid, uuid);
--   drop function public.changer_le_role(uuid, boolean);
--   drop function public.roster_admin();
--   drop function public.journal_admin(integer);
--   drop function public.est_admin_eleve();
--
-- Annuler rend l'administration à son état d'avant : la diffusion
-- n'atteint plus qu'une personne, le journal redevient facultatif, et
-- le rôle seul rouvre la porte. Ne le faire que pour diagnostiquer.
-- ═══════════════════════════════════════════════════════════════
