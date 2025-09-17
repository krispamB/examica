import { getEnvironmentConfig } from '@/lib/config/validation'

export type QuestionType =
  | 'multiple_choice'
  | 'true_false'
  | 'essay'
  | 'fill_blank'
  | 'matching'
export type QuestionDifficulty = 'easy' | 'medium' | 'hard'

interface ParsedQuestionFromAI {
  title?: string
  content: string
  options?: Array<{ id: string; text: string; isCorrect: boolean }> | null
  correct_answer: string | number | boolean | string[]
  explanation?: string
  points?: number
  category?: string
  tags?: string[]
}

export interface QuestionGenerationRequest {
  topic: string
  subject?: string
  type: QuestionType
  difficulty: QuestionDifficulty
  count?: number
  context?: string
  learningObjectives?: string[]
}

export interface GeneratedQuestion {
  title: string
  content: string
  type: QuestionType
  difficulty: QuestionDifficulty
  options?: Array<{ id: string; text: string; isCorrect: boolean }> | null // For multiple choice or null for true/false
  correct_answer: string | number | boolean | string[]
  explanation: string
  points: number
  category?: string
  tags: string[]
  ai_metadata: {
    model: string
    prompt: string
    generated_at: string
    tokens_used?: number
  }
}

export interface QuestionGenerationResult {
  success: boolean
  questions: GeneratedQuestion[]
  error?: string
  metadata: {
    model_used: string
    total_tokens?: number
    generation_time: number
  }
}

class AIQuestionGenerator {
  private config = getEnvironmentConfig()

  async generateQuestions(
    request: QuestionGenerationRequest
  ): Promise<QuestionGenerationResult> {
    const startTime = Date.now()

    try {
      // Check if OpenRouter is configured
      const useOpenRouter =
        this.config.OPENROUTER_API_KEY &&
        !this.config.OPENROUTER_API_KEY.includes('your_')

      if (!useOpenRouter) {
        throw new Error(
          'No AI service configured. Please set OPENROUTER_API_KEY'
        )
      }

      const result = await this.generateWithOpenRouter(request)
      result.metadata.generation_time = Date.now() - startTime
      return result
    } catch (error) {
      return {
        success: false,
        questions: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          model_used: 'none',
          generation_time: Date.now() - startTime,
        },
      }
    }
  }

  private async generateWithOpenRouter(
    request: QuestionGenerationRequest
  ): Promise<QuestionGenerationResult> {
    const prompt = this.buildPrompt(request)

    const response = await fetch(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.OPENROUTER_API_KEY}`,
          'HTTP-Referer': this.config.APP_URL,
          'X-Title': this.config.APP_NAME,
        },
        body: JSON.stringify({
          model: 'openai/gpt-4o-mini',
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: 2000,
          temperature: 0.7,
        }),
      }
    )

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OpenRouter API error: ${error}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content || ''

    const questions = this.parseQuestionsFromResponse(content, request, {
      model: 'gpt-4o-mini',
      prompt,
      generated_at: new Date().toISOString(),
      tokens_used: data.usage?.completion_tokens,
    })

    return {
      success: true,
      questions,
      metadata: {
        model_used: 'gpt-4o-mini',
        total_tokens: data.usage?.total_tokens,
        generation_time: 0, // Will be set by caller
      },
    }
  }

  private buildPrompt(request: QuestionGenerationRequest): string {
    // Use type-specific optimized prompts for supported types
    if (request.type === 'multiple_choice') {
      return this.buildMultipleChoicePrompt(request)
    }

    if (request.type === 'true_false') {
      return this.buildTrueFalsePrompt(request)
    }

    // Fallback to generic prompt for unsupported types (should not happen in UI)
    return this.buildGenericPrompt(request)
  }

  private buildMultipleChoicePrompt(
    request: QuestionGenerationRequest
  ): string {
    const count = request.count || 1
    const difficulty = request.difficulty
    const topic = request.topic
    const subject = request.subject ? ` (${request.subject})` : ''

    let systemPrompt = `You are an expert educator creating ${difficulty}-level multiple choice questions about ${topic}${subject}.

REQUIREMENTS:
- Generate exactly ${count} question(s)
- Each question must have exactly 4 options (A, B, C, D)
- Only ONE correct answer per question
- Three plausible but clearly incorrect distractors
- Academic quality appropriate for ${difficulty} difficulty
- Clear, unambiguous wording`

    if (request.context) {
      systemPrompt += `\n- Additional context: ${request.context}`
    }

    if (request.learningObjectives && request.learningObjectives.length > 0) {
      systemPrompt += `\n- Address these learning objectives: ${request.learningObjectives.join(', ')}`
    }

    systemPrompt += `

OUTPUT FORMAT (valid JSON array):
\`\`\`json
[
  {
    "title": "Concise question title",
    "content": "Clear question stem",
    "options": [
      {
        "id": "1",
        "text": "First option",
        "isCorrect": false
      },
      {
        "id": "2",
        "text": "Second option",
        "isCorrect": false
      },
      {
        "id": "3",
        "text": "Third option",
        "isCorrect": true
      },
      {
        "id": "4",
        "text": "Fourth option",
        "isCorrect": false
      }
    ],
    "correct_answer": ["3"],
    "explanation": "Brief explanation of correct answer",
    "points": ${this.getDefaultPoints(difficulty)},
    "category": "${request.subject || topic}",
    "tags": ["${topic.toLowerCase()}", "${difficulty}"]
  }
]
\`\`\`

Generate ${count} high-quality multiple choice question(s). Ensure perfect JSON formatting.`

    return systemPrompt
  }

  private buildTrueFalsePrompt(request: QuestionGenerationRequest): string {
    const count = request.count || 1
    const difficulty = request.difficulty
    const topic = request.topic
    const subject = request.subject ? ` (${request.subject})` : ''

    let systemPrompt = `You are an expert educator creating ${difficulty}-level true/false questions about ${topic}${subject}.

REQUIREMENTS:
- Generate exactly ${count} question(s)
- Each statement must be definitively true OR false
- Avoid ambiguous or opinion-based statements
- Test specific knowledge, not trivial facts
- Academic quality appropriate for ${difficulty} difficulty
- Clear, unambiguous wording`

    if (request.context) {
      systemPrompt += `\n- Additional context: ${request.context}`
    }

    if (request.learningObjectives && request.learningObjectives.length > 0) {
      systemPrompt += `\n- Address these learning objectives: ${request.learningObjectives.join(', ')}`
    }

    systemPrompt += `

OUTPUT FORMAT (valid JSON array):
\`\`\`json
[
  {
    "title": "Concise question title",
    "content": "Clear true/false statement",
    "options": null,
    "correct_answer": "true",
    "explanation": "Brief explanation of why statement is true/false",
    "points": ${this.getDefaultPoints(difficulty)},
    "category": "${request.subject || topic}",
    "tags": ["${topic.toLowerCase()}", "${difficulty}"]
  }
]
\`\`\`

Generate ${count} high-quality true/false question(s). Ensure perfect JSON formatting.`

    return systemPrompt
  }

  private buildGenericPrompt(request: QuestionGenerationRequest): string {
    const count = request.count || 1
    const questionTypeInstructions = this.getQuestionTypeInstructions(
      request.type
    )

    let prompt = `Generate ${count} high-quality ${request.type.replace('_', ' ')} question(s) for the topic: "${request.topic}"`

    if (request.subject) {
      prompt += ` in the subject of ${request.subject}`
    }

    prompt += `

REQUIREMENTS:
- Difficulty level: ${request.difficulty}
- Question type: ${request.type}
- ${questionTypeInstructions}
- Each question should test understanding, not just memorization
- Questions should be clear, unambiguous, and academically appropriate
- Provide detailed explanations for correct answers`

    if (request.context) {
      prompt += `\n- Context to consider: ${request.context}`
    }

    if (request.learningObjectives && request.learningObjectives.length > 0) {
      prompt += `\n- Learning objectives to address: ${request.learningObjectives.join(', ')}`
    }

    prompt += `

FORMAT YOUR RESPONSE AS VALID JSON:
\`\`\`json
[
  {
    "title": "Brief question title",
    "content": "The full question text",
    "type": "${request.type}",
    "difficulty": "${request.difficulty}",
    ${request.type === 'multiple_choice' ? '"options": [{"id": "1", "text": "Option A", "isCorrect": false}, {"id": "2", "text": "Option B", "isCorrect": true}, {"id": "3", "text": "Option C", "isCorrect": false}, {"id": "4", "text": "Option D", "isCorrect": false}],' : request.type === 'true_false' ? '"options": null,' : ''}
    "correct_answer": ${this.getCorrectAnswerFormat(request.type)},
    "explanation": "Detailed explanation of why this is correct",
    "points": ${this.getDefaultPoints(request.difficulty)},
    "category": "${request.subject || request.topic}",
    "tags": ["relevant", "tags", "here"]
  }
]
\`\`\`

Generate exactly ${count} question(s). Ensure the JSON is valid and properly formatted.`

    return prompt
  }

  private getQuestionTypeInstructions(type: QuestionType): string {
    switch (type) {
      case 'multiple_choice':
        return 'Provide 4 options (A, B, C, D) with only one correct answer. Make distractors plausible but clearly wrong.'
      case 'true_false':
        return 'Create a statement that is definitively true or false. Avoid ambiguous statements.'
      case 'essay':
        return 'Create an open-ended question that requires analysis, synthesis, or evaluation. Provide a rubric in the explanation.'
      case 'fill_blank':
        return 'Create a statement with one or more blanks to fill. Use underscores (_____) for blanks.'
      case 'matching':
        return 'Create two columns of items to match. Provide equal numbers of items in each column.'
      default:
        return 'Follow best practices for this question type.'
    }
  }

  private getCorrectAnswerFormat(type: QuestionType): string {
    switch (type) {
      case 'multiple_choice':
        return '["1"]' // Array of correct option IDs
      case 'true_false':
        return '"true"' // String value "true" or "false"
      case 'essay':
        return '{"rubric": "Scoring criteria", "sample_answer": "Example response"}'
      case 'fill_blank':
        return '["answer1", "answer2"]' // Array of correct answers for each blank
      case 'matching':
        return '{"1": "A", "2": "B", "3": "C"}' // Object mapping left items to right items
      default:
        return '"answer"'
    }
  }

  private getDefaultPoints(difficulty: QuestionDifficulty): number {
    switch (difficulty) {
      case 'easy':
        return 1
      case 'medium':
        return 2
      case 'hard':
        return 3
      default:
        return 1
    }
  }

  private parseQuestionsFromResponse(
    content: string,
    request: QuestionGenerationRequest,
    aiMetadata: {
      model: string
      prompt: string
      generated_at: string
      tokens_used?: number
    }
  ): GeneratedQuestion[] {
    try {
      // Extract JSON from the response (handle markdown code blocks)
      const jsonMatch =
        content.match(/```json\s*([\s\S]*?)\s*```/) ||
        content.match(/\[[\s\S]*\]/)

      if (!jsonMatch) {
        throw new Error('No valid JSON found in AI response')
      }

      const jsonStr = jsonMatch[1] || jsonMatch[0]
      const parsedQuestions = JSON.parse(jsonStr)

      if (!Array.isArray(parsedQuestions)) {
        throw new Error('AI response is not an array of questions')
      }

      return parsedQuestions.map((q: ParsedQuestionFromAI, index: number) => {
        // Validate required fields for supported question types
        this.validateQuestionData(q, request.type)

        return {
          title: q.title || `Generated Question ${index + 1}`,
          content: q.content,
          type: request.type,
          difficulty: request.difficulty,
          options: q.options,
          correct_answer: q.correct_answer,
          explanation: q.explanation || 'No explanation provided',
          points: q.points || this.getDefaultPoints(request.difficulty),
          category: q.category || request.subject || request.topic,
          tags: Array.isArray(q.tags) ? q.tags : [request.topic],
          ai_metadata: {
            ...aiMetadata,
            raw_content: content,
          },
        }
      })
    } catch (error) {
      console.error('Failed to parse AI response:', error)
      console.log('Raw content:', content)

      // Enhanced fallback: try to create meaningful fallback questions
      return this.createFallbackQuestions(content, request, aiMetadata, error)
    }
  }

  private validateQuestionData(
    question: ParsedQuestionFromAI,
    type: QuestionType
  ): void {
    if (!question.content) {
      throw new Error('Question content is required')
    }

    if (type === 'multiple_choice') {
      if (
        !question.options ||
        !Array.isArray(question.options) ||
        question.options.length !== 4
      ) {
        throw new Error('Multiple choice questions must have exactly 4 options')
      }

      // Validate options format: array of objects with id, text, isCorrect
      for (const option of question.options) {
        if (
          typeof option !== 'object' ||
          !option.id ||
          !option.text ||
          typeof option.isCorrect !== 'boolean'
        ) {
          throw new Error(
            'Multiple choice options must be objects with id, text, and isCorrect properties'
          )
        }
      }

      // Validate correct_answer is array of strings
      if (
        !Array.isArray(question.correct_answer) ||
        question.correct_answer.length === 0
      ) {
        throw new Error(
          'Multiple choice correct_answer must be an array of option IDs'
        )
      }

      // Verify at least one option is marked as correct
      const hasCorrectOption = question.options.some(
        (option) => option.isCorrect
      )
      if (!hasCorrectOption) {
        throw new Error('At least one option must be marked as correct')
      }
    }

    if (type === 'true_false') {
      if (
        typeof question.correct_answer !== 'string' ||
        !['true', 'false'].includes(question.correct_answer)
      ) {
        throw new Error(
          'True/false questions must have correct_answer as "true" or "false" string'
        )
      }
    }
  }

  private createFallbackQuestions(
    content: string,
    request: QuestionGenerationRequest,
    aiMetadata: {
      model: string
      prompt: string
      generated_at: string
      tokens_used?: number
    },
    error: unknown
  ): GeneratedQuestion[] {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown parsing error'

    // Try to extract any usable content
    const lines = content.split('\n').filter((line) => line.trim())
    const questionContent =
      lines.find((line) => line.includes('?')) ||
      lines.find((line) => line.length > 20) ||
      'Unable to generate question due to parsing error'

    const fallbackQuestion: GeneratedQuestion = {
      title: `Generated ${request.type.replace('_', ' ')} Question`,
      content: questionContent.slice(0, 200),
      type: request.type,
      difficulty: request.difficulty,
      correct_answer:
        request.type === 'true_false'
          ? 'true'
          : request.type === 'multiple_choice'
            ? ['1']
            : 'Unable to parse',
      explanation: `AI response parsing failed: ${errorMessage}`,
      points: this.getDefaultPoints(request.difficulty),
      category: request.subject || request.topic,
      tags: [request.topic, 'ai-parse-error'],
      ai_metadata: {
        ...aiMetadata,
        parse_error: true,
        error_message: errorMessage,
        raw_content: content,
      },
    }

    // Add fallback options for multiple choice or null for true/false
    if (request.type === 'multiple_choice') {
      fallbackQuestion.options = [
        { id: '1', text: 'Unable to parse option A', isCorrect: true },
        { id: '2', text: 'Unable to parse option B', isCorrect: false },
        { id: '3', text: 'Unable to parse option C', isCorrect: false },
        { id: '4', text: 'Unable to parse option D', isCorrect: false },
      ]
    } else if (request.type === 'true_false') {
      fallbackQuestion.options = null
    }

    return [fallbackQuestion]
  }

  async generateQuestionSet(
    topic: string,
    specifications: {
      easy: number
      medium: number
      hard: number
      types: QuestionType[]
      subject?: string
      context?: string
    }
  ): Promise<QuestionGenerationResult[]> {
    const results: QuestionGenerationResult[] = []

    // Generate questions for each difficulty level
    for (const [difficulty, count] of Object.entries(specifications) as [
      QuestionDifficulty,
      number,
    ][]) {
      if (
        difficulty === 'easy' ||
        difficulty === 'medium' ||
        difficulty === 'hard'
      ) {
        if (count > 0) {
          // Distribute questions across different types
          const typesPerDifficulty = Math.ceil(
            count / specifications.types.length
          )

          for (const type of specifications.types) {
            const request: QuestionGenerationRequest = {
              topic,
              subject: specifications.subject,
              type,
              difficulty,
              count: Math.min(typesPerDifficulty, count),
              context: specifications.context,
            }

            const result = await this.generateQuestions(request)
            results.push(result)
          }
        }
      }
    }

    return results
  }

  /**
   * Generate a complete exam with mixed question types and difficulties
   */
  async generateCompleteExam(request: {
    topic: string
    subject?: string
    totalQuestions: number
    duration?: number
    questionTypes: {
      multiple_choice: number // percentage
      true_false: number // percentage
    }
    difficulty: {
      easy: number // percentage
      medium: number // percentage
      hard: number // percentage
    }
    context?: string
    learningObjectives?: string[]
  }): Promise<{
    success: boolean
    examData?: {
      title: string
      description: string
      duration: number
      questions: GeneratedQuestion[]
    }
    metadata?: {
      model_used: string
      generation_time: number
      total_questions: number
    }
    error?: string
  }> {
    const startTime = Date.now()

    try {
      // Calculate question counts for each type and difficulty
      const mcCount = Math.round(
        (request.totalQuestions * request.questionTypes.multiple_choice) / 100
      )
      const tfCount = request.totalQuestions - mcCount

      const _easyCount = Math.round(
        (request.totalQuestions * request.difficulty.easy) / 100
      )
      const _mediumCount = Math.round(
        (request.totalQuestions * request.difficulty.medium) / 100
      )
      const _hardCount = request.totalQuestions - _easyCount - _mediumCount

      // Generate questions by type and difficulty
      const allQuestions: GeneratedQuestion[] = []
      let _totalTokens = 0

      // Multiple Choice questions by difficulty
      if (mcCount > 0) {
        const mcEasy = Math.round((mcCount * request.difficulty.easy) / 100)
        const mcMedium = Math.round((mcCount * request.difficulty.medium) / 100)
        const mcHard = mcCount - mcEasy - mcMedium

        for (const [diff, count] of [
          ['easy', mcEasy],
          ['medium', mcMedium],
          ['hard', mcHard],
        ] as [QuestionDifficulty, number][]) {
          if (count > 0) {
            const result = await this.generateQuestions({
              topic: request.topic,
              subject: request.subject,
              type: 'multiple_choice',
              difficulty: diff,
              count,
              context: request.context,
              learningObjectives: request.learningObjectives,
            })

            if (result.success) {
              allQuestions.push(...result.questions)
              _totalTokens += result.metadata.total_tokens || 0
            }
          }
        }
      }

      // True/False questions by difficulty
      if (tfCount > 0) {
        const tfEasy = Math.round((tfCount * request.difficulty.easy) / 100)
        const tfMedium = Math.round((tfCount * request.difficulty.medium) / 100)
        const tfHard = tfCount - tfEasy - tfMedium

        for (const [diff, count] of [
          ['easy', tfEasy],
          ['medium', tfMedium],
          ['hard', tfHard],
        ] as [QuestionDifficulty, number][]) {
          if (count > 0) {
            const result = await this.generateQuestions({
              topic: request.topic,
              subject: request.subject,
              type: 'true_false',
              difficulty: diff,
              count,
              context: request.context,
              learningObjectives: request.learningObjectives,
            })

            if (result.success) {
              allQuestions.push(...result.questions)
              _totalTokens += result.metadata.total_tokens || 0
            }
          }
        }
      }

      // Shuffle questions for variety
      const shuffledQuestions = this.shuffleArray(allQuestions)

      // Generate exam metadata
      const examTitle = `${request.topic} Exam${request.subject ? ` - ${request.subject}` : ''}`
      const examDescription = this.generateExamDescription(request)

      return {
        success: true,
        examData: {
          title: examTitle,
          description: examDescription,
          duration:
            request.duration ||
            this.estimateExamDuration(
              request.totalQuestions,
              request.questionTypes
            ),
          questions: shuffledQuestions,
        },
        metadata: {
          model_used: 'gpt-4o-mini',
          generation_time: Date.now() - startTime,
          total_questions: shuffledQuestions.length,
        },
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
        metadata: {
          model_used: 'gpt-4o-mini',
          generation_time: Date.now() - startTime,
          total_questions: 0,
        },
      }
    }
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  private generateExamDescription(request: {
    topic: string
    subject?: string
    totalQuestions: number
    context?: string
    learningObjectives?: string[]
  }): string {
    let description = `This exam covers ${request.topic}`

    if (request.subject) {
      description += ` in ${request.subject}`
    }

    description += `. The exam contains ${request.totalQuestions} questions designed to assess your understanding of the material.`

    if (request.context) {
      description += ` ${request.context}`
    }

    if (request.learningObjectives && request.learningObjectives.length > 0) {
      description += ` Learning objectives include: ${request.learningObjectives.join(', ')}.`
    }

    return description
  }

  private estimateExamDuration(
    totalQuestions: number,
    questionTypes: { multiple_choice: number; true_false: number }
  ): number {
    // Estimate time per question type (in minutes)
    const mcTime =
      ((totalQuestions * questionTypes.multiple_choice) / 100) * 1.5
    const tfTime = ((totalQuestions * questionTypes.true_false) / 100) * 0.5

    // Add buffer time (20% extra)
    const totalTime = Math.ceil((mcTime + tfTime) * 1.2)

    // Minimum 10 minutes, maximum 480 minutes (8 hours)
    return Math.max(10, Math.min(480, totalTime))
  }
}

// Singleton instance
let questionGenerator: AIQuestionGenerator | null = null

export function getQuestionGenerator(): AIQuestionGenerator {
  if (!questionGenerator) {
    questionGenerator = new AIQuestionGenerator()
  }
  return questionGenerator
}

export default AIQuestionGenerator
