-- RIT.01 — L APPEL DU JOUR, ECRIT EN UNE SEULE FOIS
--
-- Le client lisait le pacte, ajoutait un, et reecrivait : deux onglets
-- ou deux envois ecrasaient le meme total. La serie, elle, n etait
-- jamais cassee — « checkin_streak + 1 » a chaque passage, sans jamais
-- regarder l ecart avec la derniere date — et rien en base ne la
-- remettait a zero.
--
-- Le jour est celui de L UTILISATEUR : le serveur vit en UTC, et un
-- appel fait a 22 h a Montreal n est pas le lendemain. Le client envoie
-- donc sa date locale, bornee a un jour d ecart avec celle du serveur
-- pour qu on ne puisse pas se fabriquer une serie.

CREATE OR REPLACE FUNCTION public.enregistrer_appel(p_pact_id UUID, p_jour DATE)
RETURNS TABLE (
  total INTEGER,
  serie INTEGER,
  jour DATE,
  deja_fait BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_last DATE;
  v_total INTEGER;
  v_serie INTEGER;
BEGIN
  IF p_jour IS NULL OR p_jour < CURRENT_DATE - 1 OR p_jour > CURRENT_DATE + 1 THEN
    RAISE EXCEPTION 'Date hors plage';
  END IF;

  SELECT user_id, last_checkin_date,
         COALESCE(checkin_total_count, 0), COALESCE(checkin_streak, 0)
    INTO v_user_id, v_last, v_total, v_serie
    FROM pacts
   WHERE id = p_pact_id
     FOR UPDATE;

  IF v_user_id IS NULL OR v_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Deja pointe aujourd hui : on rend l etat, on ne compte pas deux fois.
  IF v_last = p_jour THEN
    RETURN QUERY SELECT v_total, v_serie, v_last, TRUE;
    RETURN;
  END IF;

  UPDATE pacts SET
    checkin_total_count = v_total + 1,
    -- La serie continue si la veille a ete faite ; sinon elle repart a un.
    checkin_streak = CASE WHEN v_last = p_jour - 1 THEN v_serie + 1 ELSE 1 END,
    last_checkin_date = p_jour
  WHERE id = p_pact_id
  RETURNING pacts.checkin_total_count, pacts.checkin_streak, pacts.last_checkin_date
       INTO v_total, v_serie, v_last;

  RETURN QUERY SELECT v_total, v_serie, v_last, FALSE;
END;
$$;

REVOKE ALL ON FUNCTION public.enregistrer_appel(UUID, DATE) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.enregistrer_appel(UUID, DATE) TO authenticated;

-- La regle d ecriture de « pacts » validait la ligne AVANT modification
-- et rien apres : on pouvait donc reecrire « user_id » et faire sortir sa
-- propre ligne de son perimetre.
DROP POLICY IF EXISTS "Users can update their own pact" ON public.pacts;
CREATE POLICY "Users can update their own pact"
  ON public.pacts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
