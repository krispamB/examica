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
      exams: {
        Row: {
          id: string
          title: string
          description: string | null
          status: 'draft' | 'active' | 'archived'
          duration: number | null
          requires_verification: boolean | null
          created_at: string | null
          updated_at: string | null
          created_by: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          status?: 'draft' | 'active' | 'archived'
          duration?: number | null
          requires_verification?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          created_by: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          status?: 'draft' | 'active' | 'archived'
          duration?: number | null
          requires_verification?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          id: string
          title: string
          content: string
          type: 'multiple_choice' | 'true_false' | 'essay' | 'fill_blank' | 'matching'
          difficulty: 'easy' | 'medium' | 'hard'
          category: string | null
          tags: string[] | null
          options: Json | null
          correct_answer: Json | null
          explanation: string | null
          points: number | null
          ai_generated: boolean | null
          ai_metadata: Json | null
          created_by: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          content: string
          type: 'multiple_choice' | 'true_false' | 'essay' | 'fill_blank' | 'matching'
          difficulty?: 'easy' | 'medium' | 'hard'
          category?: string | null
          tags?: string[] | null
          options?: Json | null
          correct_answer?: Json | null
          explanation?: string | null
          points?: number | null
          ai_generated?: boolean | null
          ai_metadata?: Json | null
          created_by: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          content?: string
          type?: 'multiple_choice' | 'true_false' | 'essay' | 'fill_blank' | 'matching'
          difficulty?: 'easy' | 'medium' | 'hard'
          category?: string | null
          tags?: string[] | null
          options?: Json | null
          correct_answer?: Json | null
          explanation?: string | null
          points?: number | null
          ai_generated?: boolean | null
          ai_metadata?: Json | null
          created_by?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      exam_questions: {
        Row: {
          id: string
          exam_id: string
          question_id: string
          order_index: number
          points: number | null
          required: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          exam_id: string
          question_id: string
          order_index: number
          points?: number | null
          required?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          exam_id?: string
          question_id?: string
          order_index?: number
          points?: number | null
          required?: boolean | null
          created_at?: string | null
        }
        Relationships: []
      }
      exam_results: {
        Row: {
          id: string
          session_id: string
          user_id: string
          exam_id: string
          total_score: number | null
          max_score: number | null
          percentage: number | null
          status: 'in_progress' | 'completed' | 'graded'
          started_at: string | null
          completed_at: string | null
          graded_at: string | null
          graded_by: string | null
          feedback: string | null
          metadata: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          session_id: string
          user_id: string
          exam_id: string
          total_score?: number | null
          max_score?: number | null
          percentage?: number | null
          status?: 'in_progress' | 'completed' | 'graded'
          started_at?: string | null
          completed_at?: string | null
          graded_at?: string | null
          graded_by?: string | null
          feedback?: string | null
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          session_id?: string
          user_id?: string
          exam_id?: string
          total_score?: number | null
          max_score?: number | null
          percentage?: number | null
          status?: 'in_progress' | 'completed' | 'graded'
          started_at?: string | null
          completed_at?: string | null
          graded_at?: string | null
          graded_by?: string | null
          feedback?: string | null
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      question_responses: {
        Row: {
          id: string
          session_id: string
          question_id: string
          user_id: string
          response: Json | null
          is_correct: boolean | null
          points_earned: number | null
          time_spent: number | null
          attempts: number | null
          flagged: boolean | null
          flag_reason: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          session_id: string
          question_id: string
          user_id: string
          response?: Json | null
          is_correct?: boolean | null
          points_earned?: number | null
          time_spent?: number | null
          attempts?: number | null
          flagged?: boolean | null
          flag_reason?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          session_id?: string
          question_id?: string
          user_id?: string
          response?: Json | null
          is_correct?: boolean | null
          points_earned?: number | null
          time_spent?: number | null
          attempts?: number | null
          flagged?: boolean | null
          flag_reason?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      exam_sessions: {
        Row: {
          id: string
          user_id: string
          exam_id: string
          status: 'in_progress' | 'completed' | 'abandoned'
          started_at: string | null
          completed_at: string | null
          verification_status: 'verified' | 'unverified' | 'failed' | null
          verification_time: string | null
          browser_info: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          exam_id: string
          status?: 'in_progress' | 'completed' | 'abandoned'
          started_at?: string | null
          completed_at?: string | null
          verification_status?: 'verified' | 'unverified' | 'failed' | null
          verification_time?: string | null
          browser_info?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          exam_id?: string
          status?: 'in_progress' | 'completed' | 'abandoned'
          started_at?: string | null
          completed_at?: string | null
          verification_status?: 'verified' | 'unverified' | 'failed' | null
          verification_time?: string | null
          browser_info?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
          face_image_uploaded_at: string | null
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
          face_image_uploaded_at?: string | null
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
          face_image_uploaded_at?: string | null
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
      get_invitation_by_token: {
        Args: { token: string }
        Returns: {
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: Database['public']['Enums']['user_role']
          status: Database['public']['Enums']['invitation_status']
          user_metadata: Json
        }[]
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
