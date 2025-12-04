import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ProfileMenuCard } from "./ProfileMenuCard";
import { useToast } from "@/hooks/use-toast";
import { LogOut } from "lucide-react";

export function ProfileSignOut() {
  const { signOut } = useAuth();
  const { toast } = useToast();

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed Out",
      description: "You have been signed out successfully",
    });
  };

  return (
    <ProfileMenuCard
      icon={<LogOut className="h-5 w-5 text-primary" />}
      title="Sign Out"
      description="End your current session"
    >
      <Button
        onClick={handleSignOut}
        variant="outline"
        className="w-full bg-destructive/10 border-destructive/30 hover:border-destructive/50 hover:bg-destructive/20 text-destructive font-rajdhani uppercase tracking-wide"
      >
        <LogOut className="h-4 w-4 mr-2" />
        Sign Out
      </Button>
    </ProfileMenuCard>
  );
}
