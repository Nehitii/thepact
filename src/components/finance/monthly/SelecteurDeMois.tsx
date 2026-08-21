/**
 * LA GRILLE DES DOUZE MOIS.
 *
 * Regler une cadence demandait deux gestes qui ne se ressemblent pas :
 * choisir « trimestriel » dans une liste, puis designer un mois
 * d ancrage dans un selecteur natif — et comprendre au passage que le
 * second decidait des trois autres. Personne ne le comprenait.
 *
 * Douze cases disent la meme chose sans rien expliquer : on coche les
 * mois ou la charge tombe. La cadence n est plus une question posee,
 * c est une consequence lue.
 *
 * DEUX GESTES SUFFISENT.
 *
 * Cocher janvier, puis avril : l ecart se lit, et juillet et octobre
 * s allument seuls. C est la que se joue l essentiel du confort — une
 * charge trimestrielle est le cas courant, et quatre clics pour la
 * decrire seraient trois de trop.
 *
 * Le reste du temps, une case se coche et se decoche comme une case,
 * sans malice. La verdict-line sous la grille dit en permanence ce
 * qu on vient de decrire, et propose de rattraper quand la selection
 * ne se repete pas d une annee sur l autre.
 */
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Wand2 } from 'lucide-react';
import {
  motifDepuisMois, regulariser, moisDuMotif, cadenceDe,
} from '@/lib/finance/cadence';

interface Props {
  /** Les mois coches, par indice de 0 a 11. */
  mois: number[];
  onChange: (mois: number[]) => void;
  /** Le mois en cours, souligne dans la grille. */
  moisCourant?: number;
}

export function SelecteurDeMois({ mois, onChange, moisCourant }: Props) {
  const { t, i18n } = useTranslation();

  /* Les noms de mois viennent de la locale et non d un tableau ecrit
     a la main : la grille se traduit ainsi toute seule. */
  const noms = useMemo(() => {
    const f = new Intl.DateTimeFormat(i18n.language, { month: 'short' });
    return Array.from({ length: 12 }, (_, m) => f.format(new Date(2026, m, 1)).replace('.', ''));
  }, [i18n.language]);

  const coches = useMemo(() => new Set(mois), [mois]);
  const motif = useMemo(() => motifDepuisMois(mois), [mois]);
  const secours = useMemo(() => (motif ? null : regulariser(mois)), [motif, mois]);

  const basculer = (m: number) => {
    const suivant = coches.has(m) ? mois.filter((x) => x !== m) : [...mois, m];

    /* LE SECOND CLIC EST CELUI QUI COMPTE.
       Passer de un mois a deux, c est enoncer un ecart — et c est le
       seul moment ou le completer automatiquement ne trahit aucune
       intention, puisqu il n y a rien d autre a preserver. Au-dela, on
       ne touche plus a rien : une case se decoche comme elle se coche,
       et la ligne de verdict se charge de signaler l irregularite. */
    if (suivant.length === 2 && !motifDepuisMois(suivant)) {
      const complet = regulariser(suivant);
      if (complet) return onChange(moisDuMotif(complet));
    }
    onChange(suivant.sort((a, b) => a - b));
  };

  const appliquer = () => { if (secours) onChange(moisDuMotif(secours)); };

  /* DEUX RACCOURCIS, PARCE QUE DEUX EXTREMES SE SAISISSENT MAL A LA
     MAIN. Douze cases a cocher une par une pour un loyer, ou onze a
     decocher pour un impot trimestriel : dans les deux sens, la
     grille seule ferait perdre du temps la ou elle devait en faire
     gagner. Chacun ne parait que quand il a un effet. */
  const tousLesMois = Array.from({ length: 12 }, (_, m) => m);
  const peutTout = mois.length < 12;
  const peutRien = mois.length > 0;

  const nomCadence = motif
    ? cadenceDe({ amount: 0, is_active: true, periode_mois: motif.periode, mois_ancre: `2026-${String(motif.ancre + 1).padStart(2, '0')}-01` })
    : null;

  return (
    <div className="cy-grille-mois">
      <div className="cy-mois-cases" role="group" aria-label={t('finance.grille.legende', 'Les mois où elle tombe')}>
        {noms.map((nom, m) => (
          <button
            key={m}
            type="button"
            role="checkbox"
            aria-checked={coches.has(m)}
            className="cy-mois-case"
            data-coche={coches.has(m) ? '1' : '0'}
            data-courant={m === moisCourant ? '1' : '0'}
            onClick={() => basculer(m)}
          >
            {nom}
          </button>
        ))}
      </div>

      {(peutTout || peutRien) && (
        <div className="cy-mois-raccourcis">
          {peutTout && (
            <button type="button" onClick={() => onChange(tousLesMois)}>
              {t('finance.grille.tous', 'Tous les mois')}
            </button>
          )}
          {peutRien && (
            <button type="button" onClick={() => onChange([])}>
              {t('finance.grille.effacer', 'Effacer')}
            </button>
          )}
        </div>
      )}

      {/* LE VERDICT.
          La grille ne se contente pas d enregistrer des clics : elle
          dit a chaque instant ce qu on vient de decrire. Sans cela,
          quatre cases allumees ne se distinguent pas d un trimestre
          reussi par hasard. */}
      <p className="cy-mois-verdict" data-etat={mois.length === 0 ? 'vide' : motif ? 'bon' : 'casse'}>
        {mois.length === 0 ? (
          t('finance.grille.invite', 'Coche les mois où elle tombe')
        ) : motif ? (
          <>
            <Check aria-hidden="true" />
            <b>{t(`finance.cadence.${nomCadence}`, nomCadence ?? '')}</b>
            <span>
              {motif.periode === 1
                ? t('finance.grille.tousLesMois', 'elle part tous les mois')
                : t('finance.grille.foisParAn', {
                    count: 12 / motif.periode,
                    defaultValue: `${12 / motif.periode} fois par an`,
                  })}
            </span>
          </>
        ) : (
          <>
            <span>{t('finance.grille.irregulier', 'Ce motif ne se répète pas d’une année sur l’autre.')}</span>
            {secours && (
              <button type="button" className="cy-mois-rattrape" onClick={appliquer}>
                <Wand2 aria-hidden="true" />
                {moisDuMotif(secours).map((m) => noms[m]).join(' · ')}
              </button>
            )}
          </>
        )}
      </p>
    </div>
  );
}

/**
 * LA BANDE DES DOUZE MOIS, EN LECTURE.
 *
 * C est la meme grille, en petit et sans clic : ce qu on regle dans le
 * panneau de saisie est exactement ce qu on relit dans la liste. Une
 * ligne annuelle affichait « juin » perdu au milieu d une colonne
 * vide ; elle montre desormais l annee entiere avec juin allume, et
 * l oeil comprend la cadence avant d avoir lu le mot.
 */
export function BandeDesMois({ mois, moisCourant, titre }: { mois: number[]; moisCourant?: number; titre?: string }) {
  const { i18n } = useTranslation();
  const noms = useMemo(() => {
    const f = new Intl.DateTimeFormat(i18n.language, { month: 'narrow' });
    const l = new Intl.DateTimeFormat(i18n.language, { month: 'long' });
    return Array.from({ length: 12 }, (_, m) => ({
      court: f.format(new Date(2026, m, 1)),
      long: l.format(new Date(2026, m, 1)),
    }));
  }, [i18n.language]);
  const coches = useMemo(() => new Set(mois), [mois]);

  return (
    <span className="cy-bande" role="img" aria-label={titre}>
      {noms.map((n, m) => (
        <i
          key={m}
          aria-hidden="true"
          title={n.long}
          data-coche={coches.has(m) ? '1' : '0'}
          data-courant={m === moisCourant ? '1' : '0'}
        >
          {n.court}
        </i>
      ))}
    </span>
  );
}
