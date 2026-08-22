import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "framer-motion";
import { Play, Pause, RotateCcw } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   LE PROTOCOLE, EN PIED DE DOSSIER

   L exercice etait cache derriere une icone de la barre de titre, dans
   une fenetre, avec un seul rythme : quatre temps, quatre temps,
   quatre temps, deux. Le meme pour s endormir et pour se calmer avant
   de parler en public — alors que ce ne sont pas les memes besoins.

   Il ferme maintenant le dossier, en bande pleine largeur : la fiche
   dit ou l on en est, le journal ce qu on doit, le protocole ce qu on
   peut faire tout de suite.

   LA BANDE SE DEPLIE QUAND ON COMMENCE. Au repos elle tient en soixante
   pixels de haut — c est une ligne du dossier. Des qu on lance
   l exercice, le cercle prend la place qu il lui faut : on ne respire
   pas en regardant une vignette.

   QUATRE RYTHMES, NOMMES PAR CE QU ON VIENT CHERCHER. « 4-7-8 » ne dit
   rien a personne ; « dormir » se choisit sans reflechir. Le detail des
   temps reste affiche pour qui le veut, en petit.
   ═══════════════════════════════════════════════════════════════ */

type Temps = "inspire" | "retiens" | "expire" | "pause";

interface Schema {
  id: string;
  /** Les quatre temps, en secondes. Zero saute le temps. */
  temps: [number, number, number, number];
}

/* Des classiques, pas des inventions : coherence cardiaque (5-5),
   boite (4-4-4-4), 4-7-8 pour l endormissement, et un apaisement
   rapide ou l expiration domine. */
const SCHEMAS: Schema[] = [
  { id: "coherence", temps: [5, 0, 5, 0] },
  { id: "boite", temps: [4, 4, 4, 4] },
  { id: "apaiser", temps: [4, 0, 6, 0] },
  { id: "dormir", temps: [4, 7, 8, 0] },
];

const ORDRE: Temps[] = ["inspire", "retiens", "expire", "pause"];

export function Respiration() {
  const { t } = useTranslation();
  const sobre = useReducedMotion();

  const [schemaId, setSchemaId] = useState<string>("coherence");
  const [enCours, setEnCours] = useState(false);
  const [pas, setPas] = useState(0);
  const [reste, setReste] = useState(SCHEMAS[0].temps[0]);
  const [tours, setTours] = useState(0);
  const minuteur = useRef<ReturnType<typeof setInterval> | null>(null);

  const schema = useMemo(() => SCHEMAS.find((s) => s.id === schemaId) ?? SCHEMAS[0], [schemaId]);

  /* Les temps a zero sont sautes : la coherence cardiaque n a pas de
     retenue, et afficher « retiens — 0 s » serait absurde. */
  const sequence = useMemo(
    () => ORDRE.map((nom, i) => ({ nom, duree: schema.temps[i] })).filter((x) => x.duree > 0),
    [schema],
  );

  const remettre = useCallback(() => {
    setEnCours(false);
    setPas(0);
    setTours(0);
    setReste(sequence[0]?.duree ?? 0);
  }, [sequence]);

  useEffect(() => { remettre(); }, [schemaId, remettre]);

  useEffect(() => {
    if (!enCours) {
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
          return suivant;
        });
        return 0;
      });
    }, 1000);
    return () => { if (minuteur.current) clearInterval(minuteur.current); };
  }, [enCours, sequence]);

  const tempsCourant = sequence[pas] ?? sequence[0];

  /* LE CERCLE EST L EXERCICE. Il enfle a l inspiration, tient pendant
     la retenue, se retire a l expiration : on respire en le suivant,
     sans avoir a lire un chiffre. */
  const echelle = !enCours ? 0.62
    : tempsCourant?.nom === "inspire" ? 1
    : tempsCourant?.nom === "expire" ? 0.55
    : tempsCourant?.nom === "retiens" ? 1
    : 0.55;

  return (
    <section className="hlt-protocole" data-actif={enCours ? "1" : "0"}>
      <h2 className="hlt-titre">{t("health.breath.protocol", "Protocole")}</h2>

      <div className="hlt-bande">
        <div className="hlt-rond">
          <span className="hlt-rond-halo" aria-hidden="true" />
          <motion.span
            className="hlt-rond-noyau"
            aria-hidden="true"
            animate={{ scale: echelle }}
            transition={sobre
              ? { duration: 0 }
              : { duration: enCours ? (tempsCourant?.duree ?? 1) : 0.6, ease: "easeInOut" }}
          />
          <span className="hlt-rond-texte">
            <b>{enCours ? t(`health.breath.phase.${tempsCourant?.nom}`, tempsCourant?.nom ?? "") : t("health.breath.ready", "Prêt")}</b>
            {enCours && <span>{reste}</span>}
          </span>
        </div>

        <div className="hlt-bande-mots">
          <h3>{t(`health.breath.pattern.${schema.id}.nom`, schema.id)}</h3>
          <p>{t(`health.breath.pattern.${schema.id}.quoi`, "")}</p>
        </div>

        <div className="hlt-schemas" role="group" aria-label={t("health.breath.choose", "Choisir un rythme")}>
          {SCHEMAS.map((s) => (
            <button
              key={s.id}
              type="button"
              className="hlt-schema"
              aria-pressed={s.id === schemaId}
              onClick={() => setSchemaId(s.id)}
            >
              {t(`health.breath.pattern.${s.id}.nom`, s.id)}
              <i>{s.temps.filter((n) => n > 0).join("-")}</i>
            </button>
          ))}
        </div>

        <div className="hlt-gestes">
          <button type="button" className="hlt-bouton" data-ton="souffle" onClick={() => setEnCours((v) => !v)}>
            {enCours ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
            {enCours ? t("health.breath.pause", "Pause") : t("health.breath.start", "Commencer")}
          </button>
          <button type="button" className="hlt-bouton" data-ton="sobre" onClick={remettre}>
            <RotateCcw aria-hidden="true" />
            {t("health.breath.reset", "Reprendre")}
          </button>
          <span className="hlt-tours">
            {t("health.breath.cycles", "Cycles")} <b>{tours}</b>
          </span>
        </div>
      </div>
    </section>
  );
}
