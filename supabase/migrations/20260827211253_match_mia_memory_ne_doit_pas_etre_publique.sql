-- ═══════════════════════════════════════════════════════════════
-- MA PROPRE RÉGRESSION, TROUVÉE EN VÉRIFIANT CELLE D'UN AUTRE
--
-- La migration 20260827194500 a créé `match_mia_memory` et lui a
-- accordé EXECUTE à `authenticated` et `service_role`. Elle s'appuyait
-- sur le garde-fou posé le matin même (20260827141935) :
--
--   alter default privileges in schema public
--     revoke execute on functions from public;
--
-- CE GARDE-FOU A FONCTIONNÉ SUR LES DROITS PAR DÉFAUT — la ligne de
-- `pg_default_acl` pour postgres/public ne contient plus PUBLIC.
-- Pourtant la fonction créée le soir porte `=X/postgres`. Le garde-fou
-- ne couvre pas le chemin par lequel cette fonction est née.
--
-- MESURE : sur les 99 fonctions non-extension du schéma public, une
-- seule était exécutable par PUBLIC. C'était celle-là. Créée le jour
-- même où l'on en avait retiré soixante-sept.
--
-- CE QUE ÇA COÛTAIT RÉELLEMENT : rien de visible. La fonction est
-- SECURITY DEFINER et filtre sur `user_id = auth.uid()` ; sous anon,
-- auth.uid() est nul, elle ne rend aucune ligne. Mais un EXECUTE
-- public sur une fonction SECURITY DEFINER est exactement la classe de
-- chose que la matinée a passé à retirer. La laisser, c'est rouvrir la
-- porte d'un cran et l'oublier.
--
-- ON NE TOUCHE PAS À `authenticated` : c'est le rôle sous lequel
-- ai-mia appelle la fonction, avec le JWT de l'utilisateur.
--
-- ANNULATION : supabase/migrations/annulations/20260827230500_annuler.sql
-- ═══════════════════════════════════════════════════════════════

revoke execute on function public.match_mia_memory(vector, integer, double precision) from public;

do $$
declare n integer;
begin
  -- Elle reste appelable par ceux qui doivent l'appeler.
  select count(*) into n
    from pg_proc p join pg_namespace s on s.oid = p.pronamespace
    where s.nspname = 'public' and p.proname = 'match_mia_memory'
      and array_to_string(p.proacl, ',') like '%authenticated=X%';
  if n <> 1 then
    raise exception 'match_mia_memory n''est plus appelable par authenticated';
  end if;

  -- Et plus AUCUNE fonction du schéma public n'est publique.
  select count(*) into n
    from pg_proc p join pg_namespace s on s.oid = p.pronamespace
    left join pg_depend d on d.objid = p.oid and d.deptype = 'e'
    where s.nspname = 'public' and d.objid is null
      and coalesce(array_to_string(p.proacl, ','), '') ~ '(^|,)=X/';
  if n <> 0 then
    raise exception '% fonction(s) du schéma public restent exécutables par PUBLIC', n;
  end if;
end $$;
