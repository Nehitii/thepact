import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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
  { value: "60", label: "1h" },
  { value: "1440", label: "1 day" },
];

export function ReminderEditor({ reminders, onChange }: ReminderEditorProps) {
  const { t } = useTranslation();

  const add = () => {
    onChange([...reminders, { type: "notification", minutes_before: 15 }]);
  };

  const remove = (idx: number) => {
    onChange(reminders.filter((_, i) => i !== idx));
  };

  const update = (idx: number, minutes: number) => {
    const next = [...reminders];
    next[idx] = { ...next[idx], minutes_before: minutes };
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs flex items-center gap-1.5">
          <Bell className="h-3.5 w-3.5" />
          {t("calendar.reminders", "Reminders")}
        </Label>
        <Button variant="ghost" size="sm" onClick={add} className="h-6 text-xs gap-1">
          <Plus className="h-3 w-3" />
          {t("common.add")}
        </Button>
      </div>

      {reminders.map((r, i) => (
        <div key={i} className="flex items-center gap-2">
          <Select
            value={String(r.minutes_before)}
            onValueChange={(v) => update(i, Number(v))}
          >
            <SelectTrigger className="h-8 text-xs flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRESETS.map((p) => (
                <SelectItem key={p.value} value={p.value}>{p.label} {t("calendar.before", "before")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => remove(i)}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      ))}
    </div>
  );
}
