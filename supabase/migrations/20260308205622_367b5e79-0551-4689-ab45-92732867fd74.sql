
-- Create friendship status enum
CREATE TYPE public.friendship_status AS ENUM ('pending', 'accepted', 'declined');

-- Create friendships table
CREATE TABLE public.friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  status public.friendship_status NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT friendships_no_self CHECK (sender_id != receiver_id),
  CONSTRAINT friendships_unique_pair UNIQUE (sender_id, receiver_id)
);

-- Enable RLS
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- Users can view friendships they are part of
CREATE POLICY "Users can view their own friendships"
  ON public.friendships FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Users can send friend requests (insert as sender)
CREATE POLICY "Users can send friend requests"
  ON public.friendships FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id);

-- Receiver can update status (accept/decline), sender can't change status
CREATE POLICY "Receiver can respond to friend requests"
  ON public.friendships FOR UPDATE TO authenticated
  USING (auth.uid() = receiver_id);

-- Either party can delete (unfriend)
CREATE POLICY "Users can unfriend"
  ON public.friendships FOR DELETE TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Create function to get accepted friends with profile details
CREATE OR REPLACE FUNCTION public.get_accepted_friends(p_user_id uuid)
RETURNS TABLE (
  friendship_id uuid,
  friend_id uuid,
  display_name text,
  avatar_url text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    f.id AS friendship_id,
    CASE WHEN f.sender_id = p_user_id THEN f.receiver_id ELSE f.sender_id END AS friend_id,
    p.display_name,
    p.avatar_url,
    f.created_at
  FROM friendships f
  JOIN profiles p ON p.id = CASE WHEN f.sender_id = p_user_id THEN f.receiver_id ELSE f.sender_id END
  WHERE f.status = 'accepted'
    AND (f.sender_id = p_user_id OR f.receiver_id = p_user_id)
    AND p_user_id = auth.uid();
$$;
