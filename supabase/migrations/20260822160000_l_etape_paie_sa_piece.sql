-- L ETAPE VALIDEE PAIE SA PIECE
--
-- Le financement du pacte ne comptait une piece que si elle portait
-- acquired_at. Or personne ne coche cette case : on valide l ETAPE qui
-- correspond a l achat, et l on considere l achat fait.
--
-- Mesure avant correction : sur soixante-neuf pieces, soixante-cinq
-- sont liees a une etape, quarante-trois ont leur etape validee, et
-- AUCUNE ne compte. Hors objectifs deja termines — qui comptent en
-- entier par un autre chemin — cela fait trente-et-une pieces sur six
-- objectifs, soit 4 695,01 euros absents du financement. La branche
-- « pieces » du calcul rapportait exactement zero.
--
-- POURQUOI UN DECLENCHEUR ET NON DU CODE. Six endroits ecrivent
-- steps.status : useGoalDetailActions (deux fois), goalDetailHandlers,
-- StepDetail, useActiveMission, useReviews et useTodoList. Poser la
-- regle dans l un d eux laisserait cinq trous. Elle appartient a la
-- base, ou aucun chemin ne peut la contourner.
--
-- ON GARDE LA PROVENANCE DE L ACQUISITION.
--
-- Une piece peut avoir ete achetee AVANT que l etape soit faite : on
-- l a cochee a la main. Si la validation de l etape et son annulation
-- ecrivaient toutes deux acquired_at sans distinction, annuler une
-- etape effacerait une acquisition reelle — une perte de donnee pour
-- corriger un chiffre.
--
-- acquired_via_step retient donc QUI a coche. L annulation d une etape
-- ne defait que ce que l etape avait fait ; une acquisition manuelle
-- reste intacte.

alter table public.goal_cost_items
  add column if not exists acquired_via_step boolean not null default false;

comment on column public.goal_cost_items.acquired_via_step is
  'Vrai quand acquired_at a ete pose par la validation de l etape liee, et non a la main. Permet a l annulation de l etape de ne defaire que ce qu elle avait fait.';

create or replace function public.marquer_pieces_de_l_etape()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- L etape vient d etre validee : ses pieces non encore acquises le
  -- deviennent, et l on note que c est l etape qui l a fait.
  if new.status = 'completed' and old.status is distinct from 'completed' then
    update public.goal_cost_items
       set acquired_at = coalesce(acquired_at, now()),
           acquired_via_step = true,
           updated_at = now()
     where step_id = new.id
       and acquired_at is null;

  -- L etape retombe : on ne defait QUE ce que l etape avait pose.
  elsif old.status = 'completed' and new.status is distinct from 'completed' then
    update public.goal_cost_items
       set acquired_at = null,
           acquired_via_step = false,
           updated_at = now()
     where step_id = new.id
       and acquired_via_step;
  end if;

  return new;
end;
$$;

drop trigger if exists etape_validee_paie_sa_piece on public.steps;
create trigger etape_validee_paie_sa_piece
  after update of status on public.steps
  for each row
  execute function public.marquer_pieces_de_l_etape();

-- LA REPRISE DE L EXISTANT.
--
-- Un declencheur ne regarde que l avenir. Les quarante-trois pieces
-- dont l etape est deja validee resteraient invisibles au financement
-- pour toujours : on les rattrape ici, marquees comme venant de
-- l etape, ce qui les rend defaisables si l etape retombe un jour.
update public.goal_cost_items c
   set acquired_at = now(),
       acquired_via_step = true,
       updated_at = now()
  from public.steps s
 where s.id = c.step_id
   and s.status = 'completed'
   and c.acquired_at is null;
