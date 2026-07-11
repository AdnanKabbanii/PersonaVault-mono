import { testApiConnection } from '../lib/mastra-client';

async function testConnection() {
  console.log('🔌 Testing Mastra API connection from frontend...');
  
  try {
    const connected = await testApiConnection();
    if (connected) {
      console.log('✅ Successfully connected to Mastra API!');
    } else {
      console.log('❌ Failed to connect to Mastra API');
    }
  } catch (error) {
    console.error('❌ Connection test failed:', error);
  }
}

testConnection();
