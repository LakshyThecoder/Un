-- =============================================
-- UKNOW PLATFORM DATABASE SCHEMA
-- =============================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ── PROFILES ──────────────────────────────
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('author', 'reviewer', 'admin')) DEFAULT 'author',
  avatar_url TEXT,
  institution TEXT,
  field TEXT,
  bio TEXT,
  orcid_id TEXT,
  semantic_scholar_id TEXT,
  h_index INTEGER DEFAULT 0,
  publication_count INTEGER DEFAULT 0,
  expertise_tags TEXT[] DEFAULT '{}',
  verified BOOLEAN DEFAULT false,
  rating NUMERIC(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  acceptance_rate NUMERIC(5,2) DEFAULT 0,
  avg_turnaround_days NUMERIC(5,1) DEFAULT 0,
  total_earned NUMERIC(10,2) DEFAULT 0,
  stripe_customer_id TEXT,
  stripe_account_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── MANUSCRIPTS ───────────────────────────
CREATE TABLE manuscripts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  abstract TEXT,
  target_journal TEXT,
  field TEXT,
  status TEXT NOT NULL CHECK (status IN (
    'draft','submitted','matching','matched',
    'in_review','revision_requested','completed','rejected'
  )) DEFAULT 'draft',
  progress INTEGER DEFAULT 0,
  word_count INTEGER,
  page_count INTEGER,
  file_url TEXT,
  file_name TEXT,
  file_type TEXT,
  semantic_concepts JSONB DEFAULT '[]',
  review_price NUMERIC(8,2) DEFAULT 349,
  reviewer_payment NUMERIC(8,2) DEFAULT 220,
  platform_fee NUMERIC(8,2) DEFAULT 129,
  deadline_days INTEGER DEFAULT 5,
  special_instructions TEXT,
  stripe_payment_intent_id TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── MANUSCRIPT FILES ──────────────────────
CREATE TABLE manuscript_files (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  manuscript_id UUID REFERENCES manuscripts(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  url TEXT NOT NULL,
  size BIGINT DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── REVIEWS ───────────────────────────────
CREATE TABLE reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  manuscript_id UUID REFERENCES manuscripts(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN (
    'pending','accepted','active','submitted','completed','declined'
  )) DEFAULT 'pending',
  payment_amount NUMERIC(8,2) DEFAULT 220,
  deadline TIMESTAMPTZ,
  overall_score INTEGER CHECK (overall_score BETWEEN 0 AND 100),
  recommendation TEXT CHECK (recommendation IN (
    'accept','minor_revision','major_revision','reject'
  )),
  summary TEXT,
  checklist_data JSONB DEFAULT '[]',
  match_score NUMERIC(5,2),
  concept_overlap TEXT[] DEFAULT '{}',
  submitted_at TIMESTAMPTZ,
  stripe_transfer_id TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── COMMENTS ──────────────────────────────
CREATE TABLE comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  manuscript_id UUID REFERENCES manuscripts(id) ON DELETE CASCADE NOT NULL,
  review_id UUID REFERENCES reviews(id) ON DELETE SET NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('inline','general','figure')) DEFAULT 'inline',
  content TEXT NOT NULL,
  quote TEXT,
  page_number INTEGER,
  position_x NUMERIC(6,2),
  position_y NUMERIC(6,2),
  figure_id TEXT,
  color TEXT DEFAULT '#FDE68A',
  resolved BOOLEAN DEFAULT false,
  resolved_by UUID REFERENCES profiles(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── COMMENT REPLIES ───────────────────────
CREATE TABLE comment_replies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── MESSAGES ──────────────────────────────
CREATE TABLE messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  manuscript_id UUID REFERENCES manuscripts(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── NOTIFICATIONS ─────────────────────────
CREATE TABLE notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  read BOOLEAN DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── REVIEWER INVITATIONS ──────────────────
CREATE TABLE reviewer_invitations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  manuscript_id UUID REFERENCES manuscripts(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  external_email TEXT,
  semantic_scholar_id TEXT,
  match_score NUMERIC(5,2),
  status TEXT NOT NULL CHECK (status IN ('sent','accepted','declined','expired')) DEFAULT 'sent',
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── INDEXES ───────────────────────────────
CREATE INDEX idx_manuscripts_author ON manuscripts(author_id);
CREATE INDEX idx_manuscripts_status ON manuscripts(status);
CREATE INDEX idx_reviews_manuscript ON reviews(manuscript_id);
CREATE INDEX idx_reviews_reviewer ON reviews(reviewer_id);
CREATE INDEX idx_comments_manuscript ON comments(manuscript_id);
CREATE INDEX idx_comments_review ON comments(review_id);
CREATE INDEX idx_messages_manuscript ON messages(manuscript_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_profiles_role ON profiles(role);

-- Full-text search on profiles expertise
CREATE INDEX idx_profiles_expertise ON profiles USING GIN(expertise_tags);
CREATE INDEX idx_profiles_field ON profiles USING GIN(to_tsvector('english', COALESCE(field,'')));

-- ── ROW LEVEL SECURITY ────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE manuscripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE manuscript_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviewer_invitations ENABLE ROW LEVEL SECURITY;

-- Profiles: anyone can read, only owner can update
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Manuscripts: authors see their own, reviewers see manuscripts they're assigned to
CREATE POLICY "Authors see own manuscripts" ON manuscripts FOR SELECT USING (
  auth.uid() = author_id OR
  EXISTS (SELECT 1 FROM reviews WHERE manuscript_id = manuscripts.id AND reviewer_id = auth.uid())
);
CREATE POLICY "Authors can create manuscripts" ON manuscripts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can update own manuscripts" ON manuscripts FOR UPDATE USING (auth.uid() = author_id);

-- Reviews: visible to author and assigned reviewer
CREATE POLICY "Reviews visible to involved parties" ON reviews FOR SELECT USING (
  EXISTS (SELECT 1 FROM manuscripts WHERE id = manuscript_id AND author_id = auth.uid()) OR
  reviewer_id = auth.uid()
);
CREATE POLICY "Reviewers can update their reviews" ON reviews FOR UPDATE USING (reviewer_id = auth.uid());

-- Comments: visible to manuscript participants
CREATE POLICY "Comments visible to manuscript participants" ON comments FOR SELECT USING (
  EXISTS (SELECT 1 FROM manuscripts WHERE id = manuscript_id AND author_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM reviews WHERE manuscript_id = comments.manuscript_id AND reviewer_id = auth.uid())
);
CREATE POLICY "Authenticated users can insert comments" ON comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Comment authors can update" ON comments FOR UPDATE USING (auth.uid() = author_id);

-- Comment replies
CREATE POLICY "Replies visible to all authenticated" ON comment_replies FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can insert replies" ON comment_replies FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Messages
CREATE POLICY "Messages visible to manuscript participants" ON messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM manuscripts WHERE id = manuscript_id AND author_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM reviews WHERE manuscript_id = messages.manuscript_id AND reviewer_id = auth.uid())
);
CREATE POLICY "Authenticated can send messages" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Notifications: private to user
CREATE POLICY "Users see own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Manuscript files: same as manuscripts
CREATE POLICY "Files visible to manuscript participants" ON manuscript_files FOR SELECT USING (
  EXISTS (SELECT 1 FROM manuscripts WHERE id = manuscript_id AND author_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM reviews WHERE manuscript_id = manuscript_files.manuscript_id AND reviewer_id = auth.uid())
);
CREATE POLICY "Authors can insert files" ON manuscript_files FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM manuscripts WHERE id = manuscript_id AND author_id = auth.uid())
);

-- ── FUNCTIONS & TRIGGERS ──────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'author')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER manuscripts_updated_at BEFORE UPDATE ON manuscripts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER comments_updated_at BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Enable realtime for live collaboration
ALTER PUBLICATION supabase_realtime ADD TABLE comments;
ALTER PUBLICATION supabase_realtime ADD TABLE comment_replies;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE reviews;
