import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useReducedMotion } from "framer-motion";
import { Play, Pause, Square, Volume2, VolumeX, Check } from "lucide-react";
import { useAuth } from "@/socle/contextes/AuthContext";
import { useBilanDuSouffle, useEnregistrerSeance } from "@/domaines/sante/hooks/useSouffle";
import {
  SCHEMAS, CIBLES, CIBLE_PAR_DEFAUT, schemaDe, sequenceDe,
  rythmeSuggere, partiesDeDuree, type Temps,
  COURBE_INSPIRE, COURBE_EXPIRE, R_PHASE, R_SEANCE, CIRC, HAUTEURS,
} from "@/domaines/sante/logique/souffle";
import { PREF } from "@/socle/outils/preferencesAffichage";
import type { Etat } from "@/domaines/sante/types";
import type { RespirationProps } from "@/domaines/sante/types";

/* ═══════════════════════════════════════════════════════════════
   LE PROTOCOLE

   L exercice etait cache derriere une icone, dans une fenetre, avec un
   seul rythme. Il est sur la page, ouvert. Ce fichier ajoute ce qui lui
   manquait encore :

   UNE FORME. « CYCLES 3 » etait un nombre mort — ni terme, ni but. On
   choisit desormais ou l on va (3, 6 ou 10 cycles) et l anneau se
   remplit vers la. Une seance a une fin, et une fin se recolte.

   UNE ANTICIPATION. On ignorait quand la phase allait tourner jusqu a
   ce qu elle tourne ; sur un 4-7-8, les sept secondes de retention
   paraissaient sans fin. Un second anneau se vide sur le temps en cours.

   UN SOUFFLE, PAS UN GONFLEMENT. Une seule courbe easeInOut servait aux
   deux sens. L inspiration est active — elle part vite et s installe ;
   l expiration est passive — elle s amorce doucement puis se relache.
   Deux courbes, et ca cesse de ressembler a une div qui grossit.

   UNE MEMOIRE. La seance s ecrit dans seances_de_souffle. De la
   viennent la serie et le total respire.

   NI SCORE NI PALIER. Respirer est le seul geste de l application dont
   le but est de faire baisser la pression. Un palier creerait une
   dette : on ne serait plus a quatre seances, on serait a
   quatre-vingt-seize du prochain titre.
   ═══════════════════════════════════════════════════════════════ */


/* Les deux courbes du souffle. L inspiration attaque et s installe ;
   l expiration s amorce doucement et se relache. */

export function Respiration({ stress, chargeMentale }: RespirationProps) {
  const { t } = useTranslation();
  const sobre = useReducedMotion();
  const { user } = useAuth();

  const bilan = useBilanDuSouffle(user?.id);
  const enregistrer = useEnregistrerSeance(user?.id);

  const suggestion = useMemo(() => rythmeSuggere(stress, chargeMentale), [stress, chargeMentale]);

  const [schemaId, setSchemaId] = useState<string>(suggestion.rythme);
  const [cible, setCible] = useState<number>(CIBLE_PAR_DEFAUT);
  const [etat, setEtat] = useState<Etat>("repos");
  const [pas, setPas] = useState(0);
  const [reste, setReste] = useState(0);
  const [tours, setTours] = useState(0);
  const [son, setSon] = useState(false);

  const commenceeA = useRef<Date | null>(null);

  /* LA DUREE SE PREND A L HORLOGE, PAS AU COMPTEUR.
     Une premiere version incrementait un compteur a chaque battement et
     stockait le total. Mesure faite sur une seance de trois cycles de
     coherence : trente battements comptes pour trente-neuf secondes
     reelles — un onglet en arriere-plan bride setInterval, et la duree
     enregistree mentait de pres d un quart. On accumule donc du temps
     mural, pauses deduites. */
  const acquis = useRef(0);
  const repriseA = useRef<number | null>(null);
  const minuteur = useRef<ReturnType<typeof setInterval> | null>(null);
  const audio = useRef<AudioContext | null>(null);

  const schema = useMemo(() => schemaDe(schemaId), [schemaId]);
  const sequence = useMemo(() => sequenceDe(schema), [schema]);
  const tempsCourant = sequence[pas] ?? sequence[0];

  /* Le reglage du son survit a la session : on ne le remet pas a chaque
     ouverture de la page. */
  useEffect(() => {
    try { setSon(localStorage.getItem(PREF.SOUFFLE_SON) === "1"); } catch { /* stockage indisponible */ }
  }, []);

  const basculerSon = useCallback(() => {
    setSon((v) => {
      const suivant = !v;
      try { localStorage.setItem(PREF.SOUFFLE_SON, suivant ? "1" : "0"); } catch { /* idem */ }
      return suivant;
    });
  }, []);

  /* Un souffle bref au changement de temps, pour pouvoir fermer les
     yeux — ce qui est quand meme l objectif. Le son n est jamais
     essentiel : toute erreur ici est avalee. */
  const marquer = useCallback((nom: Temps | undefined) => {
    if (!son || !nom) return;
    try {
      const ctx = (audio.current ??= new AudioContext());
      if (ctx.state === "suspended") void ctx.resume();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = HAUTEURS[nom];
      g.gain.setValueAtTime(0, ctx.currentTime);
      g.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
      o.connect(g); g.connect(ctx.destination);
      o.start();
      o.stop(ctx.currentTime + 0.42);
    } catch { /* le son n est pas essentiel */ }
  }, [son]);

  const secondesTenues = useCallback(() => {
    const enCours = repriseA.current !== null ? (Date.now() - repriseA.current) / 1000 : 0;
    return Math.round(acquis.current + enCours);
  }, []);

  const remettre = useCallback(() => {
    setPas(0);
    setTours(0);
    setReste(sequence[0]?.duree ?? 0);
    commenceeA.current = null;
    acquis.current = 0;
    repriseA.current = null;
  }, [sequence]);

  /* Le chronometre suit l etat : il court en seance, il s arrete des
     qu on met en pause ou qu on clot. */
  useEffect(() => {
    if (etat === "cours") { repriseA.current = Date.now(); return; }
    if (repriseA.current !== null) {
      acquis.current += (Date.now() - repriseA.current) / 1000;
      repriseA.current = null;
    }
  }, [etat]);

  /* Changer de rythme remet la seance a zero : on ne melange pas deux
     protocoles dans un meme decompte. */
  useEffect(() => { setEtat("repos"); remettre(); }, [schemaId, remettre]);

  const clore = useCallback((acheve: boolean) => {
    const debut = commenceeA.current;
    /* Lu AVANT le changement d etat : l effet qui arrete le chronometre
       ne s est pas encore execute. */
    const duree = secondesTenues();
    setEtat(acheve ? "fini" : "repos");

    /* On n ecrit que si quelque chose a eu lieu. Une seance ouverte puis
       fermee aussitot n est pas une seance. */
    if (debut && tours >= 1 && user?.id) {
      enregistrer.mutate({
        rythme: schemaId,
        cyclesVises: cible,
        cyclesTenus: tours,
        dureeSecondes: duree,
        commenceeA: debut,
      });
    }
    if (!acheve) remettre();
  }, [tours, cible, schemaId, user?.id, enregistrer, remettre, secondesTenues]);

  const demarrer = useCallback(() => {
    if (etat === "fini") remettre();
    if (!commenceeA.current) commenceeA.current = new Date();
    if (etat === "repos" || etat === "fini") setReste(sequence[0]?.duree ?? 0);
    setEtat("cours");
    marquer(sequence[0]?.nom);
  }, [etat, sequence, remettre, marquer]);

  /* ── LE BATTEMENT ─────────────────────────────────────────── */
  useEffect(() => {
    if (etat !== "cours") {
      if (minuteur.current) { clearInterval(minuteur.current); minuteur.current = null; }
      return;
    }
    minuteur.current = setInterval(() => {
      setReste((r) => {
        if (r > 1) return r - 1;
        setPas((p) => {
          const suivant = (p + 1) % sequence.length;
          if (suivant === 0) setTours((c) => c + 1);
          setReste(sequence[suivant].duree);
          marquer(sequence[suivant].nom);
          return suivant;
        });
        return 0;
      });
    }, 1000);
    return () => { if (minuteur.current) clearInterval(minuteur.current); };
  }, [etat, sequence, marquer]);

  /* La cible atteinte clot la seance d elle-meme. C est ce qui donne
     une fin a l exercice — et donc un debut a autre chose. */
  useEffect(() => {
    if (etat === "cours" && cible > 0 && tours >= cible) clore(true);
  }, [etat, tours, cible, clore]);

  /* Le retour au repos apres la recolte, sans que l on ait a cliquer. */
  useEffect(() => {
    if (etat !== "fini") return;
    const t = setTimeout(() => { setEtat("repos"); remettre(); }, 5000);
    return () => clearTimeout(t);
  }, [etat, remettre]);

  useEffect(() => () => { void audio.current?.close(); }, []);

  const actif = etat === "cours" || etat === "pause";

  /* ── L IRIS ───────────────────────────────────────────────── */
  /* Une seule variable pilote les six segments : ouvert a
     l inspiration et pendant la retenue, ferme a l expiration et
     pendant la pause. */
  const ouverture = !actif ? 0.62
    : tempsCourant?.nom === "inspire" || tempsCourant?.nom === "retiens" ? 1
    : 0;

  const courbe = tempsCourant?.nom === "inspire" ? COURBE_INSPIRE : COURBE_EXPIRE;
  const dureeIris = !actif || sobre ? 0.5 : (tempsCourant?.duree ?? 1);

  const partSeance = cible > 0 ? Math.min(1, tours / cible) : 0;
  const { heures, minutes } = partiesDeDuree(bilan.total);

  return (
    <section
      className="hlt-protocole"
      data-actif={actif || etat === "fini" ? "1" : "0"}
      data-temps={actif ? tempsCourant?.nom : "repos"}
    >
      <h2 className="hlt-titre">
        {t("health.breath.protocol", "Protocole")}
        {bilan.serie > 0 && <b>{t("health.breath.streak", { count: bilan.serie })}</b>}
      </h2>

      <div className="hlt-bande">
        <div
          className="hlt-rond"
          style={{
            ["--ouv" as string]: ouverture,
            ["--duree" as string]: `${dureeIris}s`,
            ["--courbe" as string]: courbe,
          }}
        >
          {/* Les deux anneaux ne s affichent qu en seance : au repos ils
              n auraient rien a mesurer. */}
          {actif && (
            <svg viewBox="0 0 100 100" aria-hidden="true">
              {/* L anneau de seance : ou l on en est de la cible. */}
              <circle className="hlt-arc-fond" cx="50" cy="50" r={R_SEANCE} />
              <circle
                className="hlt-arc-seance" cx="50" cy="50" r={R_SEANCE}
                strokeDasharray={CIRC(R_SEANCE)}
                strokeDashoffset={CIRC(R_SEANCE) * (1 - partSeance)}
              />
              {/* L anneau de phase : il se vide sur le temps en cours.
                  La cle le remonte a chaque temps, ce qui relance
                  l animation depuis le debut. */}
              <circle
                key={`${pas}-${tours}`}
                className="hlt-arc-phase" cx="50" cy="50" r={R_PHASE}
                strokeDasharray={CIRC(R_PHASE)}
                style={{
                  ["--circ" as string]: CIRC(R_PHASE),
                  animationDuration: `${tempsCourant?.duree ?? 1}s`,
                  animationPlayState: etat === "pause" ? "paused" : "running",
                }}
              />
            </svg>
          )}

          {/* L IRIS : six segments chanfreines, un diaphragme d objectif
              plutot qu une bulle lumineuse. */}
          <div className="hlt-iris" aria-hidden="true">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <i key={i} style={{ ["--a" as string]: `${i * 60}deg` }} />
            ))}
          </div>

        </div>

        {/* LA LECTURE EST SORTIE DU CERCLE. Un vrai diaphragme couvre son
            centre en se fermant — le compteur pose dessus devenait
            illisible des que les lames se rejoignaient. Il se lit
            maintenant sous le mecanisme, ce qui laisse l iris aller au
            bout de sa fermeture. */}
        <div className="hlt-lecture">
          {etat === "fini" ? (
            <b className="hlt-fini"><Check aria-hidden="true" />{t("health.breath.done", "Séance close")}</b>
          ) : actif ? (
            <>
              <b>{t(`health.breath.phase.${tempsCourant?.nom}`, tempsCourant?.nom ?? "")}</b>
              <span>{reste}</span>
              <u>{tours}<s> / {cible}</s></u>
            </>
          ) : null}
        </div>

        <div className="hlt-bande-mots">
          <h3>{t(`health.breath.pattern.${schema.id}.nom`, schema.id)}</h3>
          <p>{t(`health.breath.pattern.${schema.id}.quoi`, "")}</p>
        </div>

        <div className="hlt-reglages">
          <div className="hlt-schemas" role="group" aria-label={t("health.breath.choose", "Choisir un rythme")}>
            {SCHEMAS.map((s) => {
              const propose = s.id === suggestion.rythme && s.id !== schemaId;
              return (
                <button
                  key={s.id}
                  type="button"
                  className="hlt-schema"
                  data-suggere={propose ? "1" : undefined}
                  aria-pressed={s.id === schemaId}
                  title={propose ? t(`health.breath.why.${suggestion.motif}`, "") : undefined}
                  onClick={() => setSchemaId(s.id)}
                >
                  {t(`health.breath.pattern.${s.id}.nom`, s.id)}
                  <i>{s.temps.filter((n) => n > 0).join("-")}</i>
                </button>
              );
            })}
          </div>

          {/* LA CIBLE. On choisit ou l on va avant de partir : c est ce
              qui donne une fin a la seance. */}
          <div className="hlt-cibles" role="group" aria-label={t("health.breath.target", "Cycles visés")}>
            <u>{t("health.breath.target", "Cycles visés")}</u>
            {CIBLES.map((n) => (
              <button
                key={n}
                type="button"
                className="hlt-cible"
                aria-pressed={n === cible}
                disabled={actif}
                onClick={() => setCible(n)}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div className="hlt-gestes">
          <button
            type="button"
            className="hlt-bouton"
            data-ton="souffle"
            onClick={() => (etat === "cours" ? setEtat("pause") : demarrer())}
          >
            {etat === "cours" ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
            {etat === "cours"
              ? t("health.breath.pause", "Pause")
              : etat === "pause"
                ? t("health.breath.resume", "Reprendre")
                : t("health.breath.start", "Commencer")}
          </button>

          {actif && (
            <button type="button" className="hlt-bouton" data-ton="sobre" onClick={() => clore(false)}>
              <Square aria-hidden="true" />
              {t("health.breath.stop", "Terminer")}
            </button>
          )}

          <button
            type="button"
            className="hlt-son"
            aria-pressed={son}
            onClick={basculerSon}
            title={t(son ? "health.breath.soundOff" : "health.breath.soundOn", "Repère sonore")}
            aria-label={t(son ? "health.breath.soundOff" : "health.breath.soundOn", "Repère sonore")}
          >
            {son ? <Volume2 aria-hidden="true" /> : <VolumeX aria-hidden="true" />}
          </button>

          {/* LE TOTAL. Un chiffre calme, sans badge ni niveau. */}
          {bilan.total > 0 && (
            <span className="hlt-tours">
              {t("health.breath.breathed", "Respiré")}{" "}
              <b>
                {heures > 0
                  ? t("health.breath.hoursMinutes", { heures, minutes })
                  : t("health.breath.minutes", { count: minutes })}
              </b>
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
