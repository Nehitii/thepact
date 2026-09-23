-- ANNULER 20260923100000_la_double_authentification_garde_aussi_les_fonctions
--
-- Remet chaque fonction dans l etat releve le 23/09 : on retire ce que
-- la migration a insere, on remet la ligne qu elle a remplacee, puis
-- on rend les droits et les limites de depot d origine.

begin;

do $annulation$
declare
  cible record;
  v_def text;
begin
  for cible in
    select c.fonction::regprocedure as fonction, c.avant, c.apres
    from (values
      ('public.reset_pact_data(uuid)',                                     null::text, E'\n  perform public.exiger_aal2();'),
      ('public.purchase_bundle(uuid)',                                     null,       E'\n  perform public.exiger_aal2();'),
      ('public.purchase_daily_deal(uuid)',                                 null,       E'\n  perform public.exiger_aal2();'),
      ('public.purchase_shop_item(uuid, text)',                            null,       E'\n  perform public.exiger_aal2();'),
      ('public.redeem_promo_code(text)',                                   null,       E'\n  perform public.exiger_aal2();'),
      ('public.claim_notification_reward(uuid)',                           null,       E'\n  perform public.exiger_aal2();'),
      ('public.settle_contract(uuid, text)',                               null,       E'\n  perform public.exiger_aal2();'),
      ('public.sign_goal_contract(uuid, text)',                            null,       E'\n  perform public.exiger_aal2();'),
      ('public.clore_raid(uuid)',                                          null,       E'\n  perform public.exiger_aal2();'),
      ('public.create_guild_with_owner(text, text, text, text, boolean, integer)', null, E'\n  perform public.exiger_aal2();'),
      ('public.join_guild_via_code(text)',                                 null,       E'\n  perform public.exiger_aal2();'),
      ('public.accept_guild_invite(uuid)',                                 null,       E'\n  perform public.exiger_aal2();'),
      ('public.increment_tracking_counter(uuid, text, integer)', null,
       E'\n  if p_user_id is distinct from auth.uid() then\n    raise exception ''on_ne_compte_que_pour_soi'' using errcode = ''42501'';\n  end if;\n  if p_increment is null or p_increment <= 0 then\n    return;\n  end if;'),
      ('public.reclamer_les_trophees(uuid)', null,
       E'\n  if p_user_id is distinct from auth.uid() then\n    raise exception ''on_ne_reclame_que_pour_soi'' using errcode = ''42501'';\n  end if;'),
      ('public.admin_grant_cosmetic(uuid, uuid, text)',
       'IF NOT public.has_role(auth.uid(), ''admin''::public.app_role) THEN', 'IF NOT public.est_admin_eleve() THEN'),
      ('public.admin_reset_cosmetic(uuid, uuid)',
       'IF NOT public.has_role(auth.uid(), ''admin''::public.app_role) THEN', 'IF NOT public.est_admin_eleve() THEN')
    ) as c(fonction, avant, apres)
  loop
    v_def := pg_get_functiondef(cible.fonction);
    if position(cible.apres in v_def) = 0 then
      raise notice '% : rien a retirer', cible.fonction;
      continue;
    end if;
    execute replace(v_def, cible.apres, coalesce(cible.avant, ''));
  end loop;
end
$annulation$;

drop function if exists public.exiger_aal2();

grant execute on function public.snapshot_season_leaderboard(_season_id uuid, _top integer) to authenticated;

update storage.buckets
   set allowed_mime_types = null, file_size_limit = null
 where id in ('finance-icons', 'rank-images', 'victory-reels');

delete from supabase_migrations.schema_migrations where version = '20260923100000';

commit;
