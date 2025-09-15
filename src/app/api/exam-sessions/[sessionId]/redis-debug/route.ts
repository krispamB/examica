import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getExamStorage } from '@/lib/redis/exam-storage'
import { getRedisClient } from '@/lib/redis/client'

interface Context {
  params: Promise<{
    sessionId: string
  }>
}

// GET /api/exam-sessions/[sessionId]/redis-debug - Debug Redis session data
export async function GET(request: NextRequest, context: Context) {
  try {
    const { sessionId } = await context.params
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify session ownership
    const { data: session, error: sessionError } = await supabase
      .from('exam_sessions')
      .select('id, user_id, exam_id, status, created_at')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found or access denied' },
        { status: 404 }
      )
    }

    const examStorage = getExamStorage()
    const redis = getRedisClient()
    const sessionKey = `session:${sessionId}`

    // Check if Redis session exists
    const sessionExists = await examStorage.sessionExists(sessionId)

    // Get session metadata from Redis
    const metadata = await examStorage.getSessionMetadata(sessionId)

    // Get all answers from Redis
    const answersResult = await examStorage.getAllAnswers(sessionId)

    // Get answer count
    const countResult = await examStorage.getAnswerCount(sessionId)

    // Get TTL
    const ttlResult = await examStorage.getSessionTTL(sessionId)

    // Get raw Redis data for debugging
    let rawRedisData = {}
    let redisKeys = []

    try {
      // Get all fields in the hash
      rawRedisData = await redis.hgetall(sessionKey)

      // Get all Redis keys matching pattern
      redisKeys = await redis.keys(`session:${sessionId}*`)
    } catch (redisError) {
      console.error('Redis debug error:', redisError)
    }

    const debugInfo = {
      sessionId,
      databaseSession: {
        id: session.id,
        user_id: session.user_id,
        exam_id: session.exam_id,
        status: session.status,
        created_at: session.created_at,
      },
      redis: {
        sessionExists: sessionExists.exists,
        sessionKey,
        matchingKeys: redisKeys,
        metadata: metadata.success
          ? metadata.metadata
          : { error: metadata.error },
        answerCount: countResult.success
          ? countResult.count
          : { error: countResult.error },
        ttl: ttlResult.success ? ttlResult.ttl : { error: ttlResult.error },
        answers: answersResult.success
          ? answersResult.answers
          : { error: answersResult.error },
        rawData: rawRedisData,
      },
      analysis: {
        sessionMismatch: !sessionExists.exists && session.status === 'active',
        hasAnswers:
          answersResult.success &&
          answersResult.answers &&
          Object.keys(answersResult.answers).length > 0,
        ttlActive: ttlResult.success && ttlResult.ttl && ttlResult.ttl > 0,
        metadataValid:
          metadata.success && metadata.metadata?.examId === session.exam_id,
      },
    }

    return NextResponse.json({
      success: true,
      debug: debugInfo,
    })
  } catch (error) {
    console.error('Redis debug API error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}

// POST /api/exam-sessions/[sessionId]/redis-debug - Initialize Redis session for debugging
export async function POST(request: NextRequest, context: Context) {
  try {
    const { sessionId } = await context.params
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get session details from database
    const { data: session, error: sessionError } = await supabase
      .from('exam_sessions')
      .select(
        `
        id, user_id, exam_id, status, created_at,
        exams!inner(
          id, title, time_limit_minutes
        )
      `
      )
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found or access denied' },
        { status: 404 }
      )
    }

    // Initialize Redis session manually
    const examStorage = getExamStorage()
    const timeLimit = session.exams.time_limit_minutes || 60

    const result = await examStorage.initExamSession(
      sessionId,
      session.exam_id,
      timeLimit
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to initialize Redis session' },
        { status: 500 }
      )
    }

    // Get debug info after initialization
    const debugResponse = await GET(request, context)

    return NextResponse.json({
      success: true,
      message: 'Redis session initialized for debugging',
      debug: JSON.parse(await debugResponse.text()),
    })
  } catch (error) {
    console.error('Redis debug init API error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
