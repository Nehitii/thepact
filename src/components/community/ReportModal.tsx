import { useState } from "react";
import { Flag } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useReportContent } from "@/hooks/useCommunity";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId?: string;
  reelId?: string;
  replyId?: string;
}

const reasons = [
  "Spam or misleading",
  "Harassment or bullying",
  "Inappropriate content",
  "Impersonation",
  "Other",
];

export function ReportModal({ isOpen, onClose, postId, reelId, replyId }: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState("");
  const [details, setDetails] = useState("");
  const report = useReportContent();

  const handleSubmit = async () => {
    if (!selectedReason) {
      toast.error("Please select a reason");
      return;
    }

    try {
      await report.mutateAsync({
        post_id: postId,
        reel_id: reelId,
        reply_id: replyId,
        reason: details ? `${selectedReason}: ${details}` : selectedReason,
      });
      toast.success("Report submitted. Thank you for keeping the community safe.");
      setSelectedReason("");
      setDetails("");
      onClose();
    } catch {
      toast.error("Failed to submit report");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px] bg-background/95 backdrop-blur-lg border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Flag className="w-5 h-5 text-destructive" />
            Report Content
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Why are you reporting this?</Label>
            <div className="space-y-1.5">
              {reasons.map((reason) => (
                <button
                  key={reason}
                  onClick={() => setSelectedReason(reason)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-sm transition-all border",
                    selectedReason === reason
                      ? "border-destructive/50 bg-destructive/10 text-foreground"
                      : "border-border/50 bg-muted/30 text-muted-foreground hover:text-foreground"
                  )}
                >
                  {reason}
                </button>
              ))}
            </div>
          </div>

          {selectedReason === "Other" && (
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Additional details</Label>
              <Textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Describe the issue..."
                className="min-h-[80px] resize-none bg-muted/30"
                maxLength={300}
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={handleSubmit}
              disabled={!selectedReason || report.isPending}
            >
              {report.isPending ? "Submitting..." : "Report"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
