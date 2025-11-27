console.log('Test 1: Script started');

try {
  console.log('Test 2: Before import');
  const express = await import('express');
  console.log('Test 3: Express imported successfully');
  
  const app = express.default();
  console.log('Test 4: Express app created');
  
  app.listen(3001, () => {
    console.log('Test 5: Server listening on port 3001');
  });
  
  console.log('Test 6: Listen called');
  
  // Keep process alive
  setInterval(() => {
    console.log('Server still running...');
  }, 5000);
  
} catch (error) {
  console.error('ERROR:', error);
  process.exit(1);
}

