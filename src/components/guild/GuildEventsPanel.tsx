import { useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Plus, Clock, Users, Check, HelpCircle, X } from "lucide-react";
import { format, formatDistanceToNow, isPast } from "date-fns";
import { toast } from "sonner";
import { CyberEmpty } from "@/components/ui/cyber-states";

interface GuildEvent {
  id: string;
  guild_id: string;
  title: string;
  description: string | null;
  event_date: string;
  duration_minutes: number;
  created_by: string;
  max_participants: number | null;
  created_at: string;
}

interface RSVP {
  id: string;
  event_id: string;
  user_id: string;
  status: string;
}

interface Props {
  guildId: string;
  userId: string;
  isOfficer: boolean;
}

export function GuildEventsPanel({ guildId, userId, isOfficer }: Props) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [date, setDate] = useState("");
  const [duration, setDuration] = useState("60");
  const [maxP, setMaxP] = useState("");

  const { data: events = [] } = useQuery({
    queryKey: ["guild-events", guildId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guild_events")
        .select("*")
        .eq("guild_id", guildId)
        .order("event_date", { ascending: true });
      if (error) throw error;
      return (data || []) as GuildEvent[];
    },
  });

  const { data: allRsvps = [] } = useQuery({
    queryKey: ["guild-rsvps", guildId],
    queryFn: async () => {
      if (!events.length) return [];
      const ids = events.map((e) => e.id);
      const { data, error } = await supabase
        .from("guild_event_rsvps")
        .select("*")
        .in("event_id", ids);
      if (error) throw error;
      return (data || []) as RSVP[];
    },
    enabled: events.length > 0,
  });

  const createEvent = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("guild_events").insert({
        guild_id: guildId,
        title: title.trim(),
        description: desc.trim() || null,
        event_date: new Date(date).toISOString(),
        duration_minutes: parseInt(duration) || 60,
        created_by: userId,
        max_participants: maxP ? parseInt(maxP) : null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["guild-events", guildId] });
      setShowCreate(false);
      setTitle(""); setDesc(""); setDate(""); setDuration("60"); setMaxP("");
      toast.success(t("guild.eventCreated"));
    },
    onError: () => toast.error(t("common.error")),
  });

  const rsvpMutation = useMutation({
    mutationFn: async ({ eventId, status }: { eventId: string; status: string }) => {
      const existing = allRsvps.find((r) => r.event_id === eventId && r.user_id === userId);
      if (existing) {
        if (existing.status === status) {
          await supabase.from("guild_event_rsvps").delete().eq("id", existing.id);
        } else {
          await supabase.from("guild_event_rsvps").update({ status } as any).eq("id", existing.id);
        }
      } else {
        await supabase.from("guild_event_rsvps").insert({ event_id: eventId, user_id: userId, status } as any);
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["guild-rsvps", guildId] }),
  });

  const rsvpIcons: Record<string, React.ElementType> = { going: Check, maybe: HelpCircle, declined: X };

  return (
    <div className="space-y-4">
      {isOfficer && (
        <Button size="sm" variant="outline" className="text-xs" onClick={() => setShowCreate(!showCreate)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> {t("guild.createEvent")}
        </Button>
      )}

      {showCreate && (
        <div className="border border-border/50 rounded-lg p-4 space-y-3 bg-card/30">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("guild.eventTitle")} className="h-8 text-xs" maxLength={100} />
          <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder={t("guild.eventDescription")} className="h-14 text-xs resize-none" maxLength={500} />
          <div className="flex gap-2">
            <Input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} className="h-8 text-xs flex-1" />
            <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="Duration (min)" className="h-8 text-xs w-24" min={5} max={1440} />
            <Input type="number" value={maxP} onChange={(e) => setMaxP(e.target.value)} placeholder="Max" className="h-8 text-xs w-20" min={1} />
          </div>
          <Button size="sm" onClick={() => createEvent.mutate()} disabled={!title.trim() || !date || createEvent.isPending} className="text-xs">
            {t("common.create")}
          </Button>
        </div>
      )}

      {events.length === 0 ? (
        <CyberEmpty icon={CalendarDays} title={t("guild.noEvents")} subtitle={t("guild.noEventsDesc")} />
      ) : (
        <div className="space-y-3">
          {events.map((ev) => {
            const eventRsvps = allRsvps.filter((r) => r.event_id === ev.id);
            const goingCount = eventRsvps.filter((r) => r.status === "going").length;
            const myRsvp = eventRsvps.find((r) => r.user_id === userId);
            const past = isPast(new Date(ev.event_date));

            return (
              <div key={ev.id} className={`border border-border/50 rounded-lg p-4 ${past ? "opacity-50" : ""}`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="text-sm font-bold">{ev.title}</h4>
                    {ev.description && <p className="text-[10px] text-muted-foreground mt-0.5">{ev.description}</p>}
                  </div>
                  {past && <Badge variant="outline" className="text-[8px]">PAST</Badge>}
                </div>

                <div className="flex items-center gap-4 text-[10px] text-muted-foreground mb-3">
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" /> {format(new Date(ev.event_date), "PPp")}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {ev.duration_minutes}min
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" /> {goingCount}{ev.max_participants ? `/${ev.max_participants}` : ""}
                  </span>
                </div>

                {!past && (
                  <div className="flex gap-1.5">
                    {(["going", "maybe", "declined"] as const).map((status) => {
                      const Icon = rsvpIcons[status];
                      const isActive = myRsvp?.status === status;
                      return (
                        <Button
                          key={status}
                          size="sm"
                          variant={isActive ? "default" : "outline"}
                          className="h-7 text-[10px] px-2"
                          onClick={() => rsvpMutation.mutate({ eventId: ev.id, status })}
                        >
                          <Icon className="h-3 w-3 mr-1" />
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </Button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
