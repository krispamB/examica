export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '13.0.4'
  }
  public: {
    Tables: {
      exam_questions: {
        Row: {
          created_at: string | null
          exam_id: string | null
          id: string
          order_index: number
          points: number | null
          question_id: string | null
          required: boolean | null
        }
        Insert: {
          created_at?: string | null
          exam_id?: string | null
          id?: string
          order_index: number
          points?: number | null
          question_id?: string | null
          required?: boolean | null
        }
        Update: {
          created_at?: string | null
          exam_id?: string | null
          id?: string
          order_index?: number
          points?: number | null
          question_id?: string | null
          required?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: 'exam_questions_exam_id_fkey'
            columns: ['exam_id']
            isOneToOne: false
            referencedRelation: 'exams'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'exam_questions_question_id_fkey'
            columns: ['question_id']
            isOneToOne: false
            referencedRelation: 'questions'
            referencedColumns: ['id']
          },
        ]
      }
      exam_results: {
        Row: {
          completed_at: string | null
          correct_answers: number | null
          created_at: string | null
          exam_id: string | null
          feedback: string | null
          graded_at: string | null
          graded_by: string | null
          grader_notes: string | null
          id: string
          max_possible_score: number | null
          metadata: Json | null
          percentage_score: number | null
          requires_manual_grading: boolean | null
          session_id: string | null
          started_at: string | null
          status: string | null
          submitted_at: string | null
          time_spent: number | null
          total_questions: number | null
          total_score: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          correct_answers?: number | null
          created_at?: string | null
          exam_id?: string | null
          feedback?: string | null
          graded_at?: string | null
          graded_by?: string | null
          grader_notes?: string | null
          id?: string
          max_possible_score?: number | null
          metadata?: Json | null
          percentage_score?: number | null
          requires_manual_grading?: boolean | null
          session_id?: string | null
          started_at?: string | null
          status?: string | null
          submitted_at?: string | null
          time_spent?: number | null
          total_questions?: number | null
          total_score?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          correct_answers?: number | null
          created_at?: string | null
          exam_id?: string | null
          feedback?: string | null
          graded_at?: string | null
          graded_by?: string | null
          grader_notes?: string | null
          id?: string
          max_possible_score?: number | null
          metadata?: Json | null
          percentage_score?: number | null
          requires_manual_grading?: boolean | null
          session_id?: string | null
          started_at?: string | null
          status?: string | null
          submitted_at?: string | null
          time_spent?: number | null
          total_questions?: number | null
          total_score?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'exam_results_exam_id_fkey'
            columns: ['exam_id']
            isOneToOne: false
            referencedRelation: 'exams'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'exam_results_session_id_fkey'
            columns: ['session_id']
            isOneToOne: true
            referencedRelation: 'exam_sessions'
            referencedColumns: ['id']
          },
        ]
      }
      exam_sessions: {
        Row: {
          answers: Json | null
          completed_at: string | null
          created_at: string | null
          current_question_index: number | null
          exam_id: string | null
          id: string
          metadata: Json | null
          started_at: string | null
          status: string | null
          time_remaining: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          answers?: Json | null
          completed_at?: string | null
          created_at?: string | null
          current_question_index?: number | null
          exam_id?: string | null
          id?: string
          metadata?: Json | null
          started_at?: string | null
          status?: string | null
          time_remaining?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          answers?: Json | null
          completed_at?: string | null
          created_at?: string | null
          current_question_index?: number | null
          exam_id?: string | null
          id?: string
          metadata?: Json | null
          started_at?: string | null
          status?: string | null
          time_remaining?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'exam_sessions_exam_id_fkey'
            columns: ['exam_id']
            isOneToOne: false
            referencedRelation: 'exams'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'exam_sessions_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'user_profiles'
            referencedColumns: ['id']
          },
        ]
      }
      exams: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          duration: number | null
          id: string
          instructions: string | null
          max_attempts: number | null
          metadata: Json | null
          pass_threshold: number | null
          requires_verification: boolean
          show_results: boolean | null
          shuffle_questions: boolean | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          duration?: number | null
          id?: string
          instructions?: string | null
          max_attempts?: number | null
          metadata?: Json | null
          pass_threshold?: number | null
          requires_verification?: boolean
          show_results?: boolean | null
          shuffle_questions?: boolean | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          duration?: number | null
          id?: string
          instructions?: string | null
          max_attempts?: number | null
          metadata?: Json | null
          pass_threshold?: number | null
          requires_verification?: boolean
          show_results?: boolean | null
          shuffle_questions?: boolean | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'exams_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'user_profiles'
            referencedColumns: ['id']
          },
        ]
      }
      facial_verifications: {
        Row: {
          aws_face_id: string
          confidence_score: number | null
          created_at: string | null
          enrollment_date: string | null
          id: string
          is_active: boolean | null
          updated_at: string | null
          user_id: string
          verification_attempts: Json | null
        }
        Insert: {
          aws_face_id: string
          confidence_score?: number | null
          created_at?: string | null
          enrollment_date?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          user_id: string
          verification_attempts?: Json | null
        }
        Update: {
          aws_face_id?: string
          confidence_score?: number | null
          created_at?: string | null
          enrollment_date?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          user_id?: string
          verification_attempts?: Json | null
        }
        Relationships: []
      }
      question_responses: {
        Row: {
          attempts: number | null
          created_at: string | null
          flag_reason: string | null
          flagged: boolean | null
          id: string
          is_correct: boolean | null
          points_earned: number | null
          question_id: string | null
          response: Json | null
          session_id: string | null
          time_spent: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          attempts?: number | null
          created_at?: string | null
          flag_reason?: string | null
          flagged?: boolean | null
          id?: string
          is_correct?: boolean | null
          points_earned?: number | null
          question_id?: string | null
          response?: Json | null
          session_id?: string | null
          time_spent?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          attempts?: number | null
          created_at?: string | null
          flag_reason?: string | null
          flagged?: boolean | null
          id?: string
          is_correct?: boolean | null
          points_earned?: number | null
          question_id?: string | null
          response?: Json | null
          session_id?: string | null
          time_spent?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'question_responses_question_id_fkey'
            columns: ['question_id']
            isOneToOne: false
            referencedRelation: 'questions'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'question_responses_session_id_fkey'
            columns: ['session_id']
            isOneToOne: false
            referencedRelation: 'exam_sessions'
            referencedColumns: ['id']
          },
        ]
      }
      questions: {
        Row: {
          ai_generated: boolean | null
          ai_metadata: Json | null
          category: string | null
          content: string
          correct_answer: Json | null
          created_at: string | null
          created_by: string | null
          difficulty: string | null
          explanation: string | null
          id: string
          options: Json | null
          points: number | null
          tags: string[] | null
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          ai_generated?: boolean | null
          ai_metadata?: Json | null
          category?: string | null
          content: string
          correct_answer?: Json | null
          created_at?: string | null
          created_by?: string | null
          difficulty?: string | null
          explanation?: string | null
          id?: string
          options?: Json | null
          points?: number | null
          tags?: string[] | null
          title: string
          type: string
          updated_at?: string | null
        }
        Update: {
          ai_generated?: boolean | null
          ai_metadata?: Json | null
          category?: string | null
          content?: string
          correct_answer?: Json | null
          created_at?: string | null
          created_by?: string | null
          difficulty?: string | null
          explanation?: string | null
          id?: string
          options?: Json | null
          points?: number | null
          tags?: string[] | null
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'questions_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'user_profiles'
            referencedColumns: ['id']
          },
        ]
      }
      user_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          email: string
          expires_at: string
          id: string
          institution_id: string | null
          invitation_token: string
          invited_by: string
          role: Database['public']['Enums']['user_role']
          status: Database['public']['Enums']['invitation_status']
          updated_at: string | null
          user_metadata: Json | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          email: string
          expires_at?: string
          id?: string
          institution_id?: string | null
          invitation_token: string
          invited_by: string
          role?: Database['public']['Enums']['user_role']
          status?: Database['public']['Enums']['invitation_status']
          updated_at?: string | null
          user_metadata?: Json | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          institution_id?: string | null
          invitation_token?: string
          invited_by?: string
          role?: Database['public']['Enums']['user_role']
          status?: Database['public']['Enums']['invitation_status']
          updated_at?: string | null
          user_metadata?: Json | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          face_image_url: string | null
          first_name: string
          id: string
          institution_id: string | null
          invitation_accepted_at: string | null
          invited_by: string | null
          last_name: string
          metadata: Json | null
          phone: string | null
          role: Database['public']['Enums']['user_role']
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          face_image_url?: string | null
          first_name: string
          id: string
          institution_id?: string | null
          invitation_accepted_at?: string | null
          invited_by?: string | null
          last_name: string
          metadata?: Json | null
          phone?: string | null
          role?: Database['public']['Enums']['user_role']
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          face_image_url?: string | null
          first_name?: string
          id?: string
          institution_id?: string | null
          invitation_accepted_at?: string | null
          invited_by?: string | null
          last_name?: string
          metadata?: Json | null
          phone?: string | null
          role?: Database['public']['Enums']['user_role']
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_admin_profile: {
        Args: { user_id: string }
        Returns: string
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: Database['public']['Enums']['user_role']
      }
    }
    Enums: {
      exam_status: 'draft' | 'published' | 'active' | 'completed' | 'cancelled'
      invitation_status: 'pending' | 'accepted' | 'expired' | 'cancelled'
      question_type:
        | 'multiple_choice'
        | 'true_false'
        | 'essay'
        | 'fill_blank'
        | 'matching'
      session_status:
        | 'active'
        | 'paused'
        | 'submitted'
        | 'flagged'
        | 'terminated'
      user_role: 'admin' | 'examiner' | 'student'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      exam_status: ['draft', 'published', 'active', 'completed', 'cancelled'],
      invitation_status: ['pending', 'accepted', 'expired', 'cancelled'],
      question_type: [
        'multiple_choice',
        'true_false',
        'essay',
        'fill_blank',
        'matching',
      ],
      session_status: [
        'active',
        'paused',
        'submitted',
        'flagged',
        'terminated',
      ],
      user_role: ['admin', 'examiner', 'student'],
    },
  },
} as const
