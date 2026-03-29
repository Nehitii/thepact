import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Trash2, MapPin, Tag, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { format, parseISO } from "date-fns";
import type { CalendarEvent, CalendarEventInsert } from "@/hooks/useCalendarEvents";
import { RecurrenceEditor } from "./RecurrenceEditor";
import { ReminderEditor } from "./ReminderEditor";

const COLORS = [
  "#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6",
  "#ec4899", "#06b6d4", "#f97316", "#14b8a6", "#6366f1",
];

interface EventDetailModalProps {
  open: boolean;
  onClose: () => void;
  event?: CalendarEvent | null;
  defaultDate?: Date;
  onSave: (data: Partial<CalendarEventInsert>) => void;
  onDelete?: (id: string) => void;
}

export function EventDetailModal({ open, onClose, event, defaultDate, onSave, onDelete }: EventDetailModalProps) {
  const { t } = useTranslation();
  const isEdit = !!event && !event._virtual;

  const defaultStart = defaultDate ?? new Date();
  const defaultEnd = new Date(defaultStart.getTime() + 3600000);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [allDay, setAllDay] = useState(false);
  const [color, setColor] = useState(COLORS[0]);
  const [category, setCategory] = useState("general");
  const [isBusy, setIsBusy] = useState(true);
  const [recurrenceRule, setRecurrenceRule] = useState<any>(null);
  const [reminders, setReminders] = useState<{ type: string; minutes_before: number }[]>([]);

  useEffect(() => {
    if (event) {
      const s = parseISO(event.start_time);
      const e = parseISO(event.end_time);
      setTitle(event.title);
      setDescription(event.description ?? "");
      setLocation(event.location ?? "");
      setStartDate(format(s, "yyyy-MM-dd"));
      setStartTime(format(s, "HH:mm"));
      setEndDate(format(e, "yyyy-MM-dd"));
      setEndTime(format(e, "HH:mm"));
      setAllDay(event.all_day);
      setColor(event.color);
      setCategory(event.category);
      setIsBusy(event.is_busy);
      setRecurrenceRule(event.recurrence_rule);
      setReminders(event.reminders ?? []);
    } else {
      setTitle("");
      setDescription("");
      setLocation("");
      setStartDate(format(defaultStart, "yyyy-MM-dd"));
      setStartTime(format(defaultStart, "HH:mm"));
      setEndDate(format(defaultEnd, "yyyy-MM-dd"));
      setEndTime(format(defaultEnd, "HH:mm"));
      setAllDay(false);
      setColor(COLORS[0]);
      setCategory("general");
      setIsBusy(true);
      setRecurrenceRule(null);
      setReminders([]);
    }
  }, [event, open]);

  const handleSave = () => {
    if (!title.trim()) return;
    const start_time = allDay ? `${startDate}T00:00:00` : `${startDate}T${startTime}:00`;
    const end_time = allDay ? `${endDate || startDate}T23:59:59` : `${endDate || startDate}T${endTime}:00`;
    onSave({
      title: title.trim(),
      description: description || null,
      location: location || null,
      start_time,
      end_time,
      all_day: allDay,
      color,
      category,
      is_busy: isBusy,
      recurrence_rule: recurrenceRule,
      reminders,
      tags: [],
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto bg-card border-border/60">
        <DialogHeader>
          <DialogTitle className="font-orbitron text-sm">
            {isEdit ? t("calendar.editEvent", "Edit Event") : t("calendar.newEvent", "New Event")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Title */}
          <div>
            <Input
              placeholder={t("calendar.eventTitle", "Event title")}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-base font-medium"
              autoFocus
            />
          </div>

          {/* All day toggle */}
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2 text-xs">
              <Clock className="h-3.5 w-3.5" />
              {t("calendar.allDay", "All day")}
            </Label>
            <Switch checked={allDay} onCheckedChange={setAllDay} />
          </div>

          {/* Date / Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[10px]">{t("calendar.startDate", "Start")}</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-9 text-xs" />
            </div>
            {!allDay && (
              <div>
                <Label className="text-[10px]">{t("calendar.startTime", "Time")}</Label>
                <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="h-9 text-xs" />
              </div>
            )}
            <div>
              <Label className="text-[10px]">{t("calendar.endDate", "End")}</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-9 text-xs" />
            </div>
            {!allDay && (
              <div>
                <Label className="text-[10px]">{t("calendar.endTime", "Time")}</Label>
                <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="h-9 text-xs" />
              </div>
            )}
          </div>

          {/* Color picker */}
          <div>
            <Label className="text-[10px] mb-1.5 block">{t("calendar.color", "Color")}</Label>
            <div className="flex gap-1.5 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className="w-6 h-6 rounded-full transition-all ring-offset-background"
                  style={{
                    backgroundColor: c,
                    boxShadow: color === c ? `0 0 0 2px var(--background), 0 0 0 4px ${c}` : "none",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Location */}
          <div>
            <Label className="text-[10px] flex items-center gap-1 mb-1">
              <MapPin className="h-3 w-3" /> {t("calendar.location", "Location")}
            </Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} className="h-9 text-xs" placeholder="Optional" />
          </div>

          {/* Description */}
          <div>
            <Label className="text-[10px] mb-1 block">{t("calendar.description", "Description")}</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="text-xs min-h-[60px]" />
          </div>

          {/* Recurrence */}
          <RecurrenceEditor rule={recurrenceRule} onChange={setRecurrenceRule} />

          {/* Reminders */}
          <ReminderEditor reminders={reminders} onChange={setReminders} />

          {/* Busy */}
          <div className="flex items-center justify-between">
            <Label className="text-xs">{t("calendar.markBusy", "Mark as busy")}</Label>
            <Switch checked={isBusy} onCheckedChange={setIsBusy} />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            <Button onClick={handleSave} className="flex-1">
              {isEdit ? t("common.saveChanges") : t("common.create")}
            </Button>
            {isEdit && onDelete && event && (
              <Button variant="destructive" size="icon" onClick={() => { onDelete(event.id); onClose(); }}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
