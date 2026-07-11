#!/usr/bin/env tsx
import { config } from 'dotenv';
import { DocumentIngestionPipeline } from '../utils/document-ingestion';

// Load environment variables
config();

async function main() {
  console.log('🚀 Document Ingestion Pipeline Starting...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    // Create ingestion pipeline with more conservative settings
    const pipeline = new DocumentIngestionPipeline({
      dataDir: './data',
      chunkSize: 750,
      chunkOverlap: 100,
      batchSize: 3, // Reduced batch size to prevent timeouts
      skipExisting: false,
    });

    // Add timeout wrapper
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Ingestion timed out after 10 minutes')), 10 * 60 * 1000);
    });

    const ingestionPromise = pipeline.ingestAllDocuments();

    // Race between timeout and ingestion
    const result = await Promise.race([ingestionPromise, timeoutPromise]);

    console.log('\n✨ Your PersonaVault database is ready for queries!');
    console.log('   Run: npm run dev');
    console.log('   Then visit: http://localhost:3000');

  } catch (error) {
    console.error('❌ Ingestion failed:', error);
    
    if (error.message.includes('timed out')) {
      console.log('\n💡 The ingestion process timed out. This might be due to:');
      console.log('   1. Large documents taking too long to process');
      console.log('   2. Network connectivity issues with Qdrant Cloud');
      console.log('   3. OpenAI API rate limits');
      console.log('\n🔄 Try running the ingestion again, or process documents in smaller batches.');
    }
    
    process.exit(1);
  }
}

main().catch(console.error); 