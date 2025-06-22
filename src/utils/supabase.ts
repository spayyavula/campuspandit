import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Question {
  id: string;
  title: string;
  content: string;
  question_type: 'mcq' | 'structured' | 'essay' | 'practical' | 'data_analysis';
  difficulty: 'easy' | 'medium' | 'hard';
  subject: 'physics' | 'math' | 'chemistry' | 'biology';
  board: 'cambridge' | 'ib' | 'cbse' | 'isc' | 'jee' | 'neet' | 'general';
  grade: string;
  topic_tags: string[];
  marks: number;
  time_limit: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_published: boolean;
  metadata: any;
}

export interface QuestionOption {
  id: string;
  question_id: string;
  option_text: string;
  option_order: number;
  is_correct: boolean;
  explanation: string;
  created_at: string;
}

export interface QuestionCollection {
  id: string;
  name: string;
  description: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_public: boolean;
  metadata: any;
}

export interface StudentResponse {
  id: string;
  question_id: string;
  student_id: string;
  response_data: any;
  is_correct: boolean;
  score: number;
  time_taken: number;
  submitted_at: string;
  session_id: string;
}

export interface QuestionAnalytics {
  id: string;
  question_id: string;
  total_attempts: number;
  correct_attempts: number;
  average_time: number;
  difficulty_rating: number;
  last_updated: string;
}

// API functions for questions
export const questionAPI = {
  // Get all questions with optional filters
  async getQuestions(filters?: {
    subject?: string;
    board?: string;
    difficulty?: string;
    is_published?: boolean;
  }) {
    let query = supabase
      .from('questions')
      .select(`
        *,
        question_options(*),
        question_analytics(*)
      `)
      .order('created_at', { ascending: false });

    if (filters?.subject) {
      query = query.eq('subject', filters.subject);
    }
    if (filters?.board) {
      query = query.eq('board', filters.board);
    }
    if (filters?.difficulty) {
      query = query.eq('difficulty', filters.difficulty);
    }
    if (filters?.is_published !== undefined) {
      query = query.eq('is_published', filters.is_published);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Get a single question by ID
  async getQuestion(id: string) {
    const { data, error } = await supabase
      .from('questions')
      .select(`
        *,
        question_options(*),
        question_analytics(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Create a new question
  async createQuestion(questionData: Omit<Question, 'id' | 'created_at' | 'updated_at' | 'created_by'>, options: QuestionOption[] = []) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: question, error: questionError } = await supabase
      .from('questions')
      .insert({
        ...questionData,
        created_by: user.id
      })
      .select()
      .single();

    if (questionError) throw questionError;

    // Insert options if provided
    if (options.length > 0) {
      const optionsWithQuestionId = options.map(option => ({
        ...option,
        question_id: question.id
      }));

      const { error: optionsError } = await supabase
        .from('question_options')
        .insert(optionsWithQuestionId);

      if (optionsError) throw optionsError;
    }

    return question;
  },

  // Update a question
  async updateQuestion(id: string, questionData: Partial<Question>, options?: QuestionOption[]) {
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .update(questionData)
      .eq('id', id)
      .select()
      .single();

    if (questionError) throw questionError;

    // Update options if provided
    if (options) {
      // Delete existing options
      await supabase
        .from('question_options')
        .delete()
        .eq('question_id', id);

      // Insert new options
      if (options.length > 0) {
        const optionsWithQuestionId = options.map(option => ({
          ...option,
          question_id: id
        }));

        const { error: optionsError } = await supabase
          .from('question_options')
          .insert(optionsWithQuestionId);

        if (optionsError) throw optionsError;
      }
    }

    return question;
  },

  // Delete a question
  async deleteQuestion(id: string) {
    const { error } = await supabase
      .from('questions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Submit a student response
  async submitResponse(questionId: string, responseData: any, isCorrect: boolean, score: number, timeTaken: number, sessionId?: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('student_responses')
      .insert({
        question_id: questionId,
        student_id: user.id,
        response_data: responseData,
        is_correct: isCorrect,
        score,
        time_taken: timeTaken,
        session_id: sessionId
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get question analytics
  async getQuestionAnalytics(questionId: string) {
    const { data, error } = await supabase
      .from('question_analytics')
      .select('*')
      .eq('question_id', questionId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
    return data;
  }
};

// API functions for collections
export const collectionAPI = {
  // Get all collections
  async getCollections() {
    const { data, error } = await supabase
      .from('question_collections')
      .select(`
        *,
        collection_questions(
          *,
          questions(*)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Create a new collection
  async createCollection(collectionData: Omit<QuestionCollection, 'id' | 'created_at' | 'updated_at' | 'created_by'>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('question_collections')
      .insert({
        ...collectionData,
        created_by: user.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Add question to collection
  async addQuestionToCollection(collectionId: string, questionId: string, orderIndex: number) {
    const { data, error } = await supabase
      .from('collection_questions')
      .insert({
        collection_id: collectionId,
        question_id: questionId,
        order_index: orderIndex
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Remove question from collection
  async removeQuestionFromCollection(collectionId: string, questionId: string) {
    const { error } = await supabase
      .from('collection_questions')
      .delete()
      .eq('collection_id', collectionId)
      .eq('question_id', questionId);

    if (error) throw error;
  }
};

export default supabase;