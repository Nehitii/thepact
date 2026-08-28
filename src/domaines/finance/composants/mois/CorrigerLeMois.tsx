import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useDateFnsLocale } from '@/i18n/useDateFnsLocale';

/**
 * ROUVRIR UN MOIS CLOS.
 *
 * Un mois valide est en lecture seule, sans exception : c est ce qui
 * donne son sens a la validation, et ce qui empeche de defaire un
 * palmares d un clic distrait.
 *
 * Mais un pointage se fait a la main, donc il se trompe. Sans aucune
 * issue, une coche erronee serait gravee pour toujours et fausserait
 * la serie sans recours. La porte existe donc — une seule, explicite,
 * et confirmee.
 *
 * LA CONFIRMATION DIT LA CONSEQUENCE, PAS L ACTION. « Rouvrir ce
 * mois ? » n apprend rien a qui vient de cliquer « Corriger ». Ce
 * qu il ignore, c est que la serie va bouger.
 */
interface Props {
  /** Le mois a rouvrir, au format yyyy-MM-01. Null ferme la fenetre. */
  mois: string | null;
  onAnnuler: () => void;
  onConfirmer: () => void;
}

export function CorrigerLeMois({ mois, onAnnuler, onConfirmer }: Props) {
  const { t } = useTranslation();
  const locale = useDateFnsLocale();
  const nom = mois ? format(parseISO(mois), 'MMMM yyyy', { locale }) : '';

  return (
    <AlertDialog open={!!mois} onOpenChange={(o) => !o && onAnnuler()}>
      <AlertDialogContent className="font-rajdhani">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-orbitron tracking-wider">
            {t('finance.palmares.corrigerTitre', { mois: nom, defaultValue: `Rouvrir ${nom} ?` })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t('finance.palmares.corrigerAvertissement', {
              defaultValue:
                'Sa validation sera annulée et la série recalculée. Les pointages déjà faits sont conservés : tu reprends là où tu en étais.',
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onAnnuler}>{t('common.cancel')}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirmer}>
            {t('finance.palmares.corrigerConfirmer', 'Rouvrir le mois')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
