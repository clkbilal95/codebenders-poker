-- Codebenders Poker - Supabase Kurulum SQL'i
-- Bu SQL'i Supabase > SQL Editor'e yapıştır ve çalıştır

-- Rooms tablosu
CREATE TABLE IF NOT EXISTS rooms (
  id TEXT PRIMARY KEY,
  status TEXT DEFAULT 'waiting',
  votes_visible BOOLEAN DEFAULT FALSE,
  current_story TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Players tablosu
CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,
  room_id TEXT REFERENCES rooms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar TEXT DEFAULT '🦊',
  vote TEXT,
  online BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Realtime aktif et
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE players;

-- Row Level Security (RLS) - herkese açık
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rooms_all" ON rooms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "players_all" ON players FOR ALL USING (true) WITH CHECK (true);
