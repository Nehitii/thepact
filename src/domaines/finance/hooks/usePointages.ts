/**
 * LE POINTAGE DU MOIS.
 *
 * La validation ne retenait que des totaux : deux booleens et deux
 * sommes. On declarait donc « les depenses sont conformes » en bloc,
 * sans jamais dire lesquelles etaient parties, ni laquelle avait coute
 * autre chose que prevu.
 *
 * Un pointage est une ligne par prelevement constate. Ce qui le rend
 * utile n est pas la case cochee mais le montant reel : l essence
 * prevue a 150 qui part a 120 se corrige pour ce mois-la sans toucher
 * a la recurrence.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Pointage {
  id: string;
  user_id: string;
  mois: string;
  ligne_id: string | null;
  genre: 'expense' | 'income';
  nom: string;
  montant_prevu: number;
  montant_reel: number;
  pointe: boolean;
}

/* Les montants reviennent de Postgres en chaines : numeric n a pas de
   correspondance sure en JavaScript, le pilote prefere donc ne rien
   perdre plutot que d arrondir. On convertit ici, une fois, pour que
   le reste du code n ait jamais a y penser. */
const enNombre = (v: unknown): number => (typeof v === 'number' ? v : Number(v) || 0);

const versPointage = (l: Record<string, unknown>): Pointage => ({
  id: String(l.id),
  user_id: String(l.user_id),
  mois: String(l.mois),
  ligne_id: (l.ligne_id as string | null) ?? null,
  genre: l.genre === 'income' ? 'income' : 'expense',
  nom: String(l.nom ?? ''),
  montant_prevu: enNombre(l.montant_prevu),
  montant_reel: enNombre(l.montant_reel),
  pointe: l.pointe !== false,
});

export function usePointages(userId?: string, mois?: string) {
  return useQuery({
    queryKey: ['pointages', userId, mois],
    queryFn: async () => {
      if (!userId || !mois) return [];
      const { data, error } = await supabase
        .from('pointages_du_mois')
        .select('*')
        .eq('user_id', userId)
        .eq('mois', mois);
      if (error) throw error;
      return (data as unknown as Record<string, unknown>[]).map(versPointage);
    },
    enabled: !!userId && !!mois,
  });
}

export interface EcritureDePointage {
  mois: string;
  ligne_id: string | null;
  genre: 'expense' | 'income';
  nom: string;
  montant_prevu: number;
  montant_reel: number;
  pointe: boolean;
}

export function useEcrirePointage() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (p: EcritureDePointage) => {
      if (!user) throw new Error('non authentifié');
      const { data, error } = await supabase
        .from('pointages_du_mois')
        .upsert(
          { ...p, user_id: user.id, updated_at: new Date().toISOString() },
          /* Une ligne, un mois : repointer corrige au lieu d empiler. */
          { onConflict: 'user_id,mois,ligne_id' },
        )
        .select()
        .single();
      if (error) throw error;
      return versPointage(data as unknown as Record<string, unknown>);
    },
    onSuccess: (_d, p) => {
      qc.invalidateQueries({ queryKey: ['pointages', user?.id, p.mois] });
    },
  });
}

export function useEffacerPointage() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ ligneId, mois }: { ligneId: string; mois: string }) => {
      if (!user) throw new Error('non authentifié');
      const { error } = await supabase
        .from('pointages_du_mois')
        .delete()
        .eq('user_id', user.id)
        .eq('mois', mois)
        .eq('ligne_id', ligneId);
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['pointages', user?.id, v.mois] });
    },
  });
}
