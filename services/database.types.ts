// Generated from the isolated Supabase validation branch on 2026-08-28.
// Entries intentionally excluded: non-started call/backup and chat-media additions.
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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      abuse_reports: {
        Row: {
          assigned_to: string | null
          category: string
          conversation_id: string | null
          created_at: string
          description: string | null
          id: string
          message_id: string | null
          post_id: string | null
          reporter_id: string
          resolution: string | null
          status: string
          target_user_id: string | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          category: string
          conversation_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          message_id?: string | null
          post_id?: string | null
          reporter_id: string
          resolution?: string | null
          status?: string
          target_user_id?: string | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          category?: string
          conversation_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          message_id?: string | null
          post_id?: string | null
          reporter_id?: string
          resolution?: string | null
          status?: string
          target_user_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "abuse_reports_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "abuse_reports_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "abuse_reports_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "abuse_reports_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "abuse_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "abuse_reports_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          image_urls: string[] | null
          role: string
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          image_urls?: string[] | null
          role: string
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          image_urls?: string[] | null
          role?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "agent_chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_chat_sessions: {
        Row: {
          agent_id: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_chat_sessions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_chat_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      agents: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          description: string | null
          experience_years: number | null
          hourly_rate: number | null
          id: string
          is_active: boolean
          is_human: boolean
          name: string
          role: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          description?: string | null
          experience_years?: number | null
          hourly_rate?: number | null
          id: string
          is_active?: boolean
          is_human?: boolean
          name: string
          role: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          description?: string | null
          experience_years?: number | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean
          is_human?: boolean
          name?: string
          role?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json
          request_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json
          request_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json
          request_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      career_goals: {
        Row: {
          archetype: string | null
          created_at: string
          id: string
          is_active: boolean
          point_a: Json | null
          point_b: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          archetype?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          point_a?: Json | null
          point_b?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          archetype?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          point_a?: Json | null
          point_b?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "career_goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      career_opportunities: {
        Row: {
          created_at: string
          id: string
          is_favorite: boolean
          match_score: number | null
          organization: string | null
          raw: Json | null
          source: string | null
          status: string
          title: string
          universe: string | null
          updated_at: string
          user_id: string
          vault_status: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_favorite?: boolean
          match_score?: number | null
          organization?: string | null
          raw?: Json | null
          source?: string | null
          status?: string
          title: string
          universe?: string | null
          updated_at?: string
          user_id: string
          vault_status?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_favorite?: boolean
          match_score?: number | null
          organization?: string | null
          raw?: Json | null
          source?: string | null
          status?: string
          title?: string
          universe?: string | null
          updated_at?: string
          user_id?: string
          vault_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "career_opportunities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      career_opportunity_feedback: {
        Row: {
          created_at: string
          decline_reason: string | null
          feedback_type: string | null
          id: string
          notes: string | null
          opportunity_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          decline_reason?: string | null
          feedback_type?: string | null
          id?: string
          notes?: string | null
          opportunity_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          decline_reason?: string | null
          feedback_type?: string | null
          id?: string
          notes?: string | null
          opportunity_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "career_opportunity_feedback_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "career_opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "career_opportunity_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      career_search_missions: {
        Row: {
          created_at: string
          criteria: Json | null
          id: string
          is_active: boolean
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          criteria?: Json | null
          id?: string
          is_active?: boolean
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          criteria?: Json | null
          id?: string
          is_active?: boolean
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "career_search_missions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      career_snapshots: {
        Row: {
          generated_at: string
          id: string
          kind: string
          payload: Json
          user_id: string
        }
        Insert: {
          generated_at?: string
          id?: string
          kind: string
          payload: Json
          user_id: string
        }
        Update: {
          generated_at?: string
          id?: string
          kind?: string
          payload?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "career_snapshots_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          certificate_url: string | null
          course_id: string
          enrollment_id: string | null
          id: string
          issued_at: string
          user_id: string
        }
        Insert: {
          certificate_url?: string | null
          course_id: string
          enrollment_id?: string | null
          id?: string
          issued_at?: string
          user_id: string
        }
        Update: {
          certificate_url?: string | null
          course_id?: string
          enrollment_id?: string | null
          id?: string
          issued_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          likes_count: number
          parent_comment_id: string | null
          post_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          likes_count?: number
          parent_comment_id?: string | null
          post_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          likes_count?: number
          parent_comment_id?: string | null
          post_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          id: string
          is_muted: boolean
          is_pinned: boolean
          joined_at: string
          last_read_at: string | null
          member_role: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          is_muted?: boolean
          is_pinned?: boolean
          joined_at?: string
          last_read_at?: string | null
          member_role?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          is_muted?: boolean
          is_pinned?: boolean
          joined_at?: string
          last_read_at?: string | null
          member_role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          created_by: string
          direct_key: string | null
          id: string
          is_group: boolean
          last_message_at: string | null
          last_message_preview: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          direct_key?: string | null
          id?: string
          is_group?: boolean
          last_message_at?: string | null
          last_message_preview?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          direct_key?: string | null
          id?: string
          is_group?: boolean
          last_message_at?: string | null
          last_message_preview?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          academic_level: string | null
          category: string | null
          country_code: string | null
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          is_published: boolean
          thumbnail_url: string | null
          title: string
        }
        Insert: {
          academic_level?: string | null
          category?: string | null
          country_code?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_published?: boolean
          thumbnail_url?: string | null
          title: string
        }
        Update: {
          academic_level?: string | null
          category?: string | null
          country_code?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_published?: boolean
          thumbnail_url?: string | null
          title?: string
        }
        Relationships: []
      }
      document_shares: {
        Row: {
          created_at: string
          document_id: string
          id: string
          permission: string
          shared_with_user_id: string
        }
        Insert: {
          created_at?: string
          document_id: string
          id?: string
          permission?: string
          shared_with_user_id: string
        }
        Update: {
          created_at?: string
          document_id?: string
          id?: string
          permission?: string
          shared_with_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_shares_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_shares_shared_with_user_id_fkey"
            columns: ["shared_with_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          category: string | null
          created_at: string
          expiry_date: string | null
          file_size: number | null
          id: string
          is_verified: boolean
          mime_type: string | null
          name: string
          owner_id: string
          storage_path: string
          visibility: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          expiry_date?: string | null
          file_size?: number | null
          id?: string
          is_verified?: boolean
          mime_type?: string | null
          name: string
          owner_id: string
          storage_path: string
          visibility?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          expiry_date?: string | null
          file_size?: number | null
          id?: string
          is_verified?: boolean
          mime_type?: string | null
          name?: string
          owner_id?: string
          storage_path?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dossier_appointments: {
        Row: {
          created_at: string
          dossier_id: string
          id: string
          location: string | null
          notes: string | null
          scheduled_at: string
          title: string
        }
        Insert: {
          created_at?: string
          dossier_id: string
          id?: string
          location?: string | null
          notes?: string | null
          scheduled_at: string
          title: string
        }
        Update: {
          created_at?: string
          dossier_id?: string
          id?: string
          location?: string | null
          notes?: string | null
          scheduled_at?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "dossier_appointments_dossier_id_fkey"
            columns: ["dossier_id"]
            isOneToOne: false
            referencedRelation: "dossiers"
            referencedColumns: ["id"]
          },
        ]
      }
      dossier_deliverables: {
        Row: {
          created_at: string
          dossier_id: string
          id: string
          status: string
          title: string
        }
        Insert: {
          created_at?: string
          dossier_id: string
          id?: string
          status?: string
          title: string
        }
        Update: {
          created_at?: string
          dossier_id?: string
          id?: string
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "dossier_deliverables_dossier_id_fkey"
            columns: ["dossier_id"]
            isOneToOne: false
            referencedRelation: "dossiers"
            referencedColumns: ["id"]
          },
        ]
      }
      dossier_documents: {
        Row: {
          created_at: string
          dossier_id: string
          id: string
          name: string
          storage_path: string | null
          url: string | null
        }
        Insert: {
          created_at?: string
          dossier_id: string
          id?: string
          name: string
          storage_path?: string | null
          url?: string | null
        }
        Update: {
          created_at?: string
          dossier_id?: string
          id?: string
          name?: string
          storage_path?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dossier_documents_dossier_id_fkey"
            columns: ["dossier_id"]
            isOneToOne: false
            referencedRelation: "dossiers"
            referencedColumns: ["id"]
          },
        ]
      }
      dossier_shares: {
        Row: {
          created_at: string
          dossier_id: string
          id: string
          permission: string
          shared_with_user_id: string
        }
        Insert: {
          created_at?: string
          dossier_id: string
          id?: string
          permission?: string
          shared_with_user_id: string
        }
        Update: {
          created_at?: string
          dossier_id?: string
          id?: string
          permission?: string
          shared_with_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dossier_shares_dossier_id_fkey"
            columns: ["dossier_id"]
            isOneToOne: false
            referencedRelation: "dossiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dossier_shares_shared_with_user_id_fkey"
            columns: ["shared_with_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dossier_steps: {
        Row: {
          created_at: string
          dossier_id: string
          id: string
          position: number
          status: string
          title: string
        }
        Insert: {
          created_at?: string
          dossier_id: string
          id?: string
          position?: number
          status?: string
          title: string
        }
        Update: {
          created_at?: string
          dossier_id?: string
          id?: string
          position?: number
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "dossier_steps_dossier_id_fkey"
            columns: ["dossier_id"]
            isOneToOne: false
            referencedRelation: "dossiers"
            referencedColumns: ["id"]
          },
        ]
      }
      dossier_tasks: {
        Row: {
          completed: boolean
          created_at: string
          dossier_id: string
          due_date: string | null
          id: string
          step_id: string | null
          title: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          dossier_id: string
          due_date?: string | null
          id?: string
          step_id?: string | null
          title: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          dossier_id?: string
          due_date?: string | null
          id?: string
          step_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "dossier_tasks_dossier_id_fkey"
            columns: ["dossier_id"]
            isOneToOne: false
            referencedRelation: "dossiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dossier_tasks_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "dossier_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      dossiers: {
        Row: {
          blockers: string | null
          category: string | null
          collaborator_agent_ids: string[]
          created_at: string
          id: string
          lead_agent_id: string | null
          objective: string | null
          owner_id: string
          plan_b: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          blockers?: string | null
          category?: string | null
          collaborator_agent_ids?: string[]
          created_at?: string
          id?: string
          lead_agent_id?: string | null
          objective?: string | null
          owner_id: string
          plan_b?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          blockers?: string | null
          category?: string | null
          collaborator_agent_ids?: string[]
          created_at?: string
          id?: string
          lead_agent_id?: string | null
          objective?: string | null
          owner_id?: string
          plan_b?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dossiers_lead_agent_id_fkey"
            columns: ["lead_agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dossiers_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          completed_at: string | null
          course_id: string
          enrolled_at: string
          id: string
          lesson_progress: Json
          progress_percent: number
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          enrolled_at?: string
          id?: string
          lesson_progress?: Json
          progress_percent?: number
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          enrolled_at?: string
          id?: string
          lesson_progress?: Json
          progress_percent?: number
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_sessions: {
        Row: {
          answers: Json | null
          enrollment_id: string
          id: string
          passed: boolean | null
          score: number | null
          taken_at: string
        }
        Insert: {
          answers?: Json | null
          enrollment_id: string
          id?: string
          passed?: boolean | null
          score?: number | null
          taken_at?: string
        }
        Update: {
          answers?: Json | null
          enrollment_id?: string
          id?: string
          passed?: boolean | null
          score?: number | null
          taken_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_sessions_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_catalog: {
        Row: {
          animation: string | null
          cost: number
          icon: string | null
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          animation?: string | null
          cost: number
          icon?: string | null
          id: string
          is_active?: boolean
          name: string
        }
        Update: {
          animation?: string | null
          cost?: number
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      live_action_items: {
        Row: {
          assigned_to: string | null
          category: string
          completed: boolean
          created_at: string
          deadline: string | null
          id: string
          notes: string | null
          session_id: string
          title: string
        }
        Insert: {
          assigned_to?: string | null
          category: string
          completed?: boolean
          created_at?: string
          deadline?: string | null
          id?: string
          notes?: string | null
          session_id: string
          title: string
        }
        Update: {
          assigned_to?: string | null
          category?: string
          completed?: boolean
          created_at?: string
          deadline?: string | null
          id?: string
          notes?: string | null
          session_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_action_items_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      live_agenda_items: {
        Row: {
          completed: boolean
          duration_minutes: number
          id: string
          position: number
          presenter: string | null
          session_id: string
          title: string
        }
        Insert: {
          completed?: boolean
          duration_minutes?: number
          id?: string
          position?: number
          presenter?: string | null
          session_id: string
          title: string
        }
        Update: {
          completed?: boolean
          duration_minutes?: number
          id?: string
          position?: number
          presenter?: string | null
          session_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_agenda_items_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      live_attendance: {
        Row: {
          competence_validated: boolean
          duration_minutes: number
          exercises_done: number
          id: string
          joined_at: string
          name: string | null
          participant_id: string
          quiz_score: number | null
          session_id: string
        }
        Insert: {
          competence_validated?: boolean
          duration_minutes?: number
          exercises_done?: number
          id?: string
          joined_at?: string
          name?: string | null
          participant_id: string
          quiz_score?: number | null
          session_id: string
        }
        Update: {
          competence_validated?: boolean
          duration_minutes?: number
          exercises_done?: number
          id?: string
          joined_at?: string
          name?: string | null
          participant_id?: string
          quiz_score?: number | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_attendance_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_attendance_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      live_decisions: {
        Row: {
          agreed_by: string[]
          category: string | null
          created_at: string
          id: string
          session_id: string
          text: string
        }
        Insert: {
          agreed_by?: string[]
          category?: string | null
          created_at?: string
          id?: string
          session_id: string
          text: string
        }
        Update: {
          agreed_by?: string[]
          category?: string | null
          created_at?: string
          id?: string
          session_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_decisions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      live_documents: {
        Row: {
          created_at: string
          id: string
          name: string
          page_count: number | null
          session_id: string
          size: string | null
          type: string | null
          uploaded_by: string | null
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          page_count?: number | null
          session_id: string
          size?: string | null
          type?: string | null
          uploaded_by?: string | null
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          page_count?: number | null
          session_id?: string
          size?: string | null
          type?: string | null
          uploaded_by?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_documents_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      live_gifts_sent: {
        Row: {
          created_at: string
          gift_id: string
          id: string
          quantity: number
          sender_id: string
          session_id: string
        }
        Insert: {
          created_at?: string
          gift_id: string
          id?: string
          quantity?: number
          sender_id: string
          session_id: string
        }
        Update: {
          created_at?: string
          gift_id?: string
          id?: string
          quantity?: number
          sender_id?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_gifts_sent_gift_id_fkey"
            columns: ["gift_id"]
            isOneToOne: false
            referencedRelation: "gift_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_gifts_sent_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_gifts_sent_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      live_personal_notes: {
        Row: {
          category: string
          created_at: string
          id: string
          reminder_date: string | null
          session_id: string
          target_module: string | null
          text: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          reminder_date?: string | null
          session_id: string
          target_module?: string | null
          text: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          reminder_date?: string | null
          session_id?: string
          target_module?: string | null
          text?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_personal_notes_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_personal_notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      live_poll_options: {
        Row: {
          id: string
          poll_id: string
          text: string
          votes_count: number
        }
        Insert: {
          id?: string
          poll_id: string
          text: string
          votes_count?: number
        }
        Update: {
          id?: string
          poll_id?: string
          text?: string
          votes_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "live_poll_options_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "live_polls"
            referencedColumns: ["id"]
          },
        ]
      }
      live_poll_votes: {
        Row: {
          created_at: string
          option_id: string
          poll_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          option_id: string
          poll_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          option_id?: string
          poll_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_poll_votes_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "live_poll_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "live_polls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_poll_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      live_polls: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          question: string
          session_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          question: string
          session_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          question?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_polls_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      live_products: {
        Row: {
          availability: string | null
          category: string | null
          country: string | null
          country_flag: string | null
          currency: string | null
          description: string | null
          has_trade_assistance: boolean | null
          id: string
          image_url: string | null
          name: string
          price: number | null
          seller_avatar: string | null
          seller_name: string | null
          session_id: string
        }
        Insert: {
          availability?: string | null
          category?: string | null
          country?: string | null
          country_flag?: string | null
          currency?: string | null
          description?: string | null
          has_trade_assistance?: boolean | null
          id?: string
          image_url?: string | null
          name: string
          price?: number | null
          seller_avatar?: string | null
          seller_name?: string | null
          session_id: string
        }
        Update: {
          availability?: string | null
          category?: string | null
          country?: string | null
          country_flag?: string | null
          currency?: string | null
          description?: string | null
          has_trade_assistance?: boolean | null
          id?: string
          image_url?: string | null
          name?: string
          price?: number | null
          seller_avatar?: string | null
          seller_name?: string | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_products_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      live_question_upvotes: {
        Row: {
          created_at: string
          question_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          question_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          question_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_question_upvotes_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "live_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_question_upvotes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      live_questions: {
        Row: {
          ai_group_key: string | null
          author_avatar: string | null
          author_id: string | null
          author_name: string | null
          category: string | null
          created_at: string
          id: string
          session_id: string
          status: string
          text: string
          upvotes_count: number
        }
        Insert: {
          ai_group_key?: string | null
          author_avatar?: string | null
          author_id?: string | null
          author_name?: string | null
          category?: string | null
          created_at?: string
          id?: string
          session_id: string
          status?: string
          text: string
          upvotes_count?: number
        }
        Update: {
          ai_group_key?: string | null
          author_avatar?: string | null
          author_id?: string | null
          author_name?: string | null
          category?: string | null
          created_at?: string
          id?: string
          session_id?: string
          status?: string
          text?: string
          upvotes_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "live_questions_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_questions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      live_replays: {
        Row: {
          campus_ready: boolean
          category: string | null
          chapters: Json
          created_at: string
          duration_seconds: number
          host_avatar: string | null
          host_name: string | null
          id: string
          key_takeaways: string[]
          resources: Json
          session_id: string
          summary: string | null
          title: string
          transcript: Json
          video_url: string | null
        }
        Insert: {
          campus_ready?: boolean
          category?: string | null
          chapters?: Json
          created_at?: string
          duration_seconds?: number
          host_avatar?: string | null
          host_name?: string | null
          id?: string
          key_takeaways?: string[]
          resources?: Json
          session_id: string
          summary?: string | null
          title: string
          transcript?: Json
          video_url?: string | null
        }
        Update: {
          campus_ready?: boolean
          category?: string | null
          chapters?: Json
          created_at?: string
          duration_seconds?: number
          host_avatar?: string | null
          host_name?: string | null
          id?: string
          key_takeaways?: string[]
          resources?: Json
          session_id?: string
          summary?: string | null
          title?: string
          transcript?: Json
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "live_replays_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      live_sessions: {
        Row: {
          ai_assistant_id: string | null
          allowed_member_ids: string[]
          conf_tracks: string[]
          course_module_id: string | null
          cover_image: string | null
          created_at: string
          description: string | null
          donation_goal: Json | null
          dossier_id: string | null
          dossier_title: string | null
          duration_minutes: number
          ended_at: string | null
          expert_id: string | null
          host_avatar: string | null
          host_id: string
          host_name: string | null
          id: string
          interview_guest_bio: string | null
          interview_guest_name: string | null
          is_data_saver: boolean
          is_mixed: boolean
          is_paid: boolean
          is_private: boolean
          is_questions_enabled: boolean
          is_recording_enabled: boolean
          is_scheduled: boolean
          is_screen_share_enabled: boolean
          is_translation_enabled: boolean
          is_vision_enabled: boolean
          is_waiting_room_enabled: boolean
          language: string | null
          meeting_minutes: Json | null
          pricing: Json | null
          quality_mode: string | null
          scheduled_for: string | null
          sensitive_data_alert: boolean
          started_at: string | null
          tags: string[]
          target_language: string | null
          timezone: string | null
          title: string
          tribe_id: string | null
          tribe_name: string | null
          type: string | null
          updated_at: string
          viewers_count: number
        }
        Insert: {
          ai_assistant_id?: string | null
          allowed_member_ids?: string[]
          conf_tracks?: string[]
          course_module_id?: string | null
          cover_image?: string | null
          created_at?: string
          description?: string | null
          donation_goal?: Json | null
          dossier_id?: string | null
          dossier_title?: string | null
          duration_minutes?: number
          ended_at?: string | null
          expert_id?: string | null
          host_avatar?: string | null
          host_id: string
          host_name?: string | null
          id?: string
          interview_guest_bio?: string | null
          interview_guest_name?: string | null
          is_data_saver?: boolean
          is_mixed?: boolean
          is_paid?: boolean
          is_private?: boolean
          is_questions_enabled?: boolean
          is_recording_enabled?: boolean
          is_scheduled?: boolean
          is_screen_share_enabled?: boolean
          is_translation_enabled?: boolean
          is_vision_enabled?: boolean
          is_waiting_room_enabled?: boolean
          language?: string | null
          meeting_minutes?: Json | null
          pricing?: Json | null
          quality_mode?: string | null
          scheduled_for?: string | null
          sensitive_data_alert?: boolean
          started_at?: string | null
          tags?: string[]
          target_language?: string | null
          timezone?: string | null
          title: string
          tribe_id?: string | null
          tribe_name?: string | null
          type?: string | null
          updated_at?: string
          viewers_count?: number
        }
        Update: {
          ai_assistant_id?: string | null
          allowed_member_ids?: string[]
          conf_tracks?: string[]
          course_module_id?: string | null
          cover_image?: string | null
          created_at?: string
          description?: string | null
          donation_goal?: Json | null
          dossier_id?: string | null
          dossier_title?: string | null
          duration_minutes?: number
          ended_at?: string | null
          expert_id?: string | null
          host_avatar?: string | null
          host_id?: string
          host_name?: string | null
          id?: string
          interview_guest_bio?: string | null
          interview_guest_name?: string | null
          is_data_saver?: boolean
          is_mixed?: boolean
          is_paid?: boolean
          is_private?: boolean
          is_questions_enabled?: boolean
          is_recording_enabled?: boolean
          is_scheduled?: boolean
          is_screen_share_enabled?: boolean
          is_translation_enabled?: boolean
          is_vision_enabled?: boolean
          is_waiting_room_enabled?: boolean
          language?: string | null
          meeting_minutes?: Json | null
          pricing?: Json | null
          quality_mode?: string | null
          scheduled_for?: string | null
          sensitive_data_alert?: boolean
          started_at?: string | null
          tags?: string[]
          target_language?: string | null
          timezone?: string | null
          title?: string
          tribe_id?: string | null
          tribe_name?: string | null
          type?: string | null
          updated_at?: string
          viewers_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "live_sessions_ai_assistant_id_fkey"
            columns: ["ai_assistant_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_sessions_dossier_id_fkey"
            columns: ["dossier_id"]
            isOneToOne: false
            referencedRelation: "dossiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_sessions_expert_id_fkey"
            columns: ["expert_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_sessions_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      live_source_cards: {
        Row: {
          analysis: string | null
          card_date: string | null
          created_at: string
          document_name: string | null
          id: string
          organization: string | null
          reference_url: string | null
          session_id: string
          statement: string
          verified_status: string | null
        }
        Insert: {
          analysis?: string | null
          card_date?: string | null
          created_at?: string
          document_name?: string | null
          id?: string
          organization?: string | null
          reference_url?: string | null
          session_id: string
          statement: string
          verified_status?: string | null
        }
        Update: {
          analysis?: string | null
          card_date?: string | null
          created_at?: string
          document_name?: string | null
          id?: string
          organization?: string | null
          reference_url?: string | null
          session_id?: string
          statement?: string
          verified_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "live_source_cards_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      live_speakers: {
        Row: {
          agent_id: string | null
          avatar: string | null
          id: string
          is_ai: boolean
          is_hand_raised: boolean
          is_muted: boolean
          is_screen_sharing: boolean
          is_verified: boolean
          is_video_on: boolean
          joined_at: string
          name: string
          role: string
          session_id: string
          specialty: string | null
          user_id: string | null
        }
        Insert: {
          agent_id?: string | null
          avatar?: string | null
          id?: string
          is_ai?: boolean
          is_hand_raised?: boolean
          is_muted?: boolean
          is_screen_sharing?: boolean
          is_verified?: boolean
          is_video_on?: boolean
          joined_at?: string
          name: string
          role: string
          session_id: string
          specialty?: string | null
          user_id?: string | null
        }
        Update: {
          agent_id?: string | null
          avatar?: string | null
          id?: string
          is_ai?: boolean
          is_hand_raised?: boolean
          is_muted?: boolean
          is_screen_sharing?: boolean
          is_verified?: boolean
          is_video_on?: boolean
          joined_at?: string
          name?: string
          role?: string
          session_id?: string
          specialty?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "live_speakers_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_speakers_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_speakers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      live_whiteboard_strokes: {
        Row: {
          author_id: string | null
          color: string | null
          created_at: string
          height_box: number | null
          id: string
          points: Json | null
          session_id: string
          stroke_text: string | null
          stroke_width: number | null
          tool: string
          width_box: number | null
          x: number | null
          y: number | null
        }
        Insert: {
          author_id?: string | null
          color?: string | null
          created_at?: string
          height_box?: number | null
          id?: string
          points?: Json | null
          session_id: string
          stroke_text?: string | null
          stroke_width?: number | null
          tool: string
          width_box?: number | null
          x?: number | null
          y?: number | null
        }
        Update: {
          author_id?: string | null
          color?: string | null
          created_at?: string
          height_box?: number | null
          id?: string
          points?: Json | null
          session_id?: string
          stroke_text?: string | null
          stroke_width?: number | null
          tool?: string
          width_box?: number | null
          x?: number | null
          y?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "live_whiteboard_strokes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_whiteboard_strokes_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      master_resumes: {
        Row: {
          content: Json
          created_at: string
          id: string
          updated_at: string
          user_id: string
          version: number
        }
        Insert: {
          content: Json
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
          version?: number
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "master_resumes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reactions: {
        Row: {
          created_at: string
          id: string
          message_id: string
          reaction: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message_id: string
          reaction: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message_id?: string
          reaction?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachment_url: string | null
          client_message_id: string
          content: string
          conversation_id: string
          created_at: string
          deleted_at: string | null
          edited_at: string | null
          id: string
          is_pinned: boolean
          message_type: string
          metadata: Json
          reply_to_id: string | null
          sender_id: string
          status: string
          updated_at: string
        }
        Insert: {
          attachment_url?: string | null
          client_message_id?: string
          content?: string
          conversation_id: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          is_pinned?: boolean
          message_type?: string
          metadata?: Json
          reply_to_id?: string | null
          sender_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          attachment_url?: string | null
          client_message_id?: string
          content?: string
          conversation_id?: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          is_pinned?: boolean
          message_type?: string
          metadata?: Json
          reply_to_id?: string | null
          sender_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          priority: string | null
          read: boolean
          target_action: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          priority?: string | null
          read?: boolean
          target_action?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          priority?: string | null
          read?: boolean
          target_action?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string
          quantity: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id: string
          quantity?: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          buyer_id: string
          created_at: string
          currency: string
          id: string
          seller_id: string | null
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          currency?: string
          id?: string
          seller_id?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          currency?: string
          id?: string
          seller_id?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_documents: {
        Row: {
          bucket_id: string | null
          created_at: string
          id: string
          name: string
          object_path: string | null
          page_count: number | null
          post_id: string
          size: number | null
          type: string | null
          url: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string
          id?: string
          name: string
          object_path?: string | null
          page_count?: number | null
          post_id: string
          size?: number | null
          type?: string | null
          url?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string
          id?: string
          name?: string
          object_path?: string | null
          page_count?: number | null
          post_id?: string
          size?: number | null
          type?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_documents_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_reactions: {
        Row: {
          created_at: string
          id: string
          post_id: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          media_bucket: string | null
          media_metadata: Json
          media_path: string | null
          media_type: string | null
          shares_count: number
          updated_at: string
          visibility: string
        }
        Insert: {
          author_id: string
          content?: string
          created_at?: string
          id?: string
          media_bucket?: string | null
          media_metadata?: Json
          media_path?: string | null
          media_type?: string | null
          shares_count?: number
          updated_at?: string
          visibility?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          media_bucket?: string | null
          media_metadata?: Json
          media_path?: string | null
          media_type?: string | null
          shares_count?: number
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string | null
          created_at: string
          currency: string
          description: string | null
          dimension_type: string | null
          id: string
          image_url: string | null
          is_active: boolean
          is_service: boolean | null
          lead_time_days: number | null
          linked_live_id: string | null
          linked_reel_id: string | null
          min_order_quantity: number | null
          origin_country: string | null
          price: number
          rating: number | null
          reviews_count: number | null
          seller_country: string | null
          seller_flag: string | null
          seller_id: string | null
          seller_verified: boolean | null
          service_details: Json | null
          shipping_available: boolean | null
          shop_id: string | null
          stock_available: number | null
          title: string
          unit: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          dimension_type?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_service?: boolean | null
          lead_time_days?: number | null
          linked_live_id?: string | null
          linked_reel_id?: string | null
          min_order_quantity?: number | null
          origin_country?: string | null
          price?: number
          rating?: number | null
          reviews_count?: number | null
          seller_country?: string | null
          seller_flag?: string | null
          seller_id?: string | null
          seller_verified?: boolean | null
          service_details?: Json | null
          shipping_available?: boolean | null
          shop_id?: string | null
          stock_available?: number | null
          title: string
          unit?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          dimension_type?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_service?: boolean | null
          lead_time_days?: number | null
          linked_live_id?: string | null
          linked_reel_id?: string | null
          min_order_quantity?: number | null
          origin_country?: string | null
          price?: number
          rating?: number | null
          reviews_count?: number | null
          seller_country?: string | null
          seller_flag?: string | null
          seller_id?: string | null
          seller_verified?: boolean | null
          service_details?: Json | null
          shipping_available?: boolean | null
          shop_id?: string | null
          stock_available?: number | null
          title?: string
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_linked_live_id_fkey"
            columns: ["linked_live_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_badges: {
        Row: {
          badge_key: string
          description: string | null
          earned_at: string
          icon: string | null
          id: string
          name: string
          profile_id: string
        }
        Insert: {
          badge_key: string
          description?: string | null
          earned_at?: string
          icon?: string | null
          id?: string
          name: string
          profile_id: string
        }
        Update: {
          badge_key?: string
          description?: string | null
          earned_at?: string
          icon?: string | null
          id?: string
          name?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_badges_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_skills: {
        Row: {
          created_at: string
          id: string
          name: string
          profile_id: string
          progress: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          profile_id: string
          progress?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          profile_id?: string
          progress?: number
        }
        Relationships: [
          {
            foreignKeyName: "profile_skills_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          citizenship_id: string | null
          city: string | null
          country: string | null
          created_at: string
          credits: number
          email: string
          followers_count: number
          following_count: number
          id: string
          interests: string[]
          is_verified: boolean
          level: number
          name: string
          next_level_xp: number
          phone: string | null
          preferred_language: string
          privacy_settings: Json
          role: string
          title: string | null
          two_factor_enabled: boolean
          updated_at: string
          website: string | null
          xp: number
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          citizenship_id?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          credits?: number
          email: string
          followers_count?: number
          following_count?: number
          id: string
          interests?: string[]
          is_verified?: boolean
          level?: number
          name?: string
          next_level_xp?: number
          phone?: string | null
          preferred_language?: string
          privacy_settings?: Json
          role?: string
          title?: string | null
          two_factor_enabled?: boolean
          updated_at?: string
          website?: string | null
          xp?: number
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          citizenship_id?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          credits?: number
          email?: string
          followers_count?: number
          following_count?: number
          id?: string
          interests?: string[]
          is_verified?: boolean
          level?: number
          name?: string
          next_level_xp?: number
          phone?: string | null
          preferred_language?: string
          privacy_settings?: Json
          role?: string
          title?: string | null
          two_factor_enabled?: boolean
          updated_at?: string
          website?: string | null
          xp?: number
        }
        Relationships: []
      }
      shops: {
        Row: {
          ai_config: Json | null
          banner_url: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          owner_id: string
          revenue: number
          sales_count: number
          updated_at: string
        }
        Insert: {
          ai_config?: Json | null
          banner_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          owner_id: string
          revenue?: number
          sales_count?: number
          updated_at?: string
        }
        Update: {
          ai_config?: Json | null
          banner_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          owner_id?: string
          revenue?: number
          sales_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shops_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stories: {
        Row: {
          author_id: string
          caption: string | null
          created_at: string
          expires_at: string
          id: string
          is_live: boolean
          media_bucket: string | null
          media_path: string | null
          media_type: string | null
          media_url: string | null
          viewers_count: number
          visibility: string
        }
        Insert: {
          author_id: string
          caption?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          is_live?: boolean
          media_bucket?: string | null
          media_path?: string | null
          media_type?: string | null
          media_url?: string | null
          viewers_count?: number
          visibility?: string
        }
        Update: {
          author_id?: string
          caption?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          is_live?: boolean
          media_bucket?: string | null
          media_path?: string | null
          media_type?: string | null
          media_url?: string | null
          viewers_count?: number
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "stories_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          reason: string | null
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          reason?: string | null
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_presence: {
        Row: {
          device_id: string | null
          last_seen_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          device_id?: string | null
          last_seen_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          device_id?: string | null
          last_seen_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_presence_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          currency: string
          id: string
          idempotency_key: string | null
          metadata: Json
          reference: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          idempotency_key?: string | null
          metadata?: Json
          reference?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          idempotency_key?: string | null
          metadata?: Json
          reference?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_conversation_member: {
        Args: { p_conversation_id: string; p_user_id: string }
        Returns: undefined
      }
      admin_set_user_role: {
        Args: { p_reason: string; p_role: string; p_user_id: string }
        Returns: {
          avatar_url: string | null
          bio: string | null
          citizenship_id: string | null
          city: string | null
          country: string | null
          created_at: string
          credits: number
          email: string
          followers_count: number
          following_count: number
          id: string
          interests: string[]
          is_verified: boolean
          level: number
          name: string
          next_level_xp: number
          phone: string | null
          preferred_language: string
          privacy_settings: Json
          role: string
          title: string | null
          two_factor_enabled: boolean
          updated_at: string
          website: string | null
          xp: number
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_update_abuse_report: {
        Args: { p_report_id: string; p_resolution?: string; p_status: string }
        Returns: {
          assigned_to: string | null
          category: string
          conversation_id: string | null
          created_at: string
          description: string | null
          id: string
          message_id: string | null
          post_id: string | null
          reporter_id: string
          resolution: string | null
          status: string
          target_user_id: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "abuse_reports"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_update_user_profile: {
        Args: { p_changes: Json; p_reason: string; p_user_id: string }
        Returns: {
          avatar_url: string | null
          bio: string | null
          citizenship_id: string | null
          city: string | null
          country: string | null
          created_at: string
          credits: number
          email: string
          followers_count: number
          following_count: number
          id: string
          interests: string[]
          is_verified: boolean
          level: number
          name: string
          next_level_xp: number
          phone: string | null
          preferred_language: string
          privacy_settings: Json
          role: string
          title: string | null
          two_factor_enabled: boolean
          updated_at: string
          website: string | null
          xp: number
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      award_xp_and_credits: {
        Args: { p_credits_delta: number; p_user_id: string; p_xp_delta: number }
        Returns: {
          avatar_url: string | null
          bio: string | null
          citizenship_id: string | null
          city: string | null
          country: string | null
          created_at: string
          credits: number
          email: string
          followers_count: number
          following_count: number
          id: string
          interests: string[]
          is_verified: boolean
          level: number
          name: string
          next_level_xp: number
          phone: string | null
          preferred_language: string
          privacy_settings: Json
          role: string
          title: string | null
          two_factor_enabled: boolean
          updated_at: string
          website: string | null
          xp: number
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      can_access_dossier: { Args: { p_dossier_id: string }; Returns: boolean }
      can_view_live_session: {
        Args: { p_session_id: string }
        Returns: boolean
      }
      can_write_dossier: { Args: { p_dossier_id: string }; Returns: boolean }
      create_conversation: {
        Args: { p_is_group?: boolean; p_member_ids: string[]; p_title?: string }
        Returns: string
      }
      get_public_profiles: {
        Args: { p_user_ids: string[] }
        Returns: {
          avatar_url: string
          city: string
          country: string
          created_at: string
          followers_count: number
          following_count: number
          id: string
          is_verified: boolean
          name: string
          title: string
        }[]
      }
      get_wallet_balance: {
        Args: { p_currency?: string; p_user_id: string }
        Returns: number
      }
      insert_wallet_transaction: {
        Args: {
          p_amount: number
          p_currency: string
          p_idempotency_key: string
          p_reference: string
          p_type: string
          p_user_id: string
        }
        Returns: {
          amount: number
          created_at: string
          created_by: string | null
          currency: string
          id: string
          idempotency_key: string | null
          metadata: Json
          reference: string | null
          type: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "wallet_transactions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      is_admin: { Args: never; Returns: boolean }
      is_live_host: { Args: { p_session_id: string }; Returns: boolean }
      mark_conversation_read: {
        Args: { p_conversation_id: string }
        Returns: string
      }
      search_public_profiles: {
        Args: { p_limit?: number; p_query?: string }
        Returns: {
          avatar_url: string
          city: string
          country: string
          followers_count: number
          following_count: number
          id: string
          is_verified: boolean
          name: string
          title: string
        }[]
      }
      set_user_presence: {
        Args: { p_device_id?: string; p_status: string }
        Returns: {
          device_id: string | null
          last_seen_at: string
          status: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "user_presence"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_my_profile: {
        Args: { p_changes: Json }
        Returns: {
          avatar_url: string | null
          bio: string | null
          citizenship_id: string | null
          city: string | null
          country: string | null
          created_at: string
          credits: number
          email: string
          followers_count: number
          following_count: number
          id: string
          interests: string[]
          is_verified: boolean
          level: number
          name: string
          next_level_xp: number
          phone: string | null
          preferred_language: string
          privacy_settings: Json
          role: string
          title: string | null
          two_factor_enabled: boolean
          updated_at: string
          website: string | null
          xp: number
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
