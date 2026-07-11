#!/usr/bin/env tsx
import { QdrantVector } from '@mastra/qdrant';
import { config } from 'dotenv';

config();

async function verifyData() {
  console.log('🔍 Verifying stored data...');
  
  const url = process.env.QDRANT_URL;
  const apiKey = process.env.QDRANT_API_KEY;

  if (!url || !apiKey) {
    console.error('QDRANT_URL and QDRANT_API_KEY are required');
    process.exit(1);
  }

  const qdrant = new QdrantVector({ url, apiKey });

  try {
    const stats = await qdrant.describeIndex({ indexName: 'personavault-documents' });
    console.log(`📊 Total vectors stored: ${stats.count}`);
    
    if (stats.count > 0) {
      console.log('✅ Data successfully stored in Qdrant Cloud!');
      console.log('🚀 You can now start your application with: npm run dev');
    } else {
      console.log('❌ No data found in the index');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

verifyData(); 