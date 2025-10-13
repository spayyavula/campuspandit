-- Notes and Flashcards System Schema
-- For storing student notes and flashcards from NotebookLM and other sources

-- =====================================================
-- 1. STUDENT NOTES
-- =====================================================

CREATE TABLE IF NOT EXISTS student_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

    -- Association
    resource_id UUID REFERENCES learning_resources(id) ON DELETE SET NULL,
    chapter_id UUID REFERENCES resource_chapters(id) ON DELETE SET NULL,
    subject TEXT NOT NULL,
    topic TEXT,

    -- Note Content
    title TEXT NOT NULL,
    content TEXT NOT NULL, -- Markdown supported
    summary TEXT,

    -- Source
    source_type TEXT CHECK (source_type IN ('notebooklm', 'manual', 'tutor_session', 'textbook', 'online', 'other')),
    notebooklm_notebook_id TEXT, -- Reference to NotebookLM notebook
    original_source_url TEXT,

    -- Organization
    tags TEXT[],
    category TEXT CHECK (category IN ('concept', 'formula', 'problem_solving', 'revision', 'doubt', 'important', 'exam_tip')),

    -- Quality Metrics
    completeness_score INTEGER CHECK (completeness_score BETWEEN 1 AND 5),
    usefulness_rating INTEGER CHECK (usefulness_rating BETWEEN 1 AND 5),

    -- Study Info
    estimated_revision_time_minutes INTEGER,
    last_reviewed_at TIMESTAMPTZ,
    times_reviewed INTEGER DEFAULT 0,
    is_important BOOLEAN DEFAULT false,
    is_doubt_cleared BOOLEAN DEFAULT false,

    -- Sharing
    is_shared BOOLEAN DEFAULT false,
    shared_with_tutor BOOLEAN DEFAULT false,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. FLASHCARD SETS
-- =====================================================

CREATE TABLE IF NOT EXISTS flashcard_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

    -- Association
    resource_id UUID REFERENCES learning_resources(id) ON DELETE SET NULL,
    chapter_id UUID REFERENCES resource_chapters(id) ON DELETE SET NULL,
    subject TEXT NOT NULL,
    topic TEXT,

    -- Set Details
    title TEXT NOT NULL,
    description TEXT,
    total_cards INTEGER DEFAULT 0,

    -- Source
    source_type TEXT CHECK (source_type IN ('notebooklm', 'manual', 'anki_import', 'quizlet_import', 'tutor_provided', 'other')),
    notebooklm_reference TEXT,

    -- Organization
    tags TEXT[],
    difficulty_level TEXT CHECK (difficulty_level IN ('easy', 'medium', 'hard', 'mixed')),
    card_types TEXT[], -- ['definition', 'formula', 'concept', 'numerical']

    -- Progress
    cards_mastered INTEGER DEFAULT 0,
    cards_learning INTEGER DEFAULT 0,
    cards_new INTEGER DEFAULT 0,
    average_confidence DECIMAL(3,2) DEFAULT 0,

    -- Study Schedule
    recommended_daily_cards INTEGER DEFAULT 20,
    last_studied_at TIMESTAMPTZ,
    next_review_date DATE,

    -- Spaced Repetition
    uses_spaced_repetition BOOLEAN DEFAULT true,
    repetition_algorithm TEXT DEFAULT 'sm2', -- SM2, FSRS, etc.

    -- Sharing
    is_public BOOLEAN DEFAULT false,
    is_shared_with_study_group BOOLEAN DEFAULT false,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Stats
    total_study_sessions INTEGER DEFAULT 0,
    total_study_time_minutes INTEGER DEFAULT 0
);

-- =====================================================
-- 3. FLASHCARDS
-- =====================================================

CREATE TABLE IF NOT EXISTS flashcards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    set_id UUID REFERENCES flashcard_sets(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

    -- Card Content
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    hint TEXT,
    explanation TEXT,

    -- Additional Content
    image_url TEXT, -- For diagram-based cards
    formula_latex TEXT, -- LaTeX formatted formulas

    -- Classification
    card_type TEXT CHECK (card_type IN ('basic', 'definition', 'formula', 'concept', 'numerical', 'diagram', 'mechanism', 'fact')),
    difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
    importance_level INTEGER CHECK (importance_level BETWEEN 1 AND 5),

    -- Spaced Repetition Data (SM2 Algorithm)
    repetitions INTEGER DEFAULT 0,
    easiness_factor DECIMAL(3,2) DEFAULT 2.5,
    interval_days INTEGER DEFAULT 0,
    next_review_date DATE,

    -- Performance
    times_reviewed INTEGER DEFAULT 0,
    times_correct INTEGER DEFAULT 0,
    times_incorrect INTEGER DEFAULT 0,
    accuracy_percentage DECIMAL(5,2) DEFAULT 0,
    average_response_time_seconds DECIMAL(5,2),

    -- Status
    learning_status TEXT DEFAULT 'new' CHECK (learning_status IN ('new', 'learning', 'review', 'mastered', 'difficult')),
    is_suspended BOOLEAN DEFAULT false, -- Temporarily skip this card
    is_leech BOOLEAN DEFAULT false, -- Card that keeps being wrong

    -- Tags & Organization
    tags TEXT[],
    related_card_ids UUID[], -- Related flashcards

    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_reviewed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. FLASHCARD REVIEW SESSIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS flashcard_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    card_id UUID REFERENCES flashcards(id) ON DELETE CASCADE NOT NULL,
    set_id UUID REFERENCES flashcard_sets(id) ON DELETE CASCADE NOT NULL,

    -- Review Details
    review_date TIMESTAMPTZ DEFAULT NOW(),
    response_quality INTEGER CHECK (response_quality BETWEEN 0 AND 5),
    -- 0: Blackout, 1: Incorrect, 2: Incorrect but remembered, 3: Correct with difficulty,
    -- 4: Correct with hesitation, 5: Perfect recall

    response_time_seconds INTEGER,
    was_correct BOOLEAN,

    -- Context
    study_session_id UUID,
    device_type TEXT, -- 'desktop', 'mobile', 'tablet'

    -- Metadata
    previous_interval_days INTEGER,
    new_interval_days INTEGER,
    new_easiness_factor DECIMAL(3,2)
);

-- =====================================================
-- 5. STUDY SESSIONS (Enhanced for Flashcards)
-- =====================================================

CREATE TABLE IF NOT EXISTS flashcard_study_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    set_id UUID REFERENCES flashcard_sets(id) ON DELETE CASCADE NOT NULL,

    -- Session Info
    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ,
    duration_minutes INTEGER,

    -- Performance
    cards_studied INTEGER DEFAULT 0,
    cards_correct INTEGER DEFAULT 0,
    cards_incorrect INTEGER DEFAULT 0,
    new_cards_learned INTEGER DEFAULT 0,
    cards_relearned INTEGER DEFAULT 0,

    -- Stats
    average_response_time_seconds DECIMAL(5,2),
    accuracy_percentage DECIMAL(5,2),
    focus_rating INTEGER CHECK (focus_rating BETWEEN 1 AND 5),

    -- Study Mode
    study_mode TEXT CHECK (study_mode IN ('learn', 'review', 'cram', 'test', 'mixed')),
    settings JSONB, -- Study session settings

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 6. NOTE TEMPLATES
-- =====================================================

CREATE TABLE IF NOT EXISTS note_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Template Info
    name TEXT NOT NULL,
    description TEXT,
    subject TEXT,
    template_type TEXT CHECK (template_type IN ('chapter_notes', 'concept_map', 'formula_sheet', 'problem_solving', 'revision', 'custom')),

    -- Template Content
    structure JSONB NOT NULL, -- JSON defining the template structure
    sections TEXT[], -- ['Introduction', 'Key Concepts', 'Formulas', 'Examples', 'Summary']

    -- Prompts for NotebookLM
    notebooklm_prompts TEXT[], -- Pre-defined prompts for generating notes

    -- Metadata
    is_default BOOLEAN DEFAULT false,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    usage_count INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 7. SHARED NOTES & FLASHCARDS
-- =====================================================

CREATE TABLE IF NOT EXISTS shared_study_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Content
    material_type TEXT CHECK (material_type IN ('note', 'flashcard_set')),
    material_id UUID NOT NULL, -- References either student_notes.id or flashcard_sets.id
    shared_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

    -- Sharing Settings
    shared_with_user_ids UUID[], -- Specific users
    shared_with_study_group_id UUID, -- Reference to study group
    is_public BOOLEAN DEFAULT false,

    -- Access Control
    can_edit BOOLEAN DEFAULT false,
    can_download BOOLEAN DEFAULT true,
    can_reshare BOOLEAN DEFAULT false,

    -- Engagement
    views_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    downloads_count INTEGER DEFAULT 0,

    -- Comments
    comments_enabled BOOLEAN DEFAULT true,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ -- Optional expiration
);

-- =====================================================
-- 8. NOTEBOOKLM INTEGRATION
-- =====================================================

CREATE TABLE IF NOT EXISTS notebooklm_integration (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

    -- NotebookLM Info
    notebooklm_email TEXT,
    notebooklm_user_id TEXT,

    -- Notebooks
    total_notebooks INTEGER DEFAULT 0,
    active_notebooks JSONB, -- Array of notebook objects

    -- Usage Stats
    total_notes_created INTEGER DEFAULT 0,
    total_flashcards_generated INTEGER DEFAULT 0,
    total_queries_asked INTEGER DEFAULT 0,

    -- Sync
    last_synced_at TIMESTAMPTZ,
    auto_sync_enabled BOOLEAN DEFAULT true,
    sync_frequency TEXT DEFAULT 'daily' CHECK (sync_frequency IN ('realtime', 'hourly', 'daily', 'manual')),

    -- Preferences
    default_note_template_id UUID REFERENCES note_templates(id),
    auto_generate_flashcards BOOLEAN DEFAULT true,
    flashcards_per_chapter INTEGER DEFAULT 50,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(student_id)
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_student_notes_student_id ON student_notes(student_id);
CREATE INDEX IF NOT EXISTS idx_student_notes_subject ON student_notes(subject);
CREATE INDEX IF NOT EXISTS idx_student_notes_resource_id ON student_notes(resource_id);
CREATE INDEX IF NOT EXISTS idx_student_notes_tags ON student_notes USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_flashcard_sets_student_id ON flashcard_sets(student_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_sets_subject ON flashcard_sets(subject);
CREATE INDEX IF NOT EXISTS idx_flashcard_sets_next_review ON flashcard_sets(next_review_date);

CREATE INDEX IF NOT EXISTS idx_flashcards_set_id ON flashcards(set_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_status ON flashcards(learning_status);
CREATE INDEX IF NOT EXISTS idx_flashcards_next_review ON flashcards(next_review_date);
CREATE INDEX IF NOT EXISTS idx_flashcards_difficulty ON flashcards(difficulty);

CREATE INDEX IF NOT EXISTS idx_flashcard_reviews_card_id ON flashcard_reviews(card_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_reviews_student_id ON flashcard_reviews(student_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_reviews_date ON flashcard_reviews(review_date);

CREATE INDEX IF NOT EXISTS idx_flashcard_study_sessions_student_id ON flashcard_study_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_study_sessions_set_id ON flashcard_study_sessions(set_id);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update flashcard set statistics
CREATE OR REPLACE FUNCTION update_flashcard_set_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE flashcard_sets
    SET
        total_cards = (SELECT COUNT(*) FROM flashcards WHERE set_id = NEW.set_id),
        cards_mastered = (SELECT COUNT(*) FROM flashcards WHERE set_id = NEW.set_id AND learning_status = 'mastered'),
        cards_learning = (SELECT COUNT(*) FROM flashcards WHERE set_id = NEW.set_id AND learning_status = 'learning'),
        cards_new = (SELECT COUNT(*) FROM flashcards WHERE set_id = NEW.set_id AND learning_status = 'new'),
        updated_at = NOW()
    WHERE id = NEW.set_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_flashcard_set_stats_trigger
    AFTER INSERT OR UPDATE OR DELETE ON flashcards
    FOR EACH ROW
    EXECUTE FUNCTION update_flashcard_set_stats();

-- Update flashcard accuracy
CREATE OR REPLACE FUNCTION update_flashcard_accuracy()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.times_reviewed > 0 THEN
        NEW.accuracy_percentage = (NEW.times_correct::DECIMAL / NEW.times_reviewed) * 100;
    END IF;
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_flashcard_accuracy_trigger
    BEFORE UPDATE ON flashcards
    FOR EACH ROW
    EXECUTE FUNCTION update_flashcard_accuracy();

-- Update timestamps
CREATE TRIGGER update_student_notes_updated_at BEFORE UPDATE ON student_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_flashcard_sets_updated_at BEFORE UPDATE ON flashcard_sets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE student_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcard_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcard_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcard_study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_study_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE notebooklm_integration ENABLE ROW LEVEL SECURITY;

-- Students can manage their own notes
CREATE POLICY "Students can manage own notes"
    ON student_notes FOR ALL
    USING (auth.uid() = student_id);

-- Students can view shared notes
CREATE POLICY "Students can view shared notes"
    ON student_notes FOR SELECT
    USING (
        is_shared = true OR
        auth.uid() = student_id
    );

-- Students can manage their own flashcard sets
CREATE POLICY "Students can manage own flashcard sets"
    ON flashcard_sets FOR ALL
    USING (auth.uid() = student_id);

-- Students can view public flashcard sets
CREATE POLICY "Students can view public flashcard sets"
    ON flashcard_sets FOR SELECT
    USING (
        is_public = true OR
        auth.uid() = student_id
    );

-- Students can manage their own flashcards
CREATE POLICY "Students can manage own flashcards"
    ON flashcards FOR ALL
    USING (auth.uid() = student_id);

-- Students can manage their own reviews
CREATE POLICY "Students can manage own reviews"
    ON flashcard_reviews FOR ALL
    USING (auth.uid() = student_id);

-- Students can manage their own study sessions
CREATE POLICY "Students can manage own study sessions"
    ON flashcard_study_sessions FOR ALL
    USING (auth.uid() = student_id);

-- Everyone can view note templates
CREATE POLICY "Anyone can view note templates"
    ON note_templates FOR SELECT
    USING (true);

-- Students can create templates
CREATE POLICY "Students can create templates"
    ON note_templates FOR INSERT
    WITH CHECK (auth.uid() = created_by);

-- Students can manage their own NotebookLM integration
CREATE POLICY "Students can manage own NotebookLM integration"
    ON notebooklm_integration FOR ALL
    USING (auth.uid() = student_id);

-- =====================================================
-- SEED DATA - NOTE TEMPLATES
-- =====================================================

INSERT INTO note_templates (name, description, subject, template_type, structure, sections, notebooklm_prompts) VALUES
('Standard Chapter Notes', 'Comprehensive notes for any chapter', 'general', 'chapter_notes',
 '{"type": "chapter_notes", "layout": "linear", "sections": ["introduction", "key_concepts", "formulas", "examples", "points", "mistakes", "summary"]}'::jsonb,
 ARRAY['Introduction', 'Key Concepts', 'Formulas & Definitions', 'Solved Examples', 'Important Points', 'Common Mistakes', 'Summary'],
 ARRAY['Create comprehensive notes with all key concepts', 'List all important formulas with explanations', 'Provide 5 solved examples', 'What are common mistakes in this chapter?']),

('Formula Sheet', 'Quick reference for all formulas', 'mathematics', 'formula_sheet',
 '{"type": "formula_sheet", "layout": "table", "columns": ["topic", "formula", "usage", "example"]}'::jsonb,
 ARRAY['Topic', 'Formula', 'When to Use', 'Example'],
 ARRAY['List all formulas in this chapter', 'Provide usage examples for each formula', 'Create a quick reference guide']),

('Concept Map', 'Visual representation of relationships', 'general', 'concept_map',
 '{"type": "concept_map", "layout": "hierarchical", "elements": ["main_topic", "subtopics", "related_concepts", "applications"]}'::jsonb,
 ARRAY['Main Topic', 'Sub-topics', 'Related Concepts', 'Applications'],
 ARRAY['Create a concept map showing all relationships', 'How do these topics connect?', 'What are the applications?']),

('Problem-Solving Guide', 'Step-by-step problem-solving strategies', 'general', 'problem_solving',
 '{"type": "problem_solving", "layout": "step_by_step", "sections": ["problem_types", "approach", "mistakes", "examples", "practice"]}'::jsonb,
 ARRAY['Problem Type', 'Approach', 'Common Mistakes', 'Solved Examples', 'Practice Problems'],
 ARRAY['What are the common problem types?', 'Provide solving strategies', 'List common mistakes']),

('Revision Sheet', 'Quick revision before exams', 'general', 'revision',
 '{"type": "revision", "layout": "compact", "sections": ["concepts", "formulas", "diagrams", "tips"]}'::jsonb,
 ARRAY['One-line Concepts', 'Key Formulas', 'Important Diagrams', 'Tips & Tricks'],
 ARRAY['Create a one-page revision sheet', 'List the most important points', 'What should I remember for exam?'])

ON CONFLICT DO NOTHING;

-- Comments
COMMENT ON TABLE student_notes IS 'Student-created and AI-generated notes from various sources';
COMMENT ON TABLE flashcard_sets IS 'Collections of flashcards for spaced repetition learning';
COMMENT ON TABLE flashcards IS 'Individual flashcards with spaced repetition data';
COMMENT ON TABLE flashcard_reviews IS 'History of flashcard review sessions';
COMMENT ON TABLE notebooklm_integration IS 'Integration with Google NotebookLM platform';
