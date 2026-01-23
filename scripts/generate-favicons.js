#!/usr/bin/env node
/**
 * Generate Praxis favicon files and OG image
 * Run: node scripts/generate-favicons.js
 * 
 * This script opens the HTML generator in your default browser.
 * Follow the on-screen instructions to download the files.
 */

import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');
const htmlPath = join(projectRoot, 'public', 'generate-favicons.html');

if (!existsSync(htmlPath)) {
  console.error('❌ generate-favicons.html not found!');
  process.exit(1);
}

console.log('🌐 Opening favicon generator in your browser...\n');
console.log('📋 Instructions:');
console.log('   1. Click "Generate All Favicons"');
console.log('   2. Click "Generate OG Image"');
console.log('   3. Right-click each canvas and "Save image as..."');
console.log('   4. Save files to the public/ directory\n');

// Open in default browser
const command = process.platform === 'darwin' 
  ? `open "${htmlPath}"`
  : process.platform === 'win32'
  ? `start "" "${htmlPath}"`
  : `xdg-open "${htmlPath}"`;

exec(command, (error) => {
  if (error) {
    console.error('❌ Could not open browser automatically.');
    console.log(`\n📂 Please manually open: ${htmlPath}\n`);
  } else {
    console.log('✅ Browser opened! Follow the instructions above.\n');
  }
});
