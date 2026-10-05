import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type ItemType = "required" | "optional";

export type DuplicateMergePreview = {
  name: string;
  goalName?: string | null;
  goalId?: string | null;
  category?: string | null;
  estimatedCost: number;
  itemType: ItemType;
  notes?: string | null;
};

export function DuplicateMergeDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existing: DuplicateMergePreview;
  incoming: DuplicateMergePreview;
  isBusy?: boolean;
  onMerge: () => void;
  onKeepBoth: () => void;
}) {
  const { open, onOpenChange, existing, incoming, isBusy, onMerge, onKeepBoth } = props;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="animate-enter">
        <AlertDialogHeader>
          <AlertDialogTitle>Duplicate detected</AlertDialogTitle>
        </AlertDialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            An item with the same name and linked goal already exists. You can merge them to keep your list clean.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border p-3 space-y-2">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Existing</p>
              <div className="space-y-1">
                <p className="font-medium leading-tight">{existing.name}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={existing.itemType === "required" ? "default" : "secondary"}>
                    {existing.itemType === "required" ? "Required" : "Optional"}
                  </Badge>
                  {existing.category ? <Badge variant="outline">{existing.category}</Badge> : null}
                  {existing.goalName ? <Badge variant="outline">{existing.goalName}</Badge> : null}
                </div>
                <p className="text-sm text-muted-foreground">Cost: {existing.estimatedCost}</p>
              </div>
            </div>

            <div className="rounded-lg border border-border p-3 space-y-2">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Incoming</p>
              <div className="space-y-1">
                <p className="font-medium leading-tight">{incoming.name}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={incoming.itemType === "required" ? "default" : "secondary"}>
                    {incoming.itemType === "required" ? "Required" : "Optional"}
                  </Badge>
                  {incoming.category ? <Badge variant="outline">{incoming.category}</Badge> : null}
                  {incoming.goalName ? <Badge variant="outline">{incoming.goalName}</Badge> : null}
                </div>
                <p className="text-sm text-muted-foreground">Cost: {incoming.estimatedCost}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
            <Button variant="outline" onClick={onKeepBoth} disabled={isBusy}>
              Keep both
            </Button>
            <Button onClick={onMerge} disabled={isBusy}>
              Merge into existing
            </Button>
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
