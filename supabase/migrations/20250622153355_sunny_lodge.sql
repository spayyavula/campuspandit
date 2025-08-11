/*
  # Questions and Answers System Database Schema

  1. New Tables
    - `questions`
      - `id` (uuid, primary key)
      - `title` (text)
      - `content` (text, rich text content)
      - `question_type` (enum: mcq, structured, essay, practical)
      - `difficulty` (enum: easy, medium, hard)
      - `subject` (enum: physics, math, chemistry)
      - `board` (enum: cambridge, ib, cbse, isc, jee, neet)
      - `grade` (text)
      - `topic_tags` (text array)
      - `marks` (integer)
      - `time_limit` (integer, in minutes)
      - `created_by` (uuid, foreign key to auth.users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `is_published` (boolean)

    - `question_options`
      - `id` (uuid, primary key)
      - `question_id` (uuid, foreign key)
      - `option_text` (text, rich text)
      - `option_order` (integer)
      - `is_correct` (boolean)
      - `explanation` (text, rich text)

    - `question_attachments`
      - `id` (uuid, primary key)
      - `question_id` (uuid, foreign key)
      - `file_name` (text)
      - `file_url` (text)
      - `file_type` (text)
      - `file_size` (bigint)

    - `question_collections`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `created_by` (uuid, foreign key)
      - `created_at` (timestamp)
      - `is_public` (boolean)

    - `collection_questions`
      - `id` (uuid, primary key)
      - `collection_id` (uuid, foreign key)
      - `question_id` (uuid, foreign key)
      - `order_index` (integer)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their content
    - Add policies for public access to published content
*/

-- Create custom types
CREATE TYPE question_type AS ENUM ('mcq', 'structured', 'essay', 'practical', 'data_analysis');
CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard');
CREATE TYPE subject_type AS ENUM ('physics', 'math', 'chemistry', 'biology');
CREATE TYPE board_type AS ENUM ('cambridge', 'ib', 'cbse', 'isc', 'jee', 'neet', 'general');

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  question_type question_type NOT NULL DEFAULT 'mcq',
  difficulty difficulty_level NOT NULL DEFAULT 'medium',
  subject subject_type NOT NULL,
  board board_type NOT NULL DEFAULT 'general',
  grade text,
  topic_tags text[] DEFAULT '{}',
  marks integer DEFAULT 1,
  time_limit integer DEFAULT 2, -- in minutes
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_published boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Question options table (for MCQ and similar types)
CREATE TABLE IF NOT EXISTS question_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid REFERENCES questions(id) ON DELETE CASCADE,
  option_text text NOT NULL,
  option_order integer NOT NULL,
  is_correct boolean DEFAULT false,
  explanation text,
  created_at timestamptz DEFAULT now()
);

-- Question attachments table
CREATE TABLE IF NOT EXISTS question_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid REFERENCES questions(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text NOT NULL,
  file_size bigint,
  created_at timestamptz DEFAULT now()
);

-- Question collections table
CREATE TABLE IF NOT EXISTS question_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_public boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Collection questions junction table
CREATE TABLE IF NOT EXISTS collection_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id uuid REFERENCES question_collections(id) ON DELETE CASCADE,
  question_id uuid REFERENCES questions(id) ON DELETE CASCADE,
  order_index integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(collection_id, question_id)
);

-- Student responses table
CREATE TABLE IF NOT EXISTS student_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid REFERENCES questions(id) ON DELETE CASCADE,
  student_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  response_data jsonb NOT NULL,
  is_correct boolean,
  score integer DEFAULT 0,
  time_taken integer, -- in seconds
  submitted_at timestamptz DEFAULT now(),
  session_id uuid
);

-- Question analytics table
CREATE TABLE IF NOT EXISTS question_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid REFERENCES questions(id) ON DELETE CASCADE,
  total_attempts integer DEFAULT 0,
  correct_attempts integer DEFAULT 0,
  average_time integer DEFAULT 0, -- in seconds
  difficulty_rating decimal(3,2) DEFAULT 0.0,
  last_updated timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for questions
CREATE POLICY "Users can view published questions"
  ON questions
  FOR SELECT
  TO authenticated
  USING (is_published = true OR created_by = auth.uid());

CREATE POLICY "Users can create their own questions"
  ON questions
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own questions"
  ON questions
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete their own questions"
  ON questions
  FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- RLS Policies for question_options
CREATE POLICY "Users can view options for accessible questions"
  ON question_options
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM questions 
      WHERE questions.id = question_options.question_id 
      AND (questions.is_published = true OR questions.created_by = auth.uid())
    )
  );

CREATE POLICY "Users can manage options for their questions"
  ON question_options
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM questions 
      WHERE questions.id = question_options.question_id 
      AND questions.created_by = auth.uid()
    )
  );

-- RLS Policies for question_attachments
CREATE POLICY "Users can view attachments for accessible questions"
  ON question_attachments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM questions 
      WHERE questions.id = question_attachments.question_id 
      AND (questions.is_published = true OR questions.created_by = auth.uid())
    )
  );

CREATE POLICY "Users can manage attachments for their questions"
  ON question_attachments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM questions 
      WHERE questions.id = question_attachments.question_id 
      AND questions.created_by = auth.uid()
    )
  );

-- RLS Policies for question_collections
CREATE POLICY "Users can view public collections or their own"
  ON question_collections
  FOR SELECT
  TO authenticated
  USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Users can create their own collections"
  ON question_collections
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own collections"
  ON question_collections
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete their own collections"
  ON question_collections
  FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- RLS Policies for collection_questions
CREATE POLICY "Users can view collection questions for accessible collections"
  ON collection_questions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM question_collections 
      WHERE question_collections.id = collection_questions.collection_id 
      AND (question_collections.is_public = true OR question_collections.created_by = auth.uid())
    )
  );

CREATE POLICY "Users can manage collection questions for their collections"
  ON collection_questions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM question_collections 
      WHERE question_collections.id = collection_questions.collection_id 
      AND question_collections.created_by = auth.uid()
    )
  );

-- RLS Policies for student_responses
CREATE POLICY "Users can view their own responses"
  ON student_responses
  FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Users can create their own responses"
  ON student_responses
  FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid());

-- RLS Policies for question_analytics (read-only for most users)
CREATE POLICY "Users can view analytics for their questions"
  ON question_analytics
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM questions 
      WHERE questions.id = question_analytics.question_id 
      AND questions.created_by = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_questions_subject ON questions(subject);
CREATE INDEX IF NOT EXISTS idx_questions_board ON questions(board);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_created_by ON questions(created_by);
CREATE INDEX IF NOT EXISTS idx_questions_is_published ON questions(is_published);
CREATE INDEX IF NOT EXISTS idx_questions_topic_tags ON questions USING GIN(topic_tags);
CREATE INDEX IF NOT EXISTS idx_question_options_question_id ON question_options(question_id);
CREATE INDEX IF NOT EXISTS idx_question_attachments_question_id ON question_attachments(question_id);
CREATE INDEX IF NOT EXISTS idx_collection_questions_collection_id ON collection_questions(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_questions_question_id ON collection_questions(question_id);
CREATE INDEX IF NOT EXISTS idx_student_responses_question_id ON student_responses(question_id);
CREATE INDEX IF NOT EXISTS idx_student_responses_student_id ON student_responses(student_id);

-- Create functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updating timestamps
CREATE TRIGGER update_questions_updated_at 
  BEFORE UPDATE ON questions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_question_collections_updated_at 
  BEFORE UPDATE ON question_collections 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update question analytics
CREATE OR REPLACE FUNCTION update_question_analytics()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO question_analytics (question_id, total_attempts, correct_attempts, average_time)
  VALUES (NEW.question_id, 1, CASE WHEN NEW.is_correct THEN 1 ELSE 0 END, COALESCE(NEW.time_taken, 0))
  ON CONFLICT (question_id) DO UPDATE SET
    total_attempts = question_analytics.total_attempts + 1,
    correct_attempts = question_analytics.correct_attempts + CASE WHEN NEW.is_correct THEN 1 ELSE 0 END,
    average_time = (question_analytics.average_time * question_analytics.total_attempts + COALESCE(NEW.time_taken, 0)) / (question_analytics.total_attempts + 1),
    last_updated = now();
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for analytics updates
CREATE TRIGGER update_analytics_on_response
  AFTER INSERT ON student_responses
  FOR EACH ROW EXECUTE FUNCTION update_question_analytics();