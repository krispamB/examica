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
  options?: string[]
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
  options?: string[] // For multiple choice
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
    ${request.type === 'multiple_choice' ? '"options": ["Option A", "Option B", "Option C", "Option D"],' : ''}
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
        return '"A"' // Index or letter of correct option
      case 'true_false':
        return 'true' // Boolean value
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

      return parsedQuestions.map((q: ParsedQuestionFromAI, index: number) => ({
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
      }))
    } catch (error) {
      console.error('Failed to parse AI response:', error)
      console.log('Raw content:', content)

      // Fallback: create a basic question if parsing fails
      return [
        {
          title: `Generated ${request.type} Question`,
          content: content.slice(0, 500) + (content.length > 500 ? '...' : ''),
          type: request.type,
          difficulty: request.difficulty,
          correct_answer: 'Unable to parse',
          explanation: 'AI response could not be parsed properly',
          points: this.getDefaultPoints(request.difficulty),
          category: request.subject || request.topic,
          tags: [request.topic, 'ai-parse-error'],
          ai_metadata: {
            ...aiMetadata,
            parse_error: true,
            raw_content: content,
          },
        },
      ]
    }
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
