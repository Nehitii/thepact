import { AnimatePresence, motion } from "framer-motion";
import { NOMS_DES_PALIERS, PACTE, RANG, type ObjectifDuScenario } from "@/domaines/accueil/logique/scenarioDuTableau";
import { dateLongue, lireDate, nombre } from "@/domaines/accueil/logique/lectureDuTableau";
import { etapesRestantes, RYTHME, VALEUR_DE_L_OBJECTIF, type Valeur } from "@/domaines/accueil/logique/scenarioEtendu";
import type { DonneesDuTableau } from "@/domaines/accueil/composants/refonte/communs";
import { Cachet, Tampon } from "@/domaines/accueil/composants/refonte/PiecesDuDossier";

/* LES FEUILLETS DE DROITE.
 *
 * Trois pieces, une seule place : changer d onglet fait glisser le
 * feuillet de cote au lieu de le remplacer — on sent que les autres
 * pieces sont toujours dans la chemise.
 *
 * LA BARRE DE LA MACHINE A ECRIRE. Un avancement se tape en X et en
 * tirets, a largeur fixe : c est la seule jauge qu une machine sache
 * faire, et elle se lit mieux qu une barre coloree sur ce papier. */

export type Onglet = "pacte" | "objectifs" | "rang";

function barre(part: number, largeur = 24): string {
  const pleins = Math.round(Math.max(0, Math.min(1, part)) * largeur);
  return `[${"X".repeat(pleins)}${"-".repeat(largeur - pleins)}]`;
}

/* « 30/06/2029 » : la date tapee d un formulaire. Le jour civil ne se
   fabrique qu a un endroit (socle/outils/jour) ; l affichage passe par
   Intl, comme le reste de la lecture. */
const date = (iso: string) =>
  lireDate(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });

function Piece({ o, n }: { o: ObjectifDuScenario; n: number }) {
  const part = o.habitude ? o.habitude.coches / o.habitude.jours : o.faites / Math.max(1, o.etapes);
  const compte = o.habitude ? `${o.habitude.coches}/${o.habitude.jours} j` : `${o.faites}/${o.etapes}`;
  return (
    <li className="do-piece">
      <span className="do-tape do-numero">N° {String(n).padStart(2, "0")}</span>
      <div className="do-piece-corps">
        <p className="do-tape">
          <b>{o.nom}</b>
          <span className="do-imprime do-code"> Pal. {NOMS_DES_PALIERS[o.difficulte]}</span>
        </p>
        <p className="do-tape do-jauge">
          {barre(part, 20)} {compte}
          {o.echeance && o.statut !== "fully_completed" && <span className="do-discret"> · éch. {date(o.echeance)}</span>}
        </p>
        {o.prochaine && o.statut === "in_progress" && <p className="do-tape do-suite">→ {o.prochaine.titre}</p>}
      </div>
      <span className="do-piece-visa">
        {o.statut === "fully_completed" && <Tampon encre="violette" taille="petit" rotation={-7}>Tenu</Tampon>}
        {o.statut === "not_started" && <Tampon encre="violette" taille="petit" rotation={4} className="do-pale">Pas ouvert</Tampon>}
      </span>
    </li>
  );
}

function PacteEtDelai({ maintenant, lecture, objectifs }: DonneesDuTableau) {
  const restantes = etapesRestantes(objectifs);
  const parEtape = lecture.restants / Math.max(1, restantes);
  const rythme = RYTHME.jours / RYTHME.etapes;
  const tient = rythme <= parEtape;
  return (
    <>
      <p className="do-imprime">Fiche signalétique du pacte · N° 0001</p>
      <dl className="do-champs">
        <div><dt className="do-imprime">Nom</dt><dd className="do-tape"><b>{PACTE.nom.toUpperCase()}</b></dd></div>
        <div><dt className="do-imprime">Raison</dt><dd className="do-tape">« {PACTE.mantra} »</dd></div>
        <div><dt className="do-imprime">Juré le</dt><dd className="do-tape">{dateLongue(PACTE.debut, maintenant)}</dd></div>
        <div><dt className="do-imprime">Terme</dt><dd className="do-tape">{dateLongue(PACTE.fin, maintenant)}</dd></div>
        <div>
          <dt className="do-imprime">Valeurs, dans l’ordre</dt>
          <dd className="do-tape">{PACTE.valeurs.map((v, i) => `${i + 1}. ${v}`).join("   ")}</dd>
        </div>
      </dl>

      <div className="do-delai">
        <Tampon encre="rouge" rotation={-5} taille="grand" className="do-reste-tampon">
          <i>Reste</i><b>{nombre(lecture.restants)}</b><i>jours</i>
        </Tampon>
        <div>
          <p className="do-tape do-jauge">{barre(lecture.pctTemps / 100, 28)}</p>
          <p className="do-tape">Jour {nombre(lecture.jour)} sur {nombre(lecture.jours)} — {Math.round(lecture.pctTemps)} % écoulé.</p>
        </div>
      </div>

      <section className="do-tient" aria-labelledby="do-tient">
        <h3 id="do-tient" className="do-imprime">Le plan tient-il dans le délai ?</h3>
        <p className="do-tape">
          Étapes restantes : {restantes}. Jours restants : {nombre(lecture.restants)}.
          Il faut une étape tous les {parEtape.toFixed(1).replace(".", ",")} jours.
        </p>
        <p className="do-tape">
          Rythme des {RYTHME.jours} derniers jours : {RYTHME.etapes} étapes, une tous les {rythme.toFixed(1).replace(".", ",")} jours.
        </p>
        <Tampon encre={tient ? "violette" : "rouge"} rotation={-3} className="do-verdict">
          {tient ? "Le plan tient" : "En retard"}
        </Tampon>
      </section>

      <footer className="do-signature">
        <p className="do-tape">Signé,</p>
        <p className="do-paraphe">{PACTE.nom}</p>
      </footer>
      <Cachet nom={PACTE.nom} valeurs={PACTE.valeurs} version={PACTE.version} />
    </>
  );
}

function Inventaire({ objectifs }: DonneesDuTableau) {
  const valeurs: Valeur[] = ["Liberté", "Discipline", "Création"];
  let n = 0;
  return (
    <>
      <p className="do-imprime">Inventaire des objectifs · {objectifs.length} pièces</p>
      {valeurs.map((v) => {
        const liste = objectifs.filter((o) => VALEUR_DE_L_OBJECTIF[o.id] === v)
          .sort((a, b) => (a.statut === "fully_completed" ? 1 : 0) - (b.statut === "fully_completed" ? 1 : 0));
        return (
          <section key={v} className="do-valeur" aria-label={`Au titre de la valeur ${v}`}>
            <h3 className="do-imprime">Au titre de : <span className="do-tape">{v}</span></h3>
            <ol>{liste.map((o) => <Piece key={o.id} o={o} n={++n} />)}</ol>
          </section>
        );
      })}
    </>
  );
}

function Brevet() {
  const part = RANG.xp / RANG.cible;
  return (
    <>
      <p className="do-imprime">Brevet de rang</p>
      <p className="do-tape do-brevet">Le porteur du pacte {PACTE.nom} est reconnu</p>
      <p className="do-rang">{RANG.nom}</p>
      <p className="do-tape">au niveau {RANG.niveau}.</p>
      <p className="do-tape do-jauge">{barre(part, 28)} {nombre(RANG.xp)} / {nombre(RANG.cible)} points</p>
      <p className="do-tape">Il lui manque {nombre(RANG.cible - RANG.xp)} points pour être fait {RANG.suivant}.</p>
      <Tampon encre="violette" rotation={-9} taille="grand" className="do-brevet-tampon">Visé</Tampon>
    </>
  );
}

export function FeuilletsDuDossier(props: DonneesDuTableau & { onglet: Onglet }) {
  const { onglet } = props;
  return (
    <div className="do-pile">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div key={onglet} role="tabpanel" className="do-feuillet"
          initial={{ x: 60, opacity: 0, rotate: 0.6 }} animate={{ x: 0, opacity: 1, rotate: 0 }}
          exit={{ x: -40, opacity: 0, rotate: -0.8 }} transition={{ duration: 0.36, ease: [0.2, 0.8, 0.2, 1] }}>
          {onglet === "pacte" && <PacteEtDelai {...props} />}
          {onglet === "objectifs" && <Inventaire {...props} />}
          {onglet === "rang" && <Brevet />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
