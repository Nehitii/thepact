import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Shield, 
  Sparkles, 
  Crown, 
  Palette,
  Frame,
  Image,
  Plus, 
  Pencil, 
  ArrowLeft,
  Trash2,
  Link as LinkIcon,
  ZoomIn,
  ZoomOut,
  Move,
  RotateCcw,
  Crosshair
} from "lucide-react";

interface CosmeticFrame {
  id: string;
  name: string;
  rarity: string;
  preview_url: string | null;
  border_color: string;
  glow_color: string;
  is_active: boolean;
  is_default: boolean;
  price: number;
  frame_scale?: number;
  frame_offset_x?: number;
  frame_offset_y?: number;
}

interface CosmeticBanner {
  id: string;
  name: string;
  rarity: string;
  preview_url: string | null;
  banner_url: string | null;
  gradient_start: string;
  gradient_end: string;
  is_active: boolean;
  is_default: boolean;
  price: number;
}

interface CosmeticTitle {
  id: string;
  title_text: string;
  rarity: string;
  glow_color: string;
  text_color: string;
  is_active: boolean;
  is_default: boolean;
  price: number;
}

type CreationMode = "classic" | "image";

export default function AdminCosmeticsManager() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [frames, setFrames] = useState<CosmeticFrame[]>([]);
  const [banners, setBanners] = useState<CosmeticBanner[]>([]);
  const [titles, setTitles] = useState<CosmeticTitle[]>([]);

  const [editingFrame, setEditingFrame] = useState<Partial<CosmeticFrame> | null>(null);
  const [editingBanner, setEditingBanner] = useState<Partial<CosmeticBanner> | null>(null);
  const [editingTitle, setEditingTitle] = useState<Partial<CosmeticTitle> | null>(null);
  
  const [frameCreationMode, setFrameCreationMode] = useState<CreationMode>("classic");
  const [bannerCreationMode, setBannerCreationMode] = useState<CreationMode>("classic");

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!data) {
        toast({
          title: "Access Denied",
          description: "You need admin privileges to access this page",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      setIsAdmin(true);
      setLoading(false);
      loadAllCosmetics();
    };

    checkAdmin();
  }, [user, navigate, toast]);

  const loadAllCosmetics = async () => {
    const [framesRes, bannersRes, titlesRes] = await Promise.all([
      supabase.from("cosmetic_frames").select("*").order("created_at"),
      supabase.from("cosmetic_banners").select("*").order("created_at"),
      supabase.from("cosmetic_titles").select("*").order("created_at"),
    ]);

    if (framesRes.data) setFrames(framesRes.data);
    if (bannersRes.data) setBanners(bannersRes.data);
    if (titlesRes.data) setTitles(titlesRes.data);
  };

  // Frame CRUD
  const saveFrame = async () => {
    if (!editingFrame?.name) return;

    const frameData = {
      name: editingFrame.name,
      rarity: editingFrame.rarity || "common",
      preview_url: editingFrame.preview_url || null,
      border_color: editingFrame.border_color || "#5bb4ff",
      glow_color: editingFrame.glow_color || "rgba(91,180,255,0.5)",
      is_active: editingFrame.is_active ?? true,
      is_default: editingFrame.is_default ?? false,
      price: editingFrame.price || 450,
      frame_scale: editingFrame.frame_scale ?? 1.0,
      frame_offset_x: editingFrame.frame_offset_x ?? 0,
      frame_offset_y: editingFrame.frame_offset_y ?? 0,
    };

    if (editingFrame.id) {
      await supabase.from("cosmetic_frames").update(frameData).eq("id", editingFrame.id);
    } else {
      await supabase.from("cosmetic_frames").insert(frameData);
    }

    toast({ title: "Frame saved!" });
    setEditingFrame(null);
    loadAllCosmetics();
  };

  const deleteFrame = async (id: string) => {
    await supabase.from("cosmetic_frames").delete().eq("id", id);
    toast({ title: "Frame deleted" });
    loadAllCosmetics();
  };

  // Banner CRUD
  const saveBanner = async () => {
    if (!editingBanner?.name) return;

    const bannerData = {
      name: editingBanner.name,
      rarity: editingBanner.rarity || "common",
      preview_url: editingBanner.preview_url || null,
      banner_url: bannerCreationMode === "image" ? editingBanner.banner_url : null,
      gradient_start: bannerCreationMode === "classic" ? (editingBanner.gradient_start || "#0a0a12") : null,
      gradient_end: bannerCreationMode === "classic" ? (editingBanner.gradient_end || "#1a1a2e") : null,
      is_active: editingBanner.is_active ?? true,
      is_default: editingBanner.is_default ?? false,
      price: editingBanner.price || 650,
    };

    if (editingBanner.id) {
      await supabase.from("cosmetic_banners").update(bannerData).eq("id", editingBanner.id);
    } else {
      await supabase.from("cosmetic_banners").insert(bannerData);
    }

    toast({ title: "Banner saved!" });
    setEditingBanner(null);
    loadAllCosmetics();
  };

  const deleteBanner = async (id: string) => {
    await supabase.from("cosmetic_banners").delete().eq("id", id);
    toast({ title: "Banner deleted" });
    loadAllCosmetics();
  };

  // Title CRUD
  const saveTitle = async () => {
    if (!editingTitle?.title_text) return;

    const titleData = {
      title_text: editingTitle.title_text,
      rarity: editingTitle.rarity || "common",
      glow_color: editingTitle.glow_color || "rgba(91,180,255,0.5)",
      text_color: editingTitle.text_color || "#5bb4ff",
      is_active: editingTitle.is_active ?? true,
      is_default: editingTitle.is_default ?? false,
      price: editingTitle.price || 450,
    };

    if (editingTitle.id) {
      await supabase.from("cosmetic_titles").update(titleData).eq("id", editingTitle.id);
    } else {
      await supabase.from("cosmetic_titles").insert(titleData);
    }

    toast({ title: "Title saved!" });
    setEditingTitle(null);
    loadAllCosmetics();
  };

  const deleteTitle = async (id: string) => {
    await supabase.from("cosmetic_titles").delete().eq("id", id);
    toast({ title: "Title deleted" });
    loadAllCosmetics();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#00050B] flex items-center justify-center">
        <div className="text-primary animate-pulse font-orbitron">Verifying access...</div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-[#00050B] relative">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-4xl mx-auto p-6 relative z-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin")}
            className="text-primary hover:bg-primary/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-orbitron text-primary flex items-center gap-2">
              <Palette className="h-6 w-6" />
              Cosmetics Manager
            </h1>
            <p className="text-sm text-primary/60 font-rajdhani">Manage frames, banners, and titles</p>
          </div>
        </div>

        <Tabs defaultValue="frames" className="space-y-6">
          <TabsList className="bg-card/50 border border-primary/30">
            <TabsTrigger value="frames" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              <Frame className="h-4 w-4 mr-2" />
              Frames
            </TabsTrigger>
            <TabsTrigger value="banners" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              <Image className="h-4 w-4 mr-2" />
              Banners
            </TabsTrigger>
            <TabsTrigger value="titles" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              <Crown className="h-4 w-4 mr-2" />
              Titles
            </TabsTrigger>
          </TabsList>

          {/* Frames Tab */}
          <TabsContent value="frames" className="space-y-4">
            <Dialog open={!!editingFrame} onOpenChange={(open) => !open && setEditingFrame(null)}>
              <DialogTrigger asChild>
                <Button 
                  onClick={() => { setEditingFrame({}); setFrameCreationMode("classic"); }}
                  className="bg-primary/20 border border-primary/30 hover:bg-primary/30 text-primary"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Frame
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-primary/30 max-w-lg">
                <DialogHeader>
                  <DialogTitle className="text-primary font-orbitron">
                    {editingFrame?.id ? "Edit Frame" : "Add Frame"}
                  </DialogTitle>
                </DialogHeader>
                
                {/* Creation Mode Toggle */}
                {!editingFrame?.id && (
                  <div className="flex gap-2 p-1 rounded-lg bg-card/50 border border-primary/20">
                    <button
                      onClick={() => setFrameCreationMode("classic")}
                      className={`flex-1 py-2 px-4 rounded-md text-sm font-rajdhani transition-all ${
                        frameCreationMode === "classic" 
                          ? "bg-primary/20 text-primary" 
                          : "text-muted-foreground hover:text-primary"
                      }`}
                    >
                      <Sparkles className="h-4 w-4 inline mr-2" />
                      Classic
                    </button>
                    <button
                      onClick={() => setFrameCreationMode("image")}
                      className={`flex-1 py-2 px-4 rounded-md text-sm font-rajdhani transition-all ${
                        frameCreationMode === "image" 
                          ? "bg-primary/20 text-primary" 
                          : "text-muted-foreground hover:text-primary"
                      }`}
                    >
                      <LinkIcon className="h-4 w-4 inline mr-2" />
                      Pre-made Image
                    </button>
                  </div>
                )}

                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                  <div>
                    <Label className="text-primary/80">Name</Label>
                    <Input
                      value={editingFrame?.name || ""}
                      onChange={(e) => setEditingFrame({ ...editingFrame, name: e.target.value })}
                      className="bg-card/50 border-primary/30 text-primary"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-primary/80">Rarity</Label>
                    <Select
                      value={editingFrame?.rarity || "common"}
                      onValueChange={(v) => setEditingFrame({ ...editingFrame, rarity: v })}
                    >
                      <SelectTrigger className="bg-card/50 border-primary/30 text-primary">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="common">Common</SelectItem>
                        <SelectItem value="rare">Rare</SelectItem>
                        <SelectItem value="epic">Epic</SelectItem>
                        <SelectItem value="legendary">Legendary</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {frameCreationMode === "image" ? (
                    <>
                      <div>
                        <Label className="text-primary/80">Frame Image URL</Label>
                        <Input
                          placeholder="https://example.com/frame.png"
                          value={editingFrame?.preview_url || ""}
                          onChange={(e) => setEditingFrame({ ...editingFrame, preview_url: e.target.value })}
                          className="bg-card/50 border-primary/30 text-primary"
                        />
                      </div>
                      
                      {/* Frame Alignment Tool - only show for image frames */}
                      {editingFrame?.preview_url && (
                        <div className="space-y-4 p-4 rounded-xl bg-primary/5 border border-primary/20">
                          <div className="flex items-center justify-between">
                            <Label className="text-primary font-orbitron text-xs uppercase tracking-wider flex items-center gap-2">
                              <Move className="h-4 w-4" />
                              Frame Alignment Tool
                            </Label>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingFrame({
                                ...editingFrame,
                                frame_scale: 1.0,
                                frame_offset_x: 0,
                                frame_offset_y: 0,
                              })}
                              className="text-xs text-primary/60 hover:text-primary"
                            >
                              <RotateCcw className="h-3 w-3 mr-1" />
                              Reset
                            </Button>
                          </div>
                          
                          {/* Live Preview */}
                          <div className="flex justify-center">
                            <div className="relative w-24 h-24 flex items-center justify-center">
                              {/* Glow effect */}
                              <div 
                                className="absolute inset-0 rounded-full blur-md opacity-60"
                                style={{ backgroundColor: editingFrame.glow_color || "rgba(91,180,255,0.5)" }}
                              />
                              {/* Sample avatar */}
                              <div className="absolute inset-[15%] rounded-full bg-card/50 z-10 flex items-center justify-center">
                                <span className="text-primary/40 font-orbitron text-xl">A</span>
                              </div>
                              {/* Frame overlay with alignment applied */}
                              <img
                                src={editingFrame.preview_url}
                                alt="Frame preview"
                                className="absolute inset-0 w-full h-full object-contain z-20"
                                style={{
                                  transform: `scale(${editingFrame.frame_scale ?? 1}) translate(${editingFrame.frame_offset_x ?? 0}px, ${editingFrame.frame_offset_y ?? 0}px)`,
                                }}
                              />
                            </div>
                          </div>
                          
                          {/* Scale Control */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs text-primary/60">
                              <span className="flex items-center gap-1">
                                <ZoomIn className="h-3 w-3" />
                                Scale
                              </span>
                              <span>{((editingFrame.frame_scale ?? 1) * 100).toFixed(0)}%</span>
                            </div>
                            <input
                              type="range"
                              min="0.5"
                              max="2"
                              step="0.05"
                              value={editingFrame.frame_scale ?? 1}
                              onChange={(e) => setEditingFrame({
                                ...editingFrame,
                                frame_scale: parseFloat(e.target.value),
                              })}
                              className="w-full accent-primary"
                            />
                          </div>
                          
                          {/* X/Y Offset Controls */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label className="text-xs text-primary/60">X Offset</Label>
                              <div className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => setEditingFrame({
                                    ...editingFrame,
                                    frame_offset_x: (editingFrame.frame_offset_x ?? 0) - 1,
                                  })}
                                  className="h-6 w-6 text-primary/60 hover:text-primary"
                                >
                                  -
                                </Button>
                                <Input
                                  type="number"
                                  value={editingFrame.frame_offset_x ?? 0}
                                  onChange={(e) => setEditingFrame({
                                    ...editingFrame,
                                    frame_offset_x: parseFloat(e.target.value) || 0,
                                  })}
                                  className="bg-card/50 border-primary/30 text-primary text-center h-8 text-xs"
                                />
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => setEditingFrame({
                                    ...editingFrame,
                                    frame_offset_x: (editingFrame.frame_offset_x ?? 0) + 1,
                                  })}
                                  className="h-6 w-6 text-primary/60 hover:text-primary"
                                >
                                  +
                                </Button>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs text-primary/60">Y Offset</Label>
                              <div className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => setEditingFrame({
                                    ...editingFrame,
                                    frame_offset_y: (editingFrame.frame_offset_y ?? 0) - 1,
                                  })}
                                  className="h-6 w-6 text-primary/60 hover:text-primary"
                                >
                                  -
                                </Button>
                                <Input
                                  type="number"
                                  value={editingFrame.frame_offset_y ?? 0}
                                  onChange={(e) => setEditingFrame({
                                    ...editingFrame,
                                    frame_offset_y: parseFloat(e.target.value) || 0,
                                  })}
                                  className="bg-card/50 border-primary/30 text-primary text-center h-8 text-xs"
                                />
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => setEditingFrame({
                                    ...editingFrame,
                                    frame_offset_y: (editingFrame.frame_offset_y ?? 0) + 1,
                                  })}
                                  className="h-6 w-6 text-primary/60 hover:text-primary"
                                >
                                  +
                                </Button>
                              </div>
                            </div>
                          </div>
                          
                          {/* Snap to Center */}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingFrame({
                              ...editingFrame,
                              frame_offset_x: 0,
                              frame_offset_y: 0,
                            })}
                            className="w-full text-xs text-primary/60 hover:text-primary border border-primary/20 hover:border-primary/40"
                          >
                            <Crosshair className="h-3 w-3 mr-2" />
                            Snap to Center
                          </Button>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div>
                        <Label className="text-primary/80">Border Color (hex)</Label>
                        <Input
                          value={editingFrame?.border_color || "#5bb4ff"}
                          onChange={(e) => setEditingFrame({ ...editingFrame, border_color: e.target.value })}
                          className="bg-card/50 border-primary/30 text-primary"
                        />
                      </div>
                      <div>
                        <Label className="text-primary/80">Glow Color (rgba)</Label>
                        <Input
                          value={editingFrame?.glow_color || "rgba(91,180,255,0.5)"}
                          onChange={(e) => setEditingFrame({ ...editingFrame, glow_color: e.target.value })}
                          className="bg-card/50 border-primary/30 text-primary"
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <Label className="text-primary/80">Price (Bonds)</Label>
                    <Input
                      type="number"
                      value={editingFrame?.price || 450}
                      onChange={(e) => setEditingFrame({ ...editingFrame, price: parseInt(e.target.value) })}
                      className="bg-card/50 border-primary/30 text-primary"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label className="text-primary/80">Active (visible in Shop)</Label>
                    <Switch
                      checked={editingFrame?.is_active ?? true}
                      onCheckedChange={(c) => setEditingFrame({ ...editingFrame, is_active: c })}
                    />
                  </div>
                  
                  <Button onClick={saveFrame} className="w-full bg-primary/20 border border-primary/30 hover:bg-primary/30 text-primary">
                    Save Frame
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <div className="grid gap-3">
              {frames.map((frame) => (
                <div key={frame.id} className="flex items-center justify-between p-4 rounded-xl bg-card/50 border border-primary/20">
                  <div className="flex items-center gap-4">
                    {/* Use same frame preview as Shop - with image support */}
                    <div className="relative w-14 h-14 flex items-center justify-center">
                      {frame.preview_url ? (
                        <div className="relative w-full h-full">
                          <div 
                            className="absolute inset-[15%] rounded-full bg-card/50"
                          />
                          <img
                            src={frame.preview_url}
                            alt={frame.name}
                            className="absolute inset-0 w-full h-full object-contain"
                            style={{
                              transform: `scale(${frame.frame_scale || 1}) translate(${frame.frame_offset_x || 0}px, ${frame.frame_offset_y || 0}px)`,
                            }}
                          />
                        </div>
                      ) : (
                        <div 
                          className="w-10 h-10 rounded-full"
                          style={{ 
                            border: `3px solid ${frame.border_color}`, 
                            boxShadow: `0 0 10px ${frame.glow_color}` 
                          }}
                        />
                      )}
                    </div>
                    <div>
                      <div className="text-primary font-rajdhani">{frame.name}</div>
                      <div className="text-xs text-primary/50">{frame.rarity} · {frame.price} Bonds</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded ${frame.is_active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                      {frame.is_active ? "Active" : "Inactive"}
                    </span>
                    <Button size="icon" variant="ghost" onClick={() => setEditingFrame(frame)} className="text-primary/60 hover:text-primary">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => deleteFrame(frame.id)} className="text-red-400/60 hover:text-red-400">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Banners Tab */}
          <TabsContent value="banners" className="space-y-4">
            <Dialog open={!!editingBanner} onOpenChange={(open) => !open && setEditingBanner(null)}>
              <DialogTrigger asChild>
                <Button 
                  onClick={() => { setEditingBanner({}); setBannerCreationMode("classic"); }}
                  className="bg-primary/20 border border-primary/30 hover:bg-primary/30 text-primary"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Banner
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-primary/30 max-w-lg">
                <DialogHeader>
                  <DialogTitle className="text-primary font-orbitron">
                    {editingBanner?.id ? "Edit Banner" : "Add Banner"}
                  </DialogTitle>
                </DialogHeader>
                
                {/* Creation Mode Toggle */}
                {!editingBanner?.id && (
                  <div className="flex gap-2 p-1 rounded-lg bg-card/50 border border-primary/20">
                    <button
                      onClick={() => setBannerCreationMode("classic")}
                      className={`flex-1 py-2 px-4 rounded-md text-sm font-rajdhani transition-all ${
                        bannerCreationMode === "classic" 
                          ? "bg-primary/20 text-primary" 
                          : "text-muted-foreground hover:text-primary"
                      }`}
                    >
                      <Sparkles className="h-4 w-4 inline mr-2" />
                      Gradient
                    </button>
                    <button
                      onClick={() => setBannerCreationMode("image")}
                      className={`flex-1 py-2 px-4 rounded-md text-sm font-rajdhani transition-all ${
                        bannerCreationMode === "image" 
                          ? "bg-primary/20 text-primary" 
                          : "text-muted-foreground hover:text-primary"
                      }`}
                    >
                      <LinkIcon className="h-4 w-4 inline mr-2" />
                      Image
                    </button>
                  </div>
                )}

                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                  <div>
                    <Label className="text-primary/80">Name</Label>
                    <Input
                      value={editingBanner?.name || ""}
                      onChange={(e) => setEditingBanner({ ...editingBanner, name: e.target.value })}
                      className="bg-card/50 border-primary/30 text-primary"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-primary/80">Rarity</Label>
                    <Select
                      value={editingBanner?.rarity || "common"}
                      onValueChange={(v) => setEditingBanner({ ...editingBanner, rarity: v })}
                    >
                      <SelectTrigger className="bg-card/50 border-primary/30 text-primary">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="common">Common</SelectItem>
                        <SelectItem value="rare">Rare</SelectItem>
                        <SelectItem value="epic">Epic</SelectItem>
                        <SelectItem value="legendary">Legendary</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {bannerCreationMode === "image" ? (
                    <div>
                      <Label className="text-primary/80">Banner Image URL</Label>
                      <Input
                        placeholder="https://example.com/banner.png"
                        value={editingBanner?.banner_url || ""}
                        onChange={(e) => setEditingBanner({ ...editingBanner, banner_url: e.target.value })}
                        className="bg-card/50 border-primary/30 text-primary"
                      />
                    </div>
                  ) : (
                    <>
                      <div>
                        <Label className="text-primary/80">Gradient Start Color</Label>
                        <Input
                          value={editingBanner?.gradient_start || "#0a0a12"}
                          onChange={(e) => setEditingBanner({ ...editingBanner, gradient_start: e.target.value })}
                          className="bg-card/50 border-primary/30 text-primary"
                        />
                      </div>
                      <div>
                        <Label className="text-primary/80">Gradient End Color</Label>
                        <Input
                          value={editingBanner?.gradient_end || "#1a1a2e"}
                          onChange={(e) => setEditingBanner({ ...editingBanner, gradient_end: e.target.value })}
                          className="bg-card/50 border-primary/30 text-primary"
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <Label className="text-primary/80">Price (Bonds)</Label>
                    <Input
                      type="number"
                      value={editingBanner?.price || 650}
                      onChange={(e) => setEditingBanner({ ...editingBanner, price: parseInt(e.target.value) })}
                      className="bg-card/50 border-primary/30 text-primary"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label className="text-primary/80">Active (visible in Shop)</Label>
                    <Switch
                      checked={editingBanner?.is_active ?? true}
                      onCheckedChange={(c) => setEditingBanner({ ...editingBanner, is_active: c })}
                    />
                  </div>
                  
                  <Button onClick={saveBanner} className="w-full bg-primary/20 border border-primary/30 hover:bg-primary/30 text-primary">
                    Save Banner
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <div className="grid gap-3">
              {banners.map((banner) => (
                <div key={banner.id} className="flex items-center justify-between p-4 rounded-xl bg-card/50 border border-primary/20">
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-16 h-8 rounded-md"
                      style={{
                        background: banner.banner_url
                          ? `url(${banner.banner_url}) center/cover`
                          : `linear-gradient(135deg, ${banner.gradient_start}, ${banner.gradient_end})`,
                      }}
                    />
                    <div>
                      <div className="text-primary font-rajdhani">{banner.name}</div>
                      <div className="text-xs text-primary/50">{banner.rarity} · {banner.price} Bonds</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded ${banner.is_active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                      {banner.is_active ? "Active" : "Inactive"}
                    </span>
                    <Button size="icon" variant="ghost" onClick={() => setEditingBanner(banner)} className="text-primary/60 hover:text-primary">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => deleteBanner(banner.id)} className="text-red-400/60 hover:text-red-400">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Titles Tab */}
          <TabsContent value="titles" className="space-y-4">
            <Dialog open={!!editingTitle} onOpenChange={(open) => !open && setEditingTitle(null)}>
              <DialogTrigger asChild>
                <Button 
                  onClick={() => setEditingTitle({})}
                  className="bg-primary/20 border border-primary/30 hover:bg-primary/30 text-primary"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Title
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-primary/30">
                <DialogHeader>
                  <DialogTitle className="text-primary font-orbitron">
                    {editingTitle?.id ? "Edit Title" : "Add Title"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label className="text-primary/80">Title Text</Label>
                    <Input
                      value={editingTitle?.title_text || ""}
                      onChange={(e) => setEditingTitle({ ...editingTitle, title_text: e.target.value })}
                      className="bg-card/50 border-primary/30 text-primary"
                    />
                  </div>
                  <div>
                    <Label className="text-primary/80">Rarity</Label>
                    <Select
                      value={editingTitle?.rarity || "common"}
                      onValueChange={(v) => setEditingTitle({ ...editingTitle, rarity: v })}
                    >
                      <SelectTrigger className="bg-card/50 border-primary/30 text-primary">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="common">Common</SelectItem>
                        <SelectItem value="rare">Rare</SelectItem>
                        <SelectItem value="epic">Epic</SelectItem>
                        <SelectItem value="legendary">Legendary</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-primary/80">Text Color (hex)</Label>
                    <Input
                      value={editingTitle?.text_color || "#5bb4ff"}
                      onChange={(e) => setEditingTitle({ ...editingTitle, text_color: e.target.value })}
                      className="bg-card/50 border-primary/30 text-primary"
                    />
                  </div>
                  <div>
                    <Label className="text-primary/80">Glow Color (rgba)</Label>
                    <Input
                      value={editingTitle?.glow_color || "rgba(91,180,255,0.5)"}
                      onChange={(e) => setEditingTitle({ ...editingTitle, glow_color: e.target.value })}
                      className="bg-card/50 border-primary/30 text-primary"
                    />
                  </div>
                  <div>
                    <Label className="text-primary/80">Price (Bonds)</Label>
                    <Input
                      type="number"
                      value={editingTitle?.price || 450}
                      onChange={(e) => setEditingTitle({ ...editingTitle, price: parseInt(e.target.value) })}
                      className="bg-card/50 border-primary/30 text-primary"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-primary/80">Active</Label>
                    <Switch
                      checked={editingTitle?.is_active ?? true}
                      onCheckedChange={(c) => setEditingTitle({ ...editingTitle, is_active: c })}
                    />
                  </div>
                  <Button onClick={saveTitle} className="w-full bg-primary/20 border border-primary/30 hover:bg-primary/30 text-primary">
                    Save Title
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <div className="grid gap-3">
              {titles.map((title) => (
                <div key={title.id} className="flex items-center justify-between p-4 rounded-xl bg-card/50 border border-primary/20">
                  <div className="flex items-center gap-4">
                    <div 
                      className="px-3 py-1 rounded-md text-sm"
                      style={{
                        color: title.text_color,
                        textShadow: `0 0 10px ${title.glow_color}`,
                        border: `1px solid ${title.text_color}30`
                      }}
                    >
                      {title.title_text}
                    </div>
                    <div className="text-xs text-primary/50">{title.rarity} · {title.price} Bonds</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded ${title.is_active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                      {title.is_active ? "Active" : "Inactive"}
                    </span>
                    <Button size="icon" variant="ghost" onClick={() => setEditingTitle(title)} className="text-primary/60 hover:text-primary">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => deleteTitle(title.id)} className="text-red-400/60 hover:text-red-400">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
