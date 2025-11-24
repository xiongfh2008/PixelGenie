#!/usr/bin/env node

// Script to handle rollup platform-specific dependencies correctly
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Running build with Rollup platform fix...');

// Worker script content that will be created directly in this script
const workerScript = `export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    // Try to serve static assets first
    if (env.STATIC_ASSETS) {
      try {
        return await env.STATIC_ASSETS.fetch(request);
      } catch (e) {
        // If asset not found, continue to fallback
      }
    }
    
    // Fallback to serving index.html for client-side routing
    if (pathname !== '/' && !pathname.match(/\.[^/]+$/)) {
      const indexUrl = new URL('/', url.origin);
      const indexRequest = new Request(indexUrl, request);
      if (env.STATIC_ASSETS) {
        try {
          return await env.STATIC_ASSETS.fetch(indexRequest);
        } catch (e) {
          // Continue to minimal fallback
        }
      }
    }
    
    // Minimal fallback response
    return new Response('Not Found', { status: 404 });
  }
};`;

try {
  // Run the normal build process without platform-specific dependencies
  console.log('Running TypeScript compilation and Vite build...');
  execSync('tsc && vite build', { stdio: 'inherit' });
  
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}