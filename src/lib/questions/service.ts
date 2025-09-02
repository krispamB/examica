import { createClient } from '@/lib/supabase/server'
import { createClient as createClientClient } from '@/lib/supabase/client'
import type { Tables, TablesInsert, TablesUpdate } from '@/types/database.types'
import type { GeneratedQuestion } from '@/lib/ai/question-generator'

export type Question = Tables<'questions'>
export type QuestionInsert = TablesInsert<'questions'>
export type QuestionUpdate = TablesUpdate<'questions'>

export interface QuestionFilters {
  type?: string
  difficulty?: string
  category?: string
  tags?: string[]
  aiGenerated?: boolean
  createdBy?: string
  search?: string
}

export interface QuestionServiceOptions {
  useServerClient?: boolean
}

export class QuestionService {
  private supabase: any

  constructor(options: QuestionServiceOptions = {}) {
    this.supabase = options.useServerClient !== false ? null : createClientClient()
  }

  private async getSupabaseClient() {
    if (this.supabase) {
      return this.supabase
    }
    return await createClient()
  }

  /**
   * Create a new question
   */
  async createQuestion(questionData: QuestionInsert): Promise<{
    success: boolean
    question?: Question
    error?: string
  }> {
    try {
      const supabase = await this.getSupabaseClient()

      const { data: question, error } = await supabase
        .from('questions')
        .insert(questionData)
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return {
        success: true,
        question
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Create multiple questions from AI generation
   */
  async createQuestionsFromAI(
    generatedQuestions: GeneratedQuestion[],
    createdBy: string
  ): Promise<{
    success: boolean
    questions?: Question[]
    errors?: string[]
  }> {
    try {
      const supabase = await this.getSupabaseClient()

      const questionsToInsert: QuestionInsert[] = generatedQuestions.map(q => ({
        title: q.title,
        content: q.content,
        type: q.type,
        difficulty: q.difficulty,
        category: q.category || null,
        tags: q.tags || null,
        options: q.options ? JSON.parse(JSON.stringify(q.options)) : null,
        correct_answer: JSON.parse(JSON.stringify(q.correct_answer)),
        explanation: q.explanation,
        points: q.points,
        ai_generated: true,
        ai_metadata: JSON.parse(JSON.stringify(q.ai_metadata)),
        created_by: createdBy
      }))

      const { data: questions, error } = await supabase
        .from('questions')
        .insert(questionsToInsert)
        .select()

      if (error) {
        throw new Error(error.message)
      }

      return {
        success: true,
        questions
      }
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  /**
   * Get questions with filtering and pagination
   */
  async getQuestions(filters: QuestionFilters = {}, options: {
    page?: number
    limit?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  } = {}): Promise<{
    success: boolean
    questions?: Question[]
    totalCount?: number
    error?: string
  }> {
    try {
      const supabase = await this.getSupabaseClient()

      let query = supabase
        .from('questions')
        .select('*, user_profiles!created_by(first_name, last_name)', { count: 'exact' })

      // Apply filters
      if (filters.type) {
        query = query.eq('type', filters.type)
      }
      
      if (filters.difficulty) {
        query = query.eq('difficulty', filters.difficulty)
      }
      
      if (filters.category) {
        query = query.eq('category', filters.category)
      }
      
      if (filters.aiGenerated !== undefined) {
        query = query.eq('ai_generated', filters.aiGenerated)
      }
      
      if (filters.createdBy) {
        query = query.eq('created_by', filters.createdBy)
      }

      if (filters.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags)
      }

      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`)
      }

      // Apply sorting
      const sortBy = options.sortBy || 'created_at'
      const sortOrder = options.sortOrder || 'desc'
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })

      // Apply pagination
      const page = options.page || 1
      const limit = options.limit || 20
      const from = (page - 1) * limit
      const to = from + limit - 1

      query = query.range(from, to)

      const { data: questions, error, count } = await query

      if (error) {
        throw new Error(error.message)
      }

      return {
        success: true,
        questions: questions || [],
        totalCount: count || 0
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get a single question by ID
   */
  async getQuestion(id: string): Promise<{
    success: boolean
    question?: Question
    error?: string
  }> {
    try {
      const supabase = await this.getSupabaseClient()

      const { data: question, error } = await supabase
        .from('questions')
        .select('*, user_profiles!created_by(first_name, last_name)')
        .eq('id', id)
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return {
        success: true,
        question
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Update a question
   */
  async updateQuestion(id: string, updates: QuestionUpdate): Promise<{
    success: boolean
    question?: Question
    error?: string
  }> {
    try {
      const supabase = await this.getSupabaseClient()

      const { data: question, error } = await supabase
        .from('questions')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return {
        success: true,
        question
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Delete a question
   */
  async deleteQuestion(id: string): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      const supabase = await this.getSupabaseClient()

      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', id)

      if (error) {
        throw new Error(error.message)
      }

      return {
        success: true
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Bulk delete questions
   */
  async deleteQuestions(ids: string[]): Promise<{
    success: boolean
    deletedCount?: number
    error?: string
  }> {
    try {
      const supabase = await this.getSupabaseClient()

      const { error, count } = await supabase
        .from('questions')
        .delete({ count: 'exact' })
        .in('id', ids)

      if (error) {
        throw new Error(error.message)
      }

      return {
        success: true,
        deletedCount: count || 0
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get question statistics
   */
  async getQuestionStats(filters: QuestionFilters = {}): Promise<{
    success: boolean
    stats?: {
      total: number
      byType: Record<string, number>
      byDifficulty: Record<string, number>
      aiGenerated: number
      categories: string[]
    }
    error?: string
  }> {
    try {
      const supabase = await this.getSupabaseClient()

      let query = supabase.from('questions').select('type, difficulty, ai_generated, category')

      // Apply the same filters as getQuestions
      if (filters.createdBy) {
        query = query.eq('created_by', filters.createdBy)
      }

      if (filters.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags)
      }

      const { data: questions, error } = await query

      if (error) {
        throw new Error(error.message)
      }

      if (!questions) {
        return { success: true, stats: { total: 0, byType: {}, byDifficulty: {}, aiGenerated: 0, categories: [] } }
      }

      const stats = {
        total: questions.length,
        byType: {} as Record<string, number>,
        byDifficulty: {} as Record<string, number>,
        aiGenerated: 0,
        categories: [] as string[]
      }

      const categorySet = new Set<string>()

      questions.forEach(q => {
        // Count by type
        stats.byType[q.type] = (stats.byType[q.type] || 0) + 1

        // Count by difficulty
        stats.byDifficulty[q.difficulty] = (stats.byDifficulty[q.difficulty] || 0) + 1

        // Count AI generated
        if (q.ai_generated) {
          stats.aiGenerated++
        }

        // Collect categories
        if (q.category) {
          categorySet.add(q.category)
        }
      })

      stats.categories = Array.from(categorySet)

      return {
        success: true,
        stats
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

// Factory function
export function createQuestionService(options?: QuestionServiceOptions): QuestionService {
  return new QuestionService(options)
}

export default QuestionService