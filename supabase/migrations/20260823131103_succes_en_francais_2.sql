-- ═══════════════════════════════════════════════════════════════════
-- RESTAURE DEPUIS LE REGISTRE DE LA BASE, LE 06/09/2026
-- ═══════════════════════════════════════════════════════════════════
--
-- Cette migration a ete APPLIQUEE en production le 2026-08-23
-- sans qu un fichier soit ecrit dans le depot. Elle n existait plus
-- que dans « supabase_migrations.schema_migrations », qui garde le SQL
-- de chaque migration en plus de son numero.
--
-- Le contenu ci-dessous est celui du registre, mot pour mot — la prose
-- d origine comprise. Rien n a ete reecrit.
--
-- NE PAS LA REJOUER : elle est deja appliquee. Elle est ici pour que
-- « supabase/migrations » redevienne un compte rendu fidele du schema,
-- et pour qu un environnement neuf puisse etre reconstruit.
-- ═══════════════════════════════════════════════════════════════════

-- La suite : secrets, journal, legendes, modules, pacte, series,
-- boutique, social, temps, taches et envies.
--
-- LES SUCCES SECRETS gardent leur mystere dans la formulation : ils ne
-- s affichent qu une fois gagnes, mais leur description doit alors
-- dire ce qui a ete fait, pas rester enigmatique.

with fr as (
  select $json${
    "hidden_midnight_goal":  ["Oiseau de nuit", "Franchir un objectif entre minuit et une heure", null],
    "hidden_perfectionist":  ["Perfectionniste", "Franchir toutes les étapes de 10 objectifs différents", null],
    "hidden_shopaholic":     ["Collectionneur compulsif", "Posséder un objet de chaque catégorie cosmétique", null],
    "hidden_speed_demon":    ["Démon de vitesse", "Franchir un objectif dans les 3 minutes suivant sa création", null],
    "hidden_zen_master":     ["Maître zen", "Passer une journée entière sans aucune tâche en attente", null],
    "the_checkmate_day":     ["Le jour de l'échec et mat", "Franchir exactement 8 étapes en une journée", "L'équilibre parfait emporte la partie"],
    "the_silent_completion": ["L'achèvement silencieux", "Franchir un objectif sans jamais ouvrir sa fiche", "La vraie maîtrise se passe de témoin"],
    "whisper_of_the_pact":   ["Murmure du pacte", "Se connecter à 04:44 ou 03:33 à trois reprises", "Les nombres parlent à qui les écoute"],

    "journal_first_entry":   ["Cher journal", "Écrivez votre première entrée", null],
    "journal_7_entries":     ["Recul hebdomadaire", "Écrivez 7 entrées", null],
    "journal_30_entries":    ["Sondeur d'âme", "Écrivez 30 entrées", null],
    "journal_100_entries":   ["Chroniqueur", "Écrivez 100 entrées", null],
    "journal_365_entries":   ["Une année de mots", "Écrivez 365 entrées", null],

    "legend_10_impossible":  ["Au-delà des limites", "Franchissez 10 objectifs impossibles", null],
    "legend_1000_steps":     ["Arpenteur", "Franchissez 1 000 étapes au total", null],
    "legend_365_streak":     ["Flamme éternelle", "Tenez 365 jours de connexion d'affilée", null],
    "legend_all_modules":    ["Omniscient", "Possédez tous les modules", null],
    "legend_master_all":     ["Panthéon", "Débloquez 50 autres succès", null],

    "calendar_pro":          ["Calendrier maîtrisé", "Créez 30 événements (module Calendrier requis)", null],
    "finance_guru":          ["Finances tenues", "Validez 6 mois (module Finances requis)", null],
    "focus_marathon":        ["Marathon de concentration", "Terminez 50 sessions (module Concentration requis)", null],
    "health_30_checkins":    ["Assidu du bien-être", "Faites 30 relevés (module Santé requis)", null],
    "journal_sage":          ["Sage du journal", "Écrivez 50 entrées (module Journal requis)", null],
    "social_networker":      ["Bien entouré", "Comptez 15 alliés (module Communauté requis)", null],
    "todo_powerhouse":       ["Machine à tâches", "Terminez 200 tâches (module Tâches requis)", null],
    "wishlist_master":       ["Maître des envies", "Acquérez 10 objets (module Envies requis)", null],

    "the_sealed_pact":       ["Le pacte scellé", "Définissez votre pacte pour la première fois", "Le serment est écrit dans la durée"],
    "keeper_of_the_oath":    ["Gardien du serment", "Modifiez le mantra ou le symbole de votre pacte", "Évoluer n'est pas trahir"],
    "fate_unbound":          ["Destin délié", "Atteignez un nouveau rang", "Vous montez au-delà de la mesure"],

    "cycle_master":          ["Maître du cycle", "Franchissez 30 objectifs en une année", "Vous tenez le rythme du temps"],
    "the_endless_line":      ["La ligne sans fin", "Franchissez 1 000 étapes au total", "Chaque étape est un monument"],

    "shop_first_cosmetic":   ["Première parure", "Achetez votre premier cosmétique", null],
    "shop_10_cosmetics":     ["Garde-robe", "Possédez 10 cosmétiques", null],
    "shop_first_module":     ["Module ouvert", "Achetez votre premier module", null],
    "shop_3_modules":        ["Bien équipé", "Achetez 3 modules", null],
    "shop_all_modules":      ["Arsenal complet", "Achetez tous les modules disponibles", null],
    "shop_spend_1000":       ["Main large", "Dépensez 1 000 bonds au total", null],
    "shop_spend_5000":       ["Gros porteur", "Dépensez 5 000 bonds au total", null],
    "shop_spend_10000":      ["Magnat", "Dépensez 10 000 bonds au total", null],

    "social_first_friend":   ["Premier lien", "Ajoutez votre premier allié", null],
    "social_5_friends":      ["Escouade", "Comptez 5 alliés", null],
    "social_10_friends":     ["Bien connu", "Comptez 10 alliés", null],
    "social_25_friends":     ["Cercle large", "Comptez 25 alliés", null],
    "social_join_guild":     ["Recrue de guilde", "Rejoignez votre première guilde", null],
    "social_100_messages":   ["Beau parleur", "Envoyez 100 messages de guilde", null],
    "social_500_messages":   ["Légende de la guilde", "Envoyez 500 messages de guilde", null],

    "echo_breaker":          ["Briseur d'écho", "Franchissez un objectif dans les 3 minutes suivant sa création", "La pensée devient fait, sans délai"],
    "warping_path":          ["Chemin courbé", "Franchissez un objectif extrême en moins de 72 heures", "Vous comprimez l'impossible"],
    "cut_through_time":      ["Trancher le temps", "Franchissez un objectif impossible en moins de 30 jours", "Le temps cède à qui n'arrête pas"],

    "todo_first_task":       ["Premiers pas", "Terminez votre première tâche", null],
    "todo_10_tasks":         ["Ça avance", "Terminez 10 tâches", null],
    "todo_50_tasks":         ["Broyeuse de tâches", "Terminez 50 tâches", null],
    "todo_100_tasks":        ["Centurion", "Terminez 100 tâches", null],
    "todo_500_tasks":        ["Mode machine", "Terminez 500 tâches", null],
    "todo_1000_tasks":       ["Force irrésistible", "Terminez 1 000 tâches", null],

    "wishlist_first_item":   ["Lèche-vitrine", "Ajoutez votre première envie", null],
    "wishlist_10_items":     ["Conservateur", "Ajoutez 10 envies", null],
    "wishlist_acquire_5":    ["Collectionneur", "Acquérez 5 envies", null],
    "wishlist_acquire_10":   ["Complétiste", "Acquérez 10 envies", null]
  }$json$::jsonb as t
)
update public.achievement_definitions d
   set nom_fr         = (fr.t -> d.key ->> 0),
       description_fr = (fr.t -> d.key ->> 1),
       saveur_fr      = (fr.t -> d.key ->> 2)
  from fr
 where fr.t ? d.key;
