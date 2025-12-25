-- ============================================
-- Journal & Accountability System
-- ============================================

-- ============================================
-- PART 1: Personal Journal
-- ============================================

-- Journal Entries (רשומות יומן)
CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  mood TEXT, -- 'great', 'good', 'neutral', 'bad', 'terrible'
  tags TEXT[] DEFAULT '{}',
  is_encrypted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for journal
CREATE INDEX IF NOT EXISTS idx_journal_user_date ON journal_entries(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_journal_tags ON journal_entries USING GIN(tags);

-- ============================================
-- PART 2: Accountability & Engagement System
-- ============================================

-- User Sessions (מעקב כניסות)
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_end TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  pages_visited TEXT[] DEFAULT '{}',
  actions_count INTEGER DEFAULT 0,
  device_type TEXT,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity Tracking (מעקב פעילויות)
CREATE TABLE IF NOT EXISTS activity_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES user_sessions(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- 'habit_completed', 'task_completed', 'goal_set', 'journal_entry', etc.
  activity_category TEXT, -- 'habits', 'tasks', 'goals', 'journal'
  activity_id UUID, -- ID של הפעילות המקורית
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Engagement Metrics (מדדי מעורבות)
CREATE TABLE IF NOT EXISTS engagement_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  -- Login metrics
  logged_in BOOLEAN DEFAULT FALSE,
  login_time TIMESTAMP WITH TIME ZONE,
  total_session_minutes INTEGER DEFAULT 0,
  
  -- Activity metrics
  habits_completed INTEGER DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  goals_tracked INTEGER DEFAULT 0,
  journal_entries INTEGER DEFAULT 0,
  
  -- Engagement score (0-100)
  engagement_score INTEGER DEFAULT 0,
  
  -- Streak tracking
  current_streak INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, date)
);

-- Accountability Alerts (התראות)
CREATE TABLE IF NOT EXISTS accountability_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL, -- 'missed_login', 'low_engagement', 'streak_break', 'milestone'
  severity TEXT DEFAULT 'medium', -- 'low', 'medium', 'high'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  should_send_email BOOLEAN DEFAULT FALSE,
  should_send_whatsapp BOOLEAN DEFAULT FALSE,
  email_sent BOOLEAN DEFAULT FALSE,
  whatsapp_sent BOOLEAN DEFAULT FALSE,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Notification Preferences (העדפות התראות)
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Email settings
  email_enabled BOOLEAN DEFAULT TRUE,
  email_address TEXT,
  
  -- WhatsApp settings
  whatsapp_enabled BOOLEAN DEFAULT FALSE,
  whatsapp_number TEXT,
  
  -- Alert types
  alert_missed_login BOOLEAN DEFAULT TRUE,
  alert_low_engagement BOOLEAN DEFAULT TRUE,
  alert_streak_break BOOLEAN DEFAULT TRUE,
  alert_milestones BOOLEAN DEFAULT TRUE,
  
  -- Timing
  check_time TIME DEFAULT '20:00:00', -- שעה לבדיקה יומית
  quiet_hours_start TIME DEFAULT '22:00:00',
  quiet_hours_end TIME DEFAULT '08:00:00',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- ============================================
-- Indexes for Performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_sessions_user_date ON user_sessions(user_id, session_start DESC);
CREATE INDEX IF NOT EXISTS idx_activity_user_date ON activity_tracking(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_type ON activity_tracking(activity_type);
CREATE INDEX IF NOT EXISTS idx_engagement_user_date ON engagement_metrics(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_user_unread ON accountability_alerts(user_id, is_read, created_at DESC);

-- ============================================
-- Functions & Triggers
-- ============================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_journal_entries_updated_at ON journal_entries;
CREATE TRIGGER update_journal_entries_updated_at
  BEFORE UPDATE ON journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_engagement_metrics_updated_at ON engagement_metrics;
CREATE TRIGGER update_engagement_metrics_updated_at
  BEFORE UPDATE ON engagement_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notification_preferences_updated_at ON notification_preferences;
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate engagement score
CREATE OR REPLACE FUNCTION calculate_engagement_score(
  p_habits_completed INTEGER,
  p_tasks_completed INTEGER,
  p_goals_tracked INTEGER,
  p_journal_entries INTEGER,
  p_session_minutes INTEGER
)
RETURNS INTEGER AS $$
DECLARE
  score INTEGER := 0;
BEGIN
  -- Base points for activities
  score := score + (p_habits_completed * 10);
  score := score + (p_tasks_completed * 8);
  score := score + (p_goals_tracked * 5);
  score := score + (p_journal_entries * 7);
  
  -- Session time (up to 30 points for 60+ minutes)
  IF p_session_minutes >= 60 THEN
    score := score + 30;
  ELSE
    score := score + (p_session_minutes / 2);
  END IF;
  
  -- Cap at 100
  IF score > 100 THEN
    score := 100;
  END IF;
  
  RETURN score;
END;
$$ LANGUAGE plpgsql;

-- Function to update engagement metrics
CREATE OR REPLACE FUNCTION update_engagement_metrics_for_activity()
RETURNS TRIGGER AS $$
DECLARE
  today_date DATE := CURRENT_DATE;
  metrics_record engagement_metrics%ROWTYPE;
BEGIN
  -- Get or create today's metrics
  SELECT * INTO metrics_record
  FROM engagement_metrics
  WHERE user_id = NEW.user_id AND date = today_date;
  
  IF NOT FOUND THEN
    INSERT INTO engagement_metrics (user_id, date)
    VALUES (NEW.user_id, today_date)
    RETURNING * INTO metrics_record;
  END IF;
  
  -- Update counters based on activity type
  IF NEW.activity_type LIKE '%habit%' THEN
    UPDATE engagement_metrics
    SET habits_completed = habits_completed + 1
    WHERE user_id = NEW.user_id AND date = today_date;
  ELSIF NEW.activity_type LIKE '%task%' THEN
    UPDATE engagement_metrics
    SET tasks_completed = tasks_completed + 1
    WHERE user_id = NEW.user_id AND date = today_date;
  ELSIF NEW.activity_type LIKE '%goal%' THEN
    UPDATE engagement_metrics
    SET goals_tracked = goals_tracked + 1
    WHERE user_id = NEW.user_id AND date = today_date;
  ELSIF NEW.activity_type LIKE '%journal%' THEN
    UPDATE engagement_metrics
    SET journal_entries = journal_entries + 1
    WHERE user_id = NEW.user_id AND date = today_date;
  END IF;
  
  -- Recalculate engagement score
  SELECT * INTO metrics_record
  FROM engagement_metrics
  WHERE user_id = NEW.user_id AND date = today_date;
  
  UPDATE engagement_metrics
  SET engagement_score = calculate_engagement_score(
    metrics_record.habits_completed,
    metrics_record.tasks_completed,
    metrics_record.goals_tracked,
    metrics_record.journal_entries,
    metrics_record.total_session_minutes
  )
  WHERE user_id = NEW.user_id AND date = today_date;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for activity tracking
DROP TRIGGER IF EXISTS update_engagement_on_activity ON activity_tracking;
CREATE TRIGGER update_engagement_on_activity
  AFTER INSERT ON activity_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_engagement_metrics_for_activity();

-- ============================================
-- RLS Policies
-- ============================================

ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE accountability_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Journal policies
DROP POLICY IF EXISTS "Users can manage their own journal entries" ON journal_entries;
CREATE POLICY "Users can manage their own journal entries"
  ON journal_entries FOR ALL
  USING (auth.uid() = user_id);

-- Session policies
DROP POLICY IF EXISTS "Users can view their own sessions" ON user_sessions;
CREATE POLICY "Users can view their own sessions"
  ON user_sessions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own sessions" ON user_sessions;
CREATE POLICY "Users can insert their own sessions"
  ON user_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own sessions" ON user_sessions;
CREATE POLICY "Users can update their own sessions"
  ON user_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Activity tracking policies
DROP POLICY IF EXISTS "Users can manage their own activities" ON activity_tracking;
CREATE POLICY "Users can manage their own activities"
  ON activity_tracking FOR ALL
  USING (auth.uid() = user_id);

-- Engagement metrics policies
DROP POLICY IF EXISTS "Users can view their own metrics" ON engagement_metrics;
CREATE POLICY "Users can view their own metrics"
  ON engagement_metrics FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own metrics" ON engagement_metrics;
CREATE POLICY "Users can insert their own metrics"
  ON engagement_metrics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own metrics" ON engagement_metrics;
CREATE POLICY "Users can update their own metrics"
  ON engagement_metrics FOR UPDATE
  USING (auth.uid() = user_id);

-- Alerts policies
DROP POLICY IF EXISTS "Users can manage their own alerts" ON accountability_alerts;
CREATE POLICY "Users can manage their own alerts"
  ON accountability_alerts FOR ALL
  USING (auth.uid() = user_id);

-- Notification preferences policies
DROP POLICY IF EXISTS "Users can manage their own preferences" ON notification_preferences;
CREATE POLICY "Users can manage their own preferences"
  ON notification_preferences FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- Initial Setup
-- ============================================

COMMENT ON TABLE journal_entries IS 'Personal journal entries with optional encryption';
COMMENT ON TABLE user_sessions IS 'Tracks user login sessions and activity';
COMMENT ON TABLE activity_tracking IS 'Detailed tracking of user activities';
COMMENT ON TABLE engagement_metrics IS 'Daily engagement metrics and scores';
COMMENT ON TABLE accountability_alerts IS 'Alerts for missed activities or milestones';
COMMENT ON TABLE notification_preferences IS 'User preferences for email/WhatsApp notifications';
