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
-- LA CARTE DE PROFIL PUBLIC DE QUELQU UN D AUTRE
-- ═══════════════════════════════════════════════════════════════
--
-- La carte existe depuis longtemps — banniere, avatar encadre, titre,
-- rang — mais UNIQUEMENT pour soi, dans les reglages du profil public,
-- assemblee sur place a partir de six requetes et de l etat du
-- formulaire. Personne ne pouvait voir celle d un autre.
--
-- Un survol doit repondre vite. Six allers-retours pour une carte qui
-- apparait au passage de la souris, c est le probleme deja resolu
-- ailleurs dans Community (neuf requetes pour une reaction, ramenees a
-- une). Tout arrive donc en un seul appel.
--
-- QUI PEUT LA VOIR. Un profil decouvrable se montre a tous. Un profil
-- qui ne l est pas se montre quand meme a ses compagnons de guilde :
-- ils partagent deja un espace, une liste de membres et un fil. Sinon,
-- rien — et « rien » se dit, plutot que de rendre une carte vide qui
-- laisserait croire a une panne.

create or replace function public.carte_profil_public(p_user_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_profil record;
  v_visible boolean;
  v_xp integer;
  v_pacte uuid;
begin
  select p.id, p.display_name, p.avatar_url, p.accent_color, p.personal_quote,
         p.active_frame_id, p.active_banner_id, p.active_title_id,
         p.community_profile_discoverable, p.active_pact_id
    into v_profil
    from profiles p
   where p.id = p_user_id;

  if not found then
    return jsonb_build_object('trouve', false);
  end if;

  v_visible := coalesce(v_profil.community_profile_discoverable, false)
    or p_user_id = auth.uid()
    or exists (
      select 1
        from guild_members a
        join guild_members b on b.guild_id = a.guild_id
       where a.user_id = auth.uid() and b.user_id = p_user_id
    );

  if not v_visible then
    return jsonb_build_object('trouve', true, 'visible', false);
  end if;

  v_xp := public.xp_du_membre(p_user_id);
  v_pacte := coalesce(
    v_profil.active_pact_id,
    (select pa.id from pacts pa where pa.user_id = p_user_id order by pa.created_at desc limit 1)
  );

  return jsonb_build_object(
    'trouve', true,
    'visible', true,
    'nom', v_profil.display_name,
    'avatar', v_profil.avatar_url,
    'accent', v_profil.accent_color,
    'phrase', v_profil.personal_quote,
    'xp', v_xp,
    'pacte', (select pa.name from pacts pa where pa.id = v_pacte),
    'objectifs', (select count(*)::int from goals g
                   where g.pact_id = v_pacte
                     and g.status in ('fully_completed', 'validated')),
    'cadre', (
      select jsonb_build_object(
               'image', f.preview_url, 'bordure', coalesce(f.avatar_border_color, f.border_color),
               'lueur', f.glow_color, 'montrerBordure', f.show_border,
               'echelle', f.frame_scale, 'decalageX', f.frame_offset_x, 'decalageY', f.frame_offset_y)
        from cosmetic_frames f where f.id = v_profil.active_frame_id
    ),
    'banniere', (
      select jsonb_build_object(
               'image', b.banner_url, 'debut', b.gradient_start,
               'fin', b.gradient_end, 'rarete', b.rarity)
        from cosmetic_banners b where b.id = v_profil.active_banner_id
    ),
    'titre', (
      select jsonb_build_object(
               'texte', ti.title_text, 'couleur', ti.text_color, 'lueur', ti.glow_color)
        from cosmetic_titles ti where ti.id = v_profil.active_title_id
    ),
    /* Le rang et le palier suivant : la carte montre une progression,
       pas seulement un nom. */
    'rang', (
      select jsonb_build_object(
               'nom', r.name, 'seuil', r.min_points,
               'couleur', r.frame_color, 'lueur', r.glow_color, 'logo', r.logo_url)
        from ranks r
       where r.user_id = p_user_id and r.min_points <= v_xp
       order by r.min_points desc limit 1
    ),
    'rangSuivant', (
      select jsonb_build_object('nom', r.name, 'seuil', r.min_points)
        from ranks r
       where r.user_id = p_user_id and r.min_points > v_xp
       order by r.min_points asc limit 1
    )
  );
end;
$$;

comment on function public.carte_profil_public(uuid) is
  'La carte de profil public d une personne, en un seul appel : identite, cosmetiques portes, rang et progression.';
