
ALTER TABLE public.journal_entries
ADD COLUMN accent_color text DEFAULT 'cyan',
ADD COLUMN font_id text DEFAULT 'mono',
ADD COLUMN size_id text DEFAULT 'md',
ADD COLUMN align_id text DEFAULT 'left',
ADD COLUMN line_numbers boolean DEFAULT false;
