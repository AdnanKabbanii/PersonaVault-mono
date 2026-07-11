#!/usr/bin/env tsx

import { config } from 'dotenv';
import { DocumentIngestionPipeline } from '../utils/document-ingestion';

// Load environment variables
config();

async function main() {
  console.log('🚀 Document Ingestion Pipeline Starting...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    // Check environment variables
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OPENAI_API_KEY environment variable is required');
      process.exit(1);
    }

    // Initialize the ingestion pipeline with configuration
    const pipeline = new DocumentIngestionPipeline({
      dataDir: './data',
      chunkSize: 750, // Target 500-1000 tokens per chunk
      chunkOverlap: 100,
      batchSize: 10, // Batch embeddings for efficiency
      skipExisting: true,
    });

    // Run the full ingestion process
    const stats = await pipeline.ingestAllDocuments();

    console.log('\n🎉 Ingestion completed successfully!');
    console.log('\n📈 Final Statistics:');
    console.log(`   📄 Total files: ${stats.totalFiles}`);
    console.log(`   ✅ Processed: ${stats.processedFiles}`);
    console.log(`   ❌ Failed: ${stats.failedFiles.length}`);
    console.log(`   🧩 Total chunks: ${stats.totalChunks}`);
    console.log(`   🔤 Total tokens: ${stats.totalTokens.toLocaleString()}`);
    console.log(`   ⏱️  Time taken: ${(stats.processingTime / 1000 / 60).toFixed(2)} minutes`);

    if (stats.failedFiles.length > 0) {
      console.log('\n⚠️  Failed files:');
      stats.failedFiles.forEach(file => console.log(`     - ${file}`));
    }

    console.log('\n✨ Your PersonaVault database is ready for queries!');
    console.log('   Run: npm run dev');
    console.log('   Then visit: http://localhost:3000');

  } catch (error) {
    console.error('❌ Ingestion failed:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Ingestion interrupted by user');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Ingestion terminated');
  process.exit(0);
});

// Run the main function
main().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
}); 