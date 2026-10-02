# Frontend Mapping Presets UI Architecture

**Directory**: `Frontend/src/popup/components/MappingView/`
**Last Updated**: 2026-09-26
**Status**: DONE (Mapping Presets UI Implemented & Verified)

---

## 1. Overview
The Mapping Presets UI enables users to discover, apply, save, clone, export, and import transaction field mappings across organizations and industry verticals.

## 2. Location Scoping & Access Control
- All custom presets are strictly scoped to the user's active `locationId`.
- Creating or cloning a preset requires a mandatory `locationId`.
- Built-in presets (`isBuiltIn: true`) are globally accessible across all locations, but are strictly immutable (deletion and renaming disabled in UI and protected with 403 in backend).
- Users can clone any built-in preset via `clonePreset(jwt, preset.id, locationId)` to create an editable custom preset for their location.

## 3. Serialization & State Integration
- **Saving**: Active `LocalMapping[]` are serialized via `currentMappings.map(encodeToApi)` before transmission.
- **Applying**: Preset `Mapping[]` are deserialized via `preset.mappings.map(decodeFromApi)` into active `LocalMapping[]`.
- **Overwrite Protection**: Warns the user when `localMappings.some(m => m.isDirty)` is true before replacing state.

## 4. Client-Side Import & Export Workflows
- **Export**: Serializes preset data into a portable JSON Blob downloaded directly in the browser.
- **Import**: Reads user-uploaded JSON files, validates the structure, and posts to `createPreset()` with the current `locationId`.
