
CREATE OR REPLACE FUNCTION enforce_friend_request_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_count integer;
BEGIN
  SELECT count(*) INTO recent_count
  FROM friendships
  WHERE sender_id = NEW.sender_id
    AND created_at > now() - interval '1 hour';
  
  IF recent_count >= 20 THEN
    RAISE EXCEPTION 'Rate limit exceeded: max 20 friend requests per hour';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_friend_request_rate_limit
BEFORE INSERT ON friendships
FOR EACH ROW
EXECUTE FUNCTION enforce_friend_request_rate_limit();
