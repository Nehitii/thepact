-- ═══════════════════════════════════════════════════════════════
-- UNE ALERTE CRITIQUE NE SE FAIT PAS TAIRE
--
-- Le déclencheur `notifications_categorie_voulue` fait exactement ce
-- qu'il faut depuis le 25 août : il abandonne une notification dont la
-- catégorie est coupée, au seul endroit par lequel tout passe. Rien à
-- refaire là.
--
-- Il lui manque UNE exception, et c'est la seule qui compte.
--
-- Les quatre bascules disent « je ne veux pas de cette FAMILLE de
-- messages ». Elles ne disent pas « je renonce à être prévenu que mon
-- compte est en cause ». Or la priorité « critical » existe justement
-- pour ça — et telle quelle, décocher « Système » suffisait à faire
-- disparaître en silence une alerte de sécurité ou de compte.
--
-- VÉRIFIÉ AVANT CORRECTION, dans une transaction annulée : sur un
-- compte ayant coupé « progress », un avis « progress / critical » ne
-- passait pas.
--
-- Le reste ne bouge pas. Une alerte critique reste rare par
-- construction : c'est un niveau de priorité que seul le produit pose,
-- jamais l'utilisateur, et l'exempter ne rouvre aucune vanne.
-- ═══════════════════════════════════════════════════════════════

create or replace function public.categorie_de_notification_voulue()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  voulu boolean;
begin
  -- L'EXCEPTION, ET ELLE EST UNIQUE. On peut faire taire une famille de
  -- messages, pas une alerte qui porte sur le compte lui-même.
  if new.priority = 'critical'::notification_priority then
    return new;
  end if;

  select case new.category
           when 'system'    then ns.system_enabled
           when 'progress'  then ns.progress_enabled
           when 'social'    then ns.social_enabled
           when 'marketing' then ns.marketing_enabled
         end
    into voulu
    from notification_settings ns
   where ns.user_id = new.user_id;

  -- Aucune ligne de préférences : les défauts de la table valent tous
  -- `true`, donc on accepte.
  if voulu is null or voulu then
    return new;
  end if;

  return null;
end;
$function$;

comment on function public.categorie_de_notification_voulue() is
  'Abandonne une notification dont la catégorie est désactivée dans notification_settings. Les alertes de priorité « critical » passent toujours : une bascule de catégorie ne fait pas taire une alerte portant sur le compte.';

-- ── Vérification dans la transaction ───────────────────────────
--
-- Trois écritures sur un compte qui a coupé « progress », puis on
-- efface : la catégorie coupée doit manquer, le système et le critique
-- doivent passer.

do $$
declare
  v_user uuid;
  v_avant integer;
  v_apres integer;
begin
  select user_id into v_user
  from notification_settings where progress_enabled = false limit 1;

  if v_user is null then
    raise notice 'Aucun compte avec « progress » coupé : contrôle non joué.';
    return;
  end if;

  select count(*) into v_avant from notifications where user_id = v_user;

  insert into notifications (user_id, category, priority, title)
  values (v_user, 'progress',    'informational', 'controle-ecarte'),
         (v_user, 'system',      'informational', 'controle-passe'),
         (v_user, 'progress',    'critical',      'controle-critique');

  select count(*) into v_apres from notifications where user_id = v_user;

  if v_apres - v_avant <> 2 then
    raise exception 'Attendu 2 lignes posées, obtenu %.', v_apres - v_avant;
  end if;

  if not exists (select 1 from notifications where user_id = v_user and title = 'controle-critique') then
    raise exception 'L''alerte critique a été écartée.';
  end if;

  delete from notifications
  where user_id = v_user
    and title in ('controle-ecarte', 'controle-passe', 'controle-critique');
end $$;

-- ═══════════════════════════════════════════════════════════════
-- POUR ANNULER : retirer les quatre lignes de l'exception « critical »
-- en tête de la fonction. Une bascule de catégorie redeviendrait alors
-- capable de faire taire une alerte de sécurité.
-- ═══════════════════════════════════════════════════════════════
