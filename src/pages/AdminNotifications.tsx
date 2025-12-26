import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Shield,
  Bell,
  Send,
  Users,
  Gift,
  Loader2,
  MessageSquare,
  Star,
  Trophy,
  Zap,
  Heart,
  Info,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type NotificationCategory = "system" | "progress" | "social" | "marketing";
type NotificationPriority = "critical" | "important" | "informational" | "social" | "silent";
type RewardType = "bonds" | "frame" | "banner" | "title";

// Icon mapping for preview
const iconComponents: Record<string, React.ComponentType<{ className?: string }>> = {
  bell: Bell,
  gift: Gift,
  star: Star,
  trophy: Trophy,
  zap: Zap,
  heart: Heart,
  info: Info,
  warning: AlertTriangle,
};

export default function AdminNotifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mode: notification or message
  const [mode, setMode] = useState<"notification" | "message">("notification");

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<NotificationCategory>("system");
  const [priority, setPriority] = useState<NotificationPriority>("informational");
  const [iconKey, setIconKey] = useState("bell");
  const [ctaLabel, setCtaLabel] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");
  const [attachReward, setAttachReward] = useState(false);
  const [rewardType, setRewardType] = useState<RewardType>("bonds");
  const [rewardAmount, setRewardAmount] = useState(0);
  const [rewardCosmeticId, setRewardCosmeticId] = useState("");
  const [targetAll, setTargetAll] = useState(true);
  const [targetUserId, setTargetUserId] = useState("");

  // Check admin status
  const { data: adminCheck, isLoading: adminLoading } = useQuery({
    queryKey: ["admin-check", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      return !!data;
    },
    enabled: !!user,
  });

  // Handle admin check result
  if (!adminLoading && adminCheck === false) {
    navigate("/");
    return null;
  }

  const isAdminVerified = adminCheck === true;

  // Fetch all users for targeting
  const { data: allUsers = [] } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, display_name")
        .order("display_name");
      return data || [];
    },
    enabled: isAdminVerified,
  });

  // Fetch cosmetics for reward selection
  const { data: frames = [] } = useQuery({
    queryKey: ["admin-frames"],
    queryFn: async () => {
      const { data } = await supabase
        .from("cosmetic_frames")
        .select("id, name")
        .eq("is_active", true);
      return data || [];
    },
    enabled: isAdminVerified && rewardType === "frame",
  });

  const { data: banners = [] } = useQuery({
    queryKey: ["admin-banners"],
    queryFn: async () => {
      const { data } = await supabase
        .from("cosmetic_banners")
        .select("id, name")
        .eq("is_active", true);
      return data || [];
    },
    enabled: isAdminVerified && rewardType === "banner",
  });

  const { data: titles = [] } = useQuery({
    queryKey: ["admin-titles"],
    queryFn: async () => {
      const { data } = await supabase
        .from("cosmetic_titles")
        .select("id, title_text")
        .eq("is_active", true);
      return data || [];
    },
    enabled: isAdminVerified && rewardType === "title",
  });

  // Send notification mutation
  const sendNotification = useMutation({
    mutationFn: async () => {
      if (targetAll) {
        // Send to all users
        const { data: users } = await supabase
          .from("profiles")
          .select("id");
        
        if (!users || users.length === 0) {
          throw new Error("No users found");
        }

        const notifications = users.map((u) => ({
          user_id: u.id,
          title,
          description: description || null,
          category,
          priority,
          icon_key: iconKey,
          cta_label: ctaLabel || null,
          cta_url: ctaUrl || null,
          reward_type: attachReward ? rewardType : null,
          reward_amount: attachReward && rewardType === "bonds" ? rewardAmount : null,
          reward_cosmetic_id: attachReward && rewardType !== "bonds" ? rewardCosmeticId : null,
          reward_cosmetic_type: attachReward && rewardType !== "bonds" ? rewardType : null,
        }));

        const { error } = await supabase.from("notifications").insert(notifications);
        if (error) throw error;
        return users.length;
      } else {
        // Send to specific user
        const { error } = await supabase.from("notifications").insert({
          user_id: targetUserId,
          title,
          description: description || null,
          category,
          priority,
          icon_key: iconKey,
          cta_label: ctaLabel || null,
          cta_url: ctaUrl || null,
          reward_type: attachReward ? rewardType : null,
          reward_amount: attachReward && rewardType === "bonds" ? rewardAmount : null,
          reward_cosmetic_id: attachReward && rewardType !== "bonds" ? rewardCosmeticId : null,
          reward_cosmetic_type: attachReward && rewardType !== "bonds" ? rewardType : null,
        });
        if (error) throw error;
        return 1;
      }
    },
    onSuccess: (count) => {
      toast({
        title: mode === "notification" ? "Notification Sent" : "Message Sent",
        description: `Successfully sent to ${count} user${count > 1 ? "s" : ""}`,
      });
      // Reset form
      setTitle("");
      setDescription("");
      setCtaLabel("");
      setCtaUrl("");
      setAttachReward(false);
      setRewardAmount(0);
      setRewardCosmeticId("");
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (adminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary animate-pulse font-orbitron">Verifying admin access...</div>
      </div>
    );
  }

  if (!isAdminVerified) {
    return null;
  }

  const canSend = title.trim() && (targetAll || targetUserId);

  // Get the preview icon component
  const PreviewIcon = iconComponents[iconKey] || Bell;

  // Get cosmetics list based on reward type
  const getCosmeticsList = () => {
    switch (rewardType) {
      case "frame":
        return frames.map(f => ({ id: f.id, name: f.name }));
      case "banner":
        return banners.map(b => ({ id: b.id, name: b.name }));
      case "title":
        return titles.map(t => ({ id: t.id, name: t.title_text }));
      default:
        return [];
    }
  };

  return (
    <div className="min-h-screen bg-background relative">
      {/* Admin Mode Indicator */}
      <div className="fixed top-4 right-4 z-50">
        <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/50 px-3 py-1.5 gap-2">
          <Shield className="h-4 w-4" />
          Admin Mode
        </Badge>
      </div>

      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-amber-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-2xl mx-auto p-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <Bell className="h-10 w-10 text-amber-400" />
          </div>
          <h1 className="text-3xl font-orbitron text-amber-400 tracking-wider mb-2">
            Notifications & Messages
          </h1>
          <p className="text-primary/60 font-rajdhani">
            Send notifications or messages to users
          </p>
        </div>

        {/* Mode Selector */}
        <Tabs value={mode} onValueChange={(v) => setMode(v as "notification" | "message")} className="mb-6">
          <TabsList className="w-full bg-card/50 border border-primary/20 p-1">
            <TabsTrigger
              value="notification"
              className="flex-1 data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400"
            >
              <Bell className="h-4 w-4 mr-2" />
              Send Notification
            </TabsTrigger>
            <TabsTrigger
              value="message"
              className="flex-1 data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-400"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Send Message
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Form */}
        <Card variant="clean" className="p-6 bg-card/50 space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-primary">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={mode === "notification" ? "Notification title..." : "Message subject..."}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-primary">
              {mode === "notification" ? "Description" : "Message Content"}
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={mode === "notification" ? "Optional description..." : "Write your message..."}
              className="min-h-[80px]"
            />
          </div>

          {/* Category & Priority (only for notifications) */}
          {mode === "notification" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-primary">Category</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as NotificationCategory)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="progress">Progress</SelectItem>
                    <SelectItem value="social">Social</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-primary">Priority</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as NotificationPriority)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="important">Important</SelectItem>
                    <SelectItem value="informational">Informational</SelectItem>
                    <SelectItem value="social">Social</SelectItem>
                    <SelectItem value="silent">Silent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Icon (only for notifications) */}
          {mode === "notification" && (
            <div className="space-y-2">
              <Label className="text-primary">Icon Key</Label>
              <Select value={iconKey} onValueChange={setIconKey}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bell">Bell</SelectItem>
                  <SelectItem value="gift">Gift</SelectItem>
                  <SelectItem value="star">Star</SelectItem>
                  <SelectItem value="trophy">Trophy</SelectItem>
                  <SelectItem value="zap">Zap</SelectItem>
                  <SelectItem value="heart">Heart</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* CTA (only for notifications) */}
          {mode === "notification" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-primary">CTA Label (optional)</Label>
                <Input
                  value={ctaLabel}
                  onChange={(e) => setCtaLabel(e.target.value)}
                  placeholder="e.g., View Details"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-primary">CTA URL (optional)</Label>
                <Input
                  value={ctaUrl}
                  onChange={(e) => setCtaUrl(e.target.value)}
                  placeholder="e.g., /shop"
                />
              </div>
            </div>
          )}

          {/* Reward Attachment */}
          <div className="border border-amber-500/30 rounded-lg p-4 bg-amber-500/5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-amber-400" />
                <Label className="text-amber-400">Attach Reward</Label>
              </div>
              <Switch
                checked={attachReward}
                onCheckedChange={setAttachReward}
              />
            </div>
            {attachReward && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-primary/70">Reward Type</Label>
                  <Select value={rewardType} onValueChange={(v) => {
                    setRewardType(v as RewardType);
                    setRewardCosmeticId("");
                    setRewardAmount(0);
                  }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bonds">Bonds</SelectItem>
                      <SelectItem value="frame">Avatar Frame</SelectItem>
                      <SelectItem value="banner">Banner</SelectItem>
                      <SelectItem value="title">Title</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {rewardType === "bonds" ? (
                  <div className="space-y-2">
                    <Label className="text-primary/70">Amount</Label>
                    <Input
                      type="number"
                      value={rewardAmount}
                      onChange={(e) => setRewardAmount(Number(e.target.value))}
                      min={0}
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label className="text-primary/70">Select {rewardType}</Label>
                    <Select value={rewardCosmeticId} onValueChange={setRewardCosmeticId}>
                      <SelectTrigger>
                        <SelectValue placeholder={`Select a ${rewardType}...`} />
                      </SelectTrigger>
                      <SelectContent>
                        {getCosmeticsList().map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Target Selection */}
          <div className="border border-primary/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <Label className="text-primary">Target All Users</Label>
              </div>
              <Switch
                checked={targetAll}
                onCheckedChange={setTargetAll}
              />
            </div>
            {!targetAll && (
              <div className="space-y-2">
                <Label className="text-primary/70">Select User</Label>
                <Select value={targetUserId} onValueChange={setTargetUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a user..." />
                  </SelectTrigger>
                  <SelectContent>
                    {allUsers.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.display_name || u.id.slice(0, 8)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="border border-primary/20 rounded-lg p-4 bg-background/30">
            <Label className="text-primary/70 mb-2 block">Preview</Label>
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <PreviewIcon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-primary">{title || (mode === "notification" ? "Notification Title" : "Message Subject")}</p>
                  <p className="text-sm text-muted-foreground">{description || "Description..."}</p>
                  {attachReward && (rewardAmount > 0 || rewardCosmeticId) && (
                    <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 rounded bg-amber-500/20 text-amber-400 text-xs">
                      <Gift className="h-3 w-3" />
                      {rewardType === "bonds" ? `+${rewardAmount} Bonds` : `Free ${rewardType}`}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Send Button */}
          <Button
            onClick={() => sendNotification.mutate()}
            disabled={!canSend || sendNotification.isPending}
            className={`w-full border ${
              mode === "notification"
                ? "bg-amber-500/20 text-amber-400 border-amber-500/50 hover:bg-amber-500/30"
                : "bg-violet-500/20 text-violet-400 border-violet-500/50 hover:bg-violet-500/30"
            }`}
          >
            {sendNotification.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            {targetAll ? `Send ${mode === "notification" ? "Notification" : "Message"} to All Users` : `Send to User`}
          </Button>
        </Card>
      </div>
    </div>
  );
}