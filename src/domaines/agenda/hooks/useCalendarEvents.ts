import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useId, useMemo } from "react";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addWeeks, addMonths, addYears,
  differenceInCalendarDays, differenceInCalendarMonths, differenceInCalendarYears,
  isBefore, isAfter, parseISO,
  startOfDay, endOfDay, addHours, format as formaterDate,
} from "date-fns";
import { trackCalendarEventCreated } from "@/domaines/succes";
import type { TodoTaskType } from "@/domaines/taches";
import { natureDe, estRendezVous } from "@/domaines/taches";
import { composerInstant } from "@/domaines/agenda/logique/temps";

/**
 * Le moment complet d un rendez-vous : le JOUR de son echeance, a
 * l HEURE saisie.
 *
 * `deadline` est un timestamptz, `appointment_time` une heure seule.
 * Le jour se lit en LOCAL, pas en tranchant la chaine ISO : une
 * echeance a 2026-08-25T22:00:00Z tombe deja le 26 a Paris, et la
 * decouper donnerait le 25 — le rendez-vous glisserait d un jour
 * pour tout le monde a l est de Greenwich.
 *
 * Sans duree saisie, une heure : c est la longueur qu on prete a un
 * rendez-vous quand on n en sait rien, et un evenement de duree nulle
 * ne se voit pas sur une grille horaire.
 */
function momentDuJour(echeance: string, heure: string): { debut: string; fin: string } | null {
  const jour = new Date(echeance);
  if (Number.isNaN(jour.getTime())) return null;
  /* « 14:30:00 » -> « 14:30 » : composerInstant attend hh:mm. */
  const debut = composerInstant(formaterDate(jour, "yyyy-MM-dd"), heure.slice(0, 5));
  if (!debut) return null;
  return { debut: debut.toISOString(), fin: addHours(debut, 1).toISOString() };
}

// ─── Types — voir `../types.ts`, reexportes ici ─────────────
import type { RecurrenceRule, CalendarSourceType, CalendarEvent, CalendarEventInsert } from "@/domaines/agenda/types";
export type { RecurrenceRule, CalendarSourceType, CalendarEvent, CalendarEventInsert };


// ─── Recurrence expansion ───────────────────────────────────
const DAY_MAP: Record<string, number> = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };

/** Rang d un jour dans une semaine qui commence le lundi. */
const rankInWeek = (day: number) => (day + 6) % 7;

/* Garde-fou de boucle. Il borne le TRAVAIL, jamais le nombre
   d occurrences de la regle : confondre les deux — c etait le cas, avec
   un « rule.count || 365 » — faisait disparaitre du calendrier tout
   evenement quotidien commence il y a plus d un an. Le compteur
   s epuisait avant meme d atteindre la periode regardee. */
const MAX_STEPS = 5000;

function expandRecurrences(event: CalendarEvent, rangeStart: Date, rangeEnd: Date): CalendarEvent[] {
  const rule = event.recurrence_rule;
  if (!rule) return [event];

  const eventStart = parseISO(event.start_time);
  const eventEnd = parseISO(event.end_time);
  if (Number.isNaN(eventStart.getTime())) return [event];

  const duration = Math.max(0, eventEnd.getTime() - eventStart.getTime());
  const interval = Math.max(1, rule.interval || 1);
  const until = rule.until ? endOfDay(parseISO(rule.until)) : null;
  /** Le nombre d occurrences que la regle produit — sans defaut arbitraire. */
  const total = rule.count && rule.count > 0 ? rule.count : Infinity;

  const results: CalendarEvent[] = [];
  /* Une occurrence qui se termine avant la fenetre ne nous interesse pas :
     c est cet instant-la qu on vise du premier coup, au lieu de derouler
     la serie depuis son origine. */
  const target = new Date(rangeStart.getTime() - duration);

  const emit = (start: Date, idx: number) => {
    if (until && isAfter(start, until)) return;
    const end = new Date(start.getTime() + duration);
    if (isBefore(end, rangeStart) || isAfter(start, rangeEnd)) return;
    results.push(makeVirtualOccurrence(event, start, end, idx));
  };

  /* HEBDOMADAIRE SUR PLUSIEURS JOURS
     La regle designe des JOURS a l interieur de semaines actives. Le code
     precedent avancait un curseur par semaines entieres depuis la date de
     depart, puis FILTRAIT sur le jour de la semaine — le curseur retombant
     toujours sur le jour de depart, une regle « lundi, mercredi,
     vendredi » creee un lundi ne produisait que des lundis, et creee un
     mardi ne produisait rien du tout. */
  const days = rule.freq === "weekly" && rule.byDay?.length
    ? [...new Set(rule.byDay.map((d) => DAY_MAP[d]).filter((n) => n !== undefined))]
        .sort((a, b) => rankInWeek(a) - rankInWeek(b))
    : null;

  if (days && days.length > 0) {
    const weekZero = startOfWeek(eventStart, { weekStartsOn: 1 });
    const startRank = rankInWeek(eventStart.getDay());
    // La semaine d origine ne compte que les jours a partir du depart.
    const firstWeekDays = days.filter((d) => rankInWeek(d) >= startRank);

    const weeksAway = Math.floor(
      differenceInCalendarDays(startOfWeek(target, { weekStartsOn: 1 }), weekZero) / 7
    );
    let k = Math.max(0, Math.floor(weeksAway / interval));
    let steps = 0;

    while (steps++ < MAX_STEPS) {
      const weekStart = addWeeks(weekZero, k * interval);
      if (isAfter(weekStart, rangeEnd)) break;
      if (until && isAfter(weekStart, until)) break;

      const ofWeek = k === 0 ? firstWeekDays : days;
      const base = k === 0 ? 0 : firstWeekDays.length + (k - 1) * days.length;
      if (base >= total) break;

      for (let i = 0; i < ofWeek.length; i++) {
        const idx = base + i;
        if (idx >= total) break;
        const day = addDays(weekStart, rankInWeek(ofWeek[i]));
        day.setHours(eventStart.getHours(), eventStart.getMinutes(), eventStart.getSeconds(), 0);
        emit(day, idx);
      }
      k++;
    }
    return results;
  }

  const advanceFn = rule.freq === "daily" ? addDays
    : rule.freq === "weekly" ? addWeeks
    : rule.freq === "monthly" ? addMonths
    : addYears;

  /* On saute directement au premier rang utile : un quotidien de 2018 n a
     pas a couter deux mille tours pour afficher un mois de 2026. Un rang
     de marge absorbe les arrondis de fuseau et d heure d ete. */
  const away = rule.freq === "daily" ? differenceInCalendarDays(target, eventStart)
    : rule.freq === "weekly" ? differenceInCalendarDays(target, eventStart) / 7
    : rule.freq === "monthly" ? differenceInCalendarMonths(target, eventStart)
    : differenceInCalendarYears(target, eventStart);
  let idx = Math.max(0, Math.floor(away / interval) - 1);
  let steps = 0;

  while (idx < total && steps++ < MAX_STEPS) {
    const start = idx === 0 ? eventStart : advanceFn(eventStart, interval * idx);
    if (isAfter(start, rangeEnd)) break;
    if (until && isAfter(start, until)) break;
    emit(start, idx);
    idx++;
  }

  return results;
}

function makeVirtualOccurrence(event: CalendarEvent, start: Date, end: Date, idx: number): CalendarEvent {
  /* L original n est rendu tel quel que si l occurrence tombe VRAIMENT sur
     lui. Avec une regle « lundi, mercredi, vendredi » creee un mardi, la
     premiere occurrence est un mercredi : la renvoyer comme l original
     l aurait affichee le mardi, et rendue deplacable a tort. */
  if (idx === 0 && start.getTime() === parseISO(event.start_time).getTime()) return event;
  return {
    ...event,
    id: `${event.id}_r${idx}`,
    start_time: start.toISOString(),
    end_time: end.toISOString(),
    _virtual: true,
    _originalStart: event.start_time,
  };
}

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
      /* La requete nomme ses six colonnes : le type les nomme aussi,
         plutot que de tout abandonner a `any`. */
      type LigneTache = {
        id: string;
        name: string;
        deadline: string;
        category: string | null;
        location: string | null;
        task_type: string | null;
        appointment_time: string | null;
      };
      return ((data ?? []) as LigneTache[]).map((t): CalendarEvent => {
        /* UN RENDEZ-VOUS N EST PAS UNE TACHE POSEE SUR LA JOURNEE.

           Toute tache importee arrivait en journee entiere, teintee
           d orange, avec l icone de case a cocher. Un rendez-vous
           saisi a 14 h perdait donc son heure — la seule chose qui en
           fait un rendez-vous — et se rangeait avec les taches du
           jour, ou personne ne le cherche.

           `appointment_time` est une heure seule (« 14:30 ») : elle se
           colle a la date d echeance pour redonner le moment complet.
           Sans heure saisie, on ne devine pas — la tache reste sur la
           journee, ce qui est honnete. */
        const nature = natureDe(t.task_type);
        const heure = estRendezVous(t.task_type) ? t.appointment_time : null;
        const place = heure ? momentDuJour(t.deadline, heure) : null;

        return {
        id: `todo_${t.id}`,
        user_id: user.id,
        title: t.name,
        description: null,
        location: t.location || null,
        start_time: place ? place.debut : t.deadline,
        end_time: place ? place.fin : t.deadline,
        all_day: !place,
        /* La teinte suit la nature : violet pour un rendez-vous,
           rouge pour une echeance, ambre pour une attente. */
        color: nature.couleur,
        category: "todo",
        recurrence_rule: null,
        recurrence_parent_id: null,
        recurrence_exception: false,
        reminders: [],
        is_busy: false,
        linked_goal_id: null,
        linked_todo_id: t.id,
        tags: t.category ? [t.category] : [],
        created_at: "",
        updated_at: "",
        _virtual: true,
        _source: "todo",
        _sourceId: t.id,
        _nature: nature.id,
        };
      });
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
        .map((g): CalendarEvent => ({
          id: `goal_${g.id}`,
          user_id: user.id,
          title: `🎯 ${g.name}`,
          description: null,
          location: null,
          start_time: new Date(g.deadline).toISOString(),
          end_time: new Date(g.deadline).toISOString(),
          all_day: true,
          color: "#a855f7",
          category: "goal-deadline",
          recurrence_rule: null,
          recurrence_parent_id: null,
          recurrence_exception: false,
          reminders: [],
          is_busy: false,
          linked_goal_id: g.id,
          linked_todo_id: null,
          tags: [],
          created_at: "",
          updated_at: "",
          _virtual: true,
          _source: "goal",
          _sourceId: g.id,
        }));
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
        .filter((s) => s.goals?.pacts?.user_id === user.id)
        .map((s): CalendarEvent => ({
          id: `step_${s.id}`,
          user_id: user.id,
          title: `📋 ${s.title}`,
          description: s.goals?.name ? `Goal: ${s.goals.name}` : null,
          location: null,
          start_time: new Date(s.due_date).toISOString(),
          end_time: new Date(s.due_date).toISOString(),
          all_day: true,
          color: "#14b8a6",
          category: "step-due",
          recurrence_rule: null,
          recurrence_parent_id: null,
          recurrence_exception: false,
          reminders: [],
          is_busy: false,
          linked_goal_id: s.goal_id,
          linked_todo_id: null,
          tags: [],
          created_at: "",
          updated_at: "",
          _virtual: true,
          _source: "step",
          _sourceId: s.id,
        }));
    },
    enabled: stepEnabled,
  });

  // Expand all events with recurrences + merge external
  const events = useMemo(() => {
    const base = query.data ?? [];
    const recurring = recurringQuery.data ?? [];
    const all = [...base, ...recurring];
    const expanded: CalendarEvent[] = [];
    const seen = new Set<string>();
    for (const ev of all) {
      if (seen.has(ev.id)) continue;
      seen.add(ev.id);
      if (ev.recurrence_rule) {
        expanded.push(...expandRecurrences(ev, rangeStart, rangeEnd));
      } else {
        expanded.push(ev);
      }
    }

    // Merge external deadlines (already filtered to active items)
    const todos = todoQuery.data ?? [];
    const goals = goalQuery.data ?? [];
    const steps = stepQuery.data ?? [];

    return [...expanded, ...todos, ...goals, ...steps];
  }, [query.data, recurringQuery.data, todoQuery.data, goalQuery.data, stepQuery.data, rangeStart, rangeEnd]);

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
