
# /finance V4 — "AURA" Neo-Banking Glassmorphism

Refonte radicale de `/finance` vers une esthétique **Neo-Bank premium** (Revolut / Mercury / Apple Card) avec glassmorphism, néons subtils et hiérarchie aérée. On casse la structure actuelle (5 onglets + hero VAULT) pour repartir sur un dashboard widget-driven.

## Diagnostic actuel

- VAULT OS = trop tactique/cyber-militaire, pas assez "premium banking"
- Hero dense (sparkline + ratios + ticker) → manque d'air
- Tabs nombreuses (Dashboard/Budget/Transactions/Accounts/Planner) = friction
- KPI cards bordurées, pas de glassmorphism vrai
- Background mesh chargé

## Vision AURA

Mode sombre profond `Midnight #0A0E1A` + accents `Electric Blue #00D1FF` et `Mint #00F5A0`. Cartes en verre dépoli avec bordures lumineuses 1px, radius cohérent **20px** partout, espaces négatifs généreux, typographie Inter pour la lisibilité (chiffres tabulaires en `Geist Mono`).

---

## Nouvelle architecture

### Layout principal
```
┌─ AuraBackground (orbes radiaux flous + grille très subtile) ─────────────┐
│                                                                          │
│  ┌─────────────── HERO BALANCE (centré, aéré) ──────────────────┐       │
│  │  Total Balance                                                │       │
│  │  €12,847.32                          [VirtualCard 3D rotatif] │       │
│  │  ▲ +2.7% this month                                           │       │
│  │  ╱╲╱╲╱╲ Cash flow curve (Bezier animée 30j)                  │       │
│  └───────────────────────────────────────────────────────────────┘       │
│                                                                          │
│  ┌─ Income ─┐  ┌─ Expenses ─┐  ┌─ Savings ─┐  ┌─ Net ─┐                │
│  │ glass    │  │ glass      │  │ glass     │  │ glass │  (widgets)     │
│  └──────────┘  └────────────┘  └───────────┘  └───────┘                │
│                                                                          │
│  ┌─ Floating bottom tab bar (4 sections) ────────────────────────┐      │
│  │  ◉ Overview   Budget   Transactions   Accounts                │      │
│  └───────────────────────────────────────────────────────────────┘      │
└──────────────────────────────────────────────────────────────────────────┘
```

### Onglets — réduit de 5 à 4
Fusionne **Planner** dans **Overview** (section "Forecast" en bas). Garde les noms clairs : **Overview · Budget · Transactions · Accounts**.

Navigation : barre d'onglets flottante en bas du hero (sticky), pills ultra-fines en glass, indicateur actif lumineux mint.

---

## 5 piliers de la refonte

### 1. `AuraBackground`
- Fond `#0A0E1A` profond
- 2-3 orbes radiaux flous (blur-3xl) bleu électrique + mint, animation très lente (>20s)
- Grille fine 120px à 3% d'opacité
- Aucune particule (on retire le côté tactique militaire)

### 2. `AuraBalanceHero`
- Solde total en **64px Inter Display semi-bold**, animé (AnimatedNumber existant)
- Sous-titre delta MoM avec flèche colorée
- **VirtualCard 3D** à droite : carte bancaire CSS pure, gradient dynamique selon devise, légère rotation au hover (transform-style: preserve-3d)
- Courbe Bezier SVG fluide 30 jours sous le solde (path animé au mount, gradient stroke)
- Glassmorphism : `bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08]`, radius 24px

### 3. `AuraWidget` (KPI glass)
4 widgets en grille (Income / Expenses / Savings / Net Monthly) :
- Glass card radius 20px
- Icône néon en haut-gauche (cercle glow)
- Valeur Geist Mono tabulaire
- Mini-sparkline 7 jours sous-jacente très discrète
- Hover : élévation + glow néon de la couleur sémantique
- Aucune bordure dure, juste 1px white/[0.06]

### 4. Floating Tab Bar
- Sticky en bas du hero, glass `backdrop-blur-xl`
- Pills sans fond, label uniquement
- Indicateur actif : pastille mint à gauche du label + glow subtil
- Settings/Export en kebab à droite, intégrés à la barre

### 5. Refonte interne onglets
| Onglet | Refonte |
|--------|---------|
| Overview | Hero + 4 widgets + Forecast section (ex-Planner) en bas, glass cards |
| Budget | MonthlyBalanceHero gardé mais reskin glass, blocks income/expenses en grid aéré 2 col |
| Transactions | Liste épurée groupée par jour, icônes minimalistes catégorie, hover row → highlight glass + slide-in détails |
| Accounts | Grid de cards "Virtual Card" mini, total assets centré en hero secondaire |

---

## Détails techniques

### Fichiers à créer
- `src/components/finance/aura/AuraBackground.tsx`
- `src/components/finance/aura/AuraBalanceHero.tsx`
- `src/components/finance/aura/AuraWidget.tsx`
- `src/components/finance/aura/VirtualCard.tsx` — carte bancaire 3D
- `src/components/finance/aura/CashFlowCurve.tsx` — SVG Bezier animée
- `src/components/finance/aura/FloatingTabBar.tsx`
- `src/components/finance/aura/index.ts`

### Fichiers à éditer
- `src/pages/Finance.tsx` — remplace Hero + Ticker + Tabs par nouveau layout
- `src/components/finance/FinanceDashboard.tsx` — réorganise en widgets glass
- `src/components/finance/transactions/TransactionsTab.tsx` — liste groupée par jour, hover glass
- `src/components/finance/accounts/AccountCard.tsx` — reskin VirtualCard mini
- `src/components/finance/monthly/MonthlyBalanceHero.tsx` — reskin glass aéré
- `src/index.css` — keyframes `aura-orb-drift`, `aura-curve-draw`, `virtual-card-tilt`, classe `.aura-glass`
- `src/i18n/locales/{en,fr}.json` — clés AURA (Total Balance, Cash flow, etc.)

### Fichiers à retirer (cycle V3 obsolète)
- `FinanceVaultHero.tsx`, `FinanceTickerBar.tsx`, `VaultMeshBackground.tsx`, `widgets/BankCellCard.tsx` → supprimés et exports nettoyés dans `index.ts`

### Tokens design (CSS vars dans `index.css`)
```css
--aura-bg: 220 30% 6%;
--aura-glass-bg: 0 0% 100% / 0.03;
--aura-glass-border: 0 0% 100% / 0.08;
--aura-electric: 192 100% 50%;
--aura-mint: 158 100% 48%;
--aura-radius: 20px;
```

### Animations clés
- `aura-orb-drift` : translate + scale très lent (25s)
- `aura-curve-draw` : `stroke-dashoffset` 0 au mount (1.2s ease-out)
- `virtual-card-tilt` : transform 3D au hover (perspective + rotateY)
- Tous wrappés `motion-reduce:animate-none`

### Typographie
- Headers / labels : **Inter** (déjà dispo via Tailwind)
- Chiffres importants : **Geist Mono** ou fallback `font-mono tabular-nums`
- Garde Orbitron uniquement pour ModuleHeader si conservé, sinon retiré sur `/finance`

### Conservé intact
Tous les hooks (useFinance, useTransactions, useAccounts, useBudgets, useFinanceSettings), tous les widgets analytiques (CategoryDonut, SavingsRateRing, FinancialHealthScore, MonthComparisonWidget, CategoryTrendsChart, TopCategoriesBar), `AnimatedNumber`, logique validation mensuelle, ProjectionsPanel (intégré dans Overview/Forecast), Settings modal.

### Responsive
- Mobile : Hero stack vertical (Solde au-dessus, VirtualCard dessous), widgets en grid 2x2, FloatingTabBar pleine largeur en bas
- Desktop : Hero 2 colonnes, widgets 4 colonnes
