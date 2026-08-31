import { useState } from "react";
import { texteDepuisDateCivile } from "@/socle/outils/jour";
import { Bouton } from "@/socle/ds/console-ui";
import { Calendar } from "@/socle/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/socle/ui/popover";
import { DataPanel } from "@/socle/ds/settings-ui";
import { supabase } from "@/socle/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Calendar as CalendarIcon, ArrowRight, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useDateFnsLocale } from "@/socle/i18n/useDateFnsLocale";
import { cn } from "@/socle/outils/utils";

interface ProjectTimelineCardProps {
  pactId: string | null;
  projectStartDate: Date | undefined;
  projectEndDate: Date | undefined;
  onProjectStartDateChange: (date: Date | undefined) => void;
  onProjectEndDateChange: (date: Date | undefined) => void;
}

const CY_BTN = [
  "relative rounded-none bg-primary/10 border border-primary/35",
  "hover:bg-primary/18 hover:border-primary/65",
  "text-primary font-mono ds-t-label tracking-[0.22em] uppercase",
  "shadow-[0_0_14px_hsl(var(--primary)/0.12)] hover:shadow-[0_0_24px_hsl(var(--primary)/0.28)]",
  "disabled:opacity-30 disabled:cursor-not-allowed",
  "transition-all duration-200 h-10",
].join(" ");

export function ProjectTimelineCard({
  pactId,
  projectStartDate,
  projectEndDate,
  onProjectStartDateChange,
  onProjectEndDateChange,
}: ProjectTimelineCardProps) {
  const locale = useDateFnsLocale();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  const dateValidationError = projectStartDate && projectEndDate && projectEndDate <= projectStartDate
    ? "La date de fin doit suivre la date de début."
    : null;

  const handleSave = async () => {
    if (dateValidationError) {
      toast.error("Échéance invalide", { description: dateValidationError });
      return;
    }
    if (!pactId) {
      toast.error("Aucun pacte", { description: "Il n’y a pas de pacte à mettre à jour." });
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from("pacts")
      .update({
        /* ═══ LE SELECTEUR REND UN JOUR, PAS UN INSTANT ═══
           `toISOString().split('T')[0]` rendait le jour d UTC : une date
           choisie au 8 septembre est un minuit LOCAL, soit le 7 a
           22 h UTC l ete — la borne du pacte reculait d un jour a
           chaque enregistrement. C est la faute deja corrigee pour la
           date de naissance, revenue ici. */
        project_start_date: texteDepuisDateCivile(projectStartDate),
        project_end_date: texteDepuisDateCivile(projectEndDate),
      })
      .eq("id", pactId);

    if (error) {
      toast.error("Erreur", { description: error.message });
    } else {
      queryClient.invalidateQueries({ queryKey: ["pact"] });
      toast.success("Échéance enregistrée", { description: "Les dates de ton projet sont à jour." });
    }
    setSaving(false);
  };

  const formatDisplayDate = (date: Date | undefined) => {
    if (!date) return null;
    /* Sans locale, date-fns rend l anglais : « Nov 1, 2023 » au
        milieu d une interface francaise. */
    return format(date, "d MMMM yyyy", { locale });
  };

  return (
    <DataPanel
      code="MODULE_03"
      title="Échéance"
      taille="demi"
      footerLeft={<span>Début : <b className="text-primary">{projectStartDate ? formatDisplayDate(projectStartDate) : "—"}</b></span>}
      footerRight={<span>Fin : <b className="text-primary">{projectEndDate ? formatDisplayDate(projectEndDate) : "—"}</b></span>}
    >
      <div className="py-4 space-y-4">
        <div className="flex items-center gap-2 px-2">
          <div className="flex-1 h-px bg-gradient-to-r from-primary/60 via-primary/40 to-primary/20" />
          <ArrowRight className="h-4 w-4 text-primary/60 flex-shrink-0" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <span className="w-1 h-1 bg-primary/40 rotate-45 inline-block shrink-0" />
              <label className="ds-t-label uppercase tracking-[0.22em] text-primary/40 font-mono font-semibold">Date de début</label>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className={cn(
                    "w-full flex items-center justify-between px-3 h-11",
                    "bg-[var(--surface-input)] border border-primary/25",
                    "hover:border-primary/50 hover:bg-[var(--surface-input-focus)]",
                    "text-primary/80 font-mono text-sm tracking-wide",
                    "transition-all duration-200",
                    !projectStartDate && "text-primary/20",
                  )}
                >
                  <span className="flex items-center gap-2">
                    <CalendarIcon className="h-3.5 w-3.5 text-primary/35 shrink-0" />
                    {projectStartDate ? formatDisplayDate(projectStartDate) : "Choisir"}
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-[#020c12]/99 backdrop-blur-2xl rounded-none border border-primary/20" align="start">
                <Calendar mode="single" selected={projectStartDate} onSelect={onProjectStartDateChange} initialFocus />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <span className="w-1 h-1 bg-primary/40 rotate-45 inline-block shrink-0" />
              <label className="ds-t-label uppercase tracking-[0.22em] text-primary/40 font-mono font-semibold">Date de fin</label>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className={cn(
                    "w-full flex items-center justify-between px-3 h-11",
                    "bg-[var(--surface-input)] border border-primary/25",
                    "hover:border-primary/50 hover:bg-[var(--surface-input-focus)]",
                    "text-primary/80 font-mono text-sm tracking-wide",
                    "transition-all duration-200",
                    !projectEndDate && "text-primary/20",
                  )}
                >
                  <span className="flex items-center gap-2">
                    <CalendarIcon className="h-3.5 w-3.5 text-primary/35 shrink-0" />
                    {projectEndDate ? formatDisplayDate(projectEndDate) : "Choisir"}
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-[#020c12]/99 backdrop-blur-2xl rounded-none border border-primary/20" align="start">
                <Calendar mode="single" selected={projectEndDate} onSelect={onProjectEndDateChange} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {dateValidationError && (
          <p className="ds-t-label text-destructive font-mono tracking-wider flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-destructive" />{dateValidationError}
          </p>
        )}

        <Bouton role="primaire" pleine onClick={handleSave} disabled={saving || !!dateValidationError}>
          {saving ? <><Loader2 className="animate-spin" />Enregistrement…</> : "Enregistrer l’échéance"}
        </Bouton>
      </div>
    </DataPanel>
  );
}
