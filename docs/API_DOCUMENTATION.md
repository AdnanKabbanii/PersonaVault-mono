# PersonaVault API Documentation

## Overview

The PersonaVault API provides a comprehensive REST API for multi-user document management, search, and AI-powered chat functionality. All endpoints require a `userId` to ensure proper user isolation and data security.

**Base URL**: `http://localhost:4111/api`

## Authentication

Currently, the API uses user ID validation for multi-tenancy.

## API Endpoints

### Health Check

#### GET /health
Check if the API is running.

**Response:**
```json
{
  "success": true,
  "message": "PersonaVault API is running",
  "timestamp": "2025-01-08T19:30:00.000Z",
  "version": "1.0.0"
}
```

---

### User Management

#### GET /api/users/:userId/profile
Get user profile information.

**Parameters:**
- `userId` (path): User UUID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@example.com",
    "full_name": "John Doe",
    "avatar_url": "https://example.com/avatar.jpg",
    "created_at": "2025-01-08T19:30:00.000Z",
    "updated_at": "2025-01-08T19:30:00.000Z"
  }
}
```

#### GET /api/users/:userId/workspaces
Get all workspaces for a user.

**Parameters:**
- `userId` (path): User UUID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "766da9a5-a11f-4945-9520-fbd93dafcb10",
      "name": "Default Workspace",
      "description": "Auto-created default workspace",
      "is_default": true,
      "created_at": "2025-01-08T19:30:00.000Z",
      "updated_at": "2025-01-08T19:30:00.000Z"
    }
  ]
}
```

#### POST /api/users/:userId/workspaces
Create a new workspace for a user.

**Parameters:**
- `userId` (path): User UUID

**Body:**
```json
{
  "name": "Project Alpha",
  "description": "Documents for Project Alpha"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "987fcdeb-51a2-4b3c-8d5e-6f7a8b9c0d1e",
    "name": "Project Alpha",
    "description": "Documents for Project Alpha",
    "is_default": false,
    "created_at": "2025-01-08T19:30:00.000Z",
    "updated_at": "2025-01-08T19:30:00.000Z"
  }
}
```

---

### Document Management

#### GET /api/users/:userId/documents
Get all documents for a user, optionally filtered by workspace.

**Parameters:**
- `userId` (path): User UUID
- `workspaceId` (query, optional): Workspace UUID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "doc-123",
      "title": "Meeting Notes",
      "source_file": "meeting-notes.pdf",
      "file_type": ".pdf",
      "file_size": 1024000,
      "chunk_count": 15,
      "status": "completed",
      "created_at": "2025-01-08T19:30:00.000Z",
      "updated_at": "2025-01-08T19:30:00.000Z"
    }
  ]
}
```

#### POST /api/users/:userId/documents/upload
Upload a document for processing.

**Parameters:**
- `userId` (path): User UUID

**Body (multipart/form-data):**
- `file`: Document file (PDF, DOC, DOCX, TXT, MD)
- `workspaceId`: Workspace UUID

**Supported File Types:**
- PDF (.pdf)
- Word (.doc, .docx)
- Text (.txt)
- Markdown (.md)

**File Size Limit:** 50MB

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "doc-123",
    "title": "Meeting Notes",
    "source_file": "meeting-notes.pdf",
    "file_type": ".pdf",
    "file_size": 1024000,
    "chunk_count": 0,
    "status": "processing",
    "created_at": "2025-01-08T19:30:00.000Z",
    "updated_at": "2025-01-08T19:30:00.000Z"
  },
  "message": "Document uploaded successfully. Processing in background."
}
```

#### DELETE /api/users/:userId/documents/:documentId
Delete a document and all its chunks.

**Parameters:**
- `userId` (path): User UUID
- `documentId` (path): Document UUID

**Response:**
```json
{
  "success": true,
  "message": "Document deleted successfully"
}
```

---

### Search

#### POST /api/users/:userId/search
Search documents using semantic search.

**Parameters:**
- `userId` (path): User UUID

**Body:**
```json
{
  "query": "What were the main points from the meeting?",
  "workspaceId": "766da9a5-a11f-4945-9520-fbd93dafcb10",
  "filters": {
    "keywords": ["meeting", "agenda"],
    "tags": ["important"],
    "source": "meeting-notes.pdf",
    "dateRange": {
      "start": "2025-01-01",
      "end": "2025-01-31"
    }
  },
  "topK": 10,
  "useReranking": true
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "chunk-123",
      "score": 0.95,
      "text": "The main points from the meeting were: 1. Project timeline...",
      "metadata": {
        "title": "Meeting Notes",
        "source": "meeting-notes.pdf",
        "userId": "123e4567-e89b-12d3-a456-426614174000",
        "workspaceId": "766da9a5-a11f-4945-9520-fbd93dafcb10",
        "documentId": "doc-123",
        "chunkIndex": 5,
        "totalChunks": 15
      }
    }
  ]
}
```

---

### Chat

#### POST /api/users/:userId/chat
Chat with documents using AI.

**Parameters:**
- `userId` (path): User UUID

**Body:**
```json
{
  "message": "What were the key decisions made in the meeting?",
  "workspaceId": "766da9a5-a11f-4945-9520-fbd93dafcb10",
  "conversationId": "conv-123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Based on the meeting notes, the key decisions made were:\n\n1. **Project Timeline**: The team agreed to extend the deadline by 2 weeks...\n\n2. **Budget Allocation**: An additional $50,000 was approved for...\n\n3. **Team Structure**: Sarah will lead the frontend development...",
    "conversationId": "conv-123",
    "sources": [
      {
        "id": "chunk-123",
        "score": 0.95,
        "text": "Key decisions from the meeting: 1. Project timeline extension...",
        "metadata": {
          "title": "Meeting Notes",
          "source": "meeting-notes.pdf",
          "userId": "123e4567-e89b-12d3-a456-426614174000",
          "workspaceId": "766da9a5-a11f-4945-9520-fbd93dafcb10",
          "documentId": "doc-123",
          "chunkIndex": 5,
          "totalChunks": 15
        }
      }
    ],
    "metadata": {
      "tokensUsed": 1250,
      "processingTime": 2340
    }
  }
}
```

---

### Analytics

#### GET /api/users/:userId/stats
Get user statistics.

**Parameters:**
- `userId` (path): User UUID

**Response:**
```json
{
  "success": true,
  "data": {
    "documents": 25,
    "chunks": 150,
    "workspaces": 3
  }
}
```

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

### Common HTTP Status Codes

- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

---

## Frontend Integration Examples

### JavaScript/TypeScript

```typescript
const API_BASE = 'http://localhost:4111/api';

// Upload a document
async function uploadDocument(userId: string, workspaceId: string, file: File) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('workspaceId', workspaceId);

  const response = await fetch(`${API_BASE}/users/${userId}/documents/upload`, {
    method: 'POST',
    body: formData,
  });

  return response.json();
}

// Search documents
async function searchDocuments(userId: string, query: string, workspaceId?: string) {
  const response = await fetch(`${API_BASE}/users/${userId}/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      workspaceId,
      topK: 10,
    }),
  });

  return response.json();
}

// Chat with documents
async function chatWithDocuments(userId: string, message: string, workspaceId?: string) {
  const response = await fetch(`${API_BASE}/users/${userId}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      workspaceId,
    }),
  });

  return response.json();
}

// Get user workspaces
async function getUserWorkspaces(userId: string) {
  const response = await fetch(`${API_BASE}/users/${userId}/workspaces`);
  return response.json();
}
```

### React Hook Example

```typescript
import { useState, useEffect } from 'react';

interface UsePersonaVaultProps {
  userId: string;
  workspaceId?: string;
}

export function usePersonaVault({ userId, workspaceId }: UsePersonaVaultProps) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadDocument = async (file: File) => {
    setLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('workspaceId', workspaceId!);

      const response = await fetch(`/api/users/${userId}/documents/upload`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (result.success) {
        // Refresh documents list
        fetchDocuments();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const searchDocuments = async (query: string) => {
    setLoading(true);
    
    try {
      const response = await fetch(`/api/users/${userId}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, workspaceId }),
      });

      const result = await response.json();
      return result;
    } catch (err) {
      setError('Search failed');
      return { success: false, data: [] };
    } finally {
      setLoading(false);
    }
  };

  const chatWithDocuments = async (message: string) => {
    setLoading(true);
    
    try {
      const response = await fetch(`/api/users/${userId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, workspaceId }),
      });

      const result = await response.json();
      return result;
    } catch (err) {
      setError('Chat failed');
      return { success: false, data: null };
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    setLoading(true);
    
    try {
      const response = await fetch(`/api/users/${userId}/documents?workspaceId=${workspaceId}`);
      const result = await response.json();
      
      if (result.success) {
        setDocuments(result.data);
      }
    } catch (err) {
      setError('Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId && workspaceId) {
      fetchDocuments();
    }
  }, [userId, workspaceId]);

  return {
    documents,
    loading,
    error,
    uploadDocument,
    searchDocuments,
    chatWithDocuments,
    fetchDocuments,
  };
}
```

---

## Environment Variables

Create a `.env` file with the following variables:

```env
# API Configuration
API_PORT=4111
FRONTEND_URL=http://localhost:3000

# Qdrant Cloud Configuration
QDRANT_URL=https://your-cluster-url.cloud.qdrant.io:6333
QDRANT_API_KEY=your_api_key_here

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## Running the API

```bash
# Install dependencies
npm install

# Start the API server
npm run api

# Start in development mode with auto-reload
npm run api:dev
```

The API will be available at `http://localhost:4111/api`

---

## Multi-User Architecture

The API is designed with multi-user isolation:

1. **User-Specific Qdrant Indexes**: Each user gets their own vector index (`personavault-documents-{userId}`)
2. **Row-Level Security**: Supabase RLS ensures users can only access their own data
3. **Workspace Isolation**: Users can organize documents into workspaces
4. **Document Ownership**: All documents are tied to specific users and workspaces

This ensures complete data isolation between users while maintaining the ability to share data within workspaces if needed in the future. 