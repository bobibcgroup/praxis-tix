/* eslint-disable @typescript-eslint/no-explicit-any */
// Database types for Supabase
// Note: 'any' types are used for JSON columns which can have flexible schemas
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          style_dna: any | null;
          fit_calibration: any | null;
          lifestyle: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          style_dna?: any | null;
          fit_calibration?: any | null;
          lifestyle?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          style_dna?: any | null;
          fit_calibration?: any | null;
          lifestyle?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      outfit_history: {
        Row: {
          id: string;
          user_id: string;
          outfit_id: number;
          occasion: string;
          outfit_data: any;
          try_on_image_url: string | null;
          animated_video_url: string | null;
          selected_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          outfit_id: number;
          occasion: string;
          outfit_data: any;
          try_on_image_url?: string | null;
          animated_video_url?: string | null;
          selected_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          outfit_id?: number;
          occasion?: string;
          outfit_data?: any;
          try_on_image_url?: string | null;
          animated_video_url?: string | null;
          selected_at?: string;
          created_at?: string;
        };
      };
      favorites: {
        Row: {
          id: string;
          user_id: string;
          outfit_id: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          outfit_id: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          outfit_id?: number;
          created_at?: string;
        };
      };
    };
  };
}
