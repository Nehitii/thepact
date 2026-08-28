import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/socle/ui/select";
import { Switch } from "@/socle/ui/switch";
import { useTranslation } from "react-i18next";
import { Repeat } from "lucide-react";
import type { RecurrenceRule } from "@/domaines/agenda/types";

interface RecurrenceEditorProps {
  rule: RecurrenceRule | null;
  onChange: (rule: RecurrenceRule | null) => void;
}

const DAYS = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];

export function RecurrenceEditor({ rule, onChange }: RecurrenceEditorProps) {
  const { t } = useTranslation();
  const enabled = !!rule;

  const toggleEnabled = (on: boolean) => {
    onChange(on ? { freq: "weekly", interval: 1 } : null);
  };

  const update = (patch: Partial<RecurrenceRule>) => {
    if (!rule) return;
    onChange({ ...rule, ...patch });
  };

  return (
    <div className="cal-dlg-bloc">
      <div className="flex items-center justify-between gap-3">
        <span id="cal-lbl-repeat" className="cal-dlg-etiq" style={{ marginBottom: 0 }}>
          <Repeat className="inline-block h-3 w-3 mr-1.5 -mt-0.5" aria-hidden="true" />
          {t("calendar.recurrence", "Repeat")}
        </span>
        <Switch checked={enabled} onCheckedChange={toggleEnabled} aria-labelledby="cal-lbl-repeat" />
      </div>

      {enabled && rule && (
        <div className="mt-3 space-y-3">
          <div className="flex items-center gap-2">
            <span className="cal-dlg-etiq shrink-0" style={{ marginBottom: 0 }}>
              {t("calendar.every", "Every")}
            </span>
            <input
              type="number"
              min={1}
              max={99}
              aria-label={t("calendar.every", "Every")}
              value={rule.interval || 1}
              onChange={(e) => update({ interval: Number(e.target.value) || 1 })}
              className="h-8 w-16 px-2 text-center"
            />
            <Select value={rule.freq} onValueChange={(v) => update({ freq: v as RecurrenceRule["freq"] })}>
              <SelectTrigger className="h-8 flex-1 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">{t("calendar.daily", "Day(s)")}</SelectItem>
                <SelectItem value="weekly">{t("calendar.weekly", "Week(s)")}</SelectItem>
                <SelectItem value="monthly">{t("calendar.monthly", "Month(s)")}</SelectItem>
                <SelectItem value="yearly">{t("calendar.yearly", "Year(s)")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {rule.freq === "weekly" && (
            <div>
              <span className="cal-dlg-etiq">{t("calendar.onDays", "On days")}</span>
              <div className="cal-dlg-jours" role="group" aria-label={t("calendar.onDays", "On days")}>
                {DAYS.map((d) => {
                  const active = rule.byDay?.includes(d);
                  return (
                    <button
                      key={d}
                      type="button"
                      aria-label={t("calendar.days." + d, d)}
                      aria-pressed={!!active}
                      className="cal-dlg-jour"
                      onClick={() => {
                        const current = rule.byDay ?? [];
                        const next = active ? current.filter((x) => x !== d) : [...current, d];
                        update({ byDay: next.length > 0 ? next : undefined });
                      }}
                    >
                      {d.slice(0, 2)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="cal-dlg-champ">
            <label className="cal-dlg-etiq" htmlFor="cal-recurrence-until">
              {t("calendar.until", "Until (optional)")}
            </label>
            <input
              id="cal-recurrence-until"
              type="date"
              value={rule.until ?? ""}
              onChange={(e) => update({ until: e.target.value || undefined })}
              className="h-8 w-full px-2.5"
            />
          </div>
        </div>
      )}
    </div>
  );
}
