
const fs = require('fs');
const content = fs.readFileSync('src/components/Logo.tsx', 'utf8');
const paths = content.match(/d="([^"]+)"/g);

let minX = Infinity, maxX = -Infinity;
let minY = Infinity, maxY = -Infinity;

paths.forEach(p => {
  const d = p.match(/d="([^"]+)"/)[1];
  const coords = d.match(/-?\d+/g).map(Number);
  for (let i = 0; i < coords.length; i += 2) {
    const x = coords[i];
    const y = coords[i+1];
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
});

console.log({ minX, maxX, minY, maxY });
