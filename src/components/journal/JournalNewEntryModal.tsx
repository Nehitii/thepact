import { useState, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { JournalEditor } from "./JournalEditor";
import { HUDCorner } from "./JournalDecorations";
import { useCreateJournalEntry, useUpdateJournalEntry } from "@/hooks/useJournal";
import type { JournalEntry } from "@/types/journal";
import {
  ACCENT_COLORS, MOOD_OPTIONS, FONT_OPTIONS, SIZE_OPTIONS, ALIGN_OPTIONS,
  getAccent, getMood, getFont, getSize, getAlign,
} from "@/types/journal";
import { useGoals, Goal } from "@/hooks/useGoals";
import { usePact } from "@/hooks/usePact";
import { useAuth } from "@/contexts/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface JournalNewEntryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  editingEntry?: JournalEntry | null;
}

function StyleSection({ label, accent, children }: { label: string; accent: { hex: string }; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-[3px] h-[3px] rounded-full" style={{ background: accent.hex }} />
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", color: accent.hex, opacity: 0.6, letterSpacing: "0.18em" }}>{label}</span>
        <div className="flex-1 h-px" style={{ background: `${accent.hex}18` }} />
      </div>
      {children}
    </div>
  );
}

function ToggleSwitch({ value, onChange, label, accent }: { value: boolean; onChange: (v: boolean) => void; label: string; accent: { hex: string } }) {
  return (
    <button onClick={() => onChange(!value)} className="flex items-center gap-2.5 bg-transparent border-none cursor-pointer p-0">
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
          style={{
            width: "12px", height: "12px",
            background: value ? "hsl(var(--background))" : "var(--journal-text-dim)",
            top: "2px",
            left: value ? "20px" : "2px",
          }}
        />
      </div>
      <span className="font-mono text-[10px] tracking-[0.1em]" style={{ color: value ? accent.hex : "var(--journal-text-dim)" }}>{label}</span>
    </button>
  );
}

export function JournalNewEntryModal({ open, onOpenChange, userId, editingEntry }: JournalNewEntryModalProps) {
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

  const { user } = useAuth();
  const { data: pact } = usePact(user?.id);
  const { data: goals = [] } = useGoals(pact?.id);
  const activeGoals = useMemo(() => goals.filter((g: Goal) => g.status !== "fully_completed"), [goals]);

  const createEntry = useCreateJournalEntry();
  const updateEntry = useUpdateJournalEntry();
  const isEditing = !!editingEntry;

  const accent = getAccent(accentId);
  const wordCount = content.replace(/<[^>]+>/g, "").split(/\s+/).filter(Boolean).length;
  const canSave = title.trim() && content.trim().replace(/<[^>]+>/g, "").trim();

  useEffect(() => {
    if (open) {
      setPanel("write");
      if (editingEntry) {
        setTitle(editingEntry.title); setContent(editingEntry.content);
        setLifeContext(editingEntry.life_context || ""); setValence(editingEntry.valence_level ?? 5);
        setEnergy(editingEntry.energy_level ?? 5); setLinkedGoalId(editingEntry.linked_goal_id);
        setTags(editingEntry.tags ?? []); setAccentId(editingEntry.accent_color ?? "cyan");
        setMoodId(editingEntry.mood ?? "flow"); setFontId(editingEntry.font_id ?? "mono");
        setSizeId(editingEntry.size_id ?? "md"); setAlignId(editingEntry.align_id ?? "left");
        setLineNums(editingEntry.line_numbers ?? false);
      } else {
        setTitle(""); setContent(""); setLifeContext(""); setValence(5); setEnergy(5);
        setLinkedGoalId(null); setTags([]); setTagInput(""); setAccentId("cyan");
        setMoodId("flow"); setFontId("mono"); setSizeId("md"); setAlignId("left"); setLineNums(false);
      }
    }
  }, [open, editingEntry]);

  const addTag = useCallback(() => {
    const t = tagInput.trim().replace(/^[/#]/, "").toLowerCase();
    if (t && !tags.includes(t)) setTags((p) => [...p, t]);
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

    if (isEditing && editingEntry) {
      await updateEntry.mutateAsync({ id: editingEntry.id, userId, updates: payload });
    } else {
      await createEntry.mutateAsync({ user_id: userId, ...payload });
    }
    onOpenChange(false);
  };

  const isPending = createEntry.isPending || updateEntry.isPending;
  const PANELS = ["write", "style", "meta"] as const;

  if (!open) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex flex-col overflow-hidden backdrop-blur-2xl"
        style={{ background: "var(--journal-overlay-bg)" }}
      >
        {/* Top bar */}
        <div
          className="h-14 shrink-0 flex items-center px-4 sm:px-8 gap-3 sm:gap-5"
          style={{ borderBottom: `1px solid ${accent.hex}18`, background: "var(--journal-topbar-bg)" }}
        >
          <div className="flex items-center gap-2">
            <div className="w-[7px] h-[7px] rounded-full" style={{ background: accent.hex, boxShadow: `0 0 8px ${accent.hex}`, animation: "journal-pulse 2s infinite" }} />
            <span className="font-mono text-[10px] tracking-[0.15em]" style={{ color: accent.hex, opacity: 0.7 }}>
              {isEditing ? "// EDIT_ENTRY" : "// NEW_ENTRY"}
            </span>
          </div>

          <div className="flex gap-0.5 rounded p-[3px] bg-muted/30">
            {PANELS.map((p) => (
              <button
                key={p}
                onClick={() => setPanel(p)}
                className="rounded-sm cursor-pointer transition-all duration-150 font-mono text-[10px] tracking-[0.1em]"
                style={{
                  padding: "5px 14px",
                  background: panel === p ? accent.dim : "transparent",
                  border: panel === p ? `1px solid ${accent.hex}30` : "1px solid transparent",
                  color: panel === p ? accent.hex : "var(--journal-text-dim)",
                }}
              >
                {p.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="flex-1" />

          <span className="font-mono text-[9px] tracking-[0.08em]" style={{ color: "var(--journal-text-dimmer)" }}>
            {wordCount} <span style={{ opacity: 0.5 }}>WORDS</span>
          </span>

          <button
            onClick={() => onOpenChange(false)}
            className="rounded cursor-pointer transition-colors font-mono text-[10px] tracking-[0.1em] bg-destructive/10 border border-destructive/20 text-destructive"
            style={{ padding: "6px 14px" }}
          >
            ESC
          </button>

          <motion.button
            onClick={handleSave}
            disabled={!canSave || isPending}
            whileHover={canSave ? { scale: 1.03 } : {}}
            whileTap={canSave ? { scale: 0.97 } : {}}
            className="rounded transition-all duration-200 font-orbitron text-[10px] font-bold tracking-[0.12em]"
            style={{
              padding: "7px 20px",
              background: canSave ? accent.hex : "var(--journal-input-bg)",
              border: "none",
              color: canSave ? "#000" : "var(--journal-text-dimmer)",
              cursor: canSave ? "pointer" : "not-allowed",
              boxShadow: canSave ? `0 0 20px ${accent.hex}50` : "none",
            }}
          >
            {isPending ? "..." : "SAVE"}
          </motion.button>
        </div>

        {/* Panel body */}
        <div className="flex-1 overflow-hidden flex">
          {/* WRITE */}
          {panel === "write" && (
            <div className="flex-1 flex flex-col overflow-hidden max-w-[720px] mx-auto w-full px-4 sm:px-8">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="ENTRY TITLE..."
                className="bg-transparent border-none outline-none font-orbitron font-bold text-[clamp(18px,3vw,26px)] tracking-[-0.01em] text-foreground"
                style={{
                  padding: "32px 0 20px",
                  caretColor: accent.hex,
                  borderBottom: "1px solid var(--journal-input-border)",
                }}
              />
              <div className="flex-1 overflow-y-auto py-6">
                <JournalEditor content={content} onChange={setContent} placeholder="Begin writing..." />
              </div>
            </div>
          )}

          {/* STYLE */}
          {panel === "style" && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 max-w-[720px] mx-auto w-full">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <StyleSection label="ACCENT COLOR" accent={accent}>
                  <div className="grid grid-cols-3 gap-2">
                    {ACCENT_COLORS.map((a) => (
                      <button
                        key={a.id}
                        onClick={() => setAccentId(a.id)}
                        className="flex flex-col items-center gap-[7px] rounded-[5px] cursor-pointer transition-all duration-150 font-mono text-[9px] tracking-[0.1em]"
                        style={{
                          padding: "10px 6px",
                          background: accentId === a.id ? a.dim : "var(--journal-input-bg)",
                          border: `1px solid ${accentId === a.id ? a.hex + "50" : "var(--journal-input-border)"}`,
                          boxShadow: accentId === a.id ? `0 0 16px ${a.hex}25` : "none",
                        }}
                      >
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: a.hex, boxShadow: `0 0 8px ${a.hex}` }} />
                        <span style={{ color: accentId === a.id ? a.hex : "var(--journal-text-dim)" }}>{a.label}</span>
                      </button>
                    ))}
                  </div>
                </StyleSection>

                <StyleSection label="MOOD" accent={accent}>
                  <div className="grid grid-cols-2 gap-[7px]">
                    {MOOD_OPTIONS.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setMoodId(m.id)}
                        className="flex items-center gap-2 rounded-[5px] cursor-pointer transition-all duration-150 font-mono text-[9px] tracking-[0.08em]"
                        style={{
                          padding: "9px 10px",
                          background: moodId === m.id ? `${m.color}10` : "var(--journal-input-bg)",
                          border: `1px solid ${moodId === m.id ? m.color + "40" : "var(--journal-input-border)"}`,
                        }}
                      >
                        <span style={{ color: m.color, fontSize: "13px" }}>{m.sym}</span>
                        <span style={{ color: moodId === m.id ? m.color : "var(--journal-text-dim)" }}>{m.label}</span>
                      </button>
                    ))}
                  </div>
                </StyleSection>

                <StyleSection label="FONT" accent={accent}>
                  <div className="flex flex-col gap-[7px]">
                    {FONT_OPTIONS.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setFontId(f.id)}
                        className="text-left rounded-[5px] cursor-pointer transition-all duration-150 text-[13px]"
                        style={{
                          padding: "10px 12px",
                          background: fontId === f.id ? accent.dim : "var(--journal-input-bg)",
                          border: `1px solid ${fontId === f.id ? accent.hex + "40" : "var(--journal-input-border)"}`,
                          color: fontId === f.id ? accent.hex : "var(--journal-text-secondary)",
                          fontFamily: f.css, fontStyle: f.style,
                        }}
                      >
                        {f.label} — <span style={{ opacity: 0.5 }}>Aa 01 ◈</span>
                      </button>
                    ))}
                  </div>
                </StyleSection>

                <div className="flex flex-col gap-5">
                  <StyleSection label="SIZE" accent={accent}>
                    <div className="flex gap-1.5">
                      {SIZE_OPTIONS.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => setSizeId(s.id)}
                          className="flex-1 rounded cursor-pointer transition-all duration-150 font-mono text-[10px] tracking-[0.06em]"
                          style={{
                            padding: "8px 4px",
                            background: sizeId === s.id ? accent.dim : "var(--journal-input-bg)",
                            border: `1px solid ${sizeId === s.id ? accent.hex + "40" : "var(--journal-input-border)"}`,
                            color: sizeId === s.id ? accent.hex : "var(--journal-text-dim)",
                          }}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </StyleSection>

                  <StyleSection label="ALIGNMENT" accent={accent}>
                    <div className="flex gap-1.5">
                      {ALIGN_OPTIONS.map((a) => (
                        <button
                          key={a.id}
                          onClick={() => setAlignId(a.id)}
                          className="flex-1 rounded cursor-pointer transition-all duration-150 font-mono text-[9px] tracking-[0.08em]"
                          style={{
                            padding: "8px 4px",
                            background: alignId === a.id ? accent.dim : "var(--journal-input-bg)",
                            border: `1px solid ${alignId === a.id ? accent.hex + "40" : "var(--journal-input-border)"}`,
                            color: alignId === a.id ? accent.hex : "var(--journal-text-dim)",
                          }}
                        >
                          {a.label}
                        </button>
                      ))}
                    </div>
                  </StyleSection>

                  <StyleSection label="LINE NUMBERS" accent={accent}>
                    <ToggleSwitch value={lineNums} onChange={setLineNums} label={lineNums ? "ON" : "OFF"} accent={accent} />
                  </StyleSection>
                </div>
              </div>
            </div>
          )}

          {/* META */}
          {panel === "meta" && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 max-w-[720px] mx-auto w-full">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <StyleSection label="EMOTIONAL VALENCE" accent={accent}>
                  <div className="flex gap-1 mb-2">
                    {Array.from({ length: 10 }, (_, i) => (
                      <button
                        key={i}
                        onClick={() => setValence(i + 1)}
                        className="flex-1 rounded-sm cursor-pointer transition-all duration-100 border-none"
                        style={{
                          height: "28px",
                          background: i < valence ? accent.hex : "var(--journal-input-bg)",
                          opacity: i < valence ? 0.3 + (i / 10) * 0.7 : 1,
                          boxShadow: i < valence && i === valence - 1 ? `0 0 8px ${accent.hex}` : "none",
                        }}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between">
                    <span className="font-mono text-[9px] tracking-[0.1em]" style={{ color: "var(--journal-text-dimmer)" }}>NEGATIVE</span>
                    <span className="font-mono text-[11px] tracking-[0.06em]" style={{ color: accent.hex }}>{valence}/10</span>
                    <span className="font-mono text-[9px] tracking-[0.1em]" style={{ color: "var(--journal-text-dimmer)" }}>POSITIVE</span>
                  </div>
                </StyleSection>

                <StyleSection label="ENERGY LEVEL" accent={accent}>
                  <div className="flex gap-1 mb-2">
                    {Array.from({ length: 10 }, (_, i) => (
                      <button
                        key={i}
                        onClick={() => setEnergy(i + 1)}
                        className="flex-1 rounded-sm cursor-pointer transition-all duration-100 border-none"
                        style={{
                          height: "28px",
                          background: i < energy ? "#0a84ff" : "var(--journal-input-bg)",
                          opacity: i < energy ? 0.3 + (i / 10) * 0.7 : 1,
                          boxShadow: i < energy && i === energy - 1 ? "0 0 8px #0a84ff" : "none",
                        }}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between">
                    <span className="font-mono text-[9px] tracking-[0.1em]" style={{ color: "var(--journal-text-dimmer)" }}>DEPLETED</span>
                    <span className="font-mono text-[11px] tracking-[0.06em]" style={{ color: "#0a84ff" }}>{energy}/10</span>
                    <span className="font-mono text-[9px] tracking-[0.1em]" style={{ color: "var(--journal-text-dimmer)" }}>SUPERCHARGED</span>
                  </div>
                </StyleSection>

                <StyleSection label="TAGS" accent={accent}>
                  <div className="flex gap-1.5 flex-wrap mb-2.5 min-h-[28px]">
                    {tags.map((t) => (
                      <span
                        key={t}
                        onClick={() => setTags((p) => p.filter((x) => x !== t))}
                        className="cursor-pointer rounded-sm font-mono text-[10px] tracking-[0.06em]"
                        style={{ color: accent.hex, background: accent.dim, border: `1px solid ${accent.hex}25`, padding: "3px 8px" }}
                      >
                        /{t} ×
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-[7px]">
                    <input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addTag()}
                      placeholder="/tag"
                      className="flex-1 rounded outline-none font-mono text-[11px]"
                      style={{
                        padding: "7px 10px",
                        background: "var(--journal-input-bg)",
                        border: "1px solid var(--journal-input-border)",
                        color: "var(--journal-text-secondary)",
                        caretColor: accent.hex,
                      }}
                    />
                    <button
                      onClick={addTag}
                      className="rounded cursor-pointer text-[13px]"
                      style={{ padding: "7px 12px", background: accent.dim, border: `1px solid ${accent.hex}30`, color: accent.hex }}
                    >
                      +
                    </button>
                  </div>
                </StyleSection>

                {/* Preview + Goal + Context */}
                <div className="flex flex-col gap-5">
                  <StyleSection label="PREVIEW" accent={accent}>
                    <div className="rounded-[5px] relative overflow-hidden" style={{ padding: "14px", background: "var(--journal-input-bg)", border: `1px solid ${accent.hex}15` }}>
                      <HUDCorner pos="tl" size={7} color={accent.hex} />
                      <HUDCorner pos="br" size={7} color={accent.hex} />
                      <p className="font-orbitron text-[11px] font-bold mb-1.5 truncate" style={{ color: "var(--journal-text-primary)" }}>
                        {title || "Title..."}
                      </p>
                      <p style={{ fontFamily: getFont(fontId).css, fontStyle: getFont(fontId).style, fontSize: "11px", color: "var(--journal-text-dim)", lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {content.replace(/<[^>]+>/g, "") || "Content..."}
                      </p>
                      <div className="mt-2.5 flex items-center gap-2">
                        <span style={{ color: getMood(moodId).color, fontSize: "10px" }}>{getMood(moodId).sym}</span>
                        <div className="flex-1 h-[2px] rounded-sm overflow-hidden bg-muted/30">
                          <div className="h-full rounded-sm" style={{ width: `${valence * 10}%`, background: accent.hex }} />
                        </div>
                      </div>
                    </div>
                  </StyleSection>

                  <StyleSection label="LINKED GOAL" accent={accent}>
                    <Select value={linkedGoalId ?? "none"} onValueChange={(v) => setLinkedGoalId(v === "none" ? null : v)}>
                      <SelectTrigger
                        className="h-9 rounded text-xs font-mono"
                        style={{ background: "var(--journal-input-bg)", border: "1px solid var(--journal-input-border)", color: "var(--journal-text-secondary)" }}
                      >
                        <SelectValue placeholder="No goal linked" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border/20 font-mono text-xs">
                        <SelectItem value="none">No goal linked</SelectItem>
                        {activeGoals.map((g: Goal) => (
                          <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </StyleSection>

                  <StyleSection label="LIFE CONTEXT" accent={accent}>
                    <input
                      value={lifeContext}
                      onChange={(e) => setLifeContext(e.target.value)}
                      placeholder="e.g., During a period of change..."
                      className="w-full rounded outline-none font-mono text-[11px] italic"
                      style={{
                        padding: "7px 10px",
                        background: "var(--journal-input-bg)",
                        border: "1px solid var(--journal-input-border)",
                        color: "var(--journal-text-secondary)",
                        caretColor: accent.hex,
                      }}
                    />
                  </StyleSection>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
