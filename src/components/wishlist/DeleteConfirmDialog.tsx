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

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName: string;
  isSynced?: boolean;
  onConfirm: () => void;
}

export function DeleteConfirmDialog({ open, onOpenChange, itemName, isSynced, onConfirm }: DeleteConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-card/95 backdrop-blur-2xl border-destructive/20">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-orbitron text-destructive tracking-wider text-sm uppercase">
            Confirm Deletion
          </AlertDialogTitle>
          <AlertDialogDescription className="font-rajdhani text-base text-muted-foreground">
            Remove <span className="font-semibold text-foreground">"{itemName}"</span> from your wishlist?
            {isSynced && (
              <span className="block mt-2 text-amber-400 text-sm">
                ⚠ This item is synced from a goal. It may be re-created on next sync.
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="font-rajdhani">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-rajdhani"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
