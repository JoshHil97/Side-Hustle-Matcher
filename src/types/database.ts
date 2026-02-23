export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          created_at?: string;
        };
      };
      companies: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          website_url: string | null;
          location: string | null;
          industry: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          website_url?: string | null;
          location?: string | null;
          industry?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          website_url?: string | null;
          location?: string | null;
          industry?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      applications: {
        Row: {
          id: string;
          user_id: string;
          company_id: string | null;
          company_name: string;
          role_title: string;
          job_url: string | null;
          location: string | null;
          work_mode: "remote" | "hybrid" | "onsite" | null;
          salary_min: number | null;
          salary_max: number | null;
          currency: string;
          date_posted: string | null;
          date_applied: string;
          source: string | null;
          priority: "low" | "medium" | "high";
          status:
            | "draft"
            | "applied"
            | "screening"
            | "interview_1"
            | "interview_2"
            | "interview_3"
            | "task"
            | "offer"
            | "rejected"
            | "withdrawn"
            | "accepted";
          next_step_date: string | null;
          next_step_note: string | null;
          description_snapshot: string | null;
          fit_score: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          company_id?: string | null;
          company_name: string;
          role_title: string;
          job_url?: string | null;
          location?: string | null;
          work_mode?: "remote" | "hybrid" | "onsite" | null;
          salary_min?: number | null;
          salary_max?: number | null;
          currency?: string;
          date_posted?: string | null;
          date_applied?: string;
          source?: string | null;
          priority?: "low" | "medium" | "high";
          status?:
            | "draft"
            | "applied"
            | "screening"
            | "interview_1"
            | "interview_2"
            | "interview_3"
            | "task"
            | "offer"
            | "rejected"
            | "withdrawn"
            | "accepted";
          next_step_date?: string | null;
          next_step_note?: string | null;
          description_snapshot?: string | null;
          fit_score?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          company_id?: string | null;
          company_name?: string;
          role_title?: string;
          job_url?: string | null;
          location?: string | null;
          work_mode?: "remote" | "hybrid" | "onsite" | null;
          salary_min?: number | null;
          salary_max?: number | null;
          currency?: string;
          date_posted?: string | null;
          date_applied?: string;
          source?: string | null;
          priority?: "low" | "medium" | "high";
          status?:
            | "draft"
            | "applied"
            | "screening"
            | "interview_1"
            | "interview_2"
            | "interview_3"
            | "task"
            | "offer"
            | "rejected"
            | "withdrawn"
            | "accepted";
          next_step_date?: string | null;
          next_step_note?: string | null;
          description_snapshot?: string | null;
          fit_score?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      contacts: {
        Row: {
          id: string;
          user_id: string;
          company_id: string | null;
          name: string;
          email: string | null;
          phone: string | null;
          role: string | null;
          linkedin_url: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          company_id?: string | null;
          name: string;
          email?: string | null;
          phone?: string | null;
          role?: string | null;
          linkedin_url?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          company_id?: string | null;
          name?: string;
          email?: string | null;
          phone?: string | null;
          role?: string | null;
          linkedin_url?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      application_contacts: {
        Row: {
          id: string;
          user_id: string;
          application_id: string;
          contact_id: string;
          relationship: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          application_id: string;
          contact_id: string;
          relationship?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          application_id?: string;
          contact_id?: string;
          relationship?: string | null;
          created_at?: string;
        };
      };
      notes: {
        Row: {
          id: string;
          user_id: string;
          application_id: string;
          kind: "general" | "interview_prep" | "follow_up" | "company_research";
          content: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          application_id: string;
          kind?: "general" | "interview_prep" | "follow_up" | "company_research";
          content: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          application_id?: string;
          kind?: "general" | "interview_prep" | "follow_up" | "company_research";
          content?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      status_history: {
        Row: {
          id: string;
          user_id: string;
          application_id: string;
          from_status: string | null;
          to_status: string;
          occurred_at: string;
          note: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          application_id: string;
          from_status?: string | null;
          to_status: string;
          occurred_at?: string;
          note?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          application_id?: string;
          from_status?: string | null;
          to_status?: string;
          occurred_at?: string;
          note?: string | null;
        };
      };
      documents: {
        Row: {
          id: string;
          user_id: string;
          application_id: string | null;
          company_id: string | null;
          storage_bucket: string;
          storage_path: string;
          file_name: string;
          file_type: string | null;
          file_size: number | null;
          category: "cv" | "cover_letter" | "portfolio" | "other";
          version_label: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          application_id?: string | null;
          company_id?: string | null;
          storage_bucket?: string;
          storage_path: string;
          file_name: string;
          file_type?: string | null;
          file_size?: number | null;
          category?: "cv" | "cover_letter" | "portfolio" | "other";
          version_label?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          application_id?: string | null;
          company_id?: string | null;
          storage_bucket?: string;
          storage_path?: string;
          file_name?: string;
          file_type?: string | null;
          file_size?: number | null;
          category?: "cv" | "cover_letter" | "portfolio" | "other";
          version_label?: string | null;
          created_at?: string;
        };
      };
      templates: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          type: "cover_letter_block" | "interview_answer" | "follow_up_email" | "cv_bullet" | "other";
          tags: string[];
          content: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          type?: "cover_letter_block" | "interview_answer" | "follow_up_email" | "cv_bullet" | "other";
          tags?: string[];
          content: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          type?: "cover_letter_block" | "interview_answer" | "follow_up_email" | "cv_bullet" | "other";
          tags?: string[];
          content?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      reminders: {
        Row: {
          id: string;
          user_id: string;
          application_id: string;
          title: string;
          due_at: string;
          status: "open" | "done" | "dismissed";
          channel: "in_app" | "email";
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          application_id: string;
          title: string;
          due_at: string;
          status?: "open" | "done" | "dismissed";
          channel?: "in_app" | "email";
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          application_id?: string;
          title?: string;
          due_at?: string;
          status?: "open" | "done" | "dismissed";
          channel?: "in_app" | "email";
          created_at?: string;
          completed_at?: string | null;
        };
      };
      activity_log: {
        Row: {
          id: string;
          user_id: string;
          entity_type: string;
          entity_id: string;
          action: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          entity_type: string;
          entity_id: string;
          action: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          entity_type?: string;
          entity_id?: string;
          action?: string;
          metadata?: Json;
          created_at?: string;
        };
      };
    };
  };
};

export type AppStatus = Database["public"]["Tables"]["applications"]["Row"]["status"];
export type Priority = Database["public"]["Tables"]["applications"]["Row"]["priority"];
export type WorkMode = NonNullable<Database["public"]["Tables"]["applications"]["Row"]["work_mode"]>;
export type NoteKind = Database["public"]["Tables"]["notes"]["Row"]["kind"];
export type DocumentCategory = Database["public"]["Tables"]["documents"]["Row"]["category"];
export type TemplateType = Database["public"]["Tables"]["templates"]["Row"]["type"];
