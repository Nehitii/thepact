import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/socle/supabase/client";
import type { Json } from "@/socle/supabase/types";
import { useAuth } from "@/socle/contextes/AuthContext";
import { useEffect, useId, useMemo } from "react";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addWeeks, addMonths, addYears,
  differenceInCalendarDays, differenceInCalendarMonths, differenceInCalendarYears,
  isBefore, isAfter, parseISO,
  startOfDay, endOfDay, addHours, format as formaterDate,
} from "date-fns";
import { trackCalendarEventCreated } from "@/domaines/succes";
import { natureDe, estRendezVous } from "@/domaines/taches";
import {
  evenementDeTache, evenementDObjectif, evenementDEtape, fusionnerLesSources,
  type LigneTache, type LigneObjectif, type LigneEtape,
} from "@/domaines/agenda/logique/projections";

// ─── Types — voir `../types.ts`, reexportes ici ─────────────
import type { RecurrenceRule, CalendarSourceType, CalendarEvent, CalendarEventInsert } from "@/domaines/agenda/types";
import { expandRecurrences } from "@/domaines/agenda/logique/recurrences";
export type { RecurrenceRule, CalendarSourceType, CalendarEvent, CalendarEventInsert };

/* Garde-fou de boucle. Il borne le TRAVAIL, jamais le nombre
   d occurrences de la regle : confondre les deux — c etait le cas, avec
   un « rule.count || 365 » — faisait disparaitre du calendrier tout
   evenement quotidien commence il y a plus d un an. Le compteur
   s epuisait avant meme d atteindre la periode regardee. */

/* LA RECHERCHE PORTAIT SUR LA PERIODE AFFICHEE
 *
 * Elle filtrait les evenements deja charges : chercher un rendez-vous du
 * mois prochain depuis le mois courant ne renvoyait rien, sans que rien
 * n indique que la recherche etait bornee. Elle interroge desormais la
 * base, sans borne de date.
 *
 * Les valeurs sont mises entre guillemets : une virgule dans le terme
 * cherche est un separateur pour PostgREST, et casserait le « ou ». */
export function useCalendarEventSearch(term: string) {
  const { user } = useAuth();
  const q = term.trim();

  return useQuery({
    queryKey: ["calendar-search", user?.id, q],
    queryFn: async () => {
      if (!user || q.length < 2) return [];
      const v = q.replace(/[\\%_]/g, (c) => "\\" + c).replace(/"/g, '\\"');
      const motif = `"%${v}%"`;
      const { data, error } = await supabase
        .from("calendar_events")
        .select("*")
        .eq("user_id", user.id)
        .or(`title.ilike.${motif},description.ilike.${motif},location.ilike.${motif}`)
        .order("start_time", { ascending: false })
        .limit(30);
      if (error) throw error;
      return ((data ?? []) as unknown as CalendarEvent[]).map((e) => ({ ...e, _source: "event" as const }));
    },
    enabled: !!user && q.length >= 2,
    staleTime: 30000,
  });
}

// ─── Hook ───────────────────────────────────────────────────
export function useCalendarEvents(viewDate: Date, view: string, sourceFilters?: Set<string>) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { rangeStart, rangeEnd } = useMemo(() => {
    if (view === "year") {
      const y = viewDate.getFullYear();
      return { rangeStart: new Date(y, 0, 1), rangeEnd: new Date(y, 11, 31, 23, 59, 59) };
    }
    if (view === "day") {
      return { rangeStart: startOfDay(viewDate), rangeEnd: endOfDay(viewDate) };
    }
    if (view === "week") {
      const ws = startOfWeek(viewDate, { weekStartsOn: 1 });
      return { rangeStart: ws, rangeEnd: endOfWeek(viewDate, { weekStartsOn: 1 }) };
    }
    /* Le ruban couvre le mois affiche, comme la grille : les fleches, le
       titre et la periode disent alors la meme chose. */
    if (view === "ruban") {
      return { rangeStart: startOfMonth(viewDate), rangeEnd: endOfMonth(viewDate) };
    }
    const ms = startOfWeek(startOfMonth(viewDate), { weekStartsOn: 1 });
    const me = endOfWeek(endOfMonth(viewDate), { weekStartsOn: 1 });
    return { rangeStart: ms, rangeEnd: me };
  }, [viewDate, view]);

  /* Les echeances sont posees sur des jours, la fenetre est faite
     d instants : on elargit d un jour de chaque cote plutot que de jouer
     aux bords avec les fuseaux. Les vues refiltrent de toute facon. */
  const bornes = useMemo(() => ({
    debut: addDays(rangeStart, -1).toISOString(),
    fin: addDays(rangeEnd, 1).toISOString(),
  }), [rangeStart, rangeEnd]);

  // Calendar events
  const query = useQuery({
    queryKey: ["calendar-events", user?.id, rangeStart.toISOString(), rangeEnd.toISOString()],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("calendar_events")
        .select("*")
        // La protection ne reposait que sur les regles au niveau des
        // lignes. Elles restent la ceinture ; ceci est les bretelles.
        .eq("user_id", user.id)
        .gte("start_time", rangeStart.toISOString())
        .lte("start_time", rangeEnd.toISOString())
        .order("start_time");
      if (error) throw error;
      return ((data ?? []) as unknown as CalendarEvent[]).map(e => ({ ...e, _source: "event" as const }));
    },
    enabled: !!user,
  });

  const recurringQuery = useQuery({
    /* La periode etait absente de la cle alors que le corps en depend :
       changer de mois ne changeait donc pas la cle, et le cache resservait
       le resultat calcule pour une AUTRE periode. */
    queryKey: ["calendar-recurring", user?.id, rangeStart.toISOString()],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("calendar_events")
        .select("*")
        .eq("user_id", user.id)
        .not("recurrence_rule", "is", null)
        .lt("start_time", rangeStart.toISOString())
        .order("start_time");
      if (error) throw error;
      return ((data ?? []) as unknown as CalendarEvent[]).map(e => ({ ...e, _source: "event" as const }));
    },
    enabled: !!user,
  });

  // Todo deadlines — skip if source filter excludes todos
  const todoEnabled = !!user && (!sourceFilters || sourceFilters.has("todo"));
  const todoQuery = useQuery({
    queryKey: ["calendar-todos", user?.id, bornes.debut, bornes.fin],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("todo_tasks")
        .select("id, name, deadline, category, location, task_type, appointment_time")
        .eq("user_id", user.id)
        .eq("status", "active")
        .not("deadline", "is", null)
        // Toute la liste etait chargee, quelle que soit la periode
        // regardee, puis filtree a l affichage.
        .gte("deadline", bornes.debut)
        .lte("deadline", bornes.fin);
      if (error) throw error;
      return ((data ?? []) as LigneTache[]).map((t) => evenementDeTache(t, user.id));
    },
    enabled: todoEnabled,
  });

  // Goal deadlines — skip if source filter excludes goals
  const goalEnabled = !!user && (!sourceFilters || sourceFilters.has("goal"));
  const goalQuery = useQuery({
    queryKey: ["calendar-goals", user?.id, bornes.debut, bornes.fin],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("goals")
        .select("id, name, deadline, pact_id, pacts!inner(user_id)")
        // Toutes les lignes de la table etaient ramenees avant d ecarter
        // cote client celles des autres utilisateurs.
        .eq("pacts.user_id", user.id)
        .not("deadline", "is", null)
        .not("status", "in", '("completed","archived")')
        .gte("deadline", bornes.debut)
        .lte("deadline", bornes.fin);
      if (error) throw error;
      return (data ?? [])
        .filter((g) => g.pacts?.user_id === user.id)
        .map((g) => evenementDObjectif(g as unknown as LigneObjectif, user.id));
    },
    enabled: goalEnabled,
  });

  // Step due dates — skip if source filter excludes steps
  const stepEnabled = !!user && (!sourceFilters || sourceFilters.has("step"));
  const stepQuery = useQuery({
    queryKey: ["calendar-steps", user?.id, bornes.debut, bornes.fin],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("steps")
        .select("id, title, due_date, goal_id, goals!inner(pact_id, name, pacts!inner(user_id))")
        .eq("goals.pacts.user_id", user.id)
        .not("due_date", "is", null)
        .neq("status", "completed")
        .gte("due_date", bornes.debut)
        .lte("due_date", bornes.fin);
      if (error) throw error;
      return (data ?? [])
        .filter((e) => e.goals?.pacts?.user_id === user.id)
        .map((e) => evenementDEtape(e as unknown as LigneEtape, user.id));
    },
    enabled: stepEnabled,
  });

  // Expand all events with recurrences + merge external
  const events = useMemo(() => fusionnerLesSources({
    propres: query.data ?? [],
    recurrents: recurringQuery.data ?? [],
    importes: [todoQuery.data ?? [], goalQuery.data ?? [], stepQuery.data ?? []],
    debut: rangeStart, fin: rangeEnd, deployer: expandRecurrences,
  }), [query.data, recurringQuery.data, todoQuery.data, goalQuery.data, stepQuery.data, rangeStart, rangeEnd]);

  /* Le canal portait un nom constant : deux montages simultanes du
     crochet — le mode strict en developpement en produit un a chaque
     fois — se disputaient le meme abonnement. */
  const canalId = useId();

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`calendar-events${canalId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "calendar_events",
        filter: `user_id=eq.${user.id}`,
      }, () => {
        qc.invalidateQueries({ queryKey: ["calendar-events"] });
        qc.invalidateQueries({ queryKey: ["calendar-recurring"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, qc, canalId]);

  // Mutations
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["calendar-events"] });
    qc.invalidateQueries({ queryKey: ["calendar-recurring"] });
  };

  const createEvent = useMutation({
    mutationFn: async (ev: Partial<CalendarEventInsert>) => {
      if (!user) throw new Error("Not authenticated");
      /* LA BASE EXIGE UN TITRE, UN DÉBUT ET UNE FIN ; le formulaire rend
         un Partial qui ne les garantit pas. Sans ce contrôle, l'insertion
         partait quand même et revenait en 400 : l'écran affichait « une
         erreur est survenue » sans jamais dire laquelle. */
      if (!ev.title || !ev.start_time || !ev.end_time) {
        throw new Error("Un évènement demande un titre, un début et une fin.");
      }
      const { data, error } = await supabase
        .from("calendar_events")
        .insert({
          ...ev,
          title: ev.title,
          start_time: ev.start_time,
          end_time: ev.end_time,
          user_id: user.id,
          /* La règle de répétition est une colonne jsonb. Le type applicatif
             est plus étroit que Json : la conversion est réelle, pas un
             renoncement au typage. */
          recurrence_rule: (ev.recurrence_rule ?? null) as unknown as Json,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      invalidate();
      if (user?.id) {
        trackCalendarEventCreated(user.id);
      }
    },
  });

  const updateEvent = useMutation({
    mutationFn: async ({ id, recurrence_rule, ...updates }: { id: string } & Partial<CalendarEventInsert>) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("calendar_events")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
          /* Sortie du reste pour etre convertie a part : la colonne est
             jsonb, le type applicatif est plus etroit. */
          ...(recurrence_rule !== undefined
            ? { recurrence_rule: recurrence_rule as unknown as Json }
            : {}),
        })
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: invalidate,
  });

  const deleteEvent = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("calendar_events")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return {
    events,
    /* Il ne couvrait que les evenements et les recurrences : la grille
       s affichait « vide » pendant que les echeances de taches,
       d objectifs et d etapes etaient encore en route. En v5 isLoading
       reste faux pour une requete desactivee — couper une source ne fait
       donc pas tourner le calendrier indefiniment. */
    isLoading:
      query.isLoading ||
      recurringQuery.isLoading ||
      todoQuery.isLoading ||
      goalQuery.isLoading ||
      stepQuery.isLoading,
    createEvent,
    updateEvent,
    deleteEvent,
    rangeStart,
    rangeEnd,
  };
}
