/**
 * LE CADREUR.
 *
 * Televerser une image ne suffisait pas : elle etait posee de la seule
 * facon prevue, et le resultat dependait entierement de la chance
 * qu on avait eue avec le fichier. Un logo large tombait bien ; un
 * logo carre cerne de marge s affichait minuscule ; un logo blanc sur
 * fond transparent disparaissait sur du blanc.
 *
 * DEUX APERCUS, PARCE QU IL Y A DEUX FORMES.
 *
 * La meme marque parait sur la plaque d une fiche, large et basse, et
 * sur la pastille du calendrier, minuscule et carree. Un cadrage qui
 * va sur l une peut couper l autre. Montrer un seul apercu reviendrait
 * a faire regler a l aveugle la moitie des cas — les deux sont donc
 * la, cote a cote, et se mettent a jour ensemble.
 *
 * LES REGLAGES NE PARAISSENT QUE QUAND ILS SERVENT.
 *
 * Sans image, il n y a rien a cadrer : le bouton de televersement est
 * seul. La position ne se propose qu en remplissage — en mode
 * « contenir » rien n est coupe, et deplacer une image qui tient
 * entiere ne ferait rien du tout.
 */
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ImagePlus, Loader2, Trash2, Maximize2, Minimize2, RotateCcw, Move } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { optimizeImage } from '@/lib/imageOptimization';
import {
  CADRE_PAR_DEFAUT, DECALAGE_MAX, estCadreParDefaut, styleDuCadre,
  type CadreImage, type Ajustement, type FondDeMarque,
} from '@/lib/finance/cadre';

interface Props {
  url: string | null;
  cadre: CadreImage;
  onUrl: (url: string | null) => void;
  onCadre: (c: CadreImage) => void;
  /** La couleur de la categorie, pour le fond « teinte ». */
  teinte: string;
}

const TAILLE_MAX = 2 * 1024 * 1024;

export function CadreurDImage({ url, cadre, onUrl, onCadre, teinte }: Props) {
  const { t } = useTranslation();
  const champ = useRef<HTMLInputElement>(null);
  const [envoi, setEnvoi] = useState(false);

  const televerser = async (fichier: File) => {
    if (!fichier.type.startsWith('image/')) {
      toast.error(t('finance.cadre.mauvaisType', "Ce fichier n'est pas une image."));
      return;
    }
    if (fichier.size > TAILLE_MAX) {
      toast.error(t('finance.cadre.tropLourd', 'Image trop lourde (2 Mo maximum).'));
      return;
    }
    setEnvoi(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('non authentifié');

      /* ON N ENVOIE JAMAIS LE FICHIER TEL QUEL.
         Un logo televerse en PNG de deux megaoctets serait retelecharge
         entier a chaque affichage de la fiche. La conversion en webp le
         ramene a quelques dizaines de kilooctets sans perte visible —
         un logo est un aplat de couleurs, il se compresse bien mieux
         qu une photographie. Le format « logo » vise cinq cent douze
         pixels, ce qu il faut pour la plaque d une fiche sur un ecran a
         double densite. */
      const optimise = await optimizeImage(fichier, 'logo');
      const ext = optimise.type === 'image/gif' ? 'gif' : 'webp';
      const chemin = `${user.id}/${Date.now()}.${ext}`;

      const { error } = await supabase.storage.from('finance-icons').upload(chemin, optimise, {
        upsert: true,
        contentType: optimise.type,
        /* Un logo ne change pas : le chemin porte un horodatage, donc
           une image remplacee a une nouvelle adresse. Un an de cache ne
           risque donc jamais de servir une version perimee. */
        cacheControl: '31536000',
      });
      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage.from('finance-icons').getPublicUrl(chemin);
      onUrl(publicUrl);
    } catch (e) {
      toast.error(t('finance.cadre.echec', "L'image n'a pas pu être envoyée."));
      console.error(e);
    } finally {
      setEnvoi(false);
    }
  };

  const style = styleDuCadre(cadre, teinte);
  const majCadre = (bout: Partial<CadreImage>) => onCadre({ ...cadre, ...bout });

  /* LE GLISSER.
   *
   * Neuf boutons de position disaient « garde le coin haut-gauche ».
   * C etait grossier — un logo se cale rarement sur un neuvieme — et
   * surtout muet : on cliquait un point, on regardait ce que ca
   * donnait, on recommencait.
   *
   * On deplace donc l image directement, a la souris ou au doigt. Le
   * decalage etant exprime en pourcentage de la plaque, la conversion
   * est immediate : un pixel parcouru vaut un pixel d image, quel que
   * soit le zoom.
   *
   * setPointerCapture est ce qui rend le geste sur : sans lui, sortir
   * du cadre en glissant lache l image en cours de route.
   */
  const plaque = useRef<HTMLDivElement>(null);
  const depart = useRef<{ x: number; y: number; dx: number; dy: number } | null>(null);
  const [glisse, setGlisse] = useState(false);

  const auPointeur = useCallback((e: React.PointerEvent) => {
    if (!depart.current || !plaque.current) return;
    const cadreRect = plaque.current.getBoundingClientRect();
    if (cadreRect.width === 0 || cadreRect.height === 0) return;
    const d = depart.current;
    const dx = d.dx + ((e.clientX - d.x) / cadreRect.width) * 100;
    const dy = d.dy + ((e.clientY - d.y) / cadreRect.height) * 100;
    onCadre({
      ...cadre,
      dx: Math.round(Math.min(DECALAGE_MAX, Math.max(-DECALAGE_MAX, dx))),
      dy: Math.round(Math.min(DECALAGE_MAX, Math.max(-DECALAGE_MAX, dy))),
    });
  }, [cadre, onCadre]);

  const prendre = (e: React.PointerEvent) => {
    depart.current = { x: e.clientX, y: e.clientY, dx: cadre.dx, dy: cadre.dy };
    setGlisse(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const lacher = (e: React.PointerEvent) => {
    depart.current = null;
    setGlisse(false);
    if ((e.currentTarget as HTMLElement).hasPointerCapture?.(e.pointerId)) {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    }
  };

  /* Le meme reglage au clavier. Un glisser seul exclurait quiconque
     n a pas de souris, et une plaque focalisable sans touche qui
     agisse serait un piege a tabulation. */
  const auClavier = (e: React.KeyboardEvent) => {
    const pas = e.shiftKey ? 10 : 2;
    const bouger = (dx: number, dy: number) => {
      e.preventDefault();
      majCadre({
        dx: Math.min(DECALAGE_MAX, Math.max(-DECALAGE_MAX, cadre.dx + dx)),
        dy: Math.min(DECALAGE_MAX, Math.max(-DECALAGE_MAX, cadre.dy + dy)),
      });
    };
    if (e.key === 'ArrowLeft') bouger(-pas, 0);
    else if (e.key === 'ArrowRight') bouger(pas, 0);
    else if (e.key === 'ArrowUp') bouger(0, -pas);
    else if (e.key === 'ArrowDown') bouger(0, pas);
    else if (e.key === 'Home' || e.key === '0') { e.preventDefault(); majCadre({ dx: 0, dy: 0 }); }
  };

  const AJUSTEMENTS: { cle: Ajustement; icone: typeof Maximize2; libelle: string; aide: string }[] = [
    {
      cle: 'contenir', icone: Minimize2,
      libelle: t('finance.cadre.contenir', 'Ajuster'),
      aide: t('finance.cadre.contenirAide', 'le logo entier'),
    },
    {
      cle: 'remplir', icone: Maximize2,
      libelle: t('finance.cadre.remplir', 'Remplir'),
      aide: t('finance.cadre.remplirAide', 'bords rognés'),
    },
  ];

  const FONDS: { cle: FondDeMarque; libelle: string; apercu: string }[] = [
    { cle: 'clair', libelle: t('finance.cadre.clair', 'Clair'), apercu: '#ffffff' },
    { cle: 'sombre', libelle: t('finance.cadre.sombre', 'Sombre'), apercu: '#0b1018' },
    { cle: 'teinte', libelle: t('finance.cadre.teinte', 'Teinte'), apercu: teinte },
  ];

  if (!url) {
    return (
      <div className="cy-cadreur">
        <input
          ref={champ}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) televerser(f);
            e.target.value = '';
          }}
        />
        <button type="button" className="cy-cadreur-vide" onClick={() => champ.current?.click()} disabled={envoi}>
          {envoi ? <Loader2 className="cy-tourne" aria-hidden="true" /> : <ImagePlus aria-hidden="true" />}
          <span>{t('finance.cadre.choisir', 'Ajouter un logo')}</span>
          <u>{t('finance.cadre.formats', 'PNG ou JPG · 2 Mo max')}</u>
        </button>
      </div>
    );
  }

  return (
    <div className="cy-cadreur">
      <input
        ref={champ}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) televerser(f);
          e.target.value = '';
        }}
      />

      {/* LES DEUX APERCUS. La plaque large de la fiche, et la pastille
          carree du calendrier : ce sont les deux formes ou la marque
          paraitra reellement. */}
      <div className="cy-cadreur-apercus">
        <figure
          ref={plaque}
          className="cy-cadreur-plaque"
          style={style}
          data-glisse={glisse ? '1' : '0'}
          tabIndex={0}
          role="group"
          aria-label={t('finance.cadre.deplacer', "Déplacer l'image — flèches du clavier, ou glisser")}
          onPointerDown={prendre}
          onPointerMove={auPointeur}
          onPointerUp={lacher}
          onPointerCancel={lacher}
          onKeyDown={auClavier}
        >
          <img src={url} alt="" draggable={false} />
          <figcaption>
            <Move aria-hidden="true" />
            {t('finance.cadre.surLaFiche', 'Sur la fiche')}
          </figcaption>
        </figure>
        <figure className="cy-cadreur-pastille" style={style}>
          <img src={url} alt="" draggable={false} />
          <figcaption>{t('finance.cadre.surLeCalendrier', 'Au calendrier')}</figcaption>
        </figure>
      </div>

      <div className="cy-cadreur-reglages">
        <div className="cy-cadreur-rang">
          <span className="cy-cadreur-nom">{t('finance.cadre.cadrage', 'Cadrage')}</span>
          <div className="cy-cadreur-choix" role="radiogroup" aria-label={t('finance.cadre.cadrage', 'Cadrage')}>
            {AJUSTEMENTS.map(({ cle, icone: Icone, libelle, aide }) => (
              <button
                key={cle}
                type="button"
                role="radio"
                aria-checked={cadre.ajustement === cle}
                onClick={() => majCadre({ ajustement: cle })}
              >
                <Icone aria-hidden="true" />
                <b>{libelle}</b>
                <u>{aide}</u>
              </button>
            ))}
          </div>
        </div>

        <div className="cy-cadreur-rang">
          <span className="cy-cadreur-nom">{t('finance.cadre.fond', 'Fond')}</span>
          <div className="cy-cadreur-fonds" role="radiogroup" aria-label={t('finance.cadre.fond', 'Fond')}>
            {FONDS.map(({ cle, libelle, apercu }) => (
              <button
                key={cle}
                type="button"
                role="radio"
                aria-checked={cadre.fond === cle}
                onClick={() => majCadre({ fond: cle })}
                title={libelle}
              >
                <i style={{ background: apercu }} aria-hidden="true" />
                <span>{libelle}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="cy-cadreur-rang">
          <label className="cy-cadreur-nom" htmlFor="cadre-zoom">
            {t('finance.cadre.zoom', 'Zoom')}
            <b>{cadre.zoom} %</b>
          </label>
          <input
            id="cadre-zoom"
            type="range"
            min={100}
            max={300}
            step={5}
            value={cadre.zoom}
            onChange={(e) => majCadre({ zoom: Number(e.target.value) })}
            className="cy-cadreur-glissiere"
          />
        </div>

      </div>

      <div className="cy-cadreur-outils">
        <button type="button" onClick={() => champ.current?.click()} disabled={envoi}>
          {envoi ? <Loader2 className="cy-tourne" aria-hidden="true" /> : <ImagePlus aria-hidden="true" />}
          {t('finance.cadre.remplacer', 'Remplacer')}
        </button>
        {!estCadreParDefaut(cadre) && (
          <button type="button" onClick={() => onCadre({ ...CADRE_PAR_DEFAUT })}>
            <RotateCcw aria-hidden="true" />
            {t('finance.cadre.reinitialiser', 'Réinitialiser')}
          </button>
        )}
        <button
          type="button"
          className="cy-cadreur-retirer"
          onClick={() => { onUrl(null); onCadre({ ...CADRE_PAR_DEFAUT }); }}
        >
          <Trash2 aria-hidden="true" />
          {t('finance.cadre.retirer', 'Retirer')}
        </button>
      </div>
    </div>
  );
}
