-- Seed data for local development
-- Run after migrations: psql $DATABASE_URL -f src/db/seed.sql
-- Or via migrate.ts which auto-applies this if listed in _migrations.

-- Create a demo user (password: "demo123" — bcrypt hash)
INSERT INTO users (id, email, password_hash, tier)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'demo@rememberthis.app',
  -- bcrypt hash of "demo123" (cost 10)
  '$2b$10$8K1p/a0dL1LXMIgoEDFrwOfMQkf9j6pLwB4QVlGlgEPDpL1OTERyW',
  'free'
) ON CONFLICT (id) DO NOTHING;

-- Create a demo journal
INSERT INTO journals (id, user_id, title)
VALUES (
  '00000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000001',
  'My First Journal'
) ON CONFLICT (id) DO NOTHING;

-- Create a demo entry
INSERT INTO entries (id, journal_id, user_id, content, font, stickers, is_voice)
VALUES (
  '00000000-0000-0000-0000-000000000100',
  '00000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000001',
  'Welcome to Remember This! This is your first journal entry. 🎉',
  'inter',
  '[{"emoji": "🎉", "x": 0, "y": 0}]'::jsonb,
  false
) ON CONFLICT (id) DO NOTHING;
