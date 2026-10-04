-- ANNULER 20260923180000_rendre_les_quatre_fonctions_que_le_code_appelle
--
-- Remet les quatre fonctions dans l etat de l audit du 23/09 : plus
-- executables par « authenticated ». ⚠ Cela recasse The Call,
-- le pouls de la barre systeme et les quetes du jour : les quatre sont
-- appelees par le code (voir l en-tete de la migration).

begin;

revoke execute on function public.enregistrer_appel(p_pact_id uuid, p_jour date) from authenticated;
revoke execute on function public.pouls_du_jour(p_debut timestamp with time zone, p_fin timestamp with time zone, p_jour date) from authenticated;
revoke execute on function public.assurer_ordres_du_jour() from authenticated;
revoke execute on function public.claim_quest(_quest_id uuid) from authenticated;

delete from supabase_migrations.schema_migrations where version = '20260923180000';

commit;
