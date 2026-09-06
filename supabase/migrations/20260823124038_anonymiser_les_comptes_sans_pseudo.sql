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
-- UN COMPTE SANS PSEUDO NE DOIT PAS PORTER SON ADRESSE
-- ═══════════════════════════════════════════════════════════════
--
-- handle_new_user ecrivait ceci a chaque inscription :
--
--   COALESCE(raw_user_meta_data->>'display_name', NEW.email)
--
-- c est-a-dire : faute de pseudo choisi, L ADRESSE ELECTRONIQUE dans
-- profiles.display_name — une colonne que le classement, le fil, les
-- guildes et les listes d amis lisent et affichent a tout le monde.
--
-- Le masquage cote client ne retirait que le domaine. « geoffrey.
-- luzignant@gmail.com » s affichait « geoffrey.luzignant » : l adresse
-- se reconstitue en ajoutant le domaine le plus courant, et le nom et
-- le prenom se lisent en clair. Ce n etait pas une anonymisation,
-- c etait un habillage.
--
-- Trois choses, donc :
--   1. un pseudonyme stable et deterministe, tire de l identifiant ;
--   2. handle_new_user cesse d ecrire l adresse ;
--   3. un garde-fou EN ECRITURE, pour qu aucun chemin — present ou a
--      venir — ne puisse en remettre une.
--
-- Ce qui n est PAS touche : un nom que la personne a choisi. Si elle
-- veut afficher son prenom, elle le tape, et il est garde tel quel.

create or replace function public.pseudonyme_de(p_id uuid)
returns text
language sql
immutable
as $$
  select (array[
    'Renard', 'Héron', 'Faucon', 'Loutre', 'Corbeau', 'Chouette',
    'Lynx', 'Cerf', 'Martre', 'Blaireau', 'Hermine', 'Bouquetin',
    'Balbuzard', 'Sanglier', 'Chamois', 'Milan', 'Belette', 'Grèbe',
    'Bruant', 'Genette', 'Marmotte', 'Busard', 'Fouine', 'Alouette'
  ])[1 + (('x' || substr(md5(p_id::text), 1, 6))::bit(24)::int % 24)]
  || ' ' ||
  (array[
    'Patient', 'Discret', 'Tenace', 'Sobre', 'Constant', 'Obstiné',
    'Tranquille', 'Attentif', 'Méthodique', 'Silencieux', 'Vigilant',
    'Appliqué', 'Régulier', 'Posé', 'Résolu', 'Endurant',
    'Prudent', 'Assidu', 'Serein', 'Opiniâtre'
  ])[1 + (('x' || substr(md5(p_id::text), 7, 6))::bit(24)::int % 20)];
$$;

comment on function public.pseudonyme_de(uuid) is
  'Un pseudonyme stable tire de l identifiant, pour les comptes qui n en ont pas choisi. Ne revele rien du compte.';

-- ── Le garde-fou ────────────────────────────────────────────────
-- Il vaut mieux ici qu a l inscription seule : une mise a jour, un
-- import, un correctif ecrit trop vite peuvent tous reintroduire une
-- adresse. Une regle en ecriture les couvre tous.

create or replace function public.pas_d_adresse_en_pseudo()
returns trigger
language plpgsql
as $$
begin
  if new.display_name is null
     or btrim(new.display_name) = ''
     or new.display_name like '%@%' then
    new.display_name := public.pseudonyme_de(new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_pas_d_adresse_en_pseudo on public.profiles;
create trigger profiles_pas_d_adresse_en_pseudo
  before insert or update of display_name on public.profiles
  for each row execute function public.pas_d_adresse_en_pseudo();

-- ── L inscription ───────────────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  /* Plus d adresse en dernier recours : un pseudonyme. Le garde-fou
     sur profiles reprendrait de toute facon la main, mais autant que
     l intention soit lisible ici. */
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(
    nullif(btrim(new.raw_user_meta_data->>'display_name'), ''),
    public.pseudonyme_de(new.id)
  ));

  insert into public.user_roles (user_id, role)
  values (new.id, 'user');

  return new;
end;
$function$;

-- ── Les comptes deja crees ──────────────────────────────────────
-- L adresse sort de la colonne. Elle reste ou elle doit etre :
-- auth.users.email, que personne d autre ne lit.

update public.profiles
   set display_name = public.pseudonyme_de(id)
 where display_name is null
    or btrim(display_name) = ''
    or display_name like '%@%';
