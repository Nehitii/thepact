-- Allow admins to delete user cosmetics (for Admin Mode reset)
CREATE POLICY "Admins can delete any cosmetics"
ON public.user_cosmetics
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Allow admins to delete module purchases (for Admin Mode reset)
CREATE POLICY "Admins can delete any module purchases"
ON public.user_module_purchases
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Allow users to delete their own cosmetics (needed for admin testing own account)
CREATE POLICY "Users can delete their own cosmetics"
ON public.user_cosmetics
FOR DELETE
USING (auth.uid() = user_id);

-- Allow users to delete their own module purchases (needed for admin testing own account)
CREATE POLICY "Users can delete their own module purchases"
ON public.user_module_purchases
FOR DELETE
USING (auth.uid() = user_id);