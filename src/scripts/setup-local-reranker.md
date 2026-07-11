# Local Reranker Setup Guide

This guide helps you set up a local reranking service to replace expensive LLM API calls with fast, accurate local models.

## 🚀 Quick Setup

### 1. Install Python Dependencies

pip install sentence-transformers flask torch
```

### 2. Start the Local Reranker Service

python src/scripts/local-reranker-service.py

# Or with custom model
python src/scripts/local-reranker-service.py --model BAAI/bge-reranker-base

# Production mode with custom host/port
python src/scripts/local-reranker-service.py --host 0.0.0.0 --port 5000
```

### 3. Verify Setup

```bash
# Test health check
curl http://localhost:5000/health

# Test reranking
curl -X POST http://localhost:5000/rerank \
  -H "Content-Type: application/json" \
  -d '{
    "query": "software engineer",
    "documents": [
      {"content": "Python developer with 5 years experience", "metadata": {"id": "1"}},
      {"content": "Marketing manager with social media skills", "metadata": {"id": "2"}}
    ],
    "top_k": 2
  }'
```

## 🎯 Recommended Models

### For Best Accuracy: `mixedbread-ai/mxbai-rerank-base-v1`
- **Size**: 184M parameters
- **Performance**: Superior accuracy on most benchmarks
- **Speed**: ~100ms per query
- **Memory**: ~1GB VRAM

### For Multilingual: `BAAI/bge-reranker-v2-m3`
- **Size**: 568M parameters  
- **Performance**: Excellent for 100+ languages
- **Speed**: ~200ms per query
- **Memory**: ~2.5GB VRAM

### For Speed: `BAAI/bge-reranker-base`
- **Size**: 278M parameters
- **Performance**: Good balance of speed/accuracy
- **Speed**: ~150ms per query
- **Memory**: ~1.5GB VRAM

## 🔧 Configuration Options

### Environment Variables

```bash
# Optional: Set custom model
export RERANKER_MODEL="mixedbread-ai/mxbai-rerank-base-v1"

# Optional: Set custom port
export RERANKER_PORT=5000

# Optional: Enable debug logging
export RERANKER_DEBUG=true
```

### Docker Deployment

```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY src/scripts/local-reranker-service.py .

EXPOSE 5000

CMD ["python", "local-reranker-service.py", "--host", "0.0.0.0"]
```