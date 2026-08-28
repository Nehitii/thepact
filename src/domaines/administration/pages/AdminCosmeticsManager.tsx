import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { FramePreview as InlineFramePreview } from "@/components/ui/avatar-frame";
import { AdminPageShell } from "@/domaines/administration/composants/AdminPageShell";
import { AdminDeleteConfirm } from "@/domaines/administration/composants/AdminDeleteConfirm";
import { logAdminAction } from "@/domaines/administration/hooks/useAdminAudit";
import { 
  Sparkles, 
  Crown, 
  Palette,
  Frame,
  Image,
  Plus, 
  Pencil, 
  Trash2,
  Link as LinkIcon,
  ZoomIn,
  ZoomOut,
  Move,
  RotateCcw,
  Crosshair,
  Eye,
  Search,
  Copy
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
  frame_scale?: number | null;
  frame_offset_x?: number | null;
  frame_offset_y?: number | null;
  show_border?: boolean | null;
  avatar_border_color?: string | null;
}

interface CosmeticBanner {
  id: string;
  name: string;
  rarity: string;
  preview_url: string | null;
  banner_url: string | null;
  gradient_start: string | null;
  gradient_end: string | null;
  is_active: boolean;
  is_default: boolean;
  price: number;
}

interface CosmeticTitle {
  id: string;
  title_text: string;
  rarity: string;
  glow_color: string | null;
  text_color: string | null;
  is_active: boolean;
  is_default: boolean;
  price: number;
}

type CreationMode = "classic" | "image";

export default function AdminCosmeticsManager() {
  const { user } = useAuth();
  const [frames, setFrames] = useState<CosmeticFrame[]>([]);
  const [banners, setBanners] = useState<CosmeticBanner[]>([]);
  const [titles, setTitles] = useState<CosmeticTitle[]>([]);

  const [editingFrame, setEditingFrame] = useState<Partial<CosmeticFrame> | null>(null);
  const [editingBanner, setEditingBanner] = useState<Partial<CosmeticBanner> | null>(null);
  const [editingTitle, setEditingTitle] = useState<Partial<CosmeticTitle> | null>(null);
  
  const [frameCreationMode, setFrameCreationMode] = useState<CreationMode>("classic");
  const [bannerCreationMode, setBannerCreationMode] = useState<CreationMode>("classic");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadAllCosmetics();
  }, []);

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
      show_border: editingFrame.show_border ?? true,
      avatar_border_color: editingFrame.avatar_border_color || "#5bb4ff",
    };
    if (editingFrame.id) {
      await supabase.from("cosmetic_frames").update(frameData).eq("id", editingFrame.id);
      await logAdminAction("update", "frame", editingFrame.id, { name: editingFrame.name });
    } else {
      await supabase.from("cosmetic_frames").insert(frameData);
      await logAdminAction("create", "frame", undefined, { name: editingFrame.name });
    }
    toast.success("Cadre enregistré");
    setEditingFrame(null);
    loadAllCosmetics();
  };

  const deleteFrame = async (id: string, name: string) => {
    await supabase.from("cosmetic_frames").delete().eq("id", id);
    await logAdminAction("delete", "frame", id, { name });
    toast.success("Cadre supprimé");
    loadAllCosmetics();
  };

  const duplicateFrame = async (frame: CosmeticFrame) => {
    const { id, ...rest } = frame;
    await supabase.from("cosmetic_frames").insert({ ...rest, name: `${rest.name} (copy)` });
    await logAdminAction("duplicate", "frame", id, { name: frame.name });
    toast.success("Cadre dupliqué");
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
      await logAdminAction("update", "banner", editingBanner.id, { name: editingBanner.name });
    } else {
      await supabase.from("cosmetic_banners").insert(bannerData);
      await logAdminAction("create", "banner", undefined, { name: editingBanner.name });
    }
    toast.success("Bannière enregistrée");
    setEditingBanner(null);
    loadAllCosmetics();
  };

  const deleteBanner = async (id: string, name: string) => {
    await supabase.from("cosmetic_banners").delete().eq("id", id);
    await logAdminAction("delete", "banner", id, { name });
    toast.success("Bannière supprimée");
    loadAllCosmetics();
  };

  const duplicateBanner = async (banner: CosmeticBanner) => {
    const { id, ...rest } = banner;
    await supabase.from("cosmetic_banners").insert({ ...rest, name: `${rest.name} (copy)` });
    await logAdminAction("duplicate", "banner", id, { name: banner.name });
    toast.success("Bannière dupliquée");
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
      await logAdminAction("update", "title", editingTitle.id, { name: editingTitle.title_text });
    } else {
      await supabase.from("cosmetic_titles").insert(titleData);
      await logAdminAction("create", "title", undefined, { name: editingTitle.title_text });
    }
    toast.success("Titre enregistré");
    setEditingTitle(null);
    loadAllCosmetics();
  };

  const deleteTitle = async (id: string, name: string) => {
    await supabase.from("cosmetic_titles").delete().eq("id", id);
    await logAdminAction("delete", "title", id, { name });
    toast.success("Titre supprimé");
    loadAllCosmetics();
  };

  const duplicateTitle = async (title: CosmeticTitle) => {
    const { id, ...rest } = title;
    await supabase.from("cosmetic_titles").insert({ ...rest, title_text: `${rest.title_text} (copy)` });
    await logAdminAction("duplicate", "title", id, { name: title.title_text });
    toast.success("Titre dupliqué");
    loadAllCosmetics();
  };

  const filterItems = <T extends { name?: string; title_text?: string }>(items: T[]) => {
    if (!searchQuery) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(item => 
      (item.name?.toLowerCase().includes(q)) || 
      (item.title_text?.toLowerCase().includes(q))
    );
  };

  return (
    <AdminPageShell titre="Cosmétiques" sous="Cadres, bannières et titres portés par les profils" icone={<Palette aria-hidden="true" />}>
      <div className="ad-champ">
        <div style={{ position: "relative" }}>
          <Search aria-hidden="true"
            style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, opacity: 0.5 }} />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Chercher un cadre, une bannière, un titre…"
            aria-label="Chercher un cosmétique"
            style={{ paddingLeft: 34 }}
          />
        </div>
      </div>

      <Tabs defaultValue="frames" className="space-y-6">
        <TabsList className="ad-rail">
          <TabsTrigger value="frames" className="ad-onglet">
            <Frame aria-hidden="true" /> Cadres <i>{frames.length}</i>
          </TabsTrigger>
          <TabsTrigger value="banners" className="ad-onglet">
            <Image aria-hidden="true" /> Bannières <i>{banners.length}</i>
          </TabsTrigger>
          <TabsTrigger value="titles" className="ad-onglet">
            <Crown aria-hidden="true" /> Titres <i>{titles.length}</i>
          </TabsTrigger>
        </TabsList>

        {/* Frames Tab */}
        <TabsContent value="frames" className="space-y-4">
          <Dialog open={!!editingFrame} onOpenChange={(open) => !open && setEditingFrame(null)}>
            <DialogTrigger asChild>
              <button
                type="button" className="ad-geste" data-ton="primaire"
                onClick={() => { setEditingFrame({}); setFrameCreationMode("classic"); }}
              >
                <Plus aria-hidden="true" /> Nouveau cadre
              </button>
            </DialogTrigger>
            <DialogContent className="bg-card border-primary/30 max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-primary font-orbitron">
                  {editingFrame?.id ? "Modifier le cadre" : "Nouveau cadre"}
                </DialogTitle>
              </DialogHeader>
              
              {/* Creation Mode Toggle */}
              {(() => {
                const effectiveMode = editingFrame?.id 
                  ? (editingFrame?.preview_url ? "image" : "classic")
                  : frameCreationMode;
                
                return (
                  <div className="flex gap-2 p-1 rounded-lg bg-card/50 border border-primary/20">
                    <button
                      onClick={() => {
                        setFrameCreationMode("classic");
                        if (editingFrame?.id) {
                          setEditingFrame({ ...editingFrame, preview_url: null });
                        }
                      }}
                      className={`flex-1 py-2 px-4 rounded-md text-sm font-rajdhani transition-all ${
                        effectiveMode === "classic" 
                          ? "bg-primary/20 text-primary" 
                          : "text-muted-foreground hover:text-primary"
                      }`}
                    >
                      <Sparkles className="h-4 w-4 inline mr-2" />
                      Dessiné
                    </button>
                    <button
                      onClick={() => setFrameCreationMode("image")}
                      className={`flex-1 py-2 px-4 rounded-md text-sm font-rajdhani transition-all ${
                        effectiveMode === "image" 
                          ? "bg-primary/20 text-primary" 
                          : "text-muted-foreground hover:text-primary"
                      }`}
                    >
                      <LinkIcon className="h-4 w-4 inline mr-2" />
                      Image
                    </button>
                  </div>
                );
              })()}

              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                <div>
                  <Label className="text-primary/80">Nom</Label>
                  <Input
                    value={editingFrame?.name || ""}
                    onChange={(e) => setEditingFrame({ ...editingFrame, name: e.target.value })}
                    className="bg-card/50 border-primary/30 text-primary"
                  />
                </div>
                
                <div>
                  <Label className="text-primary/80">Rareté</Label>
                  <Select
                    value={editingFrame?.rarity || "common"}
                    onValueChange={(v) => setEditingFrame({ ...editingFrame, rarity: v })}
                  >
                    <SelectTrigger className="bg-card/50 border-primary/30 text-primary">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="common">Commun</SelectItem>
                      <SelectItem value="rare">Rare</SelectItem>
                      <SelectItem value="epic">Épique</SelectItem>
                      <SelectItem value="legendary">Légendaire</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Show Border Toggle */}
                <div className="flex items-center justify-between">
                  <Label className="text-primary/80">Cercle autour de l’avatar</Label>
                  <Switch
                    checked={editingFrame?.show_border ?? true}
                    onCheckedChange={(c) => setEditingFrame({ ...editingFrame, show_border: c })}
                  />
                </div>
                
                {(editingFrame?.show_border ?? true) && (
                  <div>
                    <Label className="text-primary/80">Couleur du cercle</Label>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded border border-primary/30 shrink-0"
                        style={{ backgroundColor: editingFrame?.avatar_border_color || "#5bb4ff" }}
                      />
                      <Input
                        value={editingFrame?.avatar_border_color || "#5bb4ff"}
                        onChange={(e) => setEditingFrame({ ...editingFrame, avatar_border_color: e.target.value })}
                        className="bg-card/50 border-primary/30 text-primary"
                      />
                    </div>
                  </div>
                )}

                {(frameCreationMode === "image" || (editingFrame?.id && editingFrame?.preview_url)) ? (
                  <>
                    <div>
                      <Label className="text-primary/80">Adresse de l’image du cadre</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="https://example.com/frame.png"
                          value={editingFrame?.preview_url || ""}
                          onChange={(e) => setEditingFrame({ ...editingFrame, preview_url: e.target.value })}
                          className="bg-card/50 border-primary/30 text-primary flex-1"
                        />
                        {editingFrame?.preview_url && (
                          <a
                            href={editingFrame.preview_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center px-3 rounded-md bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-colors"
                            title="Ouvrir l’image dans un onglet"
                          >
                            <Eye className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    </div>
                    
                    {/* Frame Alignment Tool */}
                    {editingFrame?.preview_url && (
                      <div className="space-y-4 p-4 rounded-xl bg-primary/5 border border-primary/20">
                        <div className="flex items-center justify-between">
                          <Label className="text-primary font-orbitron text-xs uppercase tracking-wider flex items-center gap-2">
                            <Move className="h-4 w-4" />
                            Caler le cadre sur l’avatar
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
                            Remettre à zéro
                          </Button>
                        </div>
                        
                        {/* WYSIWYG Previews */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-1 ds-t-label text-primary/50 uppercase tracking-wider">
                            <Eye className="h-3 w-3" />
                            Aux trois tailles où il sera porté
                          </div>
                          <div className="flex items-end justify-center gap-4 p-3 rounded-lg bg-card/30 border border-primary/10">
                            <InlineFramePreview
                              frameImage={editingFrame.preview_url ?? undefined}
                              frameScale={editingFrame.frame_scale ?? undefined}
                              frameOffsetX={editingFrame.frame_offset_x ?? undefined}
                              frameOffsetY={editingFrame.frame_offset_y ?? undefined}
                              glowColor={editingFrame.glow_color ?? undefined}
                              size="sm"
                            />
                            <InlineFramePreview
                              frameImage={editingFrame.preview_url ?? undefined}
                              frameScale={editingFrame.frame_scale ?? undefined}
                              frameOffsetX={editingFrame.frame_offset_x ?? undefined}
                              frameOffsetY={editingFrame.frame_offset_y ?? undefined}
                              glowColor={editingFrame.glow_color ?? undefined}
                              size="md"
                            />
                            <InlineFramePreview
                              frameImage={editingFrame.preview_url ?? undefined}
                              frameScale={editingFrame.frame_scale ?? undefined}
                              frameOffsetX={editingFrame.frame_offset_x ?? undefined}
                              frameOffsetY={editingFrame.frame_offset_y ?? undefined}
                              glowColor={editingFrame.glow_color ?? undefined}
                              size="2xl"
                            />
                          </div>
                        </div>
                        
                        {/* Scale */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs text-primary/60">
                            <span className="flex items-center gap-1"><ZoomIn className="h-3 w-3" /> Échelle</span>
                            <span>{((editingFrame.frame_scale ?? 1) * 100).toFixed(0)}%</span>
                          </div>
                          <input
                            type="range" min="0.5" max="2" step="0.05"
                            value={editingFrame.frame_scale ?? 1}
                            onChange={(e) => setEditingFrame({ ...editingFrame, frame_scale: parseFloat(e.target.value) })}
                            className="w-full accent-primary"
                          />
                        </div>
                        
                        {/* Offsets */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label className="text-xs text-primary/60">Décalage horizontal (%)</Label>
                            <div className="flex items-center gap-2">
                              <Button type="button" size="icon" variant="ghost"
                                onClick={() => setEditingFrame({ ...editingFrame, frame_offset_x: Math.round(((editingFrame.frame_offset_x ?? 0) - 1) * 10) / 10 })}
                                className="h-6 w-6 text-primary/60 hover:text-primary">-</Button>
                              <Input type="number" step="0.5" value={editingFrame.frame_offset_x ?? 0}
                                onChange={(e) => setEditingFrame({ ...editingFrame, frame_offset_x: parseFloat(e.target.value) || 0 })}
                                className="bg-card/50 border-primary/30 text-primary text-center h-8 text-xs" />
                              <Button type="button" size="icon" variant="ghost"
                                onClick={() => setEditingFrame({ ...editingFrame, frame_offset_x: Math.round(((editingFrame.frame_offset_x ?? 0) + 1) * 10) / 10 })}
                                className="h-6 w-6 text-primary/60 hover:text-primary">+</Button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs text-primary/60">Décalage vertical (%)</Label>
                            <div className="flex items-center gap-2">
                              <Button type="button" size="icon" variant="ghost"
                                onClick={() => setEditingFrame({ ...editingFrame, frame_offset_y: Math.round(((editingFrame.frame_offset_y ?? 0) - 1) * 10) / 10 })}
                                className="h-6 w-6 text-primary/60 hover:text-primary">-</Button>
                              <Input type="number" step="0.5" value={editingFrame.frame_offset_y ?? 0}
                                onChange={(e) => setEditingFrame({ ...editingFrame, frame_offset_y: parseFloat(e.target.value) || 0 })}
                                className="bg-card/50 border-primary/30 text-primary text-center h-8 text-xs" />
                              <Button type="button" size="icon" variant="ghost"
                                onClick={() => setEditingFrame({ ...editingFrame, frame_offset_y: Math.round(((editingFrame.frame_offset_y ?? 0) + 1) * 10) / 10 })}
                                className="h-6 w-6 text-primary/60 hover:text-primary">+</Button>
                            </div>
                          </div>
                        </div>
                        
                        <Button type="button" variant="ghost" size="sm"
                          onClick={() => setEditingFrame({ ...editingFrame, frame_offset_x: 0, frame_offset_y: 0 })}
                          className="w-full text-xs text-primary/60 hover:text-primary border border-primary/20 hover:border-primary/40">
                          <Crosshair className="h-3 w-3 mr-2" />
                          Recentrer
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div>
                      <Label className="text-primary/80">Couleur du liseré (hex)</Label>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded border border-primary/30 shrink-0" style={{ backgroundColor: editingFrame?.border_color || "#5bb4ff" }} />
                        <Input value={editingFrame?.border_color || "#5bb4ff"} onChange={(e) => setEditingFrame({ ...editingFrame, border_color: e.target.value })} className="bg-card/50 border-primary/30 text-primary" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-primary/80">Couleur de la lueur (rgba)</Label>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded border border-primary/30 shrink-0" style={{ backgroundColor: editingFrame?.glow_color || "rgba(91,180,255,0.5)" }} />
                        <Input value={editingFrame?.glow_color || "rgba(91,180,255,0.5)"} onChange={(e) => setEditingFrame({ ...editingFrame, glow_color: e.target.value })} className="bg-card/50 border-primary/30 text-primary" />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <Label className="text-primary/80">Prix en Bonds</Label>
                  <Input type="number" value={editingFrame?.price || 450} onChange={(e) => setEditingFrame({ ...editingFrame, price: parseInt(e.target.value) })} className="bg-card/50 border-primary/30 text-primary" />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label className="text-primary/80">En boutique</Label>
                  <Switch checked={editingFrame?.is_active ?? true} onCheckedChange={(c) => setEditingFrame({ ...editingFrame, is_active: c })} />
                </div>
                
                <button type="button" className="ad-geste" data-ton="primaire" style={{ width: "100%", justifyContent: "center" }} onClick={saveFrame}>
                  Enregistrer le cadre
                </button>
              </div>
            </DialogContent>
          </Dialog>

          <div className="ad-liste">
            {filterItems(frames).map((frame) => (
              <div key={frame.id} className="ad-ligne" data-inactif={!frame.is_active}>
                <span className="ad-apercu">
                  {frame.preview_url ? (
                    <img
                      src={frame.preview_url} alt="" loading="lazy" decoding="async"
                      style={{ transform: `scale(${frame.frame_scale || 1}) translate(${frame.frame_offset_x || 0}px, ${frame.frame_offset_y || 0}px)` }}
                    />
                  ) : (
                    <span style={{
                      width: 26, height: 26, borderRadius: "50%",
                      border: `3px solid ${frame.border_color}`,
                      boxShadow: `0 0 8px ${frame.glow_color}`,
                    }} />
                  )}
                </span>
                <span className="ad-ligne-corps">
                  <span className="ad-ligne-nom">{frame.name}</span>
                  <span className="ad-ligne-meta">
                    <span className="ad-etat" data-ton={frame.is_active ? "actif" : "dormant"}>
                      {frame.is_active ? "en boutique" : "retiré"}
                    </span>
                    <span>{frame.rarity}</span>
                    <span>{frame.price} Bonds</span>
                    {frame.is_default && <span className="ad-etat" data-ton="veille">par défaut</span>}
                  </span>
                </span>
                <span className="ad-ligne-gestes">
                  <button type="button" className="ad-icone" aria-label={`Dupliquer ${frame.name}`} onClick={() => duplicateFrame(frame)}>
                    <Copy aria-hidden="true" />
                  </button>
                  <button type="button" className="ad-icone" aria-label={`Modifier ${frame.name}`} onClick={() => setEditingFrame(frame)}>
                    <Pencil aria-hidden="true" />
                  </button>
                  <AdminDeleteConfirm onConfirm={() => deleteFrame(frame.id, frame.name)} itemName={frame.name} itemType="cadre" />
                </span>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Banners Tab */}
        <TabsContent value="banners" className="space-y-4">
          <Dialog open={!!editingBanner} onOpenChange={(open) => !open && setEditingBanner(null)}>
            <DialogTrigger asChild>
              <button type="button" className="ad-geste" data-ton="primaire" onClick={() => { setEditingBanner({}); setBannerCreationMode("classic"); }}>
                <Plus aria-hidden="true" /> Nouvelle bannière
              </button>
            </DialogTrigger>
            <DialogContent className="bg-card border-primary/30 max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-primary font-orbitron">{editingBanner?.id ? "Modifier la bannière" : "Nouvelle bannière"}</DialogTitle>
              </DialogHeader>
              
              {!editingBanner?.id && (
                <div className="flex gap-2 p-1 rounded-lg bg-card/50 border border-primary/20">
                  <button onClick={() => setBannerCreationMode("classic")}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-rajdhani transition-all ${bannerCreationMode === "classic" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-primary"}`}>
                    <Sparkles className="h-4 w-4 inline mr-2" /> Gradient
                  </button>
                  <button onClick={() => setBannerCreationMode("image")}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-rajdhani transition-all ${bannerCreationMode === "image" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-primary"}`}>
                    <LinkIcon className="h-4 w-4 inline mr-2" /> Image
                  </button>
                </div>
              )}

              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                <div>
                  <Label className="text-primary/80">Nom</Label>
                  <Input value={editingBanner?.name || ""} onChange={(e) => setEditingBanner({ ...editingBanner, name: e.target.value })} className="bg-card/50 border-primary/30 text-primary" />
                </div>
                <div>
                  <Label className="text-primary/80">Rareté</Label>
                  <Select value={editingBanner?.rarity || "common"} onValueChange={(v) => setEditingBanner({ ...editingBanner, rarity: v })}>
                    <SelectTrigger className="bg-card/50 border-primary/30 text-primary"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="common">Commun</SelectItem>
                      <SelectItem value="rare">Rare</SelectItem>
                      <SelectItem value="epic">Épique</SelectItem>
                      <SelectItem value="legendary">Légendaire</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {bannerCreationMode === "image" ? (
                  <div>
                    <Label className="text-primary/80">Adresse de l’image de la bannière</Label>
                    <Input placeholder="https://example.com/banner.png" value={editingBanner?.banner_url || ""} onChange={(e) => setEditingBanner({ ...editingBanner, banner_url: e.target.value })} className="bg-card/50 border-primary/30 text-primary" />
                  </div>
                ) : (
                  <>
                    <div>
                      <Label className="text-primary/80">Dégradé — départ</Label>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded border border-primary/30 shrink-0" style={{ backgroundColor: editingBanner?.gradient_start || "#0a0a12" }} />
                        <Input value={editingBanner?.gradient_start || "#0a0a12"} onChange={(e) => setEditingBanner({ ...editingBanner, gradient_start: e.target.value })} className="bg-card/50 border-primary/30 text-primary" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-primary/80">Dégradé — arrivée</Label>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded border border-primary/30 shrink-0" style={{ backgroundColor: editingBanner?.gradient_end || "#1a1a2e" }} />
                        <Input value={editingBanner?.gradient_end || "#1a1a2e"} onChange={(e) => setEditingBanner({ ...editingBanner, gradient_end: e.target.value })} className="bg-card/50 border-primary/30 text-primary" />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <Label className="text-primary/80">Prix en Bonds</Label>
                  <Input type="number" value={editingBanner?.price || 650} onChange={(e) => setEditingBanner({ ...editingBanner, price: parseInt(e.target.value) })} className="bg-card/50 border-primary/30 text-primary" />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-primary/80">En boutique</Label>
                  <Switch checked={editingBanner?.is_active ?? true} onCheckedChange={(c) => setEditingBanner({ ...editingBanner, is_active: c })} />
                </div>
                <button type="button" className="ad-geste" data-ton="primaire" style={{ width: "100%", justifyContent: "center" }} onClick={saveBanner}>Enregistrer la bannière</button>
              </div>
            </DialogContent>
          </Dialog>

          <div className="ad-liste">
            {filterItems(banners).map((banner) => (
              <div key={banner.id} className="ad-ligne" data-inactif={!banner.is_active}>
                <span className="ad-apercu" style={{
                  background: banner.banner_url
                    ? `url(${banner.banner_url}) center/cover`
                    : `linear-gradient(135deg, ${banner.gradient_start}, ${banner.gradient_end})`,
                }} />
                <span className="ad-ligne-corps">
                  <span className="ad-ligne-nom">{banner.name}</span>
                  <span className="ad-ligne-meta">
                    <span className="ad-etat" data-ton={banner.is_active ? "actif" : "dormant"}>
                      {banner.is_active ? "en boutique" : "retirée"}
                    </span>
                    <span>{banner.rarity}</span>
                    <span>{banner.price} Bonds</span>
                    {banner.is_default && <span className="ad-etat" data-ton="veille">par défaut</span>}
                  </span>
                </span>
                <span className="ad-ligne-gestes">
                  <button type="button" className="ad-icone" aria-label={`Dupliquer ${banner.name}`} onClick={() => duplicateBanner(banner)}>
                    <Copy aria-hidden="true" />
                  </button>
                  <button type="button" className="ad-icone" aria-label={`Modifier ${banner.name}`} onClick={() => setEditingBanner(banner)}>
                    <Pencil aria-hidden="true" />
                  </button>
                  <AdminDeleteConfirm onConfirm={() => deleteBanner(banner.id, banner.name)} itemName={banner.name} itemType="bannière" />
                </span>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Titles Tab */}
        <TabsContent value="titles" className="space-y-4">
          <Dialog open={!!editingTitle} onOpenChange={(open) => !open && setEditingTitle(null)}>
            <DialogTrigger asChild>
              <button type="button" className="ad-geste" data-ton="primaire" onClick={() => setEditingTitle({})}>
                <Plus aria-hidden="true" /> Nouveau titre
              </button>
            </DialogTrigger>
            <DialogContent className="bg-card border-primary/30">
              <DialogHeader>
                <DialogTitle className="text-primary font-orbitron">{editingTitle?.id ? "Modifier le titre" : "Nouveau titre"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-primary/80">Texte du titre</Label>
                  <Input value={editingTitle?.title_text || ""} onChange={(e) => setEditingTitle({ ...editingTitle, title_text: e.target.value })} className="bg-card/50 border-primary/30 text-primary" />
                </div>
                <div>
                  <Label className="text-primary/80">Rareté</Label>
                  <Select value={editingTitle?.rarity || "common"} onValueChange={(v) => setEditingTitle({ ...editingTitle, rarity: v })}>
                    <SelectTrigger className="bg-card/50 border-primary/30 text-primary"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="common">Commun</SelectItem>
                      <SelectItem value="rare">Rare</SelectItem>
                      <SelectItem value="epic">Épique</SelectItem>
                      <SelectItem value="legendary">Légendaire</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-primary/80">Couleur du texte (hex)</Label>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded border border-primary/30 shrink-0" style={{ backgroundColor: editingTitle?.text_color || "#5bb4ff" }} />
                    <Input value={editingTitle?.text_color || "#5bb4ff"} onChange={(e) => setEditingTitle({ ...editingTitle, text_color: e.target.value })} className="bg-card/50 border-primary/30 text-primary" />
                  </div>
                </div>
                <div>
                  <Label className="text-primary/80">Couleur de la lueur (rgba)</Label>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded border border-primary/30 shrink-0" style={{ backgroundColor: editingTitle?.glow_color || "rgba(91,180,255,0.5)" }} />
                    <Input value={editingTitle?.glow_color || "rgba(91,180,255,0.5)"} onChange={(e) => setEditingTitle({ ...editingTitle, glow_color: e.target.value })} className="bg-card/50 border-primary/30 text-primary" />
                  </div>
                </div>
                <div>
                  <Label className="text-primary/80">Prix en Bonds</Label>
                  <Input type="number" value={editingTitle?.price || 450} onChange={(e) => setEditingTitle({ ...editingTitle, price: parseInt(e.target.value) })} className="bg-card/50 border-primary/30 text-primary" />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-primary/80">En boutique</Label>
                  <Switch checked={editingTitle?.is_active ?? true} onCheckedChange={(c) => setEditingTitle({ ...editingTitle, is_active: c })} />
                </div>
                <button type="button" className="ad-geste" data-ton="primaire" style={{ width: "100%", justifyContent: "center" }} onClick={saveTitle}>Enregistrer le titre</button>
              </div>
            </DialogContent>
          </Dialog>

          <div className="ad-liste">
            {filterItems(titles).map((title) => (
              <div key={title.id} className="ad-ligne" data-inactif={!title.is_active}>
                {/* L'aperçu EST le titre, avec sa couleur et sa lueur : c'est
                    tout ce qui le distingue d'un autre. */}
                <span className="ad-apercu" style={{ width: "auto", minWidth: 40, padding: "0 9px" }}>
                  <span style={{
                    color: title.text_color ?? undefined,
                    textShadow: `0 0 10px ${title.glow_color ?? "transparent"}`,
                    fontSize: 12, fontWeight: 700, whiteSpace: "nowrap",
                  }}>
                    {title.title_text}
                  </span>
                </span>
                <span className="ad-ligne-corps">
                  <span className="ad-ligne-nom">{title.title_text}</span>
                  <span className="ad-ligne-meta">
                    <span className="ad-etat" data-ton={title.is_active ? "actif" : "dormant"}>
                      {title.is_active ? "en boutique" : "retiré"}
                    </span>
                    <span>{title.rarity}</span>
                    <span>{title.price} Bonds</span>
                    {title.is_default && <span className="ad-etat" data-ton="veille">par défaut</span>}
                  </span>
                </span>
                <span className="ad-ligne-gestes">
                  <button type="button" className="ad-icone" aria-label={`Dupliquer ${title.title_text}`} onClick={() => duplicateTitle(title)}>
                    <Copy aria-hidden="true" />
                  </button>
                  <button type="button" className="ad-icone" aria-label={`Modifier ${title.title_text}`} onClick={() => setEditingTitle(title)}>
                    <Pencil aria-hidden="true" />
                  </button>
                  <AdminDeleteConfirm onConfirm={() => deleteTitle(title.id, title.title_text)} itemName={title.title_text} itemType="titre" />
                </span>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </AdminPageShell>
  );
}
