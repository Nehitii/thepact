import { useMemo } from "react";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { MoreVertical, Pencil, Pin, PinOff, Trash2 } from "lucide-react";
import type { JournalEntry } from "@/types/journal";
import { getMood, getFont, getSize, getAlign, getAccentEtat } from "@/types/journal";
import { assainirJournal, compterMots, referenceDe } from "@/lib/journalHtml";
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
  /* Le menu part dans un portail, hors du dossier : sans la lumiere
     de la page, il retombait sur le style d avant. */
  theme?: "clair" | "sombre";
}

export function JournalEntryCard({ entry, onEdit, onDelete, theme = "sombre" }: JournalEntryCardProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const toggleFav = useToggleFavorite();

  const mood = getMood(entry.mood);
  const font = getFont(entry.font_id);
  const size = getSize(entry.size_id);
  const align = getAlign(entry.align_id);
  const createdDate = new Date(entry.created_at);

  /* L assainissement etait refait a chaque rendu, deux fois par carte. */
  const html = useMemo(() => assainirJournal(entry.content), [entry.content]);
  const mots = useMemo(() => compterMots(html), [html]);

  const handleToggleFavorite = () => {
    if (!user) return;
    toggleFav.mutate({ id: entry.id, userId: user.id, isFavorite: !entry.is_favorite });
  };

  /* Le meme jeu de reglages que la feuille d ecriture, pose sur le
     meme conteneur : c est ce qui fait qu on relit exactement ce
     qu on a ecrit. */
  const styleCorps = {
    fontFamily: font.css, fontStyle: font.style, fontSize: `${size.px}px`,
    textAlign: align.val,
    ["--jr-fs" as string]: `${size.px}px`,
    ["--jr-teinte" as string]: `var(--jr-etat-${mood.id})`,
    ["--jr-accent" as string]: `var(--jr-etat-${getAccentEtat(entry.accent_color)})`,
  } as React.CSSProperties;

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
              <DropdownMenuContent align="end" className="jr-liste" data-jr={theme}>
                <DropdownMenuItem onClick={() => onEdit?.(entry)}>
                  <Pencil aria-hidden="true" />{t("journal.card.edit")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleToggleFavorite}>
                  {entry.is_favorite
                    ? <><PinOff aria-hidden="true" />{t("journal.card.unpin")}</>
                    : <><Pin aria-hidden="true" />{t("journal.card.pin")}</>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete?.(entry.id)} className="est-rouge">
                  <Trash2 aria-hidden="true" />{t("journal.card.delete")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <h2 className="jr-titre" style={{ textAlign: align.val }}>{entry.title}</h2>

          {/* Les numeros etaient comptes en decoupant le HTML a la main ;
              ils sont maintenant portes par la feuille de style, donc
              identiques dans l editeur et dans le dossier. */}
          <div
            className="jr-html"
            data-lignes={entry.line_numbers ? "1" : "0"}
            style={styleCorps}
            dangerouslySetInnerHTML={{ __html: html }}
          />

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
            {/* L energie etait demandee a l ecriture et jamais relue. */}
            {entry.energy_level != null && (
              <span className="jr-mesure est-energie">
                {t("journal.energy")}
                <i><u style={{ width: `${entry.energy_level * 10}%` }} /></i>
                {entry.energy_level}/10
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
