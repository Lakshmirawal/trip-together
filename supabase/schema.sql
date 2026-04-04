-- TripTogether Database Schema
-- Run this in Supabase SQL Editor

-- TRIPS
CREATE TABLE IF NOT EXISTS trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  destination TEXT,
  dates_start DATE,
  dates_end DATE,
  budget_min INTEGER,
  budget_max INTEGER,
  group_size INTEGER NOT NULL DEFAULT 4,
  organiser_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'confirmed', 'ongoing', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TRIP MEMBERS
CREATE TABLE IF NOT EXISTS trip_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  dietary TEXT NOT NULL DEFAULT 'No preference',
  budget_comfort TEXT NOT NULL DEFAULT '₹4,000–8,000',
  interests TEXT[] DEFAULT '{}',
  accessibility TEXT,
  dream_destination TEXT,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('organiser', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW()
);

-- ITINERARY ITEMS
CREATE TABLE IF NOT EXISTS itinerary_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  day_date DATE,
  time TEXT,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  cost_per_person INTEGER,
  category TEXT NOT NULL DEFAULT 'activity' CHECK (category IN ('transport', 'accommodation', 'food', 'activity', 'other')),
  timing_intel TEXT,
  transport_intel TEXT,
  dietary_badge TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TASKS
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to_member_id UUID REFERENCES trip_members(id) ON DELETE SET NULL,
  assigned_to_name TEXT,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'done')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- EXPENSES
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  category TEXT NOT NULL DEFAULT 'other' CHECK (category IN ('accommodation', 'food', 'transport', 'activities', 'other')),
  added_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ───────────────────────────────────────────

ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE itinerary_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- TRIPS POLICIES
-- Organisers: full access to their own trips
CREATE POLICY "organiser_all_trips" ON trips
  FOR ALL USING (auth.uid() = organiser_id);

-- Members: read trips they've joined
CREATE POLICY "member_read_trips" ON trips
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = trips.id
        AND trip_members.user_id = auth.uid()
    )
  );

-- Public read by invite token (for join flow)
CREATE POLICY "public_read_by_token" ON trips
  FOR SELECT USING (invite_token IS NOT NULL);

-- TRIP MEMBERS POLICIES
CREATE POLICY "organiser_all_members" ON trip_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = trip_members.trip_id
        AND trips.organiser_id = auth.uid()
    )
  );

CREATE POLICY "member_read_own_trip_members" ON trip_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM trip_members tm2
      WHERE tm2.trip_id = trip_members.trip_id
        AND tm2.user_id = auth.uid()
    )
  );

-- Public insert for passive join (no auth)
CREATE POLICY "public_insert_members" ON trip_members
  FOR INSERT WITH CHECK (true);

-- ITINERARY POLICIES
CREATE POLICY "organiser_all_itinerary" ON itinerary_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = itinerary_items.trip_id
        AND trips.organiser_id = auth.uid()
    )
  );

CREATE POLICY "member_read_itinerary" ON itinerary_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = itinerary_items.trip_id
        AND trip_members.user_id = auth.uid()
    )
  );

-- Public read itinerary by trip members (passives viewing shared plan)
CREATE POLICY "public_read_itinerary" ON itinerary_items
  FOR SELECT USING (true);

-- TASKS POLICIES
CREATE POLICY "organiser_all_tasks" ON tasks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = tasks.trip_id
        AND trips.organiser_id = auth.uid()
    )
  );

CREATE POLICY "member_read_tasks" ON tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = tasks.trip_id
        AND trip_members.user_id = auth.uid()
    )
  );

-- EXPENSES POLICIES
CREATE POLICY "organiser_all_expenses" ON expenses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = expenses.trip_id
        AND trips.organiser_id = auth.uid()
    )
  );

CREATE POLICY "member_read_expenses" ON expenses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = expenses.trip_id
        AND trip_members.user_id = auth.uid()
    )
  );

-- ───────────────────────────────────────────
-- REALTIME: Enable for live subscriptions
-- ───────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE itinerary_items;
ALTER PUBLICATION supabase_realtime ADD TABLE trip_members;
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;

-- ───────────────────────────────────────────
-- INDEXES
-- ───────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_trips_organiser ON trips(organiser_id);
CREATE INDEX IF NOT EXISTS idx_trips_invite_token ON trips(invite_token);
CREATE INDEX IF NOT EXISTS idx_trip_members_trip ON trip_members(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_members_user ON trip_members(user_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_trip ON itinerary_items(trip_id, day_number, order_index);
CREATE INDEX IF NOT EXISTS idx_tasks_trip ON tasks(trip_id);
CREATE INDEX IF NOT EXISTS idx_expenses_trip ON expenses(trip_id);
