# Ranger par domaine

Le dépôt passe d'un rangement **par couche** (`pages/`, `components/`, `hooks/`,
`lib/`, `styles/`) à un rangement **par domaine**. C'est l'étape 2 du plan de
masse, et elle se fait **un domaine à la fois**, du plus petit au plus gros.

État : **étape 2 terminée**. Quatorze domaines, un socle, une racine de composition — le 28/08/2026.

*Quinze et non onze : l'agenda s'est scindé en deux (sixième domaine), les
souhaits aussi (huitième), un groupe de huit pages d'administration a été
découvert en chemin (dixième), et le profil s'est scindé en deux (onzième).*

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
l'autre.** Cinq hooks du dépôt portent « wishlist ». `hooks/useWishlist.ts` — le
nom générique, celui qu'on prend par défaut — lit **`shop_wishlist`**, pas
`wishlist_items` : ce sont les parures qu'on convoite, payables en bonds. Ses
trois appelants sont `WishlistButton`, `WishlistPanel` et `pages/Shop`.

| | table | ce que c'est |
|---|---|---|
| liste du pacte | `wishlist_items`, `wishlist_lists` | des choses réelles à acquérir, fabriquées depuis les pièces d'objectif |
| liste de boutique | `shop_wishlist` | des parures, payables en bonds |

**Elles ne partagent ni table, ni hook, ni composant — seulement un mot.** D'où
deux domaines, et une entrée de plus au glossaire. Vérifié à l'exécution :
`/wishlist` a fait 3 requêtes sur `wishlist_items`, 1 sur `wishlist_lists`, et
**zéro** sur `shop_wishlist`.

**Deuxième fois qu'un fichier reste dehors parce qu'il sert trop de monde.**
`lib/wishlistDepot.ts` porte le nom du domaine, mais ses cinq exports sont des
aides de stockage, le compartiment s'appelle `goal-images`, et
`hooks/useDepotImages` n'en prend qu'une constante — pour les souhaits *et* pour
les vidéos de la communauté. Le faire entrer rendrait la communauté dépendante
des souhaits. Même raisonnement que pour la devise chez la finance.

---

## Ce que le neuvième domaine a ajouté

**Ranger peut lever une ambiguïté sans rien renommer.** `hooks/useWishlist.ts`
portait le nom le plus court du dépôt pour le concept le moins central. Il vit
maintenant dans `domaines/boutique/hooks/` — même nom, plus aucun doute :
**l'adresse fait le travail que le nom ne faisait pas.**

Vérifié des deux côtés. `/wishlist` : `wishlist_items` 3, `shop_wishlist` **0**.
`/shop` : `shop_wishlist` 1, `wishlist_items` **0**.

**Une feuille globale n'est pas forcément partagée.** `shop.css` était chargée
par `main.tsx` comme `journal.css`. Mais elle ne déclare que **cinq classes**, et
la mesure dit que **rien hors de la boutique n'en cite une seule**. Elle sort
donc du paquet de démarrage : **−1 171 octets** de CSS critique, et
`premium-shimmer` quitte la feuille globale pour `Shop-B2midpXI.css` (1 281 o).

La leçon du journal n'était pas « les feuilles restent globales », c'était
« mesurer avant de conclure ». Deux feuilles, deux réponses opposées.

**Sixième fois le motif du type dans le composant — et cette fois l'ironie est
écrite dans le fichier.** `logique/appliquerFiltres.ts` s'ouvre sur « LE FILTRE
DE LA BOUTIQUE, SORTI DU FICHIER DE SON PANNEAU ». Quelqu'un avait déjà sorti la
**fonction** ; les **types** étaient restés derrière, et ils suffisaient à
maintenir la dépendance. Extraire une fonction sans ses types ne coupe rien.

**Un domaine que le plan n'avait pas vu.** `pages/AdminCosmeticsManager.tsx`
(812 lignes) gère les parures mais n'importe **rien** de la boutique : il parle à
la base directement, et vit avec **sept autres pages d'administration** plus
quatre composants. Ce groupe est un domaine à part entière ; on ne l'entame pas
par un bout.

---

## Ce que le dixième domaine a ajouté

**Une garde qui suit un chemin cesse de garder dès qu'on déménage — et son
silence ressemble au succès.** Deux fois le même jour :

- `verifier-i18n.mjs` ne cherchait les pages muettes que sous `src/pages/`. Les
  huit pages d'administration ont changé d'adresse, et le contrôle est passé
  **au vert** le jour même. Les vingt-trois chaînes anglaises en dur étaient
  toujours là.
- `verifier-cadence.mts` importait `../src/lib/finance/cadence.ts`. Le fichier
  est parti chez la finance ; le script échouait à l'import, et personne ne l'a
  su — il n'était pas dans la chaîne.

Les deux fois, le symptôme était **l'absence de signal**. D'où une sixième
garde, `npm run chemins:check` : tout chemin `src/…` cité littéralement dans
`scripts/` doit désigner quelque chose. Elle relève 58 chemins, et a été
éprouvée en remettant le chemin mort qu'elle venait de faire réparer.

**Un domaine peut être invisible au relevé parce qu'il est déjà rangé — mais
par audience.** L'administration ne portait aucun nom de module : huit pages,
quatre composants, quatre hooks, tous entre eux, dispersés dans `pages/`,
`components/admin/` et `hooks/`. Le relevé par mot-clé ne l'a jamais proposé ;
c'est en suivant `AdminCosmeticsManager` depuis la boutique qu'il est apparu.

**`AdminRoute` reste dans `app/`**, et c'est délibéré : il compose la coquille —
`AppSidebar`, `MobileBottomNav`, `ProtectedRoute` — et un domaine n'a pas à
importer la coquille. Il prend ses deux pièces par la porte, comme n'importe
quel autre lecteur.

**Un module, deux audiences, une porte.** `usePromoCodes` sert la boutique (on
consomme un code) et l'administration (on en crée). Le concept est commercial :
il vit chez la boutique, et l'administration passe par sa porte. C'est le
deuxième arc entre domaines du dépôt, après agenda → tâches.

---

## Ce que le onzième domaine a ajouté

**Une porte de vingt et un exports est un domaine qui en cache deux.** Le relevé
annonçait « profil, 55 fichiers ». En lisant sa porte, deux choses se séparaient
nettement : le **compte** (réglages, second facteur, portabilité, vie privée) et
les **succès** (compteurs, rangs, ordres du jour, panthéon). Ils ne partagent
qu'une table, `profiles`, que la moitié de l'application lit de toute façon.

**Un domaine transversal n'est pas un domaine mal borné.** La porte des succès
exporte **vingt-quatre** fonctions de comptage, appelées par onze fichiers de
six domaines. C'est sa fonction : un compteur de gestes écoute tout le monde. Ce
qui compte, c'est que la flèche aille toujours dans le même sens — les domaines
lui *parlent*, il ne les interroge jamais.

**Et je suis retombé dans le piège du premier domaine.** La porte exportait
`RanksCard` statiquement ; `AuthContext` importe la porte pour `trackLogin` ; le
paquet d'entrée est passé de 438 019 à **451 907 octets**.

La cause ne s'est pas devinée. J'ai construit le commit précédent, comparé les
deux entrées littéral par littéral, filtré le bruit des noms de morceaux
re-hachés — et compté les morceaux référencés : **339 → 326**. Treize morceaux
avaient été **absorbés** dans l'entrée : `alert-dialog`, `input`, `select`,
`switch`, `label`, `slider`, `textarea`, `scroll-area`, `progress`,
`console-ui` et sa feuille, deux icônes. Tous tirés par `RanksCard`, que
personne ne rend au démarrage.

Les trois composants sont passés derrière un `lazy` dans la porte, comme
`MiaConsole`. L'entrée est revenue à **438 575** — +556 octets sur l'état
d'avant, soit le coût de la porte elle-même.

**La leçon n'est pas « mettre les composants en `lazy` ».** C'est que *je l'avais
déjà écrite au premier domaine et que je l'ai quand même refaite* : la porte a
été écrite avant la mesure. L'ordre importe.

---

## Ce que le douzième domaine a ajouté

**Une trousse d'interface finit toujours dans le premier module qui en a eu
besoin.** `console-ui.tsx` vivait sous `components/profile/` et servait
**dix-neuf fichiers** — dont la santé, les succès et les mentions légales. Ce
n'est pas du profil : c'est le vocabulaire visuel des réglages — `Panneau`,
`Reglage`, `Segmente`, `Jauge`, `Bouton`, `Champ`, `Alerte`. Elle a rejoint
`components/ds/`, avec `settings-ui.tsx` et `reglages.css`.

**Un composant sans rendu ne tire aucun arbre.** `ProfilePreferencesSync` et
`AccentColorSync` s'installent dans `AppProviders` et synchronisent une
préférence : ils restent en export **statique**, contrairement aux trois
composants de la porte des succès qui ont dû passer en différé. La règle n'est
pas « les composants passent en `lazy` » — c'est « mesurer ce que l'export
traîne ».

**Et la garde a trouvé un emprunt légitime.** `/profile/health` est une page du
domaine santé qui vit dans la console de réglages du profil. La garde des
domaines l'a signalé dès que le domaine a existé, et la réponse n'était pas de
déplacer la page — c'était d'ouvrir la porte : `ConsoleReglages` s'exporte, la
santé l'emprunte. Vérifié à l'écran : la page rend dans la console, son rail
affiche les dix entrées, et la requête `health_settings` part.

---

## Ce que le treizième domaine a ajouté

**Mesurer le couplage peut dire « ne séparez pas ».** Le relevé comptait
guildes, alliés, communauté, classement et messagerie comme cinq modules. On a
mesuré avant de découper, comme pour l'agenda et les souhaits — et cette fois la
réponse est l'inverse :

| | | | |
|---|---|---|---|
| guildes → alliés | 2 fichiers | alliés → guildes | 3 fichiers |
| guildes → communauté | 5 fichiers | alliés → communauté | 1 fichier |

**Bidirectionnel et dense.** L'agenda lisait les tâches sans que les tâches
sachent qu'un calendrier existe ; ici les trois se citent mutuellement. Les
séparer aurait produit trois portes qui se renvoient la balle — ce qui n'est pas
une frontière, c'est un couloir.

Un seul domaine, donc : **58 fichiers, 14 854 lignes, et une porte de sept
exports.** Ce n'est pas une contradiction : ce qui se passe entre deux personnes
ne concerne que les écrans qui montrent deux personnes. Le reste de
l'application n'en veut que des **compteurs** — trois pastilles et la liste des
témoins possibles.

**La garde des domaines gagne un mécanisme de tolérance**, avec la même
discipline que celle des couches : chaque entrée porte sa raison, et une
tolérance qui ne sert plus fait échouer le script. Éprouvée sur une entrée
bidon.

Sa première et unique entrée : `AdminNotifications` importe `inbox.css`. En
regardant pourquoi, on trouve une **duplication assumée** — la page réécrit à la
main le balisage d'`AvisCarte` pour que l'aperçu soit fidèle, et son propre
commentaire le dit : *« un aperçu qui ne ressemble pas au résultat ne sert qu'à
rassurer »*. Dix classes `bx-avis-*` doivent monter dans `ds/`, ou l'aperçu doit
rendre le composant. C'est une décision de conception, pas un déplacement de
fichier : elle attend l'étape 4.

---

## Ce que le quatorzième domaine a ajouté

**Le motif du type dans le hook, pour la huitième fois — et la plus chère.**
`Goal` était déclaré dans `hooks/useGoals.ts`, `Pact` dans `hooks/usePact.ts`.
Ce n'était plus une couche interne qui remontait : **cinq domaines** dépendaient
d'un hook React pour connaître la forme d'un objectif — la finance pour compter
les pièces, les souhaits pour la synchronisation, les succès pour l'expérience,
le social pour choisir un objectif à partager, le profil pour la carte
d'identité. Les deux types sont descendus dans `types.ts` ; les hooks les
réexportent ; la porte les expose. `useGoals` maigrit de 35 lignes, `usePact` de
12.

**Une porte écrite sur un relevé périmé est une porte trouée.** J'avais écrit
l'index d'après le relevé fait *avant* le déplacement — un relevé qui ne pouvait
pas voir quatre appels, parce que les trois domaines qui les font n'existaient
pas encore quand il a été pris. La garde les a trouvés tous les quatre :
`useResetPact`, `usePactMutation`, `useCarteObjectif`, `PactSelectorModal`.

**Et le coût est dit, pas caché.** Le paquet d'entrée gagne **197 octets** :
`prefetchData` importe la porte, et les trois petits hooks qu'elle vient
d'exporter deviennent joignables statiquement. Vérifié : aucune page, aucun
composant n'est entré — les sept morceaux de pages sont intacts. C'est le prix
d'une frontière correcte, et il se mesure.

**Deux faux amis de plus, dans les deux sens.** `components/front/FrontListe.tsx`
est entré malgré son dossier : son en-tête dit « la quatrième vue de la page
Goals », et son seul lecteur est `GoalsList` — un dossier `front/` pour un seul
fichier n'était pas un module. `components/analytics/GoalContrats.tsx` est resté
dehors malgré son nom : il vit avec trois autres composants d'analytique, un
domaine que le plan n'a toujours pas rangé.

---

## Le socle, et ce qu'il a révélé

**Le socle n'est pas « ce qui reste ».** Ce qui restait hors des domaines, c'était
164 fichiers — du socle *plus* trois ou quatre modules jamais rangés. Le critère
mesurable : **combien de domaines appellent ce fichier ?**

| domaines lecteurs | fichiers | verdict |
|---|---|---|
| 14 | 1 (`AuthContext`) | socle, sans discussion |
| 3 à 12 | 27 | socle |
| 2 | 9 | socle |
| 1 | 32 | appartient à **ce** domaine |
| 0 | 88 | soit socle pur, soit un module non rangé |

79 fichiers ont rejoint `src/socle/` — `ui/`, `ds/`, `contextes/`, `i18n/`,
`supabase/`, `outils/`, `hooks/` — et 22 des 32 « un seul domaine » sont rentrés
chez eux.

**Le critère « un seul domaine » est nécessaire, pas suffisant.** Cinq fichiers
que la mesure envoyait dans un domaine étaient aussi lus par `app/` ou par des
modules non rangés : `chromeFlottant`, `encrePapier`, `erreurs`, `useFeatureFlag`,
`useSocialFeatures`. Ils sont du socle. Un fichier n'appartient à un domaine que
si **ce domaine est son seul lecteur, tous lecteurs confondus**.

**La règle du socle guardait le vide — et dès qu'elle a eu quelque chose à
garder, elle a trouvé deux violations.**

`socle/contextes/AuthContext.tsx` appelait `trackLogin` et
`initializeAchievementTracking` du domaine succès. Quatorze domaines importent ce
contexte : lui faire connaître un domaine, c'est le faire cesser d'être le socle.
Il **annonce** désormais la connexion par un `CustomEvent`, et `App.tsx` — qui a
le droit de tout connaître — écoute et compte. Même idiome que `OUVRIR_MIA`
ailleurs dans l'application.

`socle/hooks/useParticleEffect.tsx` lisait `useProfileSettings` à travers la
porte du profil. Le hook des préférences d'affichage a quatre lecteurs hors
profil : il est parti au socle.

**Et deux gardes ont perdu leurs chemins, encore.** Le cliquet de taille ne
reconnaissait plus le schéma généré — le compte a sauté de 97 000 à 103 015
lignes. `verifier-langue` a planté sur `src/integrations/supabase/types.ts`. Mais
cette fois **`chemins:check`, écrite le matin même pour cette classe de bogue, a
nommé le troisième cas avant qu'il ne morde** : `tableau-de-bord/collecte.mjs`.

**Le build a rattrapé ce que le compilateur avait laissé passer.** `main.tsx`
portait deux imports relatifs *à effet de bord* — `import "./lib/renommageLocal"`
— sans binding, donc sans erreur de type, mais impossibles à résoudre au
bundling. Troisième fois de la série que les imports relatifs mordent, et la
première où le typecheck ne suffit pas. **Le build fait partie de la
vérification, pas de la livraison.**

*(J'ai d'ailleurs déployé une fois le `dist/` périmé en lisant ses octets après
un build échoué. La leçon tient en une ligne : lire le code de retour du build
avant de lire son résultat.)*

**Une dette est née et elle est nommée.** `console-ui` est devenu partagé par
quatre domaines ; Vite remonte le CSS des morceaux partagés dans la feuille
d'entrée, et `reglages.css` (681 lignes, 117 sélecteurs `.rg-`) y a atterri —
environ 18 Ko de CSS critique. C'est écrit en tête du fichier concerné, et c'est
du ressort de l'étape 4, qui a les captures d'écran pour instrument.

---

## Les six derniers domaines, et la fin des tas

Le relevé ci-dessus annonçait « trois ou quatre domaines que le plan n'avait pas
vus ». Il y en avait **six**, et deux ne sont apparus qu'en comptant les
appelants de ce qui restait :

| | fichiers | porte | ce qui a tranché |
|---|---|---|---|
| **analytique** | 9 | vide | lit tous les autres, lue par personne |
| **appel** | 3 | vide | rituel quotidien, entrée par la route seule |
| **accueil** | 14 | vide | affiche un morceau de chaque module |
| **authentification** | 7 | vide | le sas ; la session vit dans le socle |
| **revue** | 3 | `WeeklyReviewModal` | possède `weekly_reviews`, que personne d'autre ne touche |
| **onboarding** | 1 | vide | possède `user_values`, la seule table sans autre lecteur |
| **mentions-légales** | 4 | vide | du texte qui doit rester exact, avec son test |

**Cinq portes vides sur sept.** Ce n'est pas un échec du découpage, c'est sa
mesure : un domaine qui n'expose rien est un domaine que personne ne peut
contourner. On n'y entre que par sa route.

### La règle qui a placé le résidu

Onze fichiers traînaient dans `components/` et `hooks/` sans domaine évident. La
règle appliquée n'est pas « où est-ce que ça a l'air d'aller » mais **où sont
ses appelants** :

| | appelants | verdict |
|---|---|---|
| `AppProviders`, `ErrorBoundary` | App.tsx | `app/` |
| `CommandPalette`, `ShortcutHelpOverlay` | `app/` | `app/` |
| `SoundSettingsSync`, `useRechercheBarre` | `app/` | `app/` |
| `NotFound` + sa feuille | la route attrape-tout | `app/` |
| `ParticleEffect` | `socle/hooks/useParticleEffect` | socle |
| `DynamicLucideIcon` | la page Achievements, seule | **succès** |
| `HabitHeatmap` | `DossierVolets`, seul | **objectifs** |

Les deux derniers contredisent le plan, qui les envoyait au socle parce qu'ils
sont *génériques*. Générique ne veut pas dire partagé. Un composant à un seul
appelant vit chez lui ; s'il en gagne un second dans un autre domaine, il monte
au socle **à ce moment-là**.

Une seule exception, et elle est explicite : la revue a un appelant unique
(`pages/Home`) et reste un domaine, **parce qu'elle possède une table**. Une
donnée dont un seul module connaît la forme ne se dissout pas dans la page qui
l'affiche aujourd'hui.

À la fin, `src/` ne contient plus que `app/`, `domaines/`, `socle/`, `styles/`
(les feuilles globales de l'étape 4), `tests/`, `assets/`, et les trois fichiers
racine. `components/`, `hooks/`, `pages/`, `content/`, `lib/`, `contexts/`,
`types/`, `integrations/` ont disparu.

---

## Trois fois où la mesure a contredit le nom

Ranger sur la foi d'un nom de fichier s'est trompé trois fois dans ce lot. À
chaque fois, le comptage a donné l'inverse :

**`singularity.css`.** 615 lignes, chargée globalement, et « singularité » est
une phase de The Call. On s'apprêtait à la faire descendre dans ce domaine. Le
comptage de ses trente classes dit que **l'Appel n'en utilise aucune** : neuf
vont à la bannière de l'accueil, dix au fond stellaire, six au cœur de rang des
succès, et `.singularity-nebula` ne sert à personne.

**`SpaceBackdrop`.** La carte des imports voyait un seul appelant extérieur à
l'accueil. La garde des domaines en a trouvé trois de plus au premier passage —
Analytics, Goals, GoalsGraph. Un fond partagé par quatre pages de trois domaines
n'appartient à aucun : il est parti au socle, **hors du baril**, comme
`Telemetrie` — un composant qu'on met dans le baril, tout le monde le traîne.

**`GoalContrats`.** Il porte le nom des objectifs et il est rendu par la seule
page Analytics, où il compte les contrats sans les gérer. Il est dans
l'analytique.

Un outil qui ne sert qu'à confirmer ce qu'on croit déjà ne sert à rien.

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
| domaines rangés | 0 / 15 | **15 / 15** |
| dossiers pour toucher à M.I.A. | 4 | **1** |
| dossiers pour toucher à la santé | 5 | **1** |
| inversions tolérées (dépôt entier) | 25 fichiers | **11** |
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

## Ce qui reste

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
| ✔ | **boutique** | 34 |
| ✔ | **administration** | 18 |
| ✔ | **succès** | 14 |
| ✔ | **profil** | 38 |
| ✔ | **social** | 58 |
| ✔ | **objectifs** | 66 |
| ✔ | **socle** | 79 |
| ✔ | **analytique** | 9 |
| ✔ | **appel** | 3 |
| ✔ | **accueil** | 14 |
| ✔ | **authentification** | 7 |
| ✔ | **revue** | 3 |
| ✔ | **onboarding** | 1 |
| ✔ | **mentions-légales** | 4 |

Les comptes annoncés au relevé du 28/08 se révèlent souvent trop larges : ils
étaient faits sur le nom des fichiers, et **trois domaines sur treize** se sont
scindés une fois le couplage mesuré — pendant qu'un quatorzième, l'administration,
apparaissait là où le relevé ne voyait rien.

Chaque domaine est un commit qui se révoque seul.

---

## L'étape 2 est close

| | avant étape 2 | à la fin |
|---|---|---|
| domaines rangés | 0 | **21** |
| dossiers à la racine de `src/` | 12 | **6** |
| inversions tolérées | 25 fichiers | **8** |
| gardes | 3 | **7** |
| paquet d'entrée (JS) | 437 945 o | 438 907 o |
| feuille d'entrée (CSS) | — | −5 987 o au dernier commit |

Le paquet d'entrée a bougé de **962 octets** — 0,2 % — sur vingt et un domaines
rangés. Trois de ces commits l'ont laissé *bit à bit identique* : le déploiement
de l'Appel a répondu « no updated asset files to upload », c'est-à-dire que
toutes les empreintes de contenu correspondaient déjà à ce qui était en ligne.
Ranger n'est pas censé se voir à l'exécution ; c'est la seule preuve qui vaille
qu'on n'a rien cassé.

Ce qui reste, et qui n'est pas de l'étape 2 :

- **étape 3** — les 8 inversions tolérées, dont 4 de la même famille (la logique
  de M.I.A. appelle `useEtatDuJour` au lieu de le recevoir) ;
- **étape 4** — les feuilles globales de `main.tsx`, dont `singularity.css` à
  couper en trois et `reglages.css` (≈18 Ko) tombée dans le chemin critique ;
- **étape 5** — les 55 fichiers au-dessus de 400 lignes, tenus par le cliquet.
