-- EdgeTracker V3 Schema Migration
-- Run this in Supabase SQL Editor

-- Drop existing tables if starting fresh (CAUTION: loses data)
-- DROP TABLE IF EXISTS logs CASCADE;
-- DROP TABLE IF EXISTS edges CASCADE;

-- Edges table (user-owned trading strategies)
CREATE TABLE IF NOT EXISTS edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Logs table (trade entries linked to edges)
CREATE TABLE IF NOT EXISTS logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  edge_id UUID NOT NULL REFERENCES edges(id) ON DELETE CASCADE,
  result TEXT NOT NULL CHECK (result IN ('WIN', 'LOSS', 'BE')),
  day_of_week TEXT NOT NULL CHECK (day_of_week IN ('Monday','Tuesday','Wednesday','Thursday','Friday')),
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes >= 1 AND duration_minutes <= 1440),
  note TEXT DEFAULT '',
  tv_link TEXT,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for edges
DROP POLICY IF EXISTS "Users can view their own edges" ON edges;
CREATE POLICY "Users can view their own edges"
  ON edges FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own edges" ON edges;
CREATE POLICY "Users can create their own edges"
  ON edges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own edges" ON edges;
CREATE POLICY "Users can update their own edges"
  ON edges FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own edges" ON edges;
CREATE POLICY "Users can delete their own edges"
  ON edges FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for logs
DROP POLICY IF EXISTS "Users can view their own logs" ON logs;
CREATE POLICY "Users can view their own logs"
  ON logs FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own logs" ON logs;
CREATE POLICY "Users can create their own logs"
  ON logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own logs" ON logs;
CREATE POLICY "Users can update their own logs"
  ON logs FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own logs" ON logs;
CREATE POLICY "Users can delete their own logs"
  ON logs FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_edges_user ON edges(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_user_edge ON logs(user_id, edge_id);
CREATE INDEX IF NOT EXISTS idx_logs_user_date ON logs(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_logs_edge ON logs(edge_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for edges updated_at
DROP TRIGGER IF EXISTS update_edges_updated_at ON edges;
CREATE TRIGGER update_edges_updated_at
  BEFORE UPDATE ON edges
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
