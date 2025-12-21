import { Coins } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useBondBalance } from "@/hooks/useShop";

export function ShopBondDisplay() {
  const { user } = useAuth();
  const { data: balance, isLoading } = useBondBalance(user?.id);

  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 backdrop-blur-sm">
      <div className="relative">
        <Coins className="w-5 h-5 text-primary" />
        <div className="absolute inset-0 bg-primary/30 blur-md rounded-full" />
      </div>
      <span className="font-orbitron text-sm text-primary font-bold tracking-wider">
        {isLoading ? "..." : (balance?.balance || 0).toLocaleString()} Bonds
      </span>
    </div>
  );
}
