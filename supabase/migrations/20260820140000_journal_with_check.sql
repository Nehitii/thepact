-- LOG.01 — ON POUVAIT DEPOSER UNE ENTREE DANS LE JOURNAL D UN AUTRE
--
-- La regle d ecriture validait la ligne AVANT modification et rien
-- apres : un compte pouvait prendre une de ses entrees et y reecrire
-- « user_id ». La ligne quittait alors son journal — ou entrait dans
-- celui de quelqu un d autre, sans que le proprietaire ne l ait jamais
-- vue arriver.
--
-- C est le meme trou que celui trouve sur « pacts », jamais corrige ici.

DROP POLICY IF EXISTS "Users can update their own journal entries" ON public.journal_entries;
CREATE POLICY "Users can update their own journal entries"
  ON public.journal_entries FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
