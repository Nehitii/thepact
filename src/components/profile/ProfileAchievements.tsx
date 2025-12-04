import { ProfileMenuCard } from "./ProfileMenuCard";
import { Button } from "@/components/ui/button";
import { Trophy } from "lucide-react";

export function ProfileAchievements() {
  return (
    <ProfileMenuCard
      icon={<Trophy className="h-5 w-5 text-primary" />}
      title="The Pact Achievements"
      description="View your unlocked achievements and track your progress"
    >
      <Button
        variant="outline"
        className="w-full bg-primary/10 border-primary/30 hover:border-primary/50 hover:bg-primary/20 text-primary font-rajdhani uppercase tracking-wide"
        onClick={() => window.location.href = "/achievements"}
      >
        View All Achievements
      </Button>
    </ProfileMenuCard>
  );
}
