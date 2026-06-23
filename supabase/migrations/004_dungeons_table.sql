-- Migration: create public.dungeons table for structured dungeon data

CREATE TABLE IF NOT EXISTS public.dungeons (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  zone TEXT,
  region TEXT,
  min_level INTEGER,
  max_level INTEGER,
  heroic BOOLEAN DEFAULT false,
  description TEXT,
  location_note TEXT,
  bosses JSONB DEFAULT '[]',
  tags TEXT[] DEFAULT '{}',
  image_key TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.dungeons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Officers can manage dungeons"
  ON public.dungeons
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('officer', 'admin', 'gm')
    )
  );

CREATE POLICY "Anyone can read dungeons"
  ON public.dungeons
  FOR SELECT
  TO anon, authenticated
  USING (true);
