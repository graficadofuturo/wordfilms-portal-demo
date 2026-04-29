
const fs = require('fs');
const content = fs.readFileSync('src/components/Logo.tsx', 'utf8');
const paths = content.match(/d="([^"]+)"/g);

let minX = Infinity, maxX = -Infinity;
let minY = Infinity, maxY = -Infinity;

function parsePath(d) {
  const commands = d.match(/[a-df-z][^a-df-z]*/ig);
  let curX = 0, curY = 0;
  
  commands.forEach(cmd => {
    const type = cmd[0];
    const args = cmd.slice(1).trim().split(/[\s,]+/).map(Number).filter(n => !isNaN(n));
    
    if (type === 'M' || type === 'm') {
      for (let i = 0; i < args.length; i += 2) {
        if (type === 'M') { curX = args[i]; curY = args[i+1]; }
        else { curX += args[i]; curY += args[i+1]; }
        updateBounds(curX, curY);
      }
    } else if (type === 'L' || type === 'l') {
      for (let i = 0; i < args.length; i += 2) {
        if (type === 'L') { curX = args[i]; curY = args[i+1]; }
        else { curX += args[i]; curY += args[i+1]; }
        updateBounds(curX, curY);
      }
    } else if (type === 'C' || type === 'c') {
      for (let i = 0; i < args.length; i += 6) {
        // We only care about the end point for bounds (approx)
        if (type === 'C') { curX = args[i+4]; curY = args[i+5]; }
        else { curX += args[i+4]; curY += args[i+5]; }
        updateBounds(curX, curY);
      }
    } else if (type === 'Z' || type === 'z') {
      // close path
    }
  });
}

function updateBounds(x, y) {
  if (x < minX) minX = x;
  if (x > maxX) maxX = x;
  if (y < minY) minY = y;
  if (y > maxY) maxY = y;
}

paths.forEach(p => {
  const d = p.match(/d="([^"]+)"/)[1];
  parsePath(d);
});

// Apply scale 0.1
minX *= 0.1; maxX *= 0.1; minY *= 0.1; maxY *= 0.1;

console.log({ minX, maxX, minY, maxY });
console.log('Width:', maxX - minX);
console.log('Height:', maxY - minY);
console.log('Center X:', (minX + maxX) / 2);
