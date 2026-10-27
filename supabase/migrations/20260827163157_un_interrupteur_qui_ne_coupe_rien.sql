-- ═══════════════════════════════════════════════════════════════
-- UN INTERRUPTEUR QUI NE COUPE RIEN
--
-- Douze lignes dans `feature_flags`. Croisement fait le 27/08 entre les
-- clés de la table et celles que le code lit vraiment : TROIS ne
-- commandaient rien du tout.
--
-- 1. `coach_write_tools` — à `false`, et sa description promet
--    « Permet au coach IA de créer todos/journal/decisions ».
--    Aucun code ne la lisait. `ai-coach` exposait ses ONZE outils
--    d'écriture quoi qu'il arrive : M.I.A créait objectifs, tâches,
--    entrées de journal, évènements et souhaits, cochait des étapes et
--    déplaçait des échéances — pendant que le réglage disait non.
--
--    Un interrupteur qui ne coupe rien est pire que pas d'interrupteur :
--    on croit la porte fermée.
--
--    LE DRAPEAU S'OUVRE ET DEVIENT VRAI. Il passe à `true` — c'est le
--    comportement d'aujourd'hui, celui qu'on connaît — et `ai-coach` le
--    consulte désormais à chaque échange. Le refermer d'une ligne SQL
--    retire la plume à M.I.A sans redéployer quoi que ce soit : elle
--    garde ses douze outils de lecture, elle perd les onze autres.
--
-- 2. `social.templates_marketplace` — à `true`, et la place de marché de
--    modèles n'existe nulle part dans l'application. Rien à garder.
--
-- 3. `social.victory_reels` — à `false`. `useSocialFeatures` la résout,
--    mais AUCUN appelant ne lit le résultat : les vidéos du fil marchent,
--    et marchaient déjà. Le drapeau décrivait une fermeture qui n'a
--    jamais eu lieu.
--
--    Ces deux-là partent. La table ne décrit plus que ce qui existe.
--
-- CE QUI RESTE VRAI APRÈS
--   Dix drapeaux, dix lecteurs. `social.sharing` (GoalDetail) et
--   `goal_contracts` (deux entrées) restent les seules fermetures qui
--   agissent, plus les six `social.*` ouverts qui gardent leurs écrans.
--
-- POUR REVENIR EN ARRIÈRE
--   update public.feature_flags set enabled = false where key = 'coach_write_tools';
--   insert into public.feature_flags (key, enabled, description) values
--     ('social.templates_marketplace', true, '…'),
--     ('social.victory_reels', false, '…');
-- ═══════════════════════════════════════════════════════════════

update public.feature_flags
   set enabled = true,
       description = 'Autorise M.I.A à écrire : créer objectifs, tâches, '
                  || 'entrées de journal, évènements, souhaits ; cocher une '
                  || 'étape ou une tâche ; déplacer une échéance. Fermé, '
                  || 'elle garde ses douze outils de lecture et perd les onze autres.'
 where key = 'coach_write_tools';

delete from public.feature_flags
 where key in ('social.templates_marketplace', 'social.victory_reels');

-- ── VÉRIFICATION ─────────────────────────────────────────────────
do $$
declare
  ouvert boolean; restants int; morts int;
begin
  select enabled into ouvert from public.feature_flags where key = 'coach_write_tools';
  if ouvert is not true then
    raise exception 'ÉCHEC : coach_write_tools vaut % au lieu de true', coalesce(ouvert::text, 'absent');
  end if;

  select count(*) into morts from public.feature_flags
   where key in ('social.templates_marketplace', 'social.victory_reels');
  if morts > 0 then
    raise exception 'ÉCHEC : % drapeau(x) mort(s) subsiste(nt)', morts;
  end if;

  select count(*) into restants from public.feature_flags;
  raise notice 'Vérifié : % drapeaux restants, coach_write_tools ouvert.', restants;
end $$;
