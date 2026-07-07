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

async function run() {
  const full = await readPNG('src/assets/images/mesin full.png');
  
  // We classify pixels inside the dome area in mesin full.png:
  // x: [230, 1080]
  // y: [150, 650]
  
  const width = full.width;
  const height = full.height;
  
  const clusters = [];
  const visited = new Uint8Array(width * height);
  
  for (let y = 150; y < 650; y++) {
    for (let x = 230; x < 1080; x++) {
      const idx = (width * y + x) << 2;
      const r = full.data[idx];
      const g = full.data[idx + 1];
      const b = full.data[idx + 2];
      const a = full.data[idx + 3];
      
      if (a < 200) continue;
      
      let color = null;
      
      // Fine-tune the color thresholds based on the actual capsule image colors
      // Red: R is high, G & B are low
      if (r > 160 && g < 70 && b < 70) {
        color = 'merah';
      }
      // Blue: B is high, R & G are low
      else if (b > 160 && r < 70 && g < 140) {
        color = 'biru';
      }
      // Yellow: R & G are high, B is low
      else if (r > 170 && g > 150 && b < 60) {
        color = 'kuning';
      }
      
      if (color && !visited[y * width + x]) {
        // Run a simple BFS/DFS to find the cluster
        const q = [{ x, y }];
        visited[y * width + x] = 1;
        
        let sumX = 0, sumY = 0, count = 0;
        let minX = width, maxX = 0, minY = height, maxY = 0;
        
        while (q.length > 0) {
          const curr = q.shift();
          sumX += curr.x;
          sumY += curr.y;
          count++;
          
          if (curr.x < minX) minX = curr.x;
          if (curr.x > maxX) maxX = curr.x;
          if (curr.y < minY) minY = curr.y;
          if (curr.y > maxY) maxY = curr.y;
          
          // Check 4 neighbors
          const neighbors = [
            { x: curr.x + 1, y: curr.y },
            { x: curr.x - 1, y: curr.y },
            { x: curr.x, y: curr.y + 1 },
            { x: curr.x, y: curr.y - 1 },
          ];
          
          for (const n of neighbors) {
            if (n.x >= 230 && n.x < 1080 && n.y >= 150 && n.y < 650) {
              const nIdx = (width * n.y + n.x) << 2;
              const nr = full.data[nIdx];
              const ng = full.data[nIdx + 1];
              const nb = full.data[nIdx + 2];
              const na = full.data[nIdx + 3];
              
              if (na >= 200 && !visited[n.y * width + n.x]) {
                let nColor = null;
                if (color === 'merah' && nr > 140 && ng < 90 && nb < 90) nColor = 'merah';
                else if (color === 'biru' && nb > 140 && nr < 90 && ng < 160) nColor = 'biru';
                else if (color === 'kuning' && nr > 150 && ng > 130 && nb < 80) nColor = 'kuning';
                
                if (nColor === color) {
                  visited[n.y * width + n.x] = 1;
                  q.push(n);
                }
              }
            }
          }
        }
        
        // If the cluster is reasonably large (e.g., > 400 pixels, which corresponds to at least a small capsule)
        if (count > 400) {
          clusters.push({
            color,
            cx: sumX / count,
            cy: sumY / count,
            w: maxX - minX + 1,
            h: maxY - minY + 1,
            count
          });
        }
      }
    }
  }
  
  console.log(`Found ${clusters.length} color clusters:`);
  clusters.sort((a, b) => b.count - a.count);
  for (const c of clusters) {
    console.log(`Color: ${c.color.padEnd(6)} | Center: (${c.cx.toFixed(1)}, ${c.cy.toFixed(1)}) | Size: ${c.w}x${c.h} | Pixels: ${c.count}`);
  }
}

run().catch(console.error);