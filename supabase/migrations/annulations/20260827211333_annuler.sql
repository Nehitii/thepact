-- ANNULER : rendre match_mia_memory exécutable par anon.
--
-- Même remarque que pour 20260827230500 : la fonction ne rend rien
-- sous anon (elle filtre sur auth.uid(), qui y est nul). Lui rendre le
-- droit ne débloquerait donc rien — cela ne ferait que défaire
-- l'invariant « seules les cinq aides de politiques gardent anon ».

grant execute on function public.match_mia_memory(vector, integer, double precision) to anon;
