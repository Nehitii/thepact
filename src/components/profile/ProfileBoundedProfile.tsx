import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AvatarFrame, FramePreview } from "@/components/ui/avatar-frame";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RankBadge } from "@/components/ranks/RankCard";
import { useRankXP } from "@/hooks/useRankXP";
import { usePact } from "@/hooks/usePact";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Upload, Link as LinkIcon, ImageIcon, Crown, Sparkles, Lock, Save, Loader2, Shield } from "lucide-react";

// --- TYPES ---
interface CosmeticFrame {
  id: string;
  name: string;
  rarity: string;
  border_color: string;
  glow_color: string;
  preview_url: string | null;
  is_default: boolean;
  frame_scale?: number;
  frame_offset_x?: number;
  frame_offset_y?: number;
  show_border?: boolean;
  avatar_border_color?: string;
}

interface CosmeticBanner {
  id: string;
  name: string;
  rarity: string;
  gradient_start: string;
  gradient_end: string;
  banner_url: string | null;
  is_default: boolean;
}

interface CosmeticTitle {
  id: string;
  title_text: string;
  rarity: string;
  glow_color: string;
  text_color: string;
  is_default: boolean;
}

interface ProfileBoundedProfileProps {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  avatarFrame: string;
  personalQuote: string;
  displayedBadges: string[];
  onAvatarUrlChange: (url: string | null) => void;
  onAvatarFrameChange: (frame: string) => void;
  onPersonalQuoteChange: (quote: string) => void;
  onDisplayedBadgesChange: (badges: string[]) => void;
}

// --- SUB-COMPONENTS ---

function HolographicCard({ children }: { children: React.ReactNode }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseX = useSpring(x, { stiffness: 500, damping: 100 });
  const mouseY = useSpring(y, { stiffness: 500, damping: 100 });

  const rotateX = useTransform(mouseY, [-0.5, 0.5], ["5deg", "-5deg"]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], ["-5deg", "5deg"]);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseXFromCenter = e.clientX - rect.left - width / 2;
    const mouseYFromCenter = e.clientY - rect.top - height / 2;
    x.set(mouseXFromCenter / width);
    y.set(mouseYFromCenter / height);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      style={{
        perspective: 1200,
        rotateX,
        rotateY,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full h-full transition-all duration-200 ease-out"
    >
      <div className="relative h-full transform-style-3d shadow-2xl shadow-black/80 rounded-[20px] overflow-hidden bg-[#0a0a0f] border border-white/10 group">
        {/* Holographic Shine Effect overlay on mouse move */}
        <motion.div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-[60] mix-blend-overlay"
          style={{
            background: useTransform(
              mouseX,
              [-0.5, 0.5],
              [
                "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.1) 45%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0.1) 55%, transparent 60%)",
                "linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.3) 30%, rgba(255,255,255,0.1) 35%, transparent 40%)",
              ],
            ),
          }}
        />

        {children}

        {/* Static Noise Grain */}
        <div className="absolute inset-0 z-[50] pointer-events-none opacity-[0.04] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      </div>
    </motion.div>
  );
}

const CyberText = ({ text, className }: { text: string; className?: string }) => {
  return (
    <div className={`relative group inline-block ${className}`}>
      <span className="relative z-10">{text}</span>
      <span className="absolute top-0 left-0 -z-10 w-full h-full text-cyan-400 opacity-0 group-hover:opacity-70 group-hover:translate-x-[1px] transition-all duration-75 select-none blur-[0.5px]">
        {text}
      </span>
      <span className="absolute top-0 left-0 -z-10 w-full h-full text-red-500 opacity-0 group-hover:opacity-70 group-hover:-translate-x-[1px] transition-all duration-75 delay-75 select-none blur-[0.5px]">
        {text}
      </span>
    </div>
  );
};

const rarityColors: Record<string, { bg: string; text: string; glow: string; border: string }> = {
  common: { bg: "bg-slate-500/10", text: "text-slate-400", glow: "", border: "border-slate-500/30" },
  rare: { bg: "bg-blue-500/10", text: "text-blue-400", glow: "shadow-blue-500/20", border: "border-blue-500/50" },
  epic: {
    bg: "bg-purple-500/10",
    text: "text-purple-400",
    glow: "shadow-purple-500/20",
    border: "border-purple-500/50",
  },
  legendary: {
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    glow: "shadow-amber-500/30",
    border: "border-amber-500/50",
  },
};

// --- MAIN COMPONENT ---

export function ProfileBoundedProfile({
  userId,
  displayName,
  avatarUrl,
  onAvatarUrlChange,
}: ProfileBoundedProfileProps) {
  const { toast } = useToast();
  const { data: pact } = usePact(userId);
  const { data: rankData } = useRankXP(userId, pact?.id);

  // State
  const [saving, setSaving] = useState(false);
  const [avatarUrlInput, setAvatarUrlInput] = useState("");
  const [showAvatarDialog, setShowAvatarDialog] = useState(false);
  const [showFrameDialog, setShowFrameDialog] = useState(false);
  const [showBannerDialog, setShowBannerDialog] = useState(false);
  const [showTitleDialog, setShowTitleDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Data State
  const [frames, setFrames] = useState<CosmeticFrame[]>([]);
  const [banners, setBanners] = useState<CosmeticBanner[]>([]);
  const [titles, setTitles] = useState<CosmeticTitle[]>([]);

  const [ownedFrameIds, setOwnedFrameIds] = useState<Set<string>>(new Set());
  const [ownedBannerIds, setOwnedBannerIds] = useState<Set<string>>(new Set());
  const [ownedTitleIds, setOwnedTitleIds] = useState<Set<string>>(new Set());

  const [activeFrameId, setActiveFrameId] = useState<string | null>(null);
  const [activeBannerId, setActiveBannerId] = useState<string | null>(null);
  const [activeTitleId, setActiveTitleId] = useState<string | null>(null);

  // Derived
  const activeFrame = frames.find((f) => f.id === activeFrameId) || frames.find((f) => f.is_default);
  const activeBanner = banners.find((b) => b.id === activeBannerId) || banners.find((b) => b.is_default);
  const activeTitle = titles.find((t) => t.id === activeTitleId) || titles.find((t) => t.is_default);

  // Load Data
  useEffect(() => {
    const loadData = async () => {
      const [framesRes, bannersRes, titlesRes] = await Promise.all([
        supabase.from("cosmetic_frames").select("*").eq("is_active", true),
        supabase.from("cosmetic_banners").select("*").eq("is_active", true),
        supabase.from("cosmetic_titles").select("*").eq("is_active", true),
      ]);

      if (framesRes.data) setFrames(framesRes.data);
      if (bannersRes.data) setBanners(bannersRes.data);
      if (titlesRes.data) setTitles(titlesRes.data);

      const { data: ownership } = await supabase
        .from("user_cosmetics")
        .select("cosmetic_type, cosmetic_id")
        .eq("user_id", userId);

      if (ownership) {
        setOwnedFrameIds(new Set(ownership.filter((o) => o.cosmetic_type === "frame").map((o) => o.cosmetic_id)));
        setOwnedBannerIds(new Set(ownership.filter((o) => o.cosmetic_type === "banner").map((o) => o.cosmetic_id)));
        setOwnedTitleIds(new Set(ownership.filter((o) => o.cosmetic_type === "title").map((o) => o.cosmetic_id)));
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("active_frame_id, active_banner_id, active_title_id")
        .eq("id", userId)
        .single();

      if (profile) {
        setActiveFrameId(profile.active_frame_id);
        setActiveBannerId(profile.active_banner_id);
        setActiveTitleId(profile.active_title_id);
      }
    };
    loadData();
  }, [userId]);

  // Handlers
  const handleSaveAvatar = async () => {
    if (avatarUrlInput.trim()) {
      const newUrl = avatarUrlInput.trim();
      const urlWithCacheBust = newUrl.includes("?") ? `${newUrl}&t=${Date.now()}` : `${newUrl}?t=${Date.now()}`;
      onAvatarUrlChange(urlWithCacheBust);
      await supabase.from("profiles").update({ avatar_url: newUrl }).eq("id", userId);
      toast({ title: "Avatar updated", description: "Your profile image has been saved" });
    }
    setShowAvatarDialog(false);
    setAvatarUrlInput("");
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) {
      toast({ title: "Invalid file", description: "Must be JPG/PNG/WEBP under 5MB", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `avatar-${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("goal-images")
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: signedUrlData } = await supabase.storage
        .from("goal-images")
        .createSignedUrl(filePath, 60 * 60 * 24 * 365);

      if (signedUrlData) {
        const finalUrl = `${signedUrlData.signedUrl}&t=${Date.now()}`;
        onAvatarUrlChange(finalUrl);
        await supabase.from("profiles").update({ avatar_url: signedUrlData.signedUrl }).eq("id", userId);
        toast({ title: "Avatar uploaded", description: "Identity updated successfully." });
      }
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
      setShowAvatarDialog(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        avatar_url: avatarUrl,
        active_frame_id: activeFrameId,
        active_banner_id: activeBannerId,
        active_title_id: activeTitleId,
      })
      .eq("id", userId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Identity Saved", description: "Your bounded profile has been synchronized." });
    }
    setSaving(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* 1. PREVIEW SECTION (FULL CARD LAYOUT) */}
      <div className="flex justify-center py-6">
        {/* Container with Aspect Ratio closer to a real Trading Card (3:4 or 4:5) */}
        <div className="w-full max-w-[420px] h-[580px]">
          <HolographicCard>
            {/* LAYER 1: Full Background Banner (Z-0) */}
            <div
              className="absolute inset-0 z-0 bg-cover bg-center transition-all duration-700 ease-in-out"
              style={{
                background: activeBanner?.banner_url
                  ? `url(${activeBanner.banner_url}) center/cover no-repeat`
                  : `linear-gradient(135deg, ${activeBanner?.gradient_start || "#0a0a12"}, ${activeBanner?.gradient_end || "#1a1a2e"})`,
              }}
            />

            {/* LAYER 2: The Fade/Gradient Overlay (Z-10) */}
            {/* This creates the dark area for text legibility at the bottom */}
            <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#050508] via-[#050508]/90 via-40% to-transparent to-70%" />

            {/* Optional: Add scanlines only on the banner part (top) */}
            <div
              className="absolute inset-0 z-[5] opacity-20 pointer-events-none"
              style={{
                backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, #000 3px)",
                backgroundSize: "100% 4px",
                maskImage: "linear-gradient(to bottom, black 50%, transparent 100%)", // Fade out scanlines at bottom
              }}
            />

            {/* LAYER 3: Content Container (Z-20) */}
            <div className="absolute inset-0 z-20 flex flex-col justify-end pb-8 px-6">
              {/* HUD Top Label */}
              <div className="absolute top-4 left-4 right-4 flex justify-between items-start opacity-70">
                <div className="px-2 py-0.5 bg-black/40 backdrop-blur-md border border-white/10 rounded text-[10px] text-white/80 font-mono tracking-widest">
                  // {pact?.name || "INITIATE"}
                </div>
                {/* Rarity/Theme Badge (Optional) */}
                {activeBanner?.rarity && activeBanner.rarity !== "common" && (
                  <div
                    className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border ${rarityColors[activeBanner.rarity].bg} ${rarityColors[activeBanner.rarity].text} ${rarityColors[activeBanner.rarity].border}`}
                  >
                    {activeBanner.rarity}
                  </div>
                )}
              </div>

              {/* Main Profile Info */}
              <div className="flex flex-col items-center">
                {/* Avatar Area - Centered and sitting on the gradient boundary */}
                <div className="relative mb-4">
                  {/* Glow effect behind avatar */}
                  <div
                    className="absolute inset-0 rounded-full blur-2xl opacity-40 transition-opacity duration-500"
                    style={{ backgroundColor: activeFrame?.glow_color || "#5bb4ff" }}
                  />

                  {/* Avatar hover group - scoped to avatar only */}
                  <div className="relative group cursor-pointer" onClick={() => setShowAvatarDialog(true)}>
                    <AvatarFrame
                      avatarUrl={avatarUrl}
                      fallback={displayName?.[0] || "?"}
                      size="2xl"
                      frameImage={activeFrame?.preview_url}
                      borderColor={activeFrame?.avatar_border_color || activeFrame?.border_color || "#5bb4ff"}
                      glowColor={activeFrame?.glow_color || "rgba(91,180,255,0.5)"}
                      frameScale={activeFrame?.frame_scale}
                      frameOffsetX={activeFrame?.frame_offset_x}
                      frameOffsetY={activeFrame?.frame_offset_y}
                      showBorder={activeFrame?.show_border !== false}
                      className="transition-transform duration-300 group-hover:scale-105 shadow-2xl"
                    />

                    {/* Edit overlay - sized to match the avatar circle (h-32 w-32 = 2xl) */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-32 w-32 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 z-30 backdrop-blur-[2px]">
                        <Upload className="w-8 h-8 text-white drop-shadow-lg" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Identity Text */}
                <div className="text-center space-y-3 w-full">
                  <h3 className="text-2xl md:text-3xl font-orbitron font-black text-white tracking-wider drop-shadow-lg">
                    <CyberText text={displayName || "UNKNOWN"} />
                  </h3>

                  {/* Title Badge */}
                  <div className="flex justify-center">
                    <div
                      className="inline-flex items-center px-4 py-1.5 rounded-full border backdrop-blur-md shadow-lg"
                      style={{
                        borderColor: activeTitle?.text_color ? `${activeTitle.text_color}40` : "#ffffff20",
                        background: `linear-gradient(90deg, ${activeTitle?.text_color || "#5bb4ff"}15, ${activeTitle?.text_color || "#5bb4ff"}05)`,
                        boxShadow: `0 0 15px ${activeTitle?.glow_color || "transparent"}`,
                      }}
                    >
                      <Crown className="w-3.5 h-3.5 mr-2" style={{ color: activeTitle?.text_color || "#5bb4ff" }} />
                      <span
                        className="text-xs font-rajdhani uppercase tracking-[0.2em] font-bold"
                        style={{ color: activeTitle?.text_color || "#5bb4ff" }}
                      >
                        {activeTitle?.title_text || "NO TITLE"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Stats / Rank */}
                <div className="w-full mt-8 pt-4 border-t border-white/10 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-white/30 uppercase tracking-widest font-mono mb-1">
                      Current Rank
                    </span>
                    <div className="flex items-center gap-2 text-white/90 font-rajdhani font-semibold text-sm">
                      <Shield className="w-4 h-4 text-primary" />
                      {rankData?.currentRank?.name || "Unranked"}
                    </div>
                  </div>

                  {rankData?.currentRank && (
                    <RankBadge
                      rank={rankData.currentRank}
                      currentXP={rankData.currentXP}
                      nextRankMinXP={rankData.nextRank?.min_points}
                      size="sm"
                      className="scale-110 origin-right"
                    />
                  )}
                </div>
              </div>
            </div>
          </HolographicCard>
        </div>
      </div>

      {/* 2. ARMORY (CUSTOMIZATION) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CustomizationTrigger
          icon={<Sparkles className="w-5 h-5" />}
          label="Avatar Frame"
          value={activeFrame?.name}
          onClick={() => setShowFrameDialog(true)}
        />
        <CustomizationTrigger
          icon={<ImageIcon className="w-5 h-5" />}
          label="Profile Banner"
          value={activeBanner?.name}
          onClick={() => setShowBannerDialog(true)}
        />
        <CustomizationTrigger
          icon={<Crown className="w-5 h-5" />}
          label="Honorific Title"
          value={activeTitle?.title_text}
          onClick={() => setShowTitleDialog(true)}
        />
      </div>

      {/* 3. ACTION BAR */}
      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full h-14 bg-primary/10 border border-primary/50 hover:bg-primary/20 text-primary font-orbitron tracking-widest uppercase relative overflow-hidden group"
      >
        <span className="relative z-10 flex items-center gap-2">
          {saving ? <Loader2 className="animate-spin" /> : <Save />}
          {saving ? "Synchronizing..." : "Save Identity"}
        </span>
        <div className="absolute inset-0 bg-primary/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
      </Button>

      {/* --- DIALOGS (Keep existing implementation) --- */}
      <Dialog open={showAvatarDialog} onOpenChange={setShowAvatarDialog}>
        <DialogContent className="bg-background/95 backdrop-blur-xl border-primary/20">
          <DialogHeader>
            <DialogTitle className="font-orbitron text-primary">Upload Avatar</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="upload">Upload File</TabsTrigger>
              <TabsTrigger value="url">Image URL</TabsTrigger>
            </TabsList>
            <TabsContent value="upload" className="mt-4">
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full h-32 border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 flex flex-col gap-2"
              >
                {uploading ? <Loader2 className="animate-spin w-8 h-8" /> : <Upload className="w-8 h-8 opacity-50" />}
                <span className="text-xs uppercase tracking-wider opacity-70">Click to Select</span>
              </Button>
            </TabsContent>
            <TabsContent value="url" className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label>Direct Link</Label>
                <Input
                  placeholder="https://..."
                  value={avatarUrlInput}
                  onChange={(e) => setAvatarUrlInput(e.target.value)}
                />
              </div>
              <Button onClick={handleSaveAvatar} className="w-full">
                Confirm URL
              </Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <SelectionDialog open={showFrameDialog} onOpenChange={setShowFrameDialog} title="Select Frame">
        <div className="grid grid-cols-3 gap-3 p-1">
          {frames.map((frame) => {
            const owned = ownedFrameIds.has(frame.id) || frame.is_default;
            const active = activeFrameId === frame.id || (!activeFrameId && frame.is_default);
            const rarity = rarityColors[frame.rarity] || rarityColors.common;
            return (
              <InventorySlot
                key={frame.id}
                active={active}
                owned={owned}
                rarityColor={rarity.border}
                onClick={() => (owned || frame.is_default) && setActiveFrameId(frame.id)}
              >
                <div className="flex justify-center py-2">
                  <FramePreview
                    size="sm"
                    frameImage={frame.preview_url}
                    borderColor={frame.border_color}
                    glowColor={frame.glow_color}
                    frameScale={frame.frame_scale}
                    frameOffsetX={frame.frame_offset_x}
                    frameOffsetY={frame.frame_offset_y}
                  />
                </div>
                <div className="text-[10px] text-center truncate px-1 mt-1 opacity-70 font-rajdhani uppercase">
                  {frame.name}
                </div>
              </InventorySlot>
            );
          })}
        </div>
      </SelectionDialog>

      <SelectionDialog open={showBannerDialog} onOpenChange={setShowBannerDialog} title="Select Banner">
        <div className="grid grid-cols-2 gap-3 p-1">
          {banners.map((banner) => {
            const owned = ownedBannerIds.has(banner.id) || banner.is_default;
            const active = activeBannerId === banner.id || (!activeBannerId && banner.is_default);
            const rarity = rarityColors[banner.rarity] || rarityColors.common;
            return (
              <InventorySlot
                key={banner.id}
                active={active}
                owned={owned}
                rarityColor={rarity.border}
                onClick={() => (owned || banner.is_default) && setActiveBannerId(banner.id)}
              >
                <div
                  className="h-12 w-full mb-2 rounded-sm"
                  style={{
                    background: banner.banner_url
                      ? `url(${banner.banner_url}) center/cover`
                      : `linear-gradient(135deg, ${banner.gradient_start}, ${banner.gradient_end})`,
                  }}
                />
                <div className="text-[10px] text-center font-rajdhani uppercase">{banner.name}</div>
              </InventorySlot>
            );
          })}
        </div>
      </SelectionDialog>

      <SelectionDialog open={showTitleDialog} onOpenChange={setShowTitleDialog} title="Select Title">
        <div className="grid grid-cols-2 gap-3 p-1">
          {titles.map((title) => {
            const owned = ownedTitleIds.has(title.id) || title.is_default;
            const active = activeTitleId === title.id || (!activeTitleId && title.is_default);
            const rarity = rarityColors[title.rarity] || rarityColors.common;
            return (
              <InventorySlot
                key={title.id}
                active={active}
                owned={owned}
                rarityColor={rarity.border}
                onClick={() => (owned || title.is_default) && setActiveTitleId(title.id)}
              >
                <div
                  className="py-3 px-2 text-center text-sm font-rajdhani font-bold"
                  style={{
                    color: title.text_color || "#fff",
                    textShadow: `0 0 5px ${title.glow_color}`,
                  }}
                >
                  {title.title_text}
                </div>
              </InventorySlot>
            );
          })}
        </div>
      </SelectionDialog>
    </div>
  );
}

// Helper Components (unchanged)
function CustomizationTrigger({
  icon,
  label,
  value,
  onClick,
}: {
  icon: any;
  label: string;
  value?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center p-4 rounded-xl border border-primary/20 bg-card/30 hover:bg-primary/5 hover:border-primary/50 transition-all group relative overflow-hidden"
    >
      <div className="mb-2 p-2 rounded-full bg-primary/10 text-primary group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <span className="text-xs text-muted-foreground uppercase tracking-wider font-mono mb-1">{label}</span>
      <span className="text-sm font-bold text-foreground font-rajdhani truncate w-full text-center">
        {value || "Default"}
      </span>
      <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-primary/30 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-primary/30 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}

function SelectionDialog({
  open,
  onOpenChange,
  title,
  children,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0a0a0f]/95 backdrop-blur-xl border-primary/20 max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-orbitron text-primary tracking-widest uppercase flex items-center gap-2">
            <div className="w-1 h-4 bg-primary" />
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto pr-2 mt-4 custom-scrollbar">{children}</div>
      </DialogContent>
    </Dialog>
  );
}

function InventorySlot({
  active,
  owned,
  rarityColor,
  onClick,
  children,
}: {
  active: boolean;
  owned: boolean;
  rarityColor: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={!owned}
      className={`
        relative group overflow-hidden rounded-lg border-2 transition-all duration-200 p-2 flex flex-col items-center justify-center min-h-[100px]
        ${
          active
            ? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(91,180,255,0.2)]"
            : owned
              ? `border-white/10 bg-card/30 hover:border-white/30 hover:bg-card/50`
              : "border-white/5 bg-black/40 opacity-40 grayscale cursor-not-allowed"
        }
      `}
    >
      <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-white/20" />
      <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-white/20" />

      {children}

      {active && (
        <div className="absolute top-0 right-0 bg-primary text-black text-[9px] font-bold px-1.5 py-0.5 rounded-bl font-mono">
          EQP
        </div>
      )}
      {!owned && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Lock className="w-4 h-4 text-white/50" />
        </div>
      )}
    </button>
  );
}
