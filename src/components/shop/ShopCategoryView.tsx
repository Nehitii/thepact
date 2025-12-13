import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShopItemCard } from "./ShopItemCard";
import { ThemePreviewCard } from "./ThemePreviewCard";
import { Frame, Image, Paintbrush } from "lucide-react";

interface ShopCategoryViewProps {
  category: "themes" | "frames" | "banners";
  onBack: () => void;
}

// Mock data
const themesData = [
  { name: "Neon Cyber", bg: "#0a0f1a", accent: "#5BB4FF", glow: "#5BB4FF", rarity: "common" as const, status: "available" as const },
  { name: "Crimson Edge", bg: "#1a0a0f", accent: "#FF5B5B", glow: "#FF5B5B", rarity: "rare" as const, status: "available" as const },
  { name: "Void Purple", bg: "#0f0a1a", accent: "#A855F7", glow: "#A855F7", rarity: "epic" as const, status: "available" as const },
  { name: "Golden Dawn", bg: "#1a150a", accent: "#FBB034", glow: "#FBB034", rarity: "legendary" as const, status: "owned" as const },
  { name: "Matrix Green", bg: "#0a1a0f", accent: "#22C55E", glow: "#22C55E", rarity: "rare" as const, status: "coming_soon" as const },
  { name: "Arctic Frost", bg: "#0a1519", accent: "#67E8F9", glow: "#67E8F9", rarity: "epic" as const, status: "coming_soon" as const },
];

const framesData = [
  { name: "Basic Circle", rarity: "common" as const, status: "owned" as const },
  { name: "Cyber Hex", rarity: "rare" as const, status: "available" as const },
  { name: "Neon Ring", rarity: "rare" as const, status: "available" as const },
  { name: "Void Portal", rarity: "epic" as const, status: "available" as const },
  { name: "Champion Crown", rarity: "legendary" as const, status: "coming_soon" as const },
  { name: "Inferno Edge", rarity: "epic" as const, status: "coming_soon" as const },
];

const bannersData = [
  { name: "Default Wave", rarity: "common" as const, status: "owned" as const },
  { name: "City Lights", rarity: "rare" as const, status: "available" as const },
  { name: "Abstract Flow", rarity: "rare" as const, status: "available" as const },
  { name: "Cosmic Nebula", rarity: "epic" as const, status: "available" as const },
  { name: "Dragon Fire", rarity: "legendary" as const, status: "coming_soon" as const },
  { name: "Ocean Depths", rarity: "epic" as const, status: "coming_soon" as const },
];

const categoryTitles = {
  themes: "Themes",
  frames: "Avatar Frames",
  banners: "Banners",
};

export function ShopCategoryView({ category, onBack }: ShopCategoryViewProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="text-primary hover:bg-primary/10"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h2 className="font-orbitron text-xl font-bold text-foreground tracking-wider">
          {categoryTitles[category]}
        </h2>
      </div>

      {/* Items grid */}
      <div className="grid grid-cols-2 gap-4">
        {category === "themes" &&
          themesData.map((theme) => (
            <ShopItemCard
              key={theme.name}
              name={theme.name}
              price="XX Coins"
              rarity={theme.rarity}
              status={theme.status}
              preview={
                <ThemePreviewCard
                  name={theme.name}
                  bgColor={theme.bg}
                  accentColor={theme.accent}
                  glowColor={theme.glow}
                />
              }
            />
          ))}

        {category === "frames" &&
          framesData.map((frame) => (
            <ShopItemCard
              key={frame.name}
              name={frame.name}
              price="XX Coins"
              rarity={frame.rarity}
              status={frame.status}
              preview={
                <div className="w-20 h-20 rounded-full border-4 border-primary/40 bg-primary/10 flex items-center justify-center">
                  <Frame className="w-8 h-8 text-primary/60" />
                </div>
              }
            />
          ))}

        {category === "banners" &&
          bannersData.map((banner) => (
            <ShopItemCard
              key={banner.name}
              name={banner.name}
              price="XX Coins"
              rarity={banner.rarity}
              status={banner.status}
              preview={
                <div className="w-full h-16 rounded-lg bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 border border-primary/30 flex items-center justify-center">
                  <Image className="w-6 h-6 text-primary/60" />
                </div>
              }
            />
          ))}
      </div>
    </div>
  );
}
