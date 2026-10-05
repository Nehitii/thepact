import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash2, AlertTriangle } from "lucide-react";

interface AdminDeleteConfirmProps {
  onConfirm: () => void;
  itemName: string;
  itemType?: string;
}

export function AdminDeleteConfirm({ onConfirm, itemName, itemType = "item" }: AdminDeleteConfirmProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="icon" variant="ghost" className="text-red-400/60 hover:text-red-400">
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-card border-primary/30">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-primary flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
            Delete {itemType}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-primary/60">
            Are you sure you want to delete <strong className="text-primary">"{itemName}"</strong>? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-primary/30 text-primary">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
