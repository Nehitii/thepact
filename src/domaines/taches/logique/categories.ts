import {
  Briefcase, Heart, User, BookOpen, Cog, Tag,
  Wallet, Home, ShoppingCart, Users, Palette, Dumbbell,
  type LucideIcon,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   LES CATEGORIES D UNE TACHE, EN UN SEUL ENDROIT

   Elles etaient ecrites QUATRE FOIS : le formulaire de creation, la
   saisie rapide, la carte du calendrier, les couleurs des
   statistiques. Quatre listes des memes six categories, tenues a la
   main.

   Elles avaient deja diverge, et ce n est pas une hypothese : « Sante »
   valait #ff4d5e dans le formulaire et #ef4444 dans les statistiques,
   « Admin » passait de #94a3b8 a #6b7280, et « General » sautait du
   bleu clair au violet. La meme tache changeait donc de couleur selon
   l ecran qui la montrait.

   Une seule liste, et les quatre consommateurs la lisent. Ajouter une
   categorie devient une ligne, au lieu de quatre modifications dont on
   en oublie toujours une.

   LA BASE NE CONTRAINT RIEN. `todo_tasks.category` est du texte libre
   avec « general » par defaut : cette liste n est donc pas un schema,
   c est ce que l interface PROPOSE. Une tache portant une categorie
   inconnue — venue d un import ou d une version anterieure — retombe
   proprement sur « general » plutot que de casser un rendu.
   ═══════════════════════════════════════════════════════════════ */

export interface CategorieTache {
  id: string;
  icone: LucideIcon;
  /** La teinte, en hexadecimal : les quatre consommateurs en tirent ce
      dont ils ont besoin — pastille, fond translucide, part de graphe. */
  couleur: string;
}

export const CATEGORIES_TACHE: readonly CategorieTache[] = [
  /* LES SIX D ORIGINE, teintes reprises du formulaire — c est lui qui
     faisait foi, puisque c est la qu on les choisit. */
  { id: "work", icone: Briefcase, couleur: "#3b82f6" },
  { id: "health", icone: Heart, couleur: "#ff4d5e" },
  { id: "personal", icone: User, couleur: "#a855f7" },
  { id: "study", icone: BookOpen, couleur: "#10b981" },
  { id: "admin", icone: Cog, couleur: "#94a3b8" },

  /* LES SIX AJOUTEES.
     Non pas des domaines de vie — l app en a deja, ce sont les tags
     d objectif — mais des NATURES DE TACHE : ce qu on doit faire, pas
     le rayon de l existence auquel ca appartient.

     FINANCE se distingue d ADMIN : payer une taxe fonciere n est pas
     une demarche, c est de l argent qui part — et l app a tout un
     module pour ca.
     SPORT se distingue de SANTE : l une est le medical et le
     bien-etre, l autre l entrainement. Les confondre range « prendre
     rendez-vous chez le dentiste » avec « seance de fractionne ».
     SOCIAL n existait nulle part, alors qu appeler quelqu un ou penser
     a un anniversaire est une part entiere de ce qu on a a faire.
     MAISON et COURSES sortaient de « personnel » ou de « general »,
     qui ne disaient rien.
     CREATIF, enfin, parce que les projets personnels sont exactement
     ce que cette app sert a tenir. */
  { id: "finance", icone: Wallet, couleur: "#f59e0b" },
  { id: "home", icone: Home, couleur: "#f97316" },
  { id: "errands", icone: ShoppingCart, couleur: "#a3e635" },
  { id: "social", icone: Users, couleur: "#f472b6" },
  { id: "creative", icone: Palette, couleur: "#818cf8" },
  { id: "sport", icone: Dumbbell, couleur: "#2dd4bf" },

  /* « General » ferme la marche : c est le defaut de la base, et une
     categorie fourre-tout n a rien a faire au milieu des autres. */
  { id: "general", icone: Tag, couleur: "#7dd3fc" },
];

/** Les seuls identifiants proposes par l interface. */
export const IDS_CATEGORIE: readonly string[] = CATEGORIES_TACHE.map((c) => c.id);

const GENERAL = CATEGORIES_TACHE[CATEGORIES_TACHE.length - 1];

/**
 * La categorie d une tache, avec repli.
 *
 * Une valeur inconnue ne doit jamais casser un rendu : elle retombe sur
 * « general », qui est aussi le defaut de la colonne en base.
 */
export const categorieDe = (id: string | null | undefined): CategorieTache =>
  CATEGORIES_TACHE.find((c) => c.id === id) ?? GENERAL;

/** Le fond translucide d une categorie, pour les pastilles et jetons. */
export const fondDe = (id: string | null | undefined, part = 18): string =>
  `color-mix(in srgb, ${categorieDe(id).couleur} ${part}%, transparent)`;
