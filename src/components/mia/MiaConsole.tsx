import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ChevronDown, Plus, X, Send, ArrowLeft } from "lucide-react";
import {
  useFilsMia,
  useMessagesMia,
  useFluxMia,
  useApercusMia,
  type ActeMia,
  type MetaMessageMia,
  type SourceMia,
} from "@/hooks/useMia";
import { PREF } from "@/lib/preferencesAffichage";
import { supabase } from "@/integrations/supabase/client";
import { ReseauMia, type EtatMia } from "./ReseauMia";

/**
 * M.I.A — Mysterious Intelligence Array.
 *
 * ═══════════════════════════════════════════════════════════════
 * CE QUI REMPLACE LE TIROIR DU COACH.
 *
 * L'ancien faisait 440 px, empilait trois boutons sans libellé dans son
 * en-tête — dont un « cerveau » qui indexait la mémoire à la main —,
 * réduisait les conversations à une bande de puces coupées à
 * vingt-quatre caractères, et posait au-dessus de tout une pile
 * d'insights automatiques que personne n'avait demandés.
 *
 * QUATRE CHANGEMENTS.
 *
 *   LA LARGEUR SE RÈGLE. 560 px par défaut, tirable entre 380 et 900,
 *   et la valeur tient d'une session à l'autre.
 *
 *   LES FILS SE FERMENT. La bande de puces devient un tiroir : on tape
 *   le titre du fil en cours, la liste descend avec le dernier message
 *   de chacun, sa date et sa croix. `coach_conversations.archived`
 *   existait depuis le début et n'avait jamais servi — zéro fil archivé
 *   sur six.
 *
 *   CE QU'ELLE FAIT SE LIT AU FIL. Les pastilles vertes arrondies
 *   deviennent un relevé sous la réponse, avec le lien vers ce qui a
 *   été touché.
 *
 *   LE SIGLE DIT L'ÉTAT. Le réseau remplace le petit robot de lucide :
 *   il balaie quand elle travaille, il s'allume quand elle a répondu.
 * ═══════════════════════════════════════════════════════════════
 */
interface MiaConsoleProps {
  open: boolean;
  onClose: () => void;
  /** Remonté au parent pour que la vignette sache quoi montrer. */
  onEtat?: (etat: EtatMia) => void;
}

const LARGEUR_DEFAUT = 560;
const LARGEUR_MIN = 380;
const LARGEUR_MAX = 900;

export function MiaConsole({ open, onClose, onEtat }: MiaConsoleProps) {
  const { conversations, create, archive } = useFilsMia();
  const [filActif, setFilActif] = useState<string | null>(null);
  const { data: messages = [] } = useMessagesMia(filActif);
  const { send, streaming, streamText } = useFluxMia(filActif);
  const { data: apercus = {} } = useApercusMia(conversations.map((c) => c.id));
  const [brouillon, setBrouillon] = useState("");
  const [tiroirOuvert, setTiroirOuvert] = useState(false);
  const fluxRef = useRef<HTMLDivElement>(null);
  const champRef = useRef<HTMLTextAreaElement>(null);

  /* La largeur tient d'une session à l'autre : c'est une préférence de
     lecture, pas un réglage de compte. */
  const [largeur, setLargeur] = useState(() => {
    try {
      const v = Number(localStorage.getItem(PREF.MIA_LARGEUR));
      return Number.isFinite(v) && v >= LARGEUR_MIN && v <= LARGEUR_MAX ? v : LARGEUR_DEFAUT;
    } catch {
      return LARGEUR_DEFAUT;
    }
  });

  useEffect(() => {
    if (open && !filActif && conversations.length > 0) setFilActif(conversations[0].id);
  }, [open, filActif, conversations]);

  /* LA MÉMOIRE S'INDEXE SEULE.

     Elle dépendait d'un bouton « cerveau » sans libellé, caché dans
     l'en-tête : sept souvenirs en trois mois, le score d'une fonction
     qu'il faut penser à déclencher. Le bouton est parti avec l'ancien
     tiroir — mais le cron qui rattrapait le coup est parti avec la
     passe 1, et l'index se serait figé pour de bon.

     L'indexeur est idempotent : il saute ce qu'il a déjà vu. On le
     réveille donc à l'ouverture de la console, une fois par session.
     Ce n'est pas encore « au moment où le souvenir naît » — un appel
     depuis le journal serait plus juste — mais l'index recommence à
     grandir sans que personne ait à y penser. */
  const memoireVue = useRef(false);
  useEffect(() => {
    if (!open || memoireVue.current) return;
    memoireVue.current = true;
    void supabase.functions.invoke("coach-index-memory", { body: {} }).catch(() => {
      /* silencieux : ce n'est pas une action de l'utilisateur */
    });
  }, [open]);

  /* LA PASTILLE DE RECHERCHE FLOTTAIT AU-DESSUS DU COMPOSEUR.
     Elle est en z-[999], la console en 91 : elle se posait donc sur le
     bouton d envoi, qu on ne pouvait plus atteindre. Plutot que de
     surencherir sur les z-index — la course qui produit les 999 — la
     console marque le corps, et la pastille s efface le temps qu elle
     est ouverte. */
  useEffect(() => {
    if (!open) return;
    document.body.dataset.miaOuverte = "";
    return () => {
      delete document.body.dataset.miaOuverte;
    };
  }, [open]);

  useEffect(() => {
    fluxRef.current?.scrollTo({ top: fluxRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, streamText]);

  const etat: EtatMia = streaming ? "travail" : brouillon.trim() ? "ecoute" : "repos";
  useEffect(() => {
    onEtat?.(etat);
  }, [etat, onEtat]);

  /* ── LA POIGNÉE ──
     On écoute sur la fenêtre et non sur la poignée : un glissement rapide
     sort du rectangle de 10 px et le redimensionnement s'arrêterait net. */
  const [redim, setRedim] = useState(false);
  useEffect(() => {
    if (!redim) return;
    const bouger = (e: PointerEvent) => {
      const l = Math.min(LARGEUR_MAX, Math.max(LARGEUR_MIN, window.innerWidth - e.clientX));
      setLargeur(l);
    };
    const lacher = () => {
      setRedim(false);
      setLargeur((l) => {
        try {
          localStorage.setItem(PREF.MIA_LARGEUR, String(Math.round(l)));
        } catch {
          /* navigation privée : la largeur ne tiendra que la session */
        }
        return l;
      });
    };
    window.addEventListener("pointermove", bouger);
    window.addEventListener("pointerup", lacher);
    return () => {
      window.removeEventListener("pointermove", bouger);
      window.removeEventListener("pointerup", lacher);
    };
  }, [redim]);

  const nouveauFil = useCallback(async () => {
    const fil = await create(undefined);
    setFilActif(fil.id);
    setTiroirOuvert(false);
  }, [create]);

  const fermerFil = useCallback(
    async (id: string) => {
      await archive(id);
      if (id === filActif) {
        const reste = conversations.filter((c) => c.id !== id);
        setFilActif(reste[0]?.id ?? null);
      }
    },
    [archive, filActif, conversations],
  );

  const envoyer = useCallback(async () => {
    const texte = brouillon.trim();
    if (!texte || streaming) return;
    setBrouillon("");
    if (!filActif) {
      /* SANS FIL, LE PREMIER MESSAGE PARTAIT DANS LE VIDE.
         L'ancien panneau créait la conversation ICI puis appelait `send`
         dans la foulée — mais `send` est refermé sur l'identifiant du
         rendu courant, encore nul, et sortait aussitôt par son garde
         `if (!conversationId) return`. On pose le message en attente et
         on l'envoie quand `send` pointe bien sur le nouveau fil. */
      enAttente.current = texte;
      const fil = await create(texte.slice(0, 60));
      setFilActif(fil.id);
      return;
    }
    await send(texte);
  }, [brouillon, streaming, filActif, create, send]);

  const enAttente = useRef<string | null>(null);
  useEffect(() => {
    if (enAttente.current && filActif) {
      const texte = enAttente.current;
      enAttente.current = null;
      void send(texte);
    }
  }, [filActif, send]);

  /* ENTRÉE ENVOIE, MAJ+ENTRÉE VA À LA LIGNE.
     Seul ⌘+Entrée envoyait, donc une Entrée seule insérait un retour à
     la ligne — le geste que tout le monde fait dans un champ de
     conversation. Le champ se remplissait sans le dire et rognait sa
     première ligne. ⌘+Entrée continue de marcher, par habitude. */
  const auClavier = (e: React.KeyboardEvent) => {
    if (e.key !== "Enter") return;
    if (e.shiftKey) return;
    e.preventDefault();
    void envoyer();
  };

  /* La hauteur suit le contenu : on la remet à zéro pour lire la vraie
     hauteur du texte, puis on la pose, plafonnée. */
  const ajusterHauteur = useCallback(() => {
    const el = champRef.current;
    if (!el) return;
    el.style.height = "auto";
    const plafond = 168;
    const voulue = Math.min(plafond, el.scrollHeight);
    el.style.height = `${voulue}px`;
    if (el.scrollHeight > plafond) el.dataset.plein = "";
    else delete el.dataset.plein;
  }, []);

  useEffect(() => {
    ajusterHauteur();
  }, [brouillon, ajusterHauteur]);

  const titreCourant = useMemo(
    () => conversations.find((c) => c.id === filActif)?.title ?? "Nouvelle conversation",
    [conversations, filActif],
  );

  const contenu = (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="mia-voile"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            aria-hidden
          />
          <motion.aside
            role="dialog"
            aria-label="M.I.A"
            className="mia-console"
            data-redim={redim ? "" : undefined}
            style={{ ["--mia-largeur" as string]: `${largeur}px` }}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 220 }}
          >
            <button
              type="button"
              className="mia-poignee"
              aria-label="Régler la largeur de la console"
              onPointerDown={(e) => {
                e.preventDefault();
                setRedim(true);
              }}
            />

            <header className="mia-tete">
              <span className="mia-sigle">
                <ReseauMia etat={etat} />
              </span>
              <span>
                <span className="mia-nom">M.I.A</span>
                <span className="mia-etat">
                  {streaming ? "en train de chercher" : "mysterious intelligence array"}
                </span>
              </span>
              <span className="mia-outils">
                <button type="button" className="mia-b" onClick={nouveauFil} aria-label="Nouvelle conversation">
                  <Plus className="h-4 w-4" />
                </button>
                <button type="button" className="mia-b" onClick={onClose} aria-label="Fermer M.I.A">
                  <X className="h-4 w-4" />
                </button>
              </span>
            </header>

            <button
              type="button"
              className="mia-fil"
              onClick={() => setTiroirOuvert((v) => !v)}
              aria-expanded={tiroirOuvert}
            >
              <ChevronDown className="h-3 w-3" />
              <span className="mia-fil-titre">{titreCourant}</span>
              <span className="mia-fil-compte">
                {conversations.length} fil{conversations.length > 1 ? "s" : ""}
              </span>
            </button>

            <div ref={fluxRef} className="mia-flux">
              {messages.length === 0 && !streaming ? (
                <div className="mia-vide">
                  <ReseauMia etat="repos" taille={34} />
                  <p>
                    Demande-moi où tu en es, ce qu'il reste à faire, ou fais-moi ajouter
                    quelque chose. J'ai accès à tes objectifs, tes tâches et ton journal.
                  </p>
                </div>
              ) : (
                <>
                  {messages.map((m) => (
                    <Bulle key={m.id} role={m.role} contenu={m.content} meta={m.metadata ?? null} />
                  ))}
                  {streaming && <Bulle role="assistant" contenu={streamText} meta={null} enCours />}
                </>
              )}
            </div>

            <div className="mia-pied">
              <div className="mia-champ">
                <textarea
                  ref={champRef}
                  value={brouillon}
                  onChange={(e) => setBrouillon(e.target.value)}
                  onKeyDown={auClavier}
                  placeholder="Écris à M.I.A…"
                  rows={1}
                  disabled={streaming}
                  aria-label="Message pour M.I.A"
                />
                <button
                  type="button"
                  className="mia-envoi"
                  onClick={() => void envoyer()}
                  disabled={streaming || !brouillon.trim()}
                  aria-label="Envoyer"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
              {/* La largeur ne s'affiche que pendant qu'on la règle :
                  affichée en permanence, c'était un relevé de mise au
                  point qui traînait sous chaque conversation. */}
              <div className="mia-note">
                <span>↵ envoyer · ⇧↵ aller à la ligne</span>
                <span>{redim ? `${Math.round(largeur)} px` : ""}</span>
              </div>
            </div>

            <AnimatePresence>
              {tiroirOuvert && (
                <motion.div
                  className="mia-tiroir"
                  initial={{ opacity: 0, y: -12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.18 }}
                >
                  <div className="mia-tiroir-tete">
                    <button
                      type="button"
                      className="mia-b"
                      onClick={() => setTiroirOuvert(false)}
                      aria-label="Revenir à la conversation"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                    <span>
                      Conversations · {conversations.length} ouverte
                      {conversations.length > 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="mia-tiroir-liste">
                    {conversations.map((c) => (
                      <div key={c.id} className="mia-ligne" data-actif={c.id === filActif ? "" : undefined}>
                        <button
                          type="button"
                          onClick={() => {
                            setFilActif(c.id);
                            setTiroirOuvert(false);
                          }}
                          className="text-left min-w-0 bg-transparent border-0 p-0 cursor-pointer"
                        >
                          <h3>{c.title}</h3>
                          <p>{apercus[c.id] || "Rien encore."}</p>
                        </button>
                        <span className="mia-ligne-droite">
                          <time dateTime={c.last_message_at}>{quand(c.last_message_at)}</time>
                          <button
                            type="button"
                            className="mia-fermer-fil"
                            onClick={() => void fermerFil(c.id)}
                            aria-label={`Fermer « ${c.title} »`}
                            title="Fermer cette conversation"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      </div>
                    ))}
                    {conversations.length === 0 && (
                      <p className="mia-vide" style={{ padding: "32px 20px" }}>
                        Aucune conversation ouverte.
                      </p>
                    )}
                  </div>

                  <button type="button" className="mia-tiroir-pied" onClick={() => void nouveauFil()}>
                    + Nouvelle conversation
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(contenu, document.body);
}

/** « à l'instant », « 14 h 20 », « hier », « 16 août ». */
function quand(iso: string): string {
  const d = new Date(iso);
  const ecart = Date.now() - d.getTime();
  if (ecart < 120_000) return "à l'instant";
  const auj = new Date();
  const memeJour = d.toDateString() === auj.toDateString();
  if (memeJour) return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const hier = new Date(auj);
  hier.setDate(auj.getDate() - 1);
  if (d.toDateString() === hier.toDateString()) return "hier";
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function Bulle({
  role,
  contenu,
  meta,
  enCours = false,
}: {
  role: string;
  contenu: string;
  meta: MetaMessageMia | null;
  enCours?: boolean;
}) {
  if (role === "user") {
    return (
      <div className="mia-bulle" data-role="user">
        {contenu}
      </div>
    );
  }
  return (
    <div className="mia-bulle" data-role="assistant">
      <div className="mia-signature">
        <ReseauMia etat={enCours ? "travail" : "reponse"} taille={12} />
        <span>M.I.A</span>
      </div>
      <div className="mia-texte">
        {contenu ? (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{contenu}</ReactMarkdown>
        ) : (
          <p style={{ opacity: 0.6 }}>…</p>
        )}
      </div>
      {meta?.actions?.length ? <Actes actes={meta.actions} /> : null}
      {meta?.citations?.length ? <Sources sources={meta.citations} /> : null}
    </div>
  );
}

/* Ce que M.I.A a fait. Les pastilles vertes arrondies disaient
   « Tâche ajoutée : … » détachées du texte ; c'est un relevé, pas une
   décoration, et un relevé se lit en colonne. */
const ACTES: Record<string, { verbe: string; route?: (id?: string) => string }> = {
  create_goal: { verbe: "objectif créé", route: (id) => `/goals/${id}` },
  create_habit_goal: { verbe: "habitude créée", route: (id) => `/goals/${id}` },
  create_todo: { verbe: "tâche ajoutée", route: () => "/todo" },
  complete_todo: { verbe: "tâche cochée", route: () => "/todo" },
  reschedule_todo: { verbe: "tâche replanifiée", route: () => "/todo" },
  complete_step: { verbe: "étape cochée" },
  add_step: { verbe: "étape ajoutée" },
  reschedule_step: { verbe: "étape replanifiée" },
  create_journal_entry: { verbe: "entrée écrite", route: () => "/journal" },
  create_calendar_event: { verbe: "évènement posé", route: () => "/calendar" },
  add_wishlist_item: { verbe: "souhait ajouté", route: () => "/wishlist" },
};

function Actes({ actes }: { actes: ActeMia[] }) {
  const navigate = useNavigate();
  return (
    <div className="mia-actes">
      {actes.map((a, i) => {
        const meta = ACTES[a.tool] ?? { verbe: a.tool };
        const ouvrable = a.status === "ok" && !!meta.route;
        return (
          <div key={`${a.tool}-${i}`} className="mia-acte" data-etat={a.status}>
            <i />
            {meta.verbe} <b title={a.error ?? a.label}>{a.label}</b>
            {ouvrable && (
              <button
                type="button"
                className="mia-acte-lien"
                onClick={() => navigate(meta.route!(a.ref_id))}
              >
                ouvrir
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

const OU_VA: Record<string, (id: string) => string> = {
  journal_entry: () => "/journal",
  decision: () => "/reviews",
  weekly_review: () => "/reviews",
  goal: (id) => `/goals/${id}`,
};

const NOM_SOURCE: Record<string, string> = {
  journal_entry: "Journal",
  decision: "Décision",
  weekly_review: "Revue",
  goal: "Objectif",
};

function Sources({ sources }: { sources: SourceMia[] }) {
  const navigate = useNavigate();
  return (
    <div className="mia-sources">
      {sources.slice(0, 6).map((s, i) => (
        <button
          key={`${s.source_type}-${s.source_id}-${i}`}
          type="button"
          className="mia-source"
          title={s.snippet}
          onClick={() => {
            const aller = OU_VA[s.source_type];
            if (aller) navigate(aller(s.source_id));
          }}
        >
          {NOM_SOURCE[s.source_type] ?? s.source_type}
        </button>
      ))}
    </div>
  );
}
