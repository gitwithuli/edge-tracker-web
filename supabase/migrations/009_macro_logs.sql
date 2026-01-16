-- Macro Logs table for tracking ICT macro window analysis
-- Migrating from localStorage to Supabase for cross-device sync

CREATE TABLE IF NOT EXISTS macro_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  macro_id TEXT NOT NULL,
  date DATE NOT NULL,
  points_moved DECIMAL(10, 2),
  direction TEXT CHECK (direction IS NULL OR direction IN ('BULLISH', 'BEARISH', 'CONSOLIDATION')),
  displacement_quality TEXT CHECK (displacement_quality IS NULL OR displacement_quality IN ('CLEAN', 'CHOPPY')),
  liquidity_sweep TEXT CHECK (liquidity_sweep IS NULL OR liquidity_sweep IN ('HIGHS', 'LOWS', 'BOTH', 'NONE')),
  note TEXT DEFAULT '',
  tv_links TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint: one log per macro per date per user
  UNIQUE(user_id, macro_id, date)
);

-- Enable Row Level Security
ALTER TABLE macro_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their own macro logs" ON macro_logs;
CREATE POLICY "Users can view their own macro logs"
  ON macro_logs FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own macro logs" ON macro_logs;
CREATE POLICY "Users can create their own macro logs"
  ON macro_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own macro logs" ON macro_logs;
CREATE POLICY "Users can update their own macro logs"
  ON macro_logs FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own macro logs" ON macro_logs;
CREATE POLICY "Users can delete their own macro logs"
  ON macro_logs FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_macro_logs_user ON macro_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_macro_logs_user_date ON macro_logs(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_macro_logs_user_macro ON macro_logs(user_id, macro_id);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_macro_logs_updated_at ON macro_logs;
CREATE TRIGGER update_macro_logs_updated_at
  BEFORE UPDATE ON macro_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
