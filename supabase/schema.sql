-- Ajora Off-chain Database Schema (PostgreSQL for Supabase)

-- 1. Users Table
-- Stores user profiles, preferences, and aggregate stats
CREATE TABLE IF NOT EXISTS public.users (
    address TEXT PRIMARY KEY, -- Wallet address (lowercase)
    xp_balance INTEGER DEFAULT 0,
    current_theme TEXT DEFAULT 'light',
    unlocked_themes TEXT[] DEFAULT ARRAY['light', 'dark']::TEXT[],
    longest_streak INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    last_saved_at TIMESTAMP WITH TIME ZONE,
    crew_id UUID REFERENCES public.crews(id) ON DELETE SET NULL,
    total_saved_usd NUMERIC(18, 2) DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Crews Table
-- Stores multiplayer crews
CREATE TABLE IF NOT EXISTS public.crews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    total_volume_usd NUMERIC(18, 2) DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Quests Table
-- Defines available daily/weekly quests
CREATE TABLE IF NOT EXISTS public.quests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    xp_reward INTEGER NOT NULL,
    quest_type TEXT NOT NULL, -- 'daily', 'weekly', 'lifetime'
    target_count INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. User_Quests Table
-- Tracks quest progress for users
CREATE TABLE IF NOT EXISTS public.user_quests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_address TEXT REFERENCES public.users(address) ON DELETE CASCADE,
    quest_id UUID REFERENCES public.quests(id) ON DELETE CASCADE,
    progress INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_address, quest_id)
);

-- 5. Notifications Table
-- Stores in-app notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_address TEXT REFERENCES public.users(address) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'system', 'draw', 'crew', 'achievement'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_xp ON public.users(xp_balance DESC);
CREATE INDEX IF NOT EXISTS idx_users_streak ON public.users(longest_streak DESC);
CREATE INDEX IF NOT EXISTS idx_crews_volume ON public.crews(total_volume_usd DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_address, is_read);
