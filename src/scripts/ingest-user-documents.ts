#!/usr/bin/env tsx

import { config } from 'dotenv';
import { MultiUserDocumentIngestionPipeline } from '../utils/multi-user-document-ingestion';

// Load environment variables
config();

async function main() {
  console.log('👤 Multi-User Document Ingestion Pipeline');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    // Check environment variables
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OPENAI_API_KEY environment variable is required');
      process.exit(1);
    }

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      console.error('❌ SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required');
      process.exit(1);
    }

    // Get user and workspace IDs from command line arguments
    const userId = process.argv[2];
    const workspaceId = process.argv[3];

    if (!userId) {
      console.error('❌ User ID is required. Usage: npm run ingest-user <userId> [workspaceId]');
      console.log('💡 Example: npm run ingest-user 123e4567-e89b-12d3-a456-426614174000');
      process.exit(1);
    }

    if (!workspaceId) {
      console.log('⚠️  No workspace ID provided, will use default workspace');
    }

    console.log(`👤 User ID: ${userId}`);
    console.log(`📁 Workspace ID: ${workspaceId || 'Default'}`);

    // Initialize the multi-user ingestion pipeline
    const pipeline = new MultiUserDocumentIngestionPipeline({
      userId,
      workspaceId: workspaceId || 'default', // You'll need to get the default workspace ID
      dataDir: './data',
      chunkSize: 750,
      chunkOverlap: 100,
      batchSize: 3,
    });

    // Run the ingestion process
    const stats = await pipeline.ingestUserDocuments();

    console.log('\n🎉 Multi-user ingestion completed successfully!');
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

    console.log('\n✨ User documents are ready for queries!');
    console.log('   Run: npm run dev');
    console.log('   Then visit: http://localhost:3000');

  } catch (error) {
    console.error('❌ Multi-user ingestion failed:', error);
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