import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { aLHeure } from "./temps";

interface EventQuickAddProps {
  date: Date;
  open: boolean;
  /* Le declencheur de Radix appelle onOpenChange(true) au clic ET a la
     touche Entree. Faute de recevoir cette ouverture, la case avait du
     poser un onDoubleClick a la main — un chemin que le clavier ne peut
     pas emprunter, puisque Entree produit un clic, jamais un double. */
  onOpen: () => void;
  onClose: () => void;
  onSave: (data: { title: string; start_time: string; end_time: string; all_day: boolean }) => void;
  children: React.ReactNode;
}

export function EventQuickAdd({ date, open, onOpen, onClose, onSave, children }: EventQuickAddProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");

  const handleSave = () => {
    if (!title.trim()) return;
    /* Une vraie date locale, serialisee avec son fuseau : la chaine collee
       « aaaa-mm-jjT09:00:00 » etait relue par Postgres dans le fuseau du
       serveur, et deplacait le rendez-vous. */
    onSave({
      title: title.trim(),
      start_time: aLHeure(date, 9).toISOString(),
      end_time: aLHeure(date, 10).toISOString(),
      all_day: false,
    });
    setTitle("");
    onClose();
  };

  return (
    <Popover open={open} onOpenChange={(o) => (o ? onOpen() : onClose())}>
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
          <Button size="sm" className="h-7 text-xs flex-1" onClick={handleSave} disabled={!title.trim()}>
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
