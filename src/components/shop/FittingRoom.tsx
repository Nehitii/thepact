import { useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AvatarFrame } from "@/components/ui/avatar-frame";
import { useAuth } from "@/contexts/AuthContext";
import {
  useShopFrames,
  useShopBanners,
  useShopTitles,
  CosmeticFrame,
  CosmeticBanner,
  CosmeticTitle,
} from "@/hooks/useShop";
import { HoldPurchaseButton } from "./HoldPurchaseButton";
import { BondIcon } from "@/components/ui/bond-icon";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

type PreviewItem =
  | { type: "frame"; data: CosmeticFrame }
  | { type: "banner"; data: CosmeticBanner }
  | { type: "title"; data: CosmeticTitle };

interface FittingRoomProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  previewItem: PreviewItem | null;
  onPurchase: () => void;
  isPending: boolean;
  canAfford: boolean;
  currentBalance: number;
}

export function FittingRoom({
  open,
  onOpenChange,
  previewItem,
  onPurchase,
  isPending,
  canAfford,
  currentBalance,
}: FittingRoomProps) {
  const { user } = useAuth();

  // Load current user profile data
  const { data: profile } = useQuery({
    queryKey: ["profile-cosmetics", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  // Load available cosmetics to find currently equipped ones
  const { data: frames = [] } = useShopFrames();
  const { data: banners = [] } = useShopBanners();
  const { data: titles = [] } = useShopTitles();

  const currentFrame = frames.find((f) => f.id === profile?.active_frame_id);
  const currentBanner = banners.find((b) => b.id === profile?.active_banner_id);
  const currentTitle = titles.find((t) => t.id === profile?.active_title_id);

  if (!previewItem) return null;

  // Mix current equipment with preview item
  const displayFrame = previewItem.type === "frame" ? previewItem.data : currentFrame;
  const displayBanner = previewItem.type === "banner" ? previewItem.data : currentBanner;
  const displayTitle = previewItem.type === "title" ? (previewItem.data as CosmeticTitle) : currentTitle;

  const price = previewItem.type === "title" ? (previewItem.data as CosmeticTitle).price : previewItem.data.price;
  const name = previewItem.type === "title" ? (previewItem.data as CosmeticTitle).title_text : previewItem.data.name;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md border-l border-primary/20 bg-background/95 backdrop-blur-xl p-0"
      >
        <SheetHeader className="p-6 pb-4 border-b border-primary/10">
          <SheetTitle className="font-orbitron text-lg tracking-wider text-primary">FITTING ROOM</SheetTitle>
        </SheetHeader>

        <div className="p-6 space-y-6">
          {/* Mock Profile Header */}
          <div className="rounded-xl border border-primary/20 overflow-hidden bg-card/50 shadow-2xl">
            {/* Banner Area */}
            <div
              className="w-full h-28 relative"
              style={{
                background: displayBanner?.banner_url
                  ? `url(${displayBanner.banner_url}) center/cover`
                  : `linear-gradient(135deg, ${displayBanner?.gradient_start || "#0a0a12"}, ${displayBanner?.gradient_end || "#1a1a2e"})`,
              }}
            >
              {previewItem.type === "banner" && (
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-primary/20 text-[10px] text-primary font-orbitron border border-primary/40">
                  PREVIEW
                </div>
              )}
            </div>

            {/* Avatar & Info Area */}
            <div className="px-5 pb-5 -mt-10 relative flex flex-col">
              <div className="relative inline-block self-start">
                <AvatarFrame
                  size="lg"
                  avatarUrl={profile?.avatar_url}
                  fallback={(profile?.display_name || "U")[0]}
                  frameImage={displayFrame?.preview_url}
                  borderColor={displayFrame?.border_color}
                  glowColor={displayFrame?.glow_color}
                  frameScale={displayFrame?.frame_scale}
                  frameOffsetX={displayFrame?.frame_offset_x}
                  frameOffsetY={displayFrame?.frame_offset_y}
                />
                {previewItem.type === "frame" && (
                  <div className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-primary/20 border border-primary/40 text-[8px] font-orbitron text-primary">
                    NEW
                  </div>
                )}
              </div>

              <div className="mt-3">
                <p className="font-rajdhani font-semibold text-foreground text-xl">{profile?.display_name || "User"}</p>
                {displayTitle && (
                  <span
                    className="font-orbitron text-xs font-bold tracking-wider"
                    style={{
                      color: displayTitle.text_color || "#5bb4ff",
                      textShadow: displayTitle.glow_color ? `0 0 8px ${displayTitle.glow_color}` : undefined,
                    }}
                  >
                    {displayTitle.title_text}
                  </span>
                )}
                {previewItem.type === "title" && (
                  <span className="ml-2 text-primary/60 text-[8px] font-orbitron">← PREVIEW</span>
                )}
              </div>
            </div>
          </div>

          {/* Item Details */}
          <div className="rounded-xl border border-primary/10 bg-card/30 p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-rajdhani font-semibold text-lg">{name}</span>
              <span className="text-xs uppercase tracking-wider text-muted-foreground">{previewItem.type}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-sm">Cost</span>
              <div className="flex items-center gap-1.5 text-primary font-orbitron">
                <BondIcon size={16} /> {price.toLocaleString()}
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-sm">Balance After</span>
              <span className={`font-orbitron ${canAfford ? "text-primary" : "text-red-500"}`}>
                {Math.max(0, currentBalance - price).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Action Button */}
          <HoldPurchaseButton onComplete={onPurchase} disabled={!canAfford} isPending={isPending} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
