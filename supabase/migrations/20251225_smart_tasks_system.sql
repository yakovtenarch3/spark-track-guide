-- ============================================
-- Smart Task Management System
-- ============================================

-- Task Categories (קטגוריות ראשיות ותת-קטגוריות)
CREATE TABLE IF NOT EXISTS task_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES task_categories(id) ON DELETE CASCADE,
  color TEXT DEFAULT '#3B82F6',
  icon TEXT DEFAULT '📋',
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name, parent_id)
);

-- Tasks (משימות)
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES task_categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  
  -- Scheduling
  due_date DATE,
  due_time TIME,
  estimated_duration INTEGER, -- בדקות
  
  -- Priority & Status
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  
  -- Recurrence
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_pattern TEXT, -- 'daily', 'weekly', 'monthly', 'custom'
  recurrence_days INTEGER[], -- ימים בשבוע (0-6) או בחודש (1-31)
  
  -- Tracking
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  actual_duration INTEGER, -- בדקות
  
  -- Metadata
  tags TEXT[] DEFAULT '{}',
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Task Completions (מעקב השלמות יומי)
CREATE TABLE IF NOT EXISTS task_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- When
  completed_date DATE NOT NULL,
  completed_time TIME NOT NULL,
  
  -- Performance
  was_on_time BOOLEAN DEFAULT TRUE,
  actual_duration INTEGER, -- בדקות
  difficulty_rating INTEGER CHECK (difficulty_rating BETWEEN 1 AND 5),
  energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 5),
  
  -- Context
  day_of_week INTEGER, -- 0-6
  hour_of_day INTEGER, -- 0-23
  weather TEXT, -- אופציונלי
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(task_id, completed_date)
);

-- Task Failures (מעקב נפילות)
CREATE TABLE IF NOT EXISTS task_failures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  failed_date DATE NOT NULL,
  reason TEXT,
  day_of_week INTEGER,
  hour_of_day INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_task_completions_date ON task_completions(completed_date DESC);
CREATE INDEX IF NOT EXISTS idx_task_completions_user ON task_completions(user_id, completed_date DESC);
CREATE INDEX IF NOT EXISTS idx_task_failures_date ON task_failures(failed_date DESC);

-- Function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to extract day/hour from completions
CREATE OR REPLACE FUNCTION extract_completion_context()
RETURNS TRIGGER AS $$
BEGIN
    NEW.day_of_week = EXTRACT(DOW FROM NEW.completed_date);
    NEW.hour_of_day = EXTRACT(HOUR FROM NEW.completed_time);
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER extract_task_completion_context BEFORE INSERT ON task_completions
FOR EACH ROW EXECUTE FUNCTION extract_completion_context();

-- Function to track failures
CREATE OR REPLACE FUNCTION track_task_failure()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status = 'pending' AND NEW.status = 'cancelled' THEN
        INSERT INTO task_failures (task_id, user_id, failed_date, day_of_week, hour_of_day)
        VALUES (
            NEW.id, 
            NEW.user_id, 
            COALESCE(NEW.due_date, CURRENT_DATE),
            EXTRACT(DOW FROM CURRENT_DATE),
            EXTRACT(HOUR FROM CURRENT_TIME)
        );
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER track_task_failure_trigger AFTER UPDATE ON tasks
FOR EACH ROW EXECUTE FUNCTION track_task_failure();

-- Comments
COMMENT ON TABLE task_categories IS 'קטגוריות ותת-קטגוריות למשימות';
COMMENT ON TABLE tasks IS 'משימות עם מעקב מלא וניתוח חכם';
COMMENT ON TABLE task_completions IS 'מעקב אחר השלמות משימות עם קונטקסט';
COMMENT ON TABLE task_failures IS 'מעקב אחר נפילות וביטולים';

COMMENT ON COLUMN tasks.estimated_duration IS 'זמן משוער בדקות';
COMMENT ON COLUMN tasks.actual_duration IS 'זמן בפועל בדקות';
COMMENT ON COLUMN task_completions.was_on_time IS 'האם הושלם בזמן';
COMMENT ON COLUMN task_completions.energy_level IS 'רמת אנרגיה בזמן ההשלמה (1-5)';
COMMENT ON COLUMN task_completions.difficulty_rating IS 'דירוג קושי (1-5)';
