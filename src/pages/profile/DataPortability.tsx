import { useState, useRef } from "react";
import { Bouton } from "@/components/profile/console-ui";
import { Database, Download, BarChart3, Scale, Target, BookOpen, Wallet, Loader2, Heart, Upload, Trash2, AlertCircle, UserX } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { ConsoleReglages } from "@/components/profile/ConsoleReglages";
import { Panneau } from "@/components/profile/console-ui";

type ExportCategory = "all" | "goals-steps" | "journal" | "finance" | "health";

/* LES MOTS DE CONFIRMATION SONT EN FRANCAIS.
   Il fallait taper « RESET » — et « DELETE » pour supprimer le compte —
   dans une interface francaise : l utilisateur devait deviner le mot de
   passe de sa propre destruction. */
const MOT_REINIT = "REINITIALISER";
const MOT_SUPPRESSION = "SUPPRIMER";

/* La fonction delete-account exige desormais aal2 quand un second
   facteur est enrole. Son 403 porte un code, pas une phrase — et
   functions.invoke jette le corps de toute reponse non-2xx. On relit
   donc la reponse conservee dans context, comme ailleurs dans
   l application. */
const motifLisible = (code: string) =>
  code === "second_facteur_requis"
    ? "Ton compte est protégé par un second facteur. Reconnecte-toi en le saisissant, puis réessaie."
    : code;

const motifDeLEchec = async (error: { message: string; context?: unknown }) => {
  if (error.context instanceof Response) {
    try {
      const corps = await error.context.clone().json();
      if (corps?.error) return motifLisible(corps.error);
    } catch {
      /* Corps illisible : on retombe sur le message d origine. */
    }
  }
  return error.message;
};

export default function DataPortability() {
  const { user, session } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [exportCategory, setExportCategory] = useState<ExportCategory>("all");
  const [isExporting, setIsExporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importPreview, setImportPreview] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetConfirm, setResetConfirm] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [latestLog, setLatestLog] = useState<{ text: string; type: "ok" | "warn" | "info" }>({ text: "DATA PORTABILITY READY", type: "info" });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["user-stats", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data: pact } = await supabase.from("pacts").select("id").eq("user_id", user.id).maybeSingle();
      const { count: goalsCount } = await supabase.from("goals").select("*", { count: "exact", head: true }).eq("pact_id", pact?.id || "");
      const { data: steps } = await supabase.from("steps").select("id, status, goal_id").in("goal_id", pact?.id ? (await supabase.from("goals").select("id").eq("pact_id", pact.id)).data?.map((g) => g.id) || [] : []);
      const completedSteps = steps?.filter((s) => s.status === "completed").length || 0;
      const { count: journalCount } = await supabase.from("journal_entries").select("*", { count: "exact", head: true }).eq("user_id", user.id);
      const { count: achievementsCount } = await supabase.from("user_achievements").select("*", { count: "exact", head: true }).eq("user_id", user.id).not("unlocked_at", "is", null);
      return { goalsCreated: goalsCount || 0, stepsCompleted: completedSteps, totalSteps: steps?.length || 0, journalEntries: journalCount || 0, achievementsUnlocked: achievementsCount || 0 };
    },
    enabled: !!user?.id,
  });

  const handleExportData = async () => {
    if (!user?.id) return;
    setIsExporting(true);
    setLatestLog({ text: "EXPORT INITIATED...", type: "info" });
    try {
      let exportData: Record<string, unknown> = { exportedAt: new Date().toISOString(), category: exportCategory, user: { email: user.email, id: user.id } };
      const { data: pact } = await supabase.from("pacts").select("*").eq("user_id", user.id).maybeSingle();
      if (exportCategory === "all" || exportCategory === "goals-steps") {
        const { data: goals } = await supabase.from("goals").select("*").eq("pact_id", pact?.id || "");
        const goalIds = goals?.map((g) => g.id) || [];
        const { data: steps } = await supabase.from("steps").select("*").in("goal_id", goalIds.length > 0 ? goalIds : ["none"]);
        exportData = { ...exportData, goals, steps };
      }
      if (exportCategory === "all" || exportCategory === "journal") {
        const { data: journal } = await supabase.from("journal_entries").select("*").eq("user_id", user.id);
        exportData = { ...exportData, journalEntries: journal };
      }
      if (exportCategory === "all" || exportCategory === "health") {
        const { data: healthData, error: healthErr } = await supabase.from("health_data").select("*").eq("user_id", user.id).order("entry_date", { ascending: true });
        if (!healthErr && healthData && healthData.length > 0) {
          if (exportCategory === "health") {
            const headers = ["Date","Sleep Hours","Sleep Quality","Wake Energy","Activity Level","Movement Minutes","Stress Level","Mental Load","Hydration Glasses","Meal Balance","Mood Level","Energy Morning","Energy Afternoon","Energy Evening","Notes"];
            const rows = healthData.map((d: Record<string, unknown>) => [d.entry_date, d.sleep_hours ?? "", d.sleep_quality ?? "", d.wake_energy ?? "", d.activity_level ?? "", d.movement_minutes ?? "", d.stress_level ?? "", d.mental_load ?? "", d.hydration_glasses ?? "", d.meal_balance ?? "", d.mood_level ?? "", d.energy_morning ?? "", d.energy_afternoon ?? "", d.energy_evening ?? "", `"${String(d.notes ?? "").replace(/"/g, '""')}"`]);
            const csv = [headers.join(","), ...rows.map((r: unknown[]) => r.join(","))].join("\n");
            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a"); a.href = url; a.download = `health-data-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(url);
            toast.success(t("profile.data.exportComplete"), { description: t("profile.data.exportSuccess", { category: getCategoryLabel(exportCategory).toLowerCase() }) });
            setLatestLog({ text: "HEALTH CSV EXPORTED", type: "ok" });
            return;
          }
          exportData = { ...exportData, healthData };
        }
      }
      if (exportCategory === "all" || exportCategory === "finance") {
        const { data: profileData } = await supabase.from("profiles").select("project_funding_target, project_monthly_allocation, already_funded, salary_payment_day").eq("id", user.id).maybeSingle();
        const { data: recurringIncome } = await supabase.from("recurring_income").select("*").eq("user_id", user.id);
        const { data: recurringExpenses } = await supabase.from("recurring_expenses").select("*").eq("user_id", user.id);
        const { data: financeRecords } = await supabase.from("finance").select("*").eq("user_id", user.id);
        const { data: monthlyValidations } = await supabase.from("monthly_finance_validations").select("*").eq("user_id", user.id);
        const { data: pactSpending } = await supabase.from("pact_spending").select("*").eq("user_id", user.id);
        exportData = { ...exportData, finance: { settings: profileData, recurringIncome, recurringExpenses, monthlyRecords: financeRecords, monthlyValidations, pactSpending } };
      }
      if (exportCategory === "all") {
        const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
        const { data: achievements } = await supabase.from("user_achievements").select("*").eq("user_id", user.id);
        exportData = { ...exportData, profile: profileData, pact, achievements, stats };
      }
      const dateStr = new Date().toISOString().split("T")[0].replace(/-/g, "");
      const filename = `the-pact-${exportCategory === "all" ? "all" : exportCategory}-${dateStr}.json`;
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
      toast.success(t("profile.data.exportComplete"), { description: t("profile.data.exportSuccess", { category: getCategoryLabel(exportCategory).toLowerCase() }) });
      setLatestLog({ text: `EXPORT COMPLETE: ${exportCategory.toUpperCase()}`, type: "ok" });
    } catch {
      toast.error(t("profile.data.exportFailed"), { description: t("profile.data.exportError") });
      setLatestLog({ text: "EXPORT FAILED", type: "warn" });
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      setImportPreview({ category: parsed.category || "unknown", exportedAt: parsed.exportedAt || "unknown", goals: parsed.goals?.length || 0, steps: parsed.steps?.length || 0, journalEntries: parsed.journalEntries?.length || 0 });
    } catch {
      toast.error("Fichier invalide", { description: "Le fichier n'est pas un export JSON valide." });
      setImportFile(null); setImportPreview(null);
    }
  };

  const handleImport = async () => {
    if (!importFile || !user?.id) return;
    setIsImporting(true);
    setLatestLog({ text: "IMPORT IN PROGRESS...", type: "info" });
    try {
      const text = await importFile.text();
      const data = JSON.parse(text);
      if (data.journalEntries && data.journalEntries.length > 0) {
        for (const entry of data.journalEntries) {
          const { id, ...rest } = entry;
          await supabase.from("journal_entries").upsert({ ...rest, user_id: user.id }, { onConflict: "id" });
        }
      }
      toast.success("Import terminé", { description: "Les données ont été importées avec succès." });
      setLatestLog({ text: "IMPORT COMPLETE", type: "ok" });
      setImportFile(null); setImportPreview(null);
    } catch (e: any) {
      toast.error("Erreur d'import", { description: e.message });
      setLatestLog({ text: "IMPORT FAILED", type: "warn" });
    } finally { setIsImporting(false); }
  };

  const handleDeleteAllData = async () => {
    if (resetConfirm !== MOT_REINIT) return;
    setIsResetting(true);
    setLatestLog({ text: "RESETTING ALL DATA...", type: "warn" });
    try {
      const { data, error } = await supabase.functions.invoke("delete-all-data", { headers: { Authorization: `Bearer ${session?.access_token}` } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("Données supprimées", { description: "Toutes tes données ont été réinitialisées." });
      setLatestLog({ text: "ALL DATA PURGED", type: "ok" });
      setShowResetModal(false); setResetConfirm("");
    } catch (e: any) {
      toast.error("Erreur", { description: e.message });
      setLatestLog({ text: "RESET FAILED", type: "warn" });
    } finally { setIsResetting(false); }
  };

  /* LA SUPPRESSION DU COMPTE A REJOINT SA VOISINE.
     Elle vivait dans un onglet « Systeme » de la page Compte, loin de
     la reinitialisation des donnees a laquelle elle ressemble. Deux
     destructions, une seule zone sensible.

     Elle lisait aussi son resultat comme le reste de cette page ne le
     faisait deja : `invoke` ne leve pas sur une reponse non-2xx, il
     rend `{ data, error }`. L ancienne version jetait cette valeur,
     journalisait « ACCOUNT PURGED », deconnectait et redirigeait — meme
     apres un 500. Le compte etait toujours la, et l utilisateur n avait
     plus aucun moyen de s en apercevoir. */
  const handleDeleteAccount = async () => {
    if (deleteConfirm !== MOT_SUPPRESSION) return;
    setIsDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke("delete-account", {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (error) throw new Error(await motifDeLEchec(error));
      if (data?.error) throw new Error(motifLisible(data.error));

      toast.success("Compte supprimé", { description: "Toutes tes données ont été effacées." });
      await supabase.auth.signOut();
      navigate("/auth");
    } catch (e) {
      /* On reste sur place et connecte : la seule facon honnete de dire
         que rien n a ete supprime. */
      toast.error("Suppression impossible", {
        description: e instanceof Error ? e.message : "Ton compte est intact. Réessaie ou signale-le.",
      });
      setLatestLog({ text: "ACCOUNT DELETE FAILED", type: "warn" });
    } finally {
      setIsDeleting(false);
    }
  };

  const getCategoryLabel = (category: ExportCategory): string => {
    switch (category) {
      case "all": return t("profile.data.categories.all");
      case "goals-steps": return t("profile.data.categories.goalsSteps");
      case "journal": return t("profile.data.categories.journal");
      case "finance": return t("profile.data.categories.finance");
      case "health": return t("profile.data.categories.health") || "Health";
      default: return t("profile.data.categories.data");
    }
  };

  const exportOptions: { value: ExportCategory; label: string; icon: React.ReactNode; desc: string }[] = [
    { value: "all", label: t("profile.data.categories.all"), icon: <Database className="h-4 w-4" />, desc: t("profile.data.allDesc") },
    { value: "goals-steps", label: t("profile.data.categories.goalsSteps"), icon: <Target className="h-4 w-4" />, desc: t("profile.data.goalsDesc") },
    { value: "journal", label: t("profile.data.categories.journal"), icon: <BookOpen className="h-4 w-4" />, desc: t("profile.data.journalDesc") },
    { value: "finance", label: t("profile.data.categories.finance"), icon: <Wallet className="h-4 w-4" />, desc: t("profile.data.financeDesc") },
    { value: "health", label: t("profile.data.categories.health") || "Health", icon: <Heart className="h-4 w-4" />, desc: t("profile.data.healthDesc") || "Wellness check-ins, sleep, activity & stress data (CSV)" },
  ];

  const statItems = [
    { value: stats?.goalsCreated || 0, label: t("profile.data.stats.goalsCreated") },
    { value: stats?.stepsCompleted || 0, label: t("profile.data.stats.stepsCompleted") },
    { value: stats?.journalEntries || 0, label: t("profile.data.stats.journalEntries") },
    { value: stats?.achievementsUnlocked || 0, label: t("profile.data.stats.achievements") },
  ];

  return (
    <ConsoleReglages titre={t("profile.data.title")} note={t("profile.data.subtitle")}>
      {/* ── Stats ── */}
      <Panneau code="Ce que tu as produit" etat={t("settings.console.synced", "synchronisé")} ton="actif" rang="primaire">
        <div className="grid grid-cols-2 gap-3">
          {statItems.map((s) => (
            <div key={s.label} className="border border-primary/15 bg-primary/[0.03] p-4 text-center" style={{ clipPath: "polygon(8px 0%, 100% 0%, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0% 100%, 0% 8px)" }}>
              <div className="text-2xl font-orbitron font-bold text-primary">{s.value}</div>
              <div className="ds-t-label text-muted-foreground font-mono uppercase tracking-widest mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </Panneau>

      {/* ── Export ── */}
      <Panneau code="Exporter">
        <div className="space-y-4">
          <p className="ds-t-label text-muted-foreground tracking-wide">{t("profile.data.exportDesc")}</p>
          <RadioGroup value={exportCategory} onValueChange={(v) => setExportCategory(v as ExportCategory)} className="grid grid-cols-2 gap-3">
            {exportOptions.map((opt) => (
              <Label key={opt.value} htmlFor={opt.value} className={cn(
                "relative flex flex-col gap-2 p-3.5 cursor-pointer transition-all duration-200 border",
                "[clip-path:polygon(8px_0%,100%_0%,100%_calc(100%-8px),calc(100%-8px)_100%,0%_100%,0%_8px)]",
                exportCategory === opt.value ? "border-primary/40 bg-primary/10" : "border-primary/15 bg-card/50 hover:border-primary/30"
              )}>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value={opt.value} id={opt.value} className="border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground" />
                  <span className={cn("text-xs font-orbitron uppercase tracking-wide", exportCategory === opt.value ? "text-primary" : "text-primary/70")}>{opt.label}</span>
                  <span className={cn("ml-auto", exportCategory === opt.value ? "text-primary" : "text-primary/60")}>{opt.icon}</span>
                </div>
                <span className="ds-t-label text-muted-foreground font-mono pl-6">{opt.desc}</span>
              </Label>
            ))}
          </RadioGroup>
          <Bouton role="primaire" pleine onClick={handleExportData} disabled={isExporting}>
            <Download />
            {isExporting ? t("profile.data.exporting") : t("profile.data.download", { category: getCategoryLabel(exportCategory) })}
          </Bouton>
        </div>
      </Panneau>

      {/* ── Import ── */}
      <Panneau code="Importer">
        <div className="space-y-4">
          <p className="ds-t-label text-muted-foreground tracking-wide">Restaure tes données à partir d'un fichier JSON exporté précédemment.</p>
          <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleFileSelect} />
          <Bouton pleine onClick={() => fileInputRef.current?.click()}>
            <Upload />
            {importFile ? importFile.name : "Choisir un fichier .json"}
          </Bouton>
          {importPreview && (
            <div className="border border-primary/15 bg-primary/[0.03] p-3 space-y-2" style={{ clipPath: "polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)" }}>
              <p className="ds-t-label text-primary/40 font-mono tracking-wider uppercase">APERÇU DE L'IMPORT</p>
              <div className="grid grid-cols-3 gap-2 ds-t-label font-mono">
                <div className="text-center"><span className="text-primary font-bold">{importPreview.goals}</span><br /><span className="text-muted-foreground">Goals</span></div>
                <div className="text-center"><span className="text-primary font-bold">{importPreview.steps}</span><br /><span className="text-muted-foreground">Steps</span></div>
                <div className="text-center"><span className="text-primary font-bold">{importPreview.journalEntries}</span><br /><span className="text-muted-foreground">Journal</span></div>
              </div>
              <Bouton role="primaire" pleine onClick={handleImport} disabled={isImporting}>
                {isImporting
                  ? <><Loader2 className="animate-spin" />Import en cours…</>
                  : <><Upload />Importer les données</>}
              </Bouton>
            </div>
          )}
        </div>
      </Panneau>

      {/* ── Legal ── */}
      <Panneau code="Mentions légales">
        <div className="space-y-3">
          <p className="ds-t-label text-muted-foreground tracking-wide">{t("profile.data.termsDesc")}</p>
          <Link to="/legal">
            <Bouton pleine>
              <Scale /> {t("profile.data.viewTerms")}
            </Bouton>
          </Link>
        </div>
      </Panneau>

      {/* ── Danger Zone ── */}
      <Panneau code="Zone sensible" etat={t("settings.data.danger", "irréversible")} ton="danger" taille="pleine">
        <div className="border border-destructive/20 bg-destructive/5 p-4" style={{ clipPath: "polygon(6px 0%, 100% 0%, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0% 100%, 0% 6px)" }}>
          <div className="flex items-start gap-3">
            <Trash2 className="h-5 w-5 text-destructive/60 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <p className="text-xs font-mono text-destructive/80 tracking-wider uppercase font-bold">Supprimer toutes les données</p>
              <p className="ds-t-label text-destructive/50 font-mono leading-relaxed">Supprime tous tes objectifs, pacts, journal, finances et historiques. Ton compte reste actif mais vide.</p>
              <Bouton role="danger" onClick={() => setShowResetModal(true)}>
                <Trash2 />
                Réinitialiser mes données
              </Bouton>
            </div>
          </div>
        </div>

        <div className="border border-destructive/30 bg-destructive/10 p-4 mt-3" style={{ clipPath: "polygon(6px 0%, 100% 0%, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0% 100%, 0% 6px)" }}>
          <div className="flex items-start gap-3">
            <UserX className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <p className="text-xs font-mono text-destructive tracking-wider uppercase font-bold">Supprimer mon compte</p>
              <p className="ds-t-label text-destructive/60 font-mono leading-relaxed">Efface le compte lui-même, et tout ce qu’il contient. Tu ne pourras plus te reconnecter avec cette adresse. Aucun retour possible.</p>
              <Bouton role="danger" onClick={() => setShowDeleteModal(true)}>
                <UserX />
                Supprimer mon compte
              </Bouton>
            </div>
          </div>
        </div>
      </Panneau>

      <Dialog open={showResetModal} onOpenChange={setShowResetModal}>
        <DialogContent className="bg-card border-destructive/30 max-w-md rounded-none">
          <DialogHeader>
            <DialogTitle className="text-destructive font-orbitron tracking-wider flex items-center gap-2"><AlertCircle className="h-5 w-5" /> RÉINITIALISATION</DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs font-mono">Tape <span className="text-destructive font-bold">{MOT_REINIT}</span> pour confirmer la suppression de toutes tes données.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input value={resetConfirm} onChange={(e) => setResetConfirm(e.target.value)} placeholder={`Tape « ${MOT_REINIT} » pour confirmer`} className="font-mono text-sm border-destructive/25 bg-destructive/5 text-destructive rounded-none" />
          </div>
          <DialogFooter className="gap-2">
            <button onClick={() => { setShowResetModal(false); setResetConfirm(""); }} className="px-4 py-2 border border-primary/12 text-primary/35 hover:text-primary/65 font-mono ds-t-label tracking-[0.22em] uppercase transition-all">ANNULER</button>
            <button onClick={handleDeleteAllData} disabled={resetConfirm !== MOT_REINIT || isResetting} className={cn("px-4 py-2 border border-destructive/40 bg-destructive/20 text-destructive", "hover:bg-destructive/30 hover:border-destructive/60", "font-mono ds-t-label tracking-[0.2em] uppercase transition-colors", "disabled:opacity-30 disabled:cursor-not-allowed")}>
              {isResetting ? <><Loader2 className="inline h-3 w-3 animate-spin mr-1.5" /> SUPPRESSION...</> : "CONFIRMER"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteModal} onOpenChange={(o) => { setShowDeleteModal(o); if (!o) setDeleteConfirm(""); }}>
        <DialogContent className="bg-card border-destructive/40 max-w-md rounded-none">
          <DialogHeader>
            <DialogTitle className="text-destructive font-orbitron tracking-wider flex items-center gap-2">
              <UserX className="h-5 w-5" /> SUPPRESSION DU COMPTE
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs font-mono leading-relaxed">
              Ton compte, tes objectifs, ton journal, tes finances, tes cosmétiques : tout part.
              Tape <span className="text-destructive font-bold">{MOT_SUPPRESSION}</span> pour confirmer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder={`Tape « ${MOT_SUPPRESSION} » pour confirmer`}
              className="font-mono text-sm border-destructive/30 bg-destructive/5 text-destructive rounded-none"
            />
          </div>
          <DialogFooter className="gap-2">
            <button onClick={() => { setShowDeleteModal(false); setDeleteConfirm(""); }} className="px-4 py-2 border border-primary/12 text-primary/35 hover:text-primary/65 font-mono ds-t-label tracking-[0.22em] uppercase transition-all">ANNULER</button>
            <button onClick={handleDeleteAccount} disabled={deleteConfirm !== MOT_SUPPRESSION || isDeleting} className={cn("px-4 py-2 border border-destructive/50 bg-destructive/25 text-destructive", "hover:bg-destructive/40 hover:border-destructive/70", "font-mono ds-t-label tracking-[0.2em] uppercase transition-colors", "disabled:opacity-30 disabled:cursor-not-allowed")}>
              {isDeleting ? <><Loader2 className="inline h-3 w-3 animate-spin mr-1.5" /> SUPPRESSION...</> : "SUPPRIMER DÉFINITIVEMENT"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConsoleReglages>
  );
}
