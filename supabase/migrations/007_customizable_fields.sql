-- Migration: 007_customizable_fields.sql
-- Add customizable tracking fields per edge

-- Add enabled_fields array to edges table
ALTER TABLE edges
ADD COLUMN enabled_fields TEXT[] DEFAULT '{}';

-- Add optional tracking fields to logs table
ALTER TABLE logs
ADD COLUMN entry_price DECIMAL(12,4),
ADD COLUMN exit_price DECIMAL(12,4),
ADD COLUMN entry_time TIME,
ADD COLUMN exit_time TIME,
ADD COLUMN daily_open DECIMAL(12,4),
ADD COLUMN daily_high DECIMAL(12,4),
ADD COLUMN daily_low DECIMAL(12,4),
ADD COLUMN daily_close DECIMAL(12,4),
ADD COLUMN ny_open DECIMAL(12,4),
ADD COLUMN position_size DECIMAL(12,4),
ADD COLUMN direction TEXT;

-- Add comment for documentation
COMMENT ON COLUMN edges.enabled_fields IS 'Array of enabled optional field groups: entryExitPrices, entryExitTimes, dailyOHLC, positionSize';
COMMENT ON COLUMN logs.entry_price IS 'Entry price (enabled via edge.enabled_fields)';
COMMENT ON COLUMN logs.exit_price IS 'Exit price (enabled via edge.enabled_fields)';
COMMENT ON COLUMN logs.entry_time IS 'Time of entry HH:MM (enabled via edge.enabled_fields)';
COMMENT ON COLUMN logs.exit_time IS 'Time of exit HH:MM (enabled via edge.enabled_fields)';
COMMENT ON COLUMN logs.daily_open IS 'Daily candle open price (enabled via edge.enabled_fields)';
COMMENT ON COLUMN logs.daily_high IS 'Daily candle high price (enabled via edge.enabled_fields)';
COMMENT ON COLUMN logs.daily_low IS 'Daily candle low price (enabled via edge.enabled_fields)';
COMMENT ON COLUMN logs.daily_close IS 'Daily candle close price (enabled via edge.enabled_fields)';
COMMENT ON COLUMN logs.ny_open IS 'NY 00:00 candle open price - ICT True Open (enabled via edge.enabled_fields)';
COMMENT ON COLUMN logs.position_size IS 'Position size in lots/contracts (enabled via edge.enabled_fields)';
COMMENT ON COLUMN logs.direction IS 'Trade direction LONG or SHORT (used when entryExitPrices enabled)';
