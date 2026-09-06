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
-- LA COULEUR D UNE GUILDE N EN ETAIT PAS UNE
-- ═══════════════════════════════════════════════════════════════
--
-- guilds.color contenait un NOM tire d une liste de cinq : violet,
-- emerald, amber, rose, cyan. La page l injectait tel quel dans du
-- CSS — style={{ color: guilde.color }}.
--
-- Or « emerald », « amber » et « rose » ne sont pas des couleurs CSS.
-- Le navigateur rejetait la declaration, React n ecrivait meme pas
-- l attribut, et le blason heritait de la couleur du texte. Trois
-- choix sur cinq ne faisaient donc STRICTEMENT RIEN, et les deux
-- autres — violet, cyan — ne marchaient que par coincidence de
-- vocabulaire.
--
-- La colonne porte desormais une couleur, pas un nom : un hexadecimal
-- que l on peut choisir librement. Les cinq anciens noms sont traduits
-- vers les teintes du produit.

update public.guilds set color = case lower(coalesce(color, ''))
  when 'violet'  then '#8B72FF'
  when 'emerald' then '#35C98A'
  when 'amber'   then '#E0A340'
  when 'rose'    then '#F0567E'
  when 'cyan'    then '#4CC9F0'
  else '#8B72FF'
end
where color is null or color !~ '^#[0-9A-Fa-f]{6}$';

alter table public.guilds
  add constraint guilds_couleur_hexadecimale
  check (color is null or color ~ '^#[0-9A-Fa-f]{6}$');

-- L embleme depose. banner_url existait deja — et n a jamais ete ni
-- ecrit ni lu par quoi que ce soit.
alter table public.guilds add column if not exists emblem_url text;

comment on column public.guilds.color is
  'Couleur de la guilde, en hexadecimal. Contenait auparavant un nom de palette que le CSS rejetait.';
comment on column public.guilds.emblem_url is
  'Embleme depose. Quand il est nul, l icone choisie dans « icon » fait office de blason.';

-- ═══════════════════════════════════════════════════════════════
-- LE DEPOT DES IMAGES DE GUILDE
-- ═══════════════════════════════════════════════════════════════
--
-- Public, comme community-media et pour la meme raison : une guilde
-- publique se laisse decouvrir par des gens qui n en sont pas membres.
-- Une URL signee est delivree au porteur d une session et ne
-- traverserait pas cette frontiere.
--
-- L ECRITURE reste celle des officiers de la guilde concernee : le
-- premier dossier du chemin porte l identifiant de la guilde, et la
-- regle verifie l appartenance.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('guild-media', 'guild-media', true, 5242880,
        array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do update
  set public = true,
      file_size_limit = 5242880,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

drop policy if exists "Les images de guilde se lisent librement" on storage.objects;
create policy "Les images de guilde se lisent librement"
  on storage.objects for select to public
  using (bucket_id = 'guild-media');

drop policy if exists "Les officiers deposent les images de leur guilde" on storage.objects;
create policy "Les officiers deposent les images de leur guilde"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'guild-media'
    and exists (
      select 1 from public.guild_members m
       where m.user_id = auth.uid()
         and m.role in ('owner', 'officer')
         and m.guild_id::text = (storage.foldername(name))[1]
    )
  );

drop policy if exists "Les officiers retirent les images de leur guilde" on storage.objects;
create policy "Les officiers retirent les images de leur guilde"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'guild-media'
    and exists (
      select 1 from public.guild_members m
       where m.user_id = auth.uid()
         and m.role in ('owner', 'officer')
         and m.guild_id::text = (storage.foldername(name))[1]
    )
  );
