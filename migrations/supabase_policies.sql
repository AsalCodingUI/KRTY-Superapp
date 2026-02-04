-- KRETYA APP ROW LEVEL SECURITY (RLS) POLICIES
-- Execute this in your Supabase SQL Editor to enable defense-in-depth

-- 1. PROFILES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone" 
ON profiles FOR SELECT 
USING ( true );

CREATE POLICY "Users can insert their own profile" 
ON profiles FOR INSERT 
WITH CHECK ( auth.uid() = id );

CREATE POLICY "Users can update their own profile" 
ON profiles FOR UPDATE 
USING ( auth.uid() = id );

-- 2. PROJECTS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view all projects
CREATE POLICY "Authenticated users can view projects" 
ON projects FOR SELECT 
USING ( auth.role() = 'authenticated' );

-- Only stakeholders can create projects (Defense in depth)
-- Note: Requires a helper function or subquery to check role
-- Assuming we stick to application-level logic for complex role checks, 
-- but strict RLS would look like:
-- CREATE POLICY "Stakeholders can create projects" 
-- ON projects FOR INSERT 
-- WITH CHECK ( 
--   EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'stakeholder') 
-- );

-- 3. PROJECT ASSIGNMENTS
ALTER TABLE project_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View project assignments" 
ON project_assignments FOR SELECT 
USING ( auth.role() = 'authenticated' );

-- 4. CALENDAR EVENTS
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View all calendar events" 
ON calendar_events FOR SELECT 
USING ( auth.role() = 'authenticated' );

CREATE POLICY "Stakeholders can manage calendar events" 
ON calendar_events FOR ALL 
USING ( 
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'stakeholder') 
);

-- 5. NOTIFICATIONS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" 
ON notifications FOR SELECT 
USING ( auth.uid() = user_id );

CREATE POLICY "Users can update their own notifications" 
ON notifications FOR UPDATE 
USING ( auth.uid() = user_id );

-- 6. PERFORMANCE REVIEWS
ALTER TABLE performance_reviews ENABLE ROW LEVEL SECURITY;

-- Users can see reviews where they are the reviewee OR the reviewer
CREATE POLICY "View related reviews" 
ON performance_reviews FOR SELECT 
USING ( 
  auth.uid() = reviewee_id OR 
  auth.uid() = reviewer_id OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'stakeholder')
);

-- 7. ATTENDANCE LOGS
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View own logs or stakeholder view all" 
ON attendance_logs FOR SELECT 
USING ( 
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'stakeholder')
);

CREATE POLICY "Users can insert own logs (Clock In/Out)" 
ON attendance_logs FOR INSERT 
WITH CHECK ( auth.uid() = user_id );

CREATE POLICY "Users can update own logs (Clock Out)" 
ON attendance_logs FOR UPDATE 
USING ( auth.uid() = user_id );

-- 8. LEAVE REQUESTS
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View own leaves or stakeholder view all" 
ON leave_requests FOR SELECT 
USING ( 
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'stakeholder')
);

CREATE POLICY "Users can create leave requests" 
ON leave_requests FOR INSERT 
WITH CHECK ( auth.uid() = user_id );

