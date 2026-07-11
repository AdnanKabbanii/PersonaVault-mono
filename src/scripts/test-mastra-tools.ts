import { config } from 'dotenv';
import { documentSearchTool } from '../mastra/tools/document-search-tool';
import { queryUnderstandingTool } from '../mastra/tools/query-understanding-tool';

// Load environment variables
config();

async function testTools() {
  console.log('🧪 Testing Mastra Tools...\n');

  try {
    // Test query understanding tool
    console.log('1️⃣ Testing Query Understanding Tool...');
    const queryResult = await queryUnderstandingTool.execute({
      context: {
        userQuery: "List the types of documents I have."
      }
    });
    console.log('✅ Query Understanding Result:', JSON.stringify(queryResult, null, 2));
    console.log('');

    // Test document search tool
    console.log('2️⃣ Testing Document Search Tool...');
    const searchResult = await documentSearchTool.execute({
      context: {
        query: "types of documents",
        filters: {},
        topK: 5,
        useReranking: false,
        searchMode: 'hybrid'
      }
    });
    console.log('✅ Document Search Result:', JSON.stringify(searchResult, null, 2));
    console.log('');

    console.log('🎉 All tools are working correctly!');
  } catch (error) {
    console.error('❌ Tool test failed:', error);
    process.exit(1);
  }
}

testTools();
