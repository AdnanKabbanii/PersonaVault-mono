/**
 * Local Reranker Client
 * Calls the Python-based local reranker service
 */

export interface RerankDocument {
  content: string;
  metadata: Record<string, any>;
}

export interface RerankResult {
  [x: string]: any;
  content: string;
  metadata: Record<string, any>;
  score: number;
  original_index: number;
}

export interface RerankResponse {
  success: boolean;
  results: RerankResult[];
  total_processed: number;
  returned: number;
  error?: string;
}

export class LocalRerankerClient {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl: string = 'http://127.0.0.1:5000', timeout: number = 60000) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(10000)
      });
      return response.ok;
    } catch (error) {
      console.error('Local reranker health check failed:', error);
      return false;
    }
  }

  async rerank(
    query: string,
    documents: RerankDocument[],
    topK: number = 10
  ): Promise<RerankResult[]> {
    try {
      const response = await fetch(`${this.baseUrl}/rerank`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          documents,
          top_k: topK
        }),
        signal: AbortSignal.timeout(this.timeout)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: RerankResponse = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Reranking failed');
      }

      return result.results;
    } catch (error) {
      console.error('Local reranker call failed:', error);
      throw error;
    }
  }

  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.recommended_models || [];
    } catch (error) {
      console.error('Failed to get available models:', error);
      return [];
    }
  }
}

// Singleton instance
export const localReranker = new LocalRerankerClient();

// Helper function to check if local reranker is available
export async function isLocalRerankerAvailable(): Promise<boolean> {
  return await localReranker.healthCheck();
} 