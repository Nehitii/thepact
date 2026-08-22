-- LES SEANCES DE SOUFFLE
--
-- L exercice de respiration existait depuis le debut et n a JAMAIS rien
-- ecrit. Ni table, ni colonne, ni hook : le compteur de cycles vivait
-- dans un useState et mourait au demontage du composant. On pouvait
-- respirer vingt minutes par jour pendant six mois, l application n en
-- savait rien le lendemain matin.
--
-- Tout ce qu on veut poser dessus — une serie, un total, une cible que
-- l on atteint — suppose d abord que la seance laisse une trace. C est
-- l objet de cette table, et elle vient avant le reste.
--
-- CALQUEE SUR focus_sessions, qui fait deja exactement ce travail pour
-- les seances de concentration : un debut, une fin, une duree. On garde
-- le meme squelette pour que les deux se lisent pareil.
--
-- CE QU ELLE NE FAIT PAS. Pas de score, pas de palier, pas de monnaie.
-- Respirer est le seul geste de l application dont le but est de faire
-- BAISSER la pression : y accrocher une recompense reviendrait a en
-- remettre. La table enregistre ce qui s est passe, rien de plus.

create table if not exists public.seances_de_souffle (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  -- Le rythme suivi. Texte libre plutot qu enum : les rythmes sont
  -- definis cote client et la liste bougera avant la table.
  rythme text not null,

  -- La cible choisie avant de commencer, et ce qui a ete tenu. Les deux
  -- comptent : abandonner a 4 sur 6 reste une seance de 4 cycles, et
  -- l ecart dit quelque chose que le total seul effacerait.
  cycles_vises integer not null default 0 check (cycles_vises >= 0),
  cycles_tenus integer not null default 0 check (cycles_tenus >= 0),

  -- Le temps reellement passe. C est lui qui alimente le total, pas les
  -- cycles : un cycle de 4-7-8 dure dix-neuf secondes quand un cycle de
  -- coherence en dure dix.
  duree_secondes integer not null default 0 check (duree_secondes >= 0),

  -- La cible a-t-elle ete atteinte. Derivable de cycles_tenus >=
  -- cycles_vises, mais stockee : une seance sans cible (cycles_vises a
  -- zero) n est pas « achevee », et la formule seule dirait le contraire.
  achevee boolean not null default false,

  commencee_a timestamptz not null default now(),
  terminee_a timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- L HISTORIQUE SE LIT A L ENVERS.
--
-- Tous les usages partent du plus recent : la serie remonte les jours
-- un a un jusqu au premier trou, le total balaie une fenetre recente,
-- la derniere seance est la premiere ligne. L index descendant sert
-- les trois.
create index if not exists seances_de_souffle_recentes
  on public.seances_de_souffle (user_id, terminee_a desc);

-- PAS DE CONTRAINTE D UNICITE PAR JOUR, ET C EST VOULU. On peut
-- respirer trois fois dans la journee ; chaque seance est un fait
-- distinct. La serie se calcule en regroupant par date cote client,
-- dans le fuseau de l utilisateur — un regroupement fait ici, en UTC,
-- decalerait les seances de fin de soiree au lendemain.

alter table public.seances_de_souffle enable row level security;

drop policy if exists "souffle : chacun les siennes" on public.seances_de_souffle;
create policy "souffle : chacun les siennes"
  on public.seances_de_souffle
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

comment on table public.seances_de_souffle is
  'Une ligne par seance de respiration terminee. Alimente la serie, le '
  'total respire et la derniere seance. Volontairement sans score ni '
  'recompense : voir l en-tete de la migration.';
