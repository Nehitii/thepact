// AI Coach — streaming chat via the configured AI provider (see _shared/ai.ts).
// Persists user + assistant messages in coach_messages, supports tool calls.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";
import { checkAiQuota } from "../_shared/quota.ts";
import { chatCompletion, embed, getAiKey, normalizeModel, upstreamErrorMessage } from "../_shared/ai.ts";

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
const SYSTEM_PROMPT = `Tu es M.I.A — Mysterious Intelligence Array — l'intelligence intégrée à Vowpact, l'application de suivi de vie de l'utilisateur.

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

const TOOLS = [
  {
    type: "function",
    function: {
      name: "list_active_goals",
      description: "Liste les goals en cours et à démarrer du user (max 20, triés in_progress puis not_started, focus en tête). Retourne id, nom, difficulté, progression, pact_id, is_active_pact.",
      parameters: { type: "object", properties: { limit: { type: "number", default: 20 } } },
    },
  },
  {
    type: "function",
    function: {
      name: "list_recent_habits",
      description: "Liste les complétions d'habitudes des 14 derniers jours.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "list_recent_transactions",
      description: "Liste les 30 dernières transactions financières (date, libellé, montant, type, catégorie).",
      parameters: { type: "object", properties: { limit: { type: "number", default: 30 } } },
    },
  },
  {
    type: "function",
    function: {
      name: "list_recent_journal",
      description: "Liste les 10 dernières entrées de journal (titre, mood, extrait).",
      parameters: { type: "object", properties: { limit: { type: "number", default: 10 } } },
    },
  },
  {
    type: "function",
    function: {
      name: "list_user_values",
      description: "Récupère les valeurs et domaines de vie de l'utilisateur.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "search_memory",
      description: "Recherche sémantique dans la mémoire long-terme du user (journal, reviews, decisions indexés).",
      parameters: {
        type: "object",
        properties: { query: { type: "string" } },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_todo",
      description: "Crée une tâche todo pour l'utilisateur. Utiliser uniquement si le user demande explicitement d'ajouter une tâche.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Intitulé de la tâche (max 200 chars)" },
          deadline: { type: "string", description: "Date ISO (YYYY-MM-DD) optionnelle" },
          priority: { type: "string", enum: ["low", "medium", "high"], default: "medium" },
          is_urgent: { type: "boolean", default: false },
          category: { type: "string", default: "general" },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_journal_entry",
      description: "Ajoute une entrée de journal. Réservé aux moments où le user demande explicitement de noter une réflexion.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          content: { type: "string" },
          mood: { type: "string", description: "ex: reflective, joyful, anxious, focused" },
        },
        required: ["title", "content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_decision",
      description: "Enregistre une décision dans le Decision Log (contexte + hypothèse + confiance).",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          context: { type: "string" },
          hypothesis: { type: "string" },
          decision_text: { type: "string", description: "La décision prise" },
          expected_outcome: { type: "string" },
          confidence: { type: "number", description: "1-5" },
          review_at: { type: "string", description: "Date ISO de revue future" },
          reversibility: { type: "string", enum: ["reversible", "hard_to_reverse", "irreversible"] },
        },
        required: ["title", "decision_text"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_pacts",
      description: "Liste les pactes du user (id, nom, mantra, couleur). Utile avant create_goal pour choisir le pact_id.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "list_life_areas",
      description: "Liste les domaines de vie du user (id, nom, poids, couleur). Utile avant create_goal pour rattacher un domaine.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "create_goal",
      description: "Crée un nouveau goal (mission classique, pas une habitude). Demande pact_id (via list_pacts si inconnu).",
      parameters: {
        type: "object",
        properties: {
          pact_id: { type: "string", description: "UUID du pacte parent" },
          name: { type: "string", description: "Nom du goal (max 200 chars)" },
          difficulty: { type: "string", enum: ["easy", "medium", "hard", "extreme", "epic", "ultimate"], default: "medium" },
          total_steps: { type: "number", description: "Nombre d'étapes prévues (>= 1)", default: 1 },
          deadline: { type: "string", description: "Date ISO YYYY-MM-DD optionnelle" },
          notes: { type: "string", description: "Description / contexte optionnel" },
          life_area_id: { type: "string", description: "UUID du domaine de vie optionnel" },
        },
        required: ["pact_id", "name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_habit_goal",
      description: "Crée une habitude (goal de type 'habit') avec une durée en jours. Demande pact_id (via list_pacts).",
      parameters: {
        type: "object",
        properties: {
          pact_id: { type: "string" },
          name: { type: "string" },
          habit_duration_days: { type: "number", description: "Durée en jours (7-365)", default: 21 },
          difficulty: { type: "string", enum: ["easy", "medium", "hard", "extreme", "epic", "ultimate"], default: "medium" },
          life_area_id: { type: "string" },
        },
        required: ["pact_id", "name"],
      },
    },
  },
];

interface ToolReceipt {
  citations?: Array<{ source_type: string; source_id: string; snippet: string; similarity?: number }>;
  action?: { tool: string; status: "ok" | "error"; label: string; ref_id?: string; ref_type?: string; error?: string };
}

async function runTool(
  name: string,
  args: any,
  supabase: any,
  userId: string,
  aiKey: string,
  receipts: ToolReceipt,
): Promise<string> {
  try {
    if (name === "list_active_goals") {
      const { data: pacts } = await supabase.from("pacts").select("id").eq("user_id", userId);
      const ids = (pacts ?? []).map((p: any) => p.id);
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
        .limit(args?.limit ?? 20);
      const enriched = (data ?? [])
        .map((g: any) => ({ ...g, is_active_pact: g.pact_id === activePactId }))
        .sort((a: any, b: any) => {
          if (a.is_active_pact !== b.is_active_pact) return a.is_active_pact ? -1 : 1;
          if (a.is_focus !== b.is_focus) return a.is_focus ? -1 : 1;
          if (a.status !== b.status) return a.status === "in_progress" ? -1 : 1;
          return 0;
        });
      return JSON.stringify(enriched);
    }
    if (name === "list_recent_habits") {
      const since = new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10);
      const { data } = await supabase
        .from("habit_logs")
        .select("goal_id,log_date,completed,streak_count")
        .eq("user_id", userId)
        .gte("log_date", since)
        .order("log_date", { ascending: false })
        .limit(200);
      return JSON.stringify(data ?? []);
    }
    if (name === "list_recent_transactions") {
      const { data } = await supabase
        .from("bank_transactions")
        .select("transaction_date,description,amount,transaction_type,category")
        .eq("user_id", userId)
        .order("transaction_date", { ascending: false })
        .limit(args?.limit ?? 30);
      return JSON.stringify(data ?? []);
    }
    if (name === "list_recent_journal") {
      const { data } = await supabase
        .from("journal_entries")
        .select("title,mood,content,created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(args?.limit ?? 10);
      const trimmed = (data ?? []).map((e: any) => ({
        ...e,
        content: (e.content ?? "").slice(0, 400),
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
      const { data } = await supabase.rpc("match_coach_memory", {
        _query: vector,
        _match_count: 6,
      });
      const rows = (data ?? []) as Array<any>;
      receipts.citations = (receipts.citations ?? []).concat(
        rows.map((r) => ({
          source_type: r.source_type,
          source_id: r.source_id,
          snippet: String(r.content ?? "").slice(0, 220),
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
    if (name === "list_life_areas") {
      const { data } = await supabase
        .from("life_areas")
        .select("id,name,weight,color,icon")
        .eq("user_id", userId)
        .order("sort_order");
      return JSON.stringify(data ?? []);
    }
    if (name === "create_goal") {
      const pact_id = String(args?.pact_id ?? "").trim();
      const nm = String(args?.name ?? "").trim().slice(0, 200);
      if (!pact_id || !nm) return JSON.stringify({ error: "pact_id_and_name_required" });
      // Verify pact belongs to user
      const { data: pact } = await supabase.from("pacts").select("id").eq("id", pact_id).eq("user_id", userId).maybeSingle();
      if (!pact) return JSON.stringify({ error: "pact_not_found" });
      const totalSteps = Math.max(1, Math.min(50, Number(args?.total_steps ?? 1)));
      const payload: any = {
        pact_id,
        name: nm,
        difficulty: args?.difficulty ?? "medium",
        goal_type: "normal",
        total_steps: totalSteps,
        notes: args?.notes ?? null,
        deadline: args?.deadline ?? null,
        life_area_id: args?.life_area_id ?? null,
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
      const nm = String(args?.name ?? "").trim().slice(0, 200);
      if (!pact_id || !nm) return JSON.stringify({ error: "pact_id_and_name_required" });
      const { data: pact } = await supabase.from("pacts").select("id").eq("id", pact_id).eq("user_id", userId).maybeSingle();
      if (!pact) return JSON.stringify({ error: "pact_not_found" });
      const days = Math.max(7, Math.min(365, Number(args?.habit_duration_days ?? 21)));
      const payload: any = {
        pact_id,
        name: nm,
        goal_type: "habit",
        difficulty: args?.difficulty ?? "medium",
        habit_duration_days: days,
        habit_checks: Array(days).fill(false),
        total_steps: days,
        life_area_id: args?.life_area_id ?? null,
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
      const nm = String(args?.name ?? "").trim().slice(0, 200);
      if (!nm) return JSON.stringify({ error: "name_required" });
      const { data, error } = await supabase.from("todo_tasks").insert({
        user_id: userId,
        name: nm,
        deadline: args?.deadline ?? null,
        priority: args?.priority ?? "medium",
        is_urgent: !!args?.is_urgent,
        category: args?.category ?? "general",
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
      const title = String(args?.title ?? "").trim().slice(0, 200);
      const content = String(args?.content ?? "").trim();
      if (!title || !content) return JSON.stringify({ error: "title_and_content_required" });
      const payload: any = { user_id: userId, title, content };
      if (typeof args?.mood === "string" && args.mood.trim()) payload.mood = args.mood.trim();
      const { data, error } = await supabase.from("journal_entries").insert(payload).select("id,title").single();
      if (error) {
        receipts.action = { tool: "create_journal_entry", status: "error", label: title, error: error.message };
        return JSON.stringify({ error: error.message });
      }
      receipts.action = { tool: "create_journal_entry", status: "ok", label: data.title, ref_id: data.id, ref_type: "journal" };
      return JSON.stringify({ ok: true, entry: data });
    }
    if (name === "create_decision") {
      const title = String(args?.title ?? "").trim().slice(0, 200);
      const decision_text = String(args?.decision_text ?? "").trim();
      if (!title || !decision_text) return JSON.stringify({ error: "title_and_decision_required" });
      const payload: any = {
        user_id: userId,
        title,
        decision_text,
        context: args?.context ?? null,
        hypothesis: args?.hypothesis ?? null,
        expected_outcome: args?.expected_outcome ?? null,
        confidence: typeof args?.confidence === "number" ? args.confidence : null,
        review_at: args?.review_at ?? null,
        reversibility: args?.reversibility ?? null,
      };
      const { data, error } = await supabase.from("decisions").insert(payload).select("id,title").single();
      if (error) {
        receipts.action = { tool: "create_decision", status: "error", label: title, error: error.message };
        return JSON.stringify({ error: error.message });
      }
      receipts.action = { tool: "create_decision", status: "ok", label: data.title, ref_id: data.id, ref_type: "decision" };
      return JSON.stringify({ ok: true, decision: data });
    }
    return JSON.stringify({ error: "unknown_tool" });
  } catch (e) {
    return JSON.stringify({ error: String(e) });
  }
}

/* ═══════════════════════════════════════════════════════════════
   L'ÉTAT DU JOUR, DONNÉ AVANT QU'ON LE DEMANDE

   L'ancien prompt ordonnait d'appeler un outil AVANT TOUTE QUESTION
   FACTUELLE. « Où j'en suis ? » coûtait donc un tour d'outil complet :
   une génération pour décider d'appeler, une requête, une génération
   pour répondre.

   Ces quelques lignes, calculées en une salve de requêtes parallèles,
   répondent à la moitié des questions sans un seul outil. Elles
   coûtent une centaine de tokens et une trentaine de millisecondes.
   ═══════════════════════════════════════════════════════════════ */
async function etatDuJour(supabase: any, userId: string): Promise<string> {
  const maintenant = new Date();
  const jour = maintenant.toISOString().slice(0, 10);

  const [profil, pacts, objectifs, ordres, focus, taches, bonds] = await Promise.all([
    supabase.from("profiles").select("active_pact_id, display_name, timezone").eq("id", userId).maybeSingle(),
    supabase.from("pacts").select("id,name,project_start_date,project_end_date").eq("user_id", userId),
    /* `goals` n'a pas de user_id : le lien passe par le pacte. Les
       politiques RLS font le filtrage, on récupère donc tout ce que
       l'utilisateur a le droit de voir. */
    supabase.from("goals").select("id,name,status,validated_steps,total_steps,pact_id,is_focus,deadline"),
    supabase.from("daily_quests").select("title,progress,target,status,reward_bonds").eq("user_id", userId).eq("date", jour),
    supabase.from("pomodoro_sessions").select("duration_minutes").eq("user_id", userId).eq("completed", true).gte("started_at", `${jour}T00:00:00`),
    supabase.from("todo_tasks").select("name,deadline").eq("user_id", userId).eq("status", "active").limit(40),
    supabase.from("bond_balance").select("balance").eq("user_id", userId).maybeSingle(),
  ]);

  const lignes: string[] = [
    `ÉTAT DU JOUR — ${maintenant.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}.`,
    `Cette donnée est fraîche : n'appelle pas d'outil pour la retrouver.`,
  ];

  /* Sans le nom, M.I.A repondait « ton nom est Inconnu car je n ai pas
     cette donnee » a qui lui demandait comment il s appelait. */
  const nom = profil?.data?.display_name;
  if (nom) lignes.push(`Ton interlocuteur s appelle ${nom}.`);

  const actifId = profil?.data?.active_pact_id ?? null;
  const listePacts = pacts?.data ?? [];
  const pacte = listePacts.find((p: any) => p.id === actifId) ?? listePacts[0] ?? null;

  if (pacte) {
    const debut = pacte.project_start_date ? new Date(pacte.project_start_date).getTime() : null;
    const fin = pacte.project_end_date ? new Date(pacte.project_end_date).getTime() : null;
    if (debut && fin && fin > debut) {
      const total = Math.round((fin - debut) / 86_400_000);
      const ecoule = Math.max(0, Math.floor((Date.now() - debut) / 86_400_000));
      const reste = Math.max(0, Math.ceil((fin - Date.now()) / 86_400_000));
      lignes.push(
        `Pacte actif : ${pacte.name} — jour ${ecoule} / ${total}, ${reste} jours restants, ` +
          `fin le ${new Date(fin).toLocaleDateString("fr-FR")}.`,
      );
    } else {
      lignes.push(`Pacte actif : ${pacte.name} (pas de dates posées).`);
    }
    if (listePacts.length > 1) {
      lignes.push(`Autres pactes : ${listePacts.filter((p: any) => p.id !== pacte.id).map((p: any) => p.name).join(", ")}.`);
    }
  } else {
    lignes.push("Aucun pacte enregistré.");
  }

  const buts = (objectifs?.data ?? []).filter((g: any) =>
    listePacts.some((p: any) => p.id === g.pact_id),
  );
  if (buts.length) {
    const enCours = buts.filter((g: any) => g.status === "in_progress").length;
    const aVenir = buts.filter((g: any) => g.status === "not_started").length;
    const finis = buts.filter((g: any) => g.status === "fully_completed" || g.status === "validated").length;
    const faites = buts.reduce((s: number, g: any) => s + (g.validated_steps ?? 0), 0);
    const etapes = buts.reduce((s: number, g: any) => s + (g.total_steps ?? 0), 0);
    /* ON DONNE LES TOTAUX DÉJÀ FAITS, PAS LEURS INGRÉDIENTS.

       Premier essai, l'état annonçait « 14 en cours, 11 non commencés,
       étapes 142/423 » et laissait le modèle en déduire ce qu'on lui
       demandait. Réponse obtenue : « 48 étapes sur 11 objectifs en
       cours, 276 au total ». Trois chiffres, trois faux — la vérité
       était 59 sur 14, et 281 au total.

       Un modèle ne somme pas quatorze lignes de tête. Chaque nombre
       qu'on risque de lui demander est donc calculé ici, en Postgres,
       et il n'a plus qu'à le lire. */
    const restant = (statut: string) =>
      buts
        .filter((g: any) => g.status === statut)
        .reduce((s: number, g: any) => s + Math.max(0, (g.total_steps ?? 0) - (g.validated_steps ?? 0)), 0);

    lignes.push(
      `Objectifs : ${enCours} en cours (${restant("in_progress")} étapes restantes), ` +
        `${aVenir} non commencés (${restant("not_started")} étapes restantes), ${finis} terminés.`,
    );
    lignes.push(
      `Étapes, toutes catégories : ${faites} faites sur ${etapes}, ${Math.max(0, etapes - faites)} restantes.`,
    );

    const plusGros = buts
      .filter((g: any) => g.status === "in_progress")
      .map((g: any) => ({ nom: g.name, reste: Math.max(0, (g.total_steps ?? 0) - (g.validated_steps ?? 0)) }))
      .filter((g: any) => g.reste > 0)
      .sort((a: any, b: any) => b.reste - a.reste)
      .slice(0, 3);
    if (plusGros.length) {
      lignes.push(
        `Plus gros restes en cours : ${plusGros.map((g: any) => `${g.nom} (${g.reste})`).join(", ")}.`,
      );
    }
    const brigade = buts.filter((g: any) => g.is_focus && g.status !== "fully_completed").map((g: any) => g.name);
    if (brigade.length) lignes.push(`Brigade (objectifs épinglés) : ${brigade.join(", ")}.`);
  }

  const listeOrdres = ordres?.data ?? [];
  if (listeOrdres.length) {
    const prime = listeOrdres.reduce((s: number, q: any) => s + (q.reward_bonds ?? 0), 0);
    const acquise = listeOrdres
      .filter((q: any) => q.status === "claimed")
      .reduce((s: number, q: any) => s + (q.reward_bonds ?? 0), 0);
    lignes.push(
      `Ordres du jour : ` +
        listeOrdres.map((q: any) => `${q.title} ${q.progress}/${q.target}`).join(" · ") +
        ` — prime ${acquise}/${prime} bonds.`,
    );
  }

  const minutes = (focus?.data ?? []).reduce((s: number, p: any) => s + (p.duration_minutes ?? 0), 0);
  lignes.push(`Focus aujourd'hui : ${minutes} minute${minutes > 1 ? "s" : ""}.`);

  const listeTaches = taches?.data ?? [];
  if (listeTaches.length) {
    const prochaines = listeTaches
      .filter((t: any) => t.deadline)
      .sort((a: any, b: any) => String(a.deadline).localeCompare(String(b.deadline)))
      .slice(0, 4)
      .map((t: any) => `${t.name} (${new Date(t.deadline).toLocaleDateString("fr-FR")})`);
    lignes.push(
      `Tâches ouvertes : ${listeTaches.length}` +
        (prochaines.length ? `. Prochaines échéances : ${prochaines.join(", ")}.` : "."),
    );
  } else {
    lignes.push("Tâches ouvertes : aucune.");
  }

  if (bonds?.data?.balance != null) lignes.push(`Solde : ${bonds.data.balance} bonds.`);

  return lignes.join("\n");
}

/** Une trame SSE au format que le client sait déjà lire. */
function trame(contenu: string): string {
  return `data: ${JSON.stringify({ choices: [{ delta: { content: contenu } }] })}\n\n`;
}

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
): Promise<{ texte: string; outils: any[] }> {
  const lecteur = amont.body!.getReader();
  const decodeur = new TextDecoder();
  const outils: any[] = [];
  let reste = "";
  let texte = "";

  while (true) {
    const { value, done } = await lecteur.read();
    if (done) break;
    const morceau = reste + decodeur.decode(value, { stream: true });
    const lignes = morceau.split("\n");
    reste = lignes.pop() ?? "";
    for (const ligne of lignes) {
      if (!ligne.startsWith("data: ")) continue;
      const charge = ligne.slice(6).trim();
      if (!charge || charge === "[DONE]") continue;
      let json: any;
      try {
        json = JSON.parse(charge);
      } catch (_) {
        continue;
      }
      const delta = json?.choices?.[0]?.delta;
      if (!delta) continue;
      if (delta.content) {
        texte += delta.content;
        controller.enqueue(encoder.encode(trame(delta.content)));
      }
      for (const appel of delta.tool_calls ?? []) {
        const i = appel.index ?? 0;
        if (!outils[i]) outils[i] = { id: "", type: "function", function: { name: "", arguments: "" } };
        if (appel.id) outils[i].id = appel.id;
        if (appel.function?.name) outils[i].function.name = appel.function.name;
        if (appel.function?.arguments) outils[i].function.arguments += appel.function.arguments;
        /* LA SIGNATURE DE PENSEE VOYAGE AVEC L APPEL, ET DOIT REVENIR AVEC LUI.

           Gemini 3 joint a chaque appel d outil un `extra_content.google.
           thought_signature`, et REFUSE le tour suivant si on ne le lui
           rend pas : 400 INVALID_ARGUMENT, « Function call is missing a
           thought_signature in functionCall parts ».

           L ancienne boucle ne diffusait pas : elle repassait l objet
           `tool_calls` du modele tel quel, donc la signature suivait sans
           qu on ait a y penser. En recollant les morceaux du flux, on
           reconstruit l objet — et il faut donc la recopier a la main. */
        if (appel.extra_content) {
          outils[i].extra_content = { ...(outils[i].extra_content ?? {}), ...appel.extra_content };
        }
      }
    }
  }

  return { texte, outils: outils.filter(Boolean) };
}

interface ChatBody {
  conversation_id: string;
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
    const quotaResp = await checkAiQuota(supabase, "ai-coach", 100, corsHeaders);
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
    await supabase.from("coach_messages").insert({
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
      .from("coach_messages")
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

    const etat = await etatDuJour(supabase, userId);

    /* UN SEUL MESSAGE SYSTÈME, PAS DEUX.
       L'état du jour était envoyé dans un second message système, après
       les règles. Le modèle l'a lu comme la consigne la plus fraîche et
       a répondu sur le ton d'un rapport. Les règles, l'état et le rappel
       tiennent maintenant dans un seul bloc, le rappel en dernier. */
    const workMessages: any[] = [
      { role: "system", content: `${SYSTEM_PROMPT}\n\n${etat}\n\n${RAPPEL_VOIX}` },
      ...historique.map((m: any) => ({ role: m.role, content: m.content })),
    ];

    const appeler = (messages: any[], avecOutils: boolean) =>
      chatCompletion(
        avecOutils
          ? { model, messages, tools: TOOLS, tool_choice: "auto", stream: true }
          : { model, messages, stream: true },
        aiKey,
      );

    /* Le PREMIER appel se fait hors du flux : c'est le seul endroit où
       l'on peut encore répondre un vrai code d'erreur au client. Une fois
       le ReadableStream ouvert, l'en-tête est parti. */
    const premier = await appeler(workMessages, true);
    if (!premier.ok || !premier.body) {
      const errText = await premier.text();
      if (premier.status === 429 || premier.status === 402) {
        return new Response(JSON.stringify({ error: upstreamErrorMessage(premier.status) }), {
          status: premier.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: errText || "AI error" }), {
        status: 500,
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
              outils.map(async (appel: any) => {
                let args: any = {};
                try {
                  args = JSON.parse(appel.function?.arguments ?? "{}");
                } catch (_) { /* arguments illisibles : on appelle à vide */ }
                const recu: ToolReceipt = {};
                const sortie = await runTool(appel.function?.name, args, supabase, userId, aiKey, recu);
                return { appel, sortie, recu };
              }),
            );

            for (const { appel, sortie, recu } of resultats) {
              if (recu.citations?.length) citations.push(...recu.citations);
              if (recu.action) actions.push(recu.action);
              workMessages.push({ role: "tool", tool_call_id: appel.id, content: sortie });
            }

            /* Au dernier tour on rappelle SANS outils : le modèle n'a plus
               le choix, il répond. Sans cela une boucle d'outils pourrait
               se terminer sur un silence. */
            const dernier = tour >= TOURS_MAX - 1;
            const suite = await appeler(workMessages, !dernier);
            if (!suite.ok || !suite.body) break;
            amont = suite;
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

          await supabase.from("coach_messages").insert({
            conversation_id: body.conversation_id,
            user_id: userId,
            role: "assistant",
            content: texteTotal,
            model,
            metadata,
          });
          await supabase
            .from("coach_conversations")
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