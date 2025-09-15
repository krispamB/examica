/**
 * Answer Hash Utility
 *
 * Provides secure hashing and validation for exam answers to prevent
 * client-side tampering while maintaining privacy of correct answers.
 */

import { createHash, randomBytes } from 'crypto'

export interface HashedAnswer {
  hash: string
  salt: string
  algorithm: string
  timestamp: number
}

export interface AnswerValidation {
  isValid: boolean
  tampered: boolean
  reason?: string | undefined
}

export interface SecureAnswerData {
  questionId: string
  hashedCorrectAnswer: string
  salt: string
  options?: unknown[] | undefined
  validation: {
    algorithm: string
    created: number
    version: string
  }
}

class AnswerHashService {
  private readonly DEFAULT_ALGORITHM = 'sha256'
  private readonly HASH_VERSION = '1.0'
  private readonly SALT_LENGTH = 16

  /**
   * Create a secure hash of an answer for client-side integrity checking
   */
  hashAnswer(
    answer: unknown,
    salt?: string,
    algorithm: string = this.DEFAULT_ALGORITHM
  ): HashedAnswer {
    const answerSalt = salt || this.generateSalt()
    const normalizedAnswer = this.normalizeAnswer(answer)

    const hash = createHash(algorithm)
      .update(normalizedAnswer + answerSalt)
      .digest('hex')

    return {
      hash,
      salt: answerSalt,
      algorithm,
      timestamp: Date.now(),
    }
  }

  /**
   * Validate an answer hash for integrity checking
   */
  validateAnswerHash(
    answer: unknown,
    hashedAnswer: HashedAnswer
  ): AnswerValidation {
    try {
      if (!hashedAnswer.hash || !hashedAnswer.salt || !hashedAnswer.algorithm) {
        return {
          isValid: false,
          tampered: true,
          reason: 'Invalid hash structure',
        }
      }

      const expectedHash = this.hashAnswer(
        answer,
        hashedAnswer.salt,
        hashedAnswer.algorithm
      )

      const isValid = expectedHash.hash === hashedAnswer.hash

      return {
        isValid,
        tampered: !isValid,
        reason: isValid
          ? undefined
          : 'Hash mismatch - answer may have been tampered with',
      }
    } catch (error) {
      return {
        isValid: false,
        tampered: true,
        reason: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }
    }
  }

  /**
   * Create secure answer data for server-side storage (without exposing correct answers)
   */
  createSecureAnswerData(
    questionId: string,
    correctAnswer: unknown,
    options?: unknown[]
  ): SecureAnswerData {
    const salt = this.generateSalt()
    const hashedCorrectAnswer = this.hashAnswer(correctAnswer, salt)

    return {
      questionId,
      hashedCorrectAnswer: hashedCorrectAnswer.hash,
      salt,
      options: options ? this.sanitizeOptions(options) : undefined,
      validation: {
        algorithm: hashedCorrectAnswer.algorithm,
        created: Date.now(),
        version: this.HASH_VERSION,
      },
    }
  }

  /**
   * Validate a student's answer against secure server data
   */
  validateStudentAnswer(
    studentAnswer: unknown,
    secureAnswerData: SecureAnswerData
  ): {
    isCorrect: boolean
    confidence: number
    metadata: {
      algorithm: string
      version: string
      validated: number
    }
  } {
    try {
      const studentHash = this.hashAnswer(
        studentAnswer,
        secureAnswerData.salt,
        secureAnswerData.validation.algorithm
      )

      const isCorrect =
        studentHash.hash === secureAnswerData.hashedCorrectAnswer

      return {
        isCorrect,
        confidence: isCorrect ? 1.0 : 0.0,
        metadata: {
          algorithm: secureAnswerData.validation.algorithm,
          version: secureAnswerData.validation.version,
          validated: Date.now(),
        },
      }
    } catch {
      return {
        isCorrect: false,
        confidence: 0.0,
        metadata: {
          algorithm: 'error',
          version: this.HASH_VERSION,
          validated: Date.now(),
        },
      }
    }
  }

  /**
   * Create multiple choice verification hashes (for option-based questions)
   */
  createMultipleChoiceHashes(
    options: Array<{ id: string; text: string; isCorrect: boolean }>,
    questionSalt?: string
  ): {
    questionSalt: string
    optionHashes: Array<{
      optionId: string
      hash: string
      isCorrect: boolean
    }>
  } {
    const salt = questionSalt || this.generateSalt()

    const optionHashes = options.map((option) => ({
      optionId: option.id,
      hash: this.hashAnswer(option.id, salt).hash,
      isCorrect: option.isCorrect,
    }))

    return {
      questionSalt: salt,
      optionHashes,
    }
  }

  /**
   * Validate multiple choice answer using option hashes
   */
  validateMultipleChoiceAnswer(
    selectedOptionIds: string[],
    questionSalt: string,
    optionHashes: Array<{ optionId: string; hash: string; isCorrect: boolean }>
  ): {
    isCorrect: boolean
    correctOptionIds: string[]
    selectedCorrect: number
    selectedIncorrect: number
  } {
    const correctOptions = optionHashes.filter((oh) => oh.isCorrect)
    const correctOptionIds = correctOptions.map((co) => co.optionId)

    // Validate selected option hashes
    const validSelections = selectedOptionIds.filter((optionId) => {
      const expectedHash = this.hashAnswer(optionId, questionSalt).hash
      return optionHashes.some(
        (oh) => oh.optionId === optionId && oh.hash === expectedHash
      )
    })

    const selectedCorrect = validSelections.filter((id) =>
      correctOptionIds.includes(id)
    ).length

    const selectedIncorrect = validSelections.length - selectedCorrect

    // Check if all correct options are selected and no incorrect ones
    const isCorrect =
      selectedCorrect === correctOptionIds.length && selectedIncorrect === 0

    return {
      isCorrect,
      correctOptionIds,
      selectedCorrect,
      selectedIncorrect,
    }
  }

  /**
   * Generate session-specific answer token for additional security
   */
  generateSessionToken(
    sessionId: string,
    userId: string,
    examId: string
  ): string {
    const sessionData = `${sessionId}:${userId}:${examId}:${Date.now()}`
    const token = createHash(this.DEFAULT_ALGORITHM)
      .update(sessionData)
      .digest('hex')

    return token.substring(0, 32) // Return first 32 characters
  }

  /**
   * Validate session token
   */
  validateSessionToken(
    token: string,
    _sessionId: string,
    _userId: string,
    _examId: string,
    _maxAge: number = 24 * 60 * 60 * 1000 // 24 hours
  ): boolean {
    try {
      // In a real implementation, you'd store the token with timestamp
      // For now, this is a basic structure validation
      return token.length === 32 && /^[a-f0-9]+$/.test(token)
    } catch {
      return false
    }
  }

  /**
   * Create integrity fingerprint for answer submission
   */
  createAnswerFingerprint(answers: Record<string, unknown>): {
    fingerprint: string
    checksum: string
    itemCount: number
    created: number
  } {
    const sortedAnswers = Object.keys(answers)
      .sort()
      .map((key) => `${key}:${this.normalizeAnswer(answers[key])}`)
      .join('|')

    const fingerprint = createHash(this.DEFAULT_ALGORITHM)
      .update(sortedAnswers)
      .digest('hex')

    const checksum = createHash('md5')
      .update(fingerprint)
      .digest('hex')
      .substring(0, 8)

    return {
      fingerprint,
      checksum,
      itemCount: Object.keys(answers).length,
      created: Date.now(),
    }
  }

  /**
   * Validate answer submission fingerprint
   */
  validateAnswerFingerprint(
    answers: Record<string, unknown>,
    expectedFingerprint: string
  ): boolean {
    const current = this.createAnswerFingerprint(answers)
    return current.fingerprint === expectedFingerprint
  }

  /**
   * Normalize answer for consistent hashing
   */
  private normalizeAnswer(answer: unknown): string {
    if (answer === null || answer === undefined) {
      return ''
    }

    if (typeof answer === 'string') {
      return answer.trim().toLowerCase()
    }

    if (typeof answer === 'boolean' || typeof answer === 'number') {
      return String(answer)
    }

    if (Array.isArray(answer)) {
      return answer
        .map((item) => this.normalizeAnswer(item))
        .sort()
        .join(',')
    }

    if (typeof answer === 'object') {
      const sorted = Object.keys(answer)
        .sort()
        .map(
          (key) =>
            `${key}:${this.normalizeAnswer((answer as Record<string, unknown>)[key])}`
        )
        .join(',')
      return sorted
    }

    return String(answer).trim().toLowerCase()
  }

  /**
   * Generate cryptographically secure salt
   */
  private generateSalt(): string {
    return randomBytes(this.SALT_LENGTH).toString('hex')
  }

  /**
   * Sanitize options to remove correct answer information
   */
  private sanitizeOptions(options: unknown[]): unknown[] {
    return options.map((option) => {
      if (typeof option === 'object' && option !== null) {
        // Remove 'isCorrect' field if present
        const { isCorrect: _isCorrect, ...sanitized } = option as Record<
          string,
          unknown
        >
        return sanitized
      }
      return option
    })
  }

  /**
   * Create answer verification challenge (for additional security)
   */
  createVerificationChallenge(): {
    challenge: string
    solution: string
    expires: number
  } {
    const challenge = randomBytes(8).toString('hex')
    const solution = createHash('sha1')
      .update(challenge)
      .digest('hex')
      .substring(0, 8)

    return {
      challenge,
      solution,
      expires: Date.now() + 5 * 60 * 1000, // 5 minutes
    }
  }

  /**
   * Solve verification challenge
   */
  solveChallenge(challenge: string): string {
    return createHash('sha1').update(challenge).digest('hex').substring(0, 8)
  }

  /**
   * Validate challenge solution
   */
  validateChallengeSolution(
    challenge: string,
    solution: string,
    expires: number
  ): boolean {
    if (Date.now() > expires) {
      return false
    }

    const expectedSolution = this.solveChallenge(challenge)
    return expectedSolution === solution
  }
}

// Singleton instance
export const answerHashService = new AnswerHashService()
export default answerHashService

// Utility functions
export function hashAnswer(answer: unknown, salt?: string): HashedAnswer {
  return answerHashService.hashAnswer(answer, salt)
}

export function validateAnswerHash(
  answer: unknown,
  hashedAnswer: HashedAnswer
): AnswerValidation {
  return answerHashService.validateAnswerHash(answer, hashedAnswer)
}

export function createAnswerFingerprint(answers: Record<string, unknown>) {
  return answerHashService.createAnswerFingerprint(answers)
}
