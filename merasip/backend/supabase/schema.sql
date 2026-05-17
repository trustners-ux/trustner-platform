-- =============================================================================
-- RISK PROFILES
-- =============================================================================
CREATE TABLE risk_profiles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id    UUID REFERENCES clients(id),
  answers      JSONB NOT NULL,
  score        INT NOT NULL,
  profile      TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_risk_profiles_client ON risk_profiles(client_id);

ALTER TABLE risk_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "advisor_own_risk_profiles" ON risk_profiles
  FOR ALL USING (
    client_id IN (SELECT id FROM clients WHERE advisor_id = auth.uid())
  );

-- =============================================================================
-- CLIENT GOALS
-- =============================================================================
CREATE TABLE goals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       UUID REFERENCES clients(id),
  name            TEXT NOT NULL,
  target_amount   NUMERIC NOT NULL,
  target_date     DATE NOT NULL,
  current_savings NUMERIC DEFAULT 0,
  monthly_sip     NUMERIC DEFAULT 0,
  expected_return NUMERIC DEFAULT 12.0,
  inflation       NUMERIC DEFAULT 6.0,
  priority        TEXT DEFAULT 'High',
  status          TEXT DEFAULT 'active',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_goals_client ON goals(client_id);

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "advisor_own_goals" ON goals
  FOR ALL USING (
    client_id IN (SELECT id FROM clients WHERE advisor_id = auth.uid())
  );

-- =============================================================================
-- HEALTH SCORE HISTORY
-- =============================================================================
CREATE TABLE health_scores (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id    UUID REFERENCES clients(id),
  portfolio_id UUID REFERENCES portfolios(id),
  total_score  INT NOT NULL,
  grade        TEXT NOT NULL,
  dimensions   JSONB NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_health_scores_client ON health_scores(client_id);

ALTER TABLE health_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "advisor_own_health_scores" ON health_scores
  FOR ALL USING (
    client_id IN (SELECT id FROM clients WHERE advisor_id = auth.uid())
  );
