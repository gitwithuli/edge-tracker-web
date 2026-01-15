-- Migration: 008_sub_edges.sql
-- Add parent_edge_id to edges table for hierarchical edge groups

-- Add parent_edge_id column to edges table
ALTER TABLE edges
ADD COLUMN IF NOT EXISTS parent_edge_id UUID REFERENCES edges(id) ON DELETE SET NULL;

-- Create index for faster parent/child lookups
CREATE INDEX IF NOT EXISTS idx_edges_parent_edge_id ON edges(parent_edge_id);
