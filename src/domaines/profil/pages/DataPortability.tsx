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
import { PreferencesLocales } from "@/domaines/profil/composants/PreferencesLocales";
import { ZoneSensible } from "@/domaines/profil/composants/ZoneSensible";
import { MOT_REINIT, MOT_SUPPRESSION, peutProceder } from "@/domaines/profil/logique/zoneSensible";
import { useStatistiquesDuPacte } from "@/domaines/profil/hooks/useStatistiquesDuPacte";
import { construireExport, csvDeSante, type Lire } from "@/domaines/profil/logique/exportDesDonnees";
import {
  preparerLaRestauration, riensARestaurer, bilanDeRestauration, apercuDuFichier,
} from "@/domaines/profil/logique/importDesDonnees";
import { Bouton, Panneau } from "@/socle/ds/console-ui";
import "@/socle/ds/reglages.css";
import { motifDeLEchec, motifLisible } from "@/domaines/profil/logique/erreursPortabilite";

type ExportCategory = "all" | "goals-steps" | "journal" | "finance" | "health";

/* LES MOTS DE CONFIRMATION SONT EN FRANCAIS.
   Il fallait taper « RESET » — et « DELETE » pour supprimer le compte —
   dans une interface francaise : l utilisateur devait deviner le mot de
   passe de sa propre destruction. */

export default function DataPortability() {
  const { user, session } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const locale = useDateFnsLocale();
  const [exportCategory, setExportCategory] = useState<ExportCategory>("all");
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

  /* Les statistiques du pacte vivent dans
     `hooks/useStatistiquesDuPacte.ts` : la lecture y est nouee a la
     base, mais la MISE EN FORME en est sortie et s eprouve. */
  const { data: stats, isLoading: statsLoading } = useStatistiquesDuPacte(user?.id, locale);

  /* CE QUE L EXPORT DEMANDE AU MONDE, TRADUIT EN SUPABASE.
     La construction du fichier vit dans `logique/exportDesDonnees.ts`
     et ne connait plus la base : c est ce qui la rend eprouvable. */
  const lire: Lire = async (d) => {
    let q = supabase.from(d.table).select(d.colonnes ?? "*");
    for (const [colonne, valeur] of Object.entries(d.ou ?? {})) q = q.eq(colonne, valeur);
    if (d.parmi) q = q.in(d.parmi[0], d.parmi[1]);
    if (d.ordre) q = q.order(d.ordre[0], { ascending: d.ordre[1] });
    if (d.limite) q = q.limit(d.limite);
    return d.unique ? await q.maybeSingle() : await q;
  };

  const telecharger = (contenu: string, type: string, nom: string) => {
    const url = URL.createObjectURL(new Blob([contenu], { type }));
    const a = document.createElement("a");
    a.href = url; a.download = nom;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportData = async () => {
    if (!user?.id) return;
    setIsExporting(true);
    const jour = new Date().toISOString().slice(0, 10);
    try {
      /* La sante seule s exporte en tableur : c est la seule categorie
         qu on ouvre pour la LIRE, pas pour la remettre. */
      if (exportCategory === "health") {
        const r = await lire({ table: "health_data", colonnes: "*",
          ou: { user_id: user.id }, ordre: ["entry_date", true] });
        if (r.error) throw new Error(`santé : ${r.error.message}`);
        const releves = (r.data as Record<string, unknown>[]) ?? [];
        if (releves.length) {
          telecharger(csvDeSante(releves), "text/csv;charset=utf-8;", `overwrite-sante-${jour}.csv`);
          toast.success(t("profile.data.exportComplete"), { description: t("profile.data.exportSuccess", { category: getCategoryLabel(exportCategory).toLowerCase() }) });
          return;
        }
      }
      const contenu = await construireExport({
        lire, categorie: exportCategory, utilisateur: { id: user.id, email: user.email }, stats,
      });
      /* L application s appelle Overwrite ; « the-pact » est un nom
         qu elle ne porte plus nulle part ailleurs. */
      telecharger(JSON.stringify(contenu, null, 2), "application/json",
        `overwrite-${exportCategory === "all" ? "tout" : exportCategory}-${jour.replace(/-/g, "")}.json`);
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
      setImportPreview(apercuDuFichier(JSON.parse(await file.text())));
    } catch {
      toast.error("Fichier invalide", { description: "Le fichier n'est pas un export JSON valide." });
      setImportFile(null); setImportPreview(null);
    }
  };

  /* CE QUI RESTE ICI, C EST L ECRITURE.
     La preparation des lignes — identifiants neufs, proprietaire
     reecrit, etapes orphelines ecartees et comptees — vit dans
     `logique/importDesDonnees.ts`, ou elle s eprouve.

     LES DOUBLONS restent une decision de cet ecran : on insere toujours
     du neuf, jamais par-dessus. Reimporter deux fois cree deux fois, ce
     qui se corrige a la main ; l inverse ecraserait un travail plus
     recent que la sauvegarde, ce qui ne se corrige pas. */
  const handleImport = async () => {
    if (!importFile || !user?.id) return;
    setIsImporting(true);
    try {
      const fichier = JSON.parse(await importFile.text());

      /* Le pacte d accueil se cherche AVANT de preparer : sans lui il
         n y a nulle part ou poser les objectifs, et mieux vaut le dire
         avant d avoir ecrit la moindre entree de journal. */
      let pacteId: string | null = null;
      if (Array.isArray(fichier?.goals) && fichier.goals.length) {
        const { data: profil } = await supabase
          .from("profiles").select("active_pact_id").eq("id", user.id).maybeSingle();
        pacteId = profil?.active_pact_id ?? null;
        if (!pacteId) {
          const { data: dernier } = await supabase
            .from("pacts").select("id").eq("user_id", user.id)
            .order("created_at", { ascending: false }).limit(1).maybeSingle();
          pacteId = dernier?.id ?? null;
        }
        if (!pacteId) throw new Error("Aucun pacte pour accueillir ces objectifs. Crée-en un d'abord.");
      }

      const prete = preparerLaRestauration({
        fichier, utilisateurId: user.id, pacteId: pacteId ?? "",
      });
      if (riensARestaurer(prete)) {
        toast.info("Rien à restaurer", {
          description: "Ce fichier ne contient ni objectif ni entrée de journal.",
        });
        return;
      }

      const ecrire = async (table: "journal_entries" | "goals" | "steps", lignes: Record<string, unknown>[], quoi: string) => {
        if (!lignes.length) return;
        const { error } = await supabase.from(table).insert(lignes as never);
        if (error) throw new Error(`${quoi} : ${error.message}`);
      };
      await ecrire("journal_entries", prete.journal, "journal");
      await ecrire("goals", prete.objectifs, "objectifs");
      await ecrire("steps", prete.etapes, "étapes");

      await queryClient.invalidateQueries({ queryKey: ["user-stats", user.id] });
      toast.success("Restauration terminée", { description: `${bilanDeRestauration(prete).join(", ")}.` });
      setImportFile(null); setImportPreview(null);
    } catch (e) {
      toast.error("Erreur d'import", { description: e instanceof Error ? e.message : String(e) });
    } finally { setIsImporting(false); }
  };

  const handleDeleteAllData = async () => {
    if (!peutProceder(resetConfirm, MOT_REINIT, isResetting)) return;
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
    if (!peutProceder(deleteConfirm, MOT_SUPPRESSION, isDeleting)) return;
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

      {/* Les reglages qui vivent dans le navigateur : ils ne sont pas
          des donnees du compte, et le panneau le dit lui-meme. */}
      <PreferencesLocales />

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

      {/* CE QUI NE SE DEFAIT PAS. Sorti dans son propre composant :
          un panneau et deux dialogues de recopie, qui n ont rien a
          voir avec exporter ou importer. */}
      <ZoneSensible
        resetConfirm={resetConfirm}
        setResetConfirm={setResetConfirm}
        showResetModal={showResetModal}
        setShowResetModal={setShowResetModal}
        isResetting={isResetting}
        onReinitialiser={handleDeleteAllData}
        deleteConfirm={deleteConfirm}
        setDeleteConfirm={setDeleteConfirm}
        showDeleteModal={showDeleteModal}
        setShowDeleteModal={setShowDeleteModal}
        isDeleting={isDeleting}
        onSupprimerLeCompte={handleDeleteAccount}
        pactId={stats?.pactId ?? undefined}
        pactName={stats?.pactName ?? ""}
      />
    </ConsoleReglages>
  );
}
