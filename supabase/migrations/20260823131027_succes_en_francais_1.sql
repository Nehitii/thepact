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

-- ═══════════════════════════════════════════════════════════════
-- LES CENT SUCCES, EN FRANCAIS
-- ═══════════════════════════════════════════════════════════════
--
-- Ils etaient tous en anglais — « Task Crusher », « Wellness
-- Initiate », « Dear Diary » — sur une application entierement
-- francaise. Les categories et les raretes sont deja passees par le
-- fichier de langue ; les succes eux-memes ne pouvaient pas y aller :
-- ce sont des DONNEES, pas de la chrome d interface. Ils prennent
-- donc leurs colonnes.
--
-- Les textes passent par un seul litteral JSON plutot que par trois
-- cents chaines SQL : le francais est plein d apostrophes, et
-- « l''Eternite » repete trois cents fois est une occasion d erreur
-- tous les dix mots.
--
-- LE REGISTRE EST CONSERVE. Les phrases de saveur sont volontairement
-- grandiloquentes — c est un pantheon — et le rester en francais
-- demande de traduire l intention, pas les mots : « Consistency burns
-- brighter than brilliance » ne devient pas « La constance brule plus
-- fort que la brillance ».

alter table public.achievement_definitions
  add column if not exists nom_fr text,
  add column if not exists description_fr text,
  add column if not exists saveur_fr text;

with fr as (
  select $json${
    "calendar_first_event":  ["Gardien du temps", "Créez votre premier événement", null],
    "calendar_10_events":    ["Organisateur", "Créez 10 événements", null],
    "calendar_50_events":    ["Architecte du temps", "Créez 50 événements", null],
    "calendar_100_events":   ["Maître des heures", "Créez 100 événements", null],

    "community_first_post":  ["Première voix", "Publiez pour la première fois", null],
    "community_10_posts":    ["Habitué", "Publiez 10 fois", null],
    "community_50_posts":    ["Pilier", "Publiez 50 fois", null],
    "community_100_posts":   ["Voix qui porte", "Publiez 100 fois", null],

    "dawn_walker":           ["Marcheur de l'aube", "Connectez-vous 5 jours d'affilée", "La première lumière reconnaît les fidèles"],
    "keeper_of_the_flame":   ["Gardien de la flamme", "Connectez-vous 30 jours d'affilée", "La constance éclaire plus loin que le génie"],
    "stalker_of_the_shadow": ["Rôdeur de l'ombre", "Connectez-vous 7 fois à minuit", "La nuit connaît votre nom"],
    "time_weaver":           ["Tisserand du temps", "Connectez-vous à la même heure 15 jours durant", "Vous pliez les heures à votre main"],

    "gentle_breeze":         ["Souffle léger", "Franchissez 100 objectifs faciles", "Les petits pas bâtissent les montagnes"],
    "iron_rhythm":           ["Cadence de fer", "Franchissez 50 objectifs moyens", "La discipline est votre socle"],
    "fracture_line":         ["Ligne de fracture", "Franchissez 25 objectifs difficiles", "Vous passez au travers"],
    "blood_of_resolve":      ["Sang-froid", "Franchissez un objectif extrême en 48 heures", "La douleur forge"],
    "the_fractured_crown":   ["La couronne brisée", "Franchissez un objectif impossible", "Vous défiez la limite elle-même"],
    "the_unnamed_rise":      ["L'ascension sans nom", "Franchissez un objectif de difficulté personnalisée", "Vous fixez vos propres mesures"],

    "finance_first_tx":      ["Première écriture", "Enregistrez votre première transaction", null],
    "finance_50_tx":         ["Tenue de comptes", "Enregistrez 50 transactions", null],
    "finance_100_tx":        ["Analyste", "Enregistrez 100 transactions", null],
    "finance_1_month":       ["Mois clos", "Validez votre premier mois", null],
    "finance_6_months":      ["Six mois de tenue", "Validez 6 mois", null],
    "finance_12_months":     ["Année bouclée", "Validez 12 mois", null],

    "focus_first_session":   ["Première session", "Terminez votre première session de concentration", null],
    "focus_10_sessions":     ["Travail en profondeur", "Terminez 10 sessions", null],
    "focus_50_sessions":     ["Maître du flux", "Terminez 50 sessions", null],
    "focus_100_sessions":    ["Hyperfocalisé", "Terminez 100 sessions", null],
    "focus_500_sessions":    ["Plieur de temps", "Terminez 500 sessions", null],
    "focus_1000_min":        ["Esprit de fond", "Accumulez 1 000 minutes de concentration", null],
    "focus_5000_min":        ["Transcendance", "Accumulez 5 000 minutes de concentration", null],

    "the_first_brick":       ["La première pierre", "Créez votre premier objectif", "Tout commence par une intention"],
    "architect_of_intent":   ["Architecte d'intention", "Créez 50 objectifs", "On façonne le réel en le planifiant"],
    "prism_of_difficulties": ["Prisme des difficultés", "Créez un objectif de chaque difficulté", "Vous empruntez toutes les voies"],

    "health_first_checkin":  ["Premier relevé", "Faites votre premier relevé de santé", "Tout commence par un seul pas"],
    "health_week_streak":    ["Semaine parfaite", "Relevez votre santé 7 jours d'affilée", "La régularité transforme"],
    "health_month_streak":   ["Constance du corps", "Relevez votre santé 30 jours d'affilée", "Un mois de soin. Votre corps s'en souvient"],
    "health_centurion":      ["Centurion du bien-être", "Faites 100 relevés au total", "Cent pas vers vous-même"],
    "health_hydration_hero": ["Toujours hydraté", "Atteignez votre objectif d'eau 30 jours", "Bien hydraté, l'esprit suit"],
    "health_sleep_champion": ["Sommeil gagné", "Dormez 8 heures ou plus, 30 jours durant", "Le repos est le socle du reste"],
    "health_stress_master":  ["Calme tenu", "Gardez un stress bas pendant 14 jours", "La paix intérieure est la vraie victoire"]
  }$json$::jsonb as t
)
update public.achievement_definitions d
   set nom_fr         = (fr.t -> d.key ->> 0),
       description_fr = (fr.t -> d.key ->> 1),
       saveur_fr      = (fr.t -> d.key ->> 2)
  from fr
 where fr.t ? d.key;
