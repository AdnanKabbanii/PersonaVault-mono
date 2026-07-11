#!/usr/bin/env tsx

import { QdrantVector } from '@mastra/qdrant';
import { config } from 'dotenv';

config();

async function clearDocumentData() {
  console.log('🗑️  Clearing document data from Qdrant...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const qdrantStore = new QdrantVector({
      url: process.env.QDRANT_URL || 'http://localhost:6333',
      apiKey: process.env.QDRANT_API_KEY,
    });

    // Check if the personavault-documents index exists
    const indexes = await qdrantStore.listIndexes();
    console.log('📋 Available indexes:', indexes);
    
    if (indexes.includes('personavault-documents')) {
      console.log('🔍 Found personavault-documents index');
      
      // First, check how many records exist
      console.log('📊 Checking current record count...');
      const zeroVector = new Array(1536).fill(0);
      
      try {
        const currentRecords = await qdrantStore.query({
          indexName: 'personavault-documents',
          queryVector: zeroVector,
          topK: 10000, // Get all records to count them
          filter: undefined,
          includeVector: false,
        });
        
        console.log(`📈 Current records in database: ${currentRecords.length}`);
        
        if (currentRecords.length === 0) {
          console.log('ℹ️  Database is already empty, nothing to clear');
          return;
        }
        
        // Show sample of what's being deleted
        console.log('📝 Sample records to be deleted:');
        currentRecords.slice(0, 3).forEach((record, i) => {
          console.log(`   ${i + 1}. ${record.metadata?.title || 'Unknown'} (${record.metadata?.sourceFile || 'Unknown file'})`);
        });
        
      } catch (error) {
        console.log('⚠️  Could not query existing records, proceeding with deletion anyway');
      }
      
      console.log('🗑️  Deleting personavault-documents index...');
      
      // Delete the entire index
      await qdrantStore.deleteIndex({ indexName: 'personavault-documents' });
      
      console.log('✅ Successfully deleted personavault-documents index');
      
      // Wait a moment for the deletion to complete
      console.log('⏳ Waiting for deletion to complete...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('🔧 Creating fresh personavault-documents index...');
      
      // Recreate the index
      await qdrantStore.createIndex({
        indexName: 'personavault-documents',
        dimension: 1536, // text-embedding-3-small dimension
        metric: 'cosine',
      });
      
      console.log('✅ Fresh personavault-documents index created successfully');
      
      // Verify the index is empty
      console.log('🔍 Verifying index is empty...');
      try {
        const verifyRecords = await qdrantStore.query({
          indexName: 'personavault-documents',
          queryVector: zeroVector,
          topK: 10,
          filter: undefined,
          includeVector: false,
        });
        
        if (verifyRecords.length === 0) {
          console.log('✅ Verification successful: Index is empty');
        } else {
          console.log(`❌ Verification failed: Index still contains ${verifyRecords.length} records`);
        }
      } catch (error) {
        console.log('⚠️  Could not verify empty index (this is normal for a fresh index)');
      }
      
    } else {
      console.log('ℹ️  No personavault-documents index found, creating fresh one...');
      
      await qdrantStore.createIndex({
        indexName: 'personavault-documents',
        dimension: 1536,
        metric: 'cosine',
      });
      
      console.log('✅ Fresh personavault-documents index created');
    }

    console.log('\n🎉 PersonaVault data cleared successfully!');
    console.log('📝 Next steps:');
    console.log('   1. Add your documents to the data/ folder');
    console.log('   2. Run: npm run ingest');
    console.log('   3. Start querying: npm run dev');

  } catch (error) {
    console.error('❌ Failed to clear PersonaVault data:', error);
    process.exit(1);
  }
}

async function main() {
  await clearDocumentData();
}

main().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
