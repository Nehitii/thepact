import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import { useMessages } from "@/hooks/useMessages";
import { NotificationCard } from "@/components/notifications/NotificationCard";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bell,
  MessageSquare,
  CheckCheck,
  Trash2,
  Settings,
  Inbox as InboxIcon,
  Search,
  Filter,
  RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// Composant Skeleton pour le chargement
const InboxSkeleton = () => (
  <div className="space-y-3">
    {[1, 2, 3].map((i) => (
      <div key={i} className="h-20 w-full bg-white/5 rounded-lg animate-pulse border border-white/5" />
    ))}
  </div>
);

export default function Inbox() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("notifications");

  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead, deleteNotification, clearAll } =
    useNotifications();

  const { conversations, unreadCount: messageUnreadCount, isLoading: messagesLoading } = useMessages();

  if (!user) return null;

  return (
    <div className="h-screen flex flex-col bg-background relative overflow-hidden font-rajdhani">
      {/* Background Cyberpunk Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] opacity-40" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-[120px] opacity-40" />
        {/* Scanline effect */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]" />
      </div>

      <div className="flex-1 flex flex-col max-w-5xl w-full mx-auto p-4 md:p-8 relative z-10 h-full">
        {/* --- HEADER --- */}
        <div className="flex items-center justify-between mb-6 shrink-0">
          <div className="flex items-center gap-5">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-violet-500 rounded-xl blur opacity-25 group-hover:opacity-60 transition duration-500" />
              <div className="relative w-14 h-14 rounded-xl bg-[#0a0f18] border border-white/10 flex items-center justify-center shadow-2xl">
                <InboxIcon className="h-7 w-7 text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-black font-orbitron text-foreground tracking-widest uppercase">
                {t("inbox.title")}
              </h1>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-xs font-mono tracking-widest uppercase opacity-70">Secure Connection Established</p>
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/profile/notifications")}
            className="border-white/10 bg-white/5 hover:bg-white/10 hover:border-primary/50 transition-all text-xs uppercase tracking-wider font-bold"
          >
            <Settings className="h-3.5 w-3.5 mr-2" />
            {t("common.settings")}
          </Button>
        </div>

        {/* --- MAIN CONTENT AREA --- */}
        <div className="flex-1 flex flex-col min-h-0 bg-[#0a0f18]/80 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative">
          {/* Decorative Top Border */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50" />

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col h-full">
            {/* --- TABS HEADER --- */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-black/20">
              <TabsList className="bg-transparent p-0 gap-6 h-auto">
                <TabItem
                  value="notifications"
                  icon={Bell}
                  label={t("inbox.tabs.notifications")}
                  count={unreadCount}
                  active={activeTab === "notifications"}
                />
                <TabItem
                  value="messages"
                  icon={MessageSquare}
                  label={t("inbox.tabs.messages")}
                  count={messageUnreadCount}
                  active={activeTab === "messages"}
                  color="violet"
                />
              </TabsList>

              {/* Toolbar Actions */}
              <div className="flex items-center gap-2">
                {activeTab === "notifications" && unreadCount > 0 && (
                  <ActionButton
                    onClick={() => markAllAsRead.mutate()}
                    icon={CheckCheck}
                    label={t("inbox.markAllRead")}
                    variant="primary"
                  />
                )}
                {activeTab === "notifications" && notifications.length > 0 && (
                  <ActionButton
                    onClick={() => clearAll.mutate()}
                    icon={Trash2}
                    label={t("inbox.clearAll")}
                    variant="destructive"
                  />
                )}
                {activeTab === "messages" && (
                  <div className="flex gap-2">
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* --- CONTENT --- */}
            <div className="flex-1 relative overflow-hidden bg-gradient-to-b from-transparent to-black/40">
              <AnimatePresence mode="wait">
                {/* NOTIFICATIONS PANEL */}
                <TabsContent value="notifications" className="h-full m-0 data-[state=inactive]:hidden">
                  <ScrollArea className="h-full w-full">
                    <div className="p-6 max-w-3xl mx-auto">
                      {isLoading ? (
                        <InboxSkeleton />
                      ) : notifications.length === 0 ? (
                        <EmptyState
                          icon={Bell}
                          title={t("inbox.emptyNotifications")}
                          desc={t("inbox.emptyNotificationsDesc")}
                        />
                      ) : (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                          {notifications.map((notification, index) => (
                            <motion.div
                              key={notification.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                            >
                              <NotificationCard
                                notification={notification}
                                onMarkAsRead={(id) => markAsRead.mutate(id)}
                                onDelete={(id) => deleteNotification.mutate(id)}
                              />
                            </motion.div>
                          ))}
                        </motion.div>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                {/* MESSAGES PANEL */}
                <TabsContent value="messages" className="h-full m-0 data-[state=inactive]:hidden">
                  <ScrollArea className="h-full w-full">
                    <div className="p-6 max-w-3xl mx-auto">
                      {messagesLoading ? (
                        <InboxSkeleton />
                      ) : conversations.length === 0 ? (
                        <EmptyState
                          icon={MessageSquare}
                          title={t("inbox.emptyMessages")}
                          desc={t("inbox.emptyMessagesDesc")}
                          color="text-violet-500"
                        />
                      ) : (
                        <div className="space-y-3">
                          {conversations.map((conv, index) => (
                            <motion.div
                              key={conv.other_user_id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              onClick={() => {
                                // Add navigation logic here
                                // navigate(`/inbox/thread/${conv.other_user_id}`)
                                console.log("Navigate to thread", conv.other_user_id);
                              }}
                              className={cn(
                                "group relative flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all duration-300",
                                "hover:bg-white/[0.03] hover:translate-x-1",
                                conv.unread_count > 0
                                  ? "bg-violet-500/10 border-violet-500/30 shadow-[0_0_15px_-5px_rgba(139,92,246,0.3)]"
                                  : "bg-[#0f141e] border-white/5 hover:border-white/10",
                              )}
                            >
                              {/* Left Accent Bar for Unread */}
                              {conv.unread_count > 0 && (
                                <div className="absolute left-0 top-3 bottom-3 w-1 bg-violet-500 rounded-r-full shadow-[0_0_8px_#8b5cf6]" />
                              )}

                              {/* Avatar */}
                              <div className="relative shrink-0">
                                <div
                                  className={cn(
                                    "w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold font-orbitron border-2",
                                    conv.unread_count > 0
                                      ? "bg-violet-950 text-violet-200 border-violet-500/50"
                                      : "bg-slate-900 text-slate-500 border-slate-700",
                                  )}
                                >
                                  {conv.other_user_name?.[0]?.toUpperCase() || "?"}
                                </div>
                                {/* Online indicator simulation */}
                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-black rounded-full" />
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <h3
                                    className={cn(
                                      "text-sm font-bold font-orbitron tracking-wide truncate pr-4",
                                      conv.unread_count > 0 ? "text-violet-100" : "text-slate-300",
                                    )}
                                  >
                                    {conv.other_user_name || t("inbox.unknownUser")}
                                  </h3>
                                  <span className="text-[10px] text-slate-500 font-mono">
                                    {/* Placeholder date logic */}
                                    2h ago
                                  </span>
                                </div>
                                <p
                                  className={cn(
                                    "text-sm truncate font-rajdhani",
                                    conv.unread_count > 0 ? "text-slate-200 font-medium" : "text-slate-500",
                                  )}
                                >
                                  {conv.last_message}
                                </p>
                              </div>

                              {/* Arrow hint on hover */}
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500">
                                <Search className="w-4 h-4 rotate-90" />
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </AnimatePresence>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

// --- Sub-components for cleaner code ---

const TabItem = ({ value, icon: Icon, label, count, active, color = "primary" }: any) => (
  <TabsTrigger
    value={value}
    className={cn(
      "relative flex items-center gap-3 pb-3 pt-2 px-1 rounded-none border-b-2 border-transparent transition-all duration-300 group data-[state=active]:bg-transparent",
      active ? `border-${color} text-${color}` : "text-muted-foreground hover:text-slate-200",
    )}
  >
    <Icon className={cn("h-4 w-4", active && "animate-pulse")} />
    <span className={cn("text-sm font-orbitron tracking-wider", active && "font-bold")}>{label}</span>

    {count > 0 && (
      <span
        className={cn(
          "ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-sm min-w-[20px]",
          active ? `bg-${color} text-black` : "bg-slate-800 text-slate-400",
        )}
      >
        {count}
      </span>
    )}

    {/* Glow effect under tab */}
    {active && (
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 h-[2px] blur-[4px]",
          color === "violet" ? "bg-violet-500" : "bg-primary",
        )}
      />
    )}
  </TabsTrigger>
);

const ActionButton = ({ onClick, icon: Icon, label, variant }: any) => (
  <Button
    variant="ghost"
    size="sm"
    onClick={onClick}
    className={cn(
      "text-xs font-bold font-rajdhani uppercase tracking-wider h-8",
      variant === "destructive"
        ? "text-red-400 hover:text-red-300 hover:bg-red-950/30"
        : "text-primary hover:text-primary-foreground hover:bg-primary/10",
    )}
  >
    <Icon className="h-3.5 w-3.5 mr-2" />
    {label}
  </Button>
);

const EmptyState = ({ icon: Icon, title, desc, color = "text-primary/40" }: any) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="flex flex-col items-center justify-center py-20 text-center"
  >
    <div
      className={cn(
        "w-24 h-24 rounded-full bg-white/5 border border-white/5 flex items-center justify-center mb-6",
        color.replace("text", "bg").replace("/40", "/5"),
      )}
    >
      <Icon className={cn("h-10 w-10", color)} />
    </div>
    <h3 className="text-xl font-orbitron font-bold text-slate-200 mb-2 tracking-wide">{title}</h3>
    <p className="text-sm text-slate-500 max-w-sm mx-auto font-rajdhani">{desc}</p>
  </motion.div>
);
