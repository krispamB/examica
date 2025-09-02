import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createExamService } from '@/lib/exams/service'
import ExamClient from './ExamClient'

interface ExamPageProps {
  params: {
    examId: string
  }
}

export default async function ExamPage({ params }: ExamPageProps) {
  const { examId } = params
  
  try {
    // Create Supabase client
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      redirect('/login')
    }

    // Get user profile to check role
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile || userProfile.role !== 'student') {
      redirect('/dashboard')
    }

    // Get exam details
    const examService = createExamService()
    const examResult = await examService.getExam(examId)

    if (!examResult.success || !examResult.exam) {
      redirect('/student/exams')
    }

    const exam = examResult.exam

    // Check if exam is active
    if (exam.status !== 'active') {
      redirect('/student/exams')
    }

    return (
      <div className="min-h-screen bg-background-secondary">
        <ExamClient exam={exam} />
      </div>
    )

  } catch (error) {
    console.error('Exam page error:', error)
    redirect('/student/exams')
  }
}

export async function generateMetadata({ params }: ExamPageProps) {
  const { examId } = params
  
  try {
    const examService = createExamService()
    const examResult = await examService.getExam(examId)
    
    if (examResult.success && examResult.exam) {
      return {
        title: `${examResult.exam.title} - Examica`,
        description: examResult.exam.description || 'Take your exam',
      }
    }
  } catch (error) {
    console.error('Generate metadata error:', error)
  }
  
  return {
    title: 'Exam - Examica',
    description: 'Take your exam',
  }
}