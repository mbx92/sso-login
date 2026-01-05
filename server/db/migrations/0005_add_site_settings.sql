-- Migration: Add site settings columns (use_divisions, use_units)
-- Created: 2026-01-03

-- Add use_divisions column to sites table
ALTER TABLE sites 
ADD COLUMN use_divisions boolean NOT NULL DEFAULT false;

-- Add use_units column to sites table
ALTER TABLE sites 
ADD COLUMN use_units boolean NOT NULL DEFAULT false;

-- Update existing sites to use divisions and units by default
UPDATE sites 
SET use_divisions = true, use_units = true 
WHERE TRUE;
