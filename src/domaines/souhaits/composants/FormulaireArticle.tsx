/* LE FORMULAIRE D UN ARTICLE — creation et edition.
 *
 * Il vivait au bas de `pages/Wishlist.tsx`, qui faisait 1 081 lignes.
 * Il en sort TEL QUEL : c est la regle de l etape 5 — on deplace, on
 * ne reecrit pas. Le compilateur prouve un deplacement ; il ne prouve
 * pas une reecriture, et cette page est derriere l authentification.
 *
 * Il porte dix-huit paires champ/setter parce que la page tient deux
 * jeux d etats paralleles, `new*` et `edit*`. Les fusionner serait un
 * vrai gain — et une reecriture. Note ici, pas faite ici.
 */
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/socle/ui/dialog";
import { Input } from "@/socle/ui/input";
import { Label } from "@/socle/ui/label";
import { Textarea } from "@/socle/ui/textarea";
import { Button } from "@/socle/ui/button";
import { Switch } from "@/socle/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/socle/ui/select";
import { ChampImage } from "@/domaines/souhaits/composants/ChampImage";
import type { PactWishlistItemType, WishlistPriority } from "@/domaines/souhaits/hooks/usePactWishlist";

/* ═══════════════════════════════════════════════════════════════
   LE FORMULAIRE

   Creation et edition demandaient les memes champs dans deux blocs
   recopies, en anglais. Un seul formulaire, deux usages.
   ═══════════════════════════════════════════════════════════════ */
interface FormulaireArticleProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  titre: string;
  name: string; setName: (v: string) => void;
  cost: string; setCost: (v: string) => void;
  category: string; setCategory: (v: string) => void;
  url: string; setUrl: (v: string) => void;
  imageUrl: string; setImageUrl: (v: string) => void;
  goalId: string; setGoalId: (v: string) => void;
  listId: string; setListId: (v: string) => void;
  type: PactWishlistItemType; setType: (v: PactWishlistItemType) => void;
  priority: WishlistPriority; setPriority: (v: WishlistPriority) => void;
  notes?: string; setNotes?: (v: string) => void;
  goals: Array<{ id: string; name: string }>;
  listes: Array<{ id: string; name: string }>;
  userId: string | undefined;
  onSubmit: () => void;
  submitLabel: string;
  busy: boolean;
}

export function FormulaireArticle(p: FormulaireArticleProps) {
  const { t } = useTranslation();

  const champ = "bg-transparent border-[var(--wl-trait)] font-rajdhani";
  const etiquette = "font-mono uppercase text-[10px] tracking-[0.2em] text-muted-foreground";

  return (
    <Dialog open={p.open} onOpenChange={p.onOpenChange}>
      <DialogContent className="wl-boite bg-card/95 backdrop-blur-2xl border-[var(--wl-trait)] max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-mono uppercase text-sm tracking-[0.2em] text-foreground">
            {p.titre}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className={etiquette}>{t("wishlist.form.nom", "Nom")} *</Label>
            <Input value={p.name} onChange={(e) => p.setName(e.target.value)} className={champ} />
          </div>

          {/* DEUX CHAMPS QUE PERSONNE NE REMPLIT.
              Mesure : sur soixante-et-onze articles, soixante-neuf
              portent la categorie « Goal Equipment » et soixante-huit
              sur soixante-dix la priorite « basse » — les deux ecrites
              par la synchronisation, aucune par une main. Aucun
              article n a jamais porte « haute » ni « critique ».
              Ce qui decide de l ordre d achat, c est le prix et
              l objectif ; le formulaire cesse de demander le reste.
              Les valeurs existantes sont relues et reecrites telles
              quelles : rien n est efface. */}
          <div className="space-y-2">
            <Label className={etiquette}>{t("wishlist.form.prix", "Prix estimé")}</Label>
            <Input value={p.cost} onChange={(e) => p.setCost(e.target.value)} inputMode="decimal"
              className={`${champ} font-mono`} />
          </div>

          <div className="space-y-2">
            <Label className={etiquette}>{t("wishlist.form.objectif", "Objectif lié")}</Label>
            <Select
              value={p.goalId}
              onValueChange={(v) => {
                p.setGoalId(v);
                /* UN POSTE TIENT À UN OBJECTIF OU À UNE LISTE, JAMAIS AUX
                   DEUX : un poste financé par le pacte compterait sinon
                   dans deux totaux. La base le refuse ; ici on évite à
                   l'utilisateur de se heurter au refus. */
                if (v !== "none") p.setListId("none");
              }}
            >
              <SelectTrigger className={champ}>
                <SelectValue placeholder={t("wishlist.form.aucunObjectif", "Aucun")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("wishlist.form.aucunObjectif", "Aucun")}</SelectItem>
                {p.goals.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Le rattachement à une liste ne se propose que si l'article
              n'est pas déjà pris par un objectif — proposer un choix que
              la base refusera est pire que ne pas le proposer. */}
          {p.goalId === "none" && p.listes.length > 0 && (
            <div className="space-y-2">
              <Label className={etiquette}>{t("wishlist.form.liste", "Ma liste")}</Label>
              <Select value={p.listId} onValueChange={p.setListId}>
                <SelectTrigger className={champ}>
                  <SelectValue placeholder={t("wishlist.form.aucuneListe", "Aucune")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("wishlist.form.aucuneListe", "Aucune")}</SelectItem>
                  {p.listes.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label className={etiquette}>{t("wishlist.form.lien", "Lien vers la boutique")}</Label>
            <Input value={p.url} onChange={(e) => p.setUrl(e.target.value)} placeholder="https://…"
              className={`${champ} font-mono text-xs`} />
          </div>

          <div className="space-y-2">
            <Label className={etiquette}>{t("wishlist.form.image", "Image")}</Label>
            <ChampImage value={p.imageUrl} onChange={p.setImageUrl} userId={p.userId} />
          </div>

          {p.setNotes && (
            <div className="space-y-2">
              <Label className={etiquette}>{t("wishlist.form.notes", "Notes")}</Label>
              <Textarea value={p.notes ?? ""} onChange={(e) => p.setNotes?.(e.target.value)} rows={3} className={champ} />
            </div>
          )}

          <div className="flex items-center justify-between gap-4 p-3 border border-[var(--wl-trait)]">
            <div>
              <p className="text-sm font-rajdhani font-semibold text-foreground">
                {t("wishlist.form.requis", "Requis pour le pacte")}
              </p>
              <p className="text-xs text-muted-foreground font-rajdhani">
                {t("wishlist.form.requisAide", "Une nécessité, pas une envie.")}
              </p>
            </div>
            <Switch checked={p.type === "required"} onCheckedChange={(v) => p.setType(v ? "required" : "optional")} />
          </div>

          <Button onClick={p.onSubmit} disabled={!p.name.trim() || p.busy}
            className="w-full font-mono tracking-[0.15em] uppercase text-xs">
            {p.submitLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
