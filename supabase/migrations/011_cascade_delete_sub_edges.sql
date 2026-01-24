-- Migration: 011_cascade_delete_sub_edges.sql
-- Change parent_edge_id foreign key from SET NULL to CASCADE
-- When a parent edge is deleted, all sub-edges should also be deleted

-- Drop the existing foreign key constraint
ALTER TABLE edges DROP CONSTRAINT IF EXISTS edges_parent_edge_id_fkey;

-- Re-add with CASCADE delete
ALTER TABLE edges
ADD CONSTRAINT edges_parent_edge_id_fkey
FOREIGN KEY (parent_edge_id) REFERENCES edges(id) ON DELETE CASCADE;
