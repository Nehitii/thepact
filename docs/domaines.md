# Ranger par domaine

Le dépôt passe d'un rangement **par couche** (`pages/`, `components/`, `hooks/`,
`lib/`, `styles/`) à un rangement **par domaine**. C'est l'étape 2 du plan de
masse, et elle se fait **un domaine à la fois**, du plus petit au plus gros.

État : **8 domaines sur 13**. M.I.A., santé, journal, focus, finance, tâches, agenda et souhaits, le 28/08/2026.

*Treize et non onze : l’agenda s’est scindé en deux (sixième domaine), et les souhaits aussi (huitième).*

---

## La forme d'un domaine

```
src/domaines/<nom>/
  index.ts          ← la porte : tout ce que le dehors connaît
  composants/
  hooks/
  logique/
  pages/
  <nom>.css
```

Et, à côté, la racine de composition :

```
src/app/
  AppLayout  AppSidebar  MobileBottomNav  RechercheBarre
  AdminRoute  ProtectedRoute
  prefetchRoutes.ts  prefetchData.ts
```

`app/` est **au-dessus de tout** : c'est le seul endroit qui a le droit de
connaître les pages de tous les domaines, parce que router, c'est
exactement ça. Le reste de l'application ne connaît que des portes.

Deux règles, vérifiées par `npm run domaines:check` :

- **Depuis un autre domaine, on n'importe que `@/domaines/<nom>`.** Ce qu'un
  domaine veut offrir, il le réexporte depuis son index ; le reste lui
  appartient et personne d'autre n'a à le connaître.
- **`socle/` ne nomme aucun domaine.** Le socle est ce qui sert à tous ; s'il en
  nomme un, il n'est plus le socle.

Et `npm run couches:check` rejoue l'échelle **à l'intérieur** du domaine :
`logique/` (rang 1) < `hooks/` (4) < `composants/` (5) < `index` (6). Ranger par
domaine ne doit pas revenir à tout mettre au même rang — la logique n'a pas plus
le droit d'appeler un composant parce qu'il est devenu voisin.

---

## La procédure, telle qu'elle a marché

1. **Relever le périmètre**, puis le vérifier sur les imports. Le nom ne suffit
   pas : `lib/brigade.ts` contenait « brigade » et semblait M.I.A., mais c'est la
   limite d'encours des objectifs — appelée par `useGoalFilters` et
   `pages/Goals`. Elle reste dehors. À l'inverse `hooks/useEtatDuJour.ts` ne
   portait pas le nom, et ses **six seuls appelants** étaient tous M.I.A. : il
   entre.
2. **`git mv`** chaque fichier — l'historique suit le renommage.
3. **Réécrire les imports `@/`** par script.
4. **Écrire la porte**, en n'exportant que ce que le dehors appelait vraiment.
5. **`npm run verifier`**, puis `npm run build`, puis ouvrir l'écran.

---

## Les trois pièges rencontrés sur le premier domaine

**Le `lazy` doit déménager dans la porte.** `MiaConsole` fait 979 lignes et
`AppLayout` la chargeait déjà en différé. Une porte qui la réexporte normalement
la ramène dans le paquet de démarrage au premier
`import { ReseauMia } from "@/domaines/mia"` — fermer le domaine aurait coûté
979 lignes de chemin critique. Le `lazy` vit donc dans `index.ts` : **le domaine
possède son propre découpage**, ce qui est sa place.

**Les imports relatifs échappent à la réécriture.** Le script ne visait que les
chemins `@/`. Six imports `./miaReflexes`, `./miaPossibles`,
`./preferencesAffichage` sont restés cassés — et c'est `npm run typecheck` qui
les a trouvés, pas moi. Ne jamais conclure un déplacement sans le compilateur.

**Un renommage peut cacher une croissance.** Le cliquet de taille perd la trace
d'un fichier renommé ; on rebase, et trois lignes de plus passent inaperçues.
Comparer la version *commitée* de l'ancien chemin au fichier actuel : sur M.I.A.,
quatorze fichiers sur quinze étaient identiques à la ligne près, et le
quinzième — `VisageMia.tsx` −19, `visages.ts` +28 — s'expliquait entièrement par
le type déplacé.

---

## Ce que le deuxième domaine a ajouté à la procédure

**Les pages ne passent pas par la porte.** `app/prefetchRoutes.ts` charge chaque
route en différé ; les faire transiter par l'index les ramènerait toutes dans le
paquet de démarrage. La garde des domaines connaît donc une dérogation, et elle
est **double** : seul `app/`, et seulement en import **différé**. Un import
statique d'une page depuis `app/` défairait le découpage de toute façon, et
reste refusé.

**Une porte se remplit de ce que le dehors demande, pas de ce qu'on imagine.**
J'avais mis `EnTeteDossier` dans l'index de santé, par analogie avec un relevé
qui l'avait classé « objectifs + santé ». Le compilateur a rappelé que son seul
appelant est `pages/Health`, donc l'intérieur. Trois exports suffisent :
`fetchTodayHealth`, `useHealthHistory`, `usePoulsDuJour` — sur onze fonctions
exportées par `useHealth.ts`.

**Créer `app/` oblige à y mettre la coquille.** Une fois `prefetchRoutes` monté
au rang le plus haut, `AppLayout` et `AppSidebar` qui l'importent devenaient des
inversions `composants → app`. Elles n'en sont pas : ces fichiers *sont* la
coquille de l'application, pas des composants réutilisables. Ils rejoignent
`app/`, et les trois inversions disparaissent au lieu d'être tolérées.
`ModuleHeader`, lui, reste dans `components/layout/` — il est réexporté par le
système de design. *(Le domaine suivant a montré qu'il était mort : il a été
supprimé le jour même. Voir plus bas.)*

**Un fichier peut porter le nom d'un domaine sans en être.**
`components/habits/HabitHeatmap.tsx` semblait relever de la santé. Il n'importe
rien de santé : c'est une carte de chaleur générique, appelée par le dossier
d'objectif. Il reste dehors. Le critère n'est jamais le nom — c'est ce que le
fichier importe et qui l'appelle.

---

## Ce que le troisième domaine a ajouté

**Une porte peut être vide, et c'est une information.** Rien, dans le reste de
l'application, n'appelle le journal — ni l'éditeur, ni les entrées, ni les
familles de questions. La seule chose que le dehors demande est la *page*, et
les pages ne passent pas par la porte. Un `index.ts` vide vaut mieux que pas de
fichier : il dit que la question a été posée.

**Un fichier peut porter le nom du domaine et n'y être pour rien — deux fois.**

`lib/journalSecurite.ts` est le journal de **connexions** (`security_events`),
lu par les écrans de compte et de MFA. Aucun rapport avec le journal intime.

`components/journal/JournalDecorations.tsx` exportait cinq composants que le
journal **n'importait pas**. Son unique lecteur était `DSPageHeader`, qui n'en
prenait que deux ; les trois autres n'avaient aucune référence dans le dépôt.

**Une feuille de style peut porter le nom du domaine et tenir toute l'app.**
`journal.css` déclare 119 classes, dont 113 en `jr-`/`journal-` — mais les six
autres sont `font-orbitron` (citée par **64 fichiers**), le fond du système de
design, et deux animations. C'est pourquoi `main.tsx` la charge globalement
alors que finance, analytics et goals sont co-localisées avec leur page. Elle
**n'est pas entrée dans le domaine** : la déplacer telle quelle casserait la
typographie de 64 fichiers. Le partage revient à l'étape 4, qui a les captures
d'écran comme instrument.

**Et le fil a mené à du code mort.** En sortant les deux décorations vivantes
vers `ds/`, j'ai voulu vérifier que l'anneau tournait encore : il n'apparaissait
dans **aucun morceau du build**. `DSPageHeader` n'est rendu que par
`ModuleHeader`, marqué `@deprecated` et rendu nulle part. `GoalsHeader` dit le
remplacer ; `Home` dit s'en passer volontairement. L'élagueur les avait déjà
vus. Trois fichiers supprimés — dont les décorations que je venais d'extraire
pour un lecteur mort.

---

## Ce que le quatrième domaine a ajouté

**Un domaine peut avoir deux index sans se contredire**, tant que l'un regarde
dedans et l'autre dehors. `composants/index.ts` réexporte les douze composants
que `pages/Focus` importe d'un coup : c'est un confort interne, il existait déjà
avant le rangement. `index.ts` à la racine du domaine est la porte, et elle
n'exporte **qu'une fonction** — `fetchFocusSessions`, appelée par
`app/prefetchData`.

**Un type défini dans une page est une inversion en attente.** `FocusToolbar`
allait chercher `ObjetClause` dans `pages/Focus` : la dernière inversion
`composants → pages` du dépôt. Le type est descendu dans
`domaines/focus/types.ts`, la page le réexporte, et l'inversion disparaît. Même
geste que `ExpressionMia` sur le premier domaine — c'est un motif, pas un
accident.

**La preuve la plus forte de la séance : le paquet d'entrée a gardé le même
hachage.** Pas la même taille — le même fichier, `index-D--UZ_2i.js`. Les
chemins d'import disparaissent au bundling, donc un domaine déjà entièrement
chargé en différé se range sans toucher au chemin critique. Quand le hachage
change alors qu'on n'a fait que déplacer, c'est qu'on a déplacé plus que prévu.

---

## Ce que le cinquième domaine a ajouté

**Ce qui porte l'odeur d'un domaine ne lui appartient pas toujours.**
`lib/currency.ts` et `contexts/CurrencyContext.tsx` sentent la finance — mais
ils servent **seize fichiers ailleurs** : les objectifs, les souhaits,
l'analytique, le profil, et `AppProviders` qui monte le contexte pour toute
l'application. Une devise n'appartient pas au module qui compte l'argent ; elle
appartient à tout ce qui affiche un prix. Ils resteront au socle.

C'est la première fois qu'un fichier est laissé dehors **parce qu'il sert trop
de monde**, et non parce qu'il fait autre chose.

**Deux fonds de page vivaient chez ceux qui ne les lisaient pas.**
`AuraBackground` s'appelait « AURA Neo-Banking » et vivait sous
`components/finance/aura/` ; `CyberBackground` vivait à la racine des
composants. Leur **unique** lecteur, à tous les deux, était
`components/ds/DSBackground`. Ils l'ont rejoint, et la tolérance
`ds → composants` a disparu en entier.

**Une interface déclarée au milieu des données tire un fichier de types vers le
haut.** `FinanceCategory` était dans `logique/categories.ts`, entre les icônes
Lucide et les vingt catégories de dépense ; `types.ts` allait la chercher par un
`import(…)` inline. Un fichier de **types** qui dépend d'un fichier de
**données** : la garde l'a vu dès que le domaine s'est refermé. L'interface est
descendue, `categories.ts` la réexporte.

Troisième domaine d'affilée où le geste est le même — `ExpressionMia`,
`ObjetClause`, `FinanceCategory`. **Un type déclaré là où il sert d'abord finit
toujours par tirer sa couche derrière lui.**

**Et les deux feuilles de style arrivent déjà fusionnées.** `finance.css` (316 l)
et `finance-cyber.css` (3 159 l) sont chargées ensemble par la page, et Vite les
émet en **un seul** morceau, `Finance-q5Qyx5KF.css`. L'étape 4 aura donc moins à
faire qu'annoncé : la fusion est cosmétique côté source, pas côté réseau.

---

## Ce que le sixième domaine a ajouté

**Un domaine annoncé peut en cacher deux.** Le plan comptait « agenda,
43 fichiers » — calendrier et tâches ensemble. Avant de bouger, j'ai mesuré le
couplage dans les deux sens :

| | |
|---|---|
| calendrier → tâches | `useCalendarEvents` interroge `todo_tasks`, importe `TodoTaskType` et `natureDe` ; `calendar/sources.ts` importe `natureDe` |
| tâches → calendrier | l'icône `Calendar` de lucide, et le `calendar` de shadcn |

**Une flèche, pas deux.** Ce sont donc deux domaines, et non un de quarante-trois
fichiers. Le plan passe de onze à douze.

**La première vraie flèche entre deux domaines passe par la porte.**
`@/domaines/taches` exporte quatre choses, dont trois pour le calendrier :
`useTodoList`, `natureDe`, `estRendezVous`. C'est le premier cas où la garde des
domaines garde autre chose que le vide.

**Quatrième fois le même motif — donc on le traite en entier.** `natures.ts` et
`valeursTache.ts` importaient des types depuis `useTodoList`. Après
`ExpressionMia`, `ObjetClause` et `FinanceCategory`, ce ne sont plus les deux
types gênants qui descendent : **les neuf** types du domaine passent dans
`types.ts`, et le hook les réexporte. Il maigrit de 62 lignes.

**Deux faux amis de plus, tous deux sur le mot.** `usePointages` — « pointage »
évoque une liste à cocher ; c'est une ligne par prélèvement constaté, appelée
par le parcours du mois et la page souhaits. Parti chez la finance.
`useDailyQuests` / `DailyQuestsPanel` — les ordres du jour lisent `daily_quests`
avec saison, statut et récompense en bonds : c'est de la gamification, pas une
liste de tâches. Ils partiront avec le profil.

---

## Ce que le septième domaine a ajouté

**La porte d'un autre domaine n'est pas une couche, c'est une frontière — et ce
n'est pas la garde des couches qui en juge.** `useCalendarEvents` (un hook,
rang 4) importe `@/domaines/taches` (rang 5 via la règle générique) : vu comme un
rang, c'est une inversion. Vu comme ce que c'est, c'est une dépendance externe,
au même titre qu'une bibliothèque. La garde des couches ignore désormais les
imports de porte ; `domaines:check` vérifie déjà qu'on passe par la porte et non
par la fenêtre. **Deux gardes, deux questions, et aucune ne répond à la place de
l'autre.**

Éprouvé sur quatre cas : la porte d'autrui passe, une entrée par la fenêtre est
refusée *par l'autre garde*, une inversion interne reste vue, et sa propre porte
importée depuis l'intérieur reste vue aussi — c'est un risque de cycle.

**Un `git checkout` sur un fichier `git mv` restaure la version de l'index, pas
la version courante.** En nettoyant deux cas de test j'ai ramené `sources.ts` et
`temps.ts` à leur état d'avant la réécriture des imports. Le compilateur l'a vu ;
sans lui, deux fichiers seraient partis avec des chemins morts.

**Cinquième fois le motif du type dans le hook** — `CalendarSourceType` et trois
autres. Cette fois on est allé jusqu'au bout : les quatre types descendent dans
`types.ts`, **et les quatorze composants qui les prenaient via le hook** sont
rebranchés dessus. Extraire un type sans rebrancher ses lecteurs, c'est déplacer
le problème d'un fichier.

**La preuve la plus nette du rangement :** le morceau `Calendar-LeAFYdZN.js`
garde **exactement le même hachage** qu'avant le déplacement. Vingt-deux fichiers
ont changé d'adresse et le code émis est le même fichier, à l'octet près.

---

## Ce que le huitième domaine a ajouté

**Deux listes de souhaits, et le hook au nom le plus court est celui de
l’autre.** Cinq hooks du dépôt portent « wishlist ».  — le
nom générique, celui qu’on prend par défaut — lit ****, pas
 : ce sont les parures qu’on convoite, payables en bonds. Ses
trois appelants sont ,  et .

| | table | ce que c’est |
|---|---|---|
| liste du pacte | ,  | des choses réelles à acquérir, fabriquées depuis les pièces d’objectif |
| liste de boutique |  | des parures, payables en bonds |

**Elles ne partagent ni table, ni hook, ni composant — seulement un mot.** D’où
deux domaines, et une entrée de plus au glossaire. Vérifié à l’exécution :
 a fait 3 requêtes sur , 1 sur , et
**zéro** sur .

**Deuxième fois qu’un fichier reste dehors parce qu’il sert trop de monde.**
 porte le nom du domaine, mais ses cinq exports sont des
aides de stockage, le compartiment s’appelle , et
 n’en prend qu’une constante — pour les souhaits *et*
pour les vidéos de la communauté. Le faire entrer rendrait la communauté
dépendante des souhaits. Même raisonnement que pour la devise chez la finance.
---

## Ce que le déplacement a réglé au passage

Six inversions de dépendance sont mortes sans qu'on écrive une ligne de logique.
Elles disaient toutes la même chose :

> `import type { ExpressionMia } from "@/components/mia/VisageMia"`

Six fichiers de logique pure importaient un composant React **pour un type**. Le
domaine une fois refermé, la garde a signalé les six d'un coup, et le type est
descendu dans `logique/visages.ts` — le fichier qui parle déjà des visages, et
d'où il n'aurait jamais dû partir. `VisageMia` le réexporte, pour ne casser
aucun appelant.

Restent quatre inversions dans ce domaine, toutes de la même famille : la
logique appelle `useEtatDuJour`, un hook React. C'est un vrai défaut de
conception — la logique doit **recevoir** l'état, pas aller le chercher — et il
est traité à l'étape 3, pas ici.

---

## Le compte

| | avant étape 2 | après 2 domaines |
|---|---|---|
| domaines rangés | 0 / 13 | **8 / 13** |
| dossiers pour toucher à M.I.A. | 4 | **1** |
| dossiers pour toucher à la santé | 5 | **1** |
| inversions tolérées (dépôt entier) | 25 fichiers | **15** |
| paquet d'entrée | 437 945 o | **437 988 o** |

Le paquet d'entrée n'a pas bougé entre le domaine 1 et le domaine 2 — à l'octet
près. Chaque page garde son morceau : `Health` 21 935 o, `HealthSettings`
4 512 o, `MiaConsole` 192 943 o, plus une feuille de style par domaine —
`Health--1gw70OZ.css` porte 146 règles, préfixe `.hlt`, et s'applique bien
depuis sa nouvelle place.

Et vingt-deux inversions sont mortes d'un seul déplacement, celui de
`prefetchRoutes.ts` vers `app/` : elles disaient toutes « `lib/` pointe vers
`pages/` », ce qui était vrai, et ce qui cesse d'être une inversion une fois le
fichier à sa place.

---

## Les cinq domaines restants, dans l'ordre

Du moins cher au plus cher, pour que chaque erreur coûte le moins possible :

| | domaine | fichiers |
|---|---|---|
| ✔ | **mia** | 15 |
| ✔ | **santé** | 15 |
| ✔ | **journal** | 12 |
| ✔ | **focus** | 19 |
| ✔ | **finance** | 33 |
| ✔ | **tâches** | 18 |
| ✔ | **agenda** | 22 |
| ✔ | **souhaits** | 17 |
| 9 | boutique | ~32 |
| 10 | profil | ~55 |
| 11 | guildes | ~57 |
| 12 | objectifs | ~60 |
| 13 | socle | ~61 |

Les comptes annoncés au relevé du 28/08 se révèlent souvent trop larges : ils
étaient faits sur le nom des fichiers, et deux domaines sur huit se sont
scindés une fois le couplage mesuré. Ce qui reste est donc une estimation, pas
un engagement.

Chaque domaine est un commit qui se révoque seul.
