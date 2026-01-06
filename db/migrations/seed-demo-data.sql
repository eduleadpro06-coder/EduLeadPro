-- =====================================================
-- STEP 1: Using your existing enrolled leads
-- =====================================================

-- Skipping - you already have leads marked as enrolled!
-- The script will use your existing enrolled leads data

-- =====================================================
-- STEP 2: Add sample daily updates
-- =====================================================

INSERT INTO daily_updates (
  organization_id, 
  class_name, 
  teacher_name, 
  title, 
  content, 
  activity_type, 
  mood, 
  posted_at
)
SELECT 
  o.id as organization_id,
  'Nursery' as class_name,
  'Priya Sharma' as teacher_name,
  'Wonderful Monday!' as title,
  'The children had a delightful day exploring colors! We painted with red, blue, and yellow. The little ones were so excited to mix colors and see green, orange, and purple appear. Everyone participated enthusiastically.' as content,
  'art' as activity_type,
  'happy' as mood,
  NOW() - INTERVAL '2 hours' as posted_at
FROM organizations o
LIMIT 1;


INSERT INTO daily_updates (
  organization_id,
  lead_id,
  class_name,
  teacher_name,
  title,
  content,
  activity_type,
  mood,
  posted_at
)
SELECT 
  l.organization_id,
  l.id as lead_id,
  l.class as class_name,
  'Ravi Kumar' as teacher_name,
  'Great Progress in Counting!' as title,
  'Your child showed excellent progress in counting today! We practiced counting from 1 to 20, and they did it all by themselves. So proud!' as content,
  'learning' as activity_type,
  'happy' as mood,
  NOW() - INTERVAL '4 hours' as posted_at
FROM leads l
WHERE l.status = 'enrolled' AND l.class = 'LKG'
LIMIT 1;


INSERT INTO daily_updates (
  organization_id,
  class_name,
  teacher_name,
  title,
  content,
  activity_type,
  mood,
  posted_at
)
SELECT 
  o.id as organization_id,
  'UKG' as class_name,
  'Anita Desai' as teacher_name,
  'Healthy Lunch Time' as title,
  'All children enjoyed their lunch today. We also talked about healthy eating habits. The kids learned about fruits and vegetables.' as content,
  'meal' as activity_type,
  'calm' as mood,
  NOW() - INTERVAL '6 hours' as posted_at
FROM organizations o
LIMIT 1;


-- =====================================================
-- STEP 3: Add sample homework
-- =====================================================

INSERT INTO preschool_homework (
  organization_id,
  class_name,
  teacher_name,
  subject,
  title,
  description,
  due_date
)
SELECT 
  o.id as organization_id,
  'Nursery' as class_name,
  'Priya Sharma' as teacher_name,
  'Art' as subject,
  'Draw Your Family' as title,
  'Draw a picture of your family members. Use lots of colors! Parents, please help your child write their name on the drawing.' as description,
  CURRENT_DATE + INTERVAL '3 days' as due_date
FROM organizations o
LIMIT 1;

INSERT INTO preschool_homework (
  organization_id,
  class_name,
  teacher_name,
  subject,
  title,
  description,
  due_date
)
SELECT 
  o.id as organization_id,
  'LKG' as class_name,
  'Ravi Kumar' as teacher_name,
  'Math' as subject,
  'Count and Color' as title,
  'Count objects in each group and color them. Worksheet will be sent in your child''s bag.' as description,
  CURRENT_DATE + INTERVAL '2 days' as due_date
FROM organizations o
LIMIT 1;

INSERT INTO preschool_homework (
  organization_id,
  class_name,
  teacher_name,
  subject,
  title,
  description,
  due_date
)
SELECT 
  o.id as organization_id,
  'UKG' as class_name,
  'Anita Desai' as teacher_name,
  'Language' as subject,
  'Practice Writing A-E' as title,
  'Practice writing capital letters A, B, C, D, and E. Make sure to follow the arrows on the worksheet.' as description,
  CURRENT_DATE + INTERVAL '4 days' as due_date
FROM organizations o
LIMIT 1;

-- =====================================================
-- STEP 4: Add sample announcements
-- =====================================================

INSERT INTO preschool_announcements (
  organization_id,
  title,
  content,
  priority,
  target_roles,
  created_by
)
SELECT 
  o.id as organization_id,
  'Parent-Teacher Meeting on Saturday' as title,
  'Dear Parents, We will be having a Parent-Teacher Meeting this Saturday, 10 AM - 1 PM. Please make sure to attend to discuss your child''s progress. Looking forward to seeing you!' as content,
  'high' as priority,
  ARRAY['parent'] as target_roles,
  'Admin' as created_by
FROM organizations o
LIMIT 1;

INSERT INTO preschool_announcements (
  organization_id,
  title,
  content,
  priority,
  target_roles,
  target_classes
)
SELECT 
  o.id as organization_id,
  'Colorful Friday - Dress Code' as title,
  'This Friday is "Colorful Friday"! Children can wear colorful clothes (any bright colors). Let''s make it a fun day!' as content,
  'normal' as priority,
  ARRAY['parent', 'teacher'] as target_roles,
  ARRAY['Nursery', 'LKG', 'UKG'] as target_classes
FROM organizations o
LIMIT 1;

-- =====================================================
-- STEP 5: Add sample events
-- =====================================================

INSERT INTO preschool_events (
  organization_id,
  title,
  description,
  event_date,
  event_time,
  event_type,
  created_by
)
SELECT 
  o.id as organization_id,
  'Annual Day Celebration' as title,
  'Annual cultural program and prize distribution' as description,
  CURRENT_DATE + INTERVAL '30 days' as event_date,
  '10:00' as event_time,
  'celebration' as event_type,
  'Admin' as created_by
FROM organizations o
LIMIT 1;

INSERT INTO preschool_events (
  organization_id,
  title,
  description,
  event_date,
  event_time,
  event_type,
  created_by
)
SELECT 
  o.id as organization_id,
  'Sports Day' as title,
  'Fun sports activities for all classes' as description,
  CURRENT_DATE + INTERVAL '45 days' as event_date,
  '09:00' as event_time,
  'sports' as event_type,
  'Admin' as created_by
FROM organizations o
LIMIT 1;

-- =====================================================
-- STEP 6: Add sample attendance (last 5 days)
-- =====================================================

INSERT INTO student_attendance (
  organization_id,
  lead_id,
  date,
  status,
  check_in_time,
  marked_by
)
SELECT 
  l.organization_id,
  l.id as lead_id,  
  d.date,
  CASE 
    WHEN RANDOM() < 0.95 THEN 'present'
    ELSE 'absent'
  END as status,
  CASE 
    WHEN RANDOM() < 0.95 THEN '08:45:00'::TIME
    ELSE NULL
  END as check_in_time,
  'Teacher' as marked_by
FROM leads l
CROSS JOIN (
  SELECT CURRENT_DATE - i AS date 
  FROM generate_series(0, 4) AS i
) d
WHERE l.status = 'enrolled'
  AND l.class IN ('Nursery', 'LKG', 'UKG', 'Pre-KG', 'Play Group')
ON CONFLICT (lead_id, date) DO NOTHING;


-- =====================================================
-- VERIFICATION
-- =====================================================

SELECT 
  'Enrolled Students' as entity, COUNT(*) as count 
FROM leads WHERE status = 'enrolled'
UNION ALL 
SELECT 'Daily Updates', COUNT(*) FROM daily_updates
UNION ALL 
SELECT 'Homework', COUNT(*) FROM preschool_homework
UNION ALL 
SELECT 'Announcements', COUNT(*) FROM preschool_announcements
UNION ALL 
SELECT 'Events', COUNT(*) FROM preschool_events
UNION ALL 
SELECT 'Attendance Records', COUNT(*) FROM student_attendance;

-- Show sample enrolled students
SELECT 
  id,
  name,
  class,
  parent_name,
  phone,
  enrollment_date
FROM leads 
WHERE status = 'enrolled'
ORDER BY class, name
LIMIT 10;

