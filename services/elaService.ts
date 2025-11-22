
/**
 * Forensic Image Analysis Service
 * Includes:
 * 1. ELA (Error Level Analysis) with Jet Colormap and Percentile Scaling
 * 2. Sobel Operator for Gradient/Edge Analysis
 * 3. LNA (Local Noise Analysis) for Noise Variance Consistency
 * 4. MFR (Median Filter Residual) with Density Smoothing
 */

const loadImage = (src: string | File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = typeof src === 'string' ? src : URL.createObjectURL(src);
  });
};

// Helper: Map a normalized value (0-1) to a Jet/Thermal Colormap
const getJetColor = (v: number) => {
  let r = 0, g = 0, b = 0;
  
  if (v < 0.25) {
    r = 0; g = 4 * v * 255; b = 255;
  } else if (v < 0.5) {
    r = 0; g = 255; b = 255 * (1 - 4 * (v - 0.25));
  } else if (v < 0.75) {
    r = 4 * (v - 0.5) * 255; g = 255; b = 0;
  } else {
    r = 255; g = 255 * (1 - 4 * (v - 0.75)); b = 0;
  }
  return [Math.floor(r), Math.floor(g), Math.floor(b)];
};

// SPEED OPTIMIZATION: Process maps at lower resolution.
// 512px is sufficient for forensic heatmaps and significantly reduces CPU load.
const PROCESSING_MAX_DIM = 512;

const getOptimalDimensions = (width: number, height: number) => {
  if (width > PROCESSING_MAX_DIM || height > PROCESSING_MAX_DIM) {
    const ratio = Math.min(PROCESSING_MAX_DIM / width, PROCESSING_MAX_DIM / height);
    return {
      width: Math.round(width * ratio),
      height: Math.round(height * ratio)
    };
  }
  return { width, height };
};

/**
 * Generates an Enhanced Error Level Analysis heatmap.
 */
export const generateELA = async (file: File): Promise<string> => {
  try {
    const originalImage = await loadImage(file);
    const canvas = document.createElement('canvas');
    const { width, height } = getOptimalDimensions(originalImage.width, originalImage.height);
    
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error("Canvas context unavailable");

    // 1. Draw Original
    ctx.drawImage(originalImage, 0, 0, width, height);
    const originalData = ctx.getImageData(0, 0, width, height);

    // 2. Compress (90% Quality)
    const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.90);
    const compressedImage = await loadImage(jpegDataUrl);

    // 3. Draw Compressed
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(compressedImage, 0, 0, width, height);
    const compressedData = ctx.getImageData(0, 0, width, height);

    // 4. Calculate Difference
    const diffs = new Float32Array(width * height);
    const elaImageData = ctx.createImageData(width, height);
    const data = elaImageData.data;
    
    // First pass: Collect differences
    // Optimized loop
    const oData = originalData.data;
    const cData = compressedData.data;
    
    for (let i = 0, j = 0; i < oData.length; i += 4, j++) {
      const rDiff = Math.abs(oData[i] - cData[i]);
      const gDiff = Math.abs(oData[i+1] - cData[i+1]);
      const bDiff = Math.abs(oData[i+2] - cData[i+2]);
      diffs[j] = (rDiff + gDiff + bDiff) / 3;
    }

    // Find 98th percentile
    const sampleSize = Math.min(diffs.length, 2000);
    const samples = new Float32Array(sampleSize);
    const step = Math.floor(diffs.length / sampleSize);
    for(let i=0; i<sampleSize; i++) samples[i] = diffs[i*step];
    samples.sort();
    const percentile98 = samples[Math.floor(sampleSize * 0.98)];
    
    const scalingFactor = percentile98 > 0 ? (255 / (percentile98 * 1.2)) : 50;

    // Second pass: Apply colormap
    for (let i = 0, j = 0; i < data.length; i += 4, j++) {
      const diffVal = diffs[j];
      const normalized = Math.min(1, (diffVal * scalingFactor) / 255);
      const [r, g, b] = getJetColor(normalized);

      data[i] = r;
      data[i+1] = g;
      data[i+2] = b;
      data[i+3] = 255;
    }

    ctx.putImageData(elaImageData, 0, 0);
    return canvas.toDataURL('image/png').split(',')[1];
  } catch (error) {
    console.error("ELA Generation failed:", error);
    throw error;
  }
};

/**
 * Generates a Sobel Edge Detection Map.
 */
export const generateSobel = async (file: File): Promise<string> => {
  try {
    const img = await loadImage(file);
    const canvas = document.createElement('canvas');
    const { width, height } = getOptimalDimensions(img.width, img.height);

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error("Canvas context unavailable");

    ctx.drawImage(img, 0, 0, width, height);
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // Grayscale
    const gray = new Uint8Array(width * height);
    for (let i = 0; i < data.length; i += 4) {
      gray[i/4] = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];
    }

    const outputData = ctx.createImageData(width, height);
    const out = outputData.data;

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        
        const p00 = gray[idx - width - 1];
        const p02 = gray[idx - width + 1];
        const p10 = gray[idx - 1];
        const p12 = gray[idx + 1];
        const p20 = gray[idx + width - 1];
        const p22 = gray[idx + width + 1];

        const gx = -p00 + p02 - 2*p10 + 2*p12 - p20 + p22;
        const gy = -p00 - 2*gray[idx - width] - p02 + p20 + 2*gray[idx + width] + p22;

        const val = Math.min(255, Math.sqrt(gx*gx + gy*gy));

        const i = idx * 4;
        out[i] = val;
        out[i+1] = val;
        out[i+2] = val;
        out[i+3] = 255;
      }
    }

    ctx.putImageData(outputData, 0, 0);
    return canvas.toDataURL('image/png').split(',')[1];
  } catch (error) {
    console.error("Sobel Generation failed:", error);
    throw error;
  }
};

/**
 * Generates a Local Noise Analysis (LNA) Map.
 */
export const generateLNA = async (file: File): Promise<string> => {
  try {
    const img = await loadImage(file);
    const canvas = document.createElement('canvas');
    const { width, height } = getOptimalDimensions(img.width, img.height);

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error("Canvas context unavailable");

    ctx.drawImage(img, 0, 0, width, height);
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    const gray = new Uint8Array(width * height);
    for (let i = 0; i < data.length; i += 4) {
      gray[i/4] = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];
    }

    const outputData = ctx.createImageData(width, height);
    const out = outputData.data;
    const blockSize = 8;

    for (let y = 0; y < height; y += blockSize) {
      for (let x = 0; x < width; x += blockSize) {
        let sum = 0, sumSq = 0, count = 0;

        for (let by = 0; by < blockSize; by++) {
          const cy = y + by;
          if (cy >= height) break;
          for (let bx = 0; bx < blockSize; bx++) {
            const cx = x + bx;
            if (cx >= width) break;
            
            const val = gray[cy * width + cx];
            sum += val;
            sumSq += val * val;
            count++;
          }
        }

        if (count === 0) continue;
        const mean = sum / count;
        const variance = (sumSq / count) - (mean * mean);
        const intensity = Math.min(255, Math.sqrt(Math.max(0, variance)) * 5);

        for (let by = 0; by < blockSize; by++) {
          const cy = y + by;
          if (cy >= height) break;
          for (let bx = 0; bx < blockSize; bx++) {
            const cx = x + bx;
            if (cx >= width) break;
            
            const idx = (cy * width + cx) * 4;
            out[idx] = intensity * 0.2;
            out[idx+1] = intensity;
            out[idx+2] = intensity * 0.2;
            out[idx+3] = 255;
          }
        }
      }
    }

    ctx.putImageData(outputData, 0, 0);
    return canvas.toDataURL('image/png').split(',')[1];
  } catch (error) {
    console.error("LNA Generation failed:", error);
    throw error;
  }
};

/**
 * Generates an Enhanced Median Filter Residual (MFR) Map.
 */
export const generateMFR = async (file: File): Promise<string> => {
  try {
    const img = await loadImage(file);
    const canvas = document.createElement('canvas');
    const { width, height } = getOptimalDimensions(img.width, img.height);

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error("Canvas context unavailable");

    ctx.drawImage(img, 0, 0, width, height);
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // Grayscale
    const gray = new Uint8Array(width * height);
    for (let i = 0; i < data.length; i += 4) {
      gray[i/4] = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];
    }

    const residuals = new Float32Array(width * height);
    // Reuse array to prevent GC thrashing in tight loop
    const neighbors = new Float32Array(9);

    for (let y = 1; y < height - 1; y++) {
      const widthY = y * width;
      for (let x = 1; x < width - 1; x++) {
        let ni = 0;
        // Unrolled for performance (3x3)
        // Row -1
        let rOffset = widthY - width + x;
        neighbors[ni++] = gray[rOffset-1]; neighbors[ni++] = gray[rOffset]; neighbors[ni++] = gray[rOffset+1];
        // Row 0
        rOffset = widthY + x;
        neighbors[ni++] = gray[rOffset-1]; neighbors[ni++] = gray[rOffset]; neighbors[ni++] = gray[rOffset+1];
        // Row +1
        rOffset = widthY + width + x;
        neighbors[ni++] = gray[rOffset-1]; neighbors[ni++] = gray[rOffset]; neighbors[ni++] = gray[rOffset+1];
        
        neighbors.sort();
        const median = neighbors[4];
        residuals[widthY + x] = Math.abs(gray[widthY + x] - median) * 10;
      }
    }

    // Smoothing
    const outputData = ctx.createImageData(width, height);
    const out = outputData.data;
    const radius = 2;

    for (let y = radius; y < height - radius; y++) {
      for (let x = radius; x < width - radius; x++) {
        let sum = 0;
        let count = 0;
        for (let ky = -radius; ky <= radius; ky++) {
          for (let kx = -radius; kx <= radius; kx++) {
             sum += residuals[(y + ky) * width + (x + kx)];
             count++;
          }
        }
        
        const density = Math.min(255, sum / count);
        const i = (y * width + x) * 4;
        out[i] = density;
        out[i+1] = density;
        out[i+2] = density;
        out[i+3] = 255;
      }
    }

    ctx.putImageData(outputData, 0, 0);
    return canvas.toDataURL('image/png').split(',')[1];
  } catch (error) {
    console.error("MFR Generation failed:", error);
    throw error;
  }
};
