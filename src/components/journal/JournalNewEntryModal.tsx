import { useState, useEffect, useMemo, useCallback, useRef, lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
const JournalEditor = lazy(() =>
  import("./JournalEditor").then((m) => ({ default: m.JournalEditor })),
);
import { HUDCorner } from "./JournalDecorations";
import { useCreateJournalEntry, useUpdateJournalEntry } from "@/hooks/useJournal";
import type { JournalEntry } from "@/types/journal";
import {
  ACCENT_COLORS, MOOD_OPTIONS, FONT_OPTIONS, SIZE_OPTIONS, ALIGN_OPTIONS,
  getAccent, getMood, getFont,
} from "@/types/journal";
import { useGoals, Goal } from "@/hooks/useGoals";
import { usePact } from "@/hooks/usePact";
import { useAuth } from "@/contexts/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/* LA FENETRE D ECRITURE
 *
 * Elle etait construite a la main : pas de role, pas de piege a focus,
 * pas de blocage du defilement, et surtout la touche Echap ne faisait
 * rien — alors qu un bouton de la barre s appelait « ESC ». Trente-sept
 * elements restaient atteignables au clavier derriere elle.
 *
 * Elle passe sur le dialogue de l application, qui apporte tout cela.
 * Et ce qu on ecrit ne se perd plus : un brouillon est garde a la
 * frappe, et fermer avec du texte modifie demande confirmation.
 */

interface JournalNewEntryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  editingEntry?: JournalEntry | null;
  /** Le texte du prompt du jour, quand l entree part de lui. */
  amorce?: string;
}

function StyleSection({ label, accent, children }: { label: string; accent: { hex: string }; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-[3px] h-[3px] rounded-full" style={{ background: accent.hex }} aria-hidden="true" />
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "max(11px, 0.6875rem)", color: accent.hex, letterSpacing: "0.18em" }}>{label}</span>
        <div className="flex-1 h-px" style={{ background: `${accent.hex}28` }} aria-hidden="true" />
      </div>
      {children}
    </div>
  );
}

function ToggleSwitch({ value, onChange, label, accent }: { value: boolean; onChange: (v: boolean) => void; label: string; accent: { hex: string } }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className="flex items-center gap-2.5 bg-transparent border-none cursor-pointer p-0 min-h-[44px]"
    >
      <div
        className="relative transition-colors duration-200"
        style={{
          width: "36px", height: "18px", borderRadius: "9px",
          background: value ? accent.hex : "var(--journal-input-bg)",
          boxShadow: value ? `0 0 10px ${accent.hex}60` : "none",
          border: `1px solid ${value ? accent.hex : "var(--journal-input-border)"}`,
        }}
      >
        <div
          className="absolute rounded-full transition-[left] duration-200"
          style={{ width: "12px", height: "12px", background: value ? "hsl(var(--background))" : "var(--journal-text-dim)", top: "2px", left: value ? "20px" : "2px" }}
        />
      </div>
      <span className="font-mono ds-t-label tracking-[0.1em]" style={{ color: value ? accent.hex : "var(--journal-text-secondary)" }}>{label}</span>
    </button>
  );
}

const CLE_BROUILLON = (id?: string) => `journal-draft-${id ?? "new"}`;

export function JournalNewEntryModal({ open, onOpenChange, userId, editingEntry, amorce }: JournalNewEntryModalProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [lifeContext, setLifeContext] = useState("");
  const [valence, setValence] = useState(5);
  const [energy, setEnergy] = useState(5);
  const [linkedGoalId, setLinkedGoalId] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [accentId, setAccentId] = useState("cyan");
  const [moodId, setMoodId] = useState("flow");
  const [fontId, setFontId] = useState("mono");
  const [sizeId, setSizeId] = useState("md");
  const [alignId, setAlignId] = useState("left");
  const [lineNums, setLineNums] = useState(false);
  const [panel, setPanel] = useState<"write" | "style" | "meta">("write");
  const [confirmerFermeture, setConfirmerFermeture] = useState(false);
  const [brouillonRestaure, setBrouillonRestaure] = useState(false);

  const { user } = useAuth();
  const { data: pact } = usePact(user?.id);
  const { data: goals = [] } = useGoals(pact?.id);
  const activeGoals = useMemo(() => goals.filter((g: Goal) => g.status !== "fully_completed"), [goals]);

  const createEntry = useCreateJournalEntry();
  const updateEntry = useUpdateJournalEntry();
  const isEditing = !!editingEntry;

  const accent = getAccent(accentId);
  const texteBrut = content.replace(/<[^>]+>/g, "").trim();
  const wordCount = texteBrut.split(/\s+/).filter(Boolean).length;
  const canSave = !!title.trim() && !!texteBrut;

  const cleBrouillon = CLE_BROUILLON(editingEntry?.id);
  const initialRef = useRef<string>("");

  const valeurs = useMemo(
    () => ({ title, content, lifeContext, valence, energy, linkedGoalId, tags, accentId, moodId, fontId, sizeId, alignId, lineNums }),
    [title, content, lifeContext, valence, energy, linkedGoalId, tags, accentId, moodId, fontId, sizeId, alignId, lineNums],
  );
  const sale = initialRef.current !== "" && JSON.stringify(valeurs) !== initialRef.current;

  // ── Ouverture : entree, puis brouillon s il y en a un ──────
  useEffect(() => {
    if (!open) return;
    setPanel("write");
    setBrouillonRestaure(false);

    const depart = editingEntry
      ? {
        title: editingEntry.title, content: editingEntry.content,
        lifeContext: editingEntry.life_context || "", valence: editingEntry.valence_level ?? 5,
        energy: editingEntry.energy_level ?? 5, linkedGoalId: editingEntry.linked_goal_id,
        tags: editingEntry.tags ?? [], accentId: editingEntry.accent_color ?? "cyan",
        moodId: editingEntry.mood ?? "flow", fontId: editingEntry.font_id ?? "mono",
        sizeId: editingEntry.size_id ?? "md", alignId: editingEntry.align_id ?? "left",
        lineNums: editingEntry.line_numbers ?? false,
      }
      : {
        title: "", content: amorce ? `<p>${amorce}</p><p></p>` : "", lifeContext: "",
        valence: 5, energy: 5, linkedGoalId: null as string | null, tags: [] as string[],
        accentId: "cyan", moodId: "flow", fontId: "mono", sizeId: "md", alignId: "left", lineNums: false,
      };

    /* Ce qui a ete tape et jamais enregistre revient. */
    let restaure: typeof depart | null = null;
    try {
      const brut = localStorage.getItem(CLE_BROUILLON(editingEntry?.id));
      if (brut) restaure = { ...depart, ...JSON.parse(brut) };
    } catch { /* brouillon illisible : on l ignore */ }

    const v = restaure ?? depart;
    setTitle(v.title); setContent(v.content); setLifeContext(v.lifeContext);
    setValence(v.valence); setEnergy(v.energy); setLinkedGoalId(v.linkedGoalId);
    setTags(v.tags); setTagInput(""); setAccentId(v.accentId); setMoodId(v.moodId);
    setFontId(v.fontId); setSizeId(v.sizeId); setAlignId(v.alignId); setLineNums(v.lineNums);
    initialRef.current = JSON.stringify(depart);
    setBrouillonRestaure(!!restaure);
  }, [open, editingEntry, amorce]);

  // ── Le brouillon suit la frappe ────────────────────────────
  useEffect(() => {
    if (!open || initialRef.current === "") return;
    const courant = JSON.stringify(valeurs);
    if (courant === initialRef.current) return;
    const id = setTimeout(() => {
      try { localStorage.setItem(cleBrouillon, courant); } catch { /* stockage plein */ }
    }, 400);
    return () => clearTimeout(id);
  }, [open, valeurs, cleBrouillon]);

  /* La page derriere defilait encore sous la fenetre. */
  useEffect(() => {
    if (!open) return;
    const avant = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = avant; };
  }, [open]);

  const oublierBrouillon = useCallback(() => {
    try { localStorage.removeItem(cleBrouillon); } catch { /* sans consequence */ }
  }, [cleBrouillon]);

  const fermer = useCallback(() => {
    initialRef.current = "";
    setConfirmerFermeture(false);
    onOpenChange(false);
  }, [onOpenChange]);

  const demanderFermeture = useCallback(() => {
    if (sale) setConfirmerFermeture(true);
    else { oublierBrouillon(); fermer(); }
  }, [sale, fermer, oublierBrouillon]);

  const addTag = useCallback(() => {
    const nouveau = tagInput.trim().replace(/^[/#]/, "").toLowerCase();
    if (nouveau && !tags.includes(nouveau)) setTags((p) => [...p, nouveau]);
    setTagInput("");
  }, [tagInput, tags]);

  const handleSave = async () => {
    if (!canSave) return;
    const payload = {
      title: title.trim(), content, mood: moodId,
      life_context: lifeContext.trim() || null, valence_level: valence, energy_level: energy,
      linked_goal_id: linkedGoalId || null, tags, is_favorite: editingEntry?.is_favorite ?? false,
      accent_color: accentId, font_id: fontId, size_id: sizeId, align_id: alignId, line_numbers: lineNums,
    };
    try {
      if (isEditing && editingEntry) {
        await updateEntry.mutateAsync({ id: editingEntry.id, userId, updates: payload });
      } else {
        await createEntry.mutateAsync({ user_id: userId, ...payload });
      }
      oublierBrouillon();
      fermer();
    } catch {
      /* Le toast d erreur vient de la mutation ; la fenetre reste
         ouverte, et le brouillon avec elle. */
    }
  };

  const isPending = createEntry.isPending || updateEntry.isPending;
  const PANELS = ["write", "style", "meta"] as const;

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => { if (!o) demanderFermeture(); }}>
        <DialogContent
          className="fixed left-0 top-0 z-[9999] w-screen max-w-none h-[100dvh] max-h-none translate-x-0 translate-y-0 flex flex-col overflow-hidden rounded-none border-0 p-0 gap-0 backdrop-blur-2xl [&>button]:hidden"
          style={{ background: "var(--journal-overlay-bg)" }}
          onEscapeKeyDown={(e) => { if (sale) { e.preventDefault(); setConfirmerFermeture(true); } }}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogTitle className="sr-only">
            {isEditing ? t("journal.modal.editTitle") : t("journal.modal.newTitle")}
          </DialogTitle>
          <DialogDescription className="sr-only">{t("journal.modal.hint")}</DialogDescription>

          {/* Barre */}
          <div
            className="h-14 shrink-0 flex items-center px-4 sm:px-8 gap-3 sm:gap-5"
            style={{ borderBottom: `1px solid ${accent.hex}28`, background: "var(--journal-topbar-bg)" }}
          >
            <div className="flex items-center gap-2">
              <div className="w-[7px] h-[7px] rounded-full" style={{ background: accent.hex, boxShadow: `0 0 8px ${accent.hex}`, animation: "journal-pulse 2s infinite" }} aria-hidden="true" />
              <span className="font-mono ds-t-label tracking-[0.15em] hidden sm:inline" style={{ color: accent.hex }}>
                {isEditing ? t("journal.modal.editTitle") : t("journal.modal.newTitle")}
              </span>
            </div>

            <div className="flex gap-0.5 rounded p-[3px] bg-muted/30" role="tablist" aria-label={t("journal.modal.panels")}>
              {PANELS.map((p) => (
                <button
                  key={p}
                  type="button"
                  role="tab"
                  aria-selected={panel === p}
                  onClick={() => setPanel(p)}
                  className="rounded-sm cursor-pointer transition-all duration-150 font-mono ds-t-label tracking-[0.1em] min-h-[36px]"
                  style={{
                    padding: "5px 14px",
                    background: panel === p ? accent.dim : "transparent",
                    border: panel === p ? `1px solid ${accent.hex}30` : "1px solid transparent",
                    color: panel === p ? accent.hex : "var(--journal-text-secondary)",
                  }}
                >
                  {t(`journal.modal.panel.${p}`)}
                </button>
              ))}
            </div>

            <div className="flex-1" />

            {brouillonRestaure && (
              <span className="font-mono ds-t-label tracking-[0.08em] hidden md:inline" style={{ color: accent.hex }}>
                {t("journal.modal.draftRestored")}
              </span>
            )}

            <span className="font-mono ds-t-label tracking-[0.08em]" style={{ color: "var(--journal-text-secondary)" }}>
              {t("journal.modal.words", { count: wordCount })}
            </span>

            <button
              type="button"
              onClick={demanderFermeture}
              className="rounded cursor-pointer transition-colors font-mono ds-t-label tracking-[0.1em] bg-destructive/10 border border-destructive/30 text-destructive min-h-[36px]"
              style={{ padding: "6px 14px" }}
            >
              {t("journal.modal.close")}
            </button>

            <motion.button
              type="button"
              onClick={handleSave}
              disabled={!canSave || isPending}
              whileHover={canSave ? { scale: 1.03 } : {}}
              whileTap={canSave ? { scale: 0.97 } : {}}
              className="rounded transition-all duration-200 font-orbitron ds-t-label font-bold tracking-[0.12em] min-h-[36px]"
              style={{
                padding: "7px 20px",
                background: canSave ? accent.hex : "var(--journal-input-bg)",
                border: "none",
                color: canSave ? "#000" : "var(--journal-text-secondary)",
                cursor: canSave ? "pointer" : "not-allowed",
                boxShadow: canSave ? `0 0 20px ${accent.hex}50` : "none",
              }}
            >
              {isPending ? "…" : t("journal.modal.save")}
            </motion.button>
          </div>

          {/* Corps */}
          <div className="flex-1 overflow-hidden flex">
            {panel === "write" && (
              <div className="flex-1 flex flex-col overflow-hidden max-w-[720px] mx-auto w-full px-4 sm:px-8">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  aria-label={t("journal.modal.titleLabel")}
                  placeholder={t("journal.modal.titlePlaceholder")}
                  className="bg-transparent border-none outline-none font-orbitron font-bold text-[clamp(18px,3vw,26px)] tracking-[-0.01em] text-foreground"
                  style={{ padding: "32px 0 20px", caretColor: accent.hex, borderBottom: "1px solid var(--journal-input-border)" }}
                />
                <div className="flex-1 overflow-y-auto py-6">
                  <Suspense fallback={<div className="h-32 opacity-60 text-xs font-mono">{t("journal.modal.editorLoading")}</div>}>
                    <JournalEditor content={content} onChange={setContent} placeholder={t("journal.modal.bodyPlaceholder")} />
                  </Suspense>
                </div>
              </div>
            )}

            {panel === "style" && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-8 max-w-[720px] mx-auto w-full">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <StyleSection label={t("journal.modal.accent")} accent={accent}>
                    <div className="grid grid-cols-3 gap-2">
                      {ACCENT_COLORS.map((a) => (
                        <button
                          key={a.id}
                          type="button"
                          aria-pressed={accentId === a.id}
                          onClick={() => setAccentId(a.id)}
                          className="flex flex-col items-center gap-[7px] rounded-[5px] cursor-pointer transition-all duration-150 font-mono ds-t-label tracking-[0.1em] min-h-[44px]"
                          style={{
                            padding: "10px 6px",
                            background: accentId === a.id ? a.dim : "var(--journal-input-bg)",
                            border: `1px solid ${accentId === a.id ? a.hex + "60" : "var(--journal-input-border)"}`,
                            boxShadow: accentId === a.id ? `0 0 16px ${a.hex}25` : "none",
                          }}
                        >
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: a.hex, boxShadow: `0 0 8px ${a.hex}` }} aria-hidden="true" />
                          <span style={{ color: accentId === a.id ? a.hex : "var(--journal-text-secondary)" }}>{a.label}</span>
                        </button>
                      ))}
                    </div>
                  </StyleSection>

                  <StyleSection label={t("journal.modal.mood")} accent={accent}>
                    <div className="grid grid-cols-2 gap-[7px]">
                      {MOOD_OPTIONS.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          aria-pressed={moodId === m.id}
                          onClick={() => setMoodId(m.id)}
                          className="flex items-center gap-2 rounded-[5px] cursor-pointer transition-all duration-150 font-mono ds-t-label tracking-[0.08em] min-h-[44px]"
                          style={{
                            padding: "9px 10px",
                            background: moodId === m.id ? `${m.color}18` : "var(--journal-input-bg)",
                            border: `1px solid ${moodId === m.id ? m.color + "60" : "var(--journal-input-border)"}`,
                          }}
                        >
                          <span style={{ color: m.color, fontSize: "13px" }} aria-hidden="true">{m.sym}</span>
                          <span style={{ color: moodId === m.id ? m.color : "var(--journal-text-secondary)" }}>
                            {t(`journal.moods.${m.id}`, m.label)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </StyleSection>

                  <StyleSection label={t("journal.modal.font")} accent={accent}>
                    <div className="flex flex-col gap-[7px]">
                      {FONT_OPTIONS.map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          aria-pressed={fontId === f.id}
                          onClick={() => setFontId(f.id)}
                          className="text-left rounded-[5px] cursor-pointer transition-all duration-150 text-[0.8125rem] min-h-[44px]"
                          style={{
                            padding: "10px 12px",
                            background: fontId === f.id ? accent.dim : "var(--journal-input-bg)",
                            border: `1px solid ${fontId === f.id ? accent.hex + "50" : "var(--journal-input-border)"}`,
                            color: fontId === f.id ? accent.hex : "var(--journal-text-secondary)",
                            fontFamily: f.css, fontStyle: f.style,
                          }}
                        >
                          {f.label} — <span aria-hidden="true">Aa 01 ◈</span>
                        </button>
                      ))}
                    </div>
                  </StyleSection>

                  <div className="flex flex-col gap-5">
                    <StyleSection label={t("journal.modal.size")} accent={accent}>
                      <div className="flex gap-1.5">
                        {SIZE_OPTIONS.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            aria-pressed={sizeId === s.id}
                            onClick={() => setSizeId(s.id)}
                            className="flex-1 rounded cursor-pointer transition-all duration-150 font-mono ds-t-label tracking-[0.06em] min-h-[44px]"
                            style={{
                              background: sizeId === s.id ? accent.dim : "var(--journal-input-bg)",
                              border: `1px solid ${sizeId === s.id ? accent.hex + "50" : "var(--journal-input-border)"}`,
                              color: sizeId === s.id ? accent.hex : "var(--journal-text-secondary)",
                            }}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </StyleSection>

                    <StyleSection label={t("journal.modal.align")} accent={accent}>
                      <div className="flex gap-1.5">
                        {ALIGN_OPTIONS.map((a) => (
                          <button
                            key={a.id}
                            type="button"
                            aria-pressed={alignId === a.id}
                            onClick={() => setAlignId(a.id)}
                            className="flex-1 rounded cursor-pointer transition-all duration-150 font-mono ds-t-label tracking-[0.08em] min-h-[44px]"
                            style={{
                              background: alignId === a.id ? accent.dim : "var(--journal-input-bg)",
                              border: `1px solid ${alignId === a.id ? accent.hex + "50" : "var(--journal-input-border)"}`,
                              color: alignId === a.id ? accent.hex : "var(--journal-text-secondary)",
                            }}
                          >
                            {a.label}
                          </button>
                        ))}
                      </div>
                    </StyleSection>

                    <StyleSection label={t("journal.modal.lineNumbers")} accent={accent}>
                      <ToggleSwitch
                        value={lineNums}
                        onChange={setLineNums}
                        label={lineNums ? t("common.on", "ON") : t("common.off", "OFF")}
                        accent={accent}
                      />
                    </StyleSection>
                  </div>
                </div>
              </div>
            )}

            {panel === "meta" && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-8 max-w-[720px] mx-auto w-full">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <StyleSection label={t("journal.modal.valence")} accent={accent}>
                    <div className="flex gap-1 mb-2" role="group" aria-label={t("journal.modal.valence")}>
                      {Array.from({ length: 10 }, (_, i) => (
                        <button
                          key={i}
                          type="button"
                          aria-label={t("journal.modal.scaleValue", { value: i + 1 })}
                          aria-pressed={valence === i + 1}
                          onClick={() => setValence(i + 1)}
                          className="flex-1 rounded-sm cursor-pointer transition-all duration-100 border-none"
                          style={{
                            height: "44px",
                            background: i < valence ? accent.hex : "var(--journal-input-bg)",
                            opacity: i < valence ? 0.35 + (i / 10) * 0.65 : 1,
                            boxShadow: i < valence && i === valence - 1 ? `0 0 8px ${accent.hex}` : "none",
                          }}
                        />
                      ))}
                    </div>
                    <div className="flex justify-between">
                      <span className="font-mono ds-t-label tracking-[0.1em]" style={{ color: "var(--journal-text-secondary)" }}>{t("journal.modal.negative")}</span>
                      <span className="font-mono ds-t-label tracking-[0.06em]" style={{ color: accent.hex }}>{valence}/10</span>
                      <span className="font-mono ds-t-label tracking-[0.1em]" style={{ color: "var(--journal-text-secondary)" }}>{t("journal.modal.positive")}</span>
                    </div>
                  </StyleSection>

                  <StyleSection label={t("journal.modal.energy")} accent={accent}>
                    <div className="flex gap-1 mb-2" role="group" aria-label={t("journal.modal.energy")}>
                      {Array.from({ length: 10 }, (_, i) => (
                        <button
                          key={i}
                          type="button"
                          aria-label={t("journal.modal.scaleValue", { value: i + 1 })}
                          aria-pressed={energy === i + 1}
                          onClick={() => setEnergy(i + 1)}
                          className="flex-1 rounded-sm cursor-pointer transition-all duration-100 border-none"
                          style={{
                            height: "44px",
                            background: i < energy ? "#0a84ff" : "var(--journal-input-bg)",
                            opacity: i < energy ? 0.35 + (i / 10) * 0.65 : 1,
                            boxShadow: i < energy && i === energy - 1 ? "0 0 8px #0a84ff" : "none",
                          }}
                        />
                      ))}
                    </div>
                    <div className="flex justify-between">
                      <span className="font-mono ds-t-label tracking-[0.1em]" style={{ color: "var(--journal-text-secondary)" }}>{t("journal.modal.depleted")}</span>
                      <span className="font-mono ds-t-label tracking-[0.06em]" style={{ color: "#0a84ff" }}>{energy}/10</span>
                      <span className="font-mono ds-t-label tracking-[0.1em]" style={{ color: "var(--journal-text-secondary)" }}>{t("journal.modal.charged")}</span>
                    </div>
                  </StyleSection>

                  <StyleSection label={t("journal.modal.tags")} accent={accent}>
                    <div className="flex gap-1.5 flex-wrap mb-2.5 min-h-[28px]">
                      {tags.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setTags((p) => p.filter((x) => x !== tag))}
                          aria-label={t("journal.modal.removeTag", { tag })}
                          className="cursor-pointer rounded-sm font-mono ds-t-label tracking-[0.06em] min-h-[32px]"
                          style={{ color: accent.hex, background: accent.dim, border: `1px solid ${accent.hex}35`, padding: "3px 8px" }}
                        >
                          /{tag} ×
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-[7px]">
                      <input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                        aria-label={t("journal.modal.tags")}
                        placeholder="/tag"
                        className="flex-1 rounded outline-none font-mono ds-t-label min-h-[40px]"
                        style={{
                          padding: "7px 10px", background: "var(--journal-input-bg)",
                          border: "1px solid var(--journal-input-border)",
                          color: "var(--journal-text-secondary)", caretColor: accent.hex,
                        }}
                      />
                      <button
                        type="button"
                        onClick={addTag}
                        aria-label={t("journal.modal.addTag")}
                        className="rounded cursor-pointer text-[0.8125rem] min-w-[44px] min-h-[40px]"
                        style={{ background: accent.dim, border: `1px solid ${accent.hex}40`, color: accent.hex }}
                      >
                        +
                      </button>
                    </div>
                  </StyleSection>

                  <div className="flex flex-col gap-5">
                    <StyleSection label={t("journal.modal.preview")} accent={accent}>
                      <div className="rounded-[5px] relative overflow-hidden" style={{ padding: "14px", background: "var(--journal-input-bg)", border: `1px solid ${accent.hex}20` }}>
                        <HUDCorner pos="tl" size={7} color={accent.hex} />
                        <HUDCorner pos="br" size={7} color={accent.hex} />
                        <p className="font-orbitron ds-t-label font-bold mb-1.5 truncate" style={{ color: "var(--journal-text-primary)" }}>
                          {title || t("journal.modal.titlePlaceholder")}
                        </p>
                        <p style={{ fontFamily: getFont(fontId).css, fontStyle: getFont(fontId).style, fontSize: "11px", color: "var(--journal-text-secondary)", lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {texteBrut || t("journal.modal.bodyPlaceholder")}
                        </p>
                        <div className="mt-2.5 flex items-center gap-2">
                          <span style={{ color: getMood(moodId).color, fontSize: "max(11px, 0.6875rem)" }} aria-hidden="true">{getMood(moodId).sym}</span>
                          <div className="flex-1 h-[2px] rounded-sm overflow-hidden bg-muted/30">
                            <div className="h-full rounded-sm" style={{ width: `${valence * 10}%`, background: accent.hex }} />
                          </div>
                        </div>
                      </div>
                    </StyleSection>

                    <StyleSection label={t("journal.modal.linkedGoal")} accent={accent}>
                      <Select value={linkedGoalId ?? "none"} onValueChange={(v) => setLinkedGoalId(v === "none" ? null : v)}>
                        <SelectTrigger
                          className="h-11 rounded text-xs font-mono"
                          aria-label={t("journal.modal.linkedGoal")}
                          style={{ background: "var(--journal-input-bg)", border: "1px solid var(--journal-input-border)", color: "var(--journal-text-secondary)" }}
                        >
                          <SelectValue placeholder={t("journal.modal.noGoal")} />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border/20 font-mono text-xs">
                          <SelectItem value="none">{t("journal.modal.noGoal")}</SelectItem>
                          {activeGoals.map((g: Goal) => (
                            <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </StyleSection>

                    <StyleSection label={t("journal.modal.context")} accent={accent}>
                      <input
                        value={lifeContext}
                        onChange={(e) => setLifeContext(e.target.value)}
                        aria-label={t("journal.modal.context")}
                        placeholder={t("journal.modal.contextPlaceholder")}
                        className="w-full rounded outline-none font-mono ds-t-label italic min-h-[40px]"
                        style={{
                          padding: "7px 10px", background: "var(--journal-input-bg)",
                          border: "1px solid var(--journal-input-border)",
                          color: "var(--journal-text-secondary)", caretColor: accent.hex,
                        }}
                      />
                    </StyleSection>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Ce qui est ecrit ne se jetait pas : il disparaissait. */}
      <AlertDialog open={confirmerFermeture} onOpenChange={setConfirmerFermeture}>
        <AlertDialogContent className="z-[10000]">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("journal.modal.discardTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("journal.modal.discardDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("journal.modal.keepWriting")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => { oublierBrouillon(); fermer(); }}>
              {t("journal.modal.discard")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
