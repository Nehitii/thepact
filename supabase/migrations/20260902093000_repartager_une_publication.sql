/* REPARTAGER UNE PUBLICATION.
 *
 * Une publication peut en citer une autre. La citee garde tout : ses
 * reactions, ses reponses, son auteur. Le repartage est une
 * publication a part entiere, avec son propre texte s il en a un, et
 * qui MONTRE l originale sans la commenter.
 *
 * ═══ CE QUI SE PASSE QUAND L ORIGINALE EST SUPPRIMEE ═══
 *
 * C est la question qui produit le bug si on la laisse ouverte. Trois
 * reponses etaient possibles, deux sont fausses :
 *
 * « CASCADE » — le repartage disparait avec l originale. Refuse : on
 * effacerait le texte de quelqu un d autre parce qu un tiers a efface
 * le sien. Celui qui a repartage a ecrit quelque chose ; ce quelque
 * chose lui appartient.
 *
 * « RESTRICT » — on ne peut plus supprimer sa publication tant qu elle
 * est citee. Refuse aussi, et pour deux raisons : personne ne doit
 * perdre la main sur ce qu il a publie a cause d un tiers, et le refus
 * revelerait l existence d un repartage qu on ne voit peut-etre pas.
 *
 * « SET NULL » — la reference tombe, le repartage reste. C est le bon
 * comportement, mais IL NE SUFFIT PAS : une reference nulle ne se
 * distingue plus d une publication qui n a jamais rien cite. La carte
 * se lirait comme un message ordinaire, ampute de sa raison d etre.
 *
 * On pose donc une MARQUE avant que la reference tombe. Apres
 * suppression de l originale, le repartage porte « shared_post_id »
 * nul ET « shared_post_gone » vrai : les trois etats se distinguent
 * sans ambiguite.
 *
 *   reference nulle,  marque fausse -> publication ordinaire
 *   reference posee,  marque fausse -> repartage, l originale existe
 *   reference nulle,  marque vraie  -> repartage, l originale est partie
 *
 * ═══ CE QU ON NE PEUT PAS REPARTAGER ═══
 *
 * Trois refus, tenus par un declencheur parce qu aucun d eux ne se
 * verifie sans regarder une AUTRE ligne — ce qu une contrainte CHECK
 * ne sait pas faire.
 *
 *   un repartage       la citation ne s empile pas : on cite la
 *                      source, jamais celui qui l a citee avant soi
 *   une publication    ce qui n est pas public ne le devient pas
 *   non publique       parce qu un tiers l a repartage
 *   sa propre          se citer soi-meme n est pas partager, c est
 *   publication        republier — le fil le montre deja
 */

-- ── La citation, et la marque qui lui survit ─────────────────────
alter table public.community_posts
  add column shared_post_id uuid references public.community_posts(id) on delete set null,
  add column shared_post_gone boolean not null default false;

create index idx_community_posts_shared_post_id
  on public.community_posts (shared_post_id);

/* La marque n a de sens que sur un repartage : une publication
   ordinaire ne peut pas porter une originale disparue. */
alter table public.community_posts
  add constraint chk_marque_orpheline_coherente check (
    shared_post_gone = false or shared_post_id is null
  );

-- ── On ne se cite pas soi-meme, deux fois, ni en prive ───────────
create or replace function public.verifier_le_repartage()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $$
declare cite record;
begin
  if NEW.shared_post_id is null then return NEW; end if;

  if NEW.shared_post_id = NEW.id then
    raise exception 'Une publication ne peut pas se citer elle-meme.';
  end if;

  select user_id, is_public, shared_post_id
    into cite
    from community_posts
   where id = NEW.shared_post_id;

  if not found then
    raise exception 'La publication citee n existe pas.';
  end if;
  if cite.shared_post_id is not null then
    raise exception 'On ne repartage pas un repartage : citez la publication d origine.';
  end if;
  if not cite.is_public then
    raise exception 'Une publication qui n est pas publique ne se repartage pas.';
  end if;
  if cite.user_id = NEW.user_id then
    raise exception 'On ne repartage pas sa propre publication.';
  end if;

  return NEW;
end $$;

create trigger trg_verifier_le_repartage
  before insert or update of shared_post_id on public.community_posts
  for each row execute function public.verifier_le_repartage();

-- ── La marque, posee AVANT que la reference tombe ────────────────
create or replace function public.marquer_les_repartages_orphelins()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $$
begin
  /* « before delete » : a cet instant la cle etrangere n a pas encore
     mis les references a nul, et l on peut donc encore les trouver.
     Apres, elles seraient introuvables — c est tout l interet.

     ON POSE LA MARQUE ET ON COUPE LA REFERENCE DANS LE MEME GESTE.
     Poser la seule marque violerait « chk_marque_orpheline_coherente »
     — a cet instant la reference est encore la, et les deux ne
     peuvent pas coexister. Couper ici rend d ailleurs le « set null »
     de la cle etrangere sans objet : il ne trouvera plus rien. */
  update community_posts
     set shared_post_gone = true, shared_post_id = null
   where shared_post_id = OLD.id;
  return OLD;
end $$;

create trigger trg_marquer_les_repartages_orphelins
  before delete on public.community_posts
  for each row execute function public.marquer_les_repartages_orphelins();

/* LES REACTIONS ET LES REPONSES RESTENT SUR L ORIGINALE, et rien
   n avait a changer pour cela : elles portent un « post_id » precis.
   Un repartage a les siennes, l originale garde les siennes, et les
   deux comptes ne se melangent pas. C est l ecran qui doit s y tenir —
   la carte citee n est pas interactive. */
