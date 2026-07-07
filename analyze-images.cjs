const fs = require('fs');
const path = require('path');
const PNG = require('pngjs').PNG;

function getBoundingBox(filePath) {
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(new PNG())
      .on('parsed', function() {
        let minX = this.width;
        let maxX = 0;
        let minY = this.height;
        let maxY = 0;
        let hasPixels = false;
        
        for (let y = 0; y < this.height; y++) {
          for (let x = 0; x < this.width; x++) {
            const idx = (this.width * y + x) << 2;
            const alpha = this.data[idx + 3];
            if (alpha > 5) { // non-transparent threshold
              hasPixels = true;
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }
        
        resolve({
          width: this.width,
          height: this.height,
          bbox: hasPixels ? {
            x: minX,
            y: minY,
            w: maxX - minX + 1,
            h: maxY - minY + 1
          } : null
        });
      })
      .on('error', reject);
  });
}

async function run() {
  const dir = 'src/assets/images';
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file.endsWith('.png')) {
      const result = await getBoundingBox(path.join(dir, file));
      console.log(`${file}:`, JSON.stringify(result));
    }
  }
}

run().catch(console.error);
