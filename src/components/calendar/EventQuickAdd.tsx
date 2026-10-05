import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";

interface EventQuickAddProps {
  date: Date;
  open: boolean;
  onClose: () => void;
  onSave: (data: { title: string; start_time: string; end_time: string; all_day: boolean }) => void;
  children: React.ReactNode;
}

export function EventQuickAdd({ date, open, onClose, onSave, children }: EventQuickAddProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");

  const handleSave = () => {
    if (!title.trim()) return;
    const dateStr = format(date, "yyyy-MM-dd");
    onSave({
      title: title.trim(),
      start_time: `${dateStr}T09:00:00`,
      end_time: `${dateStr}T10:00:00`,
      all_day: false,
    });
    setTitle("");
    onClose();
  };

  return (
    <Popover open={open} onOpenChange={(o) => !o && onClose()}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        <p className="text-xs text-muted-foreground mb-2">{format(date, "EEEE d MMM")}</p>
        <Input
          placeholder={t("calendar.eventTitle", "Event title")}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          className="h-8 text-xs mb-2"
          autoFocus
        />
        <div className="flex gap-1.5">
          <Button size="sm" className="h-7 text-xs flex-1" onClick={handleSave}>
            {t("common.create")}
          </Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={onClose}>
            {t("common.cancel")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
