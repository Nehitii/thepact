

## Plan : Refonte complète du menu Admin (5 phases)

La sécurité est déjà bien en place : toutes les routes `/admin/*` passent par `AdminRoute` qui appelle l'edge function `verify-admin` côté serveur. Un user normal est redirigé vers `/` avant même de voir le contenu. Le seul point faible est `AdminCosmeticsManager` qui fait un check client-side redondant.

---

### Phase 1 — Sécurité & Uniformisation

**`src/pages/AdminCosmeticsManager.tsx`**
- Supprimer le `useEffect` client-side (lignes 96-126) qui query `user_roles` directement
- Remplacer par `useServerAdminCheck` comme les autres pages admin
- Supprimer les states `isAdmin`/`loading` redondants (le `AdminRoute` parent gère déjà tout)

**`src/pages/AdminCosmeticsManager.tsx`, `AdminModuleManager.tsx`, `AdminMoneyManager.tsx`, `AdminPromoManager.tsx`**
- Ajouter un `AlertDialog` de confirmation sur chaque bouton Delete (frames, banners, titles, modules, packs, offers, promo codes)

**`src/pages/AdminNotifications.tsx`**
- Uniformiser le header : ArrowLeft + alignement gauche comme les autres sous-pages

---

### Phase 2 — Composant AdminPageShell

**Nouveau : `src/components/admin/AdminPageShell.tsx`**
- Props : `title`, `subtitle`, `icon`, `children`
- Encapsule : background blur, back button vers `/admin`, container max-w-4xl, loading state
- Supprime ~40 lignes dupliquées par page

**Refactorer** les 6 sous-pages pour utiliser `AdminPageShell`

---

### Phase 3 — Navigation & Ergonomie

**`src/pages/Admin.tsx` (hub)**
- Ajouter des compteurs dynamiques sur chaque bouton : "Cosmetics (12)", "Modules (5)", etc. via queries count
- Masquer les items "Soon" par défaut, toggle discret "Show upcoming"

**Toutes les sous-pages admin**
- Ajouter un breadcrumb horizontal cliquable : `Admin > Cosmetics` avec liens vers les autres sections
- Permet de naviguer entre sous-pages sans revenir au hub

**`src/pages/AdminMode.tsx`**
- Rendre le panel Debug collapsible via `Collapsible` component

---

### Phase 4 — Polish

**Listes longues (Cosmetics, Promo Codes)**
- Ajouter un champ recherche/filtre basique en haut de chaque liste
- Bouton "Duplicate" sur les items pour accélérer la création

---

### Phase 5 — Audit Log & Stats

**Migration DB** : créer table `admin_audit_log` (id, admin_user_id, action, target_type, target_id, metadata jsonb, created_at) avec RLS admin-only

**Nouveau : `src/components/admin/AuditLogPanel.tsx`**
- Affiche les dernières actions admin

**`src/pages/Admin.tsx`**
- Widget Quick Stats : nombre total users, items actifs shop, bonds en circulation

**`src/pages/AdminNotifications.tsx`**
- Historique des notifications envoyées

---

### Sécurité — Résumé des protections en place

| Couche | Mécanisme |
|--------|-----------|
| Route | `AdminRoute` → `useServerAdminCheck` → edge function `verify-admin` |
| Edge function | Vérifie JWT + appelle `has_role()` via service role (bypass RLS) |
| DB | `user_roles` table séparée, `has_role()` SECURITY DEFINER |
| Sidebar | Aucun lien admin visible pour les users normaux |
| Client | Redirect vers `/` si non-admin, même si URL tapée manuellement |

Un user normal ne peut pas : voir le hub admin, voir les sous-pages, ni exécuter les actions admin (tout est bloqué au niveau route + edge function).

