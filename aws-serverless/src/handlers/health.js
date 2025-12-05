import { response } from '../lib/dynamodb.js';

// GET /api/health - Health check endpoint
export const handler = async (event) => {
  return response(200, {
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'fitbook-serverless',
  });
};
