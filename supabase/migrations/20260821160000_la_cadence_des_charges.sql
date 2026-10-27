-- LA CADENCE D UNE CHARGE.
--
-- Tout etait implicitement mensuel : une ligne avait un nom, un
-- montant, et pesait sur chaque mois. Une assurance annuelle de six
-- cents euros gonflait donc le tableau de six cents euros douze fois
-- par an, ou bien il fallait la saisir lissee a cinquante — et perdre
-- a la fois le vrai montant et le mois ou il part.
--
-- Trois colonnes suffisent a dire toutes les cadences demandees, parce
-- qu un paiement en plusieurs fois et un abonnement trimestriel sont
-- la meme mecanique : une charge qui ne tombe pas tous les mois.
--
--   periode_mois : le nombre de mois entre deux echeances. 1 pour un
--     abonnement mensuel, 3 pour un trimestriel, 6, 12. C est aussi 1
--     pour un paiement en plusieurs fois, qui tombe chaque mois.
--
--   mois_ancre : le mois de la premiere echeance, cale au premier du
--     mois. C est lui qui dit QUELS mois sont concernes — sans quoi
--     « tous les trois mois » ne designe rien. Nul pour les lignes
--     mensuelles, qui tombent de toute facon.
--
--   echeances : le nombre d echeances, ou nul pour une charge sans
--     fin. C est la seule difference entre un abonnement et un
--     echeancier : l un ne s arrete pas, l autre compte jusqu a
--     quatre.
--
--   montant_total : pour un echeancier seulement, ce qui a ete achete.
--     On le garde parce que diviser deux cents par trois ne tombe pas
--     juste : les echeances valent 66,66 et la derniere 66,68. Sans le
--     total, la somme des prelevements ne ferait pas le prix paye.
--
-- Le lissage n est pas stocke. La provision — ce qu il faudrait mettre
-- de cote chaque mois pour absorber les echeances a venir — se deduit
-- du montant et de la periode. La stocker ferait une seconde verite a
-- tenir d accord avec la premiere.

do $$
declare
  t text;
begin
  foreach t in array array['recurring_expenses', 'recurring_income'] loop
    execute format($f$
      alter table public.%I
        add column if not exists periode_mois smallint not null default 1,
        add column if not exists mois_ancre date,
        add column if not exists echeances smallint,
        add column if not exists montant_total numeric;
    $f$, t);

    -- Les cadences admises, dites par la base : mensuel, trimestriel,
    -- semestriel, annuel. Rien d autre n a de sens ici.
    execute format($f$
      alter table public.%I
        drop constraint if exists %I;
    $f$, t, t || '_periode_admise');
    execute format($f$
      alter table public.%I
        add constraint %I check (periode_mois in (1, 3, 6, 12));
    $f$, t, t || '_periode_admise');

    -- Un echeancier compte au moins deux fois : « en une fois » n est
    -- pas un echeancier, c est une charge ordinaire.
    execute format($f$
      alter table public.%I
        drop constraint if exists %I;
    $f$, t, t || '_echeances_admises');
    execute format($f$
      alter table public.%I
        add constraint %I check (echeances is null or echeances between 2 and 60);
    $f$, t, t || '_echeances_admises');

    -- Une cadence non mensuelle a besoin de son ancre, sinon « tous les
    -- trois mois » ne designe aucun mois en particulier. Un echeancier
    -- aussi : il faut savoir quand il commence pour savoir quand il
    -- finit.
    execute format($f$
      alter table public.%I
        drop constraint if exists %I;
    $f$, t, t || '_ancre_requise');
    execute format($f$
      alter table public.%I
        add constraint %I check (
          (periode_mois = 1 and echeances is null) or mois_ancre is not null
        );
    $f$, t, t || '_ancre_requise');
  end loop;
end $$;

comment on column public.recurring_expenses.periode_mois is
  'Mois entre deux echeances : 1 mensuel, 3 trimestriel, 6 semestriel, 12 annuel.';
comment on column public.recurring_expenses.mois_ancre is
  'Mois de la premiere echeance, cale au premier du mois. Requis des que la charge n est pas mensuelle sans fin.';
comment on column public.recurring_expenses.echeances is
  'Nombre d echeances d un paiement en plusieurs fois ; nul pour une charge sans fin.';
comment on column public.recurring_expenses.montant_total is
  'Prix paye d un echeancier. Garde parce que la division ne tombe pas juste et que la derniere echeance absorbe le reste.';
