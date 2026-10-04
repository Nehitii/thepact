-- ═══════════════════════════════════════════════════════════════════
-- RENDRE LES QUATRE FONCTIONS QUE LE CODE APPELLE
-- ═══════════════════════════════════════════════════════════════════
--
-- ⚠ NE PAS APPLIQUER CE FICHIER PAR « supabase db push » : les deux
-- historiques de migration ont diverge (voir 20260906180000). Il se
-- colle SEUL dans l editeur SQL du projet, puis « Run ».
-- ═══════════════════════════════════════════════════════════════════
--
-- LA MIGRATION DU 06/09 A REVOQUE QUATRE FONCTIONS QUI SERVAIENT.
--
-- Son releve disait : « le depot appelle 46 RPC, toutes nommees en
-- clair — aucun appel dynamique, le grep est donc exhaustif ». Il ne
-- l etait pas. Quatre appels passent par un cast, ecrit du temps ou les
-- types engendres ne connaissaient pas encore ces fonctions :
--
--   (supabase.rpc as unknown as AppelRpc)("enregistrer_appel", { … })
--
-- Le motif « .rpc(" » ne les voit pas. Ils ont donc ete ranges parmi
-- « celles que rien n appelle, nulle part ». Appliquee le 23/09 a
-- 08:12 UTC avec l audit, la revocation a coupe :
--
--   enregistrer_appel       The Call : l appel du jour ne s enregistre
--                           plus. Journal du projet, le 23/09 a 14:18
--                           et 14:38 UTC : POST /rpc/enregistrer_appel
--                           → 403, « permission denied for function
--                           enregistrer_appel ». La page rend alors la
--                           main, sans projection ni revelation.
--   pouls_du_jour           le pouls de la barre systeme.
--   assurer_ordres_du_jour  les quetes du jour : leur creation.
--   claim_quest             les quetes du jour : leur recompense.
--
-- LE RELEVE A ETE REFAIT le 23/09 sur les DEUX formes d appel, y compris
-- sur plusieurs lignes : 44 fonctions appelees, dont 4 par un cast. En
-- base, ces quatre sont les SEULES que « authenticated » ne pouvait plus
-- executer ; les quarante autres sont intactes.
--
-- ═══ CE QU ON REND, ET A QUI ═══
--
-- Le droit d execution, a « authenticated » seul. Pas a « anon » : les
-- quatre ne sont appelees que depuis des pages sous session. Chacune
-- verifie son appelant — relu par pg_get_functiondef le 23/09 :
--
--   enregistrer_appel       « v_user_id <> auth.uid() » → Unauthorized
--   pouls_du_jour           ne lit que les lignes de auth.uid()
--   assurer_ordres_du_jour  n ecrit que pour auth.uid(), rien sans session
--   claim_quest             « Not owner », « Already claimed »,
--                           « Quest not completed »
--
-- ═══ CE QUI RESTE A DECIDER ═══
--
-- claim_quest credite des liens. La migration du 23/09 a pose
-- exiger_aal2() en tete des fonctions qui creditent — mais claim_quest
-- etait alors revoquee, et n a pas ete relevee. Ce fichier ne fait que
-- rendre l etat d avant ce matin ; la garde du second facteur est une
-- decision a part, a prendre avec le meme mecanisme d empreintes.
-- ═══════════════════════════════════════════════════════════════════

begin;

grant execute on function public.enregistrer_appel(p_pact_id uuid, p_jour date) to authenticated;
grant execute on function public.pouls_du_jour(p_debut timestamp with time zone, p_fin timestamp with time zone, p_jour date) to authenticated;
grant execute on function public.assurer_ordres_du_jour() to authenticated;
grant execute on function public.claim_quest(_quest_id uuid) to authenticated;

insert into supabase_migrations.schema_migrations (version, name, statements, rollback, created_by)
values ('20260923180000', 'rendre_les_quatre_fonctions_que_le_code_appelle',
        array[
          'grant execute on function public.enregistrer_appel(p_pact_id uuid, p_jour date) to authenticated;',
          'grant execute on function public.pouls_du_jour(p_debut timestamp with time zone, p_fin timestamp with time zone, p_jour date) to authenticated;',
          'grant execute on function public.assurer_ordres_du_jour() to authenticated;',
          'grant execute on function public.claim_quest(_quest_id uuid) to authenticated;'
        ],
        array[
          'revoke execute on function public.enregistrer_appel(p_pact_id uuid, p_jour date) from authenticated;',
          'revoke execute on function public.pouls_du_jour(p_debut timestamp with time zone, p_fin timestamp with time zone, p_jour date) from authenticated;',
          'revoke execute on function public.assurer_ordres_du_jour() from authenticated;',
          'revoke execute on function public.claim_quest(_quest_id uuid) from authenticated;'
        ],
        'editeur SQL, fichier du 23/09')
on conflict (version) do nothing;

commit;

-- ═══ Le controle ═══
-- Quatre lignes, et « true » partout dans « authenticated » : sinon
-- quelque chose n a pas pris.
select p.proname as fonction,
       has_function_privilege('authenticated', p.oid, 'execute') as authenticated,
       has_function_privilege('anon', p.oid, 'execute') as anon
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public'
   and p.proname in ('enregistrer_appel', 'pouls_du_jour', 'assurer_ordres_du_jour', 'claim_quest')
 order by p.proname;
