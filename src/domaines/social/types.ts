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
}

export interface CommunityReply {
  id: string;
  user_id: string;
  post_id: string;
  content: string;
  created_at: string;
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
