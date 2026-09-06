-- ═══════════════════════════════════════════════════════════════════
-- RESTAURE DEPUIS LE REGISTRE DE LA BASE, LE 06/09/2026
-- ═══════════════════════════════════════════════════════════════════
--
-- Cette migration a ete APPLIQUEE en production le 2026-08-25
-- sans qu un fichier soit ecrit dans le depot. Elle n existait plus
-- que dans « supabase_migrations.schema_migrations », qui garde le SQL
-- de chaque migration en plus de son numero.
--
-- Le contenu ci-dessous est celui du registre, mot pour mot — la prose
-- d origine comprise. Rien n a ete reecrit.
--
-- NE PAS LA REJOUER : elle est deja appliquee. Elle est ici pour que
-- « supabase/migrations » redevienne un compte rendu fidele du schema,
-- et pour qu un environnement neuf puisse etre reconstruit.
-- ═══════════════════════════════════════════════════════════════════

-- LE POULS DES CINQ SYSTEMES ACTIFS
--
-- La barre systeme porte cinq barres qui ondulaient a vide. Elles
-- disent maintenant si chacun des cinq systemes ou l'on FAIT quelque
-- chose a ete touche aujourd'hui : taches, appel, journal, sante,
-- focus. Les autres (objectifs, finance, liste de souhaits) sont
-- passifs et n'y figurent pas.
--
-- Une seule fonction plutot que cinq requetes : la barre est visible
-- sur toutes les pages de l'application, et cinq allers-retours par
-- page se paieraient partout.
--
-- La fenetre du jour est passee par le client, en heure LOCALE. Sans
-- ca, une session de concentration terminee a 00h30 a Paris tomberait
-- la veille en UTC, et la barre mentirait sur la journee.
--
-- Bornee a auth.uid() et sans parametre d'utilisateur : cette fonction
-- ne peut lire que la journee de celui qui l'appelle.
create or replace function public.pouls_du_jour(
  p_debut timestamptz,
  p_fin   timestamptz,
  p_jour  date
)
returns table(taches int, appel int, journal int, sante int, focus_minutes int)
language sql
stable
security definer
set search_path to 'public'
as $function$
  select
    (select count(*)::int
       from todo_tasks t
      where t.user_id = auth.uid()
        and t.completed_at >= p_debut and t.completed_at < p_fin),

    -- L'appel se note sur le pacte, pas dans une table d'evenements :
    -- une seule date, celle du dernier appel tenu.
    (select count(*)::int
       from pacts p
      where p.user_id = auth.uid()
        and p.last_checkin_date = p_jour),

    (select count(*)::int
       from journal_entries j
      where j.user_id = auth.uid()
        and j.created_at >= p_debut and j.created_at < p_fin),

    -- entry_date est une DATE : elle est deja dans le calendrier de
    -- l'utilisateur, on la compare au jour local et non a la fenetre.
    (select count(*)::int
       from health_data h
      where h.user_id = auth.uid()
        and h.entry_date = p_jour),

    -- Des MINUTES et non un nombre de sessions : trois minutes et une
    -- heure de concentration ne disent pas la meme chose.
    (select coalesce(sum(f.duration_minutes), 0)::int
       from focus_sessions f
      where f.user_id = auth.uid()
        and f.started_at >= p_debut and f.started_at < p_fin);
$function$;

revoke all on function public.pouls_du_jour(timestamptz, timestamptz, date) from public, anon;
grant execute on function public.pouls_du_jour(timestamptz, timestamptz, date) to authenticated;

comment on function public.pouls_du_jour(timestamptz, timestamptz, date) is
  'Les cinq systemes actifs touches aujourd''hui, pour les barres de la barre systeme. Fenetre locale fournie par le client. Bornee a auth.uid().';
