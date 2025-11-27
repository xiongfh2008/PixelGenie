console.log('=== Starting PixelGenie Server ===');
console.log('Node version:', process.version);
console.log('Current directory:', process.cwd());
console.log('');

try {
  console.log('Loading modules...');
  const module = await import('./index.js');
  console.log('✅ Server module loaded successfully');
} catch (error) {
  console.error('❌ Error loading server:');
  console.error(error);
  process.exit(1);
}

