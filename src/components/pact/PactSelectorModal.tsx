import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePact } from "@/hooks/usePact";
import { useSharedPacts } from "@/hooks/useSharedPacts";
import { useActivePact } from "@/hooks/useActivePact";
import { motion } from "framer-motion";
import { Users, User, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function PactSelectorPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: personalPact } = usePact(user?.id);
  const { memberships, loading } = useSharedPacts();
  const { setActivePact } = useActivePact();

  const handleSelect = async (pactId: string) => {
    try {
      await setActivePact.mutateAsync(pactId);
      navigate("/", { replace: true });
    } catch {
      toast.error("Failed to switch pact");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 font-rajdhani">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] opacity-40" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-[120px] opacity-40" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-lg space-y-6"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black font-orbitron text-foreground tracking-widest uppercase mb-2">
            Choose Your Path
          </h1>
          <p className="text-sm text-muted-foreground">Select which pact to enter</p>
        </div>

        <div className="space-y-3">
          {/* Personal Pact */}
          {personalPact && (
            <PactCard
              name={personalPact.name}
              mantra={personalPact.mantra}
              color={personalPact.color}
              icon={<User className="h-6 w-6" />}
              label="Personal Pact"
              onClick={() => handleSelect(personalPact.id)}
            />
          )}

          {/* Shared Pacts */}
          {memberships.map((m) => (
            <PactCard
              key={m.id}
              name={m.pact_name || "Shared Pact"}
              mantra={m.pact_mantra || ""}
              color={m.pact_color || "#8b5cf6"}
              icon={<Users className="h-6 w-6" />}
              label={`Shared • ${m.member_count || 0} members`}
              onClick={() => handleSelect(m.pact_id)}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function PactCard({ name, mantra, color, icon, label, onClick }: {
  name: string; mantra: string; color: string | null;
  icon: React.ReactNode; label: string; onClick: () => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "w-full text-left p-5 rounded-2xl border border-border bg-card/80 backdrop-blur-sm",
        "hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300",
        "group relative overflow-hidden",
      )}
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: `radial-gradient(circle at 20% 50%, ${color || "hsl(var(--primary))"}15, transparent 70%)` }}
      />
      <div className="relative flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-muted border border-border flex items-center justify-center text-primary">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono mb-0.5">{label}</p>
          <h3 className="text-lg font-black font-orbitron tracking-wide text-foreground truncate">{name}</h3>
          {mantra && <p className="text-xs text-muted-foreground italic truncate mt-0.5">{mantra}</p>}
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
    </motion.button>
  );
}
