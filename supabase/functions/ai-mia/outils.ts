/* CE QUE M.I.A PEUT FAIRE : trois cent trente-huit lignes de schema,
 * et rien d autre. C est ce texte, et lui seul, qui apprend au
 * modele quels outils existent et quand les appeler.
 *
 * De quel COTE chacun tombe — lecture ou ecriture — se decide dans
 * `classement.ts`, parce que ce n est pas la meme question. */

export const TOOLS = [
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
      name: "list_pacts",
      description: "Liste les pactes du user (id, nom, mantra, couleur). Utile avant create_goal pour choisir le pact_id.",
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
  /* ═════════════ LES MAINS ═════════════
     M.I.A avait treize outils, dont QUATRE MORTS :

       list_recent_habits      habit_logs : 0 ligne
       list_life_areas         life_areas : 0 ligne
       create_decision         decisions  : 0 ligne
       list_recent_transactions  bank_transactions N'EXISTE PAS —
                               la requête échouait en silence et
                               renvoyait [] depuis toujours

     Et ses cinq outils d'écriture commençaient TOUS par `create` :
     elle savait ajouter une tâche, elle ne savait pas en cocher une.

     ELLE ÉCRIT, ELLE NE DÉTRUIT PAS. Aucun outil de suppression ni
     d'archivage n'existe ici, et c'est la garantie : ce qui n'est pas
     outillé ne peut pas arriver. Tout ce qu'elle fait se défait à la
     main en un geste — décocher, replanifier, supprimer une ligne.

     Chaque outil passe par le client `supabase` de l'utilisateur, celui
     qui porte son jeton : les politiques RLS gardent le dernier mot. */

  /* ── ÉTAPES ── */
  {
    type: "function",
    function: {
      name: "list_steps",
      description:
        "Liste les étapes d'un objectif, ou toutes les étapes en attente si aucun objectif n'est précisé. Retourne id, titre, statut, échéance, nom de l'objectif.",
      parameters: {
        type: "object",
        properties: {
          goal_id: { type: "string", description: "UUID de l'objectif. Omettre pour toutes les étapes en attente." },
          only_pending: { type: "boolean", default: true },
          limit: { type: "number", default: 40 },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "complete_step",
      description:
        "Coche une étape comme faite. Demander l'identifiant via list_steps avant, jamais deviner.",
      parameters: {
        type: "object",
        properties: { step_id: { type: "string" } },
        required: ["step_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_step",
      description: "Ajoute une étape à un objectif existant, en fin de liste.",
      parameters: {
        type: "object",
        properties: {
          goal_id: { type: "string" },
          title: { type: "string", description: "Intitulé (max 200 caractères)" },
          due_date: { type: "string", description: "Échéance ISO (YYYY-MM-DD), facultative" },
        },
        required: ["goal_id", "title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "reschedule_step",
      description: "Déplace l'échéance d'une étape.",
      parameters: {
        type: "object",
        properties: {
          step_id: { type: "string" },
          due_date: { type: "string", description: "Nouvelle échéance ISO (YYYY-MM-DD), ou null pour l'enlever" },
        },
        required: ["step_id"],
      },
    },
  },

  /* ── TÂCHES ── */
  {
    type: "function",
    function: {
      name: "list_todos",
      description: "Liste les tâches ouvertes de l'utilisateur, échéance la plus proche en tête.",
      parameters: {
        type: "object",
        properties: {
          include_done: { type: "boolean", default: false },
          limit: { type: "number", default: 30 },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "complete_todo",
      description: "Coche une tâche comme faite. Demander l'identifiant via list_todos avant.",
      parameters: {
        type: "object",
        properties: { todo_id: { type: "string" } },
        required: ["todo_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "reschedule_todo",
      description: "Déplace l'échéance d'une tâche.",
      parameters: {
        type: "object",
        properties: {
          todo_id: { type: "string" },
          deadline: { type: "string", description: "Nouvelle échéance ISO (YYYY-MM-DD), ou null pour l'enlever" },
        },
        required: ["todo_id"],
      },
    },
  },

  /* ── FOCUS ── */
  {
    type: "function",
    function: {
      name: "focus_summary",
      description:
        "Séances de concentration terminées sur les N derniers jours : total de minutes, nombre de séances, répartition par jour.",
      parameters: { type: "object", properties: { days: { type: "number", default: 7 } } },
    },
  },

  /* ── SANTÉ ── */
  {
    type: "function",
    function: {
      name: "health_summary",
      description:
        "Relevés de santé des N derniers jours : sommeil, énergie, stress, hydratation, mouvement, humeur, plus la série de pointages.",
      parameters: { type: "object", properties: { days: { type: "number", default: 14 } } },
    },
  },

  /* ── AGENDA ── */
  {
    type: "function",
    function: {
      name: "list_calendar_events",
      description: "Évènements de l'agenda sur une fenêtre de jours autour d'aujourd'hui.",
      parameters: {
        type: "object",
        properties: {
          days_ahead: { type: "number", default: 14 },
          days_back: { type: "number", default: 0 },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_calendar_event",
      description: "Pose un évènement dans l'agenda.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          start_time: { type: "string", description: "Début, ISO 8601 complet" },
          end_time: { type: "string", description: "Fin, ISO 8601 complet. Par défaut une heure après le début." },
          all_day: { type: "boolean", default: false },
          location: { type: "string" },
        },
        required: ["title", "start_time"],
      },
    },
  },

  /* ── SOUHAITS ── */
  {
    type: "function",
    function: {
      name: "list_wishlist",
      description: "Liste des souhaits, non acquis d'abord, avec coût estimé et priorité.",
      parameters: { type: "object", properties: { limit: { type: "number", default: 30 } } },
    },
  },
  {
    type: "function",
    function: {
      name: "add_wishlist_item",
      description: "Ajoute un souhait à la liste.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          estimated_cost: { type: "number" },
          category: { type: "string" },
          url: { type: "string" },
        },
        required: ["name"],
      },
    },
  },

  /* ── FINANCE ──
     Remplace list_recent_transactions, qui interrogeait une table
     inexistante. Ce que la base contient vraiment : un bilan mensuel et
     des récurrents. */
  {
    type: "function",
    function: {
      name: "finance_summary",
      description:
        "Bilan financier : le mois courant (revenus, charges fixes et variables, épargne, reste) et les récurrents actifs.",
      parameters: { type: "object", properties: { months: { type: "number", default: 3 } } },
    },
  },
];
