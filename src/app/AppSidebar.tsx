import { useState, memo, useCallback, useMemo, useRef, useEffect } from "react";
import {
  CLE_REPLI, debordDe, estRepliee, marqueDeRepli, memeDebord,
  pageSocialeOuverte, pastilleDe,
} from "@/socle/outils/barreLaterale";
import { NavLink, useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/socle/contextes/AuthContext";
import { useProfile } from "@/domaines/profil";
import { useProfileSettings, type ThemePreference } from "@/socle/hooks/useProfileSettings";
import { useShopModules, useUserModulePurchases } from "@/domaines/boutique";
import { usePendingFriendCount } from "@/domaines/social";
import { useSocialFeatures } from "@/socle/hooks/useSocialFeatures";
import {
  Home, Target, ShoppingBag, ShoppingCart, Users, LogOut, Settings, UserCircle,
  Bell, Shield, Database, Volume2, ListTodo, BookOpen, Wallet, Zap, Heart,
  Sparkles, Trophy, Timer, BarChart3, Handshake, ChevronsLeft, ChevronsRight,
  Mail, RefreshCw, User, Crown, CalendarDays, Search, Menu, ChevronRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/socle/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/socle/ui/tooltip";
import { useNotifications } from "@/domaines/social";
import { useMessagesNonLus } from "@/domaines/social";
import { useIsMobile } from "@/socle/hooks/use-mobile";
import { prefetchRoute } from "@/app/prefetchRoutes";
import { raccourciPalette } from "@/socle/outils/toucheRaccourci";
import { AvatarFrame } from "@/socle/ui/avatar-frame";
import { useCarteProfil } from "@/domaines/profil";
import { nombre } from "@/socle/outils/nombre";
import { RechercheBarre, type EntreeCherchable } from "./RechercheBarre";

/* ═══════════════════════════════════════════════════════════════
   LA BARRE LATERALE

   Ce qui a change, et pourquoi. Les chiffres sont ceux mesures sur
   la version precedente, dans une fenetre de 940 px de haut :

   1. ELLE A UN MODE CLAIR. L ancienne portait la classe « dark » en
      dur et un fond « #050508 » ecrit a la main : une dalle noire,
      quel que soit le theme choisi. Tout descend desormais de
      « --ds-* », qui possede deja son miroir clair. Voir sidebar.css.

   2. ELLE TIENT DANS LA HAUTEUR. Il en fallait 1 064 ; « Boutique »
      etait hors champ, et la barre de defilement etait masquee, donc
      rien ne le disait. Les rangees passent de 44 a 32 px, l en-tete
      de 44 px de texte a une marque seule. La barre de defilement
      reste invisible — c est voulu — mais UN VOILE parait des qu il
      reste du contenu dessous. Cacher n est pas taire.

   3. SES LIBELLES SONT TRADUITS. « Dashboard », « Operations »,
      « Life Systems » etaient des chaines anglaises en dur, juste
      au-dessus d un menu reglages en francais. Racine « nav ».

   4. L ETAT REPLIE EST RETENU. C etait un « useState(false) » :
      chaque rechargement rouvrait la barre.

   5. LA RECHERCHE A UNE PORTE. La palette existait, elle est bonne,
      et rien dans l interface ne disait qu elle etait la.
   ═══════════════════════════════════════════════════════════════ */

type Categorie = "overview" | "operations" | "lifeSystems" | "network" | "system";

interface Entree {
  to: string;
  icone: LucideIcon;
  cle: string;
  badge?: "friends" | "messages" | "inbox";
  module?: string;
}

const BASE: Record<Categorie, Entree[]> = {
  overview: [
    { to: "/", icone: Home, cle: "dashboard", module: "dashboard" },
    { to: "/analytics", icone: BarChart3, cle: "analytics", module: "analytics" },
  ],
  operations: [
    { to: "/goals", icone: Target, cle: "goals", module: "goals" },
    { to: "/focus", icone: Timer, cle: "focus", module: "focus" },
    { to: "/calendar", icone: CalendarDays, cle: "calendar", module: "calendar" },
  ],
  lifeSystems: [],
  network: [
    { to: "/community", icone: Users, cle: "community", module: "community" },
    { to: "/friends", icone: Handshake, cle: "friends", badge: "friends" },
    { to: "/leaderboard", icone: Crown, cle: "leaderboard", module: "leaderboard" },
    { to: "/achievements", icone: Trophy, cle: "achievements", module: "achievements" },
  ],
  system: [{ to: "/shop", icone: ShoppingBag, cle: "shop", module: "shop" }],
};

const MODULES: Record<string, Entree & { categorie: Categorie }> = {
  "todo-list": { icone: ListTodo, to: "/todo", cle: "todo", categorie: "operations" },
  "the-call": { icone: Zap, to: "/the-call", cle: "theCall", categorie: "operations" },
  journal: { icone: BookOpen, to: "/journal", cle: "journal", categorie: "lifeSystems" },
  finance: { icone: Wallet, to: "/finance", cle: "finance", categorie: "lifeSystems" },
  "track-health": { icone: Heart, to: "/health", cle: "health", categorie: "lifeSystems" },
  wishlist: { icone: ShoppingCart, to: "/wishlist", cle: "wishlist", categorie: "lifeSystems" },
};

const ORDRE: Categorie[] = ["overview", "operations", "lifeSystems", "network", "system"];

const REGLAGES = [
  { to: "/profile", icone: UserCircle, cle: "compte" },
  { to: "/profile/bounded", icone: User, cle: "public" },
  { to: "/profile/pact-settings", icone: Settings, cle: "pacte" },
  { to: "/profile/display-sound", icone: Volume2, cle: "apparence" },
  { to: "/profile/notifications", icone: Bell, cle: "notifications" },
  { to: "/profile/privacy", icone: Shield, cle: "confidentialite" },
  { to: "/profile/data", icone: Database, cle: "donnees" },
];

/* ── Une entree ───────────────────────────────────────────────
   Memoisee, et elle ne recoit que des valeurs simples. L ancienne
   version passait l objet « location » a chacune des dix-huit :
   tout changement de page les redessinait toutes, alors que NavLink
   sait deja se teindre seul. */
const Lien = memo(function Lien({
  to, icone: Icone, libelle, badge, mini, fermer,
}: {
  to: string;
  icone: Entree["icone"];
  libelle: string;
  badge: number;
  mini: boolean;
  fermer: () => void;
}) {
  const prefetch = useCallback(() => prefetchRoute(to), [to]);

  const lien = (
    <NavLink
      to={to}
      end={to === "/"}
      className="sb-lien"
      onClick={fermer}
      onMouseEnter={prefetch}
      onFocus={prefetch}
      onTouchStart={prefetch}
      aria-label={mini ? libelle : undefined}
    >
      <Icone aria-hidden />
      <span className="sb-lien-mot">{libelle}</span>
      {badge > 0 && <span className="sb-pastille">{badge > 99 ? "99+" : badge}</span>}
    </NavLink>
  );

  if (!mini) return lien;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{lien}</TooltipTrigger>
      <TooltipContent side="right" className="sb-bulle">
        {badge > 0 ? `${libelle} · ${badge}` : libelle}
      </TooltipContent>
    </Tooltip>
  );
});

export const AppSidebar = memo(function AppSidebar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { t } = useTranslation();
  const { setTheme } = useTheme();

  /* L etat replie est RETENU, et lu des le premier rendu : le lire
     dans un effet ferait battre la barre a chaque chargement. */
  const [replie, setReplie] = useState(() => {
    try { return estRepliee(localStorage.getItem(CLE_REPLI)); } catch { return false; }
  });
  const [mobileOuvert, setMobileOuvert] = useState(false);
  const [chercheOuverte, setChercheOuverte] = useState(false);

  const { unreadCount, unreadByModule } = useNotifications();
  const { nonLus: messagesNonLus } = useMessagesNonLus();
  const { count: demandesAllies } = usePendingFriendCount();
  const social = useSocialFeatures();
  const totalNonLus = unreadCount + messagesNonLus + demandesAllies;

  const { data: tousModules = [] } = useShopModules();
  const { data: modulesAchetes = [] } = useUserModulePurchases(user?.id);
  const { data: profil } = useProfile(user?.id);
  const { profile: reglages, updateProfile } = useProfileSettings();
  /* LE CADRE D AVATAR SE VOIT AUSSI ICI. C est un cosmetique qu on
     achete et qu on equipe ; ne le montrer que sur la carte publique
     revenait a le cacher a celui qui l a paye. Un seul appel, mis en
     cache cinq minutes, et partage avec la carte de survol. */
  const { data: carte } = useCarteProfil(user?.id, true);
  const cadre = carte?.cadre;

  const clesAchetees = useMemo(
    () => tousModules.filter((m) => modulesAchetes.includes(m.id)).map((m) => m.key),
    [tousModules, modulesAchetes],
  );

  const fermerMobile = useCallback(() => {
    if (isMobile) setMobileOuvert(false);
  }, [isMobile]);

  const basculerRepli = useCallback(() => {
    setReplie((v) => {
      const suivant = !v;
      try { localStorage.setItem(CLE_REPLI, marqueDeRepli(suivant)); } catch { /* navigation privee */ }
      return suivant;
    });
  }, []);

  const mini = replie && !isMobile;

  const compte = useCallback(
    (e: Entree) => pastilleDe(e, {
      demandesAllies, messagesNonLus,
      boiteDeReception: unreadCount, parModule: unreadByModule,
    }),
    [demandesAllies, messagesNonLus, unreadCount, unreadByModule],
  );

  const categories = useMemo(() => {
    const c: Record<Categorie, Entree[]> = {
      overview: [...BASE.overview],
      operations: [...BASE.operations],
      lifeSystems: [...BASE.lifeSystems],
      /* Les trois drapeaux, pas l objet : « social » est recree a chaque rendu. */
      network: BASE.network.filter((e) => pageSocialeOuverte(e.to, {
        community: social.community, friends: social.friends, leaderboard: social.leaderboard,
      })),
      system: [...BASE.system],
    };
    for (const [cle, conf] of Object.entries(MODULES)) {
      if (clesAchetees.includes(cle)) {
        c[conf.categorie].push({ to: conf.to, icone: conf.icone, cle: conf.cle, module: cle });
      }
    }
    return c;
  }, [clesAchetees, social.community, social.friends, social.leaderboard]);

  const aUnModule = clesAchetees.some((k) => k in MODULES);

  /* CE QUE LA RECHERCHE CONNAIT VIENT D ICI, pas d une seconde liste.
     Deux inventaires finiraient par diverger — une page ajoutee a la
     barre et oubliee dans la recherche est une page introuvable. */
  const cherchables = useMemo<EntreeCherchable[]>(() => {
    const l: EntreeCherchable[] = [];
    for (const cat of ORDRE) {
      for (const e of categories[cat]) {
        l.push({ to: e.to, libelle: t(`nav.pages.${e.cle}`), icone: e.icone, groupe: t(`nav.sections.${cat}`) });
      }
    }
    for (const r of REGLAGES) {
      l.push({ to: r.to, libelle: t(`nav.compte.${r.cle}`), icone: r.icone, groupe: t("nav.options", "Compte") });
    }
    return l;
  }, [categories, t]);

  /* Fermer au clic dehors et a Echap. Le volet n a pas de fond
     opaque : sans cela, il resterait ouvert pendant qu on travaille
     ailleurs. */
  useEffect(() => {
    if (!chercheOuverte) return;
    const dehors = (ev: PointerEvent) => {
      const c = ev.target as Element | null;
      if (c?.closest?.(".sb-volet") || c?.closest?.(".sb-cherche")) return;
      setChercheOuverte(false);
    };
    const echap = (ev: KeyboardEvent) => { if (ev.key === "Escape") setChercheOuverte(false); };
    document.addEventListener("pointerdown", dehors);
    document.addEventListener("keydown", echap);
    return () => {
      document.removeEventListener("pointerdown", dehors);
      document.removeEventListener("keydown", echap);
    };
  }, [chercheOuverte]);

  /* ── Le voile de debordement ──────────────────────────────
     La barre de defilement est invisible, par choix. Mais un
     debordement muet est un piege : l ancienne cachait « Boutique »
     sans rien dire. Le voile ne parait que s il reste du contenu, et
     s efface quand on touche le fond. Il ne prend pas de place et ne
     se clique pas. */
  const zone = useRef<HTMLElement>(null);
  const [debord, setDebord] = useState({ haut: false, bas: false });
  useEffect(() => {
    const el = zone.current;
    if (!el) return;
    const relire = () => {
      const suivant = debordDe(el.scrollTop, el.scrollHeight, el.clientHeight);
      setDebord((p) => (memeDebord(p, suivant) ? p : suivant));
    };
    relire();
    el.addEventListener("scroll", relire, { passive: true });
    /* Le contenu bouge sans qu on defile : un module achete, une
       fonction sociale coupee, la barre qu on replie. */
    const oeil = new ResizeObserver(relire);
    oeil.observe(el);
    for (const enfant of Array.from(el.children)) oeil.observe(enfant);
    return () => { el.removeEventListener("scroll", relire); oeil.disconnect(); };
  }, [categories, mini]);

  /* ── LE CURSEUR SUIT L ENTREE ACTIVE ──────────────────────
     On pourrait lire « useLocation() », mais cela redessinerait la
     barre entiere a chaque navigation — precisement ce qu on vient
     d eviter. NavLink pose lui-meme « aria-current » ; il suffit de
     regarder cet attribut changer. */
  const curseur = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const nav = zone.current;
    const barre = curseur.current;
    if (!nav || !barre) return;
    let attente = 0;
    const placer = () => {
      const actif = nav.querySelector<HTMLElement>('[aria-current="page"]');
      if (!actif) { barre.dataset.vu = "non"; return; }
      barre.style.height = actif.offsetHeight + "px";
      barre.style.transform = "translateY(" + actif.offsetTop + "px)";
      barre.dataset.vu = "oui";
    };
    const differer = () => {
      cancelAnimationFrame(attente);
      attente = requestAnimationFrame(placer);
    };
    differer();
    const oeil = new MutationObserver(differer);
    oeil.observe(nav, { subtree: true, attributes: true, attributeFilter: ["aria-current", "class"] });
    const taille = new ResizeObserver(differer);
    taille.observe(nav);
    nav.addEventListener("scroll", differer, { passive: true });
    return () => {
      cancelAnimationFrame(attente);
      oeil.disconnect();
      taille.disconnect();
      nav.removeEventListener("scroll", differer);
    };
  }, [categories, mini]);

  const seDeconnecter = useCallback(async () => {
    await signOut();
    navigate("/auth");
  }, [signOut, navigate]);

  const poserTheme = useCallback((v: ThemePreference) => {
    /* Les deux, dans cet ordre : « setTheme » pour que ce soit
       immediat, la preference pour que ce soit retenu. Sans elle,
       ProfilePreferencesSync remettrait l ancien theme au prochain
       chargement. */
    setTheme(v);
    updateProfile.mutate({ theme_preference: v } as never);
  }, [setTheme, updateProfile]);

  const themeCourant = (reglages?.theme_preference ?? "system") as ThemePreference;
  const initiale = profil?.display_name?.[0]?.toUpperCase() ?? "?";

  /* LES MEMES HUIT PROPRIETES ETAIENT ECRITES DEUX FOIS, a la taille
     pres — une pour le bouton du bas, une pour le panneau qu il
     ouvre. Et les trois mesures y etaient lues par `Number(v) || d`,
     la seule des quatre lectures de l application qui remplace un
     zero : `nombre` garde le zero, comme la carte publique et comme
     la formule du socle. */
  const cadreDuProfil = {
    avatarUrl: profil?.avatar_url ?? null,
    fallback: initiale,
    frameImage: cadre?.image ?? undefined,
    borderColor: cadre?.bordure ?? "transparent",
    glowColor: cadre?.lueur ?? "transparent",
    frameScale: nombre(cadre?.echelle, 1),
    frameOffsetX: nombre(cadre?.decalageX, 0),
    frameOffsetY: nombre(cadre?.decalageY, 0),
    showBorder: cadre?.montrerBordure !== false,
  };

  return (
    <TooltipProvider delayDuration={120}>
      {isMobile && !mobileOuvert && (
        <button
          type="button"
          onClick={() => setMobileOuvert(true)}
          aria-label={t("nav.ouvrir", "Ouvrir la navigation")}
          data-chrome="sidebar-mobile"
          className="sb-declencheur"
        >
          <Menu aria-hidden size={19} />
        </button>
      )}

      {isMobile && mobileOuvert && (
        <div className="sb-fond" onClick={() => setMobileOuvert(false)} aria-hidden />
      )}

      <aside
        className="sb"
        data-replie={mini ? "oui" : "non"}
        data-chrome="sidebar"
        style={
          isMobile
            ? {
                position: "fixed", top: 0, left: 0, height: "100%", zIndex: 50, width: 264,
                transform: mobileOuvert ? "translateX(0)" : "translateX(-100%)",
                transition: "transform 300ms cubic-bezier(.16,1,.3,1)",
              }
            : { position: "sticky", top: 0, height: "100vh", zIndex: 30 }
        }
      >
        {!isMobile && (
          <button
            type="button"
            className="sb-poignee"
            onClick={basculerRepli}
            aria-expanded={!mini}
            aria-label={mini ? t("nav.deplier", "Déplier la navigation") : t("nav.replier", "Replier la navigation")}
          >
            {mini ? <ChevronsRight aria-hidden /> : <ChevronsLeft aria-hidden />}
          </button>
        )}

        {/* ── La marque, seule ──────────────────────────────
            « OVERWRITE » en Orbitron, une diode verte clignotante et
            « SYS.ONLINE // v4.0.1 » tenaient 44 px sous le logo. Le
            logo dit deja le nom ; sa lueur est dans la feuille.

            LE SIGNE EST POSE PAR LA FEUILLE, PAS PAR UNE BALISE <img>.
            Il change avec le theme — sa moitie blanche disparaitrait sur
            le fond clair de la barre — et avec l etat replie, ou une
            marque de 1,95:1 n a plus la place de se lire. Trois sources
            pour un seul element : c est du ressort du CSS. */}
        <div className="sb-tete">
          <button
            type="button"
            className="sb-marque"
            onClick={() => { navigate("/"); fermerMobile(); }}
            aria-label="Overwrite"
          >
            <span className="sb-signe" aria-hidden="true" />
          </button>
        </div>

        <button
          type="button"
          className="sb-cherche"
          onClick={() => setChercheOuverte((v) => !v)}
          aria-label={t("nav.chercher", "Rechercher")}
          aria-expanded={chercheOuverte}
        >
          <Search aria-hidden />
          {!mini && (
            <>
              <span className="sb-cherche-mot">{t("nav.chercher", "Rechercher")}</span>
              <kbd className="sb-cherche-touche">{raccourciPalette()}</kbd>
            </>
          )}
        </button>

        <div style={{ position: "relative", flex: 1, minHeight: 0, display: "flex" }}>
          <span className="sb-voile" data-cote="haut" data-actif={debord.haut ? "oui" : "non"} style={{ top: 0 }} aria-hidden />

          <nav className="sb-nav" ref={zone} aria-label={t("nav.ouvrir", "Navigation")}>
            <span className="sb-curseur" ref={curseur} data-vu="non" aria-hidden />
            {ORDRE.map((cat) => {
              const entrees = categories[cat];
              if (!entrees.length) return null;
              return (
                <div key={cat}>
                  <p className="sb-sect">{t(`nav.sections.${cat}`)}</p>
                  {entrees.map((e) => (
                    <Lien
                      key={e.to}
                      to={e.to}
                      icone={e.icone}
                      libelle={t(`nav.pages.${e.cle}`)}
                      badge={compte(e)}
                      mini={mini}
                      fermer={fermerMobile}
                    />
                  ))}
                  {cat === "operations" && !aUnModule && !mini && (
                    <button
                      type="button"
                      className="sb-invite"
                      onClick={() => { navigate("/shop"); fermerMobile(); }}
                    >
                      <Sparkles aria-hidden />
                      {t("nav.installer", "Installer des modules")}
                    </button>
                  )}
                </div>
              );
            })}
          </nav>

          <span className="sb-voile" data-cote="bas" data-actif={debord.bas ? "oui" : "non"} style={{ bottom: 0 }} aria-hidden />
        </div>

        {/* ── L acces au compte ─────────────────────────────
            Sept reglages etaient serres dans une grille de deux
            colonnes, en libelles de 10 px tronques sur quatre
            entrees sur sept, sous un en-tete « System_Config ».
            Une colonne, 14 px, rien de coupe — et le theme se regle
            ici, ce qu on venait justement y chercher. */}
        <RechercheBarre
          ouverte={chercheOuverte}
          fermer={() => setChercheOuverte(false)}
          entrees={cherchables}
          pactId={profil?.active_pact_id}
          userId={user?.id}
        />

        <div className="sb-pied">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className="sb-profil" aria-label={t("nav.options", "Compte et réglages")}>
                <span className="sb-av-boite">
                  <AvatarFrame {...cadreDuProfil} size="sm" />
                  {totalNonLus > 0 && <span className="sb-point" aria-hidden />}
                </span>
                {!mini && (
                  <>
                    <span className="sb-profil-mots">
                      <b>{profil?.display_name ?? "—"}</b>
                      {profil?.custom_difficulty_name && <span>{profil.custom_difficulty_name}</span>}
                    </span>
                    <ChevronRight aria-hidden />
                  </>
                )}
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent side="right" align="end" sideOffset={12} className="sb-panneau">
              <div className="sb-pan-tete">
                <span className="sb-pan-av-boite">
                  <AvatarFrame {...cadreDuProfil} size="md" />
                </span>
                <span className="sb-pan-id">
                  <b>{profil?.display_name ?? "—"}</b>
                  {profil?.custom_difficulty_name && <span>{profil.custom_difficulty_name}</span>}
                </span>
              </div>

              <div className="sb-pan-liste">
                {REGLAGES.map((r) => {
                  const Icone = r.icone;
                  return (
                    <DropdownMenuItem
                      key={r.to}
                      className="sb-pan-item"
                      onSelect={() => { navigate(r.to); fermerMobile(); }}
                    >
                      <Icone aria-hidden />
                      {t(`nav.compte.${r.cle}`)}
                    </DropdownMenuItem>
                  );
                })}
              </div>

              <div className="sb-pan-filet" />

              <div className="sb-pan-theme">
                <span>{t("nav.theme", "Thème")}</span>
                <span className="sb-pan-bascule">
                  {(["light", "dark", "system"] as ThemePreference[]).map((v) => (
                    <button
                      key={v}
                      type="button"
                      aria-pressed={themeCourant === v}
                      onClick={() => poserTheme(v)}
                    >
                      {v === "light" ? t("nav.themeClair") : v === "dark" ? t("nav.themeSombre") : t("nav.themeSysteme")}
                    </button>
                  ))}
                </span>
              </div>

              <div className="sb-pan-filet" />

              <div className="sb-pan-liste">
                {social.inbox && (
                  <DropdownMenuItem className="sb-pan-item" onSelect={() => { navigate("/inbox"); fermerMobile(); }}>
                    <Mail aria-hidden />
                    {t("nav.compte.inbox")}
                    {totalNonLus > 0 && <span className="sb-pastille">{totalNonLus > 99 ? "99+" : totalNonLus}</span>}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem className="sb-pan-item" onSelect={() => { navigate("/pact-selector"); fermerMobile(); }}>
                  <RefreshCw aria-hidden />
                  {t("nav.compte.changerPacte")}
                </DropdownMenuItem>
                <DropdownMenuItem className="sb-pan-item sb-pan-sortie" onSelect={seDeconnecter}>
                  <LogOut aria-hidden />
                  {t("nav.compte.deconnexion")}
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
    </TooltipProvider>
  );
});
