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

-- LA PREMIERE VERSION REPETAIT LES NOMS : akira aux places 1, 6 et 11,
-- Noor aux places 2, 7 et 12. Le pas de 3 sur une liste de 15 boucle
-- tous les cinq tours — et rien ne trahit une liste fabriquee aussi
-- surement que le meme nom trois fois.
--
-- Un pas PREMIER AVEC la longueur de la liste parcourt les quinze noms
-- avant d en reprendre un. Sept et onze conviennent ; trois et cinq,
-- non. La liste passe a dix-sept noms, elle aussi premiere, pour que
-- n importe quel pas impair fasse l affaire.

create or replace function public.cordee(p_user_id uuid)
returns table (
  place integer,
  nom text,
  devise text,
  xp integer,
  objectifs integer,
  etapes integer,
  serie integer,
  rang text,
  couleur text,
  vu_il_y_a_h integer
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_pacte uuid;
  v_xp_max integer;
  v_objectifs integer;
  v_etapes integer;
  v_graine bigint;

  noms text[] := array[
    'Lena Mraz', 'kaede', 'Théo B.', 'marc_oliveira', 'Aurore',
    'nils.hv', 'Sam Wren', 'yohan_dt', 'Iris Kovac', 'petit.ours',
    'D. Fontaine', 'akira', 'Camille R.', 'jonas_w', 'Noor',
    'elsa.k', 'Rafael M.'
  ];
  devises text[] := array[
    'Un pas, puis un autre.', 'Je finis ce que je commence.',
    'Rien de spectaculaire, juste tous les jours.', 'On verra bien.',
    'La constance avant la vitesse.', 'Pas de plan B.',
    'Je note tout.', 'Lentement, mais jamais en arrière.',
    'Le matin appartient à ceux qui se lèvent.', 'Encore un peu.',
    'Je ne rate pas deux fois de suite.', 'Faire, pas dire.',
    'Chaque semaine compte.', 'Discret et régulier.', 'Toujours en cours.',
    'Ça finira par payer.', 'Je préfère commencer petit.'
  ];

  parts numeric[] := array[
    0.90, 0.81, 0.74, 0.66, 0.58, 0.50, 0.43,
    0.36, 0.29, 0.23, 0.17, 0.12, 0.07
  ];

  n_noms integer;
  i integer;
  v_part numeric;
  v_bruit numeric;
  v_xp integer;
begin
  n_noms := array_length(noms, 1);

  select coalesce(
    (select pr.active_pact_id from profiles pr where pr.id = p_user_id),
    (select pa.id from pacts pa where pa.user_id = p_user_id order by pa.created_at desc limit 1)
  ) into v_pacte;

  if v_pacte is null then return; end if;

  select count(*)::int, coalesce(sum(coalesce(g.potential_score, 0)), 0)::int
    into v_objectifs, v_xp_max
    from goals g where g.pact_id = v_pacte;

  select coalesce(sum(greatest(
           (select count(*) from steps s
             where s.goal_id = g.id and not coalesce(s.is_ultimate, false)),
           coalesce(g.total_steps, 0)
         )), 0)::int
    into v_etapes
    from goals g where g.pact_id = v_pacte;

  if v_xp_max <= 0 or v_objectifs <= 0 then return; end if;

  v_graine := ('x' || substr(md5(p_user_id::text), 1, 8))::bit(32)::bigint;

  for i in 1 .. array_length(parts, 1) loop
    v_part := parts[i];
    v_bruit := 1 + (((v_graine + i * 2654435761) % 61) - 30)::numeric / 1000;
    v_xp := greatest(1, round(v_xp_max * v_part * v_bruit))::int;

    place := i;
    /* Pas de 7 sur dix-sept noms : les dix-sept defilent avant qu un
       seul revienne. La devise avance de onze, pour que le meme nom ne
       traine pas toujours la meme phrase. */
    nom := noms[1 + ((v_graine + i * 7) % n_noms)::int];
    devise := devises[1 + ((v_graine + i * 11) % array_length(devises, 1))::int];
    xp := v_xp;
    objectifs := greatest(0, round(v_objectifs * v_part * v_bruit))::int;
    etapes := greatest(0, round(v_etapes * v_part * v_bruit))::int;
    serie := greatest(1, round(v_part * 180 * v_bruit))::int;
    vu_il_y_a_h := 1 + ((v_graine / 13 + i * 17) % 52)::int;

    select r.name, r.frame_color into rang, couleur
      from ranks r
     where r.user_id = p_user_id and r.min_points <= v_xp
     order by r.min_points desc limit 1;

    return next;
  end loop;
end;
$$;
