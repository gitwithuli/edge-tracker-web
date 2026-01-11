-- EdgeTracker V3 - ALTER existing tables migration
-- Run this if tables already exist

-- Add user_id to edges if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'edges' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE edges ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add created_at to edges if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'edges' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE edges ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Add updated_at to edges if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'edges' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE edges ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Add edge_id to logs if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'logs' AND column_name = 'edge_id'
  ) THEN
    ALTER TABLE logs ADD COLUMN edge_id UUID REFERENCES edges(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for edges (drop first if exists, then create)
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

-- Indexes (IF NOT EXISTS)
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
