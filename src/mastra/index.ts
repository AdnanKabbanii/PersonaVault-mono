import { Mastra } from '@mastra/core/mastra';
import { LibSQLStore } from '@mastra/libsql';
import { PinoLogger } from '@mastra/loggers';
import { config } from 'dotenv';
import { personaVaultAgent } from './agents/personavault-agent';

// Load environment variables
config();

function validateEnvironment() {
  const required = ['OPENAI_API_KEY'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  console.log('Environment variables validated');
}

validateEnvironment();

export const mastra = new Mastra({
  workflows: {},
  agents: {
    personaVaultAgent,
  },
  storage: new LibSQLStore({
    url: process.env.DATABASE_URL || "file:./mastra.db",
  }),
  logger: new PinoLogger({
    name: 'PersonaVault-Mastra',
    level: 'info',
  }),
});
