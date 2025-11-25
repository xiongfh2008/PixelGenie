import fetch from 'node-fetch';

// 简单的测试图像base64数据（使用相同的测试数据）
const testImageBase64 = "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAABAAEDAREAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=";

async function testAnalyzeImage() {
  try {
    console.log('Testing /api/analyze-image endpoint...');
    
    const response = await fetch('http://localhost:3001/api/analyze-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        originalBase64: testImageBase64,
        elaBase64: testImageBase64,
        mfrBase64: testImageBase64,
        mimeType: 'image/jpeg'
      })
    });

    const data = await response.json();
    console.log('Response Status:', response.status);
    console.log('Response Data:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// 测试另一个端点
async function testModifyImage() {
  try {
    console.log('\nTesting /api/modify-image endpoint...');
    
    const response = await fetch('http://localhost:3001/api/modify-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        originalBase64: testImageBase64,
        mimeType: 'image/jpeg',
        prompt: 'Enhance the image quality'
      })
    });

    const data = await response.json();
    console.log('Response Status:', response.status);
    console.log('Response Data:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// 运行测试
testAnalyzeImage();
testModifyImage();