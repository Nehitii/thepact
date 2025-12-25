import { useAuth } from "@/contexts/AuthContext";
import { useBondBalance } from "@/hooks/useShop";
import { BondIcon } from "@/components/ui/bond-icon";

export function ShopBondDisplay() {
  const { user } = useAuth();
  const { data: balance, isLoading } = useBondBalance(user?.id);

  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 backdrop-blur-sm">
      <div className="relative">
        <BondIcon size={20} />
        <div className="absolute inset-0 bg-primary/30 blur-md rounded-full" />
      </div>
      <span className="font-orbitron text-sm text-primary font-bold tracking-wider">
        {isLoading ? "..." : (balance?.balance || 0).toLocaleString()} Bonds
      </span>
    </div>
  );
}
