import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, X } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useLogFocusDistraction } from "@/hooks/useFocusDistractions";

/**
 * Quick "log a distraction" button shown while a Focus session is running.
 * One click opens an inline note input; saves to focus_distractions.
 */
export function FocusDistractionButton() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const log = useLogFocusDistraction();

  const submit = async () => {
    const trimmed = note.trim();
    if (!trimmed) return;
    try {
      await log.mutateAsync({ note: trimmed });
      toast(t("focus.distraction.saved"), { duration: 1200 });
      setNote("");
      setOpen(false);
    } catch {
      toast.error(t("focus.distraction.error"));
    }
  };

  return (
    <div className="dst">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            className="dst-note"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="dst-titre">{t("focus.distraction.title")}</span>
              <button onClick={() => setOpen(false)} aria-label={t("common.close")}>
                <X className="w-3 h-3 text-muted-foreground hover:text-foreground" />
              </button>
            </div>
            <textarea
              autoFocus
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
              }}
              placeholder={t("focus.distraction.placeholder")}
              rows={3}
              className="dst-champ"
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={submit}
                disabled={!note.trim() || log.isPending}
                className="cyb cyb--petit cyb--or"
              >
                {t("focus.distraction.submit")}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label={t("focus.distraction.open")}
        className="cyb cyb--icone"
        aria-expanded={open}
      >
        <Brain className="w-5 h-5" />
      </motion.button>
    </div>
  );
}