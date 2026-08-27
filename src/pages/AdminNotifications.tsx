import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Send, Users, Gift, Loader2, MessageSquare, Star, Trophy, Zap, Heart, Info, AlertTriangle, History } from "lucide-react";
import { toast } from "sonner";
import { useServerAdminCheck } from "@/hooks/useServerAdminCheck";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import {
  useAnnuaire, useDiffuser, useJournalAdmin, motDeLErreur,
} from "@/hooks/useAdminServeur";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";

type NotificationCategory = "system" | "progress" | "social" | "marketing";
type NotificationPriority = "critical" | "important" | "informational" | "social" | "silent";
type RewardType = "bonds" | "frame" | "banner" | "title";

const iconComponents: Record<string, React.ComponentType<{ className?: string }>> = {
  bell: Bell, gift: Gift, star: Star, trophy: Trophy, zap: Zap, heart: Heart, info: Info, warning: AlertTriangle,
};

export default function AdminNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [mode, setMode] = useState<"notification" | "message">("notification");
  const [activeTab, setActiveTab] = useState<"compose" | "history">("compose");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<NotificationCategory>("system");
  const [priority, setPriority] = useState<NotificationPriority>("informational");
  const [iconKey, setIconKey] = useState("bell");
  const [ctaLabel, setCtaLabel] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");
  const [attachReward, setAttachReward] = useState(false);
  const [rewardType, setRewardType] = useState<RewardType>("bonds");
  const [rewardAmount, setRewardAmount] = useState(0);
  const [rewardCosmeticId, setRewardCosmeticId] = useState("");
  const [targetAll, setTargetAll] = useState(true);
  const [targetUserId, setTargetUserId] = useState("");

  const { data: adminCheck } = useServerAdminCheck(!!user);
  const isAdminVerified = adminCheck?.isAdmin === true;

  /* LA LISTE VENAIT DE `profiles`, QUI NE REND QUE SA PROPRE LIGNE.
     Elle contenait donc UN nom — celui de l'administrateur — et viser
     quelqu'un d'autre était impossible depuis cet écran. */
  const { data: annuaire = [] } = useAnnuaire();
  const allUsers = annuaire.map((u) => ({ id: u.user_id, display_name: u.nom }));
  const [confirmation, setConfirmation] = useState(false);

  const { data: frames = [] } = useQuery({
    queryKey: ["admin-frames"],
    queryFn: async () => { const { data } = await supabase.from("cosmetic_frames").select("id, name").eq("is_active", true); return data || []; },
    enabled: isAdminVerified && rewardType === "frame",
  });

  const { data: banners = [] } = useQuery({
    queryKey: ["admin-banners"],
    queryFn: async () => { const { data } = await supabase.from("cosmetic_banners").select("id, name").eq("is_active", true); return data || []; },
    enabled: isAdminVerified && rewardType === "banner",
  });

  const { data: titles = [] } = useQuery({
    queryKey: ["admin-titles"],
    queryFn: async () => { const { data } = await supabase.from("cosmetic_titles").select("id, title_text").eq("is_active", true); return data || []; },
    enabled: isAdminVerified && rewardType === "title",
  });

  /* L'HISTORIQUE MONTRAIT CE QUE L'ADMINISTRATEUR AVAIT REÇU.
     Il lisait `notifications` sans filtre ; RLS ne rendant que les
     siennes, l'onglet présentait sa propre boîte comme la liste de ses
     envois. L'historique des actes d'administration est dans le
     journal d'audit — c'est sa raison d'être. */
  const { data: journal = [] } = useJournalAdmin(50);
  const notifHistory = journal
    .filter((l) => l.action === "diffusion")
    .map((l) => ({
      id: l.id,
      title: String(l.details?.titre ?? "—"),
      description: `${l.details?.envoyes ?? 0} envoyé(s)`
        + (Number(l.details?.ecartes ?? 0) > 0
            ? ` · ${l.details?.ecartes} écarté(s) par leurs réglages`
            : "")
        + (l.details?.cible === "tous" ? " · à tous" : " · à une personne"),
      category: String(l.details?.categorie ?? "system"),
      priority: String(l.details?.priorite ?? "informational"),
      created_at: l.quand,
    }));

  /* L'ENVOI SE FAIT CÔTÉ SERVEUR, POUR TROIS RAISONS.
     Il énumère les destinataires là où ils sont visibles ; il respecte
     les préférences de catégorie, donc il ne fabrique plus d'avis que
     personne ne verra ; et il écrit sa trace d'audit dans la MÊME
     transaction — elle ne peut plus être oubliée ni refusée à part. */
  const diffuser = useDiffuser();

  const envoyer = () => {
    diffuser.mutate(
      {
        titre: title,
        description: description || undefined,
        categorie: category,
        priorite: priority,
        icone: iconKey,
        ctaLabel: ctaLabel || undefined,
        ctaUrl: ctaUrl || undefined,
        recompenseType: attachReward ? rewardType : null,
        recompenseMontant: attachReward && rewardType === "bonds" ? rewardAmount : null,
        recompenseCosmetique: attachReward && rewardType !== "bonds" ? rewardCosmeticId : null,
        destinataire: targetAll ? null : targetUserId,
      },
      {
        onSuccess: (r) => {
          toast.success(`Envoyé à ${r.envoyes} personne${r.envoyes > 1 ? "s" : ""}`, {
            description: r.ecartes > 0
              ? `${r.ecartes} écarté${r.ecartes > 1 ? "s" : ""} : cette catégorie est coupée dans leurs réglages.`
              : undefined,
          });
          setTitle(""); setDescription(""); setCtaLabel(""); setCtaUrl("");
          setAttachReward(false); setRewardAmount(0); setRewardCosmeticId("");
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
        },
        onError: (e) => toast.error("Envoi refusé", { description: motDeLErreur(e) }),
      },
    );
  };

  const sendNotification = { isPending: diffuser.isPending, mutate: () => setConfirmation(true) };

  const canSend = title.trim() && (targetAll || targetUserId);
  const PreviewIcon = iconComponents[iconKey] || Bell;

  const getCosmeticsList = () => {
    switch (rewardType) {
      case "frame": return frames.map(f => ({ id: f.id, name: f.name }));
      case "banner": return banners.map(b => ({ id: b.id, name: b.name }));
      case "title": return titles.map(t => ({ id: t.id, name: t.title_text }));
      default: return [];
    }
  };

  return (
    <AdminPageShell titre="Diffusion" sous="Écrire à tout le monde, ou à une personne" icone={<Bell aria-hidden="true" />}>
      {/* Main Tabs: Compose / History */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "compose" | "history")} className="mb-6">
        <TabsList className="w-full bg-card/50 border border-primary/20 p-1">
          <TabsTrigger value="compose" className="flex-1 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
            <Send className="h-4 w-4 mr-2" /> Compose
          </TabsTrigger>
          <TabsTrigger value="history" className="flex-1 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
            <History className="h-4 w-4 mr-2" /> History ({notifHistory.length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {activeTab === "history" ? (
        <div className="space-y-2">
          {notifHistory.length === 0 ? (
            <div className="text-center py-12 text-primary/40">
              <History className="h-10 w-10 mx-auto mb-3" />
              <p>Aucune diffusion pour le moment</p>
            </div>
          ) : (
            notifHistory.map((n) => (
              <div key={n.id} className="p-4 rounded-xl bg-card/50 border border-primary/20">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-primary">{n.title}</span>
                  <span className="text-xs text-primary/40">{format(new Date(n.created_at), "MMM d, HH:mm")}</span>
                </div>
                {n.description && <p className="text-sm text-primary/60">{n.description}</p>}
                <div className="flex gap-2 mt-2">
                  <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary/60">{n.category}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary/60">{n.priority}</span>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <>
          {/* Mode Selector */}
          <Tabs value={mode} onValueChange={(v) => setMode(v as "notification" | "message")} className="mb-6">
            <TabsList className="w-full bg-card/50 border border-primary/20 p-1">
              <TabsTrigger value="notification" className="flex-1 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                <Bell className="h-4 w-4 mr-2" /> Notification
              </TabsTrigger>
              <TabsTrigger value="message" className="flex-1 data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-400">
                <MessageSquare className="h-4 w-4 mr-2" /> Message
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Card variant="clean" className="p-6 bg-card/50 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-primary">Title *</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={mode === "notification" ? "Notification title..." : "Message subject..."} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-primary">{mode === "notification" ? "Description" : "Message Content"}</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder={mode === "notification" ? "Optional description..." : "Write your message..."} className="min-h-[80px]" />
            </div>

            {mode === "notification" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-primary">Category</Label>
                    <Select value={category} onValueChange={(v) => setCategory(v as NotificationCategory)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="system">System</SelectItem>
                        <SelectItem value="progress">Progress</SelectItem>
                        <SelectItem value="social">Social</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-primary">Priority</Label>
                    <Select value={priority} onValueChange={(v) => setPriority(v as NotificationPriority)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="critical">Critical</SelectItem>
                        <SelectItem value="important">Important</SelectItem>
                        <SelectItem value="informational">Informational</SelectItem>
                        <SelectItem value="social">Social</SelectItem>
                        <SelectItem value="silent">Silent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-primary">Icon Key</Label>
                  <Select value={iconKey} onValueChange={setIconKey}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.keys(iconComponents).map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label className="text-primary">CTA Label (optional)</Label><Input value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} placeholder="e.g., View Details" /></div>
                  <div className="space-y-2"><Label className="text-primary">CTA URL (optional)</Label><Input value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)} placeholder="e.g., /shop" /></div>
                </div>
              </>
            )}

            {/* Reward */}
            <div className="border border-amber-500/30 rounded-lg p-4 bg-amber-500/5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2"><Gift className="h-5 w-5 text-amber-400" /><Label className="text-amber-400">Attach Reward</Label></div>
                <Switch checked={attachReward} onCheckedChange={setAttachReward} />
              </div>
              {attachReward && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-primary/70">Reward Type</Label>
                    <Select value={rewardType} onValueChange={(v) => { setRewardType(v as RewardType); setRewardCosmeticId(""); setRewardAmount(0); }}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bonds">Bonds</SelectItem>
                        <SelectItem value="frame">Avatar Frame</SelectItem>
                        <SelectItem value="banner">Banner</SelectItem>
                        <SelectItem value="title">Title</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {rewardType === "bonds" ? (
                    <div className="space-y-2"><Label className="text-primary/70">Amount</Label><Input type="number" value={rewardAmount} onChange={(e) => setRewardAmount(Number(e.target.value))} min={0} /></div>
                  ) : (
                    <div className="space-y-2">
                      <Label className="text-primary/70">Select {rewardType}</Label>
                      <Select value={rewardCosmeticId} onValueChange={setRewardCosmeticId}>
                        <SelectTrigger><SelectValue placeholder={`Select a ${rewardType}...`} /></SelectTrigger>
                        <SelectContent>{getCosmeticsList().map(item => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Target */}
            <div className="border border-primary/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" /><Label className="text-primary">Target All Users</Label></div>
                <Switch checked={targetAll} onCheckedChange={setTargetAll} />
              </div>
              {!targetAll && (
                <div className="space-y-2">
                  <Label className="text-primary/70">Select User</Label>
                  <Select value={targetUserId} onValueChange={setTargetUserId}>
                    <SelectTrigger><SelectValue placeholder="Select a user..." /></SelectTrigger>
                    <SelectContent>{allUsers.map((u) => <SelectItem key={u.id} value={u.id}>{u.display_name || u.id.slice(0, 8)}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Preview */}
            <div className="border border-primary/20 rounded-lg p-4 bg-background/30">
              <Label className="text-primary/70 mb-2 block">Preview</Label>
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center"><PreviewIcon className="h-5 w-5 text-primary" /></div>
                  <div className="flex-1">
                    <p className="font-semibold text-primary">{title || "Notification Title"}</p>
                    <p className="text-sm text-muted-foreground">{description || "Description..."}</p>
                    {attachReward && (rewardAmount > 0 || rewardCosmeticId) && (
                      <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 rounded bg-amber-500/20 text-amber-400 text-xs">
                        <Gift className="h-3 w-3" />{rewardType === "bonds" ? `+${rewardAmount} Bonds` : `Free ${rewardType}`}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <Button onClick={() => sendNotification.mutate()} disabled={!canSend || sendNotification.isPending}
              className={`w-full border ${mode === "notification" ? "bg-primary/20 text-primary border-primary/30 hover:bg-primary/30" : "bg-violet-500/20 text-violet-400 border-violet-500/50 hover:bg-violet-500/30"}`}>
              {sendNotification.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              {targetAll ? "Envoyer à tout le monde" : "Envoyer à cette personne"}
            </Button>
          </Card>
        </>
      )}

      {/* ÉCRIRE À TOUT LE MONDE NE SE FAIT PAS EN UN CLIC.
          Un envoi ne se rattrape pas : il atterrit chez chacun, et le
          retirer ne le fait pas oublier. La confirmation dit combien de
          personnes existent, pour qu'on sache ce qu'on déclenche. */}
      <AlertDialog open={confirmation} onOpenChange={setConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {targetAll
                ? `Envoyer à ${annuaire.length} personne${annuaire.length > 1 ? "s" : ""} ?`
                : "Envoyer cet avis ?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              « {title || "sans titre"} » — catégorie {category}, priorité {priority}.
              {targetAll
                ? " Ceux qui ont coupé cette catégorie dans leurs réglages seront écartés, et le compte rendu le dira."
                : ""}
              {" "}Un avis envoyé ne se reprend pas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={envoyer}>Envoyer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminPageShell>
  );
}
