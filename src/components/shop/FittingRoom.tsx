import { useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AvatarFrame, FramePreview } from "@/components/ui/avatar-frame";
import { useAuth } from "@/contexts/AuthContext";
import { useUserCosmetics, useShopFrames, useShopBanners, useShopTitles, CosmeticFrame, CosmeticBanner, CosmeticTitle } from "@/hooks/useShop";
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

  // Fetch current user's profile for avatar/active cosmetics
  const { data: profile } = useQuery({
    queryKey: ["profile-cosmetics", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("profiles")
        .select("avatar_url, display_name, active_frame_id, active_banner_id, active_title_id")
        .eq("id", user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch current active cosmetics for live preview
  const { data: frames = [] } = useShopFrames();
  const { data: banners = [] } = useShopBanners();
  const { data: titles = [] } = useShopTitles();

  const currentFrame = useMemo(
    () => frames.find((f) => f.id === profile?.active_frame_id),
    [frames, profile?.active_frame_id]
  );
  const currentBanner = useMemo(
    () => banners.find((b) => b.id === profile?.active_banner_id),
    [banners, profile?.active_banner_id]
  );
  const currentTitle = useMemo(
    () => titles.find((t) => t.id === profile?.active_title_id),
    [titles, profile?.active_title_id]
  );

  if (!previewItem) return null;

  // Merge current cosmetics with the previewed one
  const displayFrame = previewItem.type === "frame" ? previewItem.data : currentFrame;
  const displayBanner = previewItem.type === "banner" ? previewItem.data : currentBanner;
  const displayTitle = previewItem.type === "title" ? previewItem.data as CosmeticTitle : currentTitle;

  const price = previewItem.type === "frame"
    ? previewItem.data.price
    : previewItem.type === "banner"
      ? previewItem.data.price
      : (previewItem.data as CosmeticTitle).price;

  const itemName = previewItem.type === "title"
    ? (previewItem.data as CosmeticTitle).title_text
    : previewItem.data.name;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md border-l border-primary/20 bg-background/95 backdrop-blur-xl p-0">
        <SheetHeader className="p-6 pb-4 border-b border-primary/10">
          <SheetTitle className="font-orbitron text-lg tracking-wider text-primary">
            FITTING ROOM
          </SheetTitle>
          <p className="text-xs text-muted-foreground font-rajdhani">
            Preview how this item looks on your profile
          </p>
        </SheetHeader>

        <div className="p-6 space-y-6">
          {/* Mock Profile Header */}
          <div className="rounded-xl border border-primary/20 overflow-hidden bg-card/50">
            {/* Banner */}
            <div
              className="w-full h-24 relative"
              style={{
                background: displayBanner?.banner_url
                  ? `url(${displayBanner.banner_url}) center/cover`
                  : `linear-gradient(135deg, ${displayBanner?.gradient_start || "#0a0a12"}, ${displayBanner?.gradient_end || "#1a1a2e"})`,
              }}
            >
              {previewItem.type === "banner" && (
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-primary/20 border border-primary/40 text-[10px] font-orbitron text-primary">
                  PREVIEW
                </div>
              )}
            </div>

            {/* Avatar + Info */}
            <div className="px-4 pb-4 -mt-8 relative">
              <div className="relative inline-block">
                {displayFrame ? (
                  <div className="relative">
                    <AvatarFrame
                      size="lg"
                      avatarUrl={profile?.avatar_url}
                      fallback={(profile?.display_name || "U")[0]}
                      frameImage={displayFrame.preview_url}
                      borderColor={displayFrame.border_color}
                      glowColor={displayFrame.glow_color}
                      frameScale={displayFrame.frame_scale}
                      frameOffsetX={displayFrame.frame_offset_x}
                      frameOffsetY={displayFrame.frame_offset_y}
                    />
                    {previewItem.type === "frame" && (
                      <div className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-primary/20 border border-primary/40 text-[8px] font-orbitron text-primary">
                        NEW
                      </div>
                    )}
                  </div>
                ) : (
                  <Avatar className="w-16 h-16 border-2 border-primary/30">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-card text-foreground font-orbitron">
                      {(profile?.display_name || "U")[0]}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>

              <div className="mt-3">
                <p className="font-rajdhani font-semibold text-foreground text-lg">
                  {profile?.display_name || "User"}
                </p>
                {displayTitle && (
                  <span
                    className="font-orbitron text-xs font-bold tracking-wider"
                    style={{
                      color: displayTitle.text_color || "#5bb4ff",
                      textShadow: displayTitle.glow_color
                        ? `0 0 8px ${displayTitle.glow_color}`
                        : undefined,
                    }}
                  >
                    {displayTitle.title_text}
                    {previewItem.type === "title" && (
                      <span className="ml-2 text-primary/60 text-[8px]">← PREVIEW</span>
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Item Info */}
          <div className="rounded-xl border border-primary/10 bg-card/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-rajdhani font-semibold text-foreground">{itemName}</span>
              <span className="text-xs uppercase tracking-wider text-muted-foreground capitalize">
                {previewItem.type}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm font-rajdhani">
              <span className="text-muted-foreground">Price</span>
              <div className="flex items-center gap-1.5 text-primary font-orbitron">
                <BondIcon size={16} />
                {price.toLocaleString()}
              </div>
            </div>
            <div className="flex items-center justify-between text-sm font-rajdhani">
              <span className="text-muted-foreground">Balance after</span>
              <span className={`font-orbitron ${canAfford ? "text-primary" : "text-destructive"}`}>
                {Math.max(0, currentBalance - price).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Hold-to-Buy */}
          <HoldPurchaseButton
            onComplete={onPurchase}
            disabled={!canAfford}
            isPending={isPending}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
