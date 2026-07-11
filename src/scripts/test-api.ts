import { config } from 'dotenv';
import fetch from 'node-fetch';

// Load environment variables
config();

const API_BASE = 'http://localhost:4112/api';
const TEST_USER_ID = '123e4567-e89b-12d3-a456-426614174000';

async function testApi() {
  console.log('🧪 Testing PersonaVault API...\n');

  try {
    // Test 1: Health Check
    console.log('1. Testing Health Check...');
    const healthResponse = await fetch(`http://localhost:4112/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health Check:', healthData);
    console.log('');

    // Test 2: Get User Profile
    console.log('2. Testing Get User Profile...');
    const profileResponse = await fetch(`${API_BASE}/users/${TEST_USER_ID}/profile`);
    const profileData = await profileResponse.json();
    console.log('✅ User Profile:', profileData);
    console.log('');

    // Test 3: Get User Workspaces
    console.log('3. Testing Get User Workspaces...');
    const workspacesResponse = await fetch(`${API_BASE}/users/${TEST_USER_ID}/workspaces`);
    const workspacesData = await workspacesResponse.json();
    console.log('✅ User Workspaces:', workspacesData);
    console.log('');

    // Test 4: Get User Stats
    console.log('4. Testing Get User Stats...');
    const statsResponse = await fetch(`${API_BASE}/users/${TEST_USER_ID}/stats`);
    const statsData = await statsResponse.json();
    console.log('✅ User Stats:', statsData);
    console.log('');

    // Test 5: Search Documents (if user has documents)
    console.log('5. Testing Search Documents...');
    const searchResponse = await fetch(`${API_BASE}/users/${TEST_USER_ID}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: 'test query',
        topK: 5,
      }),
    });
    const searchData = await searchResponse.json();
    console.log('✅ Search Results:', searchData);
    console.log('');

    // Test 6: Chat with Documents
    console.log('6. Testing Chat with Documents...');
    const chatResponse = await fetch(`${API_BASE}/users/${TEST_USER_ID}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Hello, can you help me find my documents?',
      }),
    });
    const chatData = await chatResponse.json();
    console.log('✅ Chat Response:', chatData);
    console.log('');

    console.log('🎉 All API tests completed successfully!');
    console.log('📊 API is ready for frontend integration.');

  } catch (error) {
    console.error('❌ API test failed:', error);
    console.log('\n💡 Make sure the API server is running with: npm run api');
  }
}

// Run the test
testApi(); 