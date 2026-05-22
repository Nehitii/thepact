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
  const templatesMarketplace = useFeatureFlag("social.templates_marketplace");
  const victoryReels = useFeatureFlag("social.victory_reels");

  return {
    friends: friends.enabled,
    guilds: guilds.enabled,
    community: community.enabled,
    leaderboard: leaderboard.enabled,
    hallOfFame: hallOfFame.enabled,
    inbox: inbox.enabled,
    sharing: sharing.enabled,
    templatesMarketplace: templatesMarketplace.enabled,
    victoryReels: victoryReels.enabled,
    anySocial:
      friends.enabled ||
      guilds.enabled ||
      community.enabled ||
      leaderboard.enabled ||
      hallOfFame.enabled ||
      inbox.enabled,
    isLoading: friends.isLoading || guilds.isLoading || community.isLoading,
  };
}