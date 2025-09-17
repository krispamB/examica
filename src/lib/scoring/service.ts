import { createClient } from '@/lib/supabase/server'
import { createClient as createClientClient } from '@/lib/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface QuestionData {
  id: string
  order_index: number
  points: number
  required: boolean
  type: string
  correct_answer: unknown
  options?: unknown
}

export interface StudentAnswer {
  questionId: string
  response: unknown
  timestamp: number
}

export interface ScoringResult {
  questionId: string
  isCorrect: boolean | null
  pointsEarned: number
  maxPoints: number
  feedback?: string
}

export interface ExamScore {
  totalScore: number
  maxPossibleScore: number
  percentage: number
  correctAnswers: number
  totalQuestions: number
  results: ScoringResult[]
  requiresManualGrading: boolean
  manualGradingCount: number
}

export interface ScoringServiceOptions {
  useServerClient?: boolean
}

export class ScoringService {
  private supabase: SupabaseClient | null

  constructor(options: ScoringServiceOptions = {}) {
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
   * Calculate exam score using optimized single-query approach
   */
  async calculateExamScore(
    examId: string,
    studentAnswers: Record<string, unknown>
  ): Promise<{
    success: boolean
    score?: ExamScore
    error?: string
  }> {
    try {
      const supabase = await this.getSupabaseClient()

      // Single optimized query to get all exam data
      const { data: examData, error } = await supabase
        .from('exam_questions')
        .select(
          `
          id,
          order_index,
          points,
          required,
          questions!inner (
            id,
            type,
            correct_answer,
            options,
            explanation
          )
        `
        )
        .eq('exam_id', examId)
        .order('order_index', { ascending: true })

      if (error) {
        throw new Error(`Failed to fetch exam data: ${error.message}`)
      }

      if (!examData || examData.length === 0) {
        return {
          success: false,
          error: 'No questions found for this exam',
        }
      }

      // Transform to our working format
      const questions: QuestionData[] = examData.map((eq) => ({
        id: (eq.questions as any).id,
        order_index: eq.order_index,
        points: eq.points || 1,
        required: eq.required ?? true,
        type: (eq.questions as any).type,
        correct_answer: (eq.questions as any).correct_answer,
        options: (eq.questions as any).options,
      }))

      // Sort questions by order (should already be sorted, but ensure consistency)
      questions.sort((a, b) => a.order_index - b.order_index)

      // Convert student answers to sorted array
      const sortedAnswers: StudentAnswer[] = questions
        .map((q) => ({
          questionId: q.id,
          response: studentAnswers[q.id] || null,
          timestamp: Date.now(),
        }))
        .filter(
          (answer) => answer.response !== null && answer.response !== undefined
        )

      // Calculate score using optimized algorithm
      const score = this.calculateScore(questions, sortedAnswers)

      return {
        success: true,
        score,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Optimized scoring algorithm using single-pass comparison
   */
  private calculateScore(
    questions: QuestionData[],
    studentAnswers: StudentAnswer[]
  ): ExamScore {
    // Create lookup map for student answers for O(1) access
    const answerMap = new Map(
      studentAnswers.map((answer) => [answer.questionId, answer])
    )

    const results: ScoringResult[] = []
    let totalScore = 0
    let maxPossibleScore = 0
    let correctAnswers = 0
    let manualGradingCount = 0

    // Single pass through questions
    for (const question of questions) {
      const studentAnswer = answerMap.get(question.id)
      const maxPoints = question.points

      maxPossibleScore += maxPoints

      if (!studentAnswer) {
        // No answer provided
        results.push({
          questionId: question.id,
          isCorrect: false,
          pointsEarned: 0,
          maxPoints,
          feedback: 'No answer provided',
        })
        continue
      }

      // Evaluate answer using optimized comparison
      const evaluation = this.evaluateAnswerOptimized(
        studentAnswer.response,
        question
      )

      results.push({
        questionId: question.id,
        isCorrect: evaluation.isCorrect,
        pointsEarned: evaluation.pointsEarned,
        maxPoints,
        feedback: evaluation.feedback,
      })

      totalScore += evaluation.pointsEarned

      if (evaluation.isCorrect === true) {
        correctAnswers++
      } else if (evaluation.isCorrect === null) {
        manualGradingCount++
      }
    }

    const percentage =
      maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0

    return {
      totalScore,
      maxPossibleScore,
      percentage: Math.round(percentage * 100) / 100, // Round to 2 decimal places
      correctAnswers,
      totalQuestions: questions.length,
      results,
      requiresManualGrading: manualGradingCount > 0,
      manualGradingCount,
    }
  }

  /**
   * Optimized answer evaluation
   */
  private evaluateAnswerOptimized(
    response: unknown,
    question: QuestionData
  ): {
    isCorrect: boolean | null
    pointsEarned: number
    feedback?: string
  } {
    const maxPoints = question.points

    try {
      switch (question.type) {
        case 'multiple_choice':
          return this.evaluateMultipleChoice(response, question, maxPoints)

        case 'true_false':
          return this.evaluateTrueFalse(response, question, maxPoints)

        case 'fill_blank':
          return this.evaluateFillBlank(response, question, maxPoints)

        case 'essay':
          return this.evaluateEssay(response, question, maxPoints)

        case 'matching':
          return this.evaluateMatching(response, question, maxPoints)

        default:
          return {
            isCorrect: false,
            pointsEarned: 0,
            feedback: `Unsupported question type: ${question.type}`,
          }
      }
    } catch (error) {
      return {
        isCorrect: false,
        pointsEarned: 0,
        feedback: `Evaluation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }
    }
  }

  private evaluateMultipleChoice(
    response: unknown,
    question: QuestionData,
    maxPoints: number
  ): { isCorrect: boolean; pointsEarned: number; feedback?: string } {
    try {
      // Handle both single and multiple selections
      const userAnswers = Array.isArray(response) ? response : [response]
      const correctAnswers = Array.isArray(question.correct_answer)
        ? question.correct_answer
        : [question.correct_answer]

      // Normalize answers to strings for comparison
      const normalizedUser = userAnswers.map(String).sort()
      const normalizedCorrect = correctAnswers.map(String).sort()

      const isCorrect =
        JSON.stringify(normalizedUser) === JSON.stringify(normalizedCorrect)

      // Partial credit for multiple choice (if applicable)
      if (!isCorrect && userAnswers.length > 1 && correctAnswers.length > 1) {
        const correctCount = userAnswers.filter((answer) =>
          correctAnswers.includes(answer)
        ).length

        const partialPoints = Math.max(
          0,
          (correctCount / correctAnswers.length) * maxPoints
        )

        return {
          isCorrect: false,
          pointsEarned: partialPoints,
          feedback: `Partial credit: ${correctCount}/${correctAnswers.length} correct selections`,
        }
      }

      return {
        isCorrect,
        pointsEarned: isCorrect ? maxPoints : 0,
        feedback: isCorrect ? 'Correct' : 'Incorrect',
      }
    } catch {
      return {
        isCorrect: false,
        pointsEarned: 0,
        feedback: 'Error evaluating multiple choice answer',
      }
    }
  }

  private evaluateTrueFalse(
    response: unknown,
    question: QuestionData,
    maxPoints: number
  ): { isCorrect: boolean; pointsEarned: number; feedback?: string } {
    const normalizeBoolean = (value: unknown): boolean | null => {
      if (typeof value === 'boolean') return value
      if (typeof value === 'string') {
        const lower = value.toLowerCase().trim()
        if (
          lower === 'true' ||
          lower === 't' ||
          lower === '1' ||
          lower === 'yes'
        )
          return true
        if (
          lower === 'false' ||
          lower === 'f' ||
          lower === '0' ||
          lower === 'no'
        )
          return false
      }
      if (typeof value === 'number') {
        return value === 1 ? true : value === 0 ? false : null
      }
      return null
    }

    const userAnswer = normalizeBoolean(response)
    const correctAnswer = normalizeBoolean(question.correct_answer)

    if (userAnswer === null) {
      return {
        isCorrect: false,
        pointsEarned: 0,
        feedback: 'Invalid true/false response',
      }
    }

    const isCorrect = userAnswer === correctAnswer

    return {
      isCorrect,
      pointsEarned: isCorrect ? maxPoints : 0,
      feedback: isCorrect ? 'Correct' : 'Incorrect',
    }
  }

  private evaluateFillBlank(
    response: unknown,
    question: QuestionData,
    maxPoints: number
  ): { isCorrect: boolean; pointsEarned: number; feedback?: string } {
    const normalizeText = (text: unknown): string => {
      return String(text || '')
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' ')
    }

    const userAnswer = normalizeText(response)
    const correctAnswers = Array.isArray(question.correct_answer)
      ? question.correct_answer.map(normalizeText)
      : [normalizeText(question.correct_answer)]

    const isCorrect = correctAnswers.includes(userAnswer)

    return {
      isCorrect,
      pointsEarned: isCorrect ? maxPoints : 0,
      feedback: isCorrect ? 'Correct' : 'Incorrect',
    }
  }

  private evaluateEssay(
    response: unknown,
    _question: QuestionData,
    _maxPoints: number
  ): { isCorrect: null; pointsEarned: number; feedback: string } {
    const wordCount = String(response || '')
      .trim()
      .split(/\s+/).length

    return {
      isCorrect: null, // Requires manual grading
      pointsEarned: 0,
      feedback: `Essay response (${wordCount} words) - requires manual grading`,
    }
  }

  private evaluateMatching(
    response: unknown,
    _question: QuestionData,
    _maxPoints: number
  ): { isCorrect: boolean | null; pointsEarned: number; feedback?: string } {
    try {
      if (!response || typeof response !== 'object') {
        return {
          isCorrect: false,
          pointsEarned: 0,
          feedback: 'Invalid matching response format',
        }
      }

      const userMatches = response as Record<string, string>
      const correctMatches = _question.correct_answer as Record<string, string>

      if (!correctMatches || typeof correctMatches !== 'object') {
        return {
          isCorrect: null,
          pointsEarned: 0,
          feedback:
            'Matching question requires manual grading - invalid answer key',
        }
      }

      let correctCount = 0
      const totalPairs = Object.keys(correctMatches).length

      for (const [key, correctValue] of Object.entries(correctMatches)) {
        if (userMatches[key] === correctValue) {
          correctCount++
        }
      }

      const isCorrect = correctCount === totalPairs
      const partialPoints = (correctCount / totalPairs) * _maxPoints

      return {
        isCorrect,
        pointsEarned: partialPoints,
        feedback: `${correctCount}/${totalPairs} matches correct`,
      }
    } catch {
      return {
        isCorrect: null,
        pointsEarned: 0,
        feedback: 'Error evaluating matching answer - requires manual review',
      }
    }
  }

  /**
   * Compare two sorted answer arrays (for debugging/validation)
   */
  validateAnswerOrder(
    questions: QuestionData[],
    studentAnswers: StudentAnswer[]
  ): {
    valid: boolean
    issues: string[]
  } {
    const issues: string[] = []

    // Check if questions are sorted by order_index
    for (let i = 1; i < questions.length; i++) {
      if (questions[i].order_index < questions[i - 1].order_index) {
        issues.push(
          `Questions not sorted: ${questions[i - 1].order_index} > ${questions[i].order_index}`
        )
      }
    }

    // Check for missing questions in student answers
    const answerQuestionIds = new Set(studentAnswers.map((a) => a.questionId))
    const missingQuestions = questions.filter(
      (q) => !answerQuestionIds.has(q.id)
    )

    if (missingQuestions.length > 0) {
      issues.push(`Missing answers for ${missingQuestions.length} questions`)
    }

    // Check for extra answers not in questions
    const questionIds = new Set(questions.map((q) => q.id))
    const extraAnswers = studentAnswers.filter(
      (a) => !questionIds.has(a.questionId)
    )

    if (extraAnswers.length > 0) {
      issues.push(`Extra answers for ${extraAnswers.length} unknown questions`)
    }

    return {
      valid: issues.length === 0,
      issues,
    }
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(score: ExamScore): {
    grade: string
    percentile: number
    strengths: string[]
    improvements: string[]
  } {
    const percentage = score.percentage

    let grade: string
    if (percentage >= 90) grade = 'A'
    else if (percentage >= 80) grade = 'B'
    else if (percentage >= 70) grade = 'C'
    else if (percentage >= 60) grade = 'D'
    else grade = 'F'

    // Simple percentile calculation (would be more sophisticated in real implementation)
    const percentile = Math.min(99, Math.max(1, Math.round(percentage)))

    const strengths: string[] = []
    const improvements: string[] = []

    // Analyze by question type (placeholder for future implementation)
    // const typeStats = new Map<string, { correct: number; total: number }>()

    // score.results.forEach(result => {
    //   // This would be expanded with actual question type analysis
    // })

    if (score.correctAnswers / score.totalQuestions > 0.8) {
      strengths.push('Strong overall performance')
    }

    if (score.requiresManualGrading) {
      improvements.push('Complete essay questions for full evaluation')
    }

    return {
      grade,
      percentile,
      strengths,
      improvements,
    }
  }
}

// Factory function
export function createScoringService(
  options?: ScoringServiceOptions
): ScoringService {
  return new ScoringService(options)
}

export default ScoringService
