-- ═══════════════════════════════════════════════════════════════════
-- RESTAURE DEPUIS LE REGISTRE DE LA BASE, LE 06/09/2026
-- ═══════════════════════════════════════════════════════════════════
--
-- Cette migration a ete APPLIQUEE en production le 2026-08-24
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

-- ═══════════════════════════════════════════════════════════════
-- LA FENETRE DE DEBLOCAGE SE REJOUAIT A CHAQUE VISITE
-- ═══════════════════════════════════════════════════════════════
--
-- user_achievements porte une politique de LECTURE et rien d autre.
-- RLS etant actif, un UPDATE sans politique est refuse EN SILENCE :
-- zero ligne touchee, aucune erreur remontee au client. Le drapeau
-- « seen » restait donc faux — les trente-six succes etaient encore a
-- false — et la page reannoncait les memes trois a chaque ouverture.
--
-- Un refus muet est le pire des refus : rien dans les journaux, rien
-- a l ecran, et un comportement qu on met une session a comprendre.
--
-- POURQUOI UNE FONCTION PLUTOT QU UNE POLITIQUE D UPDATE. RLS
-- s applique a la LIGNE, pas a la COLONNE : ouvrir l UPDATE laisserait
-- un client reecrire unlocked_at, progress, ou la clef du succes
-- elle-meme. Ici, une seule colonne bouge, et rien d autre n est
-- accessible.

create or replace function public.marquer_succes_vus(p_cles text[] default null)
returns integer
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_touchees integer;
begin
  if auth.uid() is null then
    return 0;
  end if;

  update public.user_achievements u
     set seen = true
   where u.user_id = auth.uid()
     and u.seen is distinct from true
     /* Sans liste, on marque tout ce qui reste : c est ce que fait la
        page quand elle a fini d annoncer. */
     and (p_cles is null or u.achievement_key = any(p_cles));

  get diagnostics v_touchees = row_count;
  return v_touchees;
end;
$$;

comment on function public.marquer_succes_vus(text[]) is
  'Marque comme vus les succes de la personne connectee. Une fonction plutot qu une politique d UPDATE : RLS s applique a la ligne, pas a la colonne, et seule « seen » doit pouvoir bouger.';

revoke all on function public.marquer_succes_vus(text[]) from public;
grant execute on function public.marquer_succes_vus(text[]) to authenticated;
