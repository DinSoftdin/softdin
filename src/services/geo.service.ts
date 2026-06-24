import { api } from '@/services/api'
import type {
  Barrio,
  Ciudad,
  ContinenteEnumItem,
  CreateBarrioPayload,
  CreateCiudadPayload,
  CreateDepartamentoPayload,
  CreatePaisPayload,
  Departamento,
  GeoListParams,
  GeoPaginated,
  GeoPaginationMeta,
  Pais,
} from '@/types/geo'

const EMPTY_META: GeoPaginationMeta = {
  current_page: 1,
  last_page: 1,
  per_page: 50,
  total: 0,
  from: null,
  to: null,
}

function normalizeMeta(source: unknown): GeoPaginationMeta {
  if (!source || typeof source !== 'object') {
    return { ...EMPTY_META }
  }

  const meta = source as Record<string, unknown>
  if (typeof meta.current_page !== 'number') {
    return { ...EMPTY_META }
  }

  return {
    current_page: meta.current_page,
    last_page: typeof meta.last_page === 'number' ? meta.last_page : 1,
    per_page: typeof meta.per_page === 'number' ? meta.per_page : 50,
    total: typeof meta.total === 'number' ? meta.total : 0,
    from: typeof meta.from === 'number' ? meta.from : null,
    to: typeof meta.to === 'number' ? meta.to : null,
  }
}

function normalizeGeoPaginated<T>(payload: unknown): GeoPaginated<T> {
  if (!payload || typeof payload !== 'object') {
    return { data: [], meta: { ...EMPTY_META } }
  }

  const body = payload as Record<string, unknown>

  if (Array.isArray(body.data)) {
    return {
      data: body.data as T[],
      meta: normalizeMeta(body.meta ?? body),
      links: body.links as GeoPaginated<T>['links'],
    }
  }

  const nested = body.data
  if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
    const inner = nested as Record<string, unknown>
    if (Array.isArray(inner.data)) {
      return {
        data: inner.data as T[],
        meta: normalizeMeta(inner.meta ?? inner),
        links: inner.links as GeoPaginated<T>['links'],
      }
    }
  }

  return { data: [], meta: { ...EMPTY_META } }
}

function listParams(params: GeoListParams = {}): Record<string, string | number> {
  const query: Record<string, string | number> = {
    page: params.page ?? 1,
    per_page: params.per_page ?? 50,
  }

  if (params.q?.trim()) {
    query.q = params.q.trim()
  }
  if (params.continente != null) {
    query.continente = params.continente
  }
  if (params.idpais) {
    query.idpais = params.idpais
  }
  if (params.iddepartamento) {
    query.iddepartamento = params.iddepartamento
  }
  if (params.idciudad) {
    query.idciudad = params.idciudad
  }

  return query
}

export const geoService = {
  async listContinentes(): Promise<ContinenteEnumItem[]> {
    const { data } = await api.get<{ data: ContinenteEnumItem[] }>('/geo/continentes')
    return data.data
  },

  async listPaises(params: GeoListParams = {}): Promise<GeoPaginated<Pais>> {
    const { data } = await api.get('/paises', { params: listParams(params) })
    return normalizeGeoPaginated<Pais>(data)
  },

  async createPais(payload: CreatePaisPayload): Promise<Pais> {
    const { data } = await api.post<{ data: Pais } | Pais>('/paises', payload)
    return 'data' in data && data.data ? data.data : (data as Pais)
  },

  async updatePais(id: number, payload: Partial<CreatePaisPayload>): Promise<Pais> {
    const { data } = await api.put<{ data: Pais } | Pais>(`/paises/${id}`, payload)
    return 'data' in data && data.data ? data.data : (data as Pais)
  },

  async deletePais(id: number): Promise<void> {
    await api.delete(`/paises/${id}`)
  },

  async listDepartamentos(params: GeoListParams = {}): Promise<GeoPaginated<Departamento>> {
    const { data } = await api.get('/departamentos', {
      params: listParams(params),
    })
    return normalizeGeoPaginated<Departamento>(data)
  },

  async createDepartamento(payload: CreateDepartamentoPayload): Promise<Departamento> {
    const { data } = await api.post<{ data: Departamento } | Departamento>('/departamentos', payload)
    return 'data' in data && data.data ? data.data : (data as Departamento)
  },

  async updateDepartamento(id: number, payload: Partial<CreateDepartamentoPayload>): Promise<Departamento> {
    const { data } = await api.put<{ data: Departamento } | Departamento>(
      `/departamentos/${id}`,
      payload,
    )
    return 'data' in data && data.data ? data.data : (data as Departamento)
  },

  async deleteDepartamento(id: number): Promise<void> {
    await api.delete(`/departamentos/${id}`)
  },

  async listCiudades(params: GeoListParams = {}): Promise<GeoPaginated<Ciudad>> {
    const { data } = await api.get('/ciudades', { params: listParams(params) })
    return normalizeGeoPaginated<Ciudad>(data)
  },

  async createCiudad(payload: CreateCiudadPayload): Promise<Ciudad> {
    const { data } = await api.post<{ data: Ciudad } | Ciudad>('/ciudades', payload)
    return 'data' in data && data.data ? data.data : (data as Ciudad)
  },

  async updateCiudad(id: number, payload: Partial<CreateCiudadPayload>): Promise<Ciudad> {
    const { data } = await api.put<{ data: Ciudad } | Ciudad>(`/ciudades/${id}`, payload)
    return 'data' in data && data.data ? data.data : (data as Ciudad)
  },

  async deleteCiudad(id: number): Promise<void> {
    await api.delete(`/ciudades/${id}`)
  },

  async listBarrios(params: GeoListParams = {}): Promise<GeoPaginated<Barrio>> {
    const { data } = await api.get('/barrios', { params: listParams(params) })
    return normalizeGeoPaginated<Barrio>(data)
  },

  async createBarrio(payload: CreateBarrioPayload): Promise<Barrio> {
    const { data } = await api.post<{ data: Barrio } | Barrio>('/barrios', payload)
    return 'data' in data && data.data ? data.data : (data as Barrio)
  },

  async updateBarrio(id: number, payload: Partial<CreateBarrioPayload>): Promise<Barrio> {
    const { data } = await api.put<{ data: Barrio } | Barrio>(`/barrios/${id}`, payload)
    return 'data' in data && data.data ? data.data : (data as Barrio)
  },

  async deleteBarrio(id: number): Promise<void> {
    await api.delete(`/barrios/${id}`)
  },

  async suggestNextId(fetchPage: (page: number) => Promise<GeoPaginated<{ id: number }>>): Promise<number> {
    let maxId = 0
    let page = 1
    let lastPage = 1

    do {
      const response = await fetchPage(page)
      for (const item of response.data) {
        maxId = Math.max(maxId, item.id)
      }
      lastPage = response.meta.last_page
      page += 1
    } while (page <= lastPage && page <= 20)

    return maxId + 1
  },
}
