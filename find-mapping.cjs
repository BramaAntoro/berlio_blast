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

// Check if a pixel is part of the blue border/header of the machine (avoiding capsules and lever)
// The blue header at the top is very safe.
// In empty, let's find the blue header coordinates.
// The blue header is roughly at y from 12 to 100 in empty.
// Let's sample some points in the blue header.
function getMachinePoints(img) {
  const points = [];
  for (let y = 15; y < 80; y++) {
    for (let x = 110; x < 450; x++) {
      const idx = (img.width * y + x) << 2;
      const r = img.data[idx];
      const g = img.data[idx + 1];
      const b = img.data[idx + 2];
      const a = img.data[idx + 3];
      // Blue header color is mostly blue: e.g., b > 150, r < 100, g < 150
      if (a > 250 && b > 180 && r < 50 && g < 120) {
        points.push({ x, y, r, g, b });
      }
    }
  }
  return points;
}

async function run() {
  const empty = await readPNG('src/assets/images/mesin_kosong.png');
  const full = await readPNG('src/assets/images/mesin full.png');
  
  const samplePoints = getMachinePoints(empty);
  console.log(`Sampled ${samplePoints.length} blue header points from empty`);
  
  // Now let's find the best scale s and offset dx, dy in full
  // such that for each point (x, y) in empty, the point (x * s + dx, y * s + dy) in full
  // has the closest color (r, g, b).
  // We can sub-sample the points to make it fast (e.g. every 10th point)
  const step = 5;
  const testPoints = [];
  for (let i = 0; i < samplePoints.length; i += step) {
    testPoints.push(samplePoints[i]);
  }
  console.log(`Using ${testPoints.length} points for alignment search`);
  
  let bestScale = 0;
  let bestDx = 0;
  let bestDy = 0;
  let minDiff = Infinity;
  
  // We know scale is around 2.4 to 2.6
  // Let's search scale from 2.3 to 2.7 with step 0.01
  // For each scale, the bounding box of empty is x: 104 to 465 (w: 361)
  // Bounded box of empty scaled is 361 * s.
  // In full, the blue header is at some position.
  // Let's estimate dx, dy:
  // Since the empty topLeft is around (227, 14), and in full it should be around (227 * s + dx, 14 * s + dy).
  // Let's search dy from -50 to 150, and dx from -100 to 200
  
  for (let s = 2.4; s <= 2.6; s += 0.005) {
    for (let dx = -100; dx <= 100; dx += 2) {
      for (let dy = -50; dy <= 50; dy += 2) {
        let diff = 0;
        let validCount = 0;
        for (const p of testPoints) {
          const fx = Math.round(p.x * s + dx);
          const fy = Math.round(p.y * s + dy);
          if (fx >= 0 && fx < full.width && fy >= 0 && fy < full.height) {
            const idx = (full.width * fy + fx) << 2;
            const fr = full.data[idx];
            const fg = full.data[idx + 1];
            const fb = full.data[idx + 2];
            const fa = full.data[idx + 3];
            if (fa > 200) {
              diff += Math.abs(p.r - fr) + Math.abs(p.g - fg) + Math.abs(p.b - fb);
              validCount++;
            } else {
              diff += 3 * 255; // penalty
            }
          } else {
            diff += 3 * 255; // penalty
          }
        }
        
        const avgDiff = diff / testPoints.length;
        if (avgDiff < minDiff) {
          minDiff = avgDiff;
          bestScale = s;
          bestDx = dx;
          bestDy = dy;
        }
      }
    }
  }
  
  console.log(`Coarse Best: scale=${bestScale.toFixed(4)}, dx=${bestDx}, dy=${bestDy}, diff=${minDiff.toFixed(2)}`);
  
  // Fine search
  let fineScale = bestScale;
  let fineDx = bestDx;
  let fineDy = bestDy;
  for (let s = bestScale - 0.01; s <= bestScale + 0.01; s += 0.001) {
    for (let dx = bestDx - 4; dx <= bestDx + 4; dx += 0.5) {
      for (let dy = bestDy - 4; dy <= bestDy + 4; dy += 0.5) {
        let diff = 0;
        for (const p of testPoints) {
          const fx = Math.round(p.x * s + dx);
          const fy = Math.round(p.y * s + dy);
          if (fx >= 0 && fx < full.width && fy >= 0 && fy < full.height) {
            const idx = (full.width * fy + fx) << 2;
            const fr = full.data[idx];
            const fg = full.data[idx + 1];
            const fb = full.data[idx + 2];
            diff += Math.abs(p.r - fr) + Math.abs(p.g - fg) + Math.abs(p.b - fb);
          } else {
            diff += 3 * 255;
          }
        }
        const avgDiff = diff / testPoints.length;
        if (avgDiff < minDiff) {
          minDiff = avgDiff;
          fineScale = s;
          fineDx = dx;
          fineDy = dy;
        }
      }
    }
  }
  
  console.log(`Fine Best: scale=${fineScale.toFixed(5)}, dx=${fineDx.toFixed(1)}, dy=${fineDy.toFixed(1)}, diff=${minDiff.toFixed(2)}`);
  
  // Let's verify the bounding box of the machine in empty image under this transformation.
  // Empty machine bbox: x: 104, y: 12, w: 361, h: 425
  // Left border of machine in full: 104 * scale + dx
  // Right border of machine in full: (104 + 361) * scale + dx
  // Top border of machine in full: 12 * scale + dy
  // Bottom border of machine in full: (12 + 425) * scale + dy
  
  const mLeft = 104 * fineScale + fineDx;
  const mRight = (104 + 361) * fineScale + fineDx;
  const mTop = 12 * fineScale + fineDy;
  const mBottom = (12 + 425) * fineScale + fineDy;
  
  console.log(`Machine in full: left=${mLeft.toFixed(1)}, right=${mRight.toFixed(1)}, top=${mTop.toFixed(1)}, bottom=${mBottom.toFixed(1)}`);
  console.log(`Machine width in full: ${(mRight - mLeft).toFixed(1)}, height: ${(mBottom - mTop).toFixed(1)}`);
  
  // Let's check how the full image dimensions (1343 x 1171) compare to the machine borders.
  // If we crop the empty image with its scale and offset to fit full, let's see where the boundaries lie.
}

run().catch(console.error);