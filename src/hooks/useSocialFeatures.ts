import { useFeatureFlag } from "./useFeatureFlag";

/**
 * Aggregate resolver for all social-related feature flags.
 * Used to gate UI/routing for social modules while keeping the code intact.
 */
export function useSocialFeatures() {
  const friends = useFeatureFlag("social.friends");
  const guilds = useFeatureFlag("social.guilds");
  const community = useFeatureFlag("social.community");
  const leaderboard = useFeatureFlag("social.leaderboard");
  const hallOfFame = useFeatureFlag("social.hall_of_fame");
  const inbox = useFeatureFlag("social.inbox");
  const sharing = useFeatureFlag("social.sharing");
  /* `social.victory_reels` a été retiré de `feature_flags` : il était
     résolu ici et lu par personne. Le garder faisait une lecture de plus
     à chaque montage, pour une réponse dont rien ne dépendait. */

  return {
    friends: friends.enabled,
    guilds: guilds.enabled,
    community: community.enabled,
    leaderboard: leaderboard.enabled,
    hallOfFame: hallOfFame.enabled,
    inbox: inbox.enabled,
    sharing: sharing.enabled,
    anySocial:
      friends.enabled ||
      guilds.enabled ||
      community.enabled ||
      leaderboard.enabled ||
      hallOfFame.enabled ||
      inbox.enabled,
    isLoading:
      friends.isLoading ||
      guilds.isLoading ||
      community.isLoading ||
      leaderboard.isLoading ||
      hallOfFame.isLoading ||
      inbox.isLoading ||
      sharing.isLoading,
    loadingMap: {
      friends: friends.isLoading,
      guilds: guilds.isLoading,
      community: community.isLoading,
      leaderboard: leaderboard.isLoading,
      hallOfFame: hallOfFame.isLoading,
      inbox: inbox.isLoading,
      sharing: sharing.isLoading,
    },
  };
}