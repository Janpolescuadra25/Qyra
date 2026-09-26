import { Router, Response } from 'express';
import type { Prisma } from '@prisma/client';
import { AppError, asyncHandler } from '../lib/errors';
import { authenticate, AuthRequest, locationFilter, requireFeaturePermission } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';
import { enforceEffectiveRole } from '../middleware/effective-role';

const router = Router();
router.use(authenticate, enforceEffectiveRole);

const BUILT_IN_PRESETS = [
  {
    name: 'Retail',
    description: 'Standard retail cash and inventory mapping profile',
    industry: 'retail',
    isBuiltIn: true,
    mappings: [
      { sourceField: 'item', targetAccount: 'Inventory Asset', priority: 10 },
      { sourceField: 'cogs', targetAccount: 'Cost of Goods Sold', priority: 20 },
      { sourceField: 'sales', targetAccount: 'Sales Revenue', priority: 30 },
      { sourceField: 'tax', targetAccount: 'Sales Tax Payable', priority: 40 },
    ],
  },
  {
    name: 'Restaurant',
    description: 'Restaurant POS mapping profile for food, labor, and fees',
    industry: 'restaurant',
    isBuiltIn: true,
    mappings: [
      { sourceField: 'foodSupplies', targetAccount: 'Food & Beverage Supplies', priority: 10 },
      { sourceField: 'equipment', targetAccount: 'Kitchen Equipment', priority: 20 },
      { sourceField: 'fees', targetAccount: 'Merchant Fees', priority: 30 },
      { sourceField: 'sales', targetAccount: 'Dining Sales', priority: 40 },
    ],
  },
  {
    name: 'Professional Services',
    description: 'Professional services mapping profile for consulting and overhead',
    industry: 'professional-services',
    isBuiltIn: true,
    mappings: [
      { sourceField: 'revenue', targetAccount: 'Consulting Revenue', priority: 10 },
      { sourceField: 'subcontractor', targetAccount: 'Subcontractor Expense', priority: 20 },
      { sourceField: 'software', targetAccount: 'Software Subscriptions', priority: 30 },
      { sourceField: 'supplies', targetAccount: 'Office Supplies', priority: 40 },
    ],
  },
] as const;

function normalizeMappingArray(input: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(input)) {
    throw new AppError('mappings must be an array', 400);
  }

  const normalized = input.map((item) => {
    if (!item || typeof item !== 'object') {
      throw new AppError('Each mapping must be an object', 400);
    }

    const mapping = item as Record<string, unknown>;
    if (typeof mapping.sourceField !== 'string' || !mapping.sourceField.trim()) {
      throw new AppError('Each mapping must include a non-empty sourceField', 400);
    }
    if (typeof mapping.targetAccount !== 'string' || !mapping.targetAccount.trim()) {
      throw new AppError('Each mapping must include a non-empty targetAccount', 400);
    }

    return {
      sourceField: mapping.sourceField.trim(),
      targetAccount: mapping.targetAccount.trim(),
      targetClass: typeof mapping.targetClass === 'string' ? mapping.targetClass.trim() : undefined,
      targetName: typeof mapping.targetName === 'string' ? mapping.targetName.trim() : undefined,
      targetDescription: typeof mapping.targetDescription === 'string' ? mapping.targetDescription.trim() : undefined,
      targetMemo: typeof mapping.targetMemo === 'string' ? mapping.targetMemo.trim() : undefined,
      postingType: typeof mapping.postingType === 'string' ? mapping.postingType : 'Credit',
      keepSeparate: Boolean(mapping.keepSeparate),
      priority: typeof mapping.priority === 'number' ? mapping.priority : 0,
      conditions: mapping.conditions ?? undefined,
    };
  });

  return normalized;
}

function serializePreset(preset: {
  id: string;
  name: string;
  description: string | null;
  isBuiltIn: boolean;
  industry: string | null;
  mappings: unknown;
  locationId: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: preset.id,
    name: preset.name,
    description: preset.description,
    isBuiltIn: preset.isBuiltIn,
    industry: preset.industry,
    mappings: Array.isArray(preset.mappings) ? preset.mappings : [],
    locationId: preset.locationId,
    createdAt: preset.createdAt.toISOString(),
    updatedAt: preset.updatedAt.toISOString(),
  };
}

function isAccessibleLocationScope(user: AuthRequest['user'], locationId?: string | null) {
  if (!user) {
    return false;
  }

  if (!locationId) {
    return true;
  }

  const locationWhere = { ...locationFilter(user) } as Record<string, unknown>;
  if (Object.keys(locationWhere).length === 0) {
    return true;
  }

  return locationWhere.userId === user.userId || locationWhere.adminId === user.userId;
}

export async function seedDefaultPresets(): Promise<void> {
  const existingBuiltIns = await prisma.mappingPreset.count({
    where: { isBuiltIn: true },
  });

  if (existingBuiltIns > 0) {
    return;
  }

  await prisma.mappingPreset.createMany({
    data: BUILT_IN_PRESETS.map((preset) => ({
      name: preset.name,
      description: preset.description,
      industry: preset.industry,
      isBuiltIn: preset.isBuiltIn,
      mappings: preset.mappings as Prisma.InputJsonValue,
      locationId: null,
    })),
  });
}

router.get('/', requireFeaturePermission('map', 'read'), asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const builtInPresets = await prisma.mappingPreset.findMany({
    where: { isBuiltIn: true },
    orderBy: { name: 'asc' },
  });

  const customWhere = {
    isBuiltIn: false,
    location: locationFilter(req.user!),
  };

  const customPresets = await prisma.mappingPreset.findMany({
    where: customWhere,
    orderBy: { createdAt: 'desc' },
  });

  res.json([
    ...builtInPresets.map(serializePreset),
    ...customPresets.map(serializePreset),
  ]);
}));

router.post('/', requireFeaturePermission('map', 'write'), asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, description, industry, locationId, mappings } = req.body as {
    name?: string;
    description?: string | null;
    industry?: string | null;
    locationId?: string | null;
    mappings?: unknown;
  };

  if (!name || typeof name !== 'string' || !name.trim()) {
    throw new AppError('name is required', 400);
  }

  const normalizedLocationId = typeof locationId === 'string' && locationId.trim() ? locationId.trim() : null;
  if (!normalizedLocationId) {
    throw new AppError('locationId is required', 400);
  }

  const location = await prisma.location.findFirst({
    where: { id: normalizedLocationId, ...locationFilter(req.user!) },
  });
  if (!location) {
    throw new AppError('Location not found', 404);
  }

  const normalizedMappings = normalizeMappingArray(mappings);
  const preset = await prisma.mappingPreset.create({
    data: {
      name: name.trim(),
      description: description ?? null,
      industry: industry ?? null,
      isBuiltIn: false,
      mappings: normalizedMappings as Prisma.InputJsonValue,
      locationId: normalizedLocationId,
    },
  });

  res.status(201).json(serializePreset(preset));
}));

router.put('/:id', requireFeaturePermission('map', 'write'), asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const preset = await prisma.mappingPreset.findUnique({ where: { id } });

  if (!preset) {
    throw new AppError('Preset not found', 404);
  }

  if (preset.isBuiltIn) {
    throw new AppError('Built-in presets cannot be modified', 403);
  }

  if (preset.locationId && !isAccessibleLocationScope(req.user!, preset.locationId)) {
    throw new AppError('Preset not found', 404);
  }

  const { name, description, industry, mappings } = req.body as {
    name?: string;
    description?: string | null;
    industry?: string | null;
    mappings?: unknown;
  };

  const updateData: Prisma.MappingPresetUpdateInput = {
    ...(name !== undefined ? { name: name.trim() } : {}),
    ...(description !== undefined ? { description: description ?? null } : {}),
    ...(industry !== undefined ? { industry: industry ?? null } : {}),
    ...(mappings !== undefined ? { mappings: normalizeMappingArray(mappings) as Prisma.InputJsonValue } : {}),
  };

  const updatedPreset = await prisma.mappingPreset.update({
    where: { id },
    data: updateData,
  });

  res.json(serializePreset(updatedPreset));
}));

router.delete('/:id', requireFeaturePermission('map', 'write'), asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const preset = await prisma.mappingPreset.findUnique({ where: { id } });

  if (!preset) {
    throw new AppError('Preset not found', 404);
  }

  if (preset.isBuiltIn) {
    throw new AppError('Built-in presets cannot be deleted', 403);
  }

  if (preset.locationId && !isAccessibleLocationScope(req.user!, preset.locationId)) {
    throw new AppError('Preset not found', 404);
  }

  await prisma.mappingPreset.delete({ where: { id } });
  res.json({ success: true });
}));

router.post('/:id/clone', requireFeaturePermission('map', 'write'), asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const preset = await prisma.mappingPreset.findUnique({ where: { id } });

  if (!preset) {
    throw new AppError('Preset not found', 404);
  }

  const locationId = typeof req.body?.locationId === 'string' ? req.body.locationId.trim() : null;
  if (!locationId) {
    throw new AppError('locationId is required', 400);
  }

  const location = await prisma.location.findFirst({
    where: { id: locationId, ...locationFilter(req.user!) },
  });
  if (!location) {
    throw new AppError('Location not found', 404);
  }

  const baseName = preset.name.replace(/\s*\(Copy\)\s*$/i, '').trim();
  const cloneName = `${baseName} (Copy)`;

  const clonedPreset = await prisma.mappingPreset.create({
    data: {
      name: cloneName,
      description: preset.description,
      industry: preset.industry,
      isBuiltIn: false,
      mappings: preset.mappings as Prisma.InputJsonValue,
      locationId,
    },
  });

  res.status(201).json(serializePreset(clonedPreset));
}));

router.post('/import', requireFeaturePermission('map', 'write'), asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { locationId, name, description, industry, version, mappings } = req.body as {
    locationId?: string | null;
    name?: string;
    description?: string | null;
    industry?: string | null;
    version?: string;
    mappings?: unknown;
  };

  if (!version || version !== '1.0') {
    throw new AppError('Unsupported preset version', 400);
  }

  if (!name || typeof name !== 'string' || !name.trim()) {
    throw new AppError('name is required', 400);
  }

  const normalizedLocationId = typeof locationId === 'string' && locationId.trim() ? locationId.trim() : null;
  if (!normalizedLocationId) {
    throw new AppError('locationId is required', 400);
  }

  const location = await prisma.location.findFirst({
    where: { id: normalizedLocationId, ...locationFilter(req.user!) },
  });
  if (!location) {
    throw new AppError('Location not found', 404);
  }

  const preset = await prisma.mappingPreset.create({
    data: {
      name: name.trim(),
      description: description ?? null,
      industry: industry ?? null,
      isBuiltIn: false,
      mappings: normalizeMappingArray(mappings) as Prisma.InputJsonValue,
      locationId: normalizedLocationId,
    },
  });

  res.status(201).json(serializePreset(preset));
}));

router.get('/:id/export', requireFeaturePermission('map', 'read'), asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const preset = await prisma.mappingPreset.findUnique({ where: { id } });

  if (!preset) {
    throw new AppError('Preset not found', 404);
  }

  if (preset.locationId && !isAccessibleLocationScope(req.user!, preset.locationId)) {
    throw new AppError('Preset not found', 404);
  }

  res.json({
    version: '1.0',
    name: preset.name,
    description: preset.description ?? '',
    industry: preset.industry ?? '',
    mappings: Array.isArray(preset.mappings) ? preset.mappings : [],
  });
}));

export default router;
