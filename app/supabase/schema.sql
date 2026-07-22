-- Ajora Supabase Schema

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  address text PRIMARY KEY,
  username text,
  avatar_url text,
  xp integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Row Level Security for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone."
  ON public.profiles FOR SELECT
  USING (true);

-- Users can only insert/update their own profile (Assuming address is used as ID, normally we'd match auth.uid(), but here address is the primary key and the service role does the writing)
-- The Next.js backend uses the service_role key to bypass RLS for trusted writes.

-- 2. Quests Table
CREATE TABLE IF NOT EXISTS public.quests (
  id text PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  xp_reward integer NOT NULL,
  target_count integer NOT NULL,
  quest_type text NOT NULL -- 'daily', 'weekly', 'one-time'
);

ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Quests are viewable by everyone." ON public.quests FOR SELECT USING (true);

-- Insert initial quests
INSERT INTO public.quests (id, title, description, xp_reward, target_count, quest_type)
VALUES 
  ('q1', 'Daily Saver', 'Save at least 1 cUSD into the vault today.', 50, 1, 'daily'),
  ('q2', 'Social Butterfly', 'Share your Ajora referral link on X (Twitter).', 100, 1, 'daily'),
  ('q3', 'Consistent Builder', 'Maintain a 3-day savings streak.', 500, 3, 'weekly'),
  ('q4', 'Crew expansion', 'Spray 5 friends with free tickets.', 250, 5, 'weekly')
ON CONFLICT (id) DO NOTHING;

-- 3. User Quests Table
CREATE TABLE IF NOT EXISTS public.user_quests (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_address text REFERENCES public.profiles(address) ON DELETE CASCADE,
  quest_id text REFERENCES public.quests(id) ON DELETE CASCADE,
  progress integer DEFAULT 0 NOT NULL,
  completed boolean DEFAULT false NOT NULL,
  completed_at timestamp with time zone,
  UNIQUE(user_address, quest_id)
);

ALTER TABLE public.user_quests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own quest progress." 
  ON public.user_quests FOR SELECT 
  USING (true); -- Read is public or filtered by backend

-- 4. RPC to safely increment XP
CREATE OR REPLACE FUNCTION increment_xp(user_addr text, amount int)
RETURNS void AS $$
BEGIN
  INSERT INTO public.profiles (address, xp)
  VALUES (lower(user_addr), amount)
  ON CONFLICT (address) DO UPDATE
  SET xp = profiles.xp + amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
