import type { Json } from "@/socle/supabase/types";
/* LES FORMES QUE COMMUNITY MANIPULE.
 *
 * Elles vivaient en tete d un fichier de 961 lignes qui portait aussi
 * seize hooks et trois domaines sans rapport. Ici elles n appartiennent
 * a aucun des trois, et les trois s en servent. */

export interface CommunityPost {
  id: string;
  user_id: string;
  content: string;
  goal_id: string | null;
  goal_name: string | null;
  /** Image ou GIF depose avec la publication, dans community-media. */
  image_url: string | null;
  post_type: 'reflection' | 'progress' | 'obstacle' | 'mindset' | 'help_request' | 'encouragement';
  is_public: boolean;
  created_at: string;
  updated_at: string;
  support_count: number;
  respect_count: number;
  inspired_count: number;
  profile?: {
    display_name: string | null;
    avatar_url: string | null;
    community_profile_discoverable?: boolean | null;
    share_goals_progress?: boolean | null;
  };
  reactions_count?: {
    support: number;
    respect: number;
    inspired: number;
  };
  replies_count?: number;
  user_reactions?: string[];
  /* LE REPARTAGE. La reference tombe quand l originale est
     supprimee, et la marque la remplace : sans elle, un repartage
     orphelin se lirait comme une publication ordinaire. Les trois
     etats se demelent dans « logique/repartage.ts ». */
  shared_post_id?: string | null;
  shared_post_gone?: boolean | null;
  /* L originale, chargee avec le fil. Absente si elle n existe plus. */
  shared_post?: CommunityPost;
}

export interface CommunityReply {
  id: string;
  user_id: string;
  post_id: string;
  content: string;
  created_at: string;
  /* Tenu par la base : le declencheur des reactions le met a jour. */
  likes_count?: number | null;
  /* Rapporte a la lecture : la table ne le porte pas, elle porte les
     reactions. Il vaut « faux » pour qui n est pas connecte. */
  aimee_par_moi?: boolean | null;
  profile?: {
    display_name: string | null;
    avatar_url: string | null;
    community_profile_discoverable?: boolean | null;
  };
}

export interface VictoryReel {
  id: string;
  user_id: string;
  goal_id: string;
  /** Copie a la publication : RLS empeche de lire l objectif d autrui. */
  goal_name: string | null;
  video_url: string;
  thumbnail_url: string | null;
  caption: string | null;
  duration_seconds: number;
  is_public: boolean;
  view_count: number;
  support_count: number;
  respect_count: number;
  inspired_count: number;
  created_at: string;
  profile?: {
    display_name: string | null;
    avatar_url: string | null;
    community_profile_discoverable?: boolean | null;
    share_goals_progress?: boolean | null;
  };
  /* Seul le nom est garanti : pour un reel d autrui, il vient de la
     colonne figee et la jointure n a rien rendu. */
  goal?: {
    name: string;
    type?: string;
    start_date?: string | null;
    completion_date?: string | null;
  };
  reactions_count?: {
    support: number;
    respect: number;
    inspired: number;
  };
  user_reactions?: string[];
}

export interface CompletedGoal {
  id: string;
  name: string;
  /* Nullables en base. Le « as any[] » sur la requete masquait l ecart
     avec cette declaration, qui les annoncait obligatoires. */
  type: string | null;
  difficulty: string | null;
  start_date: string | null;
  completion_date: string | null;
}

export interface UserGoal {
  id: string;
  name: string;
  /* Nullables en base. Le « as any[] » sur la requete masquait l ecart
     avec cette declaration, qui les annoncait obligatoires. */
  type: string | null;
  difficulty: string | null;
  status: string | null;
  start_date: string | null;
  completion_date: string | null;
}

export type PostSortOption = 'recent' | 'popular';
export type PostFilterType = CommunityPost['post_type'] | 'all';

/* LES DEUX FORMES D UN RAID, VENUES DE SON HOOK.
 *
 * QUATORZIEME FOIS LE MOTIF. En sortant les quatre canaux du raid dans
 * `logique/`, ce module s est mis a remonter vers un hook — pour deux
 * types. La garde des couches l a dit aussitot, comme les treize fois
 * precedentes. */
export const METRIQUES = ["etapes", "objectifs", "taches", "journal"] as const;
export type Metrique = (typeof METRIQUES)[number];

export type Compte = Record<Metrique, number>;

/* CE QUE « useGuilds.ts » DECLARAIT EN PLUS DE CALCULER.
 * Un type est inerte : il n a pas a vivre dans un fichier qui traine
 * React Query et Supabase derriere lui. Le fichier d origine les
 * REEXPORTE, parce que ses appelants les importaient depuis lui. */
export interface Guild {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  owner_id: string;
  created_at: string | null;
  max_members: number;
  is_public: boolean;
  banner_url: string | null;
  /* Deux colonnes que la base porte depuis toujours et que cette
     interface passait sous silence : le mot du jour n etait donc
     affiche nulle part, et l embleme depose non plus. */
  emblem_url: string | null;
  motd: string | null;
  /* Comment l embleme se pose sur la banniere, et ce qu il y a
     derriere lui quand il est detoure. */
  blason_pose: string;
  emblem_bg: string | null;
  total_xp: number;
  updated_at?: string | null;
  member_count?: number;
}

export interface GuildMember {
  id: string;
  guild_id: string;
  user_id: string;
  role: string;
  joined_at: string | null;
  rank_id?: string | null;
  display_name?: string;
  avatar_url?: string | null;
}

export interface GuildInvite {
  id: string;
  guild_id: string;
  inviter_id: string;
  invitee_id: string;
  status: string;
  created_at: string | null;
  guild_name?: string;
  guild_color?: string | null;
  inviter_name?: string | null;
}

export interface GuildAnnouncement {
  id: string;
  guild_id: string;
  author_id: string;
  content: string;
  pinned: boolean;
  created_at: string;
  author_name?: string | null;
  author_avatar?: string | null;
}

export interface GuildInviteCode {
  id: string;
  guild_id: string;
  code: string;
  created_by: string;
  max_uses: number | null;
  current_uses: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

export interface GuildActivity {
  id: string;
  guild_id: string;
  user_id: string | null;
  action_type: string;
  /* La colonne est de type json : elle peut valoir null, une valeur
     scalaire ou un objet. « Record<string, unknown> » en excluait les
     deux premiers cas. */
  metadata: Json;
  created_at: string;
  display_name?: string | null;
}
