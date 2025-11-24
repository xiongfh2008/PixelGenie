import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure dist directory exists
const distDir = path.join(__dirname, '../dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Worker script content
const workerScript = `export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    // Try to serve static assets first
    if (env.ASSETS) {
      try {
        return await env.ASSETS.fetch(request);
      } catch (e) {
        // If asset not found, continue to fallback
      }
    }
    
    // Fallback to serving index.html for client-side routing
    if (pathname !== '/' && !pathname.match(/\\.[^/]+$/)) {
      const indexUrl = new URL('/', url.origin);
      const indexRequest = new Request(indexUrl, request);
      if (env.ASSETS) {
        try {
          return await env.ASSETS.fetch(indexRequest);
        } catch (e) {
          // Continue to minimal fallback
        }
      }
    }
    
    // Minimal fallback response
    return new Response('Not Found', { status: 404 });
  }
};`;

// Write the worker script to dist/_worker.js
const workerPath = path.join(distDir, '_worker.js');
fs.writeFileSync(workerPath, workerScript);

console.log('_worker.js created successfully in dist folder');