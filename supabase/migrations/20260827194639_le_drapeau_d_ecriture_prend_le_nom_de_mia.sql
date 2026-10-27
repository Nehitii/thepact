-- ═══════════════════════════════════════════════════════════════
-- LE DRAPEAU D'ÉCRITURE PREND LE NOM DE M.I.A
--
-- CE FICHIER A ÉTÉ ÉCRIT APRÈS COUP. La migration a été appliquée en
-- production le 27/08 à 19h46 et enregistrée sous la version
-- 20260827194639, mais le fichier n'avait jamais été posé dans le
-- dépôt — la reconstruction depuis `supabase/migrations/` aurait donc
-- laissé le drapeau sous son ancien nom, et `ai-mia` aurait cherché
-- une clé inexistante : `drapeauOuvert` aurait rendu « fermé », et
-- M.I.A aurait silencieusement perdu ses onze outils d'écriture.
--
-- L'oubli a été trouvé en vérifiant le travail d'une autre session,
-- qui venait précisément de réparer dix-huit fonctions vivant en
-- production sans exister dans le dépôt. Le contenu ci-dessous est
-- celui qui a réellement été exécuté.
--
-- ─────────────────────────────────────────────────────────────
--
-- `coach_write_tools` portait le dernier « coach » qui soit une
-- DONNÉE et non du schéma. Sa description disait déjà « M.I.A ».
--
-- Il n'est lu que par la fonction ai-mia, côté serveur : aucun front
-- déployé ne le connaît, donc pas besoin de couche de compatibilité.
-- Les dérogations par utilisateur sont renommées avec lui, sans quoi
-- elles pointeraient vers une clé qui n'existe plus et seraient
-- ignorées en silence — quelqu'un croirait avoir fermé un
-- interrupteur resté ouvert.
--
-- ANNULATION : supabase/migrations/annulations/20260827194639_annuler.sql
-- ═══════════════════════════════════════════════════════════════

update public.feature_flags
   set key = 'mia_write_tools'
 where key = 'coach_write_tools';

update public.user_feature_overrides
   set key = 'mia_write_tools'
 where key = 'coach_write_tools';

do $$
declare reste integer; nouveau integer;
begin
  select count(*) into reste from public.feature_flags where key like '%coach%';
  if reste <> 0 then
    raise exception 'il reste % drapeau(x) coach', reste;
  end if;

  select count(*) into nouveau from public.feature_flags where key = 'mia_write_tools';
  if nouveau <> 1 then
    raise exception 'attendu 1 drapeau mia_write_tools, trouvé %', nouveau;
  end if;

  select count(*) into reste from public.user_feature_overrides where key like '%coach%';
  if reste <> 0 then
    raise exception 'il reste % dérogation(s) coach', reste;
  end if;
end $$;
