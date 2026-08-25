-- ON N'ÉQUIPE QUE CE QU'ON POSSÈDE.
--
-- `profiles.active_frame_id`, `active_banner_id` et `active_title_id`
-- étaient trois colonnes uuid nues : aucune clé étrangère, aucune
-- contrainte, aucun déclencheur. La seule chose qui empêchait
-- d'équiper un cosmétique légendaire jamais acheté était l'interface —
-- un `disabled` sur un bouton, et un `onClick` qui vérifiait
-- l'inventaire côté navigateur.
--
-- Dans une économie adossée à une boutique, cela veut dire qu'un appel
-- direct à l'API suffisait à porter n'importe quel cosmétique. Et
-- comme rien ne référençait les tables sources, on pouvait aussi y
-- écrire un uuid qui ne désigne rien : la page retombait alors en
-- silence sur l'élément par défaut.
--
-- Le déclencheur ci-dessous refuse les deux cas. Il accepte trois
-- choses, et rien d'autre : la valeur nulle, un cosmétique marqué
-- `is_default`, ou un cosmétique présent dans `user_cosmetics` pour ce
-- profil.

create or replace function public.cosmetiques_possedes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  ok boolean;
begin
  -- Les écritures sans utilisateur (service_role, migrations, semis)
  -- passent : la politique RLS `auth.uid() = id` interdit déjà à un
  -- client d'atteindre cette ligne sans identité, donc seul le serveur
  -- peut arriver ici avec un uid nul.
  if auth.uid() is null then
    return new;
  end if;

  -- ── LE CADRE ──
  if new.active_frame_id is not null
     and (tg_op = 'INSERT' or new.active_frame_id is distinct from old.active_frame_id) then
    select exists (
      select 1 from public.cosmetic_frames f
      where f.id = new.active_frame_id
        and (
          f.is_default
          or exists (
            select 1 from public.user_cosmetics uc
            where uc.user_id = new.id
              and uc.cosmetic_type = 'frame'
              and uc.cosmetic_id = f.id
          )
        )
    ) into ok;
    if not ok then
      raise exception 'cosmetique_non_possede: cadre %', new.active_frame_id
        using errcode = 'check_violation';
    end if;
  end if;

  -- ── LE FOND DE CARTE ──
  -- La table s'appelle encore `cosmetic_banners` : l'écran parle de
  -- fond de carte depuis que les bannières ont été abandonnées, mais
  -- les colonnes n'ont pas été renommées.
  if new.active_banner_id is not null
     and (tg_op = 'INSERT' or new.active_banner_id is distinct from old.active_banner_id) then
    select exists (
      select 1 from public.cosmetic_banners b
      where b.id = new.active_banner_id
        and (
          b.is_default
          or exists (
            select 1 from public.user_cosmetics uc
            where uc.user_id = new.id
              and uc.cosmetic_type = 'banner'
              and uc.cosmetic_id = b.id
          )
        )
    ) into ok;
    if not ok then
      raise exception 'cosmetique_non_possede: fond %', new.active_banner_id
        using errcode = 'check_violation';
    end if;
  end if;

  -- ── LE TITRE ──
  if new.active_title_id is not null
     and (tg_op = 'INSERT' or new.active_title_id is distinct from old.active_title_id) then
    select exists (
      select 1 from public.cosmetic_titles ti
      where ti.id = new.active_title_id
        and (
          ti.is_default
          or exists (
            select 1 from public.user_cosmetics uc
            where uc.user_id = new.id
              and uc.cosmetic_type = 'title'
              and uc.cosmetic_id = ti.id
          )
        )
    ) into ok;
    if not ok then
      raise exception 'cosmetique_non_possede: titre %', new.active_title_id
        using errcode = 'check_violation';
    end if;
  end if;

  return new;
end;
$$;

comment on function public.cosmetiques_possedes() is
  'Refuse d''équiper un cosmétique absent de user_cosmetics et non marqué is_default.';

drop trigger if exists profiles_cosmetiques_possedes on public.profiles;

create trigger profiles_cosmetiques_possedes
  before insert or update of active_frame_id, active_banner_id, active_title_id
  on public.profiles
  for each row
  execute function public.cosmetiques_possedes();
