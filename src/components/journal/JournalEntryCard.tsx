import { useState } from "react";
import { format } from "date-fns";
import type { JournalEntry } from "@/types/journal";
import { getAccent, getMood, getFont, getSize, getAlign } from "@/types/journal";
import { useToggleFavorite } from "@/hooks/useJournal";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { HUDStatusLine } from "./JournalDecorations";

interface JournalEntryCardProps {
  entry: JournalEntry;
  index: number;
  onEdit?: (entry: JournalEntry) => void;
  onDelete?: (id: string) => void;
}

export function JournalEntryCard({ entry, index, onEdit, onDelete }: JournalEntryCardProps) {
  const { user } = useAuth();
  const toggleFav = useToggleFavorite();
  const [hovered, setHovered] = useState(false);
  const [menu, setMenu] = useState(false);

  const accent = getAccent(entry.accent_color);
  const mood = getMood(entry.mood);
  const font = getFont(entry.font_id);
  const size = getSize(entry.size_id);
  const align = getAlign(entry.align_id);
  const createdDate = new Date(entry.created_at);

  const handleToggleFavorite = () => {
    if (!user) return;
    toggleFav.mutate({ id: entry.id, userId: user.id, isFavorite: !entry.is_favorite });
  };

  // Extract text from HTML for line numbers
  const textContent = entry.content.replace(/<[^>]+>/g, "");
  const sentences = textContent.split(". ").filter(Boolean);

  return (
    <motion.article
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.5, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => { setHovered(false); setMenu(false); }}
      className="relative w-full mb-0.5"
    >
      <motion.div
        animate={{ borderColor: hovered ? accent.hex + "22" : "rgba(255,255,255,0.06)" }}
        transition={{ duration: 0.35 }}
        className="relative z-[1] rounded-md overflow-hidden"
        style={{
          background: "linear-gradient(160deg, rgba(11,12,20,0.85) 0%, rgba(6,7,13,0.7) 100%)",
          border: "1px solid rgba(255,255,255,0.06)",
          padding: "28px 32px 24px",
        }}
      >
        {/* Left accent line */}
        <div
          className="absolute left-0 rounded-sm transition-all duration-300"
          style={{
            top: "18px",
            bottom: "18px",
            width: "2px",
            background: `linear-gradient(to bottom, transparent, ${accent.hex}${hovered ? "90" : "40"}, transparent)`,
          }}
        />

        {/* Pinned glow bar */}
        {entry.is_favorite && (
          <div
            className="absolute top-0"
            style={{
              left: "15%",
              right: "15%",
              height: "1px",
              background: `linear-gradient(90deg, transparent, ${accent.hex}, transparent)`,
            }}
          />
        )}

        {/* Entry index watermark */}
        <div
          className="absolute select-none"
          style={{
            right: "14px",
            top: "50%",
            transform: "translateY(-50%)",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "9px",
            color: accent.hex,
            opacity: 0.13,
            writingMode: "vertical-rl",
            letterSpacing: "0.2em",
          }}
        >
          {`ENTRY::${String(index + 1).padStart(3, "0")}`}
        </div>

        {/* META ROW */}
        <div className="flex items-center gap-4 mb-3.5 flex-wrap">
          {/* Mood badge */}
          <div
            className="flex items-center gap-[7px] px-2.5 py-[3px] rounded-sm"
            style={{
              border: `1px solid ${mood.color}28`,
              background: `${mood.color}08`,
            }}
          >
            <div
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: mood.color }}
            />
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "9px",
                color: mood.color,
                letterSpacing: "0.12em",
              }}
            >
              {mood.label}
            </span>
          </div>

          {/* Date */}
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "9px",
              color: "rgba(255,255,255,0.25)",
              letterSpacing: "0.12em",
            }}
          >
            {format(createdDate, "yyyy.MM.dd")}{" "}
            <span style={{ color: accent.hex, opacity: 0.6 }}>//</span>{" "}
            {format(createdDate, "HH:mm")}
          </span>

          {entry.is_favorite && (
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "9px",
                color: accent.hex,
                opacity: 0.6,
                letterSpacing: "0.1em",
              }}
            >
              ◈ PIN
            </span>
          )}

          <div className="flex-1" />

          {/* Action menu */}
          <div className="relative">
            <button
              onClick={() => setMenu(!menu)}
              className="flex items-center justify-center transition-all duration-150 cursor-pointer"
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "4px",
                background: menu ? accent.dim : "transparent",
                border: `1px solid ${menu ? accent.hex + "50" : "rgba(255,255,255,0.08)"}`,
                color: menu ? accent.hex : "rgba(255,255,255,0.3)",
                fontSize: "13px",
              }}
            >
              ⋮
            </button>

            <AnimatePresence>
              {menu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -4 }}
                  className="absolute right-0 overflow-hidden z-50"
                  style={{
                    top: "34px",
                    background: "#0c0e18",
                    border: `1px solid ${accent.hex}20`,
                    borderRadius: "6px",
                    minWidth: "150px",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.7)",
                  }}
                >
                  {[
                    { icon: "◈", label: "EDIT", fn: () => { onEdit?.(entry); setMenu(false); } },
                    { icon: "◉", label: entry.is_favorite ? "UNPIN" : "PIN", fn: () => { handleToggleFavorite(); setMenu(false); } },
                    { icon: "◯", label: "DELETE", fn: () => { onDelete?.(entry.id); setMenu(false); }, danger: true },
                  ].map((a) => (
                    <button
                      key={a.label}
                      onClick={a.fn}
                      className="w-full text-left flex items-center gap-2 transition-colors duration-150 cursor-pointer hover:bg-white/5"
                      style={{
                        padding: "9px 14px",
                        background: "transparent",
                        border: "none",
                        color: a.danger ? "#ff375f" : "rgba(255,255,255,0.55)",
                        fontSize: "10px",
                        fontFamily: "'JetBrains Mono', monospace",
                        letterSpacing: "0.1em",
                      }}
                    >
                      {a.icon} {a.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* TITLE */}
        <h2
          style={{
            fontFamily: "'Orbitron', monospace",
            fontSize: "clamp(15px, 2vw, 19px)",
            fontWeight: 700,
            letterSpacing: "-0.01em",
            color: "rgba(255,255,255,0.92)",
            marginBottom: "16px",
            lineHeight: 1.25,
            textAlign: align.val,
            paddingRight: "28px",
          }}
        >
          {entry.title}
        </h2>

        {/* BODY */}
        <div style={{ textAlign: align.val, marginBottom: "20px" }}>
          {entry.line_numbers ? (
            <div className="flex gap-3.5">
              <div className="shrink-0 pt-px">
                {sentences.map((_, i) => (
                  <div
                    key={i}
                    className="select-none text-right"
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "9px",
                      color: accent.hex,
                      opacity: 0.2,
                      lineHeight: "1.9",
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </div>
                ))}
              </div>
              <div
                className="journal-html-content"
                style={{
                  fontFamily: font.css,
                  fontStyle: font.style,
                  fontSize: `${size.px}px`,
                  lineHeight: 1.9,
                  color: "rgba(255,255,255,0.58)",
                  letterSpacing: font.id === "raj" ? "0.02em" : "-0.01em",
                }}
                dangerouslySetInnerHTML={{ __html: entry.content }}
              />
            </div>
          ) : (
            <div
              className="journal-html-content"
              style={{
                fontFamily: font.css,
                fontStyle: font.style,
                fontSize: `${size.px}px`,
                lineHeight: 1.9,
                color: "rgba(255,255,255,0.58)",
                letterSpacing: font.id === "raj" ? "0.02em" : "-0.01em",
              }}
              dangerouslySetInnerHTML={{ __html: entry.content }}
            />
          )}
        </div>

        {/* FOOTER */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          {/* Tags */}
          <div className="flex gap-1.5 flex-wrap">
            {entry.tags?.map((t) => (
              <span
                key={t}
                className="rounded-sm"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "9px",
                  color: accent.hex,
                  opacity: 0.75,
                  background: accent.dim,
                  border: `1px solid ${accent.hex}22`,
                  padding: "2px 8px",
                  letterSpacing: "0.08em",
                }}
              >
                /{t}
              </span>
            ))}
          </div>

          {/* Valence / Energy bars */}
          {(entry.valence_level || entry.energy_level) && (
            <div className="flex flex-col gap-1.5 min-w-[120px]">
              {entry.valence_level && (
                <HUDStatusLine label="V" value={entry.valence_level} color={accent.hex} />
              )}
              {entry.energy_level && (
                <HUDStatusLine label="E" value={entry.energy_level} color={accent.hex} />
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.article>
  );
}
