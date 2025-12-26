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
import { 
  Upload,
  Link as LinkIcon,
  ImageIcon,
  Crown,
  Sparkles,
  Lock,
  Check,
  Save,
  Loader2
} from "lucide-react";

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

const rarityColors: Record<string, { bg: string; text: string; glow: string }> = {
  common: { bg: "bg-slate-500/20", text: "text-slate-400", glow: "" },
  rare: { bg: "bg-blue-500/20", text: "text-blue-400", glow: "shadow-[0_0_10px_rgba(59,130,246,0.3)]" },
  epic: { bg: "bg-purple-500/20", text: "text-purple-400", glow: "shadow-[0_0_10px_rgba(168,85,247,0.3)]" },
  legendary: { bg: "bg-amber-500/20", text: "text-amber-400", glow: "shadow-[0_0_15px_rgba(245,158,11,0.4)]" },
};

export function ProfileBoundedProfile({
  userId,
  displayName,
  avatarUrl,
  onAvatarUrlChange,
}: ProfileBoundedProfileProps) {
  const { toast } = useToast();
  const { data: pact } = usePact(userId);
  const { data: rankData } = useRankXP(userId, pact?.id);
  const [saving, setSaving] = useState(false);
  const [avatarUrlInput, setAvatarUrlInput] = useState("");
  const [showAvatarDialog, setShowAvatarDialog] = useState(false);
  const [showFrameDialog, setShowFrameDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showBannerDialog, setShowBannerDialog] = useState(false);
  const [showTitleDialog, setShowTitleDialog] = useState(false);

  // Cosmetics data
  const [frames, setFrames] = useState<CosmeticFrame[]>([]);
  const [banners, setBanners] = useState<CosmeticBanner[]>([]);
  const [titles, setTitles] = useState<CosmeticTitle[]>([]);
  
  // Owned cosmetics
  const [ownedFrameIds, setOwnedFrameIds] = useState<Set<string>>(new Set());
  const [ownedBannerIds, setOwnedBannerIds] = useState<Set<string>>(new Set());
  const [ownedTitleIds, setOwnedTitleIds] = useState<Set<string>>(new Set());
  
  // Active selections
  const [activeFrameId, setActiveFrameId] = useState<string | null>(null);
  const [activeBannerId, setActiveBannerId] = useState<string | null>(null);
  const [activeTitleId, setActiveTitleId] = useState<string | null>(null);

  // Derived active cosmetics
  const activeFrame = frames.find(f => f.id === activeFrameId) || frames.find(f => f.is_default);
  const activeBanner = banners.find(b => b.id === activeBannerId) || banners.find(b => b.is_default);
  const activeTitle = titles.find(t => t.id === activeTitleId) || titles.find(t => t.is_default);

  // Load cosmetics and ownership
  useEffect(() => {
    const loadData = async () => {
      // Load all cosmetics
      const [framesRes, bannersRes, titlesRes] = await Promise.all([
        supabase.from("cosmetic_frames").select("*").eq("is_active", true),
        supabase.from("cosmetic_banners").select("*").eq("is_active", true),
        supabase.from("cosmetic_titles").select("*").eq("is_active", true),
      ]);

      if (framesRes.data) setFrames(framesRes.data);
      if (bannersRes.data) setBanners(bannersRes.data);
      if (titlesRes.data) setTitles(titlesRes.data);

      // Load user ownership
      const { data: ownership } = await supabase
        .from("user_cosmetics")
        .select("cosmetic_type, cosmetic_id")
        .eq("user_id", userId);

      if (ownership) {
        const frameIds = new Set(ownership.filter(o => o.cosmetic_type === "frame").map(o => o.cosmetic_id));
        const bannerIds = new Set(ownership.filter(o => o.cosmetic_type === "banner").map(o => o.cosmetic_id));
        const titleIds = new Set(ownership.filter(o => o.cosmetic_type === "title").map(o => o.cosmetic_id));
        setOwnedFrameIds(frameIds);
        setOwnedBannerIds(bannerIds);
        setOwnedTitleIds(titleIds);
      }

      // Load active selections from profile
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

  const handleSaveAvatar = async () => {
    if (avatarUrlInput.trim()) {
      const newUrl = avatarUrlInput.trim();
      // Add cache-busting for URL-based avatars too
      const urlWithCacheBust = newUrl.includes('?') 
        ? `${newUrl}&t=${Date.now()}` 
        : `${newUrl}?t=${Date.now()}`;
      
      onAvatarUrlChange(urlWithCacheBust);
      
      // Save to profile immediately
      await supabase
        .from("profiles")
        .update({ avatar_url: newUrl })
        .eq("id", userId);
      
      toast({
        title: "Avatar updated",
        description: "Your profile image has been saved",
      });
    }
    setShowAvatarDialog(false);
    setAvatarUrlInput("");
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPG, PNG, or WEBP image",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image under 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar-${Date.now()}.${fileExt}`;
      // Use userId as folder name to match RLS policy: (auth.uid())::text = (storage.foldername(name))[1]
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('goal-images')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Use signed URL since bucket is private (expires in 1 year)
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('goal-images')
        .createSignedUrl(filePath, 60 * 60 * 24 * 365);

      if (signedUrlError) throw signedUrlError;

      // Add cache-busting parameter to force preview refresh
      const avatarUrlWithCacheBust = `${signedUrlData.signedUrl}&t=${Date.now()}`;
      
      onAvatarUrlChange(avatarUrlWithCacheBust);
      setShowAvatarDialog(false);
      
      // Also save to profile immediately
      await supabase
        .from("profiles")
        .update({ avatar_url: signedUrlData.signedUrl })
        .eq("id", userId);
      
      toast({
        title: "Avatar uploaded",
        description: "Your profile image has been updated",
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSelectFrame = (frame: CosmeticFrame) => {
    if (ownedFrameIds.has(frame.id) || frame.is_default) {
      setActiveFrameId(frame.id);
    }
  };

  const handleSelectBanner = (banner: CosmeticBanner) => {
    if (ownedBannerIds.has(banner.id) || banner.is_default) {
      setActiveBannerId(banner.id);
    }
  };

  const handleSelectTitle = (title: CosmeticTitle) => {
    if (ownedTitleIds.has(title.id) || title.is_default) {
      setActiveTitleId(title.id);
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
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Identity Saved",
        description: "Your bounded profile has been updated",
      });
    }

    setSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Identity Card Preview */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl blur-sm opacity-50" />
        <div className="relative rounded-2xl overflow-hidden border border-primary/20 bg-[#0a1525]/80 shadow-[0_0_30px_rgba(91,180,255,0.15)]">
          {/* Banner Background */}
          <div 
            className="relative h-32 overflow-hidden"
            style={{
              background: activeBanner?.banner_url 
                ? `url(${activeBanner.banner_url}) center/cover`
                : `linear-gradient(135deg, ${activeBanner?.gradient_start || '#0a0a12'}, ${activeBanner?.gradient_end || '#1a1a2e'})`
            }}
          >
            {/* Banner overlay effects */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a1525] via-transparent to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-cyber-shimmer" />
            
            {/* Scan lines */}
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(91,180,255,0.1) 2px, rgba(91,180,255,0.1) 4px)',
            }} />

            {/* Corner brackets */}
            <div className="absolute top-2 left-2 w-6 h-6 border-l-2 border-t-2 border-primary/50" />
            <div className="absolute top-2 right-2 w-6 h-6 border-r-2 border-t-2 border-primary/50" />
          </div>

          {/* Main Card Content */}
          <div className="relative px-6 pb-6 pt-2 bg-gradient-to-b from-[#0a1525]/95 to-[#0a1525]">
            {/* Left side: Avatar with Frame - positioned to overlap banner */}
            <div className="flex items-start gap-6">
              {/* Avatar with Frame - using layered AvatarFrame component */}
              <div className="relative -mt-16 flex-shrink-0">
                <AvatarFrame
                  avatarUrl={avatarUrl}
                  fallback={displayName || "?"}
                  size="xl"
                  frameImage={activeFrame?.preview_url}
                  borderColor={activeFrame?.border_color || '#5bb4ff'}
                  glowColor={activeFrame?.glow_color || 'rgba(91,180,255,0.5)'}
                  frameScale={activeFrame?.frame_scale}
                  frameOffsetX={activeFrame?.frame_offset_x}
                  frameOffsetY={activeFrame?.frame_offset_y}
                />
              </div>

              {/* Right side: Name & Title */}
              <div className="flex-1 pt-2 min-w-0">
                {/* Display Name */}
                <h3 className="text-xl font-orbitron text-primary tracking-wider truncate drop-shadow-[0_0_10px_rgba(91,180,255,0.5)]">
                  {displayName || "UNKNOWN"}
                </h3>
                
                {/* Title */}
                <div 
                  className="inline-block mt-2 px-3 py-1 rounded-md text-sm font-rajdhani tracking-wide"
                  style={{
                    color: activeTitle?.text_color || '#5bb4ff',
                    textShadow: `0 0 10px ${activeTitle?.glow_color || 'rgba(91,180,255,0.5)'}`,
                    background: `linear-gradient(135deg, ${activeTitle?.text_color || '#5bb4ff'}15, transparent)`,
                    border: `1px solid ${activeTitle?.text_color || '#5bb4ff'}30`
                  }}
                >
                  <Crown className="inline-block h-3 w-3 mr-1.5 -mt-0.5" />
                  {activeTitle?.title_text || "Pact Member"}
                </div>

                {/* Frame & Banner names */}
                <div className="flex gap-3 mt-3 text-xs text-primary/50 font-rajdhani">
                  <span className="flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    {activeFrame?.name || "Default"} Frame
                  </span>
                  <span className="flex items-center gap-1">
                    <ImageIcon className="h-3 w-3" />
                    {activeBanner?.name || "Default"} Banner
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom corner brackets */}
            <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-primary/30" />
            <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-primary/30" />
            
            {/* Rank Badge - bottom right */}
            {rankData?.currentRank && (
              <div className="absolute bottom-3 right-3">
                <RankBadge 
                  rank={rankData.currentRank}
                  currentXP={rankData.currentXP}
                  nextRankMinXP={rankData.nextRank?.min_points}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Customization Controls */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl blur-sm opacity-50" />
        <div className="relative bg-[#0a1525]/80 border border-primary/20 rounded-xl p-6">
          <h3 className="text-lg font-orbitron text-primary mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary drop-shadow-[0_0_8px_rgba(91,180,255,0.5)]" />
            Customize Identity
          </h3>
          
          <div className="grid grid-cols-2 gap-3">
            {/* Edit Avatar */}
            <Dialog open={showAvatarDialog} onOpenChange={setShowAvatarDialog}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="h-auto py-3 flex flex-col items-center gap-1 bg-[#0a1525]/50 border-primary/30 hover:border-primary/50 hover:bg-primary/10 text-primary"
                >
                  <Upload className="h-4 w-4" />
                  <span className="text-xs font-rajdhani">Edit Avatar</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#0a1525] border-primary/30">
                <DialogHeader>
                  <DialogTitle className="text-primary font-orbitron">Set Avatar</DialogTitle>
                </DialogHeader>
                <Tabs defaultValue="upload" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-[#0d1a2d]/90 border border-primary/20">
                    <TabsTrigger 
                      value="upload" 
                      className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-rajdhani"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload
                    </TabsTrigger>
                    <TabsTrigger 
                      value="url" 
                      className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-rajdhani"
                    >
                      <LinkIcon className="h-4 w-4 mr-2" />
                      URL
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="upload" className="space-y-4 mt-4">
                    <div className="space-y-3">
                      <Label className="text-primary/80 font-rajdhani">
                        Upload Image (JPG, PNG, WEBP)
                      </Label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <Button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="w-full h-24 bg-[#0d1a2d]/90 border-2 border-dashed border-primary/30 hover:border-primary/50 hover:bg-primary/10 text-primary font-rajdhani flex flex-col gap-2"
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="h-6 w-6 animate-spin" />
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="h-6 w-6" />
                            <span>Click to select image</span>
                            <span className="text-xs text-primary/50">Max 5MB</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="url" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label className="text-primary/80 font-rajdhani flex items-center gap-2">
                        <LinkIcon className="h-4 w-4" />
                        Image URL
                      </Label>
                      <Input
                        placeholder="https://example.com/avatar.png"
                        value={avatarUrlInput}
                        onChange={(e) => setAvatarUrlInput(e.target.value)}
                        className="bg-[#0d1a2d]/90 border-primary/30 text-primary"
                      />
                    </div>
                    <Button 
                      onClick={handleSaveAvatar}
                      className="w-full bg-primary/20 border border-primary/30 hover:bg-primary/30 text-primary font-orbitron"
                    >
                      Save Avatar
                    </Button>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>

            {/* Select Frame */}
            <Dialog open={showFrameDialog} onOpenChange={setShowFrameDialog}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="h-auto py-3 flex flex-col items-center gap-1 bg-[#0a1525]/50 border-primary/30 hover:border-primary/50 hover:bg-primary/10 text-primary"
                >
                  <Sparkles className="h-4 w-4" />
                  <span className="text-xs font-rajdhani">Select Frame</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#0a1525] border-primary/30 max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-primary font-orbitron">Avatar Frames</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2">
                  {frames.map((frame) => {
                    const owned = ownedFrameIds.has(frame.id) || frame.is_default;
                    const active = activeFrameId === frame.id || (!activeFrameId && frame.is_default);
                    const rarity = rarityColors[frame.rarity] || rarityColors.common;
                    
                    return (
                      <button
                        key={frame.id}
                        onClick={() => handleSelectFrame(frame)}
                        disabled={!owned}
                        className={`relative p-4 rounded-xl border-2 transition-all ${
                          active 
                            ? "border-primary bg-primary/10" 
                            : owned 
                              ? "border-primary/30 hover:border-primary/50 bg-[#0a1525]/50" 
                              : "border-primary/10 bg-[#0a1525]/30 opacity-60"
                        }`}
                      >
                        {/* Frame preview using proper component */}
                        <div className="flex justify-center mb-2">
                          <FramePreview
                            size="sm"
                            frameImage={frame.preview_url}
                            borderColor={frame.border_color}
                            glowColor={frame.glow_color}
                          />
                        </div>
                        <div className="text-xs font-rajdhani text-primary">{frame.name}</div>
                        <div className={`text-[10px] uppercase ${rarity.text} mt-1`}>{frame.rarity}</div>
                        
                        {/* Lock or check indicator */}
                        {!owned && (
                          <div className="absolute top-2 right-2">
                            <Lock className="h-3 w-3 text-primary/40" />
                          </div>
                        )}
                        {active && owned && (
                          <div className="absolute top-2 right-2">
                            <Check className="h-4 w-4 text-green-400" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </DialogContent>
            </Dialog>

            {/* Select Banner */}
            <Dialog open={showBannerDialog} onOpenChange={setShowBannerDialog}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="h-auto py-3 flex flex-col items-center gap-1 bg-[#0a1525]/50 border-primary/30 hover:border-primary/50 hover:bg-primary/10 text-primary"
                >
                  <ImageIcon className="h-4 w-4" />
                  <span className="text-xs font-rajdhani">Select Banner</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#0a1525] border-primary/30 max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-primary font-orbitron">Profile Banners</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2">
                  {banners.map((banner) => {
                    const owned = ownedBannerIds.has(banner.id) || banner.is_default;
                    const active = activeBannerId === banner.id || (!activeBannerId && banner.is_default);
                    const rarity = rarityColors[banner.rarity] || rarityColors.common;
                    
                    return (
                      <button
                        key={banner.id}
                        onClick={() => handleSelectBanner(banner)}
                        disabled={!owned}
                        className={`relative p-3 rounded-xl border-2 transition-all ${
                          active 
                            ? "border-primary bg-primary/10" 
                            : owned 
                              ? "border-primary/30 hover:border-primary/50 bg-[#0a1525]/50" 
                              : "border-primary/10 bg-[#0a1525]/30 opacity-60"
                        }`}
                      >
                        {/* Banner preview */}
                        <div 
                          className="h-12 rounded-lg mb-2"
                          style={{
                            background: banner.banner_url 
                              ? `url(${banner.banner_url}) center/cover`
                              : `linear-gradient(135deg, ${banner.gradient_start}, ${banner.gradient_end})`
                          }}
                        />
                        <div className="text-xs font-rajdhani text-primary">{banner.name}</div>
                        <div className={`text-[10px] uppercase ${rarity.text} mt-1`}>{banner.rarity}</div>
                        
                        {/* Lock or check indicator */}
                        {!owned && (
                          <div className="absolute top-2 right-2">
                            <Lock className="h-3 w-3 text-primary/40" />
                          </div>
                        )}
                        {active && owned && (
                          <div className="absolute top-2 right-2">
                            <Check className="h-4 w-4 text-green-400" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </DialogContent>
            </Dialog>

            {/* Select Title */}
            <Dialog open={showTitleDialog} onOpenChange={setShowTitleDialog}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="h-auto py-3 flex flex-col items-center gap-1 bg-[#0a1525]/50 border-primary/30 hover:border-primary/50 hover:bg-primary/10 text-primary"
                >
                  <Crown className="h-4 w-4" />
                  <span className="text-xs font-rajdhani">Select Title</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#0a1525] border-primary/30 max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-primary font-orbitron">Profile Titles</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2">
                  {titles.map((title) => {
                    const owned = ownedTitleIds.has(title.id) || title.is_default;
                    const active = activeTitleId === title.id || (!activeTitleId && title.is_default);
                    const rarity = rarityColors[title.rarity] || rarityColors.common;
                    
                    return (
                      <button
                        key={title.id}
                        onClick={() => handleSelectTitle(title)}
                        disabled={!owned}
                        className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                          active 
                            ? "border-primary bg-primary/10" 
                            : owned 
                              ? "border-primary/30 hover:border-primary/50 bg-[#0a1525]/50" 
                              : "border-primary/10 bg-[#0a1525]/30 opacity-60"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div 
                              className="text-sm font-rajdhani"
                              style={{
                                color: title.text_color || '#5bb4ff',
                                textShadow: `0 0 8px ${title.glow_color || 'rgba(91,180,255,0.5)'}`
                              }}
                            >
                              <Crown className="inline-block h-3 w-3 mr-1.5" />
                              {title.title_text}
                            </div>
                            <div className={`text-[10px] uppercase ${rarity.text} mt-1`}>{title.rarity}</div>
                          </div>
                          
                          {/* Lock or check indicator */}
                          {!owned && <Lock className="h-4 w-4 text-primary/40" />}
                          {active && owned && <Check className="h-4 w-4 text-green-400" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-primary/20 border-2 border-primary/30 hover:border-primary/50 hover:bg-primary/30 text-primary font-orbitron uppercase tracking-wider"
      >
        <Save className="mr-2 h-4 w-4" />
        {saving ? "SAVING..." : "SAVE CHANGES"}
      </Button>
    </div>
  );
}