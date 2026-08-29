import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { Upload, Loader2, Check, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/socle/ui/dialog";
import { Input } from "@/socle/ui/input";
import { Label } from "@/socle/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/socle/ui/tabs";
import { AvatarFrame, FramePreview } from "@/socle/ui/avatar-frame";
import { rarite } from "@/domaines/profil/logique/rarete";
import { cn } from "@/socle/outils/utils";
import { Button } from "@/socle/ui/button";
import { Bouton } from "@/socle/ds/console-ui";
import { SelectionDialog, InventorySlot } from "@/domaines/profil/composants/InventaireCosmetique";
import type {
  CosmeticFrame, CosmeticBanner, CosmeticTitle,
} from "@/domaines/profil/hooks/useCosmetiquesDuProfil";

/* CE QU ON CHOISIT POUR SA FICHE.
 *
 * Quatre dialogues : l avatar, le cadre, le fond de carte, le titre.
 * Ils forment un tout, et ce tout n est pas le rendu de la fiche — le
 * composant qui les portait faisait les deux.
 *
 * LES TROIS DERNIERS SUIVENT LA MEME FORME : un catalogue, un ensemble
 * de ce qui est possede, un choix actif. Les regarder cote a cote rend
 * visible ce qui les distingue vraiment — et il n y a presque rien.
 */
export interface ChoixCosmetiquesProps {
  avatarUrl: string | null;
  avatarUrlInput: string;
  setAvatarUrlInput: (v: string) => void;
  showAvatarDialog: boolean;
  setShowAvatarDialog: (v: boolean) => void;
  uploading: boolean;
  saving: boolean;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void | Promise<void>;
  onSaveAvatar: () => void | Promise<void>;
  onRetirerAvatar: () => void | Promise<void>;
  showFrameDialog: boolean;
  setShowFrameDialog: (v: boolean) => void;
  showBannerDialog: boolean;
  setShowBannerDialog: (v: boolean) => void;
  showTitleDialog: boolean;
  setShowTitleDialog: (v: boolean) => void;
  frames: CosmeticFrame[];
  banners: CosmeticBanner[];
  titles: CosmeticTitle[];
  ownedFrameIds: Set<string>;
  ownedBannerIds: Set<string>;
  ownedTitleIds: Set<string>;
  activeFrameId: string | null;
  setActiveFrameId: (v: string | null) => void;
  activeBannerId: string | null;
  setActiveBannerId: (v: string | null) => void;
  activeTitleId: string | null;
  setActiveTitleId: (v: string | null) => void;
  onEnregistrer: () => void | Promise<void>;
}

export function ChoixCosmetiques({
  avatarUrl, avatarUrlInput, setAvatarUrlInput,
  showAvatarDialog, setShowAvatarDialog, uploading, saving, onFileUpload, onSaveAvatar, onRetirerAvatar,
  showFrameDialog, setShowFrameDialog, showBannerDialog, setShowBannerDialog,
  showTitleDialog, setShowTitleDialog,
  frames, banners, titles,
  ownedFrameIds, ownedBannerIds, ownedTitleIds,
  activeFrameId, setActiveFrameId, activeBannerId, setActiveBannerId,
  activeTitleId, setActiveTitleId, onEnregistrer,
}: ChoixCosmetiquesProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  return (
    <>
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
              <input ref={fileInputRef} type="file" accept="image/*" onChange={onFileUpload} className="hidden" />
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
              <Button onClick={onSaveAvatar} className="w-full">
                Utiliser cette image
              </Button>
            </TabsContent>
          </Tabs>

          {/* On pouvait poser un avatar, jamais le retirer. */}
          {avatarUrl && (
            <div className="pt-3 mt-1 border-t border-border">
              <Bouton role="danger" pleine onClick={onRetirerAvatar}>
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
    </>
  );
}
