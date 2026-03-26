
-- Phase 1: Security - Fix user_roles privilege escalation
-- Only admins can insert/update/delete roles
CREATE POLICY "Only admins can manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow users to read their own roles
CREATE POLICY "Users can read own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());
