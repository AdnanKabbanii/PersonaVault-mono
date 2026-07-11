#!/usr/bin/env tsx
import { QdrantVector } from '@mastra/qdrant';
import { config } from 'dotenv';

// Load environment variables
config();

async function testCloudConnection() {
  console.log('🧪 Testing Qdrant Cloud Connection...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const url = process.env.QDRANT_URL;
  const apiKey = process.env.QDRANT_API_KEY;

  if (!url || !apiKey) {
    console.error('QDRANT_URL and QDRANT_API_KEY are required');
    process.exit(1);
  }

  const qdrant = new QdrantVector({ url, apiKey });

  try {
    console.log('🔌 Testing connection...');
    const indexes = await qdrant.listIndexes();
    console.log('✅ Connection successful!');
    console.log(`📋 Available indexes: ${indexes.join(', ')}`);

    if (indexes.includes('personavault-documents')) {
      console.log('\n📊 Checking index stats...');
      const stats = await qdrant.describeIndex({ indexName: 'personavault-documents' });
      console.log(`📈 Total vectors: ${stats.count}`);
      console.log(`📏 Dimension: ${stats.dimension}`);
      
      if (stats.count > 0) {
        console.log('\n🔍 Testing query...');
        const testVector = Array(1536).fill(0).map(() => Math.random() - 0.5);
        const results = await qdrant.query({
          indexName: 'personavault-documents',
          queryVector: testVector,
          topK: 5,
        });
        console.log(`✅ Query successful! Found ${results.length} results`);
        
        if (results.length > 0) {
          console.log('\n📄 Sample results:');
          results.slice(0, 3).forEach((result, i) => {
            console.log(`  ${i + 1}. Score: ${result.score.toFixed(4)}`);
            console.log(`     Source: ${result.metadata?.source || 'Unknown'}`);
            console.log(`     Text: ${result.metadata?.text?.substring(0, 100) || 'No text'}...`);
          });
        }
      }
    }

    console.log('\n🎉 All tests passed! Your cloud connection is working properly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testCloudConnection().catch(console.error); 