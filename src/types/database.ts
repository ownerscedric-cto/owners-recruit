export interface Database {
  public: {
    Tables: {
      applicants: {
        Row: {
          id: string
          name: string
          email: string
          phone: string
          address: string
          birth_date: string
          resident_number: string | null
          bank_name: string | null
          bank_account: string | null
          life_insurance_pass_date: string | null
          life_education_date: string | null
          final_school: string | null
          documents_confirmed: boolean
          document_preparation_date: string | null
          applicant_type: 'new' | 'experienced'
          status: 'pending' | 'reviewing' | 'approved' | 'rejected' | 'completed'
          recruiter_id: string | null
          submitted_at: string
          updated_at: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone: string
          address: string
          birth_date: string
          resident_number?: string | null
          bank_name?: string | null
          bank_account?: string | null
          life_insurance_pass_date?: string | null
          life_education_date?: string | null
          final_school?: string | null
          documents_confirmed?: boolean
          document_preparation_date?: string | null
          applicant_type?: 'new' | 'experienced'
          status?: 'pending' | 'reviewing' | 'approved' | 'rejected' | 'completed'
          recruiter_id?: string | null
          submitted_at?: string
          updated_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string
          address?: string
          birth_date?: string
          resident_number?: string | null
          bank_name?: string | null
          bank_account?: string | null
          life_insurance_pass_date?: string | null
          life_education_date?: string | null
          final_school?: string | null
          documents_confirmed?: boolean
          document_preparation_date?: string | null
          applicant_type?: 'new' | 'experienced'
          status?: 'pending' | 'reviewing' | 'approved' | 'rejected' | 'completed'
          recruiter_id?: string | null
          submitted_at?: string
          updated_at?: string
          created_at?: string
        }
      }
      documents: {
        Row: {
          id: string
          applicant_id: string
          name: string
          type: string
          url: string
          uploaded_at: string
        }
        Insert: {
          id?: string
          applicant_id: string
          name: string
          type: string
          url: string
          uploaded_at?: string
        }
        Update: {
          id?: string
          applicant_id?: string
          name?: string
          type?: string
          url?: string
          uploaded_at?: string
        }
      }
      careers: {
        Row: {
          id: string
          applicant_id: string
          company: string
          position: string
          start_date: string
          end_date: string
          description: string | null
        }
        Insert: {
          id?: string
          applicant_id: string
          company: string
          position: string
          start_date: string
          end_date: string
          description?: string | null
        }
        Update: {
          id?: string
          applicant_id?: string
          company?: string
          position?: string
          start_date?: string
          end_date?: string
          description?: string | null
        }
      }
      certificates: {
        Row: {
          id: string
          applicant_id: string
          name: string
          issuer: string
          issue_date: string
          expiry_date: string | null
        }
        Insert: {
          id?: string
          applicant_id: string
          name: string
          issuer: string
          issue_date: string
          expiry_date?: string | null
        }
        Update: {
          id?: string
          applicant_id?: string
          name?: string
          issuer?: string
          issue_date?: string
          expiry_date?: string | null
        }
      }
      recruiters: {
        Row: {
          id: string
          name: string
          email: string
          phone: string
          team: string | null
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone: string
          team?: string | null
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string
          team?: string | null
          active?: boolean
          created_at?: string
        }
      }
      teams: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      downloadable_files: {
        Row: {
          id: string
          title: string
          description: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          category: string
          active: boolean
          download_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          file_name: string
          file_path: string
          file_size?: number
          file_type?: string
          category?: string
          active?: boolean
          download_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          category?: string
          active?: boolean
          download_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      exam_applications: {
        Row: {
          id: string
          applicant_id: string
          exam_schedule_id: string | null
          exam_type: string
          exam_round: number | null
          exam_date: string | null
          exam_location: string | null
          application_date: string
          status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          applicant_id: string
          exam_schedule_id?: string | null
          exam_type: string
          exam_round?: number | null
          exam_date?: string | null
          exam_location?: string | null
          application_date?: string
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          applicant_id?: string
          exam_schedule_id?: string | null
          exam_type?: string
          exam_round?: number | null
          exam_date?: string | null
          exam_location?: string | null
          application_date?: string
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      form_fields: {
        Row: {
          id: string
          field_name: string
          field_type: 'text' | 'email' | 'phone' | 'select' | 'textarea' | 'date' | 'file'
          label: string
          placeholder: string | null
          required: boolean
          visible: boolean
          order_index: number
          options: string | null
          validation_rules: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          field_name: string
          field_type: 'text' | 'email' | 'phone' | 'select' | 'textarea' | 'date' | 'file'
          label: string
          placeholder?: string | null
          required?: boolean
          visible?: boolean
          order_index?: number
          options?: string | null
          validation_rules?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          field_name?: string
          field_type?: 'text' | 'email' | 'phone' | 'select' | 'textarea' | 'date' | 'file'
          label?: string
          placeholder?: string | null
          required?: boolean
          visible?: boolean
          order_index?: number
          options?: string | null
          validation_rules?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      admins: {
        Row: {
          id: string
          username: string
          email: string
          password_hash: string
          role: 'admin' | 'hr_manager' | 'system_admin'
          active: boolean
          last_login: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          username: string
          email: string
          password_hash: string
          role?: 'admin' | 'hr_manager' | 'system_admin'
          active?: boolean
          last_login?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          email?: string
          password_hash?: string
          role?: 'admin' | 'hr_manager' | 'system_admin'
          active?: boolean
          last_login?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      admin_sessions: {
        Row: {
          id: string
          admin_id: string
          session_token: string
          expires_at: string
          created_at: string
        }
        Insert: {
          id?: string
          admin_id: string
          session_token: string
          expires_at: string
          created_at?: string
        }
        Update: {
          id?: string
          admin_id?: string
          session_token?: string
          expires_at?: string
          created_at?: string
        }
      }
      exam_schedules: {
        Row: {
          id: string
          year: number
          exam_type: string
          session_number: number
          registration_start_date: string | null
          registration_end_date: string | null
          exam_date: string
          exam_time_start: string
          exam_time_end: string
          locations: string[]
          notes: string | null
          created_at: string
          updated_at: string
          session_range: string | null
          internal_deadline_date: string | null
          internal_deadline_time: string | null
          notice_date: string | null
          notice_time: string | null
          has_internal_deadline: boolean
          data_source: string | null
          combined_notes: string | null
        }
        Insert: {
          id?: string
          year?: number
          exam_type?: string
          session_number?: number
          registration_start_date?: string | null
          registration_end_date?: string | null
          exam_date?: string
          exam_time_start?: string
          exam_time_end?: string
          locations?: string[]
          notes?: string | null
          created_at?: string
          updated_at?: string
          session_range?: string | null
          internal_deadline_date?: string | null
          internal_deadline_time?: string | null
          notice_date?: string | null
          notice_time?: string | null
          has_internal_deadline?: boolean
          data_source?: string | null
          combined_notes?: string | null
        }
        Update: {
          id?: string
          year?: number
          exam_type?: string
          session_number?: number
          registration_start_date?: string | null
          registration_end_date?: string | null
          exam_date?: string
          exam_time_start?: string
          exam_time_end?: string
          locations?: string[]
          notes?: string | null
          created_at?: string
          updated_at?: string
          session_range?: string | null
          internal_deadline_date?: string | null
          internal_deadline_time?: string | null
          notice_date?: string | null
          notice_time?: string | null
          has_internal_deadline?: boolean
          data_source?: string | null
          combined_notes?: string | null
        }
      }
      system_settings: {
        Row: {
          id: string
          category: string
          key: string
          value: string
          data_type: string
          description: string | null
          is_encrypted: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          category: string
          key: string
          value: string
          data_type?: string
          description?: string | null
          is_encrypted?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          category?: string
          key?: string
          value?: string
          data_type?: string
          description?: string | null
          is_encrypted?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      applicant_status: 'pending' | 'reviewing' | 'approved' | 'rejected' | 'completed'
      admin_role: 'admin' | 'hr_manager' | 'system_admin'
    }
  }
}