-- Exam System Core Tables
-- Run this script in your Supabase SQL Editor to create the exam management tables

-- Questions table for storing question bank
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('multiple_choice', 'true_false', 'essay', 'fill_blank', 'matching')),
    difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    category TEXT,
    tags TEXT[],
    options JSONB, -- For multiple choice options, matching pairs, etc.
    correct_answer JSONB, -- Correct answer(s) in structured format
    explanation TEXT, -- Explanation for the correct answer
    points INTEGER DEFAULT 1,
    ai_generated BOOLEAN DEFAULT FALSE,
    ai_metadata JSONB, -- Store AI generation metadata (model, prompt, etc.)
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exam questions junction table (many-to-many between exams and questions)
CREATE TABLE IF NOT EXISTS exam_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    points INTEGER, -- Override question points for this exam
    required BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(exam_id, question_id),
    UNIQUE(exam_id, order_index)
);

-- Exam results table for tracking overall exam performance
CREATE TABLE IF NOT EXISTS exam_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES exam_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    exam_id UUID REFERENCES exams(id),
    total_score DECIMAL(5,2),
    max_score DECIMAL(5,2),
    percentage DECIMAL(5,2),
    status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'graded')),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    graded_at TIMESTAMPTZ,
    graded_by UUID REFERENCES auth.users(id),
    feedback TEXT,
    metadata JSONB, -- Additional result metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(session_id) -- One result per session
);

-- Question responses table for tracking individual question answers
CREATE TABLE IF NOT EXISTS question_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES exam_sessions(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id),
    user_id UUID REFERENCES auth.users(id),
    response JSONB, -- Student's response in structured format
    is_correct BOOLEAN,
    points_earned DECIMAL(5,2) DEFAULT 0,
    time_spent INTEGER, -- Time spent in seconds
    attempts INTEGER DEFAULT 1,
    flagged BOOLEAN DEFAULT FALSE,
    flag_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(session_id, question_id) -- One response per question per session
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_questions_created_by ON questions(created_by);
CREATE INDEX IF NOT EXISTS idx_questions_type ON questions(type);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_category ON questions(category);
CREATE INDEX IF NOT EXISTS idx_questions_ai_generated ON questions(ai_generated);

CREATE INDEX IF NOT EXISTS idx_exam_questions_exam_id ON exam_questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_questions_question_id ON exam_questions(question_id);
CREATE INDEX IF NOT EXISTS idx_exam_questions_order ON exam_questions(exam_id, order_index);

CREATE INDEX IF NOT EXISTS idx_exam_results_session_id ON exam_results(session_id);
CREATE INDEX IF NOT EXISTS idx_exam_results_user_id ON exam_results(user_id);
CREATE INDEX IF NOT EXISTS idx_exam_results_exam_id ON exam_results(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_results_status ON exam_results(status);

CREATE INDEX IF NOT EXISTS idx_question_responses_session_id ON question_responses(session_id);
CREATE INDEX IF NOT EXISTS idx_question_responses_question_id ON question_responses(question_id);
CREATE INDEX IF NOT EXISTS idx_question_responses_user_id ON question_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_question_responses_flagged ON question_responses(flagged);

-- Create triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_exam_results_updated_at BEFORE UPDATE ON exam_results
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_question_responses_updated_at BEFORE UPDATE ON question_responses
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Row Level Security (RLS) policies

-- Questions RLS
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Allow admins and examiners to create/read/update questions
CREATE POLICY "Allow admin/examiner to manage questions" ON questions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role IN ('admin', 'examiner')
        )
    );

-- Allow creators to manage their own questions
CREATE POLICY "Allow creators to manage own questions" ON questions
    FOR ALL USING (created_by = auth.uid());

-- Students can only read questions through exam contexts (handled by application logic)

-- Exam Questions RLS
ALTER TABLE exam_questions ENABLE ROW LEVEL SECURITY;

-- Allow admin/examiner to manage exam questions
CREATE POLICY "Allow admin/examiner to manage exam questions" ON exam_questions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role IN ('admin', 'examiner')
        )
    );

-- Exam Results RLS
ALTER TABLE exam_results ENABLE ROW LEVEL SECURITY;

-- Students can only see their own results
CREATE POLICY "Students can view own results" ON exam_results
    FOR SELECT USING (user_id = auth.uid());

-- Admin/examiners can view all results
CREATE POLICY "Admin/examiner can view all results" ON exam_results
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role IN ('admin', 'examiner')
        )
    );

-- Only system can insert/update results (handled by application logic)
CREATE POLICY "System can manage results" ON exam_results
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "System can update results" ON exam_results
    FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Question Responses RLS
ALTER TABLE question_responses ENABLE ROW LEVEL SECURITY;

-- Students can only manage their own responses
CREATE POLICY "Students can manage own responses" ON question_responses
    FOR ALL USING (user_id = auth.uid());

-- Admin/examiners can view all responses
CREATE POLICY "Admin/examiner can view all responses" ON question_responses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role IN ('admin', 'examiner')
        )
    );

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON questions TO authenticated;
GRANT ALL ON exam_questions TO authenticated;
GRANT ALL ON exam_results TO authenticated;
GRANT ALL ON question_responses TO authenticated;