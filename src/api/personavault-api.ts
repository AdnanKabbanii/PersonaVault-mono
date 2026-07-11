import { openai } from '@ai-sdk/openai';
import { Mastra } from '@mastra/core/mastra';
import { LibSQLStore } from '@mastra/libsql';
import { PinoLogger } from '@mastra/loggers';
import { QdrantVector } from '@mastra/qdrant';
import { embed } from 'ai';
import { config } from 'dotenv';
import { promises as fs } from 'fs';
import * as path from 'path';
import { z } from 'zod';
import { supabase } from '../config/supabase';
import { MultiUserDocumentIngestionPipeline } from '../utils/multi-user-document-ingestion';

// Load environment variables
config();

const UserIdSchema = z.string().uuid();
const WorkspaceIdSchema = z.string().uuid();
const DocumentIdSchema = z.string().uuid();

const FileUploadSchema = z.object({
  userId: UserIdSchema,
  workspaceId: WorkspaceIdSchema.optional(),
  fileName: z.string(),
  fileType: z.string(),
  fileSize: z.number(),
});

const SearchQuerySchema = z.object({
  userId: UserIdSchema,
  workspaceId: WorkspaceIdSchema.optional(),
  query: z.string().min(1),
  filters: z.object({
    keywords: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    source: z.string().optional(),
    dateRange: z.object({
      start: z.string().optional(),
      end: z.string().optional(),
    }).optional(),
  }).optional(),
  topK: z.number().default(10),
  useReranking: z.boolean().default(true),
});

const ChatMessageSchema = z.object({
  userId: UserIdSchema,
  workspaceId: WorkspaceIdSchema.optional(),
  message: z.string().min(1),
  conversationId: z.string().optional(),
  context: z.object({
    includeDocuments: z.boolean().default(true),
    includeConversationHistory: z.boolean().default(true),
  }).optional(),
});

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

interface UserWorkspace {
  id: string;
  name: string;
  description?: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

interface Document {
  id: string;
  title: string;
  source_file: string;
  file_type: string;
  file_size: number;
  chunk_count: number;
  status: 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

interface SearchResult {
  id: string;
  score: number;
  text: string;
  metadata: {
    title?: string;
    source?: string;
    userId: string;
    workspaceId: string;
    documentId: string;
    chunkIndex: number;
    totalChunks: number;
  };
}

export class PersonaVaultApi {
  private mastra: Mastra;
  private qdrantStore: QdrantVector;

  constructor() {
    this.mastra = new Mastra({
      workflows: {},
      agents: {},
      storage: new LibSQLStore({
        url: process.env.DATABASE_URL || "file:./mastra.db",
      }),
      logger: new PinoLogger({
        name: 'PersonaVault-API',
        level: 'info',
      }),
    });

    this.qdrantStore = new QdrantVector({
      url: process.env.QDRANT_URL || 'http://localhost:6333',
      apiKey: process.env.QDRANT_API_KEY,
    });
  }

  // =============================================
  // USER MANAGEMENT
  // =============================================

  async getUserProfile(userId: string): Promise<ApiResponse<UserProfile>> {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !user) {
        return {
          success: false,
          error: 'User not found',
        };
      }

      return {
        success: true,
        data: user,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get user profile: ${error}`,
      };
    }
  }

  async getUserWorkspaces(userId: string): Promise<ApiResponse<UserWorkspace[]>> {
    try {
      const { data: workspaces, error } = await supabase
        .from('user_workspaces')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        return {
          success: false,
          error: `Failed to get workspaces: ${error.message}`,
        };
      }

      return {
        success: true,
        data: workspaces || [],
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get workspaces: ${error}`,
      };
    }
  }

  async createWorkspace(userId: string, name: string, description?: string, is_default?: boolean): Promise<ApiResponse<UserWorkspace>> {
    try {
      if (is_default) {
        await supabase
          .from('user_workspaces')
          .update({ is_default: false })
          .eq('user_id', userId)
          .eq('is_default', true);
      }

      const { data: workspace, error } = await supabase
        .from('user_workspaces')
        .insert({
          user_id: userId,
          name,
          description,
          is_default: is_default || false,
        })
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: `Failed to create workspace: ${error.message}`,
        };
      }

      return {
        success: true,
        data: workspace,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to create workspace: ${error}`,
      };
    }
  }

  async getUserDocuments(userId: string, workspaceId?: string): Promise<ApiResponse<Document[]>> {
    try {
      let query = supabase
        .from('documents')
        .select('*')
        .eq('user_id', userId);

      if (workspaceId) {
        query = query.eq('workspace_id', workspaceId);
      }

      const { data: documents, error } = await query.order('created_at', { ascending: false });

      if (error) {
        return {
          success: false,
          error: `Failed to get documents: ${error.message}`,
        };
      }

      return {
        success: true,
        data: documents || [],
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get documents: ${error}`,
      };
    }
  }

  async uploadDocument(
    userId: string,
    workspaceId: string,
    fileBuffer: Buffer,
    fileName: string,
    fileType: string
  ): Promise<ApiResponse<Document>> {
    try {
      // 1. Create document record
      const { data: document, error: docError } = await supabase
        .from('documents')
        .insert({
          user_id: userId,
          workspace_id: workspaceId,
          title: path.basename(fileName, path.extname(fileName)),
          source_file: fileName,
          file_type: path.extname(fileName).toLowerCase(),
          file_size: fileBuffer.length,
          status: 'processing',
        })
        .select()
        .single();

      if (docError) {
        return {
          success: false,
          error: `Failed to create document record: ${docError.message}`,
        };
      }

      // 2. Save file to data directory
      const userDataDir = path.join('./data', userId);
      await fs.mkdir(userDataDir, { recursive: true });
      
      const filePath = path.join(userDataDir, fileName);
      await fs.writeFile(filePath, fileBuffer);

      // 3. Process document asynchronously
      this.processDocumentAsync(document.id, userId, workspaceId, filePath, fileName);

      return {
        success: true,
        data: document,
        message: 'Document uploaded successfully. Processing in background.',
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to upload document: ${error}`,
      };
    }
  }

  private async processDocumentAsync(
    documentId: string,
    userId: string,
    workspaceId: string,
    filePath: string,
    fileName: string
  ): Promise<void> {
    try {
      // Update status to processing
      await supabase
        .from('documents')
        .update({ status: 'processing' })
        .eq('id', documentId);

      // Initialize ingestion pipeline
      const pipeline = new MultiUserDocumentIngestionPipeline({
        userId,
        workspaceId,
        dataDir: path.dirname(filePath),
        chunkSize: 750,
        chunkOverlap: 100,
        batchSize: 3,
      });

      // Process the document
      const stats = await pipeline.ingestUserDocuments();

      // Update document status
      await supabase
        .from('documents')
        .update({ 
          status: stats.failedFiles.length > 0 ? 'failed' : 'completed',
          chunk_count: stats.totalChunks 
        })
        .eq('id', documentId);

      console.log(`Document ${fileName} processed for user ${userId}`);
    } catch (error) {
      console.error(`Failed to process document ${fileName}:`, error);
      
      // Update status to failed
      await supabase
        .from('documents')
        .update({ status: 'failed' })
        .eq('id', documentId);
    }
  }

  async deleteDocument(userId: string, documentId: string): Promise<ApiResponse<void>> {
    try {
      // Get document to verify ownership
      const { data: document, error: fetchError } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .eq('user_id', userId)
        .single();

      if (fetchError || !document) {
        return {
          success: false,
          error: 'Document not found or access denied',
        };
      }

      // Delete from Qdrant
      const indexName = `personavault-documents-${userId}`;
      const { data: chunks } = await supabase
        .from('document_chunks')
        .select('qdrant_vector_id')
        .eq('document_id', documentId);

      if (chunks && chunks.length > 0) {
        const vectorIds = chunks.map(chunk => chunk.qdrant_vector_id).filter(Boolean);
        if (vectorIds.length > 0) {
          await this.qdrantStore.deleteVector({
            indexName,
            id: vectorIds[0], // Delete first chunk as example
          });
        }
      }

      // Delete from Supabase (cascade will handle chunks)
      const { error: deleteError } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId)
        .eq('user_id', userId);

      if (deleteError) {
        return {
          success: false,
          error: `Failed to delete document: ${deleteError.message}`,
        };
      }

      return {
        success: true,
        message: 'Document deleted successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to delete document: ${error}`,
      };
    }
  }

  // =============================================
  // SEARCH & RETRIEVAL
  // =============================================

  async searchDocuments(
    userId: string,
    query: string,
    workspaceId?: string,
    filters?: any,
    topK: number = 10
  ): Promise<ApiResponse<SearchResult[]>> {
    try {
      // Generate query embedding
      const { embedding } = await embed({
        model: openai.embedding('text-embedding-3-small'),
        value: query,
      });

      // Search user-specific index
      const indexName = `personavault-documents-${userId}`;
      const searchResults = await this.qdrantStore.query({
        indexName,
        queryVector: embedding,
        topK,
        filter: workspaceId ? {
          workspaceId: { $eq: workspaceId }
        } : undefined,
      });

      // Transform results
      const results: SearchResult[] = searchResults.map(result => ({
        id: result.id,
        score: result.score,
        text: result.metadata?.text || '',
        metadata: {
          title: result.metadata?.title,
          source: result.metadata?.source,
          userId: result.metadata?.userId,
          workspaceId: result.metadata?.workspaceId,
          documentId: result.metadata?.documentId,
          chunkIndex: result.metadata?.chunkIndex,
          totalChunks: result.metadata?.totalChunks,
        },
      }));

      return {
        success: true,
        data: results,
      };
    } catch (error) {
      return {
        success: false,
        error: `Search failed: ${error}`,
      };
    }
  }

  // =============================================
  // CHAT & LLM INTERACTION
  // =============================================

  // =============================================
  // ANALYTICS & STATISTICS
  // =============================================

  async getUserStats(userId: string): Promise<ApiResponse<any>> {
    try {
      // Get document count
      const { count: documentCount } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Get chunk count
      const { count: chunkCount } = await supabase
        .from('document_chunks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Get workspace count
      const { count: workspaceCount } = await supabase
        .from('user_workspaces')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      return {
        success: true,
        data: {
          documents: documentCount || 0,
          chunks: chunkCount || 0,
          workspaces: workspaceCount || 0,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get user stats: ${error}`,
      };
    }
  }
}

export const personavaultApi = new PersonaVaultApi(); 