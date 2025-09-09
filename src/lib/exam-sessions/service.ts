import { createClient } from '@/lib/supabase/server'
import { createClient as createClientClient } from '@/lib/supabase/client'
import type { Tables, TablesInsert, TablesUpdate } from '@/types/database.types'
import type { SupabaseClient } from '@supabase/supabase-js'

export type ExamSession = Tables<'exam_sessions'>
export type ExamSessionInsert = TablesInsert<'exam_sessions'>
export type ExamSessionUpdate = TablesUpdate<'exam_sessions'>

export type QuestionResponse = Tables<'question_responses'>
export type QuestionResponseInsert = TablesInsert<'question_responses'>

export interface ExamSessionWithDetails extends ExamSession {
  exams: Tables<'exams'> & {
    exam_questions: Array<{
      id: string
      order_index: number
      points: number | null
      required: boolean
      questions: Tables<'questions'>
    }>
  }
  question_responses?: QuestionResponse[]
  user_profiles: {
    first_name: string
    last_name: string
    email: string
  }
}

export interface StartExamRequest {
  examId: string
  requiresFacialVerification?: boolean
}

export interface SubmitResponseRequest {
  sessionId: string
  questionId: string
  response: string | number | boolean | string[] | Record<string, unknown>
  timeSpent?: number
}

export interface ExamSessionFilters {
  examId?: string
  userId?: string
  status?: 'active' | 'completed' | 'paused' | 'terminated'
  startedAfter?: string
  startedBefore?: string
}

export interface ExamSessionServiceOptions {
  useServerClient?: boolean
}

export class ExamSessionService {
  private supabase: SupabaseClient | null

  constructor(options: ExamSessionServiceOptions = {}) {
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
   * Start a new exam session for a student
   */
  async startExamSession(
    userId: string,
    request: StartExamRequest
  ): Promise<{
    success: boolean
    session?: ExamSessionWithDetails
    error?: string
  }> {
    try {
      const supabase = await this.getSupabaseClient()

      // Verify exam exists and is active
      const { data: exam, error: examError } = await supabase
        .from('exams')
        .select(
          `
          *,
          exam_questions(
            id,
            order_index,
            points,
            required,
            questions(*)
          )
        `
        )
        .eq('id', request.examId)
        .eq('status', 'active')
        .single()

      if (examError || !exam) {
        return {
          success: false,
          error: 'Exam not found or not active',
        }
      }

      // Check if user already has an active session for this exam
      const { data: existingSession } = await supabase
        .from('exam_sessions')
        .select('id, status')
        .eq('user_id', userId)
        .eq('exam_id', request.examId)
        .in('status', ['active', 'paused'])
        .single()

      if (existingSession) {
        return {
          success: false,
          error: 'You already have an active session for this exam',
        }
      }

      // Create new exam session
      const { data: session, error: sessionError } = await supabase
        .from('exam_sessions')
        .insert({
          user_id: userId,
          exam_id: request.examId,
          status: 'active',
          started_at: new Date().toISOString(),
          time_limit: exam.duration ? exam.duration * 60 : null, // Convert minutes to seconds
        })
        .select(
          `
          *,
          exams(
            *,
            exam_questions(
              id,
              order_index,
              points,
              required,
              questions(*)
            )
          ),
          user_profiles(first_name, last_name, email)
        `
        )
        .single()

      if (sessionError) {
        throw new Error(sessionError.message)
      }

      // Sort questions by order_index
      if (session.exams.exam_questions) {
        session.exams.exam_questions.sort(
          (a, b) => a.order_index - b.order_index
        )
      }

      return {
        success: true,
        session,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Get an exam session with details
   */
  async getExamSession(sessionId: string): Promise<{
    success: boolean
    session?: ExamSessionWithDetails
    error?: string
  }> {
    try {
      const supabase = await this.getSupabaseClient()

      const { data: session, error } = await supabase
        .from('exam_sessions')
        .select(
          `
          *,
          exams(
            *,
            exam_questions(
              id,
              order_index,
              points,
              required,
              questions(*)
            )
          ),
          user_profiles(first_name, last_name, email),
          question_responses(*)
        `
        )
        .eq('id', sessionId)
        .single()

      if (error) {
        throw new Error(error.message)
      }

      // Sort questions by order_index
      if (session.exams.exam_questions) {
        session.exams.exam_questions.sort(
          (a, b) => a.order_index - b.order_index
        )
      }

      return {
        success: true,
        session,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Submit a response to a question
   */
  async submitQuestionResponse(request: SubmitResponseRequest): Promise<{
    success: boolean
    response?: QuestionResponse
    error?: string
  }> {
    try {
      const supabase = await this.getSupabaseClient()

      // Verify session is active
      const { data: session } = await supabase
        .from('exam_sessions')
        .select('id, status, user_id')
        .eq('id', request.sessionId)
        .eq('status', 'active')
        .single()

      if (!session) {
        return {
          success: false,
          error: 'Session not found or not active',
        }
      }

      // Check if response already exists
      const { data: existingResponse } = await supabase
        .from('question_responses')
        .select('id')
        .eq('session_id', request.sessionId)
        .eq('question_id', request.questionId)
        .single()

      let response
      if (existingResponse) {
        // Update existing response
        const { data: updatedResponse, error } = await supabase
          .from('question_responses')
          .update({
            response: request.response,
            time_spent: request.timeSpent || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingResponse.id)
          .select()
          .single()

        if (error) {
          throw new Error(error.message)
        }
        response = updatedResponse
      } else {
        // Create new response
        const { data: newResponse, error } = await supabase
          .from('question_responses')
          .insert({
            session_id: request.sessionId,
            question_id: request.questionId,
            response: request.response,
            time_spent: request.timeSpent || null,
          })
          .select()
          .single()

        if (error) {
          throw new Error(error.message)
        }
        response = newResponse
      }

      return {
        success: true,
        response,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Complete an exam session
   */
  async completeExamSession(sessionId: string): Promise<{
    success: boolean
    session?: ExamSession
    error?: string
  }> {
    try {
      const supabase = await this.getSupabaseClient()

      // First, check the current session status
      const { data: currentSession, error: fetchError } = await supabase
        .from('exam_sessions')
        .select('id, status, completed_at')
        .eq('id', sessionId)
        .single()

      if (fetchError) {
        throw new Error(fetchError.message)
      }

      if (!currentSession) {
        return {
          success: false,
          error: 'Session not found',
        }
      }

      // If already completed, return success with current session
      if (currentSession.status === 'completed') {
        return {
          success: true,
          session: currentSession as ExamSession,
        }
      }

      // If not active, cannot complete
      if (currentSession.status !== 'active') {
        return {
          success: false,
          error: `Cannot complete session with status: ${currentSession.status}`,
        }
      }

      // Now update the session to completed
      const { data: session, error } = await supabase
        .from('exam_sessions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', sessionId)
        .eq('status', 'active')
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return {
        success: true,
        session,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Pause an exam session
   */
  async pauseExamSession(sessionId: string): Promise<{
    success: boolean
    session?: ExamSession
    error?: string
  }> {
    try {
      const supabase = await this.getSupabaseClient()

      const { data: session, error } = await supabase
        .from('exam_sessions')
        .update({
          status: 'paused',
        })
        .eq('id', sessionId)
        .eq('status', 'active')
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return {
        success: true,
        session,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Resume a paused exam session
   */
  async resumeExamSession(sessionId: string): Promise<{
    success: boolean
    session?: ExamSession
    error?: string
  }> {
    try {
      const supabase = await this.getSupabaseClient()

      const { data: session, error } = await supabase
        .from('exam_sessions')
        .update({
          status: 'active',
        })
        .eq('id', sessionId)
        .eq('status', 'paused')
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return {
        success: true,
        session,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Terminate an exam session (forced end)
   */
  async terminateExamSession(
    sessionId: string,
    reason?: string
  ): Promise<{
    success: boolean
    session?: ExamSession
    error?: string
  }> {
    try {
      const supabase = await this.getSupabaseClient()

      const { data: session, error } = await supabase
        .from('exam_sessions')
        .update({
          status: 'terminated',
          completed_at: new Date().toISOString(),
          notes: reason || 'Session terminated',
        })
        .eq('id', sessionId)
        .in('status', ['active', 'paused'])
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return {
        success: true,
        session,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Get exam sessions with filtering
   */
  async getExamSessions(
    filters: ExamSessionFilters = {},
    options: {
      page?: number
      limit?: number
      sortBy?: string
      sortOrder?: 'asc' | 'desc'
    } = {}
  ): Promise<{
    success: boolean
    sessions?: ExamSessionWithDetails[]
    totalCount?: number
    error?: string
  }> {
    try {
      const supabase = await this.getSupabaseClient()

      let query = supabase.from('exam_sessions').select(
        `
          *,
          exams(id, title, duration),
          user_profiles(first_name, last_name, email)
        `,
        { count: 'exact' }
      )

      // Apply filters
      if (filters.examId) {
        query = query.eq('exam_id', filters.examId)
      }
      if (filters.userId) {
        query = query.eq('user_id', filters.userId)
      }
      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      if (filters.startedAfter) {
        query = query.gte('started_at', filters.startedAfter)
      }
      if (filters.startedBefore) {
        query = query.lte('started_at', filters.startedBefore)
      }

      // Apply sorting
      const sortBy = options.sortBy || 'started_at'
      const sortOrder = options.sortOrder || 'desc'
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })

      // Apply pagination
      const page = options.page || 1
      const limit = options.limit || 20
      const from = (page - 1) * limit
      const to = from + limit - 1

      query = query.range(from, to)

      const { data: sessions, error, count } = await query

      if (error) {
        throw new Error(error.message)
      }

      return {
        success: true,
        sessions: sessions || [],
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
   * Get session progress/statistics
   */
  async getSessionProgress(sessionId: string): Promise<{
    success: boolean
    progress?: {
      totalQuestions: number
      answeredQuestions: number
      timeElapsed: number
      timeRemaining: number | null
      completionPercentage: number
    }
    error?: string
  }> {
    try {
      const supabase = await this.getSupabaseClient()

      // Get session with exam questions and responses
      const { data: session, error } = await supabase
        .from('exam_sessions')
        .select(
          `
          *,
          exams(
            duration,
            exam_questions(id)
          ),
          question_responses(id, question_id)
        `
        )
        .eq('id', sessionId)
        .single()

      if (error || !session) {
        return {
          success: false,
          error: 'Session not found',
        }
      }

      const totalQuestions = session.exams.exam_questions?.length || 0
      const answeredQuestions = session.question_responses?.length || 0

      const startTime = new Date(session.started_at).getTime()
      const currentTime = new Date().getTime()
      const timeElapsed = Math.floor((currentTime - startTime) / 1000) // seconds

      let timeRemaining: number | null = null
      if (session.time_limit) {
        timeRemaining = Math.max(0, session.time_limit - timeElapsed)
      }

      const completionPercentage =
        totalQuestions > 0
          ? Math.round((answeredQuestions / totalQuestions) * 100)
          : 0

      return {
        success: true,
        progress: {
          totalQuestions,
          answeredQuestions,
          timeElapsed,
          timeRemaining,
          completionPercentage,
        },
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
export function createExamSessionService(
  options?: ExamSessionServiceOptions
): ExamSessionService {
  return new ExamSessionService(options)
}

export default ExamSessionService
