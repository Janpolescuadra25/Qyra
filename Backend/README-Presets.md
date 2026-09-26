# Mapping Presets API Architecture

**File**: `Backend/README-Presets.md`
**Last Updated**: 2026-09-26
**Status**: DONE (Mapping Presets API Implemented & Verified)

---

## 1. Overview
The Mapping Presets API provides template collections of transaction mappings, enabling quick setup for industry verticals (Retail, Restaurant, Professional Services) and custom user-defined presets.

## 2. Security & Access Control
- All endpoints require authentication via `authenticate` middleware.
- Scoping to locations enforced using `locationFilter(req)` from `auth.middleware.ts`.
- Read operations enforce `requireFeaturePermission('map', 'read')`.
- Mutation operations enforce `requireFeaturePermission('map', 'write')`.
- Built-in presets (`isBuiltIn: true`) are protected with strict `403 Forbidden` guards preventing modification or deletion.

## 3. Endpoints

| Method | Endpoint | Permission | Description |
|---|---|---|---|
| `GET` | `/api/presets` | `map:read` | List built-in presets and location-accessible custom presets |
| `POST` | `/api/presets` | `map:write` | Create a new custom preset |
| `PUT` | `/api/presets/:id` | `map:write` | Update an existing custom preset |
| `DELETE` | `/api/presets/:id` | `map:write` | Delete an existing custom preset |
| `POST` | `/api/presets/:id/clone` | `map:write` | Duplicate any preset as a new custom preset |
| `GET` | `/api/presets/:id/export` | `map:read` | Export preset as portable JSON |
| `POST` | `/api/presets/import` | `map:write` | Import preset from validated JSON |

## 4. JSON Contract
A preset payload has the following shape:

```json
{
  "version": "1.0",
  "name": "Retail",
  "description": "Standard retail configuration",
  "industry": "retail",
  "mappings": [
    {
      "sourceField": "sales",
      "targetAccount": "Sales Revenue",
      "priority": 10,
      "postingType": "Credit"
    }
  ]
}
```

## 5. Built-in Defaults
The backend seeds three built-in presets during startup:
- Retail
- Restaurant
- Professional Services

These presets are never editable or deletable through the API and remain available as safe defaults for all locations.
