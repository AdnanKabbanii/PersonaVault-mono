import { QdrantVector } from '@mastra/qdrant';

const qdrantStore = new QdrantVector({
  url: process.env.QDRANT_URL || 'http://localhost:6333',
  apiKey: process.env.QDRANT_API_KEY,
});

async function debugQdrantData() {
  console.log('🔍 Debugging Qdrant Data Structure & Duplication Issues...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    // 1. Check if index exists
    const indexes = await qdrantStore.listIndexes();
    console.log('📋 Available indexes:', indexes);

    if (!indexes.includes('personavault-documents')) {
      console.log('❌ personavault-documents index not found!');
      return;
    }

    // 2. Get ALL data to analyze the 106 records issue
    console.log('\n🔍 Fetching ALL data to analyze duplication...');
    const zeroVector = new Array(1536).fill(0);
    
    const allResults = await qdrantStore.query({
      indexName: 'personavault-documents',
      queryVector: zeroVector,
      topK: 10000, // Get everything
      filter: undefined,
      includeVector: false,
    });

    console.log(`📊 Total records in database: ${allResults.length}`);

    if (allResults.length === 0) {
      console.log('❌ No data found in Qdrant! The index might be empty.');
      return;
    }

    // 3. Analyze by source files to detect duplicates
    console.log('\n📁 Analyzing records by source file...');
    const fileStats = new Map();
    const nameStats = new Map();
    
    allResults.forEach(result => {
      const sourceFile = result.metadata?.sourceFile || 'Unknown';
      const name = result.metadata?.name || 'Unknown';
      const chunkIndex = result.metadata?.chunkIndex || 0;
      const totalChunks = result.metadata?.totalChunks || 1;
      
      // Track by file
      if (!fileStats.has(sourceFile)) {
        fileStats.set(sourceFile, {
          count: 0,
          chunks: [],
          name: name,
          totalChunks: totalChunks
        });
      }
      fileStats.get(sourceFile).count++;
      fileStats.get(sourceFile).chunks.push(chunkIndex);
      
      // Track by name
      if (!nameStats.has(name)) {
        nameStats.set(name, {
          count: 0,
          files: new Set()
        });
      }
      nameStats.get(name).count++;
      nameStats.get(name).files.add(sourceFile);
    });

    console.log(`\n📈 File Statistics (${fileStats.size} unique files):`);
    const sortedFiles = Array.from(fileStats.entries()).sort((a, b) => b[1].count - a[1].count);
    
    let suspiciousDuplicates = 0;
    sortedFiles.forEach(([file, stats], index) => {
      const expectedChunks = stats.totalChunks;
      const actualChunks = stats.count;
      const isDuplicate = actualChunks > expectedChunks;
      
      if (isDuplicate) suspiciousDuplicates++;
      
      console.log(`${index + 1}. ${file}`);
      console.log(`   Name: ${stats.name}`);
      console.log(`   Records: ${actualChunks} (expected: ${expectedChunks}) ${isDuplicate ? '⚠️ DUPLICATE!' : '✅'}`);
      console.log(`   Chunk indexes: [${stats.chunks.sort((a, b) => a - b).join(', ')}]`);
      
      if (index < 10 || isDuplicate) { // Show first 10 or any duplicates
        // Show more details for suspicious files
      } else if (index === 10) {
        console.log(`   ... and ${sortedFiles.length - 10} more files`);
      }
    });

    if (suspiciousDuplicates > 0) {
      console.log(`\n⚠️  Found ${suspiciousDuplicates} files with more records than expected chunks!`);
    }

    // 4. Analyze by candidate names to detect name duplicates
    console.log(`\n👤 Name Statistics (${nameStats.size} unique names):`);
    const sortedNames = Array.from(nameStats.entries()).sort((a, b) => b[1].count - a[1].count);
    
    sortedNames.slice(0, 15).forEach(([name, stats], index) => {
      const filesArray = Array.from(stats.files);
      const hasDuplicateFiles = filesArray.length > 1;
      
      console.log(`${index + 1}. ${name}: ${stats.count} records from ${filesArray.length} files ${hasDuplicateFiles ? '⚠️ MULTIPLE FILES!' : ''}`);
      if (hasDuplicateFiles) {
        filesArray.forEach(file => console.log(`     - ${file}`));
      }
    });

    // 5. Check for exact duplicate records (same content)
    console.log('\n🔍 Checking for exact duplicate content...');
    const contentHashes = new Map();
    let exactDuplicates = 0;
    
    allResults.forEach(result => {
      const contentKey = `${result.metadata?.name || ''}-${result.metadata?.chunkIndex || 0}-${result.metadata?.text?.substring(0, 100) || ''}`;
      
      if (contentHashes.has(contentKey)) {
        exactDuplicates++;
        console.log(`⚠️  Exact duplicate found: ${result.metadata?.name} chunk ${result.metadata?.chunkIndex} from ${result.metadata?.sourceFile}`);
      } else {
        contentHashes.set(contentKey, result.id);
      }
    });

    if (exactDuplicates === 0) {
      console.log('✅ No exact duplicate content found');
    } else {
      console.log(`❌ Found ${exactDuplicates} exact duplicate records!`);
    }

    // 6. Sample recent records to see structure
    console.log('\n📝 Sample metadata structures:');
    for (let i = 0; i < Math.min(3, allResults.length); i++) {
      const result = allResults[i];
      console.log(`\n--- Sample ${i + 1} ---`);
      console.log('ID:', result.id);
      console.log('Name:', result.metadata?.name);
      console.log('File:', result.metadata?.sourceFile);
      console.log('Chunk:', `${result.metadata?.chunkIndex}/${result.metadata?.totalChunks}`);
      console.log('Location:', result.metadata?.location);
      console.log('Text preview:', result.metadata?.text?.substring(0, 100) + '...');
    }

    // 7. Check ingestion timestamps if available
    console.log('\n⏰ Analyzing potential multiple ingestion runs...');
    const uniqueIds = new Set(allResults.map(r => r.id));
    console.log(`Unique IDs: ${uniqueIds.size} (should equal total records: ${allResults.length})`);
    
    if (uniqueIds.size !== allResults.length) {
      console.log('❌ ID collision detected - this indicates a serious bug!');
    }

    // 8. Calculate expected vs actual record count
    console.log('\n🧮 Expected vs Actual Analysis:');
    const uniqueFiles = fileStats.size;
    const averageChunksPerFile = allResults.length / uniqueFiles;
    console.log(`Unique CV files: ${uniqueFiles}`);
    console.log(`Total records: ${allResults.length}`);
    console.log(`Average chunks per file: ${averageChunksPerFile.toFixed(2)}`);
    console.log(`Expected range: 2-4 chunks per CV (reasonable for document chunking)`);
    
    if (averageChunksPerFile > 4) {
      console.log('⚠️  Higher than expected chunks per file - possible duplication');
    } else {
      console.log('✅ Chunks per file ratio looks reasonable');
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

// Run the debug
debugQdrantData().catch(console.error); 