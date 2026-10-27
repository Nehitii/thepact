-- ═══════════════════════════════════════════════════════════════════
-- RESTAURE DEPUIS LE REGISTRE DE LA BASE, LE 06/09/2026
-- ═══════════════════════════════════════════════════════════════════
--
-- Cette migration a ete APPLIQUEE en production le 2026-08-23
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

-- La cloture ecrivait l XP directement dans guilds.total_xp. Mais
-- add_guild_xp existait deja et fait DEUX choses : crediter la guilde
-- ET inscrire le gain au journal d activite. Ecrire a cote, c etait
-- gagner de l XP sans que le fil de la guilde le mentionne jamais.
--
-- On garde aussi coalesce : add_guild_xp fait « total_xp + p_amount »
-- sans garde, ce qui rendrait null si la colonne l etait.

alter table public.guilds alter column total_xp set default 0;
update public.guilds set total_xp = 0 where total_xp is null;

create or replace function public.clore_raid(p_raid_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_raid public.guild_raids;
  v_av jsonb;
  v_tot jsonb;
  v_reussi boolean;
  v_xp integer;
begin
  select * into v_raid from public.guild_raids where id = p_raid_id;
  if not found then
    return jsonb_build_object('success', false, 'error', 'Raid introuvable');
  end if;

  if not exists (
    select 1 from public.guild_members m
     where m.guild_id = v_raid.guild_id and m.user_id = auth.uid()
  ) then
    return jsonb_build_object('success', false, 'error', 'Vous n''etes pas membre de cette guilde');
  end if;

  if v_raid.resultat is not null then
    return jsonb_build_object('success', true, 'deja_clos', true, 'etat', v_raid.etat);
  end if;

  if now() < v_raid.finit_le then
    return jsonb_build_object('success', false, 'error', 'Le raid court encore');
  end if;

  v_av := public.guild_raid_avancement(p_raid_id);
  v_tot := v_av -> 'totaux';

  v_reussi :=
        (v_tot ->> 'etapes')::int    >= v_raid.cible_etapes
    and (v_tot ->> 'objectifs')::int >= v_raid.cible_objectifs
    and (v_tot ->> 'taches')::int    >= v_raid.cible_taches
    and (v_tot ->> 'journal')::int   >= v_raid.cible_journal;

  v_xp := case when v_reussi then
    v_raid.cible_etapes + v_raid.cible_taches
    + v_raid.cible_journal * 5 + v_raid.cible_objectifs * 10
  else 0 end;

  update public.guild_raids
     set etat = case when v_reussi then 'reussi' else 'echoue' end,
         clos_le = now(),
         resultat = v_av - 'trouve' - 'fige'
           || jsonb_build_object(
                'reussi', v_reussi,
                'xp', v_xp,
                'cibles', jsonb_build_object(
                  'etapes', v_raid.cible_etapes,
                  'objectifs', v_raid.cible_objectifs,
                  'taches', v_raid.cible_taches,
                  'journal', v_raid.cible_journal
                )
              )
   where id = p_raid_id;

  if v_xp > 0 then
    perform public.add_guild_xp(v_raid.guild_id, v_xp, v_raid.titre);
  end if;

  return jsonb_build_object(
    'success', true, 'deja_clos', false,
    'reussi', v_reussi, 'xp', v_xp
  );
end;
$$;
