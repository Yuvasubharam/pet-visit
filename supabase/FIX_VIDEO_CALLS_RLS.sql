-- Fix RLS Policies for video_calls to allow INSERT operations
-- This fixes the issue where data is not being stored in the backend

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Service role can insert video_calls" ON video_calls;
DROP POLICY IF EXISTS "Users can insert their calls" ON video_calls;
DROP POLICY IF EXISTS "Doctors can insert their calls" ON video_calls;

-- Allow service role to insert (for backend operations)
CREATE POLICY "Service role can insert video_calls"
  ON video_calls FOR INSERT
  WITH CHECK (true);

-- Allow users to insert video calls for their bookings
CREATE POLICY "Users can insert their calls"
  ON video_calls FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Allow doctors to insert video calls for their bookings
CREATE POLICY "Doctors can insert their calls"
  ON video_calls FOR INSERT
  WITH CHECK (
    doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
  );

-- Fix call_participants policies
ALTER TABLE call_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can insert call_participants" ON call_participants;
DROP POLICY IF EXISTS "Users can insert their participation" ON call_participants;

CREATE POLICY "Service role can insert call_participants"
  ON call_participants FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can insert their participation"
  ON call_participants FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Fix call_events policies
ALTER TABLE call_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can insert call_events" ON call_events;
DROP POLICY IF EXISTS "Users can insert events for their calls" ON call_events;

CREATE POLICY "Service role can insert call_events"
  ON call_events FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can insert events for their calls"
  ON call_events FOR INSERT
  WITH CHECK (
    call_id IN (
      SELECT id FROM video_calls
      WHERE user_id = auth.uid()
         OR doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
    )
  );

-- Fix call_notifications policies
ALTER TABLE call_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can insert call_notifications" ON call_notifications;

CREATE POLICY "Service role can insert call_notifications"
  ON call_notifications FOR INSERT
  WITH CHECK (true);

-- Grant necessary permissions (if not already granted)
GRANT ALL ON video_calls TO authenticated;
GRANT ALL ON call_participants TO authenticated;
GRANT ALL ON call_events TO authenticated;
GRANT ALL ON call_notifications TO authenticated;

-- Grant sequence permissions (for ID generation)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
