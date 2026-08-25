import { useState, useEffect, useRef, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Bouton } from "@/components/profile/console-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AvatarFrame, FramePreview } from "@/components/ui/avatar-frame";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RankBadge } from "@/components/ranks/RankCard";
import { useRankXP } from "@/hooks/useRankXP";
import { usePact } from "@/hooks/usePact";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Upload, Link as LinkIcon, ImageIcon, Crown, Sparkles, Lock, Save, Loader2, Shield, Trash2, AlertTriangle } from "lucide-react";

// --- TYPES ---
interface CosmeticFrame {
  id: string;
  name: string;
  rarity: string;
  border_color: string;
  glow_color: string;
  preview_url: string | null;
  is_default: boolean;
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
  gradient_start: string | null;
  gradient_end: string | null;
  banner_url: string | null;
  is_default: boolean;
}

interface CosmeticTitle {
  id: string;
  title_text: string;
  rarity: string;
  glow_color: string | null;
  text_color: string | null;
  is_default: boolean;
}

/* QUATRE PROPS SUR HUIT NE SERVAIENT A RIEN.
   `avatarFrame`, `personalQuote`, `displayedBadges` et leurs trois
   rappels etaient declares ici, passes par la page — en chaine vide,
   en tableau vide, en fonctions creuses — et jamais destructures par
   ce composant. Le cadre a bien un reglage, mais il vit dans l etat
   local ; la citation et les badges n ont jamais eu d ecran, alors que
   `profiles.personal_quote` et `profiles.displayed_badges` existent
   en base et n ont jamais rien recu. */
interface ProfileBoundedProfileProps {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  onAvatarUrlChange: (url: string | null) => void;
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
      <div className="relative h-full transform-style-3d shadow-2xl shadow-black/80 rounded-[20px] overflow-hidden bg-[var(--surface-elevated)] border border-border group">
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

/* Les deux calques colores sont une aberration chromatique au survol.
   Sans `aria-hidden`, un lecteur d ecran annoncait le pseudo trois fois
   de suite. */
const CyberText = ({ text, className }: { text: string; className?: string }) => {
  return (
    <div className={`relative group/nom inline-block ${className}`}>
      <span className="relative z-10">{text}</span>
      <span aria-hidden="true" className="absolute top-0 left-0 -z-10 w-full h-full text-cyan-400 opacity-0 group-hover/nom:opacity-70 group-hover/nom:translate-x-[1px] transition-all duration-75 select-none blur-[0.5px]">
        {text}
      </span>
      <span aria-hidden="true" className="absolute top-0 left-0 -z-10 w-full h-full text-red-500 opacity-0 group-hover/nom:opacity-70 group-hover/nom:-translate-x-[1px] transition-all duration-75 delay-75 select-none blur-[0.5px]">
        {text}
      </span>
    </div>
  );
};

/* `rarite(x)` plutot que `rarityColors[x]` : l acces direct sur une
   rarete absente rend `undefined`, et le `.bg` qui suit fait tomber
   la page. Les quatre raretes en base correspondent aujourd hui ; une
   cinquieme suffirait. */
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

const rarite = (r?: string | null) => rarityColors[r ?? ""] ?? rarityColors.common;

// --- MAIN COMPONENT ---

export function ProfileBoundedProfile({
  userId,
  displayName,
  avatarUrl,
  onAvatarUrlChange,
}: ProfileBoundedProfileProps) {
  const { t } = useTranslation();
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
  const [chargement, setChargement] = useState(true);
  const [panne, setPanne] = useState<string | null>(null);
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

  /* CINQ REQUETES, AUCUNE ERREUR LUE.
     Un `if (data)` suffisait a tout : une panne de lecture rendait un
     inventaire vide, impossible a distinguer d un inventaire
     reellement vide — et l ecran laissait croire que rien n avait ete
     acquis. On lit desormais l echec, et on le dit. */
  useEffect(() => {
    let vivant = true;
    const loadData = async () => {
      setChargement(true);
      try {
        const [framesRes, bannersRes, titlesRes, ownershipRes, profileRes] = await Promise.all([
          supabase.from("cosmetic_frames").select("*").eq("is_active", true),
          supabase.from("cosmetic_banners").select("*").eq("is_active", true),
          supabase.from("cosmetic_titles").select("*").eq("is_active", true),
          supabase.from("user_cosmetics").select("cosmetic_type, cosmetic_id").eq("user_id", userId),
          supabase.from("profiles").select("active_frame_id, active_banner_id, active_title_id").eq("id", userId).single(),
        ]);

        const echec = [framesRes, bannersRes, titlesRes, ownershipRes, profileRes].find((r) => r.error);
        if (echec?.error) throw echec.error;
        if (!vivant) return;

        setFrames(framesRes.data ?? []);
        setBanners(bannersRes.data ?? []);
        setTitles(titlesRes.data ?? []);

        const possede = ownershipRes.data ?? [];
        setOwnedFrameIds(new Set(possede.filter((o) => o.cosmetic_type === "frame").map((o) => o.cosmetic_id)));
        setOwnedBannerIds(new Set(possede.filter((o) => o.cosmetic_type === "banner").map((o) => o.cosmetic_id)));
        setOwnedTitleIds(new Set(possede.filter((o) => o.cosmetic_type === "title").map((o) => o.cosmetic_id)));

        setActiveFrameId(profileRes.data?.active_frame_id ?? null);
        setActiveBannerId(profileRes.data?.active_banner_id ?? null);
        setActiveTitleId(profileRes.data?.active_title_id ?? null);
        setPanne(null);
      } catch (e) {
        if (!vivant) return;
        setPanne(e instanceof Error ? e.message : String(e));
      } finally {
        if (vivant) setChargement(false);
      }
    };
    loadData();
    return () => { vivant = false; };
  }, [userId]);

  // Handlers
  const antiCache = (u: string) => (u.includes("?") ? `${u}&t=${Date.now()}` : `${u}?t=${Date.now()}`);

  const handleSaveAvatar = async () => {
    const saisie = avatarUrlInput.trim();
    if (!saisie) return;

    /* Une adresse d image, pas n importe quelle chaine. Un \`javascript:\`
       ne s execute pas dans un \`src\`, mais rien ne verifiait meme qu il
       s agissait d une adresse. */
    try {
      const adresse = new URL(saisie);
      if (adresse.protocol !== "https:" && adresse.protocol !== "http:") throw new Error("schéma");
    } catch {
      toast.error("Adresse invalide", { description: "Colle une adresse commençant par https://" });
      return;
    }

    const { error } = await supabase.from("profiles").update({ avatar_url: saisie }).eq("id", userId);
    if (error) {
      toast.error("Erreur", { description: error.message });
      return;
    }

    /* Ce qu on AFFICHE porte l anti-cache ; ce qu on STOCKE ne le porte
       pas. Les deux etaient confondus : \`handleSave\` reecrivait ensuite
       l adresse horodatee dans la colonne, et le \`?t=…\` y restait. */
    onAvatarUrlChange(antiCache(saisie));
    toast.success("Avatar enregistré");
    setShowAvatarDialog(false);
    setAvatarUrlInput("");
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      toast.error("Format refusé", { description: "JPG, PNG, WEBP ou GIF." });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Fichier trop lourd", { description: "5 Mo au maximum." });
      return;
    }

    setUploading(true);
    try {
      const { optimizeImage } = await import("@/lib/imageOptimization");
      const optimized = await optimizeImage(file, "avatar");
      const fileExt = optimized.type === "image/gif" ? "gif" : "webp";
      const fileName = `avatar-${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("goal-images")
        .upload(filePath, optimized, {
          upsert: true,
          contentType: optimized.type,
          cacheControl: "31536000",
        });
      if (uploadError) throw uploadError;

      const { data: signedUrlData } = await supabase.storage
        .from("goal-images")
        .createSignedUrl(filePath, 60 * 60 * 24 * 365);

      if (!signedUrlData?.signedUrl) throw new Error("L’adresse du fichier n’a pas pu être créée.");

      const { error: majError } = await supabase
        .from("profiles")
        .update({ avatar_url: signedUrlData.signedUrl })
        .eq("id", userId);
      if (majError) throw majError;

      onAvatarUrlChange(antiCache(signedUrlData.signedUrl));
      toast.success("Avatar envoyé");
    } catch (error) {
      toast.error("Envoi impossible", {
        description: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setUploading(false);
      setShowAvatarDialog(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    /* \`avatar_url\` n est plus reecrit ici : il est deja enregistre au
       moment de l envoi, et le reecrire depuis l etat d affichage
       replantait l anti-cache dans la colonne. Ce bouton ne concerne
       que les trois cosmetiques. */
    const { error } = await supabase
      .from("profiles")
      .update({
        active_frame_id: activeFrameId,
        active_banner_id: activeBannerId,
        active_title_id: activeTitleId,
      })
      .eq("id", userId);

    if (error) {
      /* Le declencheur \`cosmetiques_possedes\` refuse d equiper ce qui
         n a pas ete acquis. C est une reponse, pas une panne. */
      const refus = error.message.includes("cosmetique_non_possede");
      toast.error(refus ? "Cosmétique non possédé" : "Erreur", {
        description: refus
          ? "Cet élément n’est pas dans ton inventaire. Passe par la boutique."
          : error.message,
      });
    } else {
      toast.success("Apparence enregistrée", { description: "Ta carte publique est à jour." });
    }
    setSaving(false);
  };

  const retirerAvatar = async () => {
    const { error } = await supabase.from("profiles").update({ avatar_url: null }).eq("id", userId);
    if (error) {
      toast.error("Erreur", { description: error.message });
      return;
    }
    onAvatarUrlChange(null);
    toast.success("Avatar retiré");
    setShowAvatarDialog(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Une panne de lecture ne doit pas se deguiser en inventaire
          vide : sans ce bandeau, tous les cosmetiques apparaissaient
          simplement comme non possedes. */}
      {panne && (
        <p className="rg-alerte" data-ton="warn" role="status">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Ton inventaire n’a pas pu être lu : {panne}
        </p>
      )}
      {chargement && !panne && (
        <p className="rg-releve-vide">Chargement de ton inventaire…</p>
      )}

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
                <div className="px-2 py-0.5 bg-black/40 backdrop-blur-md border border-white/10 rounded ds-t-label text-white/80 font-mono tracking-widest">
                  // {pact?.name || "SANS PACTE"}
                </div>
                {/* Rarity/Theme Badge (Optional) */}
                {activeBanner?.rarity && activeBanner.rarity !== "common" && (
                  <div
                    className={`px-2 py-0.5 rounded ds-t-label uppercase font-bold tracking-wider border ${rarite(activeBanner.rarity).bg} ${rarite(activeBanner.rarity).text} ${rarite(activeBanner.rarity).border}`}
                  >
                    {t(`shop.rarity.${activeBanner.rarity}`, activeBanner.rarity)}
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
                  {/* Etait un <div onClick> : cliquable a la souris, inatteignable
                      au clavier et muet pour un lecteur d'ecran. */}
                  <button
                    type="button"
                    onClick={() => setShowAvatarDialog(true)}
                    aria-label="Changer d'avatar"
                    /* GROUPE NOMME, PAS GROUPE ANONYME.
                       `group-hover:` de Tailwind vise « un ancetre
                       porteur de .group », pas le plus proche. La carte
                       holographique en porte un pour son reflet : le
                       voile d envoi s allumait donc des qu on survolait
                       la carte, n importe ou. */
                    className="relative group/avatar cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    <AvatarFrame
                      avatarUrl={avatarUrl}
                      fallback={displayName?.[0] || "?"}
                      size="2xl"
                      frameImage={activeFrame?.preview_url ?? undefined}
                      borderColor={activeFrame?.avatar_border_color || activeFrame?.border_color || "#5bb4ff"}
                      glowColor={activeFrame?.glow_color || "rgba(91,180,255,0.5)"}
                      frameScale={activeFrame?.frame_scale ?? undefined}
                      frameOffsetX={activeFrame?.frame_offset_x ?? undefined}
                      frameOffsetY={activeFrame?.frame_offset_y ?? undefined}
                      showBorder={activeFrame?.show_border !== false}
                      className="transition-transform duration-300 group-hover/avatar:scale-105 shadow-2xl"
                    />

                    {/* LA PASTILLE D ENVOI PASSE SOUS LE CADRE.
                        `AvatarFrame` empile la photo en z-10 et le cadre en
                        z-20 ; le voile etait en z-30 et recouvrait donc le
                        cadre au survol — on masquait justement la piece
                        cosmetique qu on est venu regarder. En z-15 il noircit
                        la photo, et le cadre reste net par-dessus. */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-32 w-32 rounded-full flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity bg-black/60 z-[15] backdrop-blur-[2px]">
                        <Upload className="w-8 h-8 text-white drop-shadow-lg" />
                      </div>
                    </div>
                  </button>
                </div>

                {/* Identity Text */}
                <div className="text-center space-y-3 w-full">
                  <h3 className="text-2xl md:text-3xl font-orbitron font-black text-white tracking-wider drop-shadow-lg">
                    <CyberText text={displayName || "SANS NOM"} />
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
                        {activeTitle?.title_text || "AUCUN TITRE"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Stats / Rank */}
                <div className="w-full mt-8 pt-4 border-t border-white/10 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="ds-t-label text-white/30 uppercase tracking-widest font-mono mb-1">
                      Rang actuel
                    </span>
                    <div className="flex items-center gap-2 text-white/90 font-rajdhani font-semibold text-sm">
                      <Shield className="w-4 h-4 text-primary" />
                      {rankData?.currentRank?.name || "Sans rang"}
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
          label="Cadre d’avatar"
          value={activeFrame?.name}
          onClick={() => setShowFrameDialog(true)}
        />
        <CustomizationTrigger
          icon={<ImageIcon className="w-5 h-5" />}
          label="Fond de carte"
          value={activeBanner?.name}
          onClick={() => setShowBannerDialog(true)}
        />
        <CustomizationTrigger
          icon={<Crown className="w-5 h-5" />}
          label="Titre"
          value={activeTitle?.title_text}
          onClick={() => setShowTitleDialog(true)}
        />
      </div>

      {/* 3. ACTION BAR */}
      <Bouton role="primaire" pleine onClick={handleSave} disabled={saving}>
        {saving ? <Loader2 className="animate-spin" /> : <Save />}
        {saving ? "Enregistrement…" : "Enregistrer"}
      </Bouton>

      {/* --- DIALOGS (Keep existing implementation) --- */}
      <Dialog open={showAvatarDialog} onOpenChange={setShowAvatarDialog}>
        <DialogContent className="bg-background/95 backdrop-blur-xl border-primary/20">
          <DialogHeader>
            <DialogTitle className="font-orbitron text-primary">Changer d’avatar</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="upload">Depuis un fichier</TabsTrigger>
              <TabsTrigger value="url">Depuis une adresse</TabsTrigger>
            </TabsList>
            <TabsContent value="upload" className="mt-4">
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full h-32 border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 flex flex-col gap-2"
              >
                {uploading ? <Loader2 className="animate-spin w-8 h-8" /> : <Upload className="w-8 h-8 opacity-50" />}
                <span className="text-xs uppercase tracking-wider opacity-70">Choisir un fichier</span>
              </Button>
            </TabsContent>
            <TabsContent value="url" className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="avatar-adresse">Adresse de l’image</Label>
                <Input
                  id="avatar-adresse"
                  type="url"
                  placeholder="https://…"
                  value={avatarUrlInput}
                  onChange={(e) => setAvatarUrlInput(e.target.value)}
                />
              </div>
              <Button onClick={handleSaveAvatar} className="w-full">
                Utiliser cette image
              </Button>
            </TabsContent>
          </Tabs>

          {/* On pouvait poser un avatar, jamais le retirer. */}
          {avatarUrl && (
            <div className="pt-3 mt-1 border-t border-border">
              <Bouton role="danger" pleine onClick={retirerAvatar}>
                <Trash2 />
                Retirer mon avatar
              </Bouton>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <SelectionDialog open={showFrameDialog} onOpenChange={setShowFrameDialog} title="Choisir un cadre">
        <div className="grid grid-cols-3 gap-3 p-1">
          {frames.map((frame) => {
            const owned = ownedFrameIds.has(frame.id) || frame.is_default;
            const active = activeFrameId === frame.id || (!activeFrameId && frame.is_default);
            const rarity = rarite(frame.rarity);
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
                    frameImage={frame.preview_url ?? undefined}
                    borderColor={frame.border_color}
                    glowColor={frame.glow_color ?? undefined}
                    frameScale={frame.frame_scale ?? undefined}
                    frameOffsetX={frame.frame_offset_x ?? undefined}
                    frameOffsetY={frame.frame_offset_y ?? undefined}
                  />
                </div>
                <div className="ds-t-label text-center truncate px-1 mt-1 opacity-70 font-rajdhani uppercase">
                  {frame.name}
                </div>
              </InventorySlot>
            );
          })}
        </div>
      </SelectionDialog>

      <SelectionDialog open={showBannerDialog} onOpenChange={setShowBannerDialog} title="Choisir un fond de carte">
        <div className="grid grid-cols-2 gap-3 p-1">
          {banners.map((banner) => {
            const owned = ownedBannerIds.has(banner.id) || banner.is_default;
            const active = activeBannerId === banner.id || (!activeBannerId && banner.is_default);
            const rarity = rarite(banner.rarity);
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
                <div className="ds-t-label text-center font-rajdhani uppercase">{banner.name}</div>
              </InventorySlot>
            );
          })}
        </div>
      </SelectionDialog>

      <SelectionDialog open={showTitleDialog} onOpenChange={setShowTitleDialog} title="Choisir un titre">
        <div className="grid grid-cols-2 gap-3 p-1">
          {titles.map((title) => {
            const owned = ownedTitleIds.has(title.id) || title.is_default;
            const active = activeTitleId === title.id || (!activeTitleId && title.is_default);
            const rarity = rarite(title.rarity);
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
  icon: ReactNode;
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
        {value || "Par défaut"}
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
      <DialogContent className="bg-[var(--surface-overlay)] backdrop-blur-xl border-border max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
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
        <div className="absolute top-0 right-0 bg-primary text-black ds-t-label font-bold px-1.5 py-0.5 rounded-bl font-mono">
          ÉQUIPÉ
        </div>
      )}
      {!owned && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Lock className="w-4 h-4 text-white/50" aria-hidden="true" />
          {/* Le cadenas etait muet : un lecteur d ecran annoncait un
              bouton desactive sans dire pourquoi. */}
          <span className="sr-only">Non possédé</span>
        </div>
      )}
    </button>
  );
}
