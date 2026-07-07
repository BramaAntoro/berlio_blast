const fs = require('fs');
const PNG = require('pngjs').PNG;

function readPNG(filePath) {
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(new PNG())
      .on('parsed', function() {
        resolve(this);
      })
      .on('error', reject);
  });
}

// Downsample an image by a factor of 8 for fast template matching
function downsample(img, factor) {
  const dw = Math.floor(img.width / factor);
  const dh = Math.floor(img.height / factor);
  const data = new Uint8Array(dw * dh * 4);
  
  for (let dy = 0; dy < dh; dy++) {
    for (let dx = 0; dx < dw; dx++) {
      let r = 0, g = 0, b = 0, a = 0;
      let count = 0;
      
      for (let sy = 0; sy < factor; sy++) {
        const y = dy * factor + sy;
        if (y >= img.height) continue;
        for (let sx = 0; sx < factor; sx++) {
          const x = dx * factor + sx;
          if (x >= img.width) continue;
          
          const idx = (img.width * y + x) << 2;
          r += img.data[idx];
          g += img.data[idx + 1];
          b += img.data[idx + 2];
          a += img.data[idx + 3];
          count++;
        }
      }
      
      const oIdx = (dw * dy + dx) << 2;
      data[oIdx] = r / count;
      data[oIdx + 1] = g / count;
      data[oIdx + 2] = b / count;
      data[oIdx + 3] = a / count;
    }
  }
  
  return { width: dw, height: dh, data };
}

// Scale an image using nearest neighbor
function resize(img, newW, newH) {
  const data = new Uint8Array(newW * newH * 4);
  for (let y = 0; y < newH; y++) {
    const sy = Math.floor(y * img.height / newH);
    for (let x = 0; x < newW; x++) {
      const sx = Math.floor(x * img.width / newW);
      const sIdx = (img.width * sy + sx) << 2;
      const dIdx = (newW * y + x) << 2;
      data[dIdx] = img.data[sIdx];
      data[dIdx + 1] = img.data[sIdx + 1];
      data[dIdx + 2] = img.data[sIdx + 2];
      data[dIdx + 3] = img.data[sIdx + 3];
    }
  }
  return { width: newW, height: newH, data };
}

async function run() {
  const full = await readPNG('src/assets/images/mesin full.png');
  const caps = {
    biru: await readPNG('src/assets/images/capsul_biru.png'),
    kuning: await readPNG('src/assets/images/capsul_kuning.png'),
    merah: await readPNG('src/assets/images/capsul_merah.png'),
  };
  
  const factor = 4;
  const dsFull = downsample(full, factor);
  console.log(`Downsampled full to ${dsFull.width}x${dsFull.height}`);
  
  const dsCaps = {
    biru: downsample(caps.biru, factor),
    kuning: downsample(caps.kuning, factor),
    merah: downsample(caps.merah, factor),
  };
  
  const results = [];
  
  // We want to search for capsule centers in dsFull
  // Let's search scales for capsules.
  // Original capsules are 500x500. In full image, let's estimate how big they are.
  // Since the empty machine scaled by 2.4 fits full, and original capsule (500x500) has a bbox of around 330px,
  // let's search for physical capsule sizes in full.
  // In empty machine (558 wide), a capsule of size 15% is 83.7px on a 558 canvas.
  // In full image (1343 wide), that would be 83.7 * 2.4 = 200px wide.
  // Since original capsule is 500px, a capsule of size 200px means a scale of 200 / 500 = 0.4.
  // Let's search scale of capsules in full from 0.15 to 0.45 with step 0.02.
  // In downsampled coordinates, original capsule is 125x125.
  // Scale of 0.15 to 0.45 means resized capsule is from 18x18 to 56x56.
  
  for (const [color, capImg] of Object.entries(dsCaps)) {
    console.log(`Matching capsule ${color}...`);
    // Find matching positions
    // To make it robust, we calculate the Sum of Absolute Differences (SAD) for RGB values 
    // where the capsule is non-transparent.
    for (let scale = 0.18; scale <= 0.35; scale += 0.02) {
      const w = Math.round(capImg.width * scale);
      const h = Math.round(capImg.height * scale);
      if (w < 10 || h < 10) continue;
      
      const resizedCap = resize(capImg, w, h);
      
      // Calculate active (non-transparent) pixels in the resized capsule template
      const activePixels = [];
      for (let cy = 0; cy < h; cy++) {
        for (let cx = 0; cx < w; cx++) {
          const idx = (w * cy + cx) << 2;
          if (resizedCap.data[idx + 3] > 100) { // alpha threshold
            activePixels.push({
              x: cx,
              y: cy,
              r: resizedCap.data[idx],
              g: resizedCap.data[idx + 1],
              b: resizedCap.data[idx + 2],
            });
          }
        }
      }
      
      if (activePixels.length === 0) continue;
      
      // Slide template over dsFull
      // We restrict the search to the glass dome area in dsFull
      // Glass dome is roughly in the middle-upper part of full.
      // Full is 1343 x 1171. In dsFull, it is 335 x 292.
      // Dome area is roughly: y from 0.15 * height to 0.6 * height, x from 0.1 * width to 0.8 * width.
      const startY = Math.floor(0.12 * dsFull.height);
      const endY = Math.floor(0.55 * dsFull.height) - h;
      const startX = Math.floor(0.1 * dsFull.width);
      const endX = Math.floor(0.8 * dsFull.width) - w;
      
      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          let diffSum = 0;
          let matchedCount = 0;
          
          for (const ap of activePixels) {
            const fx = x + ap.x;
            const fy = y + ap.y;
            const idx = (dsFull.width * fy + fx) << 2;
            
            const fr = dsFull.data[idx];
            const fg = dsFull.data[idx + 1];
            const fb = dsFull.data[idx + 2];
            const fa = dsFull.data[idx + 3];
            
            if (fa > 100) {
              const dr = Math.abs(ap.r - fr);
              const dg = Math.abs(ap.g - fg);
              const db = Math.abs(ap.b - fb);
              diffSum += dr + dg + db;
              matchedCount++;
            } else {
              diffSum += 3 * 255; // mismatch penalty
            }
          }
          
          if (matchedCount > activePixels.length * 0.9) {
            const score = diffSum / activePixels.length;
            if (score < 45) { // very good match
              results.push({
                color,
                x: (x + w / 2) * factor,
                y: (y + h / 2) * factor,
                size: (w * factor), // diameter
                scale: scale * factor,
                score
              });
            }
          }
        }
      }
    }
  }
  
  console.log(`Found ${results.length} raw matches.`);
  
  // Let's filter out overlapping matches to find local minima (best match in neighborhood)
  // Sort by score ascending
  results.sort((a, b) => a.score - b.score);
  
  const finalMatches = [];
  for (const match of results) {
    // Check if this overlaps with any already selected match
    let overlap = false;
    for (const fm of finalMatches) {
      const dx = fm.x - match.x;
      const dy = fm.y - match.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      // If centers are too close (closer than 60% of average size), it's the same capsule
      const minDist = (fm.size + match.size) / 2 * 0.6;
      if (dist < minDist) {
        overlap = true;
        break;
      }
    }
    
    if (!overlap) {
      finalMatches.push(match);
    }
  }
  
  console.log('\n--- Detected Capsules ---');
  for (const m of finalMatches) {
    console.log(`Color: ${m.color.padEnd(6)} | Center: (${Math.round(m.x)}, ${Math.round(m.y)}) | Size: ${Math.round(m.size)} | Score: ${m.score.toFixed(1)}`);
  }
}

run().catch(console.error);