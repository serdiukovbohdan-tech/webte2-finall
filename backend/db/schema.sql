CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS logs (
  id SERIAL PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  command TEXT NOT NULL,
  output TEXT NOT NULL,
  is_error BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS animation_stats (
  id SERIAL PRIMARY KEY,
  animation_type VARCHAR(20) NOT NULL CHECK (animation_type IN ('pendulum', 'ballbeam')),
  user_token UUID NOT NULL,
  ip VARCHAR(45),
  city VARCHAR(100),
  country VARCHAR(100),
  used_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
