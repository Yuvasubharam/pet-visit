-- ================================================
-- COMPLETE VIDEO CALLS SETUP - SAFE TO RERUN
-- ================================================
-- This script is idempotent (safe to run multiple times)
-- It will create tables if they don't exist and update policies

-- ================================================
-- 1. CREATE TABLES
-- ================================================

-- Video Calls Table
CREATE TABLE IF NOT EXISTS video_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Agora Channel Details
  channel_name TEXT NOT NULL UNIQUE,
  agora_app_id TEXT NOT NULL,

  -- Call Status
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'ongoing', 'completed', 'cancelled', 'missed')),

  -- Call Timing
  scheduled_start_time TIMESTAMPTZ,
  actual_start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  duration_seconds INTEGER DEFAULT 0,

  -- Recording Details
  recording_enabled BOOLEAN DEFAULT true,
  recording_sid TEXT,
  recording_url TEXT,
  recording_status TEXT DEFAULT 'pending' CHECK (recording_status IN ('pending', 'recording', 'processing', 'completed', 'failed')),

  -- Call Metadata
  doctor_joined BOOLEAN DEFAULT false,
  user_joined BOOLEAN DEFAULT false,
  doctor_join_time TIMESTAMPTZ,
  user_join_time TIMESTAMPTZ,

  -- Additional Info
  notes TEXT,
  call_quality_rating INTEGER CHECK (call_quality_rating >= 1 AND call_quality_rating <= 5),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Call Participants Table
CREATE TABLE IF NOT EXISTS call_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID NOT NULL REFERENCES video_calls(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_type TEXT NOT NULL CHECK (user_type IN ('doctor', 'customer', 'assistant')),

  -- Participant Details
  join_time TIMESTAMPTZ,
  leave_time TIMESTAMPTZ,
  duration_seconds INTEGER DEFAULT 0,

  -- Agora Token
  agora_token TEXT,
  token_expiry TIMESTAMPTZ,

  -- Connection Quality
  connection_quality TEXT CHECK (connection_quality IN ('excellent', 'good', 'fair', 'poor')),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Call Events Table
CREATE TABLE IF NOT EXISTS call_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID NOT NULL REFERENCES video_calls(id) ON DELETE CASCADE,

  event_type TEXT NOT NULL CHECK (event_type IN (
    'call_created', 'call_started', 'call_ended', 'call_cancelled',
    'participant_joined', 'participant_left',
    'recording_started', 'recording_stopped', 'recording_uploaded',
    'error', 'quality_issue'
  )),

  event_data JSONB,
  user_id UUID REFERENCES auth.users(id),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Call Notifications Table
CREATE TABLE IF NOT EXISTS call_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID NOT NULL REFERENCES video_calls(id) ON DELETE CASCADE,
  recipient_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  notification_type TEXT NOT NULL CHECK (notification_type IN (
    'call_scheduled', 'call_starting_soon', 'call_started',
    'doctor_joined', 'user_joined', 'call_missed', 'call_ended',
    'recording_available'
  )),

  title TEXT NOT NULL,
  message TEXT NOT NULL,

  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,

  -- Delivery Status
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- 2. CREATE INDEXES
-- ================================================

CREATE INDEX IF NOT EXISTS idx_video_calls_booking_id ON video_calls(booking_id);
CREATE INDEX IF NOT EXISTS idx_video_calls_doctor_id ON video_calls(doctor_id);
CREATE INDEX IF NOT EXISTS idx_video_calls_user_id ON video_calls(user_id);
CREATE INDEX IF NOT EXISTS idx_video_calls_channel_name ON video_calls(channel_name);
CREATE INDEX IF NOT EXISTS idx_video_calls_status ON video_calls(status);
CREATE INDEX IF NOT EXISTS idx_video_calls_scheduled_start ON video_calls(scheduled_start_time);

CREATE INDEX IF NOT EXISTS idx_call_participants_call_id ON call_participants(call_id);
CREATE INDEX IF NOT EXISTS idx_call_participants_user_id ON call_participants(user_id);

CREATE INDEX IF NOT EXISTS idx_call_events_call_id ON call_events(call_id);
CREATE INDEX IF NOT EXISTS idx_call_events_type ON call_events(event_type);
CREATE INDEX IF NOT EXISTS idx_call_events_created_at ON call_events(created_at);

CREATE INDEX IF NOT EXISTS idx_call_notifications_call_id ON call_notifications(call_id);
CREATE INDEX IF NOT EXISTS idx_call_notifications_recipient ON call_notifications(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_call_notifications_is_read ON call_notifications(is_read);

-- ================================================
-- 3. CREATE FUNCTIONS
-- ================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_video_calls_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create call notification (SECURITY DEFINER to bypass RLS)
CREATE OR REPLACE FUNCTION create_call_notification(
  p_call_id UUID,
  p_recipient_user_id UUID,
  p_notification_type TEXT,
  p_title TEXT,
  p_message TEXT
)
RETURNS UUID
SECURITY DEFINER -- This is critical - runs with function owner's permissions
SET search_path = public
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO call_notifications (
    call_id, recipient_user_id, notification_type, title, message
  ) VALUES (
    p_call_id, p_recipient_user_id, p_notification_type, p_title, p_message
  ) RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql;

-- Function to log call events (SECURITY DEFINER to bypass RLS)
CREATE OR REPLACE FUNCTION log_call_event(
  p_call_id UUID,
  p_event_type TEXT,
  p_event_data JSONB DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
)
RETURNS UUID
SECURITY DEFINER -- This is critical - runs with function owner's permissions
SET search_path = public
AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO call_events (call_id, event_type, event_data, user_id)
  VALUES (p_call_id, p_event_type, p_event_data, p_user_id)
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql;

-- Function to notify on call created (SECURITY DEFINER to bypass RLS)
CREATE OR REPLACE FUNCTION notify_on_call_created()
RETURNS TRIGGER
SECURITY DEFINER -- This is critical - runs with function owner's permissions
SET search_path = public
AS $$
DECLARE
  v_doctor_user_id UUID;
BEGIN
  -- Get doctor's user_id
  SELECT user_id INTO v_doctor_user_id FROM doctors WHERE id = NEW.doctor_id;

  -- Notify customer
  PERFORM create_call_notification(
    NEW.id,
    NEW.user_id,
    'call_scheduled',
    'Video Call Scheduled',
    'Your video consultation has been scheduled'
  );

  -- Notify doctor
  IF v_doctor_user_id IS NOT NULL THEN
    PERFORM create_call_notification(
      NEW.id,
      v_doctor_user_id,
      'call_scheduled',
      'New Video Call Scheduled',
      'You have a new video consultation scheduled'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- 4. CREATE/RECREATE TRIGGERS
-- ================================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS video_calls_updated_at_trigger ON video_calls;
DROP TRIGGER IF EXISTS call_participants_updated_at_trigger ON call_participants;
DROP TRIGGER IF EXISTS video_call_created_notification ON video_calls;

-- Create triggers
CREATE TRIGGER video_calls_updated_at_trigger
  BEFORE UPDATE ON video_calls
  FOR EACH ROW
  EXECUTE FUNCTION update_video_calls_updated_at();

CREATE TRIGGER call_participants_updated_at_trigger
  BEFORE UPDATE ON call_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_video_calls_updated_at();

CREATE TRIGGER video_call_created_notification
  AFTER INSERT ON video_calls
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_call_created();

-- ================================================
-- 5. ENABLE ROW LEVEL SECURITY
-- ================================================

ALTER TABLE video_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_notifications ENABLE ROW LEVEL SECURITY;

-- ================================================
-- 6. DROP EXISTING POLICIES (Clean slate)
-- ================================================

-- video_calls policies
DROP POLICY IF EXISTS "Doctors can view their calls" ON video_calls;
DROP POLICY IF EXISTS "Users can view their calls" ON video_calls;
DROP POLICY IF EXISTS "Doctors can update their calls" ON video_calls;
DROP POLICY IF EXISTS "Users can update their calls" ON video_calls;
DROP POLICY IF EXISTS "Service role full access to video_calls" ON video_calls;
DROP POLICY IF EXISTS "Service role can insert video_calls" ON video_calls;
DROP POLICY IF EXISTS "Users can insert their calls" ON video_calls;
DROP POLICY IF EXISTS "Doctors can insert their calls" ON video_calls;

-- call_participants policies
DROP POLICY IF EXISTS "Users can view their participation" ON call_participants;
DROP POLICY IF EXISTS "Service role full access to call_participants" ON call_participants;
DROP POLICY IF EXISTS "Service role can insert call_participants" ON call_participants;
DROP POLICY IF EXISTS "Users can insert their participation" ON call_participants;

-- call_events policies
DROP POLICY IF EXISTS "Users can view events for their calls" ON call_events;
DROP POLICY IF EXISTS "Service role full access to call_events" ON call_events;
DROP POLICY IF EXISTS "Service role can insert call_events" ON call_events;
DROP POLICY IF EXISTS "Users can insert events for their calls" ON call_events;

-- call_notifications policies
DROP POLICY IF EXISTS "Users can view their notifications" ON call_notifications;
DROP POLICY IF EXISTS "Users can update their notifications" ON call_notifications;
DROP POLICY IF EXISTS "Service role full access to call_notifications" ON call_notifications;
DROP POLICY IF EXISTS "Service role can insert call_notifications" ON call_notifications;

-- ================================================
-- 7. CREATE RLS POLICIES
-- ================================================

-- ============ VIDEO_CALLS POLICIES ============

-- SELECT policies
CREATE POLICY "Doctors can view their calls"
  ON video_calls FOR SELECT
  USING (
    doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can view their calls"
  ON video_calls FOR SELECT
  USING (user_id = auth.uid());

-- INSERT policies (CRITICAL FOR FIXING THE ERROR)
CREATE POLICY "Users can insert their calls"
  ON video_calls FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Doctors can insert their calls"
  ON video_calls FOR INSERT
  WITH CHECK (
    doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
  );

-- UPDATE policies
CREATE POLICY "Doctors can update their calls"
  ON video_calls FOR UPDATE
  USING (
    doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update their calls"
  ON video_calls FOR UPDATE
  USING (user_id = auth.uid());

-- ============ CALL_PARTICIPANTS POLICIES ============

CREATE POLICY "Users can view their participation"
  ON call_participants FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their participation"
  ON call_participants FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ============ CALL_EVENTS POLICIES ============

CREATE POLICY "Users can view events for their calls"
  ON call_events FOR SELECT
  USING (
    call_id IN (
      SELECT id FROM video_calls
      WHERE user_id = auth.uid()
         OR doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert events for their calls"
  ON call_events FOR INSERT
  WITH CHECK (
    call_id IN (
      SELECT id FROM video_calls
      WHERE user_id = auth.uid()
         OR doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
    )
  );

-- ============ CALL_NOTIFICATIONS POLICIES ============

CREATE POLICY "Users can view their notifications"
  ON call_notifications FOR SELECT
  USING (recipient_user_id = auth.uid());

CREATE POLICY "Users can update their notifications"
  ON call_notifications FOR UPDATE
  USING (recipient_user_id = auth.uid());

-- IMPORTANT: No INSERT policy needed for call_notifications
-- The trigger function uses SECURITY DEFINER to bypass RLS

-- ================================================
-- 8. GRANT PERMISSIONS
-- ================================================

GRANT ALL ON video_calls TO authenticated;
GRANT ALL ON call_participants TO authenticated;
GRANT ALL ON call_events TO authenticated;
GRANT ALL ON call_notifications TO authenticated;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ================================================
-- SETUP COMPLETE!
-- ================================================

-- Verify setup
DO $$
BEGIN
  RAISE NOTICE '✅ Video Calls Setup Complete!';
  RAISE NOTICE '📋 Tables created: video_calls, call_participants, call_events, call_notifications';
  RAISE NOTICE '🔒 RLS policies applied';
  RAISE NOTICE '⚡ Triggers configured';
  RAISE NOTICE '🎯 Ready to use!';
END $$;
