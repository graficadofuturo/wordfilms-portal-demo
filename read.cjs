const fs = require('fs');
const content = fs.readFileSync('node_modules/formdata-polyfill/FormData.js', 'utf8');
const lines = content.split('\n');
lines.forEach((line, i) => {
  if (line.includes('fetch')) {
    console.log(`${i + 1}: ${line}`);
  }
});
