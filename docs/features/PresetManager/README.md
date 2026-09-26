# Mapping Preset Manager — Implementation Documentation

**Directory**: `docs/features/PresetManager/`
**Last Updated**: 2026-09-26
**Status**: DONE (Completed: 2026-09-26)

---

## 1. Overview
The Mapping Preset Manager enables users to discover, apply, save, clone, export, and import transaction field mappings across QuickBooks organizations and industry verticals. It eliminates repetitive manual field mapping by offering industry-standard built-in presets and customizable, location-scoped presets.

## 2. Architecture & Components

### Backend
- **Prisma Model**: `Backend/prisma/schema.prisma` (`MappingPreset`)
  - Fields: `id`, `name`, `description`, `industry`, `isBuiltIn`, `mappings` (JSON), `locationId`, timestamps.
  - Relation: `Location` relation with `onDelete: Cascade`.
- **API Router**: `Backend/src/routes/presets.ts`
  - Mounted at `/api/presets` with `authenticate` middleware in `Backend/src/index.ts`.
  - Scoping: `locationFilter(req.user!)` enforces location tenancy.
  - Permissions: `requireFeaturePermission('map', 'read')` for GET; `requireFeaturePermission('map', 'write')` for POST/PUT/DELETE/clone.
  - Protection: Built-in presets (`isBuiltIn: true`) return `403 Forbidden` on update or delete attempts.
  - Seeding: `seedDefaultPresets()` populates Retail, Restaurant, and Professional Services defaults on startup.

### Frontend
- **Type Definitions**: `Frontend/src/types/index.ts`
  - `MappingPreset`: Matches backend preset model using `Mapping[]`.
  - `ImportPresetPayload`: Type-safe schema for JSON imports.
- **API Client**: `Frontend/src/popup/lib/api.ts`
  - Typed methods: `getPresets`, `createPreset`, `updatePreset`, `deletePreset`, `clonePreset`.
- **UI Modal**: `Frontend/src/popup/components/MappingView/PresetManagerModal.tsx`
  - Preset catalog with search filter, built-in vs. custom badges.
  - "Save Current as Preset" form serializing active mappings via `.map(encodeToApi)`.
  - Overwrite protection warning before applying presets over unsaved edits (`isDirty`).
  - Clone workflow creating location-scoped custom copies.
  - Client-side JSON file export (Blob download) & import parsing.
  - Clipboard sharing with browser fallback.
- **Integration**: `Frontend/src/popup/components/MappingView/index.tsx`
  - Toolbar controls for "Presets" manager and "Save as Preset".
  - Deserializes preset mappings into local state via `.map(decodeFromApi)`.

## 3. Security & Access Control
- All custom presets require a non-null `locationId` validated both client-side and server-side.
- Users can only view and manage custom presets belonging to their authorized locations.
- Built-in presets are immutable globally across all tenants.

## 4. Verification & Test Evidence
- **Backend Tests**: Verified passing with 100% success rate across all test suites.
- **Frontend Tests**: Verified passing with 100% success rate across all test files including `PresetManager.test.tsx`.
- **Frontend Build**: `npm run build` exits with code 0 (zero TypeScript errors).
