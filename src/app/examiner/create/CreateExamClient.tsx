'use client'

import { useRouter } from 'next/navigation'
import ExamBuilder from '@/components/examiner/ExamBuilder'

interface CreateExamClientProps {
  userId: string
}

const CreateExamClient: React.FC<CreateExamClientProps> = ({ userId }) => {
  const router = useRouter()

  const handleExamCreated = (examId: string) => {
    router.push(`/examiner/exams/${examId}/edit`)
  }

  return (
    <ExamBuilder 
      mode="create" 
      userId={userId}
      onExamCreated={handleExamCreated}
    />
  )
}

export default CreateExamClient