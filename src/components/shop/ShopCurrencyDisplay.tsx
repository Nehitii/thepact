import { BondIcon } from "@/components/ui/bond-icon";

export function ShopCurrencyDisplay() {
  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 backdrop-blur-sm">
      <div className="relative">
        <BondIcon size={24} />
        <div className="absolute inset-0 bg-primary/30 blur-md rounded-full" />
      </div>
      <span className="font-orbitron text-sm text-primary font-bold tracking-wider">
        --- Coins
      </span>
    </div>
  );
}
