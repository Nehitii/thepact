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

-- ═══════════════════════════════════════════════════════════════
-- LA CORDEE : un classement simule, calibre sur votre propre pacte
-- ═══════════════════════════════════════════════════════════════
--
-- Un classement a un seul inscrit ne classe rien. Tant que personne
-- d autre n est la, la cordee donne des grimpeurs sur la meme voie —
-- et cette voie est LA VOTRE : leurs points sont une fraction du pacte
-- que vous avez ecrit, leurs rangs sont les dix que vous avez nommes.
--
-- LE PREMIER EST A 90 % DU PACTE COMPLET. Pas au maximum : a portee.
-- Un sommet inatteignable ne motive personne, un sommet deja franchi
-- non plus. Les suivants descendent sur une courbe creuse — dense au
-- milieu, clairsemee en haut — parce que c est la forme qu a un vrai
-- classement, et qu il doit toujours y avoir QUELQU UN JUSTE DEVANT.
--
-- ILS NE BOUGENT PAS. C est un choix : des rivaux qui progressent en
-- meme temps que vous ne se rattrapent jamais. Ici la distance ne se
-- reduit que d une facon — en avancant.
--
-- RIEN N EST ENREGISTRE. Aucune ligne, aucun compte : la cordee est
-- calculee a la lecture, a partir de votre pacte. Elle se recalibre
-- donc toute seule quand il s agrandit, et elle ne peut pas se
-- desynchroniser de ce qu elle mesure.

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

  /* Des noms qui ressemblent a ceux d un vrai produit : des prenoms,
     des pseudonymes, des initiales, dans plusieurs langues. Une liste
     de « Joueur 1, Joueur 2 » se reconnait au premier coup d oeil. */
  noms text[] := array[
    'Lena Mraz', 'kaede', 'Théo B.', 'marc_oliveira', 'Aurore',
    'nils.hv', 'Sam Wren', 'yohan_dt', 'Iris Kovac', 'petit.ours',
    'D. Fontaine', 'akira', 'Camille R.', 'jonas_w', 'Noor'
  ];
  devises text[] := array[
    'Un pas, puis un autre.', 'Je finis ce que je commence.',
    'Rien de spectaculaire, juste tous les jours.', 'On verra bien.',
    'La constance avant la vitesse.', 'Pas de plan B.',
    'Je note tout.', 'Lentement, mais jamais en arrière.',
    'Le matin appartient à ceux qui se lèvent.', 'Encore un peu.',
    'Je ne rate pas deux fois de suite.', 'Faire, pas dire.',
    'Chaque semaine compte.', 'Discret et régulier.', 'Toujours en cours.'
  ];

  /* La courbe. Le premier a 90 % ; les suivants se resserrent vers le
     milieu, la ou se joue la comparaison. */
  parts numeric[] := array[
    0.90, 0.81, 0.74, 0.66, 0.58, 0.50, 0.43,
    0.36, 0.29, 0.23, 0.17, 0.12, 0.07
  ];

  i integer;
  v_part numeric;
  v_bruit numeric;
  v_xp integer;
begin
  select coalesce(
    (select pr.active_pact_id from profiles pr where pr.id = p_user_id),
    (select pa.id from pacts pa where pa.user_id = p_user_id order by pa.created_at desc limit 1)
  ) into v_pacte;

  if v_pacte is null then
    return;
  end if;

  select count(*)::int, coalesce(sum(coalesce(g.potential_score, 0)), 0)::int
    into v_objectifs, v_xp_max
    from goals g where g.pact_id = v_pacte;

  /* Le total d etapes suit la meme chaine de repli que l XP : les
     objectifs sans ligne dans « steps » portent encore leur compteur
     sur la ligne « goals ». Compter autrement donnerait une cordee
     calibree sur un pacte plus petit que celui qu on voit. */
  select coalesce(sum(greatest(
           (select count(*) from steps s
             where s.goal_id = g.id and not coalesce(s.is_ultimate, false)),
           coalesce(g.total_steps, 0)
         )), 0)::int
    into v_etapes
    from goals g where g.pact_id = v_pacte;

  if v_xp_max <= 0 or v_objectifs <= 0 then
    return;
  end if;

  /* Une graine stable, tiree de l identifiant : deux personnes n ont
     pas la meme cordee, et la votre ne change pas d une visite a
     l autre. */
  v_graine := ('x' || substr(md5(p_user_id::text), 1, 8))::bit(32)::bigint;

  for i in 1 .. array_length(parts, 1) loop
    v_part := parts[i];
    /* Un leger ecart, deterministe, pour que les chiffres ne tombent
       pas tous sur des multiples ronds — c est ce qui trahit une liste
       fabriquee. */
    v_bruit := 1 + (((v_graine + i * 2654435761) % 61) - 30)::numeric / 1000;
    v_xp := greatest(1, round(v_xp_max * v_part * v_bruit))::int;

    place := i;
    nom := noms[1 + ((v_graine / 7 + i * 3) % array_length(noms, 1))::int];
    devise := devises[1 + ((v_graine / 11 + i * 5) % array_length(devises, 1))::int];
    xp := v_xp;
    objectifs := greatest(0, round(v_objectifs * v_part * v_bruit))::int;
    etapes := greatest(0, round(v_etapes * v_part * v_bruit))::int;
    /* Une serie plausible : longue en haut du classement, courte en
       bas, jamais ronde. */
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

comment on function public.cordee(uuid) is
  'Un classement simule calibre sur le pacte de la personne : le premier est a 90 % de son pacte complet, et les rangs sont les siens. Rien n est enregistre — tout est calcule a la lecture.';
