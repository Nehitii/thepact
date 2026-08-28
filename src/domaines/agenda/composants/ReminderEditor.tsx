import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, X, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Reminder {
  type: string;
  minutes_before: number;
}

interface ReminderEditorProps {
  reminders: Reminder[];
  onChange: (r: Reminder[]) => void;
}

const PRESETS = [
  { value: "5", label: "5 min" },
  { value: "15", label: "15 min" },
  { value: "30", label: "30 min" },
  { value: "60", label: "1 h" },
  // « 1 day » etait la seule etiquette ecrite en dur, en anglais.
  { value: "1440", key: "calendar.oneDay", label: "1 day" },
] as { value: string; label: string; key?: string }[];

export function ReminderEditor({ reminders, onChange }: ReminderEditorProps) {
  const { t } = useTranslation();

  const add = () => onChange([...reminders, { type: "notification", minutes_before: 15 }]);
  const remove = (idx: number) => onChange(reminders.filter((_, i) => i !== idx));
  const update = (idx: number, minutes: number) => {
    const next = [...reminders];
    next[idx] = { ...next[idx], minutes_before: minutes };
    onChange(next);
  };

  return (
    <div className="cal-dlg-bloc">
      <div className="flex items-center justify-between gap-3">
        <span className="cal-dlg-etiq" style={{ marginBottom: 0 }}>
          <Bell className="inline-block h-3 w-3 mr-1.5 -mt-0.5" aria-hidden="true" />
          {t("calendar.reminders", "Reminders")}
        </span>
        <button type="button" onClick={add} className="cal-outil est-menu">
          <Plus className="h-3 w-3" aria-hidden="true" />
          {t("common.add")}
        </button>
      </div>

      {reminders.length > 0 && (
        <div className="mt-3 space-y-2">
          {reminders.map((r, i) => (
            <div key={i} className="flex items-center gap-2">
              <Select value={String(r.minutes_before)} onValueChange={(v) => update(i, Number(v))}>
                <SelectTrigger className="h-8 flex-1 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRESETS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.key ? t(p.key, p.label) : p.label} {t("calendar.before", "before")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <button
                type="button"
                onClick={() => remove(i)}
                className="cal-outil est-icone"
                aria-label={t("calendar.removeReminder", "Remove reminder")}
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
