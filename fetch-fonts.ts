import https from 'https';
import fs from 'fs';

const API_KEY = process.env.GOOGLE_FONTS_API_KEY; // I don't have this.

// Let's fetch from a known endpoint or scrape.
// Actually, I can fetch from https://fonts.google.com/metadata/fonts
https.get('https://fonts.google.com/metadata/fonts', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    try {
      // The response might have a prefix like ")]}'"
      const cleanData = data.replace(/^\)\]\}'\n/, '');
      const parsed = JSON.parse(cleanData);
      const fonts = parsed.familyMetadataList.map((f: any) => f.family);
      
      // Ensure directory exists
      if (!fs.existsSync('src/lib')) {
        fs.mkdirSync('src/lib', { recursive: true });
      }
      
      fs.writeFileSync('src/lib/fonts.ts', 'export const GOOGLE_FONTS = ' + JSON.stringify(fonts) + ';');
      console.log('Saved ' + fonts.length + ' fonts');
    } catch(e) { console.error(e); }
  });
});
