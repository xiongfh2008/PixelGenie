
/**
 * Error Level Analysis (ELA) Service
 * Generates a heatmap highlighting differences in compression levels.
 * Modified regions often exhibit different compression artifacts than the rest of the image.
 */

// Helper to load an image object from a source (File or URL)
const loadImage = (src: string | File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // FIX: Do NOT set crossOrigin="Anonymous" for local Blob URLs. 
    // It causes "Tainted Canvas" errors in some browsers when processing local files.
    // Since we handle external URLs by converting them to Files (Blobs) via fetchImageFromUrl,
    // we are always working with local data here.
    
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = typeof src === 'string' ? src : URL.createObjectURL(src);
  });
};

export const generateELA = async (file: File): Promise<string> => {
  try {
    const originalImage = await loadImage(file);
    
    // Create a canvas for processing
    const canvas = document.createElement('canvas');
    // Limit size to improve performance, max 1200px to keep details for AI
    const maxDim = 1200;
    let width = originalImage.width;
    let height = originalImage.height;
    
    if (width > maxDim || height > maxDim) {
      const ratio = Math.min(maxDim / width, maxDim / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }
    
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error("Canvas context unavailable");

    // 1. Draw Original
    ctx.drawImage(originalImage, 0, 0, width, height);
    const originalData = ctx.getImageData(0, 0, width, height);

    // 2. Compress: Export as JPEG with 90% quality to simulate resaving
    // 90% is the industry standard for ELA.
    const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.90);
    const compressedImage = await loadImage(jpegDataUrl);

    // 3. Draw Compressed
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(compressedImage, 0, 0, width, height);
    const compressedData = ctx.getImageData(0, 0, width, height);

    // 4. Calculate Difference (The ELA Algorithm)
    const elaImageData = ctx.createImageData(width, height);
    const data = elaImageData.data;
    
    // First pass: Calculate raw differences to find max diff for auto-scaling
    let maxDiff = 0;
    const tempDiffs = new Float32Array(data.length / 4);

    for (let i = 0, j = 0; i < data.length; i += 4, j++) {
      const rDiff = Math.abs(originalData.data[i] - compressedData.data[i]);
      const gDiff = Math.abs(originalData.data[i+1] - compressedData.data[i+1]);
      const bDiff = Math.abs(originalData.data[i+2] - compressedData.data[i+2]);
      
      const localDiff = (rDiff + gDiff + bDiff) / 3; // Average diff
      tempDiffs[j] = localDiff;
      if (localDiff > maxDiff) maxDiff = localDiff;
    }

    // Dynamic Scaling Factor
    // If maxDiff is low (very clean image), we need high amplification.
    // If maxDiff is high (noisy image), we need less amplification to avoid whiteout.
    // We target a "peak" visibility around brightness level 240.
    // Prevent divide by zero by ensuring maxDiff is at least 1.
    const targetBrightness = 240;
    const scalingFactor = maxDiff > 0 ? (targetBrightness / Math.max(maxDiff, 4)) : 50;
    
    // Clamp scaling factor to avoid extreme noise in pure black images
    // or too low visibility in very noisy images.
    const finalScale = Math.min(Math.max(scalingFactor, 10), 100);

    // 5. Render Heatmap
    for (let i = 0; i < data.length; i += 4) {
      const rDiff = Math.abs(originalData.data[i] - compressedData.data[i]);
      const gDiff = Math.abs(originalData.data[i+1] - compressedData.data[i+1]);
      const bDiff = Math.abs(originalData.data[i+2] - compressedData.data[i+2]);

      // Amplify
      const r = Math.min(255, rDiff * finalScale);
      const g = Math.min(255, gDiff * finalScale);
      const b = Math.min(255, bDiff * finalScale);

      // Coloring Strategy:
      // We output a grayscale-ish representation where color tint implies channel variance.
      data[i] = r;
      data[i+1] = g;
      data[i+2] = b;
      data[i+3] = 255;
    }

    ctx.putImageData(elaImageData, 0, 0);

    const finalUrl = canvas.toDataURL('image/png');
    return finalUrl.split(',')[1];

  } catch (error) {
    console.error("ELA Generation failed:", error);
    throw error;
  }
};
