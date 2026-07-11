import { openai } from '@ai-sdk/openai';
import { QdrantVector } from '@mastra/qdrant';
import { embedMany } from 'ai';
import { randomUUID } from 'crypto';
import fs from 'fs/promises';
import mammoth from 'mammoth';
import pLimit from 'p-limit';
import path from 'path';
import pdfParse from 'pdf-parse';
import { encoding_for_model } from 'tiktoken';
import WordExtractor from 'word-extractor';
import { Document, supabase } from '../config/supabase';
import { DocumentMetadata, DocumentChunk as PersonaVaultChunk } from '../types/personavault-types';

// Initialize tokenizer for accurate token counting
const tokenizer = encoding_for_model('gpt-4');

// Rate limiting for embedding API calls
const embeddingLimit = pLimit(5);

// Qdrant configuration - use cloud settings by default
const qdrantStore = new QdrantVector({
  url: process.env.QDRANT_URL || 'http://localhost:6333',
  apiKey: process.env.QDRANT_API_KEY,
});

// Supported file extensions
const SUPPORTED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.txt', '.md'];

export interface MultiUserIngestionConfig {
  userId: string;
  workspaceId: string;
  dataDir: string;
  chunkSize: number;
  chunkOverlap: number;
  batchSize: number;
}

export interface MultiUserIngestionStats {
  totalFiles: number;
  processedFiles: number;
  failedFiles: string[];
  totalChunks: number;
  totalTokens: number;
  processingTime: number;
}

export class MultiUserDocumentIngestionPipeline {
  private config: MultiUserIngestionConfig;
  private stats: MultiUserIngestionStats;

  constructor(config: MultiUserIngestionConfig) {
    this.config = {
      dataDir: './data',
      chunkSize: 750,
      chunkOverlap: 100,
      batchSize: 3,
      ...config,
    };

    this.stats = {
      totalFiles: 0,
      processedFiles: 0,
      failedFiles: [],
      totalChunks: 0,
      totalTokens: 0,
      processingTime: 0,
    };
  }

  async ingestUserDocuments(): Promise<MultiUserIngestionStats> {
    const startTime = Date.now();
    console.log(`Starting ingestion for user: ${this.config.userId}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    try {
      // Verify user and workspace exist
      await this.verifyUserAndWorkspace();

      // Ensure Qdrant index exists with user-specific naming
      await this.ensureQdrantIndex();

      // Get all supported document files from data directories
      const docFiles = await this.findAllDocFiles();
      this.stats.totalFiles = docFiles.length;

      console.log(`Found ${docFiles.length} document files to process`);

      // Process files in batches to avoid overwhelming the system
      const processingBatches = this.chunkArray(docFiles, this.config.batchSize);

      for (const [batchIndex, batch] of processingBatches.entries()) {
        console.log(`Processing batch ${batchIndex + 1}/${processingBatches.length} (${batch.length} files)`);
        
        const batchPromises = batch.map(filePath => 
          this.processSingleDocument(filePath)
        );
        
        await Promise.all(batchPromises);

        // Small delay between batches to prevent overwhelming APIs
        if (batchIndex < processingBatches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      this.stats.processingTime = Date.now() - startTime;
      
      console.log('Ingestion completed');
      this.logStats();

      return this.stats;
    } catch (error) {
      console.error('Ingestion failed:', error);
      throw error;
    }
  }

  private async verifyUserAndWorkspace(): Promise<void> {
    try {
      // Verify user exists
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', this.config.userId)
        .single();

      if (userError || !user) {
        throw new Error(`User ${this.config.userId} not found`);
      }

      // Verify workspace exists and belongs to user
      const { data: workspace, error: workspaceError } = await supabase
        .from('user_workspaces')
        .select('*')
        .eq('id', this.config.workspaceId)
        .eq('user_id', this.config.userId)
        .single();

      if (workspaceError || !workspace) {
        throw new Error(`Workspace ${this.config.workspaceId} not found or doesn't belong to user`);
      }

      console.log(`Verified user: ${user.email} and workspace: ${workspace.name}`);
    } catch (error) {
      console.error('User/workspace verification failed:', error);
      throw error;
    }
  }

  private async ensureQdrantIndex(): Promise<void> {
    try {
      const indexName = `personavault-documents-${this.config.userId}`;
      const indexes = await qdrantStore.listIndexes();
      
      if (!indexes.includes(indexName)) {
        console.log(`Creating Qdrant index for user ${this.config.userId}...`);
        await qdrantStore.createIndex({
          indexName,
          dimension: 1536, // text-embedding-3-small dimension
          metric: 'cosine',
        });
        console.log('Qdrant index created');
      } else {
        console.log('Qdrant index already exists');
      }
    } catch (error) {
      console.error('Failed to setup Qdrant index:', error);
      throw error;
    }
  }

  private async findAllDocFiles(): Promise<string[]> {
    const docFiles: string[] = [];
    
    try {
      const entries = await fs.readdir(this.config.dataDir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const subDir = path.join(this.config.dataDir, entry.name);
          const subFiles = await fs.readdir(subDir);
          
          for (const file of subFiles) {
            const ext = path.extname(file).toLowerCase();
            if (SUPPORTED_EXTENSIONS.includes(ext)) {
              docFiles.push(path.join(subDir, file));
            }
          }
        } else {
          const ext = path.extname(entry.name).toLowerCase();
          if (SUPPORTED_EXTENSIONS.includes(ext)) {
            docFiles.push(path.join(this.config.dataDir, entry.name));
          }
        }
      }
    } catch (error) {
      console.error('Failed to scan data directory:', error);
      throw error;
    }

    return docFiles;
  }

  private async extractTextFromFile(filePath: string): Promise<string> {
    const ext = path.extname(filePath).toLowerCase();
    const fileBuffer = await fs.readFile(filePath);

    switch (ext) {
      case '.pdf':
        const pdfData = await pdfParse(fileBuffer);
        return pdfData.text;

      case '.docx':
        const docxResult = await mammoth.extractRawText({ buffer: fileBuffer });
        return docxResult.value;

      case '.doc':
        const extractor = new WordExtractor();
        const extracted = await extractor.extract(fileBuffer);
        return extracted.getBody();

      case '.txt':
      case '.md':
        return fileBuffer.toString('utf-8');

      default:
        throw new Error(`Unsupported file type: ${ext}`);
    }
  }

  private async processSingleDocument(filePath: string): Promise<void> {
    const fileName = path.basename(filePath);
    
    try {
      console.log(`Processing document: ${fileName}`);
      
      // Extract text from file
      const docText = await this.extractTextFromFile(filePath);
      console.log(`Extracted ${docText.length} characters from ${fileName}`);

      // Extract metadata
      const metadata = await this.extractMetadata(docText, filePath);
      console.log(`🔍 Extracted metadata for ${fileName}: ${metadata.title || 'Unknown'}`);

      // Create document record in Supabase
      const documentRecord = await this.createDocumentRecord(fileName, metadata, docText.length);
      console.log(`📋 Created document record: ${documentRecord.id}`);

      // Chunk the document
      const chunks = await this.chunkDocument(docText, metadata, fileName);
      console.log(`Created ${chunks.length} chunks for ${fileName}`);

      // Update document record with chunk count
      await this.updateDocumentChunkCount(documentRecord.id, chunks.length);

      // Embed and store chunks
      await this.embedAndStoreChunks(chunks, documentRecord.id);
      console.log(`💾 Stored ${chunks.length} chunks for ${fileName}`);

      // Update document status to completed
      await this.updateDocumentStatus(documentRecord.id, 'completed');

      this.stats.processedFiles++;
      this.stats.totalChunks += chunks.length;
      
    } catch (error) {
      console.error(`Failed to process ${fileName}:`, error);
      this.stats.failedFiles.push(fileName);
    }
  }

  private async extractMetadata(docText: string, filePath: string): Promise<DocumentMetadata> {
    const fileName = path.basename(filePath);
    const fileStats = await fs.stat(filePath);
    
    return {
      title: path.basename(fileName, path.extname(fileName)).replace(/_/g, ' '),
      source: fileName,
      createdAt: fileStats.ctime.toISOString(),
      tags: [],
      autogeneratedSummary: docText.substring(0, 200) + "...",
      extra: {},
    };
  }

  private async createDocumentRecord(fileName: string, metadata: DocumentMetadata, fileSize: number): Promise<Document> {
    const { data, error } = await supabase
      .from('documents')
      .insert({
        user_id: this.config.userId,
        workspace_id: this.config.workspaceId,
        title: metadata.title,
        source_file: fileName,
        file_type: path.extname(fileName).toLowerCase(),
        file_size: fileSize,
        chunk_count: 0,
        status: 'processing',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create document record: ${error.message}`);
    }

    return data;
  }

  private async updateDocumentChunkCount(documentId: string, chunkCount: number): Promise<void> {
    const { error } = await supabase
      .from('documents')
      .update({ chunk_count: chunkCount })
      .eq('id', documentId);

    if (error) {
      console.error(`Failed to update document chunk count: ${error.message}`);
    }
  }

  private async updateDocumentStatus(documentId: string, status: 'processing' | 'completed' | 'failed'): Promise<void> {
    const { error } = await supabase
      .from('documents')
      .update({ status })
      .eq('id', documentId);

    if (error) {
      console.error(`Failed to update document status: ${error.message}`);
    }
  }

  private async chunkDocument(docText: string, metadata: DocumentMetadata, fileName: string): Promise<PersonaVaultChunk[]> {
    const chunks: PersonaVaultChunk[] = [];
    const sentences = docText.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    let currentChunk = '';
    let currentTokens = 0;
    let chunkIndex = 0;

    for (const sentence of sentences) {
      const sentenceTokens = tokenizer.encode(sentence).length;
      
      if (currentTokens + sentenceTokens > this.config.chunkSize) {
        if (currentChunk.length > 0) {
          chunks.push({
            id: randomUUID(),
            text: currentChunk.trim(),
            metadata: {
              ...metadata,
              sourceFile: fileName,
              chunkIndex: chunkIndex++,
              totalChunks: 0 // Will be updated later
            }
          });
        }
        
        const overlapText = this.getOverlapText(currentChunk, this.config.chunkOverlap);
        currentChunk = overlapText + sentence + '.';
        currentTokens = tokenizer.encode(currentChunk).length;
        
      } else {
        currentChunk += sentence + '.';
        currentTokens += sentenceTokens;
      }
    }

    if (currentChunk.length > 0) {
      chunks.push({
        id: randomUUID(),
        text: currentChunk.trim(),
        metadata: {
          ...metadata,
          sourceFile: fileName,
          chunkIndex: chunkIndex++,
          totalChunks: 0 // Will be updated later
        }
      });
    }
    
    // Update total chunks count in each chunk's metadata
    const totalChunks = chunks.length;
    return chunks.map(chunk => ({
      ...chunk,
      metadata: { ...chunk.metadata, totalChunks }
    }));
  }

  private getOverlapText(text: string, overlapSize: number): string {
    const tokens = tokenizer.encode(text);
    if (tokens.length <= overlapSize) return text;
    
    const overlapTokens = tokens.slice(-overlapSize);
    return new TextDecoder().decode(tokenizer.decode(overlapTokens));
  }

  private async embedAndStoreChunks(chunks: PersonaVaultChunk[], documentId: string): Promise<void> {
    const embeddingBatches = this.chunkArray(chunks, 50); // Embed in smaller batches
    const indexName = `personavault-documents-${this.config.userId}`;

    for (const batch of embeddingBatches) {
      const texts = batch.map(chunk => chunk.text);
      
      const embeddingResult = await embeddingLimit(() => 
        embedMany({
          model: openai.embedding('text-embedding-3-small'),
          values: texts,
        })
      );

      // Store in Qdrant with user-specific metadata
      const points = batch.map((chunk, i) => ({
        id: chunk.id,
        vector: embeddingResult.embeddings[i],
        payload: {
          ...chunk,
          userId: this.config.userId,
          workspaceId: this.config.workspaceId,
          documentId: documentId,
        },
      }));

      await qdrantStore.upsert({
        indexName,
        vectors: points.map(p => p.vector),
        metadata: points.map(p => p.payload),
        ids: points.map(p => p.id),
      });

      // Store chunk records in Supabase
      await this.storeChunkRecords(batch, documentId, embeddingResult.embeddings);

      this.stats.totalTokens += texts.join(' ').length; // Rough token count
    }
  }

  private async storeChunkRecords(chunks: PersonaVaultChunk[], documentId: string, embeddings: number[][]): Promise<void> {
    const chunkRecords = chunks.map((chunk, index) => ({
      document_id: documentId,
      user_id: this.config.userId,
      workspace_id: this.config.workspaceId,
      chunk_index: chunk.metadata.chunkIndex,
      total_chunks: chunk.metadata.totalChunks,
      text_content: chunk.text,
      token_count: tokenizer.encode(chunk.text).length,
      qdrant_vector_id: chunk.id,
    }));

    const { error } = await supabase
      .from('document_chunks')
      .insert(chunkRecords);

    if (error) {
      console.error(`Failed to store chunk records: ${error.message}`);
    }
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private logStats(): void {
    console.log('\nIngestion Statistics:');
    console.log(`Total files found: ${this.stats.totalFiles}`);
    console.log(`Successfully processed: ${this.stats.processedFiles}`);
    console.log(`Failed files: ${this.stats.failedFiles.length}`);
    console.log(`Total chunks created: ${this.stats.totalChunks}`);
    console.log(`Total tokens processed: ${this.stats.totalTokens}`);
    console.log(`Processing time: ${(this.stats.processingTime / 1000).toFixed(2)}s`);
    
    if (this.stats.failedFiles.length > 0) {
      console.log('\nFailed files:');
      this.stats.failedFiles.forEach(file => console.log(`  - ${file}`));
    }
  }
} 