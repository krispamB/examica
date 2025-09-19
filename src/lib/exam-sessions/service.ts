import { createClient } from '@/lib/supabase/server'
import { createClient as createClientClient } from '@/lib/supabase/client'
import type {
  Tables,
  TablesInsert,
  TablesUpdate,
  Json,
} from '@/types/database.types'
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
  response: Json
  timeSpent?: number
}

export interface BatchResponseRequest {
  sessionId: string
  responses: {
    questionId: string
    response: unknown
    timestamp?: number
    hash?: string
  }[]
}

export interface AutoSaveRequest {
  sessionId: string
  responses: {
    questionId: string
    response: unknown
    timestamp?: number
    hash?: string
  }[]
}

export interface ExamSessionFilters {
  examId?: string
  userId?: string
  status?: 'active' | 'completed' | 'paused' | 'terminated'
  startedAfter?: string
  startedBefore?: string
}

export interface BatchResult {
  success: boolean
  processed: number
  failed: number
  errors: Array<{
    questionId: string
    error: string
  }>
  duplicates?: number
}

export interface AutoSaveResult {
  success: boolean
  saved: number
  skipped: number
  errors: Array<{
    questionId: string
    error: string
  }>
  nextAutoSave: number
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
          time_remaining: exam.duration ? exam.duration * 60 : null, // Convert minutes to seconds
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

      // Fetch question data for grading
      const { data: question, error: questionError } = await supabase
        .from('questions')
        .select('id, type, correct_answer, options, points')
        .eq('id', request.questionId)
        .single()

      if (questionError || !question) {
        return {
          success: false,
          error: 'Question not found',
        }
      }

      // Evaluate the answer
      const evaluation = this.evaluateAnswer(request.response, question)

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
            user_id: session.user_id,
            response: request.response as Json,
            is_correct: evaluation.isCorrect,
            points_earned: evaluation.pointsEarned,
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
            user_id: session.user_id,
            response: request.response as Json,
            is_correct: evaluation.isCorrect,
            points_earned: evaluation.pointsEarned,
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
  async completeExamSession(
    sessionId: string,
    providedSupabase?: ReturnType<typeof createClient>
  ): Promise<{
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

      // Automatically calculate exam results after completion
      try {
        console.log(
          `Starting automatic result calculation for session ${sessionId}`
        )

        // Add a small delay to ensure database transaction is committed
        await new Promise((resolve) => setTimeout(resolve, 100))

        const { createResultsService } = await import('@/lib/results/service')
        const resultsService = createResultsService()

        // Pass the authenticated Supabase client if provided
        console.log(
          'DEBUG: Result calculation - providedSupabase is:',
          !!providedSupabase
        )
        const resultCalculation = providedSupabase
          ? await resultsService.calculateExamResultWithClient(
              sessionId,
              await providedSupabase
            )
          : await resultsService.calculateExamResult(sessionId)
        console.log(
          'DEBUG: Used method:',
          providedSupabase
            ? 'calculateExamResultWithClient'
            : 'calculateExamResult'
        )

        if (resultCalculation.success) {
          console.log(
            `Successfully calculated exam result for session ${sessionId}:`,
            {
              totalScore: resultCalculation.result?.total_score,
              maxPossibleScore: resultCalculation.result?.max_possible_score,
              percentageScore: resultCalculation.result?.percentage_score,
            }
          )
        } else {
          console.error(
            `Failed to calculate exam result for session ${sessionId}:`,
            resultCalculation.error
          )
        }
      } catch (resultError) {
        // Log the error but don't fail the completion
        console.warn(
          'Failed to calculate exam result automatically:',
          resultError
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
   * Update session metadata
   */
  async updateSessionMetadata(
    sessionId: string,
    metadata: Json
  ): Promise<{
    success: boolean
    session?: ExamSession
    error?: string
  }> {
    try {
      const supabase = await this.getSupabaseClient()

      const { data: session, error } = await supabase
        .from('exam_sessions')
        .update({ metadata })
        .eq('id', sessionId)
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
   * Normalize answer for comparison
   */
  private normalizeAnswer(answer: unknown): string {
    if (typeof answer === 'string') {
      return answer.toLowerCase().trim()
    }
    return String(answer || '')
      .toLowerCase()
      .trim()
  }

  /**
   * Evaluate answer and calculate points
   */
  private evaluateAnswer(
    response: unknown,
    question: {
      type: string
      correct_answer: unknown
      options?: unknown
      points: number | null
    }
  ): { isCorrect: boolean | null; pointsEarned: number } {
    const questionPoints = question.points || 1

    switch (question.type) {
      case 'multiple_choice':
        // Handle option ID comparison for multiple choice
        const userAnswerArray = Array.isArray(response)
          ? response
          : [String(response)]
        const correctAnswerArray = Array.isArray(question.correct_answer)
          ? question.correct_answer.map(String)
          : [String(question.correct_answer)]

        // Sort arrays for comparison to handle multiple selections
        const sortedUserAnswer = userAnswerArray.sort()
        const sortedCorrectAnswer = correctAnswerArray.sort()

        const isCorrect =
          JSON.stringify(sortedUserAnswer) ===
          JSON.stringify(sortedCorrectAnswer)

        // Fallback: if no match and we have options, try text-based comparison
        if (!isCorrect && question.options && Array.isArray(question.options)) {
          const fallbackResult = this.evaluateAnswerWithTextFallback(
            response,
            question
          )
          return {
            isCorrect: fallbackResult,
            pointsEarned: fallbackResult ? questionPoints : 0,
          }
        }

        return {
          isCorrect,
          pointsEarned: isCorrect ? questionPoints : 0,
        }

      case 'true_false':
      case 'fill_blank':
        const isCorrectText =
          this.normalizeAnswer(response) ===
          this.normalizeAnswer(question.correct_answer)
        return {
          isCorrect: isCorrectText,
          pointsEarned: isCorrectText ? questionPoints : 0,
        }

      case 'essay':
      case 'matching':
        // These require manual grading
        return {
          isCorrect: null,
          pointsEarned: 0,
        }

      default:
        return {
          isCorrect: false,
          pointsEarned: 0,
        }
    }
  }

  /**
   * Fallback method for text-based response comparison (backward compatibility)
   */
  private evaluateAnswerWithTextFallback(
    response: unknown,
    question: {
      correct_answer: unknown
      options?: unknown
    }
  ): boolean {
    if (!question.options || !Array.isArray(question.options)) {
      return false
    }

    // Find the option that matches the user's text response
    const responseText = this.normalizeAnswer(response)
    const matchingOption = question.options.find(
      (option: string | { id: string; text: string }) => {
        const optionText =
          typeof option === 'string' ? option : option?.text || ''
        return this.normalizeAnswer(optionText) === responseText
      }
    )

    if (!matchingOption) {
      return false
    }

    // Get the option ID and compare with correct answer
    const optionId =
      typeof matchingOption === 'string' ? matchingOption : matchingOption?.id

    const correctAnswerArray = Array.isArray(question.correct_answer)
      ? question.correct_answer.map(String)
      : [String(question.correct_answer)]

    return correctAnswerArray.includes(String(optionId))
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
      if (session.time_remaining) {
        timeRemaining = Math.max(0, session.time_remaining - timeElapsed)
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

  /**
   * Submit multiple responses in batch
   */
  async submitMultipleResponses(request: BatchResponseRequest): Promise<{
    success: boolean
    result?: BatchResult
    error?: string
  }> {
    try {
      const supabase = await this.getSupabaseClient()

      // Verify session is active
      const { data: session } = await supabase
        .from('exam_sessions')
        .select('id, status, user_id, exam_id')
        .eq('id', request.sessionId)
        .eq('status', 'active')
        .single()

      if (!session) {
        return {
          success: false,
          error: 'Session not found or not active',
        }
      }

      // Get questions data for evaluation
      const questionIds = request.responses.map((r) => r.questionId)
      const { data: questions, error: questionsError } = await supabase
        .from('questions')
        .select('id, type, correct_answer, options, points')
        .in('id', questionIds)

      if (questionsError) {
        return {
          success: false,
          error: `Failed to fetch questions: ${questionsError.message}`,
        }
      }

      const questionsMap = new Map(questions?.map((q) => [q.id, q]) || [])

      // Get existing responses
      const { data: existingResponses } = await supabase
        .from('question_responses')
        .select('question_id, updated_at')
        .eq('session_id', request.sessionId)
        .in('question_id', questionIds)

      const existingMap = new Map(
        existingResponses?.map((r) => [
          r.question_id,
          new Date(r.updated_at).getTime(),
        ]) || []
      )

      const result: BatchResult = {
        success: true,
        processed: 0,
        failed: 0,
        errors: [],
        duplicates: 0,
      }

      // Process responses
      const responsesToUpsert = []
      const responsesToUpdate = []

      for (const response of request.responses) {
        try {
          const question = questionsMap.get(response.questionId)
          if (!question) {
            result.errors.push({
              questionId: response.questionId,
              error: 'Question not found',
            })
            result.failed++
            continue
          }

          // Check for duplicates
          const existingTimestamp = existingMap.get(response.questionId)
          const responseTimestamp = response.timestamp || Date.now()

          if (existingTimestamp && responseTimestamp <= existingTimestamp) {
            result.duplicates!++
            continue
          }

          // Evaluate answer
          const evaluation = this.evaluateAnswer(response.response, question)

          const responseData = {
            session_id: request.sessionId,
            question_id: response.questionId,
            user_id: session.user_id,
            response: response.response,
            is_correct: evaluation.isCorrect,
            points_earned: evaluation.pointsEarned,
            time_spent: null,
            updated_at: new Date().toISOString(),
          }

          if (existingTimestamp) {
            responsesToUpdate.push(responseData)
          } else {
            responsesToUpsert.push({
              ...responseData,
              created_at: new Date().toISOString(),
            })
          }

          result.processed++
        } catch (error) {
          result.errors.push({
            questionId: response.questionId,
            error: error instanceof Error ? error.message : 'Processing failed',
          })
          result.failed++
        }
      }

      // Batch operations
      if (responsesToUpsert.length > 0) {
        const { error: insertError } = await supabase
          .from('question_responses')
          .insert(responsesToUpsert)

        if (insertError) {
          return {
            success: false,
            error: `Failed to insert responses: ${insertError.message}`,
          }
        }
      }

      // Update existing responses
      for (const updateData of responsesToUpdate) {
        const { error: updateError } = await supabase
          .from('question_responses')
          .update(updateData)
          .eq('session_id', request.sessionId)
          .eq('question_id', updateData.question_id)

        if (updateError) {
          result.errors.push({
            questionId: updateData.question_id,
            error: 'Failed to update response',
          })
          result.failed++
          result.processed--
        }
      }

      result.success = result.failed === 0

      return {
        success: true,
        result,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Auto-save responses (non-blocking, best effort)
   */
  async autoSaveResponses(request: AutoSaveRequest): Promise<{
    success: boolean
    result?: AutoSaveResult
    error?: string
  }> {
    try {
      const supabase = await this.getSupabaseClient()

      // Verify session exists
      const { data: session } = await supabase
        .from('exam_sessions')
        .select('id, status, user_id')
        .eq('id', request.sessionId)
        .single()

      if (!session || session.status !== 'active') {
        return {
          success: false,
          error: 'Session not found or not active',
        }
      }

      const result: AutoSaveResult = {
        success: true,
        saved: 0,
        skipped: 0,
        errors: [],
        nextAutoSave: Date.now() + 30000,
      }

      if (request.responses.length === 0) {
        return { success: true, result }
      }

      // Get existing responses
      const questionIds = request.responses.map((r) => r.questionId)
      const { data: existingResponses } = await supabase
        .from('question_responses')
        .select('question_id, updated_at, response')
        .eq('session_id', request.sessionId)
        .in('question_id', questionIds)

      const existingMap = new Map(
        existingResponses?.map((r) => [
          r.question_id,
          {
            timestamp: new Date(r.updated_at).getTime(),
            response: r.response,
          },
        ]) || []
      )

      // Get questions for basic evaluation
      const { data: questions } = await supabase
        .from('questions')
        .select('id, type, correct_answer, points')
        .in('id', questionIds)

      const questionsMap = new Map(questions?.map((q) => [q.id, q]) || [])

      // Process responses
      for (const response of request.responses) {
        try {
          const existing = existingMap.get(response.questionId)
          const responseTimestamp = response.timestamp || Date.now()

          // Skip if server has newer data
          if (existing && responseTimestamp <= existing.timestamp) {
            if (
              JSON.stringify(existing.response) ===
              JSON.stringify(response.response)
            ) {
              result.skipped++
              continue
            }
            result.errors.push({
              questionId: response.questionId,
              error: 'Conflict detected - server has newer data',
            })
            result.skipped++
            continue
          }

          const question = questionsMap.get(response.questionId)
          let evaluation = { isCorrect: null, pointsEarned: 0 }

          if (question) {
            evaluation = this.evaluateAnswerQuick(response.response, question)
          }

          const responseData = {
            session_id: request.sessionId,
            question_id: response.questionId,
            user_id: session.user_id,
            response: response.response,
            is_correct: evaluation.isCorrect,
            points_earned: evaluation.pointsEarned,
            updated_at: new Date().toISOString(),
          }

          if (existing) {
            const { error: updateError } = await supabase
              .from('question_responses')
              .update(responseData)
              .eq('session_id', request.sessionId)
              .eq('question_id', response.questionId)

            if (updateError) {
              result.errors.push({
                questionId: response.questionId,
                error: `Update failed: ${updateError.message}`,
              })
            } else {
              result.saved++
            }
          } else {
            const { error: insertError } = await supabase
              .from('question_responses')
              .insert({
                ...responseData,
                created_at: new Date().toISOString(),
              })

            if (insertError) {
              result.errors.push({
                questionId: response.questionId,
                error: `Insert failed: ${insertError.message}`,
              })
            } else {
              result.saved++
            }
          }
        } catch (error) {
          result.errors.push({
            questionId: response.questionId,
            error: error instanceof Error ? error.message : 'Processing failed',
          })
        }
      }

      // Adjust next auto-save timing
      const totalAttempted = request.responses.length
      const successRate = totalAttempted > 0 ? result.saved / totalAttempted : 1

      if (successRate > 0.8) {
        result.nextAutoSave = Date.now() + 30000
      } else if (successRate > 0.5) {
        result.nextAutoSave = Date.now() + 45000
      } else {
        result.nextAutoSave = Date.now() + 60000
      }

      result.success = result.errors.length < request.responses.length * 0.5

      return { success: true, result }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Quick answer evaluation for auto-save (performance optimized)
   */
  private evaluateAnswerQuick(
    response: unknown,
    question: {
      type: string
      correct_answer: unknown
      points: number | null
    }
  ): { isCorrect: boolean | null; pointsEarned: number } {
    const questionPoints = question.points || 1

    switch (question.type) {
      case 'multiple_choice':
        const isCorrect =
          JSON.stringify(response) === JSON.stringify(question.correct_answer)
        return {
          isCorrect,
          pointsEarned: isCorrect ? questionPoints : 0,
        }

      case 'true_false':
      case 'fill_blank':
        const normalizeAnswer = (answer: unknown): string => {
          return String(answer || '')
            .toLowerCase()
            .trim()
        }

        const isCorrectText =
          normalizeAnswer(response) === normalizeAnswer(question.correct_answer)
        return {
          isCorrect: isCorrectText,
          pointsEarned: isCorrectText ? questionPoints : 0,
        }

      case 'essay':
      case 'matching':
        return {
          isCorrect: null,
          pointsEarned: 0,
        }

      default:
        return {
          isCorrect: null,
          pointsEarned: 0,
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
