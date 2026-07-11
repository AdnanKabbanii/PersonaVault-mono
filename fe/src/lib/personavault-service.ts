export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: Date;
  status: 'uploading' | 'processing' | 'completed' | 'error';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface UserWorkspace {
  id: string;
  name: string;
  description?: string;
  is_default: boolean;
}

export class PersonaVaultService {
  private static instance: PersonaVaultService;
  private baseUrl: string;

  private constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4112';
  }

  static getInstance(): PersonaVaultService {
    if (!PersonaVaultService.instance) {
      PersonaVaultService.instance = new PersonaVaultService();
    }
    return PersonaVaultService.instance;
  }

  /**
   * Upload a document to the backend
   */
  async uploadDocument(
    file: File,
    userId: string,
    workspaceId: string
  ): Promise<UploadedFile> {
    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('workspaceId', workspaceId);

      const response = await fetch(`${this.baseUrl}/api/users/${userId}/documents/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Upload failed');
      }

      // Convert API response to UploadedFile format
      return {
        id: result.data.id,
        name: result.data.title || file.name,
        size: result.data.file_size,
        type: result.data.file_type,
        uploadedAt: new Date(result.data.created_at),
        status: result.data.status === 'completed' ? 'completed' : 'processing'
      };
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }

  async ensureDefaultWorkspace(userId: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/api/users/${userId}/workspaces`);

      if (!response.ok) {
        throw new Error(`Failed to get workspaces: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to get workspaces');
      }

      const defaultWorkspace = result.data.find((w: UserWorkspace) => w.is_default);

      if (defaultWorkspace) {
        return defaultWorkspace.id;
      }

      throw new Error('Default workspace not found');
    } catch (error) {
      console.error('Workspace error:', error);
      throw error;
    }
  }

  async getUserDocuments(userId: string): Promise<UploadedFile[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/users/${userId}/documents`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get documents: ${response.status} - ${errorText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to get documents');
      }

      return result.data.map((doc: any) => ({
        id: doc.id,
        name: doc.title,
        size: doc.file_size,
        type: doc.file_type,
        uploadedAt: new Date(doc.created_at),
        status: doc.status === 'completed' ? 'completed' : 
                doc.status === 'processing' ? 'processing' : 'error'
      }));
    } catch (error) {
      console.error('Get documents error:', error);
      // Return empty array instead of throwing to prevent dashboard crash
      return [];
    }
  }

  /**
   * Get chat history for a user
   */
  async getChatHistory(userId: string, threadId?: string): Promise<ChatMessage[]> {
    try {
      // For now, return empty array - chat history will be implemented later
      return [];
    } catch (error) {
      console.error('Get chat history error:', error);
      return [];
    }
  }

  /**
   * Send a chat message and get AI response
   */
  async sendChatMessage(message: string, userId: string, threadId?: string): Promise<ChatMessage> {
    try {
      const response = await fetch(`${this.baseUrl}/api/users/${userId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          conversationId: threadId,
          context: {
            includeDocuments: true,
            includeConversationHistory: true,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Chat failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Chat failed');
      }

      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: result.data.response || 'Sorry, I encountered an error processing your request.',
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
}

export const personavaultService = PersonaVaultService.getInstance();
