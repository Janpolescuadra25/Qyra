const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const outputFile = path.join(rootDir, 'qyra-extension.zip');

console.log('📦 Packaging Qyra Chrome Extension for Chrome Web Store...');

if (!fs.existsSync(distDir)) {
  console.error('❌ dist/ directory not found! Run "npm run build" first.');
  process.exit(1);
}

if (fs.existsSync(outputFile)) {
  fs.unlinkSync(outputFile);
}

try {
  const command = `powershell -Command "Compress-Archive -Path '${distDir}\\*' -DestinationPath '${outputFile}' -Force"`;
  execSync(command, { stdio: 'inherit' });

  const stats = fs.statSync(outputFile);
  const sizeKb = (stats.size / 1024).toFixed(2);
  console.log(`✅ Successfully packaged extension: ${outputFile} (${sizeKb} KB)`);
  console.log('🚀 Ready for Chrome Web Store Developer Dashboard upload.');
} catch (err) {
  console.error('❌ Failed to package extension:', err.message);
  process.exit(1);
}
