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
          background: value ? accent.hex : "rgba(255,255,255,0.07)",
          boxShadow: value ? `0 0 10px ${accent.hex}60` : "none",
          border: `1px solid ${value ? accent.hex : "rgba(255,255,255,0.1)"}`,
        }}
      >
        <div
          className="absolute rounded-full transition-[left] duration-200"
          style={{
            width: "12px", height: "12px",
            background: value ? "#000" : "rgba(255,255,255,0.35)",
            top: "2px",
            left: value ? "20px" : "2px",
          }}
        />
      </div>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: value ? accent.hex : "rgba(255,255,255,0.3)", letterSpacing: "0.1em" }}>{label}</span>
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
        setTitle(editingEntry.title);
        setContent(editingEntry.content);
        setLifeContext(editingEntry.life_context || "");
        setValence(editingEntry.valence_level ?? 5);
        setEnergy(editingEntry.energy_level ?? 5);
        setLinkedGoalId(editingEntry.linked_goal_id);
        setTags(editingEntry.tags ?? []);
        setAccentId(editingEntry.accent_color ?? "cyan");
        setMoodId(editingEntry.mood ?? "flow");
        setFontId(editingEntry.font_id ?? "mono");
        setSizeId(editingEntry.size_id ?? "md");
        setAlignId(editingEntry.align_id ?? "left");
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
      title: title.trim(),
      content,
      mood: moodId,
      life_context: lifeContext.trim() || null,
      valence_level: valence,
      energy_level: energy,
      linked_goal_id: linkedGoalId || null,
      tags,
      is_favorite: editingEntry?.is_favorite ?? false,
      accent_color: accentId,
      font_id: fontId,
      size_id: sizeId,
      align_id: alignId,
      line_numbers: lineNums,
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
        className="fixed inset-0 z-[9999] flex flex-col overflow-hidden"
        style={{ background: "rgba(2,3,8,0.96)", backdropFilter: "blur(24px)" }}
      >
        {/* Top bar */}
        <div
          className="h-14 shrink-0 flex items-center px-4 sm:px-8 gap-3 sm:gap-5"
          style={{ borderBottom: `1px solid ${accent.hex}18`, background: "rgba(6,7,14,0.8)" }}
        >
          <div className="flex items-center gap-2">
            <div className="w-[7px] h-[7px] rounded-full" style={{ background: accent.hex, boxShadow: `0 0 8px ${accent.hex}`, animation: "journal-pulse 2s infinite" }} />
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: accent.hex, opacity: 0.7, letterSpacing: "0.15em" }}>
              {isEditing ? "// EDIT_ENTRY" : "// NEW_ENTRY"}
            </span>
          </div>

          <div className="flex gap-0.5 rounded p-[3px]" style={{ background: "rgba(255,255,255,0.04)" }}>
            {PANELS.map((p) => (
              <button
                key={p}
                onClick={() => setPanel(p)}
                className="rounded-sm cursor-pointer transition-all duration-150"
                style={{
                  padding: "5px 14px",
                  background: panel === p ? accent.dim : "transparent",
                  border: panel === p ? `1px solid ${accent.hex}30` : "1px solid transparent",
                  color: panel === p ? accent.hex : "rgba(255,255,255,0.35)",
                  fontSize: "10px",
                  fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: "0.1em",
                }}
              >
                {p.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="flex-1" />

          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", color: "rgba(255,255,255,0.2)", letterSpacing: "0.08em" }}>
            {wordCount} <span style={{ color: "rgba(255,255,255,0.1)" }}>WORDS</span>
          </span>

          <button
            onClick={() => onOpenChange(false)}
            className="rounded cursor-pointer transition-colors"
            style={{
              padding: "6px 14px",
              background: "rgba(255,55,95,0.08)",
              border: "1px solid rgba(255,55,95,0.2)",
              color: "#ff375f",
              fontSize: "10px",
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: "0.1em",
            }}
          >
            ESC
          </button>

          <motion.button
            onClick={handleSave}
            disabled={!canSave || isPending}
            whileHover={canSave ? { scale: 1.03 } : {}}
            whileTap={canSave ? { scale: 0.97 } : {}}
            className="rounded transition-all duration-200"
            style={{
              padding: "7px 20px",
              background: canSave ? accent.hex : "rgba(255,255,255,0.05)",
              border: "none",
              color: canSave ? "#000" : "rgba(255,255,255,0.15)",
              cursor: canSave ? "pointer" : "not-allowed",
              fontSize: "10px",
              fontFamily: "'Orbitron', monospace",
              fontWeight: 700,
              letterSpacing: "0.12em",
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
                className="bg-transparent border-none outline-none"
                style={{
                  padding: "32px 0 20px",
                  fontFamily: "'Orbitron', monospace",
                  fontWeight: 700,
                  fontSize: "clamp(18px, 3vw, 26px)",
                  letterSpacing: "-0.01em",
                  color: "rgba(255,255,255,0.9)",
                  caretColor: accent.hex,
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
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
                        className="flex flex-col items-center gap-[7px] rounded-[5px] cursor-pointer transition-all duration-150"
                        style={{
                          padding: "10px 6px",
                          background: accentId === a.id ? a.dim : "rgba(255,255,255,0.03)",
                          border: `1px solid ${accentId === a.id ? a.hex + "50" : "rgba(255,255,255,0.07)"}`,
                          boxShadow: accentId === a.id ? `0 0 16px ${a.hex}25` : "none",
                        }}
                      >
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: a.hex, boxShadow: `0 0 8px ${a.hex}` }} />
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", color: accentId === a.id ? a.hex : "rgba(255,255,255,0.35)", letterSpacing: "0.1em" }}>{a.label}</span>
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
                        className="flex items-center gap-2 rounded-[5px] cursor-pointer transition-all duration-150"
                        style={{
                          padding: "9px 10px",
                          background: moodId === m.id ? `${m.color}10` : "rgba(255,255,255,0.03)",
                          border: `1px solid ${moodId === m.id ? m.color + "40" : "rgba(255,255,255,0.07)"}`,
                        }}
                      >
                        <span style={{ color: m.color, fontSize: "13px" }}>{m.sym}</span>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", color: moodId === m.id ? m.color : "rgba(255,255,255,0.35)", letterSpacing: "0.08em" }}>{m.label}</span>
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
                        className="text-left rounded-[5px] cursor-pointer transition-all duration-150"
                        style={{
                          padding: "10px 12px",
                          background: fontId === f.id ? accent.dim : "rgba(255,255,255,0.03)",
                          border: `1px solid ${fontId === f.id ? accent.hex + "40" : "rgba(255,255,255,0.07)"}`,
                          color: fontId === f.id ? accent.hex : "rgba(255,255,255,0.45)",
                          fontSize: "13px",
                          fontFamily: f.css,
                          fontStyle: f.style,
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
                          className="flex-1 rounded cursor-pointer transition-all duration-150"
                          style={{
                            padding: "8px 4px",
                            background: sizeId === s.id ? accent.dim : "rgba(255,255,255,0.03)",
                            border: `1px solid ${sizeId === s.id ? accent.hex + "40" : "rgba(255,255,255,0.06)"}`,
                            color: sizeId === s.id ? accent.hex : "rgba(255,255,255,0.35)",
                            fontSize: "10px",
                            fontFamily: "'JetBrains Mono', monospace",
                            letterSpacing: "0.06em",
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
                          className="flex-1 rounded cursor-pointer transition-all duration-150"
                          style={{
                            padding: "8px 4px",
                            background: alignId === a.id ? accent.dim : "rgba(255,255,255,0.03)",
                            border: `1px solid ${alignId === a.id ? accent.hex + "40" : "rgba(255,255,255,0.06)"}`,
                            color: alignId === a.id ? accent.hex : "rgba(255,255,255,0.35)",
                            fontSize: "9px",
                            fontFamily: "'JetBrains Mono', monospace",
                            letterSpacing: "0.08em",
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
                          background: i < valence ? accent.hex : "rgba(255,255,255,0.05)",
                          opacity: i < valence ? 0.3 + (i / 10) * 0.7 : 1,
                          boxShadow: i < valence && i === valence - 1 ? `0 0 8px ${accent.hex}` : "none",
                        }}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between">
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", color: "rgba(255,255,255,0.2)", letterSpacing: "0.1em" }}>NEGATIVE</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: accent.hex, letterSpacing: "0.06em" }}>{valence}/10</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", color: "rgba(255,255,255,0.2)", letterSpacing: "0.1em" }}>POSITIVE</span>
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
                          background: i < energy ? "#0a84ff" : "rgba(255,255,255,0.05)",
                          opacity: i < energy ? 0.3 + (i / 10) * 0.7 : 1,
                          boxShadow: i < energy && i === energy - 1 ? "0 0 8px #0a84ff" : "none",
                        }}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between">
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", color: "rgba(255,255,255,0.2)", letterSpacing: "0.1em" }}>DEPLETED</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: "#0a84ff", letterSpacing: "0.06em" }}>{energy}/10</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", color: "rgba(255,255,255,0.2)", letterSpacing: "0.1em" }}>SUPERCHARGED</span>
                  </div>
                </StyleSection>

                <StyleSection label="TAGS" accent={accent}>
                  <div className="flex gap-1.5 flex-wrap mb-2.5 min-h-[28px]">
                    {tags.map((t) => (
                      <span
                        key={t}
                        onClick={() => setTags((p) => p.filter((x) => x !== t))}
                        className="cursor-pointer rounded-sm"
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: "10px",
                          color: accent.hex,
                          background: accent.dim,
                          border: `1px solid ${accent.hex}25`,
                          padding: "3px 8px",
                          letterSpacing: "0.06em",
                        }}
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
                      className="flex-1 rounded outline-none"
                      style={{
                        padding: "7px 10px",
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: "rgba(255,255,255,0.6)",
                        fontSize: "11px",
                        fontFamily: "'JetBrains Mono', monospace",
                        caretColor: accent.hex,
                      }}
                    />
                    <button
                      onClick={addTag}
                      className="rounded cursor-pointer"
                      style={{
                        padding: "7px 12px",
                        background: accent.dim,
                        border: `1px solid ${accent.hex}30`,
                        color: accent.hex,
                        fontSize: "13px",
                      }}
                    >
                      +
                    </button>
                  </div>
                </StyleSection>

                {/* Preview + Goal + Context */}
                <div className="flex flex-col gap-5">
                  <StyleSection label="PREVIEW" accent={accent}>
                    <div
                      className="rounded-[5px] relative overflow-hidden"
                      style={{
                        padding: "14px",
                        background: "rgba(255,255,255,0.02)",
                        border: `1px solid ${accent.hex}15`,
                      }}
                    >
                      <HUDCorner pos="tl" size={7} color={accent.hex} />
                      <HUDCorner pos="br" size={7} color={accent.hex} />
                      <p style={{ fontFamily: "'Orbitron', monospace", fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.7)", marginBottom: "6px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {title || "Title..."}
                      </p>
                      <p style={{ fontFamily: getFont(fontId).css, fontStyle: getFont(fontId).style, fontSize: "11px", color: "rgba(255,255,255,0.35)", lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {content.replace(/<[^>]+>/g, "") || "Content..."}
                      </p>
                      <div className="mt-2.5 flex items-center gap-2">
                        <span style={{ color: getMood(moodId).color, fontSize: "10px" }}>{getMood(moodId).sym}</span>
                        <div className="flex-1 h-[2px] rounded-sm overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                          <div className="h-full rounded-sm" style={{ width: `${valence * 10}%`, background: accent.hex }} />
                        </div>
                      </div>
                    </div>
                  </StyleSection>

                  <StyleSection label="LINKED GOAL" accent={accent}>
                    <Select value={linkedGoalId ?? "none"} onValueChange={(v) => setLinkedGoalId(v === "none" ? null : v)}>
                      <SelectTrigger
                        className="h-9 rounded text-xs"
                        style={{
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          color: "rgba(255,255,255,0.6)",
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        <SelectValue placeholder="No goal linked" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border/20 font-mono text-xs">
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
                      className="w-full rounded outline-none"
                      style={{
                        padding: "7px 10px",
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: "rgba(255,255,255,0.6)",
                        fontSize: "11px",
                        fontFamily: "'JetBrains Mono', monospace",
                        fontStyle: "italic",
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
    </AnimatePresence>
  );
}
