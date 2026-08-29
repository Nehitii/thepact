import { useState, useRef } from "react";
import { Database, Download, Scale, Target, BookOpen, Wallet, Loader2, Heart, Upload, Trash2, AlertCircle, UserX, RotateCcw } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/socle/contextes/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { differenceInDays, format, parseISO, isValid } from "date-fns";
import { useDateFnsLocale } from "@/socle/i18n/useDateFnsLocale";
import { supabase } from "@/socle/supabase/client";
import { Input } from "@/socle/ui/input";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/socle/ui/radio-group";
import { Label } from "@/socle/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/socle/ui/dialog";
import { useTranslation } from "react-i18next";
import { cn } from "@/socle/outils/utils";
import { ConsoleReglages } from "@/domaines/profil/composants/ConsoleReglages";
import { ReinitialiserLePacte } from "@/domaines/profil/composants/ReinitialiserLePacte";
import { oublierLesPreferences, preferencesPosees } from "@/socle/outils/preferencesAffichage";
import { Bouton, Panneau } from "@/socle/ds/console-ui";
import "@/socle/ds/reglages.css";
import { motifDeLEchec, motifLisible } from "@/domaines/profil/logique/erreursPortabilite";

type ExportCategory = "all" | "goals-steps" | "journal" | "finance" | "health";

/* LES MOTS DE CONFIRMATION SONT EN FRANCAIS.
   Il fallait taper « RESET » — et « DELETE » pour supprimer le compte —
   dans une interface francaise : l utilisateur devait deviner le mot de
   passe de sa propre destruction. */
const MOT_REINIT = "REINITIALISER";
const MOT_SUPPRESSION = "SUPPRIMER";

export default function DataPortability() {
  const { user, session } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const locale = useDateFnsLocale();
  const [exportCategory, setExportCategory] = useState<ExportCategory>("all");
  /* Compte a l ouverture : le stockage local ne previent pas quand il
     change, et rien d autre sur cette page ne le regarde. */
  const [preferencesLocales, setPreferencesLocales] = useState(preferencesPosees);
  const [isExporting, setIsExporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importPreview, setImportPreview] = useState<{
    category: string; exportedAt: string;
    goals: number; steps: number; journalEntries: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetConfirm, setResetConfirm] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  /* `latestLog` etait ecrit dix fois — EXPORT INITIATED, IMPORT FAILED,
     ALL DATA PURGED… — et rendu nulle part : le journal de terminal qui
     l affichait est parti avec la refonte epuree. Dix chaines anglaises
     dans un etat que personne ne lisait. */

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["user-stats", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      /* LE PACTE ACTIF, PAS UN PACTE AU HASARD.
         `pacts.maybeSingle()` supposait qu il n y en ait qu un : a deux
         pactes, PostgREST rend une erreur et le panneau reste vide. Et
         meme sans erreur, rien ne disait lequel etait compte. On prend
         `active_pact_id` — la source dont tout le reste depend, de
         `xp_du_membre` a la carte publique — avec le plus recent en
         repli. */
      const { data: profil } = await supabase
        .from("profiles").select("active_pact_id").eq("id", user.id).maybeSingle();
      let pactId = profil?.active_pact_id ?? null;
      if (!pactId) {
        const { data: dernier } = await supabase
          .from("pacts").select("id").eq("user_id", user.id)
          .order("created_at", { ascending: false }).limit(1).maybeSingle();
        pactId = dernier?.id ?? null;
      }

      /* Sans pacte, on ne demande rien. Le repli precedent envoyait
         `pact_id = ""` — une chaine vide la ou Postgres attend un uuid —
         et la requete echouait en silence, le compte retombant a zero
         par `|| 0`. */
      /* Le nom sert a la confirmation de reinitialisation, la date de
         creation aux deux chiffres repris de « Mon pacte ». */
      const { data: pacte } = pactId
        ? await supabase.from("pacts").select("name, created_at").eq("id", pactId).maybeSingle()
        : { data: null };

      const objectifs = pactId
        ? (await supabase.from("goals").select("id").eq("pact_id", pactId)).data ?? []
        : [];
      const idsObjectifs = objectifs.map((g) => g.id);

      /* Trois requetes independantes, lancees ensemble. Les etapes
         attendaient jusqu ici la liste des objectifs *a l interieur* de
         leur propre argument : cinq allers-retours en file. */
      const [etapesRes, journalRes, succesRes] = await Promise.all([
        idsObjectifs.length
          ? supabase.from("steps").select("id, status").in("goal_id", idsObjectifs)
          : Promise.resolve({ data: [] as { id: string; status: string | null }[] }),
        supabase.from("journal_entries").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("user_achievements").select("*", { count: "exact", head: true })
          .eq("user_id", user.id).not("unlocked_at", "is", null),
      ]);

      const etapes = etapesRes.data ?? [];

      const scelle = pacte?.created_at ? parseISO(pacte.created_at) : null;
      const valide = scelle && isValid(scelle);

      return {
        pactId,
        pactName: pacte?.name ?? "",
        scelleLe: valide ? format(scelle, "d MMM yyyy", { locale }) : null,
        joursTenus: valide ? differenceInDays(new Date(), scelle) : 0,
        goalsCreated: idsObjectifs.length,
        /* « completed » est bien le statut des ETAPES — contrairement
           aux objectifs, ou il n existe pas. */
        stepsCompleted: etapes.filter((s) => s.status === "completed").length,
        totalSteps: etapes.length,
        journalEntries: journalRes.count ?? 0,
        achievementsUnlocked: succesRes.count ?? 0,
      };
    },
    enabled: !!user?.id,
  });

  const handleExportData = async () => {
    if (!user?.id) return;
    setIsExporting(true);
    try {
      /* UNE SAUVEGARDE MUETTE N EN EST PAS UNE.
         Chaque requete de cet export jetait son `error` : une lecture
         qui echoue produisait `null`, et le fichier partait sans les
         objectifs — sans un mot. C est le pire defaut possible pour la
         fonction censee te garantir une copie. `verifier` fait remonter
         l echec au `catch`, qui annonce deja l export rate. */
      const verifier = <T,>(r: { data: T; error: { message: string } | null }, quoi: string): T => {
        if (r.error) throw new Error(`${quoi} : ${r.error.message}`);
        return r.data;
      };

      let exportData: Record<string, unknown> = { exportedAt: new Date().toISOString(), category: exportCategory, user: { email: user.email, id: user.id } };

      /* Le pacte actif, et non « le » pacte : `maybeSingle()` supposait
         qu il n y en ait qu un et echoue des le second. */
      const { data: profilPacte } = await supabase
        .from("profiles").select("active_pact_id").eq("id", user.id).maybeSingle();
      const pactId = profilPacte?.active_pact_id
        ?? verifier(await supabase.from("pacts").select("id").eq("user_id", user.id)
              .order("created_at", { ascending: false }).limit(1).maybeSingle(), "pacte")?.id
        ?? null;
      const pact = pactId
        ? verifier(await supabase.from("pacts").select("*").eq("id", pactId).maybeSingle(), "pacte")
        : null;

      if (exportCategory === "all" || exportCategory === "goals-steps") {
        const goals = pactId
          ? verifier(await supabase.from("goals").select("*").eq("pact_id", pactId), "objectifs") ?? []
          : [];
        const goalIds = goals.map((g) => g.id);
        const steps = goalIds.length
          ? verifier(await supabase.from("steps").select("*").in("goal_id", goalIds), "étapes") ?? []
          : [];
        exportData = { ...exportData, goals, steps };
      }
      if (exportCategory === "all" || exportCategory === "journal") {
        const journal = verifier(await supabase.from("journal_entries").select("*").eq("user_id", user.id), "journal");
        exportData = { ...exportData, journalEntries: journal };
      }
      if (exportCategory === "all" || exportCategory === "health") {
        const { data: healthData, error: healthErr } = await supabase.from("health_data").select("*").eq("user_id", user.id).order("entry_date", { ascending: true });
        if (!healthErr && healthData && healthData.length > 0) {
          if (exportCategory === "health") {
            /* Les seuls mots anglais de la page vivaient dans ce CSV,
                que personne ne relit avant de l ouvrir dans un tableur. */
            const headers = ["Date","Heures de sommeil","Qualité du sommeil","Énergie au réveil","Niveau d’activité","Minutes de mouvement","Niveau de stress","Charge mentale","Verres d’eau","Équilibre des repas","Humeur","Énergie matin","Énergie après-midi","Énergie soir","Notes"];
            const rows = healthData.map((d: Record<string, unknown>) => [d.entry_date, d.sleep_hours ?? "", d.sleep_quality ?? "", d.wake_energy ?? "", d.activity_level ?? "", d.movement_minutes ?? "", d.stress_level ?? "", d.mental_load ?? "", d.hydration_glasses ?? "", d.meal_balance ?? "", d.mood_level ?? "", d.energy_morning ?? "", d.energy_afternoon ?? "", d.energy_evening ?? "", `"${String(d.notes ?? "").replace(/"/g, '""')}"`]);
            const csv = [headers.join(","), ...rows.map((r: unknown[]) => r.join(","))].join("\n");
            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a"); a.href = url; a.download = `overwrite-sante-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(url);
            toast.success(t("profile.data.exportComplete"), { description: t("profile.data.exportSuccess", { category: getCategoryLabel(exportCategory).toLowerCase() }) });
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
        /* `select("*")` emportait aussi `goal_unlock_code` — le code a
           quatre chiffres qui masque le contenu d un objectif — en clair
           dans un fichier fait pour etre range ailleurs. */
        const { data: profileComplet } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
        const profileData = profileComplet
          ? Object.fromEntries(Object.entries(profileComplet).filter(([c]) => c !== "goal_unlock_code"))
          : null;
        const { data: achievements } = await supabase.from("user_achievements").select("*").eq("user_id", user.id);
        exportData = { ...exportData, profile: profileData, pact, achievements, stats };
      }
      const dateStr = new Date().toISOString().split("T")[0].replace(/-/g, "");
      /* L application s appelle Overwrite ; « the-pact » est un nom qu elle
         ne porte plus nulle part ailleurs. */
      const filename = `overwrite-${exportCategory === "all" ? "tout" : exportCategory}-${dateStr}.json`;
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
      toast.success(t("profile.data.exportComplete"), { description: t("profile.data.exportSuccess", { category: getCategoryLabel(exportCategory).toLowerCase() }) });
    } catch {
      toast.error(t("profile.data.exportFailed"), { description: t("profile.data.exportError") });
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

  /* L IMPORT NE RESTAURAIT QUE LE JOURNAL.
     Objectifs et etapes etaient lus dans le fichier, comptes dans
     l apercu — puis ignores, sous un message annoncant « les donnees
     ont ete importees avec succes ».

     Ce qu il fallait resoudre pour les restaurer :

     LES IDENTIFIANTS. Une etape pointe son objectif par `goal_id` ;
     reinserer les objectifs leur donne de nouveaux identifiants. On
     les tire donc nous-memes avant d ecrire, et l on garde la
     correspondance ancien → nouveau. Se fier a l ordre de retour d un
     INSERT aurait marche en pratique, sans etre garanti.

     LE PACTE. Un objectif appartient a un pacte, et celui du fichier
     peut ne plus exister — ou etre celui d un autre compte. On rattache
     au pacte actif de qui importe.

     LES DOUBLONS. On insere toujours du neuf, jamais par-dessus :
     reimporter deux fois cree deux fois, ce qui se corrige a la main.
     L inverse ecraserait un travail plus recent que la sauvegarde, ce
     qui ne se corrige pas. L ecran le dit avant. */
  const handleImport = async () => {
    if (!importFile || !user?.id) return;
    setIsImporting(true);
    try {
      const text = await importFile.text();
      const data = JSON.parse(text);
      const entrees = Array.isArray(data.journalEntries) ? data.journalEntries : [];
      const objectifs = Array.isArray(data.goals) ? data.goals : [];
      const etapes = Array.isArray(data.steps) ? data.steps : [];

      if (!entrees.length && !objectifs.length) {
        toast.info("Rien à restaurer", {
          description: "Ce fichier ne contient ni objectif ni entrée de journal.",
        });
        return;
      }

      const fait: string[] = [];

      /* ── LE JOURNAL ── */
      if (entrees.length) {
        const lignes = entrees.map((e: Record<string, unknown>) => {
          const { id: _i, ...reste } = e;
          return { ...reste, user_id: user.id };
        });
        const { error } = await supabase.from("journal_entries").insert(lignes);
        if (error) throw new Error(`journal : ${error.message}`);
        fait.push(`${lignes.length} entrée${lignes.length > 1 ? "s" : ""} de journal`);
      }

      /* ── LES OBJECTIFS, PUIS LEURS ÉTAPES ── */
      if (objectifs.length) {
        const { data: profil } = await supabase
          .from("profiles").select("active_pact_id").eq("id", user.id).maybeSingle();
        let pactId = profil?.active_pact_id ?? null;
        if (!pactId) {
          const { data: dernier } = await supabase
            .from("pacts").select("id").eq("user_id", user.id)
            .order("created_at", { ascending: false }).limit(1).maybeSingle();
          pactId = dernier?.id ?? null;
        }
        if (!pactId) {
          throw new Error("Aucun pacte pour accueillir ces objectifs. Crée-en un d’abord.");
        }

        const correspondance = new Map<string, string>();
        const lignesObjectifs = objectifs.map((g: Record<string, unknown>) => {
          const { id: ancien, created_at: _c, updated_at: _u, pact_id: _p, ...reste } = g;
          const nouveau = crypto.randomUUID();
          if (typeof ancien === "string") correspondance.set(ancien, nouveau);
          return { ...reste, id: nouveau, pact_id: pactId };
        });

        const { error: erreurObjectifs } = await supabase.from("goals").insert(lignesObjectifs);
        if (erreurObjectifs) throw new Error(`objectifs : ${erreurObjectifs.message}`);
        fait.push(`${lignesObjectifs.length} objectif${lignesObjectifs.length > 1 ? "s" : ""}`);

        /* Une etape dont l objectif n est pas du lot n a nulle part ou
           aller : on la laisse plutot que de l accrocher au hasard. */
        const lignesEtapes = etapes
          .filter((s: Record<string, unknown>) => correspondance.has(String(s.goal_id)))
          .map((s: Record<string, unknown>) => {
            const { id: _i, created_at: _c, updated_at: _u, goal_id, ...reste } = s;
            return { ...reste, goal_id: correspondance.get(String(goal_id))! };
          });

        if (lignesEtapes.length) {
          const { error: erreurEtapes } = await supabase.from("steps").insert(lignesEtapes);
          if (erreurEtapes) throw new Error(`étapes : ${erreurEtapes.message}`);
          fait.push(`${lignesEtapes.length} étape${lignesEtapes.length > 1 ? "s" : ""}`);
        }

        const orphelines = etapes.length - lignesEtapes.length;
        if (orphelines > 0) fait.push(`${orphelines} étape${orphelines > 1 ? "s" : ""} sans objectif, ignorée${orphelines > 1 ? "s" : ""}`);
      }

      await queryClient.invalidateQueries({ queryKey: ["user-stats", user.id] });

      toast.success("Restauration terminée", { description: `${fait.join(", ")}.` });
      setImportFile(null); setImportPreview(null);
    } catch (e) {
      toast.error("Erreur d’import", {
        description: e instanceof Error ? e.message : String(e),
      });
    } finally { setIsImporting(false); }
  };

  const handleDeleteAllData = async () => {
    if (resetConfirm !== MOT_REINIT) return;
    setIsResetting(true);
    try {
      const { data, error } = await supabase.functions.invoke("delete-all-data", { headers: { Authorization: `Bearer ${session?.access_token}` } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("Données supprimées", { description: "Toutes tes données ont été réinitialisées." });
      setShowResetModal(false); setResetConfirm("");
    } catch (e) {
      toast.error("Erreur", { description: e instanceof Error ? e.message : String(e) });
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

  /* UNE SEULE TABLE DE CHIFFRES DANS LA CONSOLE.
     « Mon pacte » s ouvrait sur quatre chiffres, « Mes donnees » sur
     quatre autres — dont deux les memes. Aucune des deux n est un
     reglage : une console de reglages qui commence par un tableau de
     bord, et deux fois.

     Les deux valeurs qui n existaient que la-bas — la date de
     scellement et les jours tenus — rejoignent celle-ci. */
  const statItems = [
    { value: stats?.scelleLe || "—", label: "Scellé le" },
    { value: stats?.joursTenus ?? 0, label: "Jours tenus" },
    { value: stats?.goalsCreated || 0, label: t("profile.data.stats.goalsCreated") },
    { value: stats?.stepsCompleted || 0, label: t("profile.data.stats.stepsCompleted") },
    { value: stats?.journalEntries || 0, label: t("profile.data.stats.journalEntries") },
    { value: stats?.achievementsUnlocked || 0, label: t("profile.data.stats.achievements") },
  ];

  return (
    <ConsoleReglages titre={t("profile.data.title")} note={t("profile.data.subtitle")}>
      {/* ── Stats ── */}
      <Panneau code="Ce que tu as produit" etat={t("settings.console.synced", "synchronisé")} ton="actif" rang="primaire">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
                {/* Les deux premiers comptes disent ce que le FICHIER
                     contient ; seul le journal sera restaure. L apercu
                     les presentait a l identique, ce qui laissait croire
                     que tout reviendrait. */}
                <div className="text-center"><span className="text-primary font-bold">{importPreview.goals}</span><br /><span className="text-muted-foreground">Objectifs</span></div>
                <div className="text-center"><span className="text-primary font-bold">{importPreview.steps}</span><br /><span className="text-muted-foreground">Étapes</span></div>
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

      {/* ── LES PRÉFÉRENCES D AFFICHAGE ──

          Dix-sept reglages de lecture vivent dans le navigateur : la
          vue du calendrier, le tri du registre, la forme de la
          wishlist, le fond de la page de concentration. Aucun ne
          merite une colonne en base, mais rien ne les recensait — donc
          rien ne pouvait les remettre a zero. Une application coincee
          dans un etat bizarre n avait pas d autre porte de sortie que
          vider les donnees du site, ce qui deconnecte.

          Ce panneau ne touche a AUCUNE donnee : ni objectif, ni
          journal, ni seance en cours, ni brouillon, ni lien colle. */}
      <Panneau
        code="Préférences d’affichage"
        etat={preferencesLocales === 0
          ? "aucune"
          : `${preferencesLocales} ${preferencesLocales > 1 ? "posées" : "posée"}`}
      >
        <div className="space-y-3">
          <p className="ds-t-label text-muted-foreground tracking-wide">
            Vues, tris, mises en page et ambiances, retenus dans ce
            navigateur. Les remettre à zéro n’efface aucune donnée.
          </p>
          <Bouton
            pleine
            disabled={preferencesLocales === 0}
            onClick={() => {
              const n = oublierLesPreferences();
              setPreferencesLocales(0);
              toast.success(
                n === 0
                  ? "Rien à remettre à zéro"
                  : `${n} ${n > 1 ? "préférences remises" : "préférence remise"} à zéro`,
                { description: "Les pages reprendront leur présentation par défaut." },
              );
            }}
          >
            <RotateCcw /> Remettre à zéro
          </Bouton>
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
      {/* LES TROIS DESTRUCTIONS, DU MOINS GRAVE AU PIRE.
           La reinitialisation du pacte vivait dans « Regles du pacte »,
           sous un panneau nomme « Zone sensible » — le meme nom que
           celui-ci, avec un contenu different. Le rail en affichait deux,
           et il fallait connaitre les deux pour savoir ce qu on pouvait
           detruire. Ensemble, on voit l echelle et l on choisit son
           barreau. */}
      <Panneau code="Zone sensible" etat={t("settings.data.danger", "irréversible")} ton="danger" taille="pleine">
        <ReinitialiserLePacte pactId={stats?.pactId ?? undefined} pactName={stats?.pactName ?? ""} />

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
