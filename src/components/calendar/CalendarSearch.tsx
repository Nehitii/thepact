import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import type { CalendarEvent } from "@/hooks/useCalendarEvents";
import { useCalendarEventSearch } from "@/hooks/useCalendarEvents";
import { useDateFnsLocale } from "@/i18n/useDateFnsLocale";
import { format, parseISO, isSameYear } from "date-fns";

interface CalendarSearchProps {
  /** Ce qui est deja charge : les taches, objectifs et etapes de la periode. */
  events: CalendarEvent[];
  onEventClick: (ev: CalendarEvent) => void;
  /** Amener le calendrier sur la date trouvee — un resultat hors periode
   *  s ouvrait sinon dans un mois qui ne le montre pas. */
  onNavigate?: (date: Date) => void;
  onClose: () => void;
}

export function CalendarSearch({ events, onEventClick, onNavigate, onClose }: CalendarSearchProps) {
  const { t } = useTranslation();
  const locale = useDateFnsLocale();
  const [query, setQuery] = useState("");

  /* On ne part pas en base a chaque frappe. */
  const [terme, setTerme] = useState("");
  useEffect(() => {
    const m = window.setTimeout(() => setTerme(query), 250);
    return () => window.clearTimeout(m);
  }, [query]);

  const distants = useCalendarEventSearch(terme);

  const resultats = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];

    /* Les evenements viennent de la base, sans borne de date ; les trois
       autres sources sont deja chargees pour la periode affichee. */
    const locaux = events.filter(
      (ev) =>
        ev.title.toLowerCase().includes(q) ||
        ev.description?.toLowerCase().includes(q) ||
        ev.location?.toLowerCase().includes(q),
    );

    const vus = new Set<string>();
    const tous = [...(distants.data ?? []), ...locaux].filter((ev) => {
      const cle = ev._sourceId ? `${ev._source}:${ev._sourceId}` : ev.id;
      if (vus.has(cle)) return false;
      vus.add(cle);
      return true;
    });

    // Le plus proche d aujourd hui d abord : c est presque toujours ce
    // qu on cherche.
    const maintenant = Date.now();
    return tous
      .sort((a, b) => Math.abs(+parseISO(a.start_time) - maintenant) - Math.abs(+parseISO(b.start_time) - maintenant))
      .slice(0, 10);
  }, [query, events, distants.data]);

  const choisir = (ev: CalendarEvent) => {
    onNavigate?.(parseISO(ev.start_time));
    onEventClick(ev);
  };

  const cherche = query.trim().length >= 2;
  const vide = cherche && !distants.isFetching && resultats.length === 0;

  return (
    <div className="mb-4 bg-card/50 border border-border/40 rounded-lg p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
        <Input
          placeholder={t("calendar.searchPlaceholder", "Search events...")}
          aria-label={t("calendar.search", "Search events")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="cal-outil h-8 text-xs"
          autoFocus
        />
        {distants.isFetching && (
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" aria-hidden="true" />
        )}
        <Button
          variant="ghost"
          size="icon"
          className="cal-outil h-8 w-8 shrink-0"
          onClick={onClose}
          aria-label={t("common.close", "Close")}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>

      {resultats.length > 0 && (
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {resultats.map((ev) => {
            const d = parseISO(ev.start_time);
            const memeAnnee = isSameYear(d, new Date());
            return (
              <button
                key={ev.id}
                type="button"
                onClick={() => choisir(ev)}
                className="w-full text-left flex items-center gap-2 rounded-md p-1.5 hover:bg-muted/30 transition-colors"
              >
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: ev.color }} aria-hidden="true" />
                <span className="text-xs font-medium truncate flex-1">{ev.title}</span>
                {/* L annee apparait des que le resultat sort de l annee en
                    cours : sans elle, un « 6 aout » ne dit pas lequel. */}
                <span className="ds-t-label text-muted-foreground shrink-0">
                  {format(d, memeAnnee ? (ev.all_day ? "d MMM" : "d MMM HH:mm") : "d MMM yyyy", { locale })}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {vide && (
        <p className="ds-t-label text-muted-foreground px-1.5" role="status">
          {t("calendar.noResults", "Nothing found.")}
        </p>
      )}
    </div>
  );
}
