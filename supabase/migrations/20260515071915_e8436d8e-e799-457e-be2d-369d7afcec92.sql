
-- Journal prompts catalog
CREATE TABLE public.journal_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'reflection',
  language TEXT NOT NULL DEFAULT 'fr',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.journal_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read active prompts"
ON public.journal_prompts FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "Admins manage prompts"
ON public.journal_prompts FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_journal_prompts_lang_active ON public.journal_prompts(language, is_active);

-- Focus distractions log
CREATE TABLE public.focus_distractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_id UUID NULL,
  note TEXT NOT NULL,
  category TEXT NULL,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.focus_distractions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own distractions"
ON public.focus_distractions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users insert own distractions"
ON public.focus_distractions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own distractions"
ON public.focus_distractions FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX idx_focus_distractions_user_date ON public.focus_distractions(user_id, logged_at DESC);

-- Seed prompts (FR)
INSERT INTO public.journal_prompts (prompt, category, language) VALUES
('Quelle est la chose la plus importante que tu as accomplie aujourd''hui ?', 'reflection', 'fr'),
('Pour quoi es-tu reconnaissant aujourd''hui ?', 'gratitude', 'fr'),
('Quelle pensée négative as-tu eue aujourd''hui ? Reformule-la.', 'cbt', 'fr'),
('Si tout se passait parfaitement demain, à quoi ressemblerait ta journée ?', 'visualization', 'fr'),
('"Tu as pouvoir sur ton esprit, pas sur les événements extérieurs." — Marc Aurèle. Comment l''appliques-tu maintenant ?', 'stoic', 'fr'),
('Quelle peur t''a freiné aujourd''hui et qu''aurais-tu fait sans elle ?', 'reflection', 'fr'),
('Trois petites victoires de la journée ?', 'gratitude', 'fr'),
('Qu''est-ce qui te rapprocherait de ton prochain palier ?', 'reflection', 'fr'),
('Visualise-toi dans 1 an ayant tenu ton pacte. Que ressens-tu ?', 'visualization', 'fr'),
('"Ce qui ne dépend pas de moi ne mérite pas mon trouble." Identifie une chose à lâcher.', 'stoic', 'fr'),
('Quelle habitude t''a coûté de l''énergie inutilement aujourd''hui ?', 'cbt', 'fr'),
('Une personne à remercier mentalement ?', 'gratitude', 'fr'),
('Quel signal ton corps t''a envoyé que tu as ignoré ?', 'reflection', 'fr'),
('Si tu n''avais qu''une seule action à faire demain, laquelle aurait le plus d''impact ?', 'visualization', 'fr'),
('Qu''est-ce que la version la plus calme de toi ferait dans ta situation actuelle ?', 'stoic', 'fr');

-- Seed prompts (EN)
INSERT INTO public.journal_prompts (prompt, category, language) VALUES
('What is the most important thing you accomplished today?', 'reflection', 'en'),
('What are you grateful for today?', 'gratitude', 'en'),
('What negative thought did you have today? Reframe it.', 'cbt', 'en'),
('If tomorrow went perfectly, what would it look like?', 'visualization', 'en'),
('"You have power over your mind — not outside events." — Marcus Aurelius. How can you apply this now?', 'stoic', 'en'),
('What fear held you back today and what would you have done without it?', 'reflection', 'en'),
('Name three small wins from today.', 'gratitude', 'en'),
('What single move would bring you closer to your next milestone?', 'reflection', 'en'),
('Visualize yourself a year from now having kept your pact. What do you feel?', 'visualization', 'en'),
('"What is not in my control deserves no part of my trouble." Identify one thing to release.', 'stoic', 'en'),
('Which habit cost you energy needlessly today?', 'cbt', 'en'),
('Who is one person worth thanking mentally?', 'gratitude', 'en'),
('What signal from your body did you ignore today?', 'reflection', 'en'),
('If you could only do ONE thing tomorrow, which would have the highest impact?', 'visualization', 'en'),
('What would the calmest version of you do in your current situation?', 'stoic', 'en');
