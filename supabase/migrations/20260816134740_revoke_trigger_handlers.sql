-- Les handlers de trigger n'ont aucun usage legitime via /rest/v1/rpc :
-- ils sont invoques par le moteur, avec les droits du proprietaire de la
-- table. Le GRANT EXECUTE par defaut de Postgres les exposait pourtant au
-- role anon, donc a quiconque dispose de la cle publiable.
--
-- La boucle couvre toutes les fonctions retournant trigger, y compris
-- celles qui seront ajoutees plus tard et rejoueront cette migration.

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS signature
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND pg_get_function_result(p.oid) = 'trigger'
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM anon, authenticated, PUBLIC', r.signature);
  END LOOP;
END $$;