#!/usr/bin/env tsx

import { QdrantVector } from '@mastra/qdrant';
import { config } from 'dotenv';
import { DocumentIngestionPipeline } from '../utils/document-ingestion';

config();

async function main() {
  console.log('Document ingestion for Qdrant Cloud');

  try {
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is required');
      process.exit(1);
    }

    const url = process.env.QDRANT_URL;
    const apiKey = process.env.QDRANT_API_KEY;

    if (!url || !apiKey) {
      console.error('QDRANT_URL and QDRANT_API_KEY are required');
      process.exit(1);
    }

    const cloudConfig = { url, apiKey };

    console.log('Testing Qdrant Cloud connection...');
    const qdrant = new QdrantVector(cloudConfig);

    try {
      const indexes = await qdrant.listIndexes();
      console.log('Connected to Qdrant Cloud');
      console.log(`Available indexes: ${indexes.join(', ')}`);
    } catch (error) {
      console.error('Failed to connect to Qdrant Cloud:', error);
      process.exit(1);
    }

    const pipeline = new DocumentIngestionPipeline({
      dataDir: './data',
      chunkSize: 750,
      chunkOverlap: 100,
      batchSize: 3,
      skipExisting: false,
    });

    console.log('Starting document ingestion...');
    const stats = await pipeline.ingestAllDocuments();

    console.log('Cloud ingestion completed');
    console.log(`Total files: ${stats.totalFiles}`);
    console.log(`Processed: ${stats.processedFiles}`);
    console.log(`Failed: ${stats.failedFiles.length}`);
    console.log(`Total chunks: ${stats.totalChunks}`);
    console.log(`Total tokens: ${stats.totalTokens.toLocaleString()}`);
    console.log(`Time taken: ${(stats.processingTime / 1000 / 60).toFixed(2)} minutes`);

    if (stats.failedFiles.length > 0) {
      console.log('Failed files:');
      stats.failedFiles.forEach(file => console.log(`  - ${file}`));
    }

  } catch (error) {
    console.error('Cloud ingestion failed:', error);
    process.exit(1);
  }
}

process.on('SIGINT', () => {
  console.log('Ingestion interrupted');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Ingestion terminated');
  process.exit(0);
});

main().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
