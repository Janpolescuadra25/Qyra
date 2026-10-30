const { ZipArchive } = require('archiver');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const RELEASES = path.join(ROOT, 'releases');
const browsers = ['chrome', 'firefox', 'edge'];
fs.mkdirSync(RELEASES, { recursive: true });

function packageBrowser(browserName) {
  const source = path.join(ROOT, 'dist', browserName);
  const outputPath = path.join(RELEASES, `qyra-extension-${browserName}.zip`);
  if (!fs.existsSync(source)) throw new Error(`Missing dist/${browserName}; run npm run build:all first.`);
  fs.rmSync(outputPath, { force: true });
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath);
    const archive = new ZipArchive({ zlib: { level: 9 } });
    output.on('close', () => {
      console.log(`[Package] ${browserName}: releases/${path.basename(outputPath)} (${archive.pointer()} bytes)`);
      resolve(outputPath);
    });
    output.on('error', reject);
    archive.on('error', reject);
    archive.pipe(output);
    archive.directory(source, false);
    archive.finalize();
  });
}

(async () => {
  const outputs = {};
  for (const browserName of browsers) outputs[browserName] = await packageBrowser(browserName);
  fs.copyFileSync(outputs.chrome, path.join(ROOT, 'qyra-extension.zip'));
  console.log('[Package] Legacy qyra-extension.zip synchronized from Chrome package.');
})().catch((error) => {
  console.error('[Package] Failed:', error);
  process.exit(1);
});
