import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please set SUPABASE_URL and SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types for TypeScript
export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface UserWorkspace {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  user_id: string;
  workspace_id: string;
  title: string;
  source_file: string;
  file_type: string;
  file_size?: number;
  chunk_count: number;
  status: 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface DocumentChunk {
  id: string;
  document_id: string;
  user_id: string;
  workspace_id: string;
  chunk_index: number;
  total_chunks: number;
  text_content: string;
  token_count?: number;
  qdrant_vector_id?: string;
  created_at: string;
} 