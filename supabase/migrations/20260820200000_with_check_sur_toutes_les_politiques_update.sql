-- UNE POLITIQUE DE MODIFICATION SANS « WITH CHECK » NE JUGE QUE LA
-- LIGNE D AVANT.
--
-- « USING » decide quelles lignes on a le droit de modifier. Il ne dit
-- rien de ce qu elles deviennent. Sans « WITH CHECK », un utilisateur
-- peut donc modifier une ligne qui lui appartient et, dans le meme
-- geste, remplacer « user_id » par celui d un autre : la ligne change
-- de proprietaire et disparait de chez lui. Sur les tables dont la
-- propriete passe par une jointure — goal_cost_items, steps, goals —
-- il peut rattacher l enregistrement a l objectif d autrui.
--
-- Quarante et une politiques etaient dans ce cas, sur cinquante-trois.
-- La condition existante est recopiee telle quelle en « WITH CHECK » :
-- ce qu on a le droit de modifier devient aussi ce qu on a le droit
-- d ecrire. Aucun geste legitime n en est empeche — les dix conditions
-- distinctes ont ete relues une a une avant d appliquer, et une
-- desactivation puis reactivation de ligne recurrente a ete rejouee
-- dans l application apres coup.
--
-- Les corrections deja faites sur « pacts » et « journal_entries » plus
-- tot dans la session relevaient du meme defaut ; celle-ci couvre le
-- reste de la base.

do $$
declare
  p record;
begin
  for p in
    select schemaname, tablename, policyname, qual
    from pg_policies
    where schemaname = 'public'
      and cmd = 'UPDATE'
      and with_check is null
      and qual is not null
    order by tablename, policyname
  loop
    execute format(
      'alter policy %I on %I.%I with check (%s)',
      p.policyname, p.schemaname, p.tablename, p.qual
    );
  end loop;
end $$;
