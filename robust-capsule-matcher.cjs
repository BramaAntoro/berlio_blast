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

// Normalized Cross Correlation (NCC) is invariant to linear brightness/contrast changes!
// This is perfect for matching capsules under different lighting conditions.
function matchNCC(full, cap, scale) {
  const cw = Math.round(cap.width * scale);
  const ch = Math.round(cap.height * scale);
  if (cw < 10 || ch < 10) return null;
  
  // Resize capsule template
  const rCap = { width: cw, height: ch, data: new Uint8Array(cw * ch * 4) };
  for (let y = 0; y < ch; y++) {
    const sy = Math.floor(y * cap.height / ch);
    for (let x = 0; x < cw; x++) {
      const sx = Math.floor(x * cap.width / cw);
      const sIdx = (cap.width * sy + sx) << 2;
      const dIdx = (cw * y + x) << 2;
      rCap.data[dIdx] = cap.data[sIdx];
      rCap.data[dIdx + 1] = cap.data[sIdx + 1];
      rCap.data[dIdx + 2] = cap.data[sIdx + 2];
      rCap.data[dIdx + 3] = cap.data[sIdx + 3];
    }
  }
  
  // Get active pixels in template
  const templatePixels = [];
  let sumR = 0, sumG = 0, sumB = 0;
  for (let y = 0; y < ch; y++) {
    for (let x = 0; x < cw; x++) {
      const idx = (cw * y + x) << 2;
      if (rCap.data[idx + 3] > 150) { // Opaque enough
        const r = rCap.data[idx];
        const g = rCap.data[idx + 1];
        const b = rCap.data[idx + 2];
        templatePixels.push({ x, y, r, g, b });
        sumR += r;
        sumG += g;
        sumB += b;
      }
    }
  }
  
  const N = templatePixels.length;
  if (N < 100) return null;
  
  const avgR = sumR / N;
  const avgG = sumG / N;
  const avgB = sumB / N;
  
  // Compute variance for template
  let varR = 0, varG = 0, varB = 0;
  for (const p of templatePixels) {
    varR += (p.r - avgR) ** 2;
    varG += (p.g - avgG) ** 2;
    varB += (p.b - avgB) ** 2;
  }
  
  const stdR = Math.sqrt(varR);
  const stdG = Math.sqrt(varG);
  const stdB = Math.sqrt(varB);
  
  // Search area: glass dome
  const matches = [];
  const startY = Math.floor(0.12 * full.height);
  const endY = Math.floor(0.55 * full.height) - ch;
  const startX = Math.floor(0.15 * full.width);
  const endX = Math.floor(0.85 * full.width) - cw;
  
  for (let y = startY; y < endY; y += 4) { // step 4 for speed
    for (let x = startX; x < endX; x += 4) {
      // Compute means of search window
      let windowSumR = 0, windowSumG = 0, windowSumB = 0;
      let valid = true;
      
      for (const p of templatePixels) {
        const fx = x + p.x;
        const fy = y + p.y;
        const idx = (full.width * fy + fx) << 2;
        if (full.data[idx + 3] < 150) {
          valid = false;
          break;
        }
        windowSumR += full.data[idx];
        windowSumG += full.data[idx + 1];
        windowSumB += full.data[idx + 2];
      }
      
      if (!valid) continue;
      
      const wAvgR = windowSumR / N;
      const wAvgG = windowSumG / N;
      const wAvgB = windowSumB / N;
      
      // Compute cross-covariance
      let covR = 0, covG = 0, covB = 0;
      let wVarR = 0, wVarG = 0, wVarB = 0;
      
      for (const p of templatePixels) {
        const fx = x + p.x;
        const fy = y + p.y;
        const idx = (full.width * fy + fx) << 2;
        
        const fr = full.data[idx];
        const fg = full.data[idx + 1];
        const fb = full.data[idx + 2];
        
        const dTemplateR = p.r - avgR;
        const dTemplateG = p.g - avgG;
        const dTemplateB = p.b - avgB;
        
        const dWindowR = fr - wAvgR;
        const dWindowG = fg - wAvgG;
        const dWindowB = fb - wAvgB;
        
        covR += dTemplateR * dWindowR;
        covG += dTemplateG * dWindowG;
        covB += dTemplateB * dWindowB;
        
        wVarR += dWindowR ** 2;
        wVarG += dWindowG ** 2;
        wVarB += dWindowB ** 2;
      }
      
      const wStdR = Math.sqrt(wVarR);
      const wStdG = Math.sqrt(wVarG);
      const wStdB = Math.sqrt(wVarB);
      
      if (stdR * wStdR === 0 || stdG * wStdG === 0 || stdB * wStdB === 0) continue;
      
      const nccR = covR / (stdR * wStdR);
      const nccG = covG / (stdG * wStdG);
      const nccB = covB / (stdB * wStdB);
      
      // Combined NCC
      const ncc = (nccR + nccG + nccB) / 3;
      if (ncc > 0.82) { // high threshold
        matches.push({
          x: x + cw / 2,
          y: y + ch / 2,
          size: Math.max(cw, ch),
          ncc
        });
      }
    }
  }
  
  return matches;
}

async function run() {
  const full = await readPNG('src/assets/images/mesin full.png');
  const caps = {
    biru: await readPNG('src/assets/images/capsul_biru.png'),
    kuning: await readPNG('src/assets/images/capsul_kuning.png'),
    merah: await readPNG('src/assets/images/capsul_merah.png'),
  };
  
  const allMatches = [];
  
  for (const [color, capImg] of Object.entries(caps)) {
    console.log(`Matching capsule ${color} using NCC...`);
    // Search scales from 0.18 to 0.28 (since diameter is 18-28% of capsule canvas)
    for (let scale = 0.18; scale <= 0.30; scale += 0.015) {
      const matches = matchNCC(full, capImg, scale);
      if (matches) {
        for (const m of matches) {
          allMatches.push({ color, ...m });
        }
      }
    }
  }
  
  // Non-maximum suppression
  allMatches.sort((a, b) => b.ncc - a.ncc);
  const finalMatches = [];
  for (const match of allMatches) {
    let overlap = false;
    for (const fm of finalMatches) {
      const dx = fm.x - match.x;
      const dy = fm.y - match.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const minDist = (fm.size + match.size) / 2 * 0.75;
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
    // Convert to empty coordinates
    const scale = 2.39;
    const dx = -23.0;
    const dy = -13.5;
    
    const xEmpty = (m.x - dx) / scale;
    const yEmpty = (m.y - dy) / scale;
    const sizeEmpty = m.size / scale;
    
    const pctLeft = (xEmpty / 558) * 100;
    const pctTop = (yEmpty / 447) * 100;
    const pctSize = (sizeEmpty / 558) * 100;
    
    console.log(`{ top: ${pctTop.toFixed(1)}, left: ${pctLeft.toFixed(1)}, size: ${pctSize.toFixed(1)}, color: "${m.color}" }, // ncc: ${m.ncc.toFixed(3)}, pos: (${Math.round(m.x)}, ${Math.round(m.y)})`);
  }
}

run().catch(console.error);