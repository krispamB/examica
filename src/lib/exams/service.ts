import { createClient } from '@/lib/supabase/server'
import { createClient as createClientClient } from '@/lib/supabase/client'
import type { Tables, TablesInsert, TablesUpdate } from '@/types/database.types'
import type { SupabaseClient } from '@supabase/supabase-js'

export type Exam = Tables<'exams'>
export type ExamInsert = TablesInsert<'exams'>
export type ExamUpdate = TablesUpdate<'exams'>

export type ExamQuestion = Tables<'exam_questions'>
export type ExamQuestionInsert = TablesInsert<'exam_questions'>

export interface ExamWithQuestions extends Exam {
  exam_questions: Array<
    ExamQuestion & {
      questions: Tables<'questions'>
    }
  >
  question_count?: number
  total_points?: number
}

export interface ExamFilters {
  status?: 'draft' | 'active' | 'archived'
  createdBy?: string
  search?: string
}

export interface ExamCreateData {
  title: string
  description?: string
  duration?: number
  requires_verification?: boolean
  questions: Array<{
    question_id: string
    order_index: number
    points?: number
    required?: boolean
  }>
}

export interface ExamServiceOptions {
  useServerClient?: boolean
}

export class ExamService {
  private supabase: SupabaseClient | null

  constructor(options: ExamServiceOptions = {}) {
    this.supabase =
      options.useServerClient !== false ? null : createClientClient()
  }

  private async getSupabaseClient() {
    if (this.supabase) {
      return this.supabase
    }
    return await createClient()
  }

  /**
   * Create a new exam with questions
   */
  async createExam(
    examData: ExamCreateData,
    createdBy: string
  ): Promise<{
    success: boolean
    exam?: ExamWithQuestions
    error?: string
  }> {
    try {
      const supabase = await this.getSupabaseClient()

      // Start transaction
      const { data: exam, error: examError } = await supabase
        .from('exams')
        .insert({
          title: examData.title,
          description: examData.description || null,
          duration: examData.duration || null,
          requires_verification: examData.requires_verification ?? true,
          status: 'draft',
          created_by: createdBy,
        })
        .select()
        .single()

      if (examError) {
        throw new Error(examError.message)
      }

      // Add questions to exam
      if (examData.questions.length > 0) {
        const examQuestions = examData.questions.map((q) => ({
          exam_id: exam.id,
          question_id: q.question_id,
          order_index: q.order_index,
          points: q.points || null,
          required: q.required ?? true,
        }))

        const { error: questionsError } = await supabase
          .from('exam_questions')
          .insert(examQuestions)

        if (questionsError) {
          // Rollback: delete the exam
          await supabase.from('exams').delete().eq('id', exam.id)
          throw new Error(questionsError.message)
        }
      }

      // Fetch complete exam with questions
      const completeExam = await this.getExam(exam.id)

      return {
        success: true,
        exam: completeExam.exam,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Get exams with filtering and pagination
   */
  async getExams(
    filters: ExamFilters = {},
    options: {
      page?: number
      limit?: number
      includeQuestions?: boolean
      sortBy?: string
      sortOrder?: 'asc' | 'desc'
    } = {}
  ): Promise<{
    success: boolean
    exams?: ExamWithQuestions[]
    totalCount?: number
    error?: string
  }> {
    try {
      const supabase = await this.getSupabaseClient()

      let query = supabase.from('exams').select(
        `
          *,
          user_profiles!created_by(first_name, last_name),
          ${
            options.includeQuestions
              ? `
            exam_questions(
              id,
              order_index,
              points,
              required,
              questions(
                id,
                title,
                type,
                difficulty,
                points
              )
            )
          `
              : 'exam_questions(id)'
          }
        `,
        { count: 'exact' }
      )

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status)
      }

      if (filters.createdBy) {
        query = query.eq('created_by', filters.createdBy)
      }

      if (filters.search) {
        query = query.or(
          `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
        )
      }

      // Apply sorting
      const sortBy = options.sortBy || 'updated_at'
      const sortOrder = options.sortOrder || 'desc'
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })

      // Apply pagination
      const page = options.page || 1
      const limit = options.limit || 20
      const from = (page - 1) * limit
      const to = from + limit - 1

      query = query.range(from, to)

      const { data: exams, error, count } = await query

      if (error) {
        throw new Error(error.message)
      }

      // Enrich exams with question stats
      const enrichedExams = (exams || []).map((exam) => ({
        ...exam,
        question_count: exam.exam_questions?.length || 0,
        total_points: options.includeQuestions
          ? exam.exam_questions?.reduce(
              (sum: number, eq) =>
                sum + (eq.points || eq.questions?.points || 1),
              0
            ) || 0
          : undefined,
      }))

      return {
        success: true,
        exams: enrichedExams,
        totalCount: count || 0,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Get a single exam with questions
   */
  async getExam(id: string): Promise<{
    success: boolean
    exam?: ExamWithQuestions
    error?: string
  }> {
    try {
      const supabase = await this.getSupabaseClient()

      const { data: exam, error } = await supabase
        .from('exams')
        .select(
          `
          *,
          user_profiles!created_by(first_name, last_name),
          exam_questions(
            id,
            order_index,
            points,
            required,
            questions(
              id,
              title,
              content,
              type,
              difficulty,
              options,
              correct_answer,
              explanation,
              points,
              category,
              tags
            )
          )
        `
        )
        .eq('id', id)
        .single()

      if (error) {
        throw new Error(error.message)
      }

      // Sort questions by order_index
      if (exam.exam_questions) {
        exam.exam_questions.sort((a, b) => a.order_index - b.order_index)
      }

      // Calculate totals
      const enrichedExam = {
        ...exam,
        question_count: exam.exam_questions?.length || 0,
        total_points:
          exam.exam_questions?.reduce(
            (sum: number, eq) => sum + (eq.points || eq.questions?.points || 1),
            0
          ) || 0,
      }

      return {
        success: true,
        exam: enrichedExam,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Update an exam
   */
  async updateExam(
    id: string,
    updates: ExamUpdate
  ): Promise<{
    success: boolean
    exam?: Exam
    error?: string
  }> {
    try {
      const supabase = await this.getSupabaseClient()

      const { data: exam, error } = await supabase
        .from('exams')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return {
        success: true,
        exam,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Update exam questions
   */
  async updateExamQuestions(
    examId: string,
    questions: Array<{
      question_id: string
      order_index: number
      points?: number
      required?: boolean
    }>
  ): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      const supabase = await this.getSupabaseClient()

      // Remove existing questions
      const { error: deleteError } = await supabase
        .from('exam_questions')
        .delete()
        .eq('exam_id', examId)

      if (deleteError) {
        throw new Error(deleteError.message)
      }

      // Add new questions
      if (questions.length > 0) {
        const examQuestions = questions.map((q) => ({
          exam_id: examId,
          question_id: q.question_id,
          order_index: q.order_index,
          points: q.points || null,
          required: q.required ?? true,
        }))

        const { error: insertError } = await supabase
          .from('exam_questions')
          .insert(examQuestions)

        if (insertError) {
          throw new Error(insertError.message)
        }
      }

      return {
        success: true,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Delete an exam
   */
  async deleteExam(id: string): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      const supabase = await this.getSupabaseClient()

      const { error } = await supabase.from('exams').delete().eq('id', id)

      if (error) {
        throw new Error(error.message)
      }

      return {
        success: true,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Publish an exam (change status from draft to active)
   */
  async publishExam(id: string): Promise<{
    success: boolean
    exam?: Exam
    error?: string
  }> {
    try {
      // Validate exam has questions before publishing
      const examResult = await this.getExam(id)
      if (!examResult.success || !examResult.exam) {
        throw new Error('Exam not found')
      }

      if (examResult.exam.question_count === 0) {
        throw new Error('Cannot publish exam without questions')
      }

      return await this.updateExam(id, { status: 'active' })
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Archive an exam
   */
  async archiveExam(id: string): Promise<{
    success: boolean
    exam?: Exam
    error?: string
  }> {
    return await this.updateExam(id, { status: 'archived' })
  }

  /**
   * Get exam statistics
   */
  async getExamStats(filters: ExamFilters = {}): Promise<{
    success: boolean
    stats?: {
      total: number
      byStatus: Record<string, number>
      totalQuestions: number
      averageQuestionsPerExam: number
    }
    error?: string
  }> {
    try {
      const supabase = await this.getSupabaseClient()

      let query = supabase.from('exams').select('status, exam_questions(id)')

      // Apply filters
      if (filters.createdBy) {
        query = query.eq('created_by', filters.createdBy)
      }

      const { data: exams, error } = await query

      if (error) {
        throw new Error(error.message)
      }

      if (!exams) {
        return {
          success: true,
          stats: {
            total: 0,
            byStatus: {},
            totalQuestions: 0,
            averageQuestionsPerExam: 0,
          },
        }
      }

      const stats = {
        total: exams.length,
        byStatus: {} as Record<string, number>,
        totalQuestions: 0,
        averageQuestionsPerExam: 0,
      }

      exams.forEach((exam) => {
        // Count by status
        stats.byStatus[exam.status] = (stats.byStatus[exam.status] || 0) + 1

        // Count questions
        stats.totalQuestions += exam.exam_questions?.length || 0
      })

      stats.averageQuestionsPerExam =
        stats.total > 0
          ? Math.round((stats.totalQuestions / stats.total) * 10) / 10
          : 0

      return {
        success: true,
        stats,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }
}

// Factory function
export function createExamService(options?: ExamServiceOptions): ExamService {
  return new ExamService(options)
}

export default ExamService
