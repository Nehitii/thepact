/* AIMER UN COMMENTAIRE.
 *
 * On pouvait reagir a une publication et a une video, pas a une
 * reponse. Les reactions ont donc une troisieme cible.
 *
 * UN SEUL GESTE SUR UNE REPONSE, PAS TROIS. Les trois reactions
 * — soutien, respect, inspire — repondent a une publication, qui
 * raconte quelque chose. Un commentaire n appelle qu un acquiescement.
 * La contrainte le tient EN BASE plutot qu a l ecran : une regle que
 * seule l interface applique tombe des qu on ecrit ailleurs.
 *
 * On reutilise « support » plutot que d inventer un type « like » que
 * les publications n emploieraient jamais : un concept, un mot.
 */

-- ── La troisieme cible ───────────────────────────────────────────
alter table public.community_reactions
  add column reply_id uuid references public.community_replies(id) on delete cascade;

/* La cle etrangere prend son index, comme toutes les autres depuis
   « les_cles_etrangeres_prennent_leur_index ». */
create index idx_community_reactions_reply_id
  on public.community_reactions (reply_id);

-- ── Exactement une cible, jamais deux, jamais aucune ─────────────
/* « chk_post_or_reel » n en connaissait que deux et aurait refuse
   toute reaction a une reponse. On la remplace par une somme, qui
   restera juste si une quatrieme cible arrive un jour. */
alter table public.community_reactions
  drop constraint chk_post_or_reel;

alter table public.community_reactions
  add constraint chk_une_seule_cible check (
    (post_id is not null)::int
    + (reel_id is not null)::int
    + (reply_id is not null)::int = 1
  );

-- ── Sur une reponse : le like, et rien d autre ───────────────────
alter table public.community_reactions
  add constraint chk_reponse_aimee_seulement check (
    reply_id is null or reaction_type = 'support'
  );

-- ── Un like par personne et par reponse ──────────────────────────
/* Meme forme que les deux uniques existants. Postgres ne compare pas
   deux NULL : cette contrainte ne dit donc rien des reactions qui
   visent une publication ou une video, exactement comme les leurs ne
   disent rien des reponses. */
alter table public.community_reactions
  add constraint community_reactions_user_id_reply_id_reaction_type_key
    unique (user_id, reply_id, reaction_type);

-- ── Le compte, tenu par la base ──────────────────────────────────
/* Les publications et les videos portent leurs compteurs ; une
   reponse fait de meme, pour que le fil n ait pas a compter ligne a
   ligne ce que la base sait deja. */
alter table public.community_replies
  add column likes_count integer not null default 0;

create or replace function public.update_post_reaction_counts()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.post_id IS NOT NULL THEN
    CASE NEW.reaction_type
      WHEN 'support' THEN UPDATE community_posts SET support_count = support_count + 1 WHERE id = NEW.post_id;
      WHEN 'respect' THEN UPDATE community_posts SET respect_count = respect_count + 1 WHERE id = NEW.post_id;
      WHEN 'inspired' THEN UPDATE community_posts SET inspired_count = inspired_count + 1 WHERE id = NEW.post_id;
      ELSE NULL;
    END CASE;
  END IF;
  IF TG_OP = 'DELETE' AND OLD.post_id IS NOT NULL THEN
    CASE OLD.reaction_type
      WHEN 'support' THEN UPDATE community_posts SET support_count = GREATEST(support_count - 1, 0) WHERE id = OLD.post_id;
      WHEN 'respect' THEN UPDATE community_posts SET respect_count = GREATEST(respect_count - 1, 0) WHERE id = OLD.post_id;
      WHEN 'inspired' THEN UPDATE community_posts SET inspired_count = GREATEST(inspired_count - 1, 0) WHERE id = OLD.post_id;
      ELSE NULL;
    END CASE;
  END IF;
  IF TG_OP = 'INSERT' AND NEW.reel_id IS NOT NULL THEN
    CASE NEW.reaction_type
      WHEN 'support' THEN UPDATE victory_reels SET support_count = support_count + 1 WHERE id = NEW.reel_id;
      WHEN 'respect' THEN UPDATE victory_reels SET respect_count = respect_count + 1 WHERE id = NEW.reel_id;
      WHEN 'inspired' THEN UPDATE victory_reels SET inspired_count = inspired_count + 1 WHERE id = NEW.reel_id;
      ELSE NULL;
    END CASE;
  END IF;
  IF TG_OP = 'DELETE' AND OLD.reel_id IS NOT NULL THEN
    CASE OLD.reaction_type
      WHEN 'support' THEN UPDATE victory_reels SET support_count = GREATEST(support_count - 1, 0) WHERE id = OLD.reel_id;
      WHEN 'respect' THEN UPDATE victory_reels SET respect_count = GREATEST(respect_count - 1, 0) WHERE id = OLD.reel_id;
      WHEN 'inspired' THEN UPDATE victory_reels SET inspired_count = GREATEST(inspired_count - 1, 0) WHERE id = OLD.reel_id;
      ELSE NULL;
    END CASE;
  END IF;
  /* LA REPONSE : un seul compteur, puisqu un seul geste. */
  IF TG_OP = 'INSERT' AND NEW.reply_id IS NOT NULL THEN
    UPDATE community_replies SET likes_count = likes_count + 1 WHERE id = NEW.reply_id;
  END IF;
  IF TG_OP = 'DELETE' AND OLD.reply_id IS NOT NULL THEN
    UPDATE community_replies SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.reply_id;
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$function$;

/* LES POLITIQUES NE CHANGENT PAS, ET C EST VOULU. Les trois qui
   gouvernent cette table — lecture pour qui est authentifie, ecriture
   et suppression pour soi-meme — ne nomment aucune cible : elles
   couvrent donc la troisieme du seul fait qu elle existe. En ajouter
   une quatrieme pour les reponses creerait deux regles la ou une
   suffit, et la seconde finirait par diverger de la premiere. */
