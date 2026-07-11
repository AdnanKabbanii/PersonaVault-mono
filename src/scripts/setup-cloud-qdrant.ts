#!/usr/bin/env tsx
import { QdrantVector } from '@mastra/qdrant';
import { randomUUID } from 'crypto';
import { config } from 'dotenv';

config();

async function main() {
  const url = process.env.QDRANT_URL;
  const apiKey = process.env.QDRANT_API_KEY;

  if (!url || !apiKey) {
    console.error('QDRANT_URL and QDRANT_API_KEY are required in .env');
    process.exit(1);
  }

  const cloudConfig = { url, apiKey };

  try {
    const qdrant = new QdrantVector(cloudConfig);

    console.log('Connecting to Qdrant Cloud...');
    console.log(`URL: ${cloudConfig.url}`);

    let existingIndexes: string[] = [];
    try {
      existingIndexes = await qdrant.listIndexes();
      console.log('Connected to Qdrant Cloud');
      console.log(`Existing indexes: ${existingIndexes.length > 0 ? existingIndexes.join(', ') : 'none'}`);
    } catch (error) {
      console.error('Failed to connect to Qdrant Cloud:', error);
      throw error;
    }

    const indexName = 'personavault-documents';

    if (existingIndexes.includes(indexName)) {
      console.log(`Index '${indexName}' already exists`);

      try {
        const stats = await qdrant.describeIndex({ indexName });
        console.log('Index stats:');
        console.log(`  Dimension: ${stats.dimension}`);
        console.log(`  Vector count: ${stats.count}`);
        console.log(`  Distance metric: ${stats.metric}`);
      } catch (error) {
        console.warn(`Could not get index stats: ${error}`);
      }
    } else {
      console.log(`Creating index '${indexName}'...`);

      await qdrant.createIndex({
        indexName,
        dimension: 1536,
        metric: 'cosine',
      });

      console.log('Index created');

      const newStats = await qdrant.describeIndex({ indexName });
      console.log('Index stats:');
      console.log(`  Dimension: ${newStats.dimension}`);
      console.log(`  Vector count: ${newStats.count}`);
      console.log(`  Distance metric: ${newStats.metric}`);
    }

    const testStats = await qdrant.describeIndex({ indexName });
    if (testStats.count === 0) {
      console.log('Running connectivity test...');

      const testVectorId = randomUUID();
      const testVector = Array(1536).fill(0).map(() => Math.random() - 0.5);
      const testMetadata = {
        title: 'Test Document',
        source: 'test-document.txt',
        createdAt: new Date().toISOString(),
        tags: ['test', 'setup', 'cloud'],
        chunkIndex: 0,
        totalChunks: 1,
        text: 'Test document chunk for verifying the PersonaVault cloud setup.',
      };

      await qdrant.upsert({
        indexName,
        vectors: [testVector],
        metadata: [testMetadata],
        ids: [testVectorId],
      });

      console.log('Test vector inserted');

      const searchResults = await qdrant.query({
        indexName,
        queryVector: testVector,
        topK: 1,
      });

      if (searchResults.length > 0 && searchResults[0].id === testVectorId) {
        console.log('Test query successful');
        console.log(`  Similarity score: ${searchResults[0].score.toFixed(4)}`);
      } else {
        throw new Error('Test query failed');
      }

      await qdrant.deleteVector({ indexName, id: testVectorId });
      console.log('Test vector cleaned up');
    }

    console.log('Qdrant Cloud setup completed');
    console.log('Next: pnpm run ingest-cloud');

  } catch (error) {
    console.error('Qdrant Cloud setup failed:', error);
    process.exit(1);
  }
}

main().catch(console.error);
