import { createClient } from '@/lib/supabase/server'
import { createClient as createClientClient } from '@/lib/supabase/client'
import type { Tables, TablesInsert } from '@/types/database.types'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { ExamSessionWithDetails } from '@/lib/exam-sessions/service'

export type ExamResult = Tables<'exam_results'>
export type ExamResultInsert = TablesInsert<'exam_results'>

export interface ExamResultWithDetails extends ExamResult {
  exam_sessions: ExamSessionWithDetails & {
    user_profiles: {
      first_name: string
      last_name: string
      email: string
    }
  }
  exams: {
    title: string
  }
}

export interface ResultsFilters {
  examId?: string
  userId?: string
  sessionId?: string
  minScore?: number
  maxScore?: number
  completedAfter?: string
  completedBefore?: string
}

export interface ExamAnalytics {
  totalAttempts: number
  completedAttempts: number
  averageScore: number
  averageTimeSpent: number
  passRate: number
  scoreDistribution: Array<{
    range: string
    count: number
    percentage: number
  }>
  questionAnalytics: Array<{
    questionId: string
    questionTitle: string
    correctResponses: number
    totalResponses: number
    accuracyRate: number
    averageTimeSpent: number
  }>
  timeAnalytics: {
    averageCompletionTime: number
    fastestCompletion: number
    slowestCompletion: number
  }
}

export interface ResultsServiceOptions {
  useServerClient?: boolean
}

export class ResultsService {
  private supabase: SupabaseClient | null

  constructor(options: ResultsServiceOptions = {}) {
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
   * Calculate and store exam results for a completed session with provided Supabase client
   */
  async calculateExamResultWithClient(
    sessionId: string,
    supabaseClient: SupabaseClient
  ): Promise<{
    success: boolean
    result?: ExamResult
    error?: string
  }> {
    console.log(
      `DEBUG: calculateExamResultWithClient called for session ${sessionId}`
    )
    // Use the provided client instead of getting a new one
    return this.calculateExamResultInternal(sessionId, supabaseClient)
  }

  /**
   * Calculate and store exam results for a completed session
   */
  async calculateExamResult(sessionId: string): Promise<{
    success: boolean
    result?: ExamResult
    error?: string
  }> {
    console.log(
      `DEBUG: calculateExamResult (default) called for session ${sessionId}`
    )
    const supabase = await this.getSupabaseClient()
    return this.calculateExamResultInternal(sessionId, supabase)
  }

  /**
   * Internal method that does the actual calculation
   */
  private async calculateExamResultInternal(
    sessionId: string,
    providedSupabaseClient: SupabaseClient
  ): Promise<{
    success: boolean
    result?: ExamResult
    error?: string
  }> {
    try {
      console.log(`Calculating exam result for session ${sessionId}`)

      // Use provided authenticated client instead of service client (which has RLS issues)
      const supabaseClient = providedSupabaseClient || (await createClient())
      console.log(
        'DEBUG: Using',
        providedSupabaseClient
          ? 'provided authenticated client'
          : 'fallback service client'
      )

      // Get session with responses (get questions separately)
      const { data: session, error: sessionError } = await supabaseClient
        .from('exam_sessions')
        .select(
          `
          *,
          exams(*),
          question_responses(*)
        `
        )
        .eq('id', sessionId)
        .in('status', ['grading', 'completed'])
        .single()

      if (sessionError || !session) {
        console.error(
          `Failed to fetch session ${sessionId} for result calculation:`,
          sessionError
        )
        return {
          success: false,
          error: 'Session not found or not in grading/completed status',
        }
      }

      console.log(
        `Found session ${sessionId} with ${session.question_responses?.length || 0} question responses`
      )

      // Check if result already exists
      const { data: existingResult } = await supabaseClient
        .from('exam_results')
        .select('id')
        .eq('session_id', sessionId)
        .single()

      if (existingResult) {
        return {
          success: false,
          error: 'Result already calculated for this session',
        }
      }

      // Get questions separately (same pattern as exam session service)
      if (
        !session.question_responses ||
        session.question_responses.length === 0
      ) {
        console.warn(
          `No question responses found for session ${sessionId} - cannot calculate scores`
        )
        return {
          success: false,
          error: 'No responses found for this session',
        }
      }

      const questionIds = session.question_responses.map(
        (r: { question_id: string }) => r.question_id
      )
      console.log(
        `DEBUG: About to query ${questionIds.length} questions through exam_questions junction table`
      )
      console.log('DEBUG: questionIds array:', JSON.stringify(questionIds))
      console.log('DEBUG: exam_id:', session.exam_id)

      // Use authenticated client - student can read questions for their completed sessions
      console.log(
        'DEBUG: Using authenticated client to query junction table...'
      )
      const { data: examQuestions, error: questionsError } =
        await supabaseClient
          .from('exam_questions')
          .select(
            `
          questions (
            id,
            type,
            correct_answer,
            options,
            points
          )
        `
          )
          .eq('exam_id', session.exam_id || '')
          .in('question_id', questionIds)

      console.log(
        `DEBUG: Junction table query completed. Found ${examQuestions?.length || 0} exam-question records. Error:`,
        questionsError?.message
      )

      // Extract questions from the junction table results
      let questions: unknown[] =
        examQuestions
          ?.map((eq: { questions: unknown }) => eq.questions)
          .filter((q: unknown) => q !== null) || []
      console.log(
        `DEBUG: Extracted ${questions.length} questions from junction table results`
      )

      // If junction table approach still failed, try direct questions table query as fallback
      if (questions.length === 0) {
        console.log(
          'DEBUG: Junction table approach still failed, trying direct questions table query as fallback...'
        )
        const { data: directQuestions, error: directError } =
          await supabaseClient
            .from('questions')
            .select('id, type, correct_answer, options, points')
            .in('id', questionIds)

        console.log('DEBUG: Direct questions query result:', {
          found: directQuestions?.length || 0,
          error: directError?.message,
        })

        if (directQuestions && directQuestions.length > 0) {
          questions = directQuestions
          console.log(
            `DEBUG: Using ${questions.length} questions from direct query`
          )
        }
      }

      if (questionsError) {
        console.error(
          `Failed to fetch questions for session ${sessionId}:`,
          questionsError
        )
        return {
          success: false,
          error: `Failed to fetch questions: ${questionsError.message}`,
        }
      }

      const questionsMap = new Map(
        questions?.map((q: unknown) => {
          const question = q as { id: string }
          return [question.id, q]
        }) || []
      )
      console.log(
        `Found ${questions?.length || 0} questions for ${questionIds.length} responses`
      )

      let totalScore = 0
      let maxPossibleScore = 0
      let correctAnswers = 0
      let totalQuestions = 0

      console.log(
        `Starting score calculation for ${session.question_responses.length} responses`
      )

      // Calculate scores
      for (const response of session.question_responses) {
        const question = questionsMap.get(response.question_id)
        if (!question) {
          console.warn(
            `Skipping response with missing question: ${response.question_id}`
          )
          continue
        }

        totalQuestions++
        const questionPoints = (question as any).points || 1
        maxPossibleScore += questionPoints

        // Check if answer is correct based on question type
        let isCorrect = false

        switch ((question as any).type) {
          case 'multiple_choice':
            // Handle option ID comparison for multiple choice (same logic as ExamSessionService)
            const userAnswerArray = Array.isArray(response.response)
              ? response.response
              : [String(response.response)]
            const correctAnswerArray = Array.isArray(
              (question as any).correct_answer
            )
              ? (question as any).correct_answer.map(String)
              : [String((question as any).correct_answer)]

            // Sort arrays for comparison to handle multiple selections
            const sortedUserAnswer = userAnswerArray.sort()
            const sortedCorrectAnswer = correctAnswerArray.sort()

            isCorrect =
              JSON.stringify(sortedUserAnswer) ===
              JSON.stringify(sortedCorrectAnswer)
            console.log(
              `Question ${(question as any).id} (${(question as any).type}): User answered ${JSON.stringify(sortedUserAnswer)}, correct answer ${JSON.stringify(sortedCorrectAnswer)}, isCorrect: ${isCorrect}`
            )
            break

          case 'true_false':
          case 'fill_blank':
            isCorrect =
              this.normalizeAnswer(response.response) ===
              this.normalizeAnswer((question as any).correct_answer)
            console.log(
              `Question ${(question as any).id} (${(question as any).type}): User answered "${response.response}", correct answer "${(question as any).correct_answer}", isCorrect: ${isCorrect}`
            )
            break

          case 'essay':
          case 'matching':
            // For essay and matching questions, manual grading is required
            // For now, we'll award partial credit
            isCorrect = false // Requires manual review
            console.log(
              `Question ${(question as any).id} (${(question as any).type}): Requires manual grading`
            )
            break

          default:
            isCorrect = false
            console.log(
              `Question ${(question as any).id} (${(question as any).type}): Unknown question type`
            )
        }

        if (isCorrect) {
          correctAnswers++
          totalScore += questionPoints
        }
      }

      console.log(
        `Score calculation complete: ${totalScore}/${maxPossibleScore} points (${correctAnswers}/${totalQuestions} correct)`
      )

      const percentage =
        maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0
      const timeSpent = this.calculateTimeSpent(
        session.started_at,
        session.completed_at || null
      )

      // Create exam result
      const { data: result, error: resultError } = await supabaseClient
        .from('exam_results')
        .insert({
          session_id: sessionId,
          user_id: session.user_id,
          exam_id: session.exam_id,
          total_score: totalScore,
          max_possible_score: maxPossibleScore,
          percentage_score: percentage,
          correct_answers: correctAnswers,
          total_questions: totalQuestions,
          time_spent: timeSpent,
          submitted_at: session.completed_at || new Date().toISOString(),
          requires_manual_grading: this.hasEssayQuestions(
            (session.question_responses || []).map((r) => ({
              questions: questionsMap.get(r.question_id)
                ? { type: (questionsMap.get(r.question_id) as any).type }
                : undefined,
            }))
          ),
        })
        .select()
        .single()

      if (resultError) {
        throw new Error(resultError.message)
      }

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

  private normalizeAnswer(answer: unknown): string {
    if (typeof answer === 'string') {
      return answer.toLowerCase().trim()
    }
    return String(answer || '')
      .toLowerCase()
      .trim()
  }

  private calculateTimeSpent(
    startedAt: string,
    completedAt: string | null
  ): number {
    if (!completedAt) return 0
    const start = new Date(startedAt).getTime()
    const end = new Date(completedAt).getTime()
    return Math.floor((end - start) / 1000) // seconds
  }

  private hasEssayQuestions(
    responses: Array<{ questions?: { type?: string } }>
  ): boolean {
    return responses.some(
      (response) =>
        response.questions?.type === 'essay' ||
        response.questions?.type === 'matching'
    )
  }

  /**
   * Get exam results with filtering
   */
  async getExamResults(
    filters: ResultsFilters = {},
    options: {
      page?: number
      limit?: number
      sortBy?: string
      sortOrder?: 'asc' | 'desc'
      includeDetails?: boolean
    } = {}
  ): Promise<{
    success: boolean
    results?: ExamResultWithDetails[]
    totalCount?: number
    error?: string
  }> {
    try {
      const supabase = await this.getSupabaseClient()

      let query = supabase.from('exam_results').select(
        `
          *,
          ${
            options.includeDetails
              ? `
            exam_sessions(
              *,
              exams(title, duration),
              user_profiles(first_name, last_name, email)
            ),
            exams(title)
          `
              : ''
          }
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
      if (filters.sessionId) {
        query = query.eq('session_id', filters.sessionId)
      }
      if (filters.minScore) {
        query = query.gte('percentage_score', filters.minScore)
      }
      if (filters.maxScore) {
        query = query.lte('percentage_score', filters.maxScore)
      }
      if (filters.completedAfter) {
        query = query.gte('submitted_at', filters.completedAfter)
      }
      if (filters.completedBefore) {
        query = query.lte('submitted_at', filters.completedBefore)
      }

      // Apply sorting
      const sortBy = options.sortBy || 'submitted_at'
      const sortOrder = options.sortOrder || 'desc'
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })

      // Apply pagination
      const page = options.page || 1
      const limit = options.limit || 20
      const from = (page - 1) * limit
      const to = from + limit - 1

      query = query.range(from, to)

      const { data: results, error, count } = await query

      if (error) {
        throw new Error(error.message)
      }

      return {
        success: true,
        results: (results as unknown as ExamResultWithDetails[]) || [],
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
   * Get exam analytics
   */
  async getExamAnalytics(examId: string): Promise<{
    success: boolean
    analytics?: ExamAnalytics
    error?: string
  }> {
    try {
      const supabase = await this.getSupabaseClient()

      // Get all results for the exam with proper relationship through exam_sessions
      const { data: results, error: resultsError } = await supabase
        .from('exam_results')
        .select(
          `
          *,
          exam_sessions(
            id,
            started_at, 
            completed_at,
            question_responses(
              *,
              questions(id, title, type, correct_answer)
            )
          )
        `
        )
        .eq('exam_id', examId)

      if (resultsError) {
        throw new Error(resultsError.message)
      }

      if (!results || results.length === 0) {
        // Fallback to session-based analytics when no results exist yet
        const { data: sessions, error: sessionError } = await supabase
          .from('exam_sessions')
          .select(
            `
            *,
            question_responses(
              *,
              questions(id, title, type, correct_answer)
            )
          `
          )
          .eq('exam_id', examId)
          .eq('status', 'completed')

        if (sessionError || !sessions || sessions.length === 0) {
          return {
            success: true,
            analytics: {
              totalAttempts: 0,
              completedAttempts: 0,
              averageScore: 0,
              averageTimeSpent: 0,
              passRate: 0,
              scoreDistribution: [],
              questionAnalytics: [],
              timeAnalytics: {
                averageCompletionTime: 0,
                fastestCompletion: 0,
                slowestCompletion: 0,
              },
            },
          }
        }

        // Calculate basic analytics from sessions when results don't exist
        const totalAttempts = sessions.length
        const completedAttempts = sessions.length

        const completionTimes = sessions
          .map((s) => {
            if (s.started_at && s.completed_at) {
              return Math.floor(
                (new Date(s.completed_at).getTime() -
                  new Date(s.started_at).getTime()) /
                  1000
              )
            }
            return 0
          })
          .filter((t) => t > 0)

        const averageTimeSpent =
          completionTimes.length > 0
            ? completionTimes.reduce((sum, t) => sum + t, 0) /
              completionTimes.length
            : 0

        return {
          success: true,
          analytics: {
            totalAttempts,
            completedAttempts,
            averageScore: 0, // Cannot calculate without exam results
            averageTimeSpent,
            passRate: 0, // Cannot calculate without exam results
            scoreDistribution: [],
            questionAnalytics: [],
            timeAnalytics: {
              averageCompletionTime: averageTimeSpent,
              fastestCompletion:
                completionTimes.length > 0 ? Math.min(...completionTimes) : 0,
              slowestCompletion:
                completionTimes.length > 0 ? Math.max(...completionTimes) : 0,
            },
          },
        }
      }

      // Calculate basic stats
      const totalAttempts = results.length
      const completedAttempts = results.filter(
        (r) => r.percentage_score !== null
      ).length
      const averageScore =
        results.reduce((sum, r) => sum + (r.percentage_score || 0), 0) /
        completedAttempts
      const averageTimeSpent =
        results.reduce((sum, r) => sum + (r.time_spent || 0), 0) /
        completedAttempts
      const passRate =
        (results.filter((r) => (r.percentage_score || 0) >= 60).length /
          completedAttempts) *
        100

      // Score distribution
      const scoreRanges = [
        { min: 0, max: 20, label: '0-20%' },
        { min: 21, max: 40, label: '21-40%' },
        { min: 41, max: 60, label: '41-60%' },
        { min: 61, max: 80, label: '61-80%' },
        { min: 81, max: 100, label: '81-100%' },
      ]

      const scoreDistribution = scoreRanges.map((range) => {
        const count = results.filter(
          (r) =>
            (r.percentage_score || 0) >= range.min &&
            (r.percentage_score || 0) <= range.max
        ).length
        return {
          range: range.label,
          count,
          percentage:
            completedAttempts > 0 ? (count / completedAttempts) * 100 : 0,
        }
      })

      // Time analytics
      const completionTimes = results
        .map((r) => r.time_spent || 0)
        .filter((t) => t > 0)

      const timeAnalytics = {
        averageCompletionTime: averageTimeSpent,
        fastestCompletion:
          completionTimes.length > 0 ? Math.min(...completionTimes) : 0,
        slowestCompletion:
          completionTimes.length > 0 ? Math.max(...completionTimes) : 0,
      }

      // Question analytics (simplified - would need more complex analysis)
      const questionAnalytics: ExamAnalytics['questionAnalytics'] = []

      return {
        success: true,
        analytics: {
          totalAttempts,
          completedAttempts,
          averageScore,
          averageTimeSpent,
          passRate,
          scoreDistribution,
          questionAnalytics,
          timeAnalytics,
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
   * Get user's exam history
   */
  async getUserExamHistory(userId: string): Promise<{
    success: boolean
    results?: ExamResultWithDetails[]
    error?: string
  }> {
    const result = await this.getExamResults(
      { userId },
      { includeDetails: true, sortBy: 'submitted_at', sortOrder: 'desc' }
    )

    return {
      success: result.success,
      results: result.results,
      error: result.error,
    }
  }

  /**
   * Update exam result (for manual grading)
   */
  async updateExamResult(
    resultId: string,
    updates: {
      totalScore?: number
      percentageScore?: number
      gradedAt?: string
      gradedBy?: string
      graderNotes?: string
    }
  ): Promise<{
    success: boolean
    result?: ExamResult
    error?: string
  }> {
    try {
      const supabase = await this.getSupabaseClient()

      const { data: result, error } = await supabase
        .from('exam_results')
        .update({
          total_score: updates.totalScore,
          percentage_score: updates.percentageScore,
          graded_at: updates.gradedAt || new Date().toISOString(),
          graded_by: updates.gradedBy || null,
          grader_notes: updates.graderNotes || null,
          requires_manual_grading: false,
        })
        .eq('id', resultId)
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

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
}

// Factory function
export function createResultsService(
  options?: ResultsServiceOptions
): ResultsService {
  return new ResultsService(options)
}

export default ResultsService
