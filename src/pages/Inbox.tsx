import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import { useMessages } from "@/hooks/useMessages";
import { NotificationCard } from "@/components/notifications/NotificationCard";
import { Card } from "@/components/ui/card";
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
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Inbox() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("notifications");
  
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useNotifications();
  
  const { 
    conversations, 
    unreadCount: messageUnreadCount,
    isLoading: messagesLoading 
  } = useMessages();

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background relative">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-4xl mx-auto p-6 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pt-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
              <InboxIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-orbitron text-primary tracking-wider">
                Inbox
              </h1>
              <p className="text-sm text-muted-foreground font-rajdhani">
                Notifications & Messages
              </p>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/profile/notifications")}
            className="border-primary/30 hover:bg-primary/10"
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start bg-card/50 border border-primary/20 mb-6 p-1">
            <TabsTrigger
              value="notifications"
              className="relative data-[state=active]:bg-primary/20 data-[state=active]:text-primary flex items-center gap-2"
            >
              <Bell className="h-4 w-4" />
              Notifications
              {unreadCount > 0 && (
                <span className="ml-1 text-xs bg-destructive text-destructive-foreground px-1.5 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="messages"
              className="relative data-[state=active]:bg-primary/20 data-[state=active]:text-primary flex items-center gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              Messages
              {messageUnreadCount > 0 && (
                <span className="ml-1 text-xs bg-violet-500 text-white px-1.5 py-0.5 rounded-full">
                  {messageUnreadCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="mt-0">
            <Card variant="clean" className="bg-card/30 overflow-hidden">
              {/* Actions Bar */}
              <div className="flex items-center justify-between p-4 border-b border-primary/20 bg-primary/5">
                <span className="text-sm text-muted-foreground font-rajdhani">
                  {notifications.length} notification{notifications.length !== 1 ? "s" : ""}
                  {unreadCount > 0 && ` (${unreadCount} unread)`}
                </span>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markAllAsRead.mutate()}
                      className="text-primary hover:text-primary hover:bg-primary/10"
                    >
                      <CheckCheck className="h-4 w-4 mr-1" />
                      Mark all read
                    </Button>
                  )}
                  {notifications.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => clearAll.mutate()}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Clear all
                    </Button>
                  )}
                </div>
              </div>

              {/* Notifications List */}
              <ScrollArea className="h-[calc(100vh-320px)]">
                <div className="p-4 space-y-3">
                  {isLoading ? (
                    <div className="text-center py-12 text-muted-foreground font-rajdhani">
                      Loading notifications...
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="text-center py-16 space-y-4">
                      <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                        <Bell className="h-10 w-10 text-primary/40" />
                      </div>
                      <div>
                        <p className="text-lg text-muted-foreground font-rajdhani">
                          No notifications
                        </p>
                        <p className="text-sm text-muted-foreground/60 font-rajdhani mt-1">
                          You're all caught up!
                        </p>
                      </div>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <NotificationCard
                        key={notification.id}
                        notification={notification}
                        onMarkAsRead={(id) => markAsRead.mutate(id)}
                        onDelete={(id) => deleteNotification.mutate(id)}
                      />
                    ))
                  )}
                </div>
              </ScrollArea>
            </Card>
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages" className="mt-0">
            <Card variant="clean" className="bg-card/30 overflow-hidden">
              {/* Actions Bar */}
              <div className="flex items-center justify-between p-4 border-b border-primary/20 bg-violet-500/5">
                <span className="text-sm text-muted-foreground font-rajdhani">
                  {conversations.length} conversation{conversations.length !== 1 ? "s" : ""}
                  {messageUnreadCount > 0 && ` (${messageUnreadCount} unread)`}
                </span>
              </div>

              {/* Messages List */}
              <ScrollArea className="h-[calc(100vh-320px)]">
                <div className="p-4">
                  {messagesLoading ? (
                    <div className="text-center py-12 text-muted-foreground font-rajdhani">
                      Loading messages...
                    </div>
                  ) : conversations.length === 0 ? (
                    <div className="text-center py-16 space-y-4">
                      <div className="w-20 h-20 mx-auto rounded-full bg-violet-500/10 flex items-center justify-center">
                        <MessageSquare className="h-10 w-10 text-violet-500/40" />
                      </div>
                      <div>
                        <p className="text-lg text-muted-foreground font-rajdhani">
                          No messages yet
                        </p>
                        <p className="text-sm text-muted-foreground/60 font-rajdhani mt-1">
                          Private messaging coming soon
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {conversations.map((conv) => (
                        <Card
                          key={conv.other_user_id}
                          className={`p-4 border transition-colors duration-200 cursor-pointer ${
                            conv.unread_count > 0
                              ? "border-violet-500/50 bg-violet-500/5 hover:border-violet-500/70"
                              : "border-primary/20 hover:border-primary/40"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center">
                              <span className="text-violet-400 font-orbitron text-sm">
                                {conv.other_user_name?.[0]?.toUpperCase() || "?"}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="font-semibold text-primary truncate">
                                  {conv.other_user_name || "Unknown User"}
                                </p>
                                {conv.unread_count > 0 && (
                                  <span className="text-xs bg-violet-500 text-white px-1.5 py-0.5 rounded-full">
                                    {conv.unread_count}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground truncate">
                                {conv.last_message}
                              </p>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}