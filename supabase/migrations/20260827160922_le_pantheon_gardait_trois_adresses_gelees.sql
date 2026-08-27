-- ═══════════════════════════════════════════════════════════════
-- LE PANTHÉON GARDAIT TROIS ADRESSES GELÉES
--
-- CE QUI ÉTAIT LISIBLE SANS COMPTE
--
-- `hall_of_fame` est une PHOTO : `snapshot_season_leaderboard` y recopie
-- `profiles.display_name` au moment où la saison se clôt. La photo de la
-- saison 1 a été prise AVANT que la garde `pas_d_adresse_en_pseudo` soit
-- posée sur `profiles`. Elle a donc figé ce qui s'y trouvait :
--
--   1. luzignantvalerie@gmail.com
--   2. everythingisaedelweiss@gmail.com
--   3. geoffrey.luzignant@gmail.com
--   4. Nehiti
--
-- Trois adresses, chacune attachée à un identifiant de compte, dans une
-- table qu'un visiteur sans compte peut lire. Les mêmes se trouvaient
-- une deuxième fois dans `seasons.leaderboard_snapshot`, le JSONB que la
-- même fonction écrit — lisible sans compte lui aussi.
--
-- La garde sur `profiles` fonctionne : zéro profil porte une adresse
-- aujourd'hui, et les trois comptes ont depuis un vrai pseudonyme
-- (Grèbe Discret, Bouquetin Obstiné, Héron Attentif). Seule la photo
-- gardait l'ancien état.
--
-- CE QUE CETTE MIGRATION FAIT
--
--   1. Remplace l'adresse par le pseudonyme ACTUEL du compte — pas par un
--      nom tiré au hasard : le panthéon montre ainsi le nom sous lequel la
--      personne est connue aujourd'hui.
--   2. Reconstruit `seasons.leaderboard_snapshot` depuis la table corrigée.
--   3. Pose la MÊME garde sur `hall_of_fame` que sur `profiles`, pour que
--      la prochaine photo ne puisse plus geler d'adresse — même si la
--      garde amont venait à sauter.
--
-- « Nehiti » n'est pas une adresse : ce nom-là ne bouge pas.
--
-- POUR REVENIR EN ARRIÈRE
--   Il n'y a pas de retour : les adresses ne sont pas conservées ici, et
--   c'est le but. Elles restent dans `auth.users`, à leur place.
-- ═══════════════════════════════════════════════════════════════

-- ── 1. La photo ──────────────────────────────────────────────────
update public.hall_of_fame h
   set display_name = coalesce(
         nullif(btrim(p.display_name), ''),
         public.pseudonyme_de(h.user_id)
       )
  from public.profiles p
 where p.id = h.user_id
   and h.display_name like '%@%';

-- Un compte effacé depuis : on retombe sur le pseudonyme dérivé.
update public.hall_of_fame h
   set display_name = public.pseudonyme_de(h.user_id)
 where h.display_name like '%@%';

-- ── 2. Le JSONB qui la recopie ───────────────────────────────────
update public.seasons s
   set leaderboard_snapshot = (
     select jsonb_agg(jsonb_build_object(
       'rank', h.rank, 'user_id', h.user_id, 'display_name', h.display_name,
       'points', h.points, 'prestige', h.prestige_awarded
     ) order by h.rank)
     from public.hall_of_fame h
     where h.season_id = s.id
   )
 where exists (select 1 from public.hall_of_fame h where h.season_id = s.id);

-- ── 3. La garde, à l'endroit où la photo se prend ────────────────
create or replace function public.pas_d_adresse_au_pantheon()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  /* Même règle que `pas_d_adresse_en_pseudo` sur `profiles`, posée une
     seconde fois ici. Ce n'est pas de la redondance inutile : la photo
     se prend depuis une AUTRE table, et une garde qui n'existe qu'en
     amont ne protège pas ce qui a déjà été recopié. */
  if new.display_name is null
     or btrim(new.display_name) = ''
     or new.display_name like '%@%' then
    new.display_name := public.pseudonyme_de(new.user_id);
  end if;
  return new;
end;
$$;

revoke execute on function public.pas_d_adresse_au_pantheon() from public, anon;

drop trigger if exists hall_of_fame_pas_d_adresse on public.hall_of_fame;
create trigger hall_of_fame_pas_d_adresse
  before insert or update of display_name on public.hall_of_fame
  for each row execute function public.pas_d_adresse_au_pantheon();

-- ── VÉRIFICATION ─────────────────────────────────────────────────
do $$
declare
  n_table int; n_json int; essai text;
begin
  select count(*) into n_table from public.hall_of_fame where display_name like '%@%';

  select count(*) into n_json
  from public.seasons s, jsonb_array_elements(coalesce(s.leaderboard_snapshot,'[]'::jsonb)) e
  where e ->> 'display_name' like '%@%';

  if n_table > 0 or n_json > 0 then
    raise exception 'ÉCHEC : % adresse(s) dans la table, % dans le JSONB', n_table, n_json;
  end if;

  /* LA GARDE SE PROUVE EN ESSAYANT DE LA FRANCHIR.
     Le bloc imbriqué pose un point de reprise implicite : l'écriture de
     test est annulée en le quittant, sans toucher au reste. */
  begin
    update public.hall_of_fame set display_name = 'test@exemple.fr' where rank = 1;
    select display_name into essai from public.hall_of_fame where rank = 1;
    if essai like '%@%' then
      raise exception 'GARDE_PERCEE:%', essai;
    end if;
    raise exception 'ANNULATION_DU_TEST';
  exception
    when others then
      if sqlerrm like 'GARDE_PERCEE:%' then
        raise exception 'ÉCHEC : la garde laisse passer une adresse (%)', substr(sqlerrm, 14);
      elsif sqlerrm <> 'ANNULATION_DU_TEST' then
        raise;
      end if;
  end;

  raise notice 'Vérifié : ni la table ni le JSONB ne portent d''adresse, et la garde tient.';
end $$;
