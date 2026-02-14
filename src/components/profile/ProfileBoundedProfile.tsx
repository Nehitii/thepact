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
import { Upload, Link as LinkIcon, ImageIcon, Crown, Sparkles, Lock, Check, Save, Loader2, Shield } from "lucide-react";

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

// --- SUB-COMPONENTS (AESTHETIC) ---

// 1. Holographic Tilt Card Wrapper
function HolographicCard({ children }: { children: React.ReactNode }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseX = useSpring(x, { stiffness: 500, damping: 100 });
  const mouseY = useSpring(y, { stiffness: 500, damping: 100 });

  const rotateX = useTransform(mouseY, [-0.5, 0.5], ["7deg", "-7deg"]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], ["-7deg", "7deg"]);

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
        perspective: 1000,
        rotateX,
        rotateY,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full transition-all duration-200 ease-out"
    >
      <div className="relative transform-style-3d shadow-2xl shadow-black/50 rounded-2xl overflow-hidden">
        {children}
        {/* Holographic Overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20 z-50 mix-blend-overlay"
          style={{
            background: `linear-gradient(115deg, transparent 0%, rgba(255,255,255,0.4) 45%, rgba(0,0,0,0.1) 55%, transparent 100%)`,
          }}
        />
        {/* Border Glow */}
        <div className="absolute inset-0 border border-white/10 rounded-2xl pointer-events-none z-50" />
      </div>
    </motion.div>
  );
}

// 2. Cyber Glitch Text
const CyberText = ({ text, className }: { text: string; className?: string }) => {
  return (
    <div className={`relative group inline-block ${className}`}>
      <span className="relative z-10">{text}</span>
      <span className="absolute top-0 left-0 -z-10 w-full h-full text-cyan-400 opacity-0 group-hover:opacity-70 group-hover:translate-x-[2px] transition-all duration-75 select-none blur-[0.5px]">
        {text}
      </span>
      <span className="absolute top-0 left-0 -z-10 w-full h-full text-red-500 opacity-0 group-hover:opacity-70 group-hover:-translate-x-[2px] transition-all duration-75 delay-75 select-none blur-[0.5px]">
        {text}
      </span>
    </div>
  );
};

// 3. Rarity Colors Configuration
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

      // Note: Idealement utiliser getPublicUrl si le bucket est public. Ici on garde signedUrl par sécurité.
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

  // --- RENDER ---
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* 1. PREVIEW SECTION (HOLOGRAPHIC) */}
      <div className="flex justify-center py-4">
        <div className="w-full max-w-[500px]">
          <HolographicCard>
            {/* Banner Background with Scanlines */}
            <div
              className="relative h-40 overflow-hidden"
              style={{
                background: activeBanner?.banner_url
                  ? `url(${activeBanner.banner_url}) center/cover`
                  : `linear-gradient(135deg, ${activeBanner?.gradient_start || "#0a0a12"}, ${activeBanner?.gradient_end || "#1a1a2e"})`,
              }}
            >
              {/* Scanlines Effect */}
              <div
                className="absolute inset-0 z-10 opacity-30 pointer-events-none"
                style={{
                  backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, #000 3px)",
                  backgroundSize: "100% 4px",
                }}
              />

              {/* Overlay Gradients */}
              <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent z-20" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-cyber-shimmer z-20" />

              {/* HUD Elements */}
              <div className="absolute top-3 left-3 px-2 py-0.5 bg-black/50 backdrop-blur-md border border-white/10 rounded text-[10px] text-white/70 font-mono tracking-widest z-30">
                ID-ENTITY // {pact?.name || "INITIATE"}
              </div>
            </div>

            {/* Profile Content */}
            <div className="relative px-6 pb-6 bg-card/95 backdrop-blur-xl">
              <div className="flex flex-col items-center -mt-16 relative z-30">
                {/* Avatar */}
                <div className="relative group cursor-pointer" onClick={() => setShowAvatarDialog(true)}>
                  <AvatarFrame
                    avatarUrl={avatarUrl}
                    fallback={displayName?.[0] || "?"}
                    size="2xl"
                    frameImage={activeFrame?.preview_url}
                    borderColor={activeFrame?.border_color || "#5bb4ff"}
                    glowColor={activeFrame?.glow_color || "rgba(91,180,255,0.5)"}
                    frameScale={activeFrame?.frame_scale}
                    frameOffsetX={activeFrame?.frame_offset_x}
                    frameOffsetY={activeFrame?.frame_offset_y}
                    className="transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-full z-40 backdrop-blur-sm">
                    <Upload className="w-6 h-6 text-white" />
                  </div>
                </div>

                {/* Name & Title */}
                <div className="mt-4 text-center space-y-1">
                  <h3 className="text-2xl font-orbitron font-bold text-white tracking-widest">
                    <CyberText text={displayName || "UNKNOWN USER"} />
                  </h3>

                  <div
                    className="inline-flex items-center px-3 py-1 rounded-sm border backdrop-blur-md"
                    style={{
                      borderColor: activeTitle?.text_color ? `${activeTitle.text_color}40` : "#ffffff20",
                      background: `linear-gradient(90deg, ${activeTitle?.text_color || "#5bb4ff"}10, transparent)`,
                    }}
                  >
                    <Crown className="w-3 h-3 mr-2" style={{ color: activeTitle?.text_color || "#5bb4ff" }} />
                    <span
                      className="text-xs font-rajdhani uppercase tracking-widest font-semibold"
                      style={{
                        color: activeTitle?.text_color || "#5bb4ff",
                        textShadow: `0 0 10px ${activeTitle?.glow_color || "rgba(91,180,255,0.5)"}`,
                      }}
                    >
                      {activeTitle?.title_text || "NO TITLE"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats / Rank Footer */}
              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] text-white/40 uppercase tracking-wider font-mono">Current Rank</span>
                  <div className="flex items-center gap-2 text-primary font-rajdhani">
                    <Shield className="w-4 h-4" />
                    {rankData?.currentRank?.name || "Unranked"}
                  </div>
                </div>

                {rankData?.currentRank && (
                  <RankBadge
                    rank={rankData.currentRank}
                    currentXP={rankData.currentXP}
                    nextRankMinXP={rankData.nextRank?.min_points}
                    size="sm"
                  />
                )}
              </div>
            </div>
          </HolographicCard>
        </div>
      </div>

      {/* 2. ARMORY (CUSTOMIZATION) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Frame Selector Trigger */}
        <CustomizationTrigger
          icon={<Sparkles className="w-5 h-5" />}
          label="Avatar Frame"
          value={activeFrame?.name}
          onClick={() => setShowFrameDialog(true)}
        />

        {/* Banner Selector Trigger */}
        <CustomizationTrigger
          icon={<ImageIcon className="w-5 h-5" />}
          label="Profile Banner"
          value={activeBanner?.name}
          onClick={() => setShowBannerDialog(true)}
        />

        {/* Title Selector Trigger */}
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

      {/* --- DIALOGS --- */}

      {/* Avatar Dialog */}
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

      {/* Frame Selection Dialog (Inventory Style) */}
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

      {/* Banner Selection Dialog */}
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

      {/* Title Selection Dialog */}
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

// --- HELPER COMPONENTS ---

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
      {/* Corner Accents */}
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
      {/* Tech Corners */}
      <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-white/20" />
      <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-white/20" />

      {children}

      {/* Status Indicators */}
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
