/** Qyra multi-browser extension build pipeline. */
const esbuild = require('esbuild');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const dotenvPath = path.join(ROOT, '.env');
if (fs.existsSync(dotenvPath)) require('dotenv').config({ path: dotenvPath });

const browserArg = process.argv.find((arg) => arg.startsWith('--browser='));
const requestedBrowser = browserArg?.split('=')[1]?.toLowerCase() || 'chrome';
const supportedBrowsers = ['chrome', 'firefox', 'edge', 'safari'];
const targets = requestedBrowser === 'all' ? supportedBrowsers : [requestedBrowser];
if (targets.some((target) => !supportedBrowsers.includes(target))) {
  console.error(`[Build] Unsupported browser: ${requestedBrowser}`);
  process.exit(1);
}

const isWatch = process.argv.includes('--watch');
const backendUrl = process.env.VITE_BACKEND_URL || process.env.BACKEND_URL || 'https://qyra-backend.onrender.com';
const targetMap = { chrome: 'chrome120', edge: 'edge120', firefox: 'firefox109', safari: 'safari16' };

function resetDirectory(directory) {
  fs.rmSync(directory, { recursive: true, force: true });
  for (const child of ['popup', 'content', 'background', 'public/icons']) fs.mkdirSync(path.join(directory, child), { recursive: true });
}

function createManifest(browserName) {
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.json'), 'utf8'));
  manifest.host_permissions = (manifest.host_permissions || []).filter((permission) => !permission.includes('localhost'));
  const csp = manifest.content_security_policy?.extension_pages;
  if (csp) {
    const directives = csp.split(';').map((directive) => directive.trim()).filter(Boolean);
    const connectIndex = directives.findIndex((directive) => directive.startsWith('connect-src'));
    if (connectIndex >= 0) {
      const sources = directives[connectIndex].split(/\s+/).slice(1).filter((source) => !source.includes('localhost'));
      if (!sources.includes('https://quickbooks.api.intuit.com')) sources.push('https://quickbooks.api.intuit.com');
      directives[connectIndex] = `connect-src ${sources.join(' ')}`;
    }
    manifest.content_security_policy.extension_pages = `${directives.join('; ')};`;
  }
  if (browserName === 'firefox') {
    manifest.browser_specific_settings = { gecko: { id: 'qyra-extension@qyra.space', strict_min_version: '109.0' } };
    manifest.background = { scripts: ['background/service-worker.js'] };
  } else {
    delete manifest.browser_specific_settings;
  }
  if (browserName === 'safari') {
    manifest.content_security_policy = { extension_pages: "script-src 'self'; object-src 'self'; connect-src 'self' https://qyra.space https://api.qyra.space https://*.qyra.space https://*.sentry.io https://appcenter.intuit.com https://oauth.platform.intuit.com https://sandbox-quickbooks.api.intuit.com https://quickbooks.api.intuit.com https://developer.intuit.com;" };
  }
  return manifest;
}

function copyStaticFiles(outdir, browserName) {
  fs.writeFileSync(path.join(outdir, 'manifest.json'), `${JSON.stringify(createManifest(browserName), null, 2)}\n`);
  fs.copyFileSync(path.join(ROOT, 'src/popup/index.html'), path.join(outdir, 'popup/index.html'));
  const iconsDir = path.join(ROOT, 'public/icons');
  if (fs.existsSync(iconsDir)) {
    for (const file of fs.readdirSync(iconsDir)) fs.copyFileSync(path.join(iconsDir, file), path.join(outdir, 'public/icons', file));
  }
}

async function buildTarget(browserName) {
  const outdir = path.join(DIST, browserName);
  resetDirectory(outdir);
  copyStaticFiles(outdir, browserName);
  const shared = {
    bundle: true,
    platform: 'browser',
    target: targetMap[browserName],
    sourcemap: isWatch,
    inject: [path.join(ROOT, 'src/lib/setupPolyfill.ts')],
    define: {
      'process.env.NODE_ENV': JSON.stringify(isWatch ? 'development' : 'production'),
      'process.env.TARGET_BROWSER': JSON.stringify(browserName),
      'process.env.BACKEND_URL': JSON.stringify(backendUrl),
      'process.env.VITE_BACKEND_URL': JSON.stringify(backendUrl),
      'process.env.VITE_SENTRY_DSN': JSON.stringify(process.env.VITE_SENTRY_DSN || ''),
      'process.env.SENTRY_DSN': JSON.stringify(process.env.VITE_SENTRY_DSN || ''),
    },
  };
  const builds = [
    ['src/popup/Popup.tsx', 'popup/popup.js', { jsx: 'automatic', jsxImportSource: 'react' }],
    ['src/content/scanner.ts', 'content/scanner.js', {}],
    ['src/content/salido-scanner.ts', 'content/salido-scanner.js', {}],
    ['src/content/oracle-scanner.ts', 'content/oracle-scanner.js', {}],
    ['src/background/service-worker.ts', 'background/service-worker.js', { format: browserName === 'firefox' ? 'iife' : 'esm' }],
  ];
  for (const [entry, output, overrides] of builds) {
    await esbuild.build({ ...shared, entryPoints: [path.join(ROOT, entry)], outfile: path.join(outdir, output), ...overrides });
  }
  execFileSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['tailwindcss', '-i', path.join(ROOT, 'src/popup/popup.css'), '-o', path.join(outdir, 'popup/popup.css'), '--minify'], { stdio: 'inherit', cwd: ROOT, shell: process.platform === 'win32' });
  console.log(`[Build] ${browserName} -> dist/${browserName}`);
  if (browserName === 'chrome') {
    for (const legacyPath of ['popup', 'content', 'background', 'public', 'manifest.json']) {
      fs.rmSync(path.join(DIST, legacyPath), { recursive: true, force: true });
      fs.cpSync(path.join(outdir, legacyPath), path.join(DIST, legacyPath), { recursive: true });
    }
    console.log('[Build] Legacy Chrome output synchronized to dist/');
  }
}

(async () => {
  fs.mkdirSync(DIST, { recursive: true });
  for (const browserName of targets) await buildTarget(browserName);
  console.log(`[Build] Completed: ${targets.join(', ')}`);
})().catch((error) => {
  console.error('[Build] Failed:', error);
  process.exit(1);
});
