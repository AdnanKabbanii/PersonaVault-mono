import { openai } from '@ai-sdk/openai';
import { createTool } from '@mastra/core/tools';
import { QdrantVector } from '@mastra/qdrant';
import { rerank } from '@mastra/rag';
import { embed } from 'ai';
import { z } from 'zod';
import { SearchFilterSchema } from '../../types/personavault-types';

function createQdrantStore() {
  return new QdrantVector({
    url: process.env.QDRANT_URL || 'http://localhost:6333',
    apiKey: process.env.QDRANT_API_KEY,
  });
}

const qdrantStore = createQdrantStore();

function createCaseInsensitiveRegex(value: string): string {
  const caseInsensitivePattern = value
    .split('')
    .map(char => {
      if (/[a-zA-Z]/.test(char)) {
        return `[${char.toLowerCase()}${char.toUpperCase()}]`;
      }
      return char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    })
    .join('');

  return `.*${caseInsensitivePattern}.*`;
}

function transformFiltersForQdrant(filters: z.infer<typeof SearchFilterSchema> | undefined): Record<string, any> | undefined {
  if (!filters) return undefined;

  const mastraFilters: Record<string, any> = {};

  Object.entries(filters).forEach(([key, value]) => {
    switch (key) {
      case 'tags':
        if (Array.isArray(value) && value.length > 0) {
          mastraFilters['tags'] = { $in: value };
        } else if (typeof value === 'string') {
          mastraFilters['tags'] = { $in: [value] };
        }
        break;

      case 'source':
        if (typeof value === 'string') {
          mastraFilters['source'] = { $regex: createCaseInsensitiveRegex(value) };
        }
        break;

      case 'dateRange':
        if (typeof value === 'object' && value !== null) {
          const rangeFilter: any = {};
          if ((value as any).start !== undefined) rangeFilter.$gte = (value as any).start;
          if ((value as any).end !== undefined) rangeFilter.$lte = (value as any).end;
          if (Object.keys(rangeFilter).length > 0) {
            mastraFilters['createdAt'] = rangeFilter;
          }
        }
        break;
    }
  });

  return Object.keys(mastraFilters).length > 0 ? mastraFilters : undefined;
}

export const documentSearchTool = createTool({
  id: 'document-search',
  description: 'Performs hybrid search (semantic + filtering) on documents with optional re-ranking',
  inputSchema: z.object({
    query: z.string().describe('The semantic query for searching documents'),
    userId: z.string().optional().describe('User ID for multi-user support'),
    workspaceId: z.string().optional().describe('Workspace ID for multi-user support'),
    filters: SearchFilterSchema.optional().describe('Structured filters for precise matching'),
    topK: z.number().default(20).describe('Number of results to retrieve before re-ranking'),
    useReranking: z.boolean().default(true).describe('Whether to apply re-ranking to search results'),
    searchMode: z.enum(['semantic', 'filter', 'hybrid']).default('hybrid').describe('The search mode to use'),
  }),
  outputSchema: z.object({
    results: z.array(z.object({
      id: z.string(),
      score: z.number(),
      text: z.string(),
      metadata: z.record(z.any()),
    })),
    totalFound: z.number(),
    searchMode: z.string(),
  }),
  execute: async ({ context, runtimeContext }) => {
    const { query, userId: contextUserId, workspaceId, filters, topK, useReranking, searchMode } = context;
    const userId = contextUserId || runtimeContext?.get('userId');
    let searchResults: any[] = [];
    const qdrantFilters = transformFiltersForQdrant(filters);

    if (!userId) {
      throw new Error('User ID is required for document search');
    }

    try {
      const userQdrantStore = createQdrantStore();
      let indexName: string;

      if (userId) {
        indexName = `personavault-documents-${userId}`;
      } else {
        const indexes = await userQdrantStore.listIndexes();
        if (indexes.length === 0) {
          throw new Error('No Qdrant indexes found');
        }
        const personavaultIndex = indexes.find(idx => idx.startsWith('personavault-documents-'));
        indexName = personavaultIndex || indexes[0];
      }

      if (searchMode === 'filter') {
        const results = await userQdrantStore.query({
          indexName,
          queryVector: new Array(1536).fill(0),
          filter: qdrantFilters,
          topK: 500,
        });
        searchResults = results.map(r => ({ ...r.metadata, score: r.score, id: r.id, text: r.metadata?.text || '' }));
      } else {
        const { embedding } = await embed({
          model: openai.embedding('text-embedding-3-small'),
          value: query,
        });

        const results = await userQdrantStore.query({
          indexName,
          queryVector: embedding,
          filter: qdrantFilters,
          topK,
          includeVector: false,
        });
        searchResults = results.map(r => ({ ...r.metadata, score: r.score, id: r.id, text: r.metadata?.text || '' }));
      }
    } catch (error) {
      throw new Error(`Document search failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    let finalResults = searchResults;
    if (useReranking && finalResults.length > 0) {
      try {
        const reranked = await rerank(
          finalResults,
          query,
          openai('gpt-4o-mini'),
          { topK: Math.min(finalResults.length, 10) }
        );

        finalResults = reranked
          .filter(r => r.score > 0.1)
          .map(r => ({
            ...r.result,
            score: r.score,
          }));
      } catch (error) {
        console.warn('Reranking failed, using original results:', error);
      }
    }

    return {
      results: finalResults,
      totalFound: finalResults.length,
      searchMode,
    };
  },
});
