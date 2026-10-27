import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useDateFnsLocale } from "@/socle/i18n/useDateFnsLocale";
import { supabase } from "@/socle/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Plus, Clock, Users, Check, HelpCircle, X } from "lucide-react";
import { format, isPast } from "date-fns";
import { toast } from "sonner";

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
  /* format(..., "PPp") sans locale rendait la date en anglais. */
  const locale = useDateFnsLocale();
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
      });
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
          await supabase.from("guild_event_rsvps").update({ status }).eq("id", existing.id);
        }
      } else {
        await supabase.from("guild_event_rsvps").insert({ event_id: eventId, user_id: userId, status });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["guild-rsvps", guildId] }),
  });

  const ICONE_REPONSE = { going: Check, maybe: HelpCircle, declined: X } as const;
  const REPONSES = ["going", "maybe", "declined"] as const;

  return (
    <>
      {isOfficer && (
        <>
          <div className="gu-barre">
            <button type="button" className="co-bouton" onClick={() => setShowCreate(!showCreate)}>
              <Plus aria-hidden="true" />
              {t("guild.createEvent", "Créer un événement")}
            </button>
          </div>

          {/* LE FORMULAIRE NE DISAIT PAS CE QU IL DEMANDAIT.
              Deux champs numeriques nus, cote a cote, sans etiquette :
              seul un « title » les nommait, c est-a-dire une infobulle
              qu il faut savoir aller chercher a la souris — et qui
              n existe pas au doigt. On voyait deux cases avec des
              chiffres dedans, sans savoir lesquels.
              Le textarea, lui, n avait AUCUNE classe : ni cadre, ni
              fond, ni police — un rectangle blanc du navigateur au
              milieu d un formulaire sombre.
              Chaque champ porte maintenant son nom, et l unite est
              ecrite a cote du chiffre plutot que devinee. */}
          {showCreate && (
            <div className="gu-ecrire">
              <label className="gu-champ-groupe">
                <span className="gu-etiquette">{t("guild.eventTitle", "Titre de l’événement")}</span>
                <input
                  className="gu-champ"
                  value={title}
                  maxLength={100}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t("guild.eventTitleWhat", "Séance commune, point d’étape…")}
                />
              </label>

              <label className="gu-champ-groupe">
                <span className="gu-etiquette">{t("guild.eventDescription", "Description")}</span>
                <textarea
                  className="gu-champ"
                  style={{ minHeight: 62, resize: "vertical" }}
                  value={desc}
                  maxLength={500}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder={t("guild.eventDescWhat", "De quoi s’agit-il ? — facultatif")}
                />
              </label>

              <div className="gu-champs">
                <label className="gu-champ-groupe">
                  <span className="gu-etiquette">{t("guild.eventWhen", "Quand")}</span>
                  <input
                    className="gu-champ"
                    type="datetime-local"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </label>

                <label className="gu-champ-groupe">
                  <span className="gu-etiquette">{t("guild.eventDuration", "Durée")}</span>
                  <span className="gu-champ-unite">
                    <input
                      className="gu-champ"
                      type="number"
                      min={5}
                      max={1440}
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                    />
                    <i>{t("guild.minutes", "min")}</i>
                  </span>
                </label>

                <label className="gu-champ-groupe">
                  <span className="gu-etiquette">{t("guild.eventMax", "Places")}</span>
                  <span className="gu-champ-unite">
                    <input
                      className="gu-champ"
                      type="number"
                      min={1}
                      value={maxP}
                      onChange={(e) => setMaxP(e.target.value)}
                    />
                    <i>{t("guild.people", "pers.")}</i>
                  </span>
                </label>
              </div>

              <div>
                <button
                  type="button"
                  className="co-bouton"
                  onClick={() => createEvent.mutate()}
                  disabled={!title.trim() || !date || createEvent.isPending}
                >
                  <Plus aria-hidden="true" />
                  {t("guild.createEvent", "Créer un événement")}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {events.length === 0 ? (
        <div className="co-vide">
          <CalendarDays aria-hidden="true" />
          <h3>{t("guild.noEvents", "Aucun événement")}</h3>
          <p>{t("guild.noEventsDesc", "Un événement donne un rendez-vous à la guilde : une séance commune, un point d’étape.")}</p>
        </div>
      ) : (
        events.map((ev) => {
          const reponses = allRsvps.filter((r) => r.event_id === ev.id);
          const presents = reponses.filter((r) => r.status === "going").length;
          const maReponse = reponses.find((r) => r.user_id === userId);
          const passe = isPast(new Date(ev.event_date));

          return (
            <div className="gu-evenement" data-passe={passe ? "oui" : "non"} key={ev.id}>
              <div className="gu-objectif-tete">
                <span className="co-nom">{ev.title}</span>
                {passe && <span className="gu-grade">{t("guild.eventPast", "Passé")}</span>}
              </div>

              {ev.description && <p className="gu-mot">{ev.description}</p>}

              <div className="gu-mesures">
                <span className="gu-mesure">
                  <CalendarDays aria-hidden="true" />
                  {format(new Date(ev.event_date), "PPp", { locale })}
                </span>
                <span className="gu-mesure">
                  <Clock aria-hidden="true" />
                  {t("guild.eventMinutes", "{{n}} min", { n: ev.duration_minutes })}
                </span>
                <span className="gu-mesure">
                  <Users aria-hidden="true" />
                  {presents}{ev.max_participants ? " / " + ev.max_participants : ""}
                </span>
              </div>

              {!passe && (
                <div className="gu-actions" style={{ marginTop: 10, justifyContent: "flex-start" }}>
                  {REPONSES.map((statut) => {
                    const Icone = ICONE_REPONSE[statut];
                    return (
                      <button
                        key={statut}
                        type="button"
                        className="co-puce"
                        aria-pressed={maReponse?.status === statut}
                        onClick={() => rsvpMutation.mutate({ eventId: ev.id, status: statut })}
                      >
                        <Icone aria-hidden="true" />
                        {t("guild.rsvp." + statut, statut === "going" ? "Je viens" : statut === "maybe" ? "Peut-être" : "Je passe")}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })
      )}
    </>
  );
}
