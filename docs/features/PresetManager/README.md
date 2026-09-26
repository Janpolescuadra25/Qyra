# Mapping Preset Manager — Implementation Documentation

**Directory**: `docs/features/PresetManager/`
**Last Updated**: 2026-09-27
**Status**: DONE (Completed: 2026-09-26)

---

## 1. Overview
The Mapping Preset Manager enables users to discover, apply, save, clone, export, and import transaction field mappings across QuickBooks organizations and industry verticals.

## 2. Architecture & Components
- **Backend**: `Backend/prisma/schema.prisma` (`MappingPreset` model with location cascading delete), `Backend/src/routes/presets.ts` (REST CRUD, permission checks, built-in preset protection, `seedDefaultPresets()` seeding).
- **Frontend**: `Frontend/src/types/index.ts` (`MappingPreset` types), `Frontend/src/popup/lib/api.ts` (preset API client), `Frontend/src/popup/components/MappingView/PresetManagerModal.tsx` (preset catalog, save as preset, clone, JSON file export/import, clipboard sharing), `Frontend/src/popup/components/MappingView/index.tsx` (toolbar integration).

## 3. Verification & Test Evidence
- Backend Tests: 142/142 tests passing.
- Frontend Tests: 135/135 tests passing.
