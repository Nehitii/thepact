import { useState, useEffect, useMemo, useRef } from "react";
import { niveauDuRang } from "@/domaines/succes";
import {
  useCosmetiquesDuProfil,
  type CosmeticFrame, type CosmeticBanner, type CosmeticTitle,
} from "@/domaines/profil/hooks/useCosmetiquesDuProfil";
import { useTranslation } from "react-i18next";
import { Bouton } from "@/socle/ds/console-ui";
import { Button } from "@/socle/ui/button";
import { Input } from "@/socle/ui/input";
import { Label } from "@/socle/ui/label";
import { AvatarFrame, FramePreview } from "@/socle/ui/avatar-frame";
import { TitreCosmetique } from "@/domaines/profil/composants/TitreCosmetique";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/socle/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/socle/ui/tabs";
import { RankCore } from "@/domaines/succes";
import { useRankXP } from "@/domaines/succes";
import { usePact } from "@/domaines/objectifs";
import { supabase } from "@/socle/supabase/client";
import { toast } from "sonner";
import { Upload, ImageIcon, Crown, Sparkles, Save, Loader2, Trash2, AlertTriangle } from "lucide-react";
import { CustomizationTrigger } from "@/domaines/profil/composants/InventaireCosmetique";
import { ChoixCosmetiques } from "@/domaines/profil/composants/ChoixCosmetiques";
import { HolographicCard, CyberText } from "@/domaines/profil/composants/CartePublique";
import { rarite } from "@/domaines/profil/logique/rarete";
import { useAvatarDuProfil } from "@/domaines/profil/hooks/useAvatarDuProfil";

// --- TYPES ---

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

  /* Le niveau EST le rang du palier dans la liste — meme regle que le
     hub, et desormais la meme fonction. */
  const niveau = niveauDuRang(rankData);

  // State
  const [saving, setSaving] = useState(false);
  const [showAvatarDialog, setShowAvatarDialog] = useState(false);
  const [showFrameDialog, setShowFrameDialog] = useState(false);
  const [showBannerDialog, setShowBannerDialog] = useState(false);
  const [showTitleDialog, setShowTitleDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Data State
  /* Le chargement des cosmetiques et leur etat vivent dans
     `hooks/useCosmetiquesDuProfil.ts` : cinq requetes, trois
     ensembles de possession, et le choix actif de chaque famille. */
  const c = useCosmetiquesDuProfil(userId);
  const {
    frames, banners, titles,
    ownedFrameIds, ownedBannerIds, ownedTitleIds,
    activeFrameId, setActiveFrameId, activeBannerId, setActiveBannerId,
    activeTitleId, setActiveTitleId,
    activeFrame, activeBanner, activeTitle,
    chargement, panne,
  } = c;

  // Handlers

  /* Les trois gestes de l avatar vivent dans
     `hooks/useAvatarDuProfil.ts` : coller une adresse, deposer un
     fichier, le retirer. */
  const {
    avatarUrlInput, setAvatarUrlInput, uploading,
    handleSaveAvatar, handleFileUpload, retirerAvatar,
  } = useAvatarDuProfil({ userId, onAvatarUrlChange, fermer: () => setShowAvatarDialog(false) });
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

                  {/* LE TITRE, RENDU PAR LE COMPOSANT PARTAGE.
                      La gelule vivait ici en double de celle de la
                      petite carte ; les deux avaient commence a
                      diverger. */}
                  <div className="flex justify-center w-full min-w-0 px-2">
                    {activeTitle?.title_text ? (
                      <TitreCosmetique
                        texte={activeTitle.title_text}
                        couleur={activeTitle.text_color}
                        lueur={activeTitle.glow_color}
                        rarete={activeTitle.rarity}
                      />
                    ) : (
                      <span className="font-rajdhani uppercase tracking-[0.2em] text-xs font-semibold text-white/35">
                        Aucun titre
                      </span>
                    )}
                  </div>
                </div>

                {/* LE MEME NOYAU QUE LE TABLEAU DE BORD.
                    Le pied portait deux fois le meme renseignement : un
                    intitule « Rang actuel » avec un bouclier, et a cote
                    un badge rond montrant… un bouclier. Ce bouclier
                    n etait qu un repli — `ranks.logo_url` est vide sur
                    les dix rangs — et le badge recevait `currentXP` et
                    `nextRankMinXP` sans jamais les lire.

                    Le noyau les remplace : l image du rang au centre,
                    son nom dessous, et l XP en arc plutot qu en chiffre
                    muet. */}
                {rankData?.currentRank && (
                  <div className="w-full mt-7 pt-5 border-t border-white/10 flex justify-center">
                    <RankCore
                      taille="carte"
                      level={niveau}
                      rankName={rankData.currentRank.name}
                      logoUrl={rankData.currentRank.logo_url}
                      nextRankName={rankData.nextRank?.name ?? null}
                      progress={rankData.progressInCurrentRank}
                      currentXP={rankData.currentXP}
                      targetXP={rankData.nextRank?.min_points ?? 0}
                    />
                  </div>
                )}
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
      {/* Les quatre choix cosmetiques, sortis ensemble : ce qu on
          choisit pour sa fiche n est pas le rendu de la fiche. */}
      <ChoixCosmetiques
        avatarUrl={avatarUrl}
        avatarUrlInput={avatarUrlInput}
        setAvatarUrlInput={setAvatarUrlInput}
        showAvatarDialog={showAvatarDialog}
        setShowAvatarDialog={setShowAvatarDialog}
        uploading={uploading}
        saving={saving}
        onFileUpload={handleFileUpload}
        onSaveAvatar={handleSaveAvatar}
        onRetirerAvatar={retirerAvatar}
        showFrameDialog={showFrameDialog}
        setShowFrameDialog={setShowFrameDialog}
        showBannerDialog={showBannerDialog}
        setShowBannerDialog={setShowBannerDialog}
        showTitleDialog={showTitleDialog}
        setShowTitleDialog={setShowTitleDialog}
        frames={frames} banners={banners} titles={titles}
        ownedFrameIds={ownedFrameIds} ownedBannerIds={ownedBannerIds} ownedTitleIds={ownedTitleIds}
        activeFrameId={activeFrameId} setActiveFrameId={setActiveFrameId}
        activeBannerId={activeBannerId} setActiveBannerId={setActiveBannerId}
        activeTitleId={activeTitleId} setActiveTitleId={setActiveTitleId}
        onEnregistrer={handleSave}
      />
    </div>
  );
}
