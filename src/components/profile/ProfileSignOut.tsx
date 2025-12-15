import { useAuth } from "@/contexts/AuthContext";
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
    <div className="pt-6 animate-fade-in">
      <button
        onClick={handleSignOut}
        className="w-full py-4 px-6 flex items-center justify-center gap-3 
          bg-destructive/10 hover:bg-destructive/20 
          border border-destructive/30 hover:border-destructive/50 
          rounded-lg transition-all duration-300 group
          shadow-[0_0_20px_rgba(239,68,68,0.1)] hover:shadow-[0_0_30px_rgba(239,68,68,0.2)]"
      >
        <LogOut className="h-5 w-5 text-destructive group-hover:drop-shadow-[0_0_8px_rgba(239,68,68,0.6)] transition-all duration-300" />
        <span className="text-destructive font-rajdhani font-semibold uppercase tracking-widest text-sm group-hover:drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]">
          Sign Out
        </span>
      </button>
    </div>
  );
}
