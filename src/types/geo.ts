import type { ContinenteEnumItem } from '@/lib/softdin-libreria'

export interface GeoPaginationMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number | null
  to: number | null
}

export interface GeoPaginated<T> {
  data: T[]
  meta: GeoPaginationMeta
  links?: Record<string, string | null>
}

export interface Pais {
  id: number
  pais: string
  codigo_alfa2: string | null
  codigo_alfa3: string | null
  codigo_numerico: string | null
  continente: number | null
  continente_label?: string | null
  activo: boolean
}

export interface Departamento {
  id: number
  idpais: number
  departamento: string
  codigodane: string
  codigo_iso: string
  activo: boolean
}

export interface Ciudad {
  id: number
  iddepartamento: number
  ciudad: string
  codigodane: string
  lat: string | number | null
  lng: string | number | null
  activo: boolean
}

export interface Barrio {
  id: number
  idciudad: number
  barrio: string
  lat: string | number | null
  lng: string | number | null
  activo: boolean
}

export type GeoLevel = 'pais' | 'departamento' | 'ciudad' | 'barrio'

export interface GeoListParams {
  page?: number
  per_page?: number
  q?: string
  continente?: number
  idpais?: number
  iddepartamento?: number
  idciudad?: number
}

export interface CreatePaisPayload {
  id: number
  pais: string
  codigo_alfa2?: string | null
  codigo_alfa3?: string | null
  codigo_numerico?: string | null
  continente?: number | null
  activo: boolean
}

export interface CreateDepartamentoPayload {
  id: number
  idpais: number
  departamento: string
  codigodane: string
  codigo_iso: string
  activo: boolean
}

export interface CreateCiudadPayload {
  id: number
  iddepartamento: number
  ciudad: string
  codigodane: string
  lat?: number | null
  lng?: number | null
  activo: boolean
}

export interface CreateBarrioPayload {
  id: number
  idciudad: number
  barrio: string
  lat?: number | null
  lng?: number | null
  activo: boolean
}

export const GEO_LEVEL_LABELS: Record<GeoLevel, string> = {
  pais: 'Países',
  departamento: 'Departamentos',
  ciudad: 'Ciudades',
  barrio: 'Barrios',
}

/** ID EnumContinente.AMERICA_SUR — operación Colombia. */
export const DEFAULT_CONTINENTE_ID = 5

/** País preseleccionado al abrir Geografía (operación Colombia). */
export const DEFAULT_PAIS_ALFA3 = 'COL'

export type { ContinenteEnumItem }
