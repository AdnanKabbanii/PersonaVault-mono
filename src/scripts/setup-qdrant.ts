#!/usr/bin/env tsx

import { QdrantVector } from '@mastra/qdrant';
import { randomUUID } from 'crypto';
import { config } from 'dotenv';

// Load environment variables
config();

async function main() {
  console.log('🔧 Setting up Qdrant Vector Database...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    // Initialize Qdrant connection
    const qdrant = new QdrantVector({
      url: process.env.QDRANT_URL || 'http://localhost:6333',
      apiKey: process.env.QDRANT_API_KEY, // Optional for local setup
    });

    console.log('🔌 Connecting to Qdrant...');
    
    // Test connection by listing existing indexes
    let existingIndexes: string[] = [];
    try {
      existingIndexes = await qdrant.listIndexes();
      console.log('✅ Successfully connected to Qdrant');
      console.log(`📋 Existing indexes: ${existingIndexes.length > 0 ? existingIndexes.join(', ') : 'None'}`);
    } catch (error) {
      console.error('❌ Failed to connect to Qdrant. Please ensure Qdrant is running on http://localhost:6333');
      console.error('💡 To start Qdrant locally with Docker:');
      console.error('   docker run -p 6333:6333 qdrant/qdrant');
      throw error;
    }

    // Create the PersonaVault documents index if it doesn't exist
    const indexName = 'personavault-documents';
    
    if (existingIndexes.includes(indexName)) {
      console.log(`✅ Index '${indexName}' already exists`);
      
      // Get index stats
      try {
        const stats = await qdrant.describeIndex({ indexName });
        console.log(`📊 Index stats:`);
        console.log(`   📏 Dimension: ${stats.dimension}`);
        console.log(`   📈 Vector count: ${stats.count}`);
        console.log(`   📐 Distance metric: ${stats.metric}`);
      } catch (error) {
        console.warn(`⚠️  Could not get index stats: ${error}`);
      }
    } else {
      console.log(`🔨 Creating index '${indexName}'...`);
      
      await qdrant.createIndex({
        indexName,
        dimension: 1536, // OpenAI text-embedding-3-small dimension
        metric: 'cosine', // Cosine similarity for semantic search
      });
      
      console.log('✅ Index created successfully');
      
      // Verify the index was created
      const newStats = await qdrant.describeIndex({ indexName });
      console.log(`📊 New index stats:`);
      console.log(`   📏 Dimension: ${newStats.dimension}`);
      console.log(`   📈 Vector count: ${newStats.count}`);
      console.log(`   📐 Distance metric: ${newStats.metric}`);
    }

    // Test embedding insertion and search (if empty)
    const testStats = await qdrant.describeIndex({ indexName });
    if (testStats.count === 0) {
      console.log('\n🧪 Running connectivity test...');
      
      // Generate a proper UUID for the test vector
      const testVectorId = randomUUID();
      
      // Insert a test vector
      const testVector = Array(1536).fill(0).map(() => Math.random() - 0.5);
      const testMetadata = {
        title: 'Test Document',
        source: 'test-document.txt',
        createdAt: new Date().toISOString(),
        tags: ['test', 'setup'],
        chunkIndex: 0,
        totalChunks: 1,
        text: 'This is a test document chunk for verifying the PersonaVault setup.',
      };

      await qdrant.upsert({
        indexName,
        vectors: [testVector],
        metadata: [testMetadata],
        ids: [testVectorId], // Use UUID instead of string
      });

      console.log('✅ Test vector inserted');

      // Query the test vector
      const searchResults = await qdrant.query({
        indexName,
        queryVector: testVector,
        topK: 1,
      });

      if (searchResults.length > 0 && searchResults[0].id === testVectorId) {
        console.log('✅ Test query successful');
        console.log(`   🎯 Similarity score: ${searchResults[0].score.toFixed(4)}`);
      } else {
        throw new Error('Test query failed');
      }

      // Clean up test vector
      await qdrant.deleteVector({ indexName, id: testVectorId });
      console.log('🧹 Test vector cleaned up');
    }

    console.log('\n🎉 Qdrant setup completed successfully!');
    console.log('\n📋 Configuration Summary:');
    console.log(`   🌐 URL: ${process.env.QDRANT_URL || 'http://localhost:6333'}`);
    console.log(`   🗂️  Index: ${indexName}`);
    console.log(`   📏 Dimension: 1536 (text-embedding-3-small)`);
    console.log(`   📐 Metric: cosine`);
    console.log(`   🔑 API Key: ${process.env.QDRANT_API_KEY ? 'Set' : 'Not set (OK for local)'}`);

    console.log('\n✨ Ready for PersonaVault document ingestion!');
    console.log('   Next step: npm run ingest');

  } catch (error) {
    console.error('❌ Qdrant setup failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Ensure Qdrant is running: docker run -p 6333:6333 qdrant/qdrant');
    console.log('   2. Check QDRANT_URL environment variable');
    console.log('   3. Verify network connectivity to Qdrant instance');
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Setup interrupted by user');
  process.exit(0);
});

// Run the main function
main().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
}); 