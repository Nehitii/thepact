import { useMemo } from "react";
import { format } from "date-fns";
import DOMPurify from "dompurify";
import { useTranslation } from "react-i18next";
import { MoreVertical, Pencil, Pin, PinOff, Trash2 } from "lucide-react";
import type { JournalEntry } from "@/types/journal";
import { getMood, getFont, getSize, getAlign } from "@/types/journal";
import { useToggleFavorite } from "@/hooks/useJournal";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/* LA PIECE DE DOSSIER
 *
 * L entree n est plus une carte posee sur un fond : c est un document.
 * Une cote a gauche — date, heure, reference, nombre de mots — une bande
 * d humeur estampee, un titre condense, et le texte a soixante-six
 * caracteres. La couleur ne sert qu au sceau.
 */

interface JournalEntryCardProps {
  entry: JournalEntry;
  onEdit?: (entry: JournalEntry) => void;
  onDelete?: (id: string) => void;
}

const referenceDe = (id: string) => "REF·" + id.replace(/[^0-9a-f]/gi, "").slice(-4).toUpperCase();

export function JournalEntryCard({ entry, onEdit, onDelete }: JournalEntryCardProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const toggleFav = useToggleFavorite();

  const mood = getMood(entry.mood);
  const font = getFont(entry.font_id);
  const size = getSize(entry.size_id);
  const align = getAlign(entry.align_id);
  const createdDate = new Date(entry.created_at);

  /* L assainissement etait refait a chaque rendu, deux fois par carte. */
  const html = useMemo(() => DOMPurify.sanitize(entry.content), [entry.content]);

  /* Les numeros comptaient les PHRASES pendant que le corps etait rendu
     en HTML : ils comptent les blocs effectivement affiches. */
  const blocs = useMemo(() => {
    if (!entry.line_numbers) return null;
    const doc = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html");
    const racine = doc.body.firstElementChild;
    if (!racine) return null;
    const morceaux = Array.from(racine.children).map((e) => e.outerHTML).filter(Boolean);
    return morceaux.length > 0 ? morceaux : [html];
  }, [html, entry.line_numbers]);

  const mots = useMemo(
    () => html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length,
    [html],
  );

  const handleToggleFavorite = () => {
    if (!user) return;
    toggleFav.mutate({ id: entry.id, userId: user.id, isFavorite: !entry.is_favorite });
  };

  const styleCorps: React.CSSProperties = {
    fontFamily: font.css, fontStyle: font.style, fontSize: `${size.px}px`,
    textAlign: align.val,
  };

  return (
    <article className="jr-entree">
      <div className="jr-entete">
        <div className="jr-cote">
          <b>{format(createdDate, "yyyy.MM.dd")}</b>
          <span>{format(createdDate, "HH:mm")}</span>
          <span>{referenceDe(entry.id)}</span>
          <span>{t("journal.words", { count: mots })}</span>
        </div>

        <div className="min-w-0">
          <div className="flex items-start gap-3">
            <span className={cn("jr-bande", entry.is_favorite && "est-rouge")}>
              {t(`journal.moods.${mood.id}`, mood.label)}
              {entry.is_favorite && <> — {t("journal.badges.pinned")}</>}
            </span>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="jr-menu"
                  aria-label={t("journal.card.actions", { title: entry.title })}
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

          <h2 className="jr-titre" style={{ textAlign: align.val }}>{entry.title}</h2>

          {blocs ? (
            <div className="jr-html" style={styleCorps}>
              {blocs.map((b, i) => (
                <div key={i} className="jr-ligne">
                  <span className="jr-numero" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                  <div className="flex-1 min-w-0" dangerouslySetInnerHTML={{ __html: b }} />
                </div>
              ))}
            </div>
          ) : (
            <div className="jr-html" style={styleCorps} dangerouslySetInnerHTML={{ __html: html }} />
          )}

          <div className="jr-pied">
            {entry.tags?.map((tag) => (
              <span key={tag} className="jr-etiquette">/{tag}</span>
            ))}
            {/* Un zero valait « rien » : React affichait alors « 0 ». */}
            {entry.valence_level != null && (
              <span className="jr-mesure">
                {t("journal.valence")}
                <i><u style={{ width: `${entry.valence_level * 10}%` }} /></i>
                {entry.valence_level}/10
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
