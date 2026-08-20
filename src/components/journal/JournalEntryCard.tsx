import { useMemo } from "react";
import { format } from "date-fns";
import DOMPurify from "dompurify";
import { useTranslation } from "react-i18next";
import { MoreVertical, Pencil, Pin, PinOff, Trash2 } from "lucide-react";
import type { JournalEntry } from "@/types/journal";
import { getAccent, getMood, getFont, getSize, getAlign } from "@/types/journal";
import { useToggleFavorite } from "@/hooks/useJournal";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { HUDStatusLine } from "./JournalDecorations";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/* LA CARTE
 *
 * Le menu etait un bouton nomme « ⋮ », pose en absolu dans un cadre qui
 * decoupe, qui se fermait au depart du survol — donc au premier
 * mouvement du doigt — et qui n avait ni fermeture au clic exterieur ni
 * Echap. Il passe par le menu deroulant de l application : portail,
 * clavier, nom.
 *
 * Le numero d entree comptait la position a l ecran, qui change avec le
 * filtre : il devient une reference stable, tiree de l identifiant.
 */

interface JournalEntryCardProps {
  entry: JournalEntry;
  onEdit?: (entry: JournalEntry) => void;
  onDelete?: (id: string) => void;
}

const referenceDe = (id: string) => "LOG::" + id.replace(/[^0-9a-f]/gi, "").slice(-4).toUpperCase();

export function JournalEntryCard({ entry, onEdit, onDelete }: JournalEntryCardProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const toggleFav = useToggleFavorite();

  const accent = getAccent(entry.accent_color);
  const mood = getMood(entry.mood);
  const font = getFont(entry.font_id);
  const size = getSize(entry.size_id);
  const align = getAlign(entry.align_id);
  const createdDate = new Date(entry.created_at);

  /* L assainissement etait refait a chaque rendu, deux fois par carte. */
  const html = useMemo(() => DOMPurify.sanitize(entry.content), [entry.content]);

  /* Les numeros comptaient les PHRASES pendant que le corps etait rendu
     en HTML : ils ne pouvaient pas coincider. Ils comptent les blocs
     effectivement affiches. */
  const blocs = useMemo(() => {
    if (!entry.line_numbers) return null;
    const doc = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html");
    const racine = doc.body.firstElementChild;
    if (!racine) return null;
    const morceaux = Array.from(racine.children).map((e) => e.outerHTML).filter(Boolean);
    return morceaux.length > 0 ? morceaux : [html];
  }, [html, entry.line_numbers]);

  const handleToggleFavorite = () => {
    if (!user) return;
    toggleFav.mutate({ id: entry.id, userId: user.id, isFavorite: !entry.is_favorite });
  };

  const styleCorps: React.CSSProperties = {
    fontFamily: font.css, fontStyle: font.style, fontSize: `${size.px}px`,
    lineHeight: 1.9, color: "var(--journal-text-secondary)",
    letterSpacing: font.id === "raj" ? "0.02em" : "-0.01em",
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="relative w-full mb-0.5"
    >
      <div
        className="relative z-[1] rounded-md bg-card transition-colors duration-300 hover:border-[color:var(--journal-accent-bord)]"
        style={{
          border: "1px solid var(--journal-border)",
          padding: "28px 32px 24px",
          ["--journal-accent-bord" as string]: accent.hex + "44",
        }}
      >
        <div
          className="absolute left-0 rounded-sm"
          style={{ top: "18px", bottom: "18px", width: "2px", background: `linear-gradient(to bottom, transparent, ${accent.hex}55, transparent)` }}
          aria-hidden="true"
        />

        {entry.is_favorite && (
          <div className="absolute top-0" style={{ left: "15%", right: "15%", height: "1px", background: `linear-gradient(90deg, transparent, ${accent.hex}, transparent)` }} aria-hidden="true" />
        )}

        {/* La reference ne bouge plus avec le filtre. */}
        <div
          className="absolute select-none font-mono ds-t-label tracking-[0.2em] hidden sm:block"
          style={{ right: "14px", top: "50%", transform: "translateY(-50%)", color: accent.hex, opacity: 0.22, writingMode: "vertical-rl" }}
          aria-hidden="true"
        >
          {referenceDe(entry.id)}
        </div>

        {/* META */}
        <div className="flex items-center gap-4 mb-3.5 flex-wrap">
          <div className="flex items-center gap-[7px] px-2.5 py-[3px] rounded-sm" style={{ border: `1px solid ${mood.color}44`, background: `${mood.color}0f` }}>
            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: mood.color }} aria-hidden="true" />
            <span className="font-mono ds-t-label tracking-[0.12em]" style={{ color: mood.color }}>
              {t(`journal.moods.${mood.id}`, mood.label)}
            </span>
          </div>

          <span className="font-mono ds-t-label tracking-[0.12em]" style={{ color: "var(--journal-text-secondary)" }}>
            {format(createdDate, "yyyy.MM.dd")}{" "}
            <span style={{ color: accent.hex }} aria-hidden="true">//</span>{" "}
            {format(createdDate, "HH:mm")}
          </span>

          {entry.is_favorite && (
            <span className="inline-flex items-center gap-1 font-mono ds-t-label tracking-[0.1em]" style={{ color: accent.hex }}>
              <Pin className="w-3 h-3" aria-hidden="true" />
              {t("journal.badges.pinned")}
            </span>
          )}

          <div className="flex-1" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={t("journal.card.actions", { title: entry.title })}
                className="flex items-center justify-center rounded-[4px] transition-colors min-w-[44px] min-h-[44px] text-[var(--journal-text-secondary)] hover:text-foreground hover:bg-muted/40"
              >
                <MoreVertical className="w-4 h-4" aria-hidden="true" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="font-mono text-xs min-w-[170px]">
              <DropdownMenuItem onClick={() => onEdit?.(entry)} className="cursor-pointer gap-2">
                <Pencil className="w-3.5 h-3.5" aria-hidden="true" />{t("journal.card.edit")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleToggleFavorite} className="cursor-pointer gap-2">
                {entry.is_favorite
                  ? <><PinOff className="w-3.5 h-3.5" aria-hidden="true" />{t("journal.card.unpin")}</>
                  : <><Pin className="w-3.5 h-3.5" aria-hidden="true" />{t("journal.card.pin")}</>}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete?.(entry.id)}
                className="cursor-pointer gap-2 text-destructive focus:text-destructive"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />{t("journal.card.delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <h2
          className="font-orbitron font-bold leading-tight mb-4"
          style={{
            fontSize: "clamp(15px, 2vw, 19px)", letterSpacing: "-0.01em",
            color: "var(--journal-text-primary)", textAlign: align.val, paddingRight: "28px",
          }}
        >
          {entry.title}
        </h2>

        <div style={{ textAlign: align.val, marginBottom: "20px" }}>
          {blocs ? (
            <div className="flex flex-col">
              {blocs.map((b, i) => (
                <div key={i} className="flex gap-3.5">
                  <span
                    className="shrink-0 select-none text-right font-mono ds-t-label"
                    style={{ color: accent.hex, opacity: 0.35, lineHeight: 1.9, minWidth: "2ch" }}
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="journal-html-content flex-1" style={styleCorps} dangerouslySetInnerHTML={{ __html: b }} />
                </div>
              ))}
            </div>
          ) : (
            <div className="journal-html-content" style={styleCorps} dangerouslySetInnerHTML={{ __html: html }} />
          )}
        </div>

        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex gap-1.5 flex-wrap">
            {entry.tags?.map((tag) => (
              <span key={tag} className="rounded-sm font-mono ds-t-label tracking-[0.08em]" style={{ color: accent.hex, background: accent.dim, border: `1px solid ${accent.hex}33`, padding: "2px 8px" }}>
                /{tag}
              </span>
            ))}
          </div>

          {/* Un zero valait « rien » : React affichait alors « 0 ». */}
          {(entry.valence_level != null || entry.energy_level != null) && (
            <div className="flex flex-col gap-1.5 min-w-[120px]">
              {entry.valence_level != null && <HUDStatusLine label="V" value={entry.valence_level} color={accent.hex} />}
              {entry.energy_level != null && <HUDStatusLine label="E" value={entry.energy_level} color={accent.hex} />}
            </div>
          )}
        </div>
      </div>
    </motion.article>
  );
}
