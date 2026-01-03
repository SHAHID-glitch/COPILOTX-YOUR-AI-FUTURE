#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🎨 Building Tailwind CSS...\n');

// Ensure dist directory exists
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

try {
  // Build using PostCSS with Tailwind plugin
  const postcss = require('postcss');
  const tailwindcss = require('@tailwindcss/postcss');
  const autoprefixer = require('autoprefixer');
  
  const inputFile = path.join(__dirname, 'style-tailwind.css');
  const outputFile = path.join(__dirname, 'dist', 'output.css');
  
  console.log('📖 Reading input file:', inputFile);
  const css = fs.readFileSync(inputFile, 'utf8');
  
  console.log('⚙️  Processing with Tailwind & PostCSS...');
  postcss([tailwindcss, autoprefixer])
    .process(css, { from: inputFile, to: outputFile })
    .then(result => {
      fs.writeFileSync(outputFile, result.css);
      
      if (result.map) {
        fs.writeFileSync(outputFile + '.map', result.map.toString());
      }
      
      const stats = fs.statSync(outputFile);
      const sizeInKB = (stats.size / 1024).toFixed(2);
      
      console.log('\n✅ Build completed successfully!');
      console.log(`📦 Output: ${outputFile}`);
      console.log(`📊 Size: ${sizeInKB} KB`);
      console.log('\n💡 To use this CSS, include it in your HTML:');
      console.log('   <link rel="stylesheet" href="dist/output.css">');
    })
    .catch(error => {
      console.error('\n❌ Build failed:', error);
      process.exit(1);
    });
    
} catch (error) {
  console.error('\n❌ Error:', error.message);
  console.log('\n💡 Make sure all dependencies are installed:');
  console.log('   npm install -D tailwindcss postcss autoprefixer @tailwindcss/forms');
  process.exit(1);
}
