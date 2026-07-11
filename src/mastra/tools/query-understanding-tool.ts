import { openai } from '@ai-sdk/openai';
import { createTool } from '@mastra/core/tools';
import { generateObject } from 'ai';
import { z } from 'zod';
import { SearchFilterSchema } from '../../types/personavault-types';

const gpt4 = openai('gpt-4.1');

export const queryUnderstandingTool = createTool({
  id: 'understand-query',
  description: 'Parse user query and extract structured search filters and semantic query',
  inputSchema: z.object({
    userQuery: z.string().describe('The natural language query from the user'),
  }),
  outputSchema: z.object({
    semanticQuery: z.string().describe('Refined semantic search query'),
    filters: SearchFilterSchema.optional().describe('Structured filters extracted from the query'),
    queryIntent: z.enum(['search', 'filter', 'compare', 'list', 'count']).describe('The intent of the query'),
    resultScope: z.enum(['top', 'all']).describe('Whether user wants top results or all matching results'),
    searchMode: z.enum(['semantic', 'filter', 'hybrid']).describe('Search mode: semantic (similarity first), filter (filter first), or hybrid (balanced)'),
    confidence: z.number().min(0).max(1).describe('Confidence in the query understanding'),
  }),
  execute: async ({ context }) => {
    const { userQuery } = context;
    
    try {
      const result = await generateObject({
        model: gpt4,
        system: `You are an expert at understanding natural language queries for a personal data vault called PersonaVault. Your job is to:

1.  Extract a clean semantic search query that focuses on the core search intent.
2.  Identify and extract structured filters for precise matching (tags, source, date ranges).
3.  Determine the user's intent.

## GUIDELINES:

**For semantic queries:**
-   Focus on the main subject of the user's query.
-   Remove any filter-related keywords (e.g., "from last month", "with tag 'work'").

**For filters:**
-   Extract tags, sources, and date ranges.
-   For date ranges, if the user says "last month", calculate the approximate start and end dates. Today is ${new Date().toDateString()}.

**For search strategy:**
-   "filter" mode: When the query is primarily about filtering (e.g., "show me all notes tagged 'work'").
-   "semantic" mode: When the query is about a concept (e.g., "what were my main takeaways from the conference?").
-   "hybrid" mode: When the query combines both (e.g., "search for notes about project X from last year").

## RESULT SCOPE:
-   "all": User wants comprehensive results (uses words like "all", "every", "list", "show me all").
-   "top": User wants best matches (uses words like "best", "top", "find", or doesn't specify).

## EXAMPLE:

Query: "Show me all notes about the 'PersonaVault' project from last month with the tag 'urgent'"
-   semanticQuery: "PersonaVault project"
-   filters: { tags: ["urgent"], dateRange: { start: "...", end: "..." } }
-   queryIntent: "list"
-   resultScope: "all"
-   searchMode: "filter"`,
        prompt: `Parse this search query for PersonaVault: "${userQuery}"`,
        schema: z.object({
          semanticQuery: z.string().describe('Core semantic search query.'),
          filters: SearchFilterSchema.optional().describe('Structured filters for tags, source, or dateRange.'),
          queryIntent: z.enum(['search', 'filter', 'compare', 'list', 'count']).describe('Primary intent'),
          resultScope: z.enum(['top', 'all']).describe('Whether user wants top results or all matching results'),
          searchMode: z.enum(['semantic', 'filter', 'hybrid']).describe('Search mode based on query focus'),
          confidence: z.number().min(0).max(1).describe('Confidence score 0-1'),
          reasoning: z.string().describe('Brief explanation of the extraction strategy.'),
        }),
      });

      console.log('🧠 Query Understanding Result:', JSON.stringify({
        userQuery,
        semanticQuery: result.object.semanticQuery,
        filters: result.object.filters,
        resultScope: result.object.resultScope,
        searchMode: result.object.searchMode,
        reasoning: result.object.reasoning
      }, null, 2));

      return {
        semanticQuery: result.object.semanticQuery,
        filters: result.object.filters,
        queryIntent: result.object.queryIntent,
        resultScope: result.object.resultScope,
        searchMode: result.object.searchMode,
        confidence: result.object.confidence,
      };
    } catch (error) {
      console.error('Query understanding error:', error);
      
      return {
        semanticQuery: userQuery,
        filters: undefined,
        queryIntent: 'search' as const,
        resultScope: 'top' as const,
        searchMode: 'hybrid' as const,
        confidence: 0.5,
      };
    }
  },
});
