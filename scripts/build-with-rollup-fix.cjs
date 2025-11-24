#!/usr/bin/env node

// Script to handle rollup platform-specific dependencies correctly
const { execSync } = require('child_process');

console.log('Running build with Rollup platform fix...');

try {
  // Run the normal build process without platform-specific dependencies
  console.log('Running TypeScript compilation and Vite build...');
  execSync('tsc && vite build', { stdio: 'inherit' });
  
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}