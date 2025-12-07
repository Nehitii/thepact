import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ProfileMenuCard } from "./ProfileMenuCard";
import { useToast } from "@/hooks/use-toast";
import { DollarSign } from "lucide-react";
export function ProfileFinanceSettings() {
  const {
    toast
  } = useToast();
  const [saving, setSaving] = useState(false);
  const handleSave = async () => {
    setSaving(true);

    // Placeholder for future finance settings save logic
    await new Promise(resolve => setTimeout(resolve, 500));
    toast({
      title: "Finance Settings Updated",
      description: "Your finance preferences have been saved"
    });
    setSaving(false);
  };
  return <ProfileMenuCard icon={<DollarSign className="h-5 w-5 text-primary" />} title="Finance Settings" description="Financial configuration and preferences">
      <div className="space-y-6">
        <div className="flex items-center justify-center py-8 text-center rounded-lg border border-primary/20 bg-slate-700">
          <p className="text-sm text-primary/60 font-rajdhani">
            More finance configuration options will appear here soon.
          </p>
        </div>

        {/* Save Button */}
        <Button onClick={handleSave} disabled={saving} className="w-full bg-primary/20 border-2 border-primary/30 hover:border-primary/50 hover:bg-primary/30 text-primary font-orbitron uppercase tracking-wider">
          {saving ? "SAVING..." : "SAVE CHANGES"}
        </Button>
      </div>
    </ProfileMenuCard>;
}