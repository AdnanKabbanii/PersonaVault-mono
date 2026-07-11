import { QdrantVector } from '@mastra/qdrant';
import { config } from 'dotenv';

// Load environment variables
config();

async function checkQdrantCollections() {
  try {
    console.log('🔍 Checking Qdrant collections...');
    
    const qdrantStore = new QdrantVector({
      url: process.env.QDRANT_URL || 'http://localhost:6333',
      apiKey: process.env.QDRANT_API_KEY,
    });

    // List all indexes/collections
    const indexes = await qdrantStore.listIndexes();
    console.log('📋 Available Qdrant collections/indexes:');
    console.log(indexes);

    if (indexes.length === 0) {
      console.log('❌ No collections found in Qdrant');
    } else {
      // For each collection, try to get some info
      for (const indexName of indexes) {
        try {
          console.log(`\n🔍 Collection: ${indexName}`);
          
          // Try to get collection info if possible
          // Note: This might not work with all Qdrant configurations
          
        } catch (error) {
          console.log(`  ❌ Could not get info for ${indexName}: ${error}`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Error checking Qdrant collections:', error);
  }
}

// Run the check
checkQdrantCollections().catch(console.error);
