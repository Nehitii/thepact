import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useTranslation } from "react-i18next";
import { Repeat } from "lucide-react";
import type { RecurrenceRule } from "@/hooks/useCalendarEvents";

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
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs flex items-center gap-1.5">
          <Repeat className="h-3.5 w-3.5" />
          {t("calendar.recurrence", "Repeat")}
        </Label>
        <Switch checked={enabled} onCheckedChange={toggleEnabled} />
      </div>

      {enabled && rule && (
        <div className="space-y-2 pl-2 border-l-2 border-primary/30 ml-2">
          <div className="flex items-center gap-2">
            <Label className="text-[10px] shrink-0">{t("calendar.every", "Every")}</Label>
            <Input
              type="number"
              min={1}
              max={99}
              value={rule.interval || 1}
              onChange={(e) => update({ interval: Number(e.target.value) || 1 })}
              className="h-8 w-16 text-xs"
            />
            <Select value={rule.freq} onValueChange={(v) => update({ freq: v as any })}>
              <SelectTrigger className="h-8 text-xs flex-1">
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
              <Label className="text-[10px] mb-1 block">{t("calendar.onDays", "On days")}</Label>
              <div className="flex gap-1">
                {DAYS.map((d) => {
                  const active = rule.byDay?.includes(d);
                  return (
                    <button
                      key={d}
                      onClick={() => {
                        const current = rule.byDay ?? [];
                        const next = active ? current.filter((x) => x !== d) : [...current, d];
                        update({ byDay: next.length > 0 ? next : undefined });
                      }}
                      className={`w-7 h-7 rounded-md text-[10px] font-bold transition-all ${
                        active
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted/50 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {d.slice(0, 2)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <Label className="text-[10px]">{t("calendar.until", "Until (optional)")}</Label>
            <Input
              type="date"
              value={rule.until ?? ""}
              onChange={(e) => update({ until: e.target.value || undefined })}
              className="h-8 text-xs"
            />
          </div>
        </div>
      )}
    </div>
  );
}
