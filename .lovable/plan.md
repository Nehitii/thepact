

# Module Calendrier Ultra-Complet — Plan d'Implémentation

## Choix de la bibliothèque : Custom sur `date-fns` (déjà installé)

**Pourquoi pas FullCalendar ou react-big-calendar ?**
- FullCalendar pèse ~200KB gzippé et impose son propre CSS qui entre en conflit avec le design system cyberpunk de VowPact
- react-big-calendar a des problèmes connus de typage TypeScript et un styling rigide
- L'app utilise déjà `date-fns` v3, `@dnd-kit/core` + `@dnd-kit/sortable`, `framer-motion`, et un système de design Tailwind très personnalisé
- Construire sur ces dépendances existantes garantit zéro ajout de dépendance, cohérence visuelle parfaite, et contrôle total

Le cœur mathématique du temps (fuseaux, bissextiles, formats) est délégué à `date-fns` qui le gère nativement. Le drag-and-drop utilise `@dnd-kit` déjà présent.

## Architecture

### Base de données — nouvelle table `calendar_events`

```sql
CREATE TABLE public.calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  all_day BOOLEAN DEFAULT false,
  color TEXT DEFAULT '#3b82f6',
  category TEXT DEFAULT 'general',
  -- Récurrence (RFC 5545 simplifié)
  recurrence_rule JSONB, -- { freq: 'weekly', interval: 2, byDay: ['TU'], until: '2027-01-01' }
  recurrence_parent_id UUID REFERENCES calendar_events(id) ON DELETE CASCADE,
  recurrence_exception BOOLEAN DEFAULT false,
  -- Rappels
  reminders JSONB DEFAULT '[]', -- [{ type: 'notification', minutes_before: 15 }]
  -- Métadonnées
  is_busy BOOLEAN DEFAULT true,
  linked_goal_id UUID,
  linked_todo_id UUID,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own events" ON public.calendar_events
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.calendar_events;
```

### Structure des fichiers

```text
src/
├── pages/Calendar.tsx                    — Page principale
├── components/calendar/
│   ├── CalendarPage.tsx                  — Shell (header, toolbar, vue active)
│   ├── CalendarToolbar.tsx               — Navigation, sélecteur de vue, recherche
│   ├── views/
│   │   ├── MonthView.tsx                 — Grille mensuelle avec DnD
│   │   ├── WeekView.tsx                  — Timeline horaire 7 jours
│   │   ├── DayView.tsx                   — Timeline horaire 1 jour
│   │   ├── YearView.tsx                  — Mini-calendriers x12
│   │   └── AgendaView.tsx                — Liste chronologique
│   ├── EventCard.tsx                     — Chip d'événement (dans les cellules)
│   ├── EventDetailModal.tsx              — Création/édition complète
│   ├── EventQuickAdd.tsx                 — Popover de création rapide
│   ├── RecurrenceEditor.tsx              — UI pour règles de récurrence
│   ├── ReminderEditor.tsx                — UI pour rappels
│   ├── CategoryManager.tsx               — Gestion des catégories/couleurs
│   ├── CalendarSearch.tsx                — Barre de recherche + filtres
│   ├── IcsImportExport.tsx               — Import/Export .ics
│   └── index.ts
├── hooks/
│   └── useCalendarEvents.ts              — CRUD React Query + realtime
```

### Hook `useCalendarEvents`

- `useQuery` pour fetch les événements d'une plage de dates (avec expansion des récurrences côté client)
- Mutations : `createEvent`, `updateEvent`, `deleteEvent`, `duplicateEvent`
- Subscription realtime pour sync multi-onglet
- Fonction `expandRecurrences(event, rangeStart, rangeEnd)` pour matérialiser les occurrences virtuelles

## Fonctionnalités par phase

### Phase 1 — Core Calendar (vue Mois + CRUD)
- **Migration DB** : table `calendar_events`
- **`useCalendarEvents.ts`** : hook complet avec React Query
- **`Calendar.tsx`** (page) + route `/calendar` dans `App.tsx`
- **`CalendarToolbar.tsx`** : navigation mois/semaine/jour, bouton "Today", sélecteur de vue
- **`MonthView.tsx`** : grille 7 colonnes, affichage des événements, DnD avec `@dnd-kit` pour déplacer des événements entre jours
- **`EventDetailModal.tsx`** : formulaire complet (titre, dates, heure début/fin, all-day, couleur, catégorie, description, localisation)
- **`EventQuickAdd.tsx`** : popover au clic sur une cellule vide — titre + heure + save rapide
- **`EventCard.tsx`** : chip coloré avec titre, heure, indicateur récurrence
- Sidebar entry dans `AppSidebar.tsx`

### Phase 2 — Vues Semaine, Jour, Année, Agenda
- **`WeekView.tsx`** : grille horaire 7 colonnes (00h–23h), événements positionnés en absolu, DnD vertical pour redimensionner (changer l'heure), DnD horizontal pour changer le jour
- **`DayView.tsx`** : même logique sur 1 colonne, plus d'espace
- **`YearView.tsx`** : 12 mini-mois en grille 4x3, dots de couleur pour les jours avec événements, clic → navigue au mois
- **`AgendaView.tsx`** : liste groupée par jour, style "planning" linéaire

### Phase 3 — Récurrence & Rappels
- **`RecurrenceEditor.tsx`** : UI pour fréquence (daily/weekly/monthly/yearly), intervalle, jours spécifiques (byDay), fin (count/until/never). Exemple : "Chaque 2ème mardi du mois" → `{ freq: 'monthly', byDay: ['TU'], bySetPos: [2] }`
- **`ReminderEditor.tsx`** : ajout de rappels multiples (5min, 15min, 1h, 1 jour avant). Notifications via `Notification API` du navigateur
- Expansion des récurrences dans `useCalendarEvents` : fonction pure qui génère les occurrences dans la plage visible
- Modification d'une occurrence unique vs toute la série (via `recurrence_exception`)

### Phase 4 — Fonctionnalités avancées
- **`CalendarSearch.tsx`** : recherche full-text sur titre/description, filtres par catégorie/couleur/date range/tags
- **`IcsImportExport.tsx`** : parser `.ics` (VEVENT), export de tous les événements en `.ics` standard
- **`CategoryManager.tsx`** : CRUD de catégories custom avec picker couleur
- **Overlap detection** : option par événement `is_busy` — warning si chevauchement avec un autre événement busy
- **Lien avec Goals/Todos** : sélecteur optionnel pour lier un événement à un goal ou un todo existant
- **Format 12h/24h** : respecte le setting utilisateur depuis le profil

### Phase 5 — i18n & Accessibilité
- Bloc `calendar.*` complet dans `en.json` et `fr.json` (~60 clés)
- Navigation clavier : flèches pour se déplacer entre jours, Enter pour ouvrir, Escape pour fermer, Tab pour les événements
- `role="grid"` sur le calendrier, `role="gridcell"` sur les cellules, `aria-label` descriptifs
- `role="dialog"` sur les modales, focus trap

## Design

Le calendrier adopte la DA cyberpunk de VowPact :
- Fond `bg-card/30 backdrop-blur-sm`, bordures `border-border/50`
- Événements en chips arrondis avec couleur de catégorie
- Aujourd'hui mis en valeur avec `bg-primary/10 ring-1 ring-primary`
- Header avec `font-orbitron` pour le titre
- Responsive : sur mobile, la vue Agenda est le défaut, la vue Mois utilise des dots au lieu de chips

## Fichiers impactés

| Action | Fichier |
|--------|---------|
| **Migration** | `calendar_events` table + RLS + realtime |
| **New** | `src/pages/Calendar.tsx` |
| **New** | `src/components/calendar/` (12 fichiers) |
| **New** | `src/hooks/useCalendarEvents.ts` |
| **Edit** | `src/App.tsx` (route `/calendar`) |
| **Edit** | `src/components/layout/AppSidebar.tsx` (nav entry) |
| **Edit** | `src/i18n/locales/en.json`, `fr.json` (calendar.* keys) |

Aucune nouvelle dépendance npm — tout est construit sur `date-fns`, `@dnd-kit`, `framer-motion` et Tailwind déjà présents.

