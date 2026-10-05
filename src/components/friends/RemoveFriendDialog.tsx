import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTranslation } from "react-i18next";

interface RemoveFriendDialogProps {
  open: boolean;
  friendName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function RemoveFriendDialog({ open, friendName, onConfirm, onCancel }: RemoveFriendDialogProps) {
  const { t } = useTranslation();

  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <AlertDialogContent className="font-rajdhani">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-orbitron tracking-wider">
            {t("friends.removeFriend")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("friends.removeConfirm", { name: friendName || t("friends.unknownAgent") })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>{t("common.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
          >
            {t("common.remove")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
