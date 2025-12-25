import { useState } from "react";
import { Bell, CheckCheck, Trash2, MessageSquare, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "@/hooks/useNotifications";
import { useMessages } from "@/hooks/useMessages";
import { NotificationCard } from "./NotificationCard";
import { NotificationBadge } from "./NotificationBadge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface NotificationHubProps {
  trigger?: React.ReactNode;
}

export function NotificationHub({ trigger }: NotificationHubProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useNotifications();
  const { unreadCount: messageUnreadCount } = useMessages();

  const totalUnread = unreadCount + messageUnreadCount;

  const defaultTrigger = (
    <button className="relative p-2 rounded-lg hover:bg-primary/10 transition-colors">
      <Bell className="h-5 w-5 text-primary" />
      <NotificationBadge count={totalUnread} />
    </button>
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || defaultTrigger}
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md bg-[#0a1525]/98 backdrop-blur-xl border-l border-primary/20 p-0"
      >
        {/* Header */}
        <SheetHeader className="p-4 border-b border-primary/20">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl font-orbitron text-primary flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
              {unreadCount > 0 && (
                <span className="text-sm text-muted-foreground font-rajdhani">
                  ({unreadCount} new)
                </span>
              )}
            </SheetTitle>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllAsRead.mutate()}
                  className="p-2 rounded-lg hover:bg-primary/10 transition-colors"
                  title="Mark all as read"
                >
                  <CheckCheck className="h-4 w-4 text-primary" />
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={() => clearAll.mutate()}
                  className="p-2 rounded-lg hover:bg-destructive/10 transition-colors"
                  title="Clear all"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </button>
              )}
              <button
                onClick={() => {
                  setOpen(false);
                  navigate("/profile/notifications");
                }}
                className="p-2 rounded-lg hover:bg-primary/10 transition-colors"
                title="Notification settings"
              >
                <Settings className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </div>
        </SheetHeader>

        {/* Content */}
        <Tabs defaultValue="notifications" className="flex-1 flex flex-col h-[calc(100vh-80px)]">
          <TabsList className="w-full justify-start rounded-none border-b border-primary/10 bg-transparent px-4">
            <TabsTrigger
              value="notifications"
              className="relative data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
            >
              Notifications
              <NotificationBadge count={unreadCount} size="sm" className="relative -top-0 -right-0 ml-1.5" />
            </TabsTrigger>
            <TabsTrigger
              value="messages"
              className="relative data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
            >
              <MessageSquare className="h-4 w-4 mr-1.5" />
              Messages
              <NotificationBadge count={messageUnreadCount} size="sm" className="relative -top-0 -right-0 ml-1.5" />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notifications" className="flex-1 m-0 p-0">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-3">
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground font-rajdhani">
                    Loading...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-12 space-y-3">
                    <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                      <Bell className="h-8 w-8 text-primary/50" />
                    </div>
                    <p className="text-muted-foreground font-rajdhani">
                      No notifications yet
                    </p>
                    <p className="text-sm text-muted-foreground/60 font-rajdhani">
                      We'll notify you when something important happens
                    </p>
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
          </TabsContent>

          <TabsContent value="messages" className="flex-1 m-0 p-0">
            <ScrollArea className="h-full">
              <div className="p-4">
                <div className="text-center py-12 space-y-3">
                  <div className="w-16 h-16 mx-auto rounded-full bg-violet-500/10 flex items-center justify-center">
                    <MessageSquare className="h-8 w-8 text-violet-500/50" />
                  </div>
                  <p className="text-muted-foreground font-rajdhani">
                    Private messaging coming soon
                  </p>
                  <p className="text-sm text-muted-foreground/60 font-rajdhani">
                    Connect with other Pact members
                  </p>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
