export interface ToolCall {
  id: string;
  name: string;
  args: any;
  result?: any;
  status: 'pending' | 'completed' | 'error';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  toolCalls?: ToolCall[];
}

export const testApiConnection = async (): Promise<boolean> => {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_MASTRA_API_URL || 'http://localhost:4112';
    const response = await fetch(`${baseUrl}/api/agents`);
    return response.ok;
  } catch (error) {
    console.warn('API connection test failed:', error);
    return false;
  }
};

export const getPersonaVaultAgent = async () => {
  const baseUrl = process.env.NEXT_PUBLIC_MASTRA_API_URL || 'http://localhost:4112';
  const response = await fetch(`${baseUrl}/api/agents`);
  if (!response.ok) {
    throw new Error(`Failed to fetch agents: ${response.statusText}`);
  }
  const agents = await response.json();
  const personaVaultAgent = agents.personaVaultAgent;
  if (!personaVaultAgent) {
    throw new Error('PersonaVault Agent not found');
  }
  return personaVaultAgent;
};

function parseStreamLine(
  line: string,
  onChunk: (chunk: string) => void,
  toolCalls: ToolCall[],
  onToolCall?: (toolCall: ToolCall) => void
): string {
  let text = '';

  if (line.startsWith('0:')) {
    const textMatch = line.match(/^0:"(.*)"/);
    if (textMatch) {
      text = textMatch[1];
      onChunk(text);
    }
  } else if (line.startsWith('9:')) {
    const toolCallData = JSON.parse(line.slice(2));
    const toolCall: ToolCall = {
      id: toolCallData.toolCallId,
      name: toolCallData.toolName,
      args: toolCallData.args,
      status: 'pending',
    };
    toolCalls.push(toolCall);
    onToolCall?.(toolCall);
  } else if (line.startsWith('a:')) {
    const toolResult = JSON.parse(line.slice(2));
    const toolCall = toolCalls.find(tc => tc.id === toolResult.toolCallId);
    if (toolCall) {
      toolCall.result = toolResult.result;
      toolCall.status = 'completed';
      onToolCall?.(toolCall);
    }
    if (toolResult.result && typeof toolResult.result === 'string') {
      text = toolResult.result;
      onChunk(toolResult.result);
    }
  } else if (line.startsWith('data: ')) {
    const jsonData = line.slice(6);
    if (jsonData !== '[DONE]') {
      const data = JSON.parse(jsonData);
      if (data.type === 'text-delta' && data.payload?.delta) {
        text = data.payload.delta;
        onChunk(text);
      } else if (data.type === 'text' && data.payload?.text) {
        text = data.payload.text;
        onChunk(text);
      } else if (data.text) {
        text = data.text;
        onChunk(text);
      } else if (typeof data === 'string') {
        text = data;
        onChunk(data);
      }
    }
  } else {
    try {
      const data = JSON.parse(line);
      if (data.text) {
        text = data.text;
        onChunk(data.text);
      }
    } catch {
      if (line.length > 10 && !line.startsWith('{') && !line.includes('toolCallId')) {
        text = line;
        onChunk(line);
      }
    }
  }

  return text;
}

export class MastraChatService {
  private static instance: MastraChatService;
  private baseUrl: string;

  private constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_MASTRA_API_URL || 'http://localhost:4112';
  }

  static getInstance(): MastraChatService {
    if (!MastraChatService.instance) {
      MastraChatService.instance = new MastraChatService();
    }
    return MastraChatService.instance;
  }

  async sendChatMessage(message: string, userId: string): Promise<ChatMessage> {
    try {
      const agentId = 'personaVaultAgent';

      const resp = await fetch(`${this.baseUrl}/api/agents/${agentId}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: message }],
          memory: { thread: userId, resource: userId },
          runtimeContext: { userId },
          maxSteps: 5,
          toolChoice: 'auto',
        }),
      });

      if (!resp.ok) {
        const text = await resp.text().catch(() => '');
        throw new Error(`Agent generate failed: ${resp.status} ${resp.statusText} ${text}`);
      }

      const data = await resp.json().catch(() => ({} as any));
      const content = data?.text || data?.content || data?.message || 'Sorry, I could not generate a response.';

      return {
        id: Date.now().toString(),
        role: 'assistant',
        content,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Chat error:', error);
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
    }
  }

  async sendChatMessageStream(
    message: string,
    userId: string,
    onChunk: (chunk: string) => void,
    onToolCall?: (toolCall: ToolCall) => void
  ): Promise<ChatMessage> {
    try {
      const agentId = 'personaVaultAgent';

      const resp = await fetch(`${this.baseUrl}/api/agents/${agentId}/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: message }],
          memory: { thread: userId, resource: userId },
          runtimeContext: { userId },
          maxSteps: 5,
          toolChoice: 'auto',
        }),
      });

      if (!resp.ok) {
        const text = await resp.text().catch(() => '');
        throw new Error(`Agent stream failed: ${resp.status} ${resp.statusText} ${text}`);
      }

      const reader = resp.body?.getReader();
      if (!reader) {
        throw new Error('Failed to get stream reader');
      }

      const decoder = new TextDecoder();
      let fullText = '';
      let allChunks = '';
      const toolCalls: ToolCall[] = [];

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          allChunks += chunk;

          for (const line of chunk.split('\n')) {
            if (line.trim() === '') continue;
            try {
              fullText += parseStreamLine(line, onChunk, toolCalls, onToolCall);
            } catch (parseError) {
              console.warn('Failed to parse stream line:', parseError);
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      if (!fullText.trim()) {
        const rawText = allChunks.split('\n').find((line: string) =>
          line.length > 50 &&
          !line.startsWith('9:') &&
          !line.startsWith('a:') &&
          !line.startsWith('f:') &&
          !line.startsWith('e:') &&
          !line.startsWith('d:') &&
          !line.includes('toolCallId')
        );

        if (rawText) {
          fullText = rawText;
          onChunk(rawText);
        }
      }

      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: fullText || 'Sorry, I could not generate a response.',
        timestamp: new Date(),
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      };
    } catch (error) {
      console.error('Streaming chat error:', error);
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
    }
  }

  async getChatHistory(_userId: string): Promise<ChatMessage[]> {
    return [];
  }
}

export const mastraChatService = MastraChatService.getInstance();
