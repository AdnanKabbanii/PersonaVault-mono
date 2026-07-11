import cors from 'cors';
import { config } from 'dotenv';
import express from 'express';
import multer from 'multer';
import { z } from 'zod';
import { supabase } from '../config/supabase';
import { personavaultApi } from './personavault-api';

config();

const app = express();
const PORT = process.env.API_PORT || 4112;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx', '.txt', '.md'];
    const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));

    if (allowedTypes.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${fileExtension} not allowed. Allowed types: ${allowedTypes.join(', ')}`));
    }
  },
});

const validateUserId = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const userId = req.params.userId || req.body.userId || req.query.userId;

  if (!userId) {
    return res.status(400).json({
      success: false,
      error: 'User ID is required',
    });
  }

  try {
    z.string().uuid().parse(userId);
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Invalid User ID format',
    });
  }
};

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'PersonaVault API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

app.get('/api/users/:userId/profile', validateUserId, async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await personavaultApi.getUserProfile(userId);

    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: `Internal server error: ${error}`,
    });
  }
});

app.get('/api/users/:userId/workspaces', validateUserId, async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await personavaultApi.getUserWorkspaces(userId);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error getting workspaces:', error);
    res.status(500).json({
      success: false,
      error: `Internal server error: ${error}`,
    });
  }
});

app.post('/api/users/:userId/workspaces', validateUserId, async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, description, is_default } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Workspace name is required',
      });
    }

    const result = await personavaultApi.createWorkspace(userId, name, description, is_default);

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Workspace creation error:', error);
    res.status(500).json({
      success: false,
      error: `Internal server error: ${error}`,
    });
  }
});

app.get('/api/users/:userId/documents', validateUserId, async (req, res) => {
  try {
    const { userId } = req.params;
    const { workspaceId } = req.query;

    const result = await personavaultApi.getUserDocuments(userId, workspaceId as string);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: `Internal server error: ${error}`,
    });
  }
});

app.post('/api/users/:userId/documents/upload', validateUserId, upload.single('file'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { workspaceId } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
    }

    if (!workspaceId) {
      return res.status(400).json({
        success: false,
        error: 'Workspace ID is required',
      });
    }

    const result = await personavaultApi.uploadDocument(
      userId,
      workspaceId,
      file.buffer,
      file.originalname,
      file.mimetype
    );

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: `Internal server error: ${error}`,
    });
  }
});

app.delete('/api/users/:userId/documents/:documentId', validateUserId, async (req, res) => {
  try {
    const { userId, documentId } = req.params;

    const result = await personavaultApi.deleteDocument(userId, documentId);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: `Internal server error: ${error}`,
    });
  }
});

app.post('/api/users/:userId/search', validateUserId, async (req, res) => {
  try {
    const { userId } = req.params;
    const { query, workspaceId, filters, topK = 10 } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required',
      });
    }

    const result = await personavaultApi.searchDocuments(
      userId,
      query,
      workspaceId,
      filters,
      topK
    );

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: `Internal server error: ${error}`,
    });
  }
});

app.get('/api/users/:userId/stats', validateUserId, async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await personavaultApi.getUserStats(userId);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: `Internal server error: ${error}`,
    });
  }
});

app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('API Error:', error);

  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 50MB.',
      });
    }
  }

  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
});

app.get('/api/debug/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);

    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    const { data: workspaces, error: workspaceError } = await supabase
      .from('user_workspaces')
      .select('*')
      .eq('user_id', userId);

    res.json({
      success: true,
      data: {
        authUser: !!authUser,
        userProfile: !!userProfile,
        workspaces: workspaces || [],
        errors: {
          auth: authError?.message,
          profile: profileError?.message,
          workspaces: workspaceError?.message,
        }
      }
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({
      success: false,
      error: `Debug failed: ${error}`,
    });
  }
});

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.originalUrl,
  });
});

app.listen(PORT, () => {
  console.log(`PersonaVault API running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

export default app;
