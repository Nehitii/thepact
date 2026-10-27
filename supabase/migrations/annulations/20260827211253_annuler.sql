-- ANNULER : rendre match_mia_memory exécutable par PUBLIC.
--
-- Ce fichier existe pour la symétrie, pas pour être joué : il remet une
-- fonction SECURITY DEFINER à la portée de n'importe qui. Il n'y a
-- aucune raison de le vouloir. S'il faut vraiment revenir en arrière,
-- c'est le signe qu'un appelant non authentifié existe quelque part —
-- et c'est CELUI-LÀ qu'il faut regarder.

grant execute on function public.match_mia_memory(vector, integer, double precision) to public;
