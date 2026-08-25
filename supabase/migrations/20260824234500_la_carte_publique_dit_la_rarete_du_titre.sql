-- La carte renvoyait déjà `rarete` pour la bannière, jamais pour le
-- titre : la petite carte partagée — celle du survol d'un ami et de la
-- cabine d'essayage — ne pouvait donc pas distinguer un légendaire d'un
-- commun, faute de savoir lequel elle affichait.
--
-- Seule la ligne 'titre' change. Le corps entier est repris parce que
-- CREATE OR REPLACE remplace la fonction complète. Signature inchangée,
-- donc pas de DROP.
create or replace function public.carte_profil_public(p_user_id uuid)
returns jsonb
language plpgsql
stable security definer
set search_path to 'public'
as $function$
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
               'texte', ti.title_text, 'couleur', ti.text_color,
               'lueur', ti.glow_color, 'rarete', ti.rarity)
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
$function$;
