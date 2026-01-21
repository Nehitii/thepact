-- Allow message receivers to mark messages as read, while preventing any other field updates

-- 1) RLS policy to allow UPDATE by receiver
DROP POLICY IF EXISTS "Receivers can mark messages as read" ON public.private_messages;
CREATE POLICY "Receivers can mark messages as read"
ON public.private_messages
FOR UPDATE
USING (auth.uid() = receiver_id)
WITH CHECK (auth.uid() = receiver_id);

-- 2) Trigger to restrict what can be changed on UPDATE
CREATE OR REPLACE FUNCTION public.enforce_private_message_update_rules()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  -- Receiver can only flip is_read from false -> true. No other changes allowed.
  IF NEW.sender_id IS DISTINCT FROM OLD.sender_id
     OR NEW.receiver_id IS DISTINCT FROM OLD.receiver_id
     OR NEW.content IS DISTINCT FROM OLD.content
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Only is_read can be updated on private messages';
  END IF;

  IF NEW.is_read IS DISTINCT FROM OLD.is_read THEN
    IF NEW.is_read = false THEN
      RAISE EXCEPTION 'private_messages.is_read cannot be set to false';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_private_message_update_rules ON public.private_messages;
CREATE TRIGGER trg_enforce_private_message_update_rules
BEFORE UPDATE ON public.private_messages
FOR EACH ROW
EXECUTE FUNCTION public.enforce_private_message_update_rules();
