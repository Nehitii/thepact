// M.I.A — streaming chat via the configured AI provider (see _shared/ai.ts).
// Persists user + assistant messages in mia_messages, supports tool calls.
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";
import { checkAiQuota } from "../_shared/quota.ts";
import {
  BORNES, ilYAJours, limiteDemandee, LONGUEUR_EXTRAIT_JOURNAL,
  LONGUEUR_EXTRAIT_MEMOIRE, nombreBorne, nomBorne, texteBorne,
} from "./bornes.ts";
import {
  brigadeDe, butsDesPactes, comptesDesObjectifs, dureeDuPacte, etapesRestantes,
  minutesDeFocus, pacteActif, plusGrosRestes, primeDesOrdres, zoneHoraireValide,
} from "./etatDuPacte.ts";
import { jourCivil, lignesDeLEtat } from "./etatDuJour.ts";
import {
  absorberLaLigne, decouperLesLignes, trame,
  type AppelOutil, type FragmentAppelOutil,
} from "./flux.ts";
import { chatCompletion, embed, getAiKey, normalizeModel, upstreamErrorMessage } from "../_shared/ai.ts";
import { drapeauOuvert } from "../_shared/drapeau.ts";
import { bornesDeLEvenement, choixOuDefaut, drapeau, valeurOuNulle } from "./charges.ts";
import { PLAFOND_EVENEMENTS, fenetreAutour, fenetreEnArriere, resumeDuFocus } from "./resumes.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/* ═══════════════════════════════════════════════════════════════
   LA VOIX

   L'ancien prompt commençait par « Tu es Pacte Coach, un coach
   personnel EXIGEANT ET BIENVEILLANT ». Deux adjectifs qui
   s'annulent, et un mot — coach — qui impose un registre : celui qui
   encourage, cadre et félicite. C'est ce registre qui produit
   « Bravo, continue comme ça ! » et « chaque petit pas compte ».

   Il ordonnait aussi d'appeler un outil AVANT TOUTE QUESTION
   FACTUELLE. C'était une instruction de lenteur : « où j'en suis ? »
   coûtait un tour d'outil complet. L'état du jour est désormais
   fourni d'office (voir etatDuJour) et le prompt dit de s'en servir.
   ═══════════════════════════════════════════════════════════════ */
const SYSTEM_PROMPT = `Tu es M.I.A — Mysterious Intelligence Array — l'intelligence intégrée à Overwrite, l'application de suivi de vie de l'utilisateur.

VOIX — ces règles priment sur tout le reste.
1. TU TUTOIES. Jamais « vous », jamais « votre », jamais « vos ». On écrit « il te reste », pas « il vous reste ».
2. Deux à quatre phrases. Tu ne fais une liste que si la réponse EST une liste ; sinon tu donnes le chiffre et le seul détail qui compte.
3. Aucun encouragement qu'on ne t'a pas demandé. Pas de « bravo », pas de « continue comme ça », pas de morale en fin de message.
4. Pas de titre markdown dans une réponse courte. Le gras sert à un chiffre qui compte, pas à chaque nom propre.
5. Tu dis ce que tu ne sais pas au lieu de généraliser : « je n'ai pas de données de sommeil » vaut mieux qu'un paragraphe sur le sommeil.
6. Tu assumes ce que tu fais : « j'ai ajouté la tâche », pas « veux-tu que j'ajoute la tâche ».

Exemple. Question : « combien d'étapes il me reste ? »
MAUVAIS — « Il vous reste un total de **59 étapes** à réaliser sur vos **14 objectifs en cours**. Voici le détail objectif par objectif : » suivi de quatorze puces.
BON — « 59, sur tes 14 objectifs en cours. NOTHINGNESS en concentre 19 à lui seul. »

CE QUE TU PEUX FAIRE
Tu vois et tu agis sur : objectifs et leurs étapes, tâches, journal, agenda, souhaits, concentration, santé, finances, pacte, mémoire longue.
Tu peux cocher une étape ou une tâche, en ajouter, déplacer une échéance, poser un évènement, ajouter un souhait, écrire une entrée de journal, créer un objectif.
TU NE DÉTRUIS RIEN. Aucun outil ne supprime ni n'archive quoi que ce soit : si on te le demande, dis où le faire à la main.
Avant de cocher ou de déplacer quelque chose, récupère son identifiant avec l'outil de liste correspondant. Ne devine jamais un identifiant.
Quand tu as agi, dis-le en une phrase : ce que tu as fait s'affiche déjà sous ta réponse, inutile de le répéter en détail.

DONNÉES
L'état du jour est donné plus bas : sers-t'en d'abord, n'appelle un outil que s'il ne suffit pas à répondre.
N'appelle jamais deux fois le même outil avec les mêmes arguments dans un même échange.
Un objectif « actif » a le statut in_progress ou not_started. Priorise ceux du pacte actif (is_active_pact=true).
Pour créer un objectif ou une habitude, demande à quel pacte le rattacher si ce n'est pas évident.
Quand tu cites un souvenir venu de la mémoire longue, dis d'où il vient en fin de phrase.

LIMITES
Pas de conseil médical, légal ou financier réglementé sans un rappel de prudence.`;

/* Le rappel de fin. Les règles de voix posées en tête d'un long prompt
   se diluent : Gemini a rendu « Il vous reste un total de 59 étapes »
   suivi de quatorze puces alors que la règle 1 disait de tutoyer et la
   règle 2 de faire quatre phrases. Les deux qui sautent le plus sont
   donc répétées en dernier, juste avant que le modèle parle. */
const RAPPEL_VOIX =
  "Rappel : tu tutoies (jamais « vous »), et tu réponds en deux à quatre phrases sans liste à puces, sauf si la réponse est vraiment une liste.";

import { TOOLS } from "./outils.ts";
import {
  OUTILS_LECTURE_SEULE, OUTILS_QUI_ECRIVENT, verifierLaClassification,
} from "./classement.ts";

/* Le controle refuse de demarrer si un outil echappe aux deux
   colonnes. Il vit dans `outils.ts`, ou un test l execute aussi. */
verifierLaClassification();

/* ═══ LES FORMES QUI TRAVERSENT CE FICHIER ═══

   Elles etaient toutes en `any`. Ce n'est pas la meme chose que « on ne
   sait pas » : `any` eteint la verification pour tout ce qui touche la
   valeur, y compris les champs dont on est sur. Le nom d'un outil mal
   orthographie, un champ de reponse renomme par le fournisseur, une
   colonne absente d'un `select` : rien de tout cela ne se voyait. */

/** Le client tel que les fonctions internes le recoivent. */
type ClientSupabase = SupabaseClient;

/** Les arguments d'un outil viennent du modele, en JSON : rien n'est sur. */
type ArgsOutil = Record<string, unknown>;

/** Un message de la conversation envoyee au modele. */
interface MessageIA {
  role: string;
  content: string;
  tool_calls?: AppelOutil[];
  tool_call_id?: string;
  name?: string;
}

/* ── Les lignes lues en base, une par `select` ── */
interface LigneIdent { id: string }
interface LignePacte { id: string; name: string; project_start_date: string | null; project_end_date: string | null }
interface LigneBut {
  id: string; name: string; status: string | null;
  validated_steps: number | null; total_steps: number | null;
  pact_id: string | null; is_focus: boolean | null; deadline: string | null;
}
interface LigneOrdre { title: string | null; progress: number | null; target: number | null; status: string | null; reward_bonds: number | null }
interface LigneFocus { duration_minutes: number | null }
interface LigneTache { name: string | null; deadline: string | null }
interface LigneJournal { title: string | null; mood: string | null; content: string | null; created_at: string }
interface LigneMemoire { source_type: string; source_id: string; content: string | null; similarity?: number }

interface ToolReceipt {
  citations?: Array<{ source_type: string; source_id: string; snippet: string; similarity?: number }>;
  action?: { tool: string; status: "ok" | "error"; label: string; ref_id?: string; ref_type?: string; error?: string };
}

async function runTool(
  name: string,
  args: ArgsOutil,
  supabase: ClientSupabase,
  userId: string,
  aiKey: string,
  receipts: ToolReceipt,
  peutEcrire = true,
): Promise<string> {
  /* Deuxième verrou. Le premier est de ne pas proposer l'outil ; celui-ci
     tient si un échange plus ancien rejoue un appel d'écriture. */
  if (!peutEcrire && OUTILS_QUI_ECRIVENT.has(name)) {
    return JSON.stringify({ error: "ecriture_desactivee" });
  }
  try {
    if (name === "list_active_goals") {
      const { data: pacts } = await supabase.from("pacts").select("id").eq("user_id", userId).returns<LigneIdent[]>();
      const ids = (pacts ?? []).map((p) => p.id);
      if (!ids.length) return JSON.stringify([]);
      const { data: profile } = await supabase
        .from("profiles")
        .select("active_pact_id")
        .eq("id", userId)
        .maybeSingle();
      const activePactId = profile?.active_pact_id ?? null;
      const { data } = await supabase
        .from("goals")
        .select("id,name,difficulty,status,validated_steps,total_steps,deadline,is_focus,pact_id")
        .in("pact_id", ids)
        .in("status", ["in_progress", "not_started"])
        .limit(limiteDemandee(args?.limit, 20));
      const enriched = (data ?? [])
        .map((g) => ({ ...g, is_active_pact: g.pact_id === activePactId }))
        .sort((a, b) => {
          if (a.is_active_pact !== b.is_active_pact) return a.is_active_pact ? -1 : 1;
          if (a.is_focus !== b.is_focus) return a.is_focus ? -1 : 1;
          if (a.status !== b.status) return a.status === "in_progress" ? -1 : 1;
          return 0;
        });
      return JSON.stringify(enriched);
    }
    if (name === "list_recent_journal") {
      const { data } = await supabase
        .from("journal_entries")
        .select("title,mood,content,created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        /* Le modele peut rendre « 10 » en chaine : .limit() attend un
           nombre, et une chaine partait telle quelle dans l'URL. */
        .limit(limiteDemandee(args?.limit, 10))
        .returns<LigneJournal[]>();
      const trimmed = (data ?? []).map((e) => ({
        ...e,
        content: texteBorne(e.content, LONGUEUR_EXTRAIT_JOURNAL),
      }));
      return JSON.stringify(trimmed);
    }
    if (name === "list_user_values") {
      const [{ data: values }, { data: areas }] = await Promise.all([
        supabase.from("user_values").select("label,rank,statement").eq("user_id", userId).order("rank"),
        supabase.from("life_areas").select("name,weight,color").eq("user_id", userId),
      ]);
      return JSON.stringify({ values: values ?? [], life_areas: areas ?? [] });
    }
    if (name === "search_memory") {
      const query = String(args?.query ?? "").trim();
      if (!query) return JSON.stringify([]);
      // Embed the query
      const vector = await embed(query, aiKey, "RETRIEVAL_QUERY");
      if (!vector) return JSON.stringify({ error: "embed_failed" });
      const { data } = await supabase.rpc("match_mia_memory", {
        _query: vector,
        _match_count: 6,
      });
      const rows = (data ?? []) as LigneMemoire[];
      receipts.citations = (receipts.citations ?? []).concat(
        rows.map((r) => ({
          source_type: r.source_type,
          source_id: r.source_id,
          snippet: texteBorne(r.content, LONGUEUR_EXTRAIT_MEMOIRE),
          similarity: typeof r.similarity === "number" ? r.similarity : undefined,
        })),
      );
      return JSON.stringify(rows);
    }
    if (name === "list_pacts") {
      const { data } = await supabase
        .from("pacts")
        .select("id,name,mantra,color,symbol")
        .eq("user_id", userId)
        .order("created_at");
      return JSON.stringify(data ?? []);
    }
    if (name === "create_goal") {
      const pact_id = String(args?.pact_id ?? "").trim();
      const nm = nomBorne(args?.name);
      if (!pact_id || !nm) return JSON.stringify({ error: "pact_id_and_name_required" });
      // Verify pact belongs to user
      const { data: pact } = await supabase.from("pacts").select("id").eq("id", pact_id).eq("user_id", userId).maybeSingle();
      if (!pact) return JSON.stringify({ error: "pact_not_found" });
      const totalSteps = nombreBorne(args?.total_steps, BORNES.total_steps);
      const payload: Record<string, unknown> = {
        pact_id,
        name: nm,
        difficulty: choixOuDefaut(args?.difficulty, "medium"),
        goal_type: "normal",
        total_steps: totalSteps,
        notes: valeurOuNulle(args?.notes),
        deadline: valeurOuNulle(args?.deadline),
        life_area_id: valeurOuNulle(args?.life_area_id),
      };
      const { data, error } = await supabase.from("goals").insert(payload).select("id,name").single();
      if (error) {
        receipts.action = { tool: "create_goal", status: "error", label: nm, error: error.message };
        return JSON.stringify({ error: error.message });
      }
      receipts.action = { tool: "create_goal", status: "ok", label: data.name, ref_id: data.id, ref_type: "goal" };
      return JSON.stringify({ ok: true, goal: data });
    }
    if (name === "create_habit_goal") {
      const pact_id = String(args?.pact_id ?? "").trim();
      const nm = nomBorne(args?.name);
      if (!pact_id || !nm) return JSON.stringify({ error: "pact_id_and_name_required" });
      const { data: pact } = await supabase.from("pacts").select("id").eq("id", pact_id).eq("user_id", userId).maybeSingle();
      if (!pact) return JSON.stringify({ error: "pact_not_found" });
      const days = nombreBorne(args?.habit_duration_days, BORNES.habit_duration_days);
      const payload: Record<string, unknown> = {
        pact_id,
        name: nm,
        goal_type: "habit",
        difficulty: choixOuDefaut(args?.difficulty, "medium"),
        habit_duration_days: days,
        habit_checks: Array(days).fill(false),
        total_steps: days,
        life_area_id: valeurOuNulle(args?.life_area_id),
      };
      const { data, error } = await supabase.from("goals").insert(payload).select("id,name").single();
      if (error) {
        receipts.action = { tool: "create_habit_goal", status: "error", label: nm, error: error.message };
        return JSON.stringify({ error: error.message });
      }
      receipts.action = { tool: "create_habit_goal", status: "ok", label: data.name, ref_id: data.id, ref_type: "goal" };
      return JSON.stringify({ ok: true, habit: data });
    }
    if (name === "create_todo") {
      const nm = nomBorne(args?.name);
      if (!nm) return JSON.stringify({ error: "name_required" });
      const { data, error } = await supabase.from("todo_tasks").insert({
        user_id: userId,
        name: nm,
        deadline: valeurOuNulle(args?.deadline),
        priority: choixOuDefaut(args?.priority, "medium"),
        is_urgent: drapeau(args?.is_urgent),
        category: choixOuDefaut(args?.category, "general"),
        task_type: "flexible",
      }).select("id,name").single();
      if (error) {
        receipts.action = { tool: "create_todo", status: "error", label: nm, error: error.message };
        return JSON.stringify({ error: error.message });
      }
      receipts.action = { tool: "create_todo", status: "ok", label: data.name, ref_id: data.id, ref_type: "todo" };
      return JSON.stringify({ ok: true, todo: data });
    }
    if (name === "create_journal_entry") {
      const title = nomBorne(args?.title);
      const content = String(args?.content ?? "").trim();
      if (!title || !content) return JSON.stringify({ error: "title_and_content_required" });
      const payload: Record<string, unknown> = { user_id: userId, title, content };
      if (typeof args?.mood === "string" && args.mood.trim()) payload.mood = args.mood.trim();
      const { data, error } = await supabase.from("journal_entries").insert(payload).select("id,title").single();
      if (error) {
        receipts.action = { tool: "create_journal_entry", status: "error", label: title, error: error.message };
        return JSON.stringify({ error: error.message });
      }
      receipts.action = { tool: "create_journal_entry", status: "ok", label: data.title, ref_id: data.id, ref_type: "journal" };
      return JSON.stringify({ ok: true, entry: data });
    }
    /* ═════════════ LES MAINS ═════════════ */

    /* Les objectifs n'ont pas de user_id : on passe par les pactes.
       Les politiques RLS filtrent déjà, mais un `in` explicite évite de
       rapatrier ce qu'on jetterait ensuite. */
    const mesPactes = async (): Promise<string[]> => {
      const { data } = await supabase.from("pacts").select("id").eq("user_id", userId);
      return (data ?? []).map((p: { id: string }) => p.id);
    };

    if (name === "list_steps") {
      const ids = await mesPactes();
      if (!ids.length) return JSON.stringify([]);
      const { data: buts } = await supabase.from("goals").select("id,name").in("pact_id", ids);
      const parId = new Map((buts ?? []).map((g: { id: string; name: string }) => [g.id, g.name]));
      const idsButs = args?.goal_id ? [args.goal_id] : [...parId.keys()];
      if (!idsButs.length) return JSON.stringify([]);
      let q = supabase
        .from("steps")
        .select("id,goal_id,title,status,due_date,order")
        .in("goal_id", idsButs)
        .order("due_date", { ascending: true, nullsFirst: false })
        .limit(limiteDemandee(args?.limit, 40));
      if (args?.only_pending !== false) q = q.eq("status", "pending");
      const { data } = await q;
      return JSON.stringify(
        (data ?? []).map((s: Record<string, unknown>) => ({ ...s, objectif: parId.get(s.goal_id as string) })),
      );
    }

    if (name === "complete_step") {
      const { data, error } = await supabase
        .from("steps")
        .update({ status: "completed", validated_at: new Date().toISOString() })
        .eq("id", args?.step_id)
        .select("id,title")
        .maybeSingle();
      if (error || !data) {
        receipts.action = { tool: "complete_step", status: "error", label: String(args?.step_id ?? ""), error: error?.message ?? "étape introuvable" };
        return JSON.stringify({ error: error?.message ?? "not_found" });
      }
      receipts.action = { tool: "complete_step", status: "ok", label: data.title, ref_id: data.id, ref_type: "step" };
      return JSON.stringify({ ok: true, step: data });
    }

    if (name === "add_step") {
      const titre = texteBorne(args?.title);
      const { data: dernieres } = await supabase
        .from("steps")
        .select("order")
        .eq("goal_id", args?.goal_id)
        .order("order", { ascending: false })
        .limit(1);
      const rang = ((dernieres?.[0]?.order as number) ?? 0) + 1;
      const { data, error } = await supabase
        .from("steps")
        .insert({ goal_id: args?.goal_id, title: titre, status: "pending", order: rang, due_date: args?.due_date ?? null })
        .select("id,title")
        .single();
      if (error) {
        receipts.action = { tool: "add_step", status: "error", label: titre, error: error.message };
        return JSON.stringify({ error: error.message });
      }
      receipts.action = { tool: "add_step", status: "ok", label: data.title, ref_id: data.id, ref_type: "step" };
      return JSON.stringify({ ok: true, step: data });
    }

    if (name === "reschedule_step") {
      const { data, error } = await supabase
        .from("steps")
        .update({ due_date: args?.due_date ?? null })
        .eq("id", args?.step_id)
        .select("id,title,due_date")
        .maybeSingle();
      if (error || !data) {
        receipts.action = { tool: "reschedule_step", status: "error", label: String(args?.step_id ?? ""), error: error?.message ?? "étape introuvable" };
        return JSON.stringify({ error: error?.message ?? "not_found" });
      }
      receipts.action = { tool: "reschedule_step", status: "ok", label: `${data.title} → ${data.due_date ?? "sans échéance"}`, ref_id: data.id, ref_type: "step" };
      return JSON.stringify({ ok: true, step: data });
    }

    if (name === "list_todos") {
      let q = supabase
        .from("todo_tasks")
        .select("id,name,deadline,priority,is_urgent,status,category,appointment_time")
        .eq("user_id", userId)
        .order("deadline", { ascending: true, nullsFirst: false })
        .limit(limiteDemandee(args?.limit, 30));
      if (!args?.include_done) q = q.eq("status", "active");
      const { data } = await q;
      return JSON.stringify(data ?? []);
    }

    if (name === "complete_todo") {
      const { data, error } = await supabase
        .from("todo_tasks")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", args?.todo_id)
        .eq("user_id", userId)
        .select("id,name")
        .maybeSingle();
      if (error || !data) {
        receipts.action = { tool: "complete_todo", status: "error", label: String(args?.todo_id ?? ""), error: error?.message ?? "tâche introuvable" };
        return JSON.stringify({ error: error?.message ?? "not_found" });
      }
      receipts.action = { tool: "complete_todo", status: "ok", label: data.name, ref_id: data.id, ref_type: "todo" };
      return JSON.stringify({ ok: true, todo: data });
    }

    if (name === "reschedule_todo") {
      const { data, error } = await supabase
        .from("todo_tasks")
        .update({ deadline: args?.deadline ?? null })
        .eq("id", args?.todo_id)
        .eq("user_id", userId)
        .select("id,name,deadline")
        .maybeSingle();
      if (error || !data) {
        receipts.action = { tool: "reschedule_todo", status: "error", label: String(args?.todo_id ?? ""), error: error?.message ?? "tâche introuvable" };
        return JSON.stringify({ error: error?.message ?? "not_found" });
      }
      receipts.action = { tool: "reschedule_todo", status: "ok", label: `${data.name} → ${data.deadline ?? "sans échéance"}`, ref_id: data.id, ref_type: "todo" };
      return JSON.stringify({ ok: true, todo: data });
    }

    if (name === "focus_summary") {
      const jours = nombreBorne(args?.days, BORNES.focus_days);
      const depuis = fenetreEnArriere(jours, Date.now());
      const { data } = await supabase
        .from("pomodoro_sessions")
        .select("duration_minutes,started_at,linked_goal_id")
        .eq("user_id", userId)
        .eq("completed", true)
        .gte("started_at", depuis)
        .order("started_at", { ascending: false });
      return JSON.stringify({ jours, ...resumeDuFocus(data ?? []) });
    }

    if (name === "health_summary") {
      const jours = nombreBorne(args?.days, BORNES.health_days);
      const depuis = ilYAJours(jours, Date.now());
      const [{ data: releves }, { data: serie }] = await Promise.all([
        supabase
          .from("health_data")
          .select(
            "entry_date,sleep_hours,sleep_quality,wake_energy,movement_minutes,stress_level,mental_load,hydration_glasses,mood_level",
          )
          .eq("user_id", userId)
          .gte("entry_date", depuis)
          .order("entry_date", { ascending: false }),
        supabase.from("health_streaks").select("current_streak,longest_streak,total_checkins").eq("user_id", userId).maybeSingle(),
      ]);
      return JSON.stringify({ jours, releves: releves ?? [], serie: serie ?? null });
    }

    if (name === "list_calendar_events") {
      const avant = nombreBorne(args?.days_back, BORNES.days_back);
      const apres = nombreBorne(args?.days_ahead, BORNES.days_ahead);
      const { debut, fin } = fenetreAutour(avant, apres, Date.now());
      const { data } = await supabase
        .from("calendar_events")
        .select("id,title,start_time,end_time,all_day,location,category")
        .eq("user_id", userId)
        .gte("start_time", debut)
        .lte("start_time", fin)
        .order("start_time", { ascending: true })
        .limit(PLAFOND_EVENEMENTS);
      return JSON.stringify(data ?? []);
    }

    if (name === "create_calendar_event") {
      const titre = texteBorne(args?.title);
      const bornes = bornesDeLEvenement(args?.start_time, args?.end_time);
      if (!bornes) {
        receipts.action = { tool: "create_calendar_event", status: "error", label: titre, error: "début illisible" };
        return JSON.stringify({ error: "start_time invalide" });
      }
      const { data, error } = await supabase
        .from("calendar_events")
        .insert({
          user_id: userId,
          title: titre,
          start_time: bornes.debut.toISOString(),
          end_time: bornes.fin.toISOString(),
          all_day: drapeau(args?.all_day),
          location: valeurOuNulle(args?.location),
        })
        .select("id,title,start_time")
        .single();
      if (error) {
        receipts.action = { tool: "create_calendar_event", status: "error", label: titre, error: error.message };
        return JSON.stringify({ error: error.message });
      }
      receipts.action = { tool: "create_calendar_event", status: "ok", label: data.title, ref_id: data.id, ref_type: "event" };
      return JSON.stringify({ ok: true, event: data });
    }

    if (name === "list_wishlist") {
      const { data } = await supabase
        .from("wishlist_items")
        .select("id,name,category,estimated_cost,acquired,priority,url")
        .eq("user_id", userId)
        .order("acquired", { ascending: true })
        .order("priority", { ascending: false, nullsFirst: false })
        .limit(limiteDemandee(args?.limit, 30));
      return JSON.stringify(data ?? []);
    }

    if (name === "add_wishlist_item") {
      const nm = texteBorne(args?.name);
      const { data, error } = await supabase
        .from("wishlist_items")
        .insert({
          user_id: userId,
          name: nm,
          estimated_cost: args?.estimated_cost ?? null,
          category: args?.category ?? null,
          url: valeurOuNulle(args?.url),
        })
        .select("id,name")
        .single();
      if (error) {
        receipts.action = { tool: "add_wishlist_item", status: "error", label: nm, error: error.message };
        return JSON.stringify({ error: error.message });
      }
      receipts.action = { tool: "add_wishlist_item", status: "ok", label: data.name, ref_id: data.id, ref_type: "wishlist" };
      return JSON.stringify({ ok: true, item: data });
    }

    if (name === "finance_summary") {
      const mois = nombreBorne(args?.months, BORNES.months);
      const [{ data: bilans }, { data: charges }, { data: revenus }] = await Promise.all([
        supabase
          .from("finance")
          .select("month,income,fixed_expenses,variable_expenses,savings,remaining_budget")
          .eq("user_id", userId)
          .order("month", { ascending: false })
          .limit(mois),
        supabase.from("recurring_expenses").select("name,amount,category,jour_echeance").eq("user_id", userId).eq("is_active", true),
        supabase.from("recurring_income").select("name,amount,category,jour_echeance").eq("user_id", userId).eq("is_active", true),
      ]);
      return JSON.stringify({ bilans: bilans ?? [], charges_recurrentes: charges ?? [], revenus_recurrents: revenus ?? [] });
    }

    return JSON.stringify({ error: "unknown_tool" });
  } catch (e) {
    return JSON.stringify({ error: String(e) });
  }
}

/* LE FUSEAU VOYAGE AVEC LA QUESTION, ET LE TEXTE EST ASSEMBLE
   AILLEURS. Le pourquoi de l un et de l autre est dans
   `etatDuJour.ts` ; ici ne restent que les requetes. */
async function etatDuJour(supabase: ClientSupabase, userId: string, fuseau?: string): Promise<string> {
  const maintenant = new Date();
  const zone = zoneHoraireValide(fuseau, maintenant);
  const jour = jourCivil(maintenant, zone);

  const [profil, pacts, objectifs, ordres, focus, taches, bonds] = await Promise.all([
    supabase.from("profiles").select("active_pact_id, display_name, timezone").eq("id", userId).maybeSingle(),
    supabase.from("pacts").select("id,name,project_start_date,project_end_date").eq("user_id", userId).returns<LignePacte[]>(),
    /* `goals` n'a pas de user_id : le lien passe par le pacte. Les
       politiques RLS font le filtrage, on récupère donc tout ce que
       l'utilisateur a le droit de voir. */
    supabase.from("goals").select("id,name,status,validated_steps,total_steps,pact_id,is_focus,deadline").returns<LigneBut[]>(),
    supabase.from("daily_quests").select("title,progress,target,status,reward_bonds").eq("user_id", userId).eq("date", jour).returns<LigneOrdre[]>(),
    supabase.from("pomodoro_sessions").select("duration_minutes").eq("user_id", userId).eq("completed", true).gte("started_at", `${jour}T00:00:00`).returns<LigneFocus[]>(),
    supabase.from("todo_tasks").select("name,deadline").eq("user_id", userId).eq("status", "active").limit(40).returns<LigneTache[]>(),
    supabase.from("bond_balance").select("balance").eq("user_id", userId).maybeSingle(),
  ]);

  return lignesDeLEtat({
    maintenant,
    zone,
    nom: profil?.data?.display_name,
    actifId: profil?.data?.active_pact_id ?? null,
    pactes: pacts?.data ?? [],
    objectifs: objectifs?.data ?? [],
    ordres: ordres?.data ?? [],
    focus: focus?.data ?? [],
    taches: taches?.data ?? [],
    solde: bonds?.data?.balance ?? null,
  }).join("\n");
}

/** Une trame SSE au format que le client sait déjà lire. */

/* ═══════════════════════════════════════════════════════════════
   POMPER UN TOUR : DIFFUSER LE TEXTE, RECOLLER LES OUTILS

   L'ancienne boucle faisait un appel NON DIFFUSÉ pour décider s'il
   fallait des outils, puis un SECOND appel, diffusé celui-là, qui
   repartait du début. Deux générations complètes pour une réponse sans
   outil, et l'utilisateur attendait la première en entier avant de voir
   le premier caractère.

   Le flux porte les appels d'outils autant que le texte. On diffuse
   donc dès le premier appel : le texte part au client au fil de l'eau,
   les appels d'outils s'accumulent, et on ne rouvre un tour que s'il y
   en a vraiment.

   Les appels d'outils arrivent en morceaux — un index, un nom, puis des
   fragments d'arguments JSON — qu'il faut recoller par index.
   ═══════════════════════════════════════════════════════════════ */
async function pomperUnTour(
  amont: Response,
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
): Promise<{ texte: string; outils: AppelOutil[] }> {
  const lecteur = amont.body!.getReader();
  const decodeur = new TextDecoder();
  const outils: AppelOutil[] = [];
  let reste = "";
  let texte = "";

  while (true) {
    const { value, done } = await lecteur.read();
    if (done) break;
    const decoupe = decouperLesLignes(reste, decodeur.decode(value, { stream: true }));
    reste = decoupe.reste;
    const lignes = decoupe.lignes;
    for (const ligne of lignes) {
      const absorbe = absorberLaLigne(ligne, { texte, outils });
      texte = absorbe.tour.texte;
      if (absorbe.aDiffuser) {
        controller.enqueue(encoder.encode(trame(absorbe.aDiffuser)));
      }
    }
  }

  return { texte, outils: outils.filter(Boolean) };
}

interface ChatBody {
  conversation_id: string;
  /** Le fuseau du navigateur, seule source qui ne mente pas sur le jour. */
  fuseau?: string;
  message: string;
  model?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    // Daily AI quota per user — fail-open on infra errors.
    const quotaResp = await checkAiQuota(supabase, "ai-mia", 100, corsHeaders);
    if (quotaResp) return quotaResp;

    const body = (await req.json()) as ChatBody;
    if (!body?.conversation_id || !body?.message?.trim()) {
      return new Response(JSON.stringify({ error: "Bad request" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const model = normalizeModel(body.model);

    // Le message de l'utilisateur est persisté d'abord : si la suite
    // échoue, on ne perd pas ce qu'il a écrit.
    await supabase.from("mia_messages").insert({
      conversation_id: body.conversation_id,
      user_id: userId,
      role: "user",
      content: body.message,
    });

    /* L'HISTORIQUE ÉTAIT CHARGÉ À L'ENVERS.
       `order(created_at, asc).limit(40)` renvoie les quarante messages LES
       PLUS ANCIENS, pas les quarante derniers — et le commentaire juste
       au-dessus annonçait « last 20 messages ». Sur une conversation
       longue, M.I.A aurait lu le début et jamais la suite. On prend les
       derniers, puis on les remet dans l'ordre. */
    const { data: recents } = await supabase
      .from("mia_messages")
      .select("role, content, created_at")
      .eq("conversation_id", body.conversation_id)
      .order("created_at", { ascending: false })
      .limit(24);
    const historique = (recents ?? []).slice().reverse();

    const aiKey = getAiKey();
    if (!aiKey) {
      return new Response(JSON.stringify({ error: "AI provider not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    /* LA PLUME, OU SON ABSENCE. En cas de doute — table injoignable,
       ligne absente — `drapeauOuvert` rend faux : M.I.A lit, elle
       n'écrit pas. Un drapeau qu'on n'arrive pas à lire ne doit pas
       ouvrir ce qu'il est censé garder. */
    const peutEcrire = await drapeauOuvert(supabase, "mia_write_tools", userId);
    const outilsOfferts = peutEcrire ? TOOLS : OUTILS_LECTURE_SEULE;

    const etat = await etatDuJour(supabase, userId, body.fuseau);

    /* UN SEUL MESSAGE SYSTÈME, PAS DEUX.
       L'état du jour était envoyé dans un second message système, après
       les règles. Le modèle l'a lu comme la consigne la plus fraîche et
       a répondu sur le ton d'un rapport. Les règles, l'état et le rappel
       tiennent maintenant dans un seul bloc, le rappel en dernier. */
    const workMessages: MessageIA[] = [
      { role: "system", content: `${SYSTEM_PROMPT}\n\n${etat}\n\n${RAPPEL_VOIX}` },
      ...historique.map((m) => ({ role: m.role, content: m.content })),
    ];

    const appeler = (messages: MessageIA[], avecOutils: boolean) =>
      chatCompletion(
        avecOutils
          ? { model, messages, tools: outilsOfferts, tool_choice: "auto", stream: true }
          : { model, messages, stream: true },
        aiKey,
      );

    /* Le PREMIER appel se fait hors du flux : c'est le seul endroit où
       l'on peut encore répondre un vrai code d'erreur au client. Une fois
       le ReadableStream ouvert, l'en-tête est parti. */
    const premier = await appeler(workMessages, true);
    if (!premier.ok || !premier.body) {
      /* LE CORPS DU FOURNISSEUR RESTE AU SERVEUR, ET LE STATUT PASSE.

         Hors 429 et 402, on renvoyait le corps brut de l'amont et on
         écrasait le vrai code par un 500. Deux conséquences :

         — un 403 (clé révoquée) arrivait au client déguisé en 500,
           donc au même endroit qu'un 503 (modèles saturés), alors que
           l'un se règle en changeant la clé et l'autre en attendant ;
         — la phrase montrée venait du fournisseur, en anglais, et ne
           passait pas par la voix de M.I.A.

         `causeDeLEchec` côté client choisit d'après le statut. Lui
         mentir sur le statut, c'est lui faire dire n'importe quoi. */
      const errText = await premier.text();
      console.error(`[ai-mia] premier appel ${premier.status}: ${errText.slice(0, 500)}`);
      return new Response(JSON.stringify({ error: upstreamErrorMessage(premier.status) }), {
        /* `premier.ok` sans corps : 200 sans flux, anomalie d'amont. */
        status: premier.ok ? 502 : premier.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const TOURS_MAX = 4;
    const citations: ToolReceipt["citations"] = [];
    const actions: NonNullable<ToolReceipt["action"]>[] = [];

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const encoder = new TextEncoder();
        let texteTotal = "";
        try {
          let amont = premier;
          for (let tour = 0; ; tour++) {
            const { texte, outils } = await pomperUnTour(amont, controller, encoder);
            texteTotal += texte;
            if (!outils.length) break;

            workMessages.push({ role: "assistant", content: texte, tool_calls: outils });

            /* LES OUTILS D'UN MÊME TOUR PARTENT ENSEMBLE.
               C'était `for (const c of calls) await runTool(...)` : quatre
               outils demandés dans le même tour s'exécutaient l'un après
               l'autre. Ce sont des requêtes Postgres indépendantes. */
            const resultats = await Promise.all(
              outils.map(async (appel) => {
                let args: ArgsOutil = {};
                try {
                  args = JSON.parse(appel.function?.arguments ?? "{}");
                } catch (_) { /* arguments illisibles : on appelle à vide */ }
                const recu: ToolReceipt = {};
                const sortie = await runTool(appel.function?.name ?? "", args, supabase, userId, aiKey, recu, peutEcrire);
                return { appel, sortie, recu };
              }),
            );

            for (const { appel, sortie, recu } of resultats) {
              if (recu.citations?.length) citations.push(...recu.citations);
              if (recu.action) actions.push(recu.action);
              /* Le NOM accompagne l'identifiant. La spécification OpenAI
                 l'autorise sur un message d'outil, et la couche de
                 compatibilité de Gemini bâtit son `functionResponse`
                 dessus : sans lui, elle a rendu « Request contains an
                 invalid argument » sans autre détail. */
              workMessages.push({
                role: "tool",
                tool_call_id: appel.id,
                name: appel.function?.name,
                content: sortie,
              });
            }

            /* Au dernier tour on rappelle SANS outils : le modèle n'a plus
               le choix, il répond. Sans cela une boucle d'outils pourrait
               se terminer sur un silence. */
            const dernier = tour >= TOURS_MAX - 1;
            const suite = await appeler(workMessages, !dernier);
            if (!suite.ok || !suite.body) {
              /* UN ÉCHEC EN COURS DE ROUTE N'EST PLUS UN SILENCE.
                 Quand un tour d'outil échouait — quota atteint, requête
                 refusée — la boucle sortait sans rien avoir écrit et
                 l'utilisateur voyait une bulle vide. */
              /* UN 5xx NE DIT PLUS « le modèle a refusé ».
                 Il ne refuse rien : il est saturé. Et depuis que
                 `chatCompletion` réessaie et relaie (voir
                 _shared/relais.ts), un 5xx qui arrive jusqu'ici veut
                 dire que TOUS les modèles de la chaîne ont échoué —
                 ce qui n'appelle pas la même phrase qu'un refus. */
              const raison =
                suite.status === 429
                  ? "j'ai atteint le quota du modèle. Réessaie dans une minute."
                  : suite.status === 402
                    ? "le crédit du modèle est épuisé."
                    : suite.status >= 500
                      ? "les modèles sont saturés — j'ai réessayé sans succès. Retente dans un instant."
                      : `le modèle a refusé la suite (${suite.status}).`;
              const aveu = texteTotal ? `\n\n_(interrompue : ${raison})_` : `Je n'ai pas pu terminer : ${raison}`;
              texteTotal += aveu;
              controller.enqueue(encoder.encode(trame(aveu)));
              break;
            }
            amont = suite;
          }

          if (!texteTotal.trim()) {
            /* Aucun texte du tout : plutôt qu'une bulle vide, on le dit.
               C'était le symptôme visible de trois bugs successifs — la
               signature de pensée perdue, le nom d'outil manquant, le
               quota atteint. */
            const aveu = "Je n'ai rien pu produire sur ce tour. Reformule ou réessaie.";
            texteTotal = aveu;
            controller.enqueue(encoder.encode(trame(aveu)));
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();

          const vus = new Set<string>();
          const citationsUniques = citations.filter((c) => {
            const cle = `${c.source_type}:${c.source_id}`;
            if (vus.has(cle)) return false;
            vus.add(cle);
            return true;
          });
          const metadata =
            citationsUniques.length || actions.length
              ? { citations: citationsUniques, actions }
              : null;

          await supabase.from("mia_messages").insert({
            conversation_id: body.conversation_id,
            user_id: userId,
            role: "assistant",
            content: texteTotal,
            model,
            metadata,
          });
          await supabase
            .from("mia_conversations")
            .update({ last_message_at: new Date().toISOString() })
            .eq("id", body.conversation_id);
        } catch (e) {
          controller.error(e);
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});