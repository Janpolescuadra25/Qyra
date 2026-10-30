# Deliverable 12.7 Part 2: Cross-Browser Extension Rollout

## Status

Completed on 2026-10-30. Qyra now produces browser-specific Manifest V3 distributions for Chrome, Edge, Firefox, and Safari while retaining the legacy Chrome output expected by the existing release process.

## Browser API architecture

- `Frontend/src/lib/browser.ts` is the callback-compatible WebExtension API facade used by extension source files.
- `Frontend/src/lib/setupPolyfill.ts` loads `webextension-polyfill` into every production bundle through esbuild injection.
- Direct runtime `chrome.*` calls in `Frontend/src` were migrated to the shared `browser` facade. Chrome namespace references remain only where required for TypeScript types.

## Build outputs

| Browser | Target | Manifest adaptation | Output |
| --- | --- | --- | --- |
| Chrome | `chrome120` | Standard MV3 service worker | `dist/chrome` |
| Edge | `edge120` | Standard MV3 service worker | `dist/edge` |
| Firefox | `firefox109` | Gecko ID and background scripts declaration | `dist/firefox` |
| Safari | `safari16` | Safari-compatible strict extension CSP | `dist/safari` |

Every target includes the popup, Toast scanner, SALIDO scanner, Oracle scanner, background worker, Tailwind CSS, icons, and tailored manifest. Chrome is also copied to the legacy root `dist/` layout.

## Commands

```bash
npm run build:chrome
npm run build:firefox
npm run build:edge
npm run build:safari
npm run build:all
npm run package:all
```

Packaging creates Chrome, Firefox, and Edge archives under `Frontend/releases/`. The Chrome archive is also copied to `Frontend/qyra-extension.zip` for the existing Chrome Web Store workflow. Safari conversion and signing remain an Xcode/App Store distribution step performed from `dist/safari`.

## Firefox manifest contract

Firefox builds include `browser_specific_settings.gecko.id` set to `qyra-extension@qyra.space` and `strict_min_version` set to `109.0`.

## Verification

`Frontend/src/lib/__tests__/browser.test.ts` covers vendor detection and storage facade behavior. Release acceptance also requires the complete frontend tests, typecheck, all-browser build, packaging, backend replication test, full backend suite, and backend TypeScript build.
