'use client'

import ExamBuilder from '@/components/examiner/ExamBuilder'

interface CreateExamClientProps {
  userId: string
}

const CreateExamClient: React.FC<CreateExamClientProps> = ({
  userId: _userId,
}) => {
  return <ExamBuilder />
}

export default CreateExamClient
