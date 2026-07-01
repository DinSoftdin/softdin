import type { TenantServiceType, TenantServiceTypesMap } from '@/types/tenant'

export const DEFAULT_TENANT_SERVICE_TYPES: TenantServiceTypesMap = {
  rrhh: false,
  sgi: false,
}

export function parseTenantServiceTypes(raw: unknown): TenantServiceTypesMap {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const record = raw as Record<string, unknown>

    return {
      rrhh: Boolean(record.rrhh),
      sgi: Boolean(record.sgi),
    }
  }

  if (Array.isArray(raw)) {
    return {
      rrhh: raw.includes('rrhh'),
      sgi: raw.includes('sgi'),
    }
  }

  return { ...DEFAULT_TENANT_SERVICE_TYPES }
}

export function cloneTenantServiceTypes(map: TenantServiceTypesMap): TenantServiceTypesMap {
  return {
    rrhh: map.rrhh,
    sgi: map.sgi,
  }
}

export function isTenantServiceTypeEnabled(
  map: TenantServiceTypesMap,
  type: TenantServiceType,
): boolean {
  return Boolean(map[type])
}
