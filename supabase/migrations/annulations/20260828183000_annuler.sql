-- ANNULER : retirer le déclencheur d'inscription.
--
-- À NE JOUER QUE DANS UN CAS : si une inscription échoue à cause de lui.
-- Le symptôme serait net — la création de compte renvoie une erreur au
-- lieu de réussir — et il vaut mieux le savoir que de le deviner, parce
-- que l'état qu'on retrouverait ensuite est celui d'AVANT le 28/08 :
-- les comptes se créent, mais sans profil ni rôle, et l'application est
-- vide pour la personne qui vient d'arriver.
--
-- AUTREMENT DIT, CETTE ANNULATION ÉCHANGE UNE PANNE VISIBLE CONTRE UNE
-- PANNE SILENCIEUSE. Ce n'est pas un retour à la normale, c'est un
-- retour au défaut. Si vous la jouez, ouvrez une tâche pour corriger la
-- fonction plutôt que de laisser les choses ainsi.
--
-- La fonction `handle_new_user()` est conservée : elle ne fait rien
-- tant qu'aucun déclencheur ne l'appelle, et la garder permet de
-- rebrancher sans réécrire.

begin;

drop trigger if exists on_auth_user_created on auth.users;

do $$
declare n int;
begin
  select count(*) into n
  from pg_trigger tg
  join pg_class cl on cl.oid = tg.tgrelid
  join pg_namespace ns on ns.oid = cl.relnamespace
  where not tg.tgisinternal and ns.nspname = 'auth' and cl.relname = 'users';
  if n <> 0 then
    raise exception 'il reste % déclencheur(s) sur auth.users', n;
  end if;
  raise notice 'déclencheur retiré — les inscriptions ne créeront plus de profil';
end $$;

commit;
