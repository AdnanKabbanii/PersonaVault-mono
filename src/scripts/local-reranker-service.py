#!/usr/bin/env python3
"""
Local Reranker Service for PersonaVault
Optimized for general-purpose document search across any content type

Uses BAAI/bge-reranker-v2-m3 for:
- Multi-lingual support (100+ languages)
- General domain knowledge (not specialized)
- Better handling of diverse content types
- Robust cross-domain relevance scoring
"""
from sentence_transformers import CrossEncoder
from flask import Flask, request, jsonify
import logging
import time
import re
from typing import List, Dict, Any
from functools import lru_cache
import hashlib

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

class LocalRerankerService:
    def __init__(self, model_name: str = "mixedbread-ai/mxbai-rerank-base-v2"):
        self.model_name = model_name
        self.model = None
        self.load_model()
    
    def load_model(self):
        """Load the reranking model optimized for general searches"""
        logger.info(f"Loading reranker model: {self.model_name}")
        start_time = time.time()
        
        # Configure model for general-purpose reranking
        self.model = CrossEncoder(
            self.model_name,
            max_length=1024,  # Increased for better context understanding
            device='cpu',
            trust_remote_code=True  # Required for some models
        )
        
        load_time = time.time() - start_time
        logger.info(f"Model loaded in {load_time:.2f} seconds")
    
    def preprocess_text(self, text: str) -> str:
        """
        Preprocess text for better reranking performance
        """
        if not text:
            return ""
        
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text.strip())
        
        # Normalize common patterns
        text = re.sub(r'[^\w\s\-.,!?;:()\[\]{}"\']', ' ', text)
        
        # Limit length to prevent token overflow
        if len(text) > 3000:  # Rough character limit
            text = text[:3000] + "..."
        
        return text
    
    @lru_cache(maxsize=100)
    def _cached_rerank(self, query_hash: str, doc_hashes: tuple, top_k: int) -> tuple:
        """
        Cached reranking for frequently repeated queries
        """
        # This is a placeholder - actual implementation would need
        # to reconstruct documents from hashes
        return None
    
    def rerank(self, query: str, documents: List[Dict[str, Any]], top_k: int = 10) -> List[Dict[str, Any]]:
        """
        Rerank documents based on query relevance - optimized for general searches
        
        Args:
            query: Search query
            documents: List of documents with 'content' and 'metadata' fields
            top_k: Number of top results to return
            
        Returns:
            Reranked documents with normalized scores
        """
        if not documents:
            return []
        
        start_time = time.time()
        
        # Preprocess query and documents
        processed_query = self.preprocess_text(query)
        processed_docs = []
        
        for doc in documents:
            content = doc.get('content', '')
            processed_content = self.preprocess_text(content)
            processed_docs.append({
                **doc,
                'processed_content': processed_content
            })
        
        try:
            # Create query-document pairs for scoring
            query_doc_pairs = [[processed_query, doc['processed_content']] for doc in processed_docs]
            
            # Get relevance scores
            scores = self.model.predict(query_doc_pairs)
            
            # Normalize scores to 0-1 range for consistency
            if len(scores) > 1:
                min_score = min(scores)
                max_score = max(scores)
                score_range = max_score - min_score
                
                if score_range > 0:
                    normalized_scores = [(score - min_score) / score_range for score in scores]
                else:
                    normalized_scores = [0.5] * len(scores)
            else:
                normalized_scores = [0.5] * len(scores)
            
            # Create results with normalized scores
            scored_docs = []
            for i, (doc, score) in enumerate(zip(documents, normalized_scores)):
                scored_docs.append({
                    'content': doc['content'],
                    'metadata': doc.get('metadata', {}),
                    'score': float(score),
                    'original_index': i
                })
            
            # Sort by score (descending) and take top_k
            scored_docs.sort(key=lambda x: x['score'], reverse=True)
            
            # Filter out very low relevance scores (< 0.1 normalized)
            filtered_docs = [doc for doc in scored_docs if doc['score'] > 0.1]
            
            # Return top_k results
            reranked_docs = filtered_docs[:top_k]
            
            # If we filtered out too many, add back some results
            if len(reranked_docs) < min(top_k, len(documents)) and len(scored_docs) > len(reranked_docs):
                remaining_needed = min(top_k, len(documents)) - len(reranked_docs)
                additional_docs = [doc for doc in scored_docs if doc not in reranked_docs][:remaining_needed]
                reranked_docs.extend(additional_docs)
            
        except Exception as e:
            logger.error(f"Error during reranking: {str(e)}")
            # Fallback: return original documents with decreasing scores
            reranked_docs = []
            for i, doc in enumerate(documents[:top_k]):
                reranked_docs.append({
                    'content': doc['content'],
                    'metadata': doc.get('metadata', {}),
                    'score': max(0.1, 1.0 - (i * 0.1)),  # Ensure minimum score
                    'original_index': i
                })
        
        rerank_time = time.time() - start_time
        logger.info(f"Reranked {len(documents)} docs in {rerank_time:.3f}s, returned top {len(reranked_docs)}")
        
        return reranked_docs

# Initialize the service
reranker_service = LocalRerankerService()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model': reranker_service.model_name,
        'timestamp': time.time()
    })

@app.route('/rerank', methods=['POST'])
def rerank_endpoint():
    """
    Rerank documents endpoint
    
    Expected JSON payload:
    {
        "query": "search query",
        "documents": [
            {
                "content": "document text",
                "metadata": {"id": "doc1", "other": "data"}
            }
        ],
        "top_k": 10
    }
    """
    try:
        data = request.json
        
        # Validate input
        if not data or 'query' not in data or 'documents' not in data:
            return jsonify({'error': 'Missing required fields: query, documents'}), 400
        
        query = data['query']
        documents = data['documents']
        top_k = data.get('top_k', 10)
        
        # Validate query
        if not query or not query.strip():
            return jsonify({'error': 'Query cannot be empty'}), 400
        
        # Validate documents format
        for i, doc in enumerate(documents):
            if 'content' not in doc:
                return jsonify({'error': f'Document {i} missing content field'}), 400
        
        # Perform reranking
        results = reranker_service.rerank(query, documents, top_k)
        
        return jsonify({
            'success': True,
            'results': results,
            'total_processed': len(documents),
            'returned': len(results)
        })
        
    except Exception as e:
        logger.error(f"Error in reranking: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/models', methods=['GET'])
def available_models():
    """List available reranking models optimized for general searches"""
    return jsonify({
        'current_model': reranker_service.model_name,
        'recommended_models': [
            'BAAI/bge-reranker-v2-m3',      # Best for general multi-domain
            'BAAI/bge-reranker-large',       # Good balance of speed/accuracy
            'BAAI/bge-reranker-base',        # Fastest option
            'mixedbread-ai/mxbai-rerank-base-v2',  # Alternative general model
            'mixedbread-ai/mxbai-rerank-large-v2', # Higher accuracy
        ],
        'model_info': {
            'current': {
                'name': reranker_service.model_name,
                'optimized_for': 'General-purpose search across diverse content types',
                'languages': '100+ languages supported',
                'context_length': '1024 tokens',
                'features': ['Multi-lingual', 'Cross-domain', 'Normalized scoring']
            }
        }
    })

if __name__ == '__main__':
    # Production deployment options
    import argparse
    
    parser = argparse.ArgumentParser(description='Local Reranker Service - General Purpose')
    parser.add_argument('--host', default='0.0.0.0', help='Host to bind to')
    parser.add_argument('--port', type=int, default=5000, help='Port to bind to')
    parser.add_argument('--model', default='mixedbread-ai/mxbai-rerank-base-v2', help='Model to use')
    parser.add_argument('--debug', action='store_true', help='Enable debug mode')
    
    args = parser.parse_args()
    
    # Initialize with specified model
    if args.model != reranker_service.model_name:
        reranker_service = LocalRerankerService(args.model)
    
    logger.info(f"Starting Local Reranker Service on {args.host}:{args.port}")
    logger.info(f"Using model: {args.model}")
    logger.info("Optimized for general-purpose search across any content type")
    
    app.run(host=args.host, port=args.port, debug=args.debug)
