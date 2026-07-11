import { getPersonaVaultAgent } from '../lib/mastra-client';

async function testMastraClient() {
  console.log('🧪 Testing Mastra Client functionality...');
  
  try {
    // Test getting PersonaVault agent
    console.log('1️⃣ Testing PersonaVault agent retrieval...');
    const personaVaultAgent = await getPersonaVaultAgent();
    console.log('✅ PersonaVault Agent found:', personaVaultAgent.name);
    
    console.log('🎉 All Mastra client tests passed!');
  } catch (error) {
    console.error('❌ Mastra client test failed:', error);
  }
}

testMastraClient();
