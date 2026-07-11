#!/usr/bin/env tsx
import { openai } from '@ai-sdk/openai';
import { QdrantVector } from '@mastra/qdrant';
import { embedMany } from 'ai';
import { randomUUID } from 'crypto';
import { config } from 'dotenv';

// Load environment variables
config();

async function testSimpleIngestion() {
  console.log('🧪 Testing Simple Ingestion...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const url = process.env.QDRANT_URL;
  const apiKey = process.env.QDRANT_API_KEY;

  if (!url || !apiKey) {
    console.error('QDRANT_URL and QDRANT_API_KEY are required');
    process.exit(1);
  }

  const qdrant = new QdrantVector({ url, apiKey });

  try {
    console.log('📝 Creating test document...');
    const testText = "This is a test document for PersonaVault. It contains some sample text to test the ingestion process.";
    
    console.log('🔍 Generating embeddings...');
    const embeddingResult = await embedMany({
      model: openai.embedding('text-embedding-3-small'),
      values: [testText],
    });

    console.log('✅ Embeddings generated successfully');
    console.log(`📏 Vector dimension: ${embeddingResult.embeddings[0].length}`);

    console.log('💾 Storing in Qdrant...');
    const testId = randomUUID();
    const testMetadata = {
      title: 'Test Document',
      source: 'test-simple-ingestion.ts',
      createdAt: new Date().toISOString(),
      tags: ['test'],
      text: testText,
    };

    await qdrant.upsert({
      indexName: 'personavault-documents',
      vectors: [embeddingResult.embeddings[0]],
      metadata: [testMetadata],
      ids: [testId],
    });

    console.log('✅ Document stored successfully');

    console.log('🔍 Testing retrieval...');
    const results = await qdrant.query({
      indexName: 'personavault-documents',
      queryVector: embeddingResult.embeddings[0],
      topK: 1,
    });

    if (results.length > 0) {
      console.log('✅ Retrieval successful!');
      console.log(`🎯 Score: ${results[0].score.toFixed(4)}`);
      console.log(`📄 Retrieved text: ${results[0].metadata?.text}`);
    } else {
      console.log('❌ No results found');
    }

    console.log('\n🎉 Simple ingestion test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testSimpleIngestion().catch(console.error); 