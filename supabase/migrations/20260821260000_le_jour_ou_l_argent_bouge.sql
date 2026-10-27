-- LE JOUR OU L ARGENT BOUGE
--
-- Une ligne recurrente tombait DANS son mois, point. Aucun moyen de
-- dire qu un loyer d aout arrive le 3 septembre — ce qui est le cas de
-- deux des trois revenus de ce pacte.
--
-- La consequence n etait pas cosmetique : au pointage du mois, ces
-- deux lignes restaient decochees alors qu elles n etaient pas en
-- retard — elles n avaient simplement pas encore eu lieu. Le parcours
-- ne savait pas distinguer « pas encore » de « manquant », et c est
-- precisement la difference qui compte quand on valide un mois. Pire :
-- il poussait a cocher pour faire taire le compteur, ce qui est
-- exactement ce qu un pointage ne doit pas encourager.
--
-- DEUX CHAMPS, ET ILS NE DISENT PAS LA MEME CHOSE.
--
--   jour_echeance   le jour du mois ou l argent bouge. Nul quand on ne
--                   le sait pas ou qu il n importe pas — c est le cas
--                   de loin le plus courant, et l exiger serait
--                   demander une precision que personne n a.
--
--   decalage_mois   de combien de mois le mouvement suit le mois qu il
--                   concerne. Zero pour tout ce qui tombe dans son
--                   mois ; un pour le loyer d aout paye en septembre.
--                   Deux existe pour les rares echeances a soixante
--                   jours, au-dela il s agit d autre chose.

do $$
declare t text;
begin
  foreach t in array array['recurring_expenses', 'recurring_income'] loop
    execute format('alter table public.%I add column if not exists jour_echeance smallint', t);
    execute format('alter table public.%I add column if not exists decalage_mois smallint not null default 0', t);

    execute format('alter table public.%I drop constraint if exists %I', t, t || '_jour_admis');
    execute format($f$alter table public.%I add constraint %I
      check (jour_echeance is null or (jour_echeance >= 1 and jour_echeance <= 31))$f$, t, t || '_jour_admis');

    execute format('alter table public.%I drop constraint if exists %I', t, t || '_decalage_admis');
    execute format($f$alter table public.%I add constraint %I
      check (decalage_mois >= 0 and decalage_mois <= 2)$f$, t, t || '_decalage_admis');
  end loop;
end $$;

comment on column public.recurring_income.jour_echeance is
  'Jour du mois ou l argent bouge. Nul si inconnu ou sans importance.';
comment on column public.recurring_income.decalage_mois is
  'De combien de mois le mouvement suit le mois concerne. 1 = le loyer d aout arrive en septembre.';
