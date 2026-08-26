import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, type PanInfo } from "framer-motion";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  BarChart3, Bell, BookOpen, CalendarDays, Database, Focus, GripVertical,
  Heart, Home, Inbox, Keyboard, ListTodo, Medal, Search, Settings, Share2,
  Shield, ShoppingBag, ShoppingCart, Sparkles, Swords, Target, Trophy,
  User, UserCircle, Users, Volume2, Wallet, Zap,
} from "lucide-react";
import { SHORTCUT_HELP_EVENT } from "@/components/ShortcutHelpOverlay";
import { PREF } from "@/lib/preferencesAffichage";
import { useChromeFlottant } from "@/lib/chromeFlottant";

/**
 * LA BARRE ⌘K.
 *
 * ═══════════════════════════════════════════════════════════════
 * CE QUI A ÉTÉ REPRIS, ET POURQUOI.
 *
 * ELLE FORÇAIT LE THÈME SOMBRE SUR ELLE-MÊME. La classe « dark » était
 * écrite en dur dans son className, avec un fond « #03060A » à 85 %. Sur
 * du papier, une pastille presque noire flottait donc au-dessus de la
 * page — le seul élément de l'application qui refusait le thème. Elle
 * prend maintenant ses couleurs aux jetons, comme tout le reste.
 *
 * ELLE IGNORAIT DOUZE PAGES. Analytics, le calendrier, Focus, les amis,
 * le classement, le panthéon, les revues, le graphe des objectifs et
 * quatre écrans de réglages étaient absents. Une palette de commandes
 * qui ne connaît pas la moitié des pages fait perdre plus de temps
 * qu'elle n'en gagne : on la ferme pour aller cliquer.
 *
 * ELLE ÉTAIT EN ANGLAIS — « Home », « Modules », « No signals found »,
 * « Search or jump to… » — dans une application entièrement française.
 * Le crochet de traduction était importé, et jamais appelé.
 *
 * SA POSITION NE TENAIT PAS. On la déplaçait, on rechargeait, elle
 * revenait. Déplacer un objet qui refuse de rester déplacé est une
 * promesse non tenue.
 *
 * ET ON PEUT LA RETIRER. Le réglage est dans Affichage & son, avec la
 * vignette de M.I.A : ce sont les deux seuls objets qui ne quittent
 * jamais l'écran. CACHER LA BARRE NE DÉSARME PAS ⌘K — ce qu'on retire
 * est un bouton, pas une fonction, et celui qui le retire est
 * précisément celui qui connaît le raccourci.
 * ═══════════════════════════════════════════════════════════════
 */

interface Entree {
  /** Clé de traduction, avec un repli français. */
  cle: string;
  repli: string;
  icone: React.ElementType;
  route: string;
  groupe: string;
  /** Mots supplémentaires pour la recherche, écrits sans accents. */
  mots?: string;
  action?: "aide-raccourcis" | "ouvrir-mia";
}

const ENTREES: Entree[] = [
  /* ── Les pages ── */
  { cle: "nav.home", repli: "Tableau de bord", icone: Home, route: "/", groupe: "pages", mots: "accueil dashboard apercu" },
  { cle: "nav.analytics", repli: "Statistiques", icone: BarChart3, route: "/analytics", groupe: "pages", mots: "analytics graphes courbes mesures" },
  { cle: "nav.goals", repli: "Objectifs", icone: Target, route: "/goals", groupe: "pages", mots: "goals buts pacte constellations" },
  { cle: "nav.calendar", repli: "Calendrier", icone: CalendarDays, route: "/calendar", groupe: "pages", mots: "calendar agenda mois planning" },
  { cle: "nav.focus", repli: "Focus", icone: Focus, route: "/focus", groupe: "pages", mots: "concentration pomodoro minuteur" },
  { cle: "nav.todo", repli: "Liste de tâches", icone: ListTodo, route: "/todo", groupe: "pages", mots: "todo taches a faire" },
  { cle: "nav.theCall", repli: "The Call", icone: Zap, route: "/the-call", groupe: "pages", mots: "appel pointage rituel quotidien" },

  /* ── Les modules de vie ── */
  { cle: "nav.journal", repli: "Journal", icone: BookOpen, route: "/journal", groupe: "modules", mots: "diary entrees ecriture chronologie" },
  { cle: "nav.finance", repli: "Finance", icone: Wallet, route: "/finance", groupe: "modules", mots: "budget argent depenses revenus" },
  { cle: "nav.health", repli: "Santé", icone: Heart, route: "/health", groupe: "modules", mots: "sante sommeil humeur corps" },
  { cle: "nav.wishlist", repli: "Liste de souhaits", icone: ShoppingCart, route: "/wishlist", groupe: "modules", mots: "wishlist envies achats" },

  /* ── Le social ── */
  { cle: "nav.community", repli: "Communauté", icone: Users, route: "/community", groupe: "social", mots: "community fil publications" },
  { cle: "nav.friends", repli: "Amis", icone: Share2, route: "/friends", groupe: "social", mots: "friends brigade guilde" },
  { cle: "nav.leaderboard", repli: "Classement", icone: Medal, route: "/leaderboard", groupe: "social", mots: "leaderboard rang podium" },
  { cle: "nav.hallOfFame", repli: "Panthéon", icone: Trophy, route: "/hall-of-fame", groupe: "social", mots: "hall of fame pantheon gloire" },
  { cle: "nav.inbox", repli: "Messages", icone: Inbox, route: "/inbox", groupe: "social", mots: "inbox boite messages" },

  /* ── Ce qu'on fait ── */
  { cle: "cmd.newGoal", repli: "Nouvel objectif", icone: Target, route: "/goals/new", groupe: "actions", mots: "creer ajouter objectif nouveau" },
  { cle: "cmd.graph", repli: "Graphe des objectifs", icone: Swords, route: "/goals/graph", groupe: "actions", mots: "graphe constellation carte" },
  { cle: "cmd.mia", repli: "Ouvrir M.I.A", icone: Sparkles, route: "__mia", groupe: "actions", mots: "mia assistant coach ia", action: "ouvrir-mia" },
  { cle: "nav.achievements", repli: "Hauts faits", icone: Trophy, route: "/achievements", groupe: "actions", mots: "achievements badges succes" },
  { cle: "nav.shop", repli: "Boutique", icone: ShoppingBag, route: "/shop", groupe: "actions", mots: "shop bonds cosmetiques" },
  { cle: "nav.reviews", repli: "Bilans", icone: BookOpen, route: "/reviews", groupe: "actions", mots: "reviews bilan hebdomadaire retour" },

  /* ── Les réglages ── */
  { cle: "set.account", repli: "Compte", icone: UserCircle, route: "/profile", groupe: "reglages", mots: "profil compte" },
  { cle: "set.public", repli: "Profil public", icone: User, route: "/profile/bounded", groupe: "reglages", mots: "public bounded vitrine" },
  { cle: "set.pact", repli: "Mon pacte", icone: Settings, route: "/profile/pact-settings", groupe: "reglages", mots: "pacte configuration" },
  { cle: "set.pactRules", repli: "Règles du pacte", icone: Settings, route: "/profile/pact-rules", groupe: "reglages", mots: "regles pacte contrat" },
  { cle: "set.display", repli: "Affichage & son", icone: Volume2, route: "/profile/display-sound", groupe: "reglages", mots: "theme volume particules affichage barre flottante mia" },
  { cle: "set.healthSettings", repli: "Réglages santé", icone: Heart, route: "/profile/health", groupe: "reglages", mots: "sante rappels mesures" },
  { cle: "set.notifications", repli: "Notifications", icone: Bell, route: "/profile/notifications", groupe: "reglages", mots: "alertes rappels notifications" },
  { cle: "set.security", repli: "Sécurité", icone: Shield, route: "/profile/security", groupe: "reglages", mots: "securite mot de passe second facteur" },
  { cle: "set.privacy", repli: "Confidentialité", icone: Shield, route: "/profile/privacy", groupe: "reglages", mots: "confidentialite donnees vie privee" },
  { cle: "set.data", repli: "Mes données", icone: Database, route: "/profile/data", groupe: "reglages", mots: "export import donnees portabilite" },
  {
    cle: "cmd.shortcuts", repli: "Raccourcis clavier", icone: Keyboard, route: "__raccourcis",
    groupe: "reglages", mots: "raccourcis clavier aide touches", action: "aide-raccourcis",
  },
];

const NOM_DE_GROUPE: Record<string, [string, string]> = {
  pages: ["palette.groupPages", "Pages"],
  modules: ["palette.groupModules", "Modules de vie"],
  social: ["palette.groupSocial", "Social"],
  actions: ["palette.groupActions", "Actions"],
  reglages: ["palette.groupSettings", "Réglages"],
};

/**
 * COMPARER DES MOTS, PAS DES LETTRES.
 *
 * Le classement par défaut de cmdk est une correspondance par
 * SOUS-SÉQUENCE : « mia » répond aussi bien à « Calendrier calendar
 * agenda MoIs plAnning », qui contient un m, un i et un a dans cet
 * ordre. Vérifié — taper « mia » rendait Calendrier, Communauté, Amis
 * et Messages, et l'entrée « Ouvrir M.I.A » n'apparaissait pas.
 *
 * On aplatit donc en retirant les points SANS les remplacer par une
 * espace — « M.I.A » devient « mia », et non « m i a » — puis on exige
 * que CHAQUE mot tapé se retrouve. Une entrée à qui il manque un mot
 * n'est pas une entrée moins bonne : ce n'est pas une réponse.
 */
function plat(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.'’-]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function classer(valeur: string, recherche: string): number {
  const q = plat(recherche);
  if (!q) return 1;
  const v = plat(valeur);
  const mots = q.split(" ").filter(Boolean);
  let score = 0;
  for (const m of mots) {
    const i = v.indexOf(m);
    if (i < 0) return 0;
    /* Un mot trouvé en tête vaut mieux qu'un mot trouvé au fond des
       synonymes : c'est ce qui fait remonter le nom avant les
       mots-clés. */
    const debutDeMot = i === 0 || v[i - 1] === " ";
    score += (debutDeMot ? 1 : 0.6) / mots.length;
  }
  return Math.max(0.01, score);
}

/** L'évènement que la charpente écoute pour ouvrir la console. */
export const OUVRIR_MIA = "vowpact-ouvrir-mia";

interface Position { x: number; y: number }

function positionRetenue(): Position {
  try {
    const brut = localStorage.getItem(PREF.BARRE_POSITION);
    if (!brut) return { x: 0, y: 0 };
    const p = JSON.parse(brut) as Position;
    return Number.isFinite(p?.x) && Number.isFinite(p?.y) ? p : { x: 0, y: 0 };
  } catch {
    return { x: 0, y: 0 };
  }
}

export function CommandPalette() {
  const [ouverte, setOuverte] = useState(false);
  const [visible] = useChromeFlottant("barre");
  const navigate = useNavigate();
  const { t } = useTranslation();

  const limites = useRef<HTMLDivElement>(null);
  const enDeplacement = useRef(false);
  const depart = useRef<Position>(positionRetenue());

  /* ⌘K RESTE ARMÉ MÊME QUAND LA BARRE EST RETIRÉE.
     Ce qu'on retire dans les réglages est un bouton, pas une fonction. */
  useEffect(() => {
    const auClavier = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOuverte((v) => !v);
      }
    };
    document.addEventListener("keydown", auClavier);
    return () => document.removeEventListener("keydown", auClavier);
  }, []);

  const groupes = useMemo(() => {
    const m = new Map<string, Entree[]>();
    for (const e of ENTREES) {
      const liste = m.get(e.groupe);
      if (liste) liste.push(e);
      else m.set(e.groupe, [e]);
    }
    return [...m.entries()];
  }, []);

  const choisir = useCallback(
    (e: Entree) => {
      setOuverte(false);
      if (e.action === "aide-raccourcis") {
        window.dispatchEvent(new Event(SHORTCUT_HELP_EVENT));
        return;
      }
      if (e.action === "ouvrir-mia") {
        window.dispatchEvent(new Event(OUVRIR_MIA));
        return;
      }
      navigate(e.route);
    },
    [navigate],
  );

  /* La position est écrite à la FIN du déplacement, pas à chaque image :
     un glissement de deux secondes écrirait cent fois dans le stockage. */
  const poser = useCallback((_e: unknown, info: PanInfo) => {
    depart.current = {
      x: depart.current.x + info.offset.x,
      y: depart.current.y + info.offset.y,
    };
    try {
      localStorage.setItem(PREF.BARRE_POSITION, JSON.stringify(depart.current));
    } catch {
      /* stockage indisponible : la position ne tiendra que la session */
    }
    window.setTimeout(() => { enDeplacement.current = false; }, 150);
  }, []);

  return (
    <>
      {visible && (
        <>
          <div ref={limites} className="cmdk-limites" aria-hidden="true" />

          <motion.div
            drag
            dragConstraints={limites}
            dragElastic={0.15}
            dragMomentum={false}
            initial={{ x: depart.current.x, y: depart.current.y }}
            onDragStart={() => { enDeplacement.current = true; }}
            onDragEnd={poser}
            whileHover={{ scale: 1.02 }}
            whileDrag={{ scale: 1.05 }}
            data-chrome="palette"
            className="cmdk-barre"
          >
            <span className="cmdk-poignee" title={t("palette.drag", "Glisser pour déplacer")}>
              <GripVertical aria-hidden="true" />
            </span>

            <button
              type="button"
              className="cmdk-declencheur"
              onClick={(e) => {
                /* Un relâchement après un glissement est un clic pour le
                   navigateur : sans ce garde, déplacer la barre ouvrirait
                   la palette à chaque fois. */
                if (enDeplacement.current) {
                  e.preventDefault();
                  e.stopPropagation();
                  return;
                }
                setOuverte(true);
              }}
              aria-label={t("palette.open", "Chercher ou se rendre à…")}
            >
              <Search aria-hidden="true" />
              <span className="cmdk-mot">{t("palette.search", "Chercher")}</span>
              <kbd className="cmdk-touche">
                <span>⌘</span>K
              </kbd>
            </button>
          </motion.div>
        </>
      )}

      <CommandDialog open={ouverte} onOpenChange={setOuverte} filter={classer}>
        <CommandInput placeholder={t("palette.placeholder", "Une page, un réglage, une action…")} />
        <CommandList>
          <CommandEmpty>{t("palette.empty", "Rien sous ce mot.")}</CommandEmpty>
          {groupes.map(([groupe, entrees], i) => {
            const [cleGroupe, repliGroupe] = NOM_DE_GROUPE[groupe] ?? [groupe, groupe];
            return (
              <div key={groupe}>
                {i > 0 && <CommandSeparator />}
                <CommandGroup heading={t(cleGroupe, repliGroupe)}>
                  {entrees.map((e) => {
                    const nom = t(e.cle, e.repli);
                    return (
                      <CommandItem
                        key={e.route}
                        value={`${nom} ${e.mots ?? ""}`}
                        onSelect={() => choisir(e)}
                        className="cmdk-entree"
                      >
                        <e.icone aria-hidden="true" />
                        <span>{nom}</span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </div>
            );
          })}
        </CommandList>
      </CommandDialog>
    </>
  );
}
