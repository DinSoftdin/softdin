export function tenantAuditCategoryLabel(category: string): string {
  if (category.includes('login.success')) {
    return 'Inicio de sesión'
  }

  if (category.includes('login.failure')) {
    return 'Intento de acceso fallido'
  }

  if (category.includes('switch_tenant.success')) {
    return 'Cambio de cliente'
  }

  if (category.includes('logout.success')) {
    return 'Cierre de sesión'
  }

  switch (category) {
    case 'api.create':
      return 'Creación'
    case 'api.update':
      return 'Actualización'
    case 'api.delete':
      return 'Eliminación'
    case 'api.read':
      return 'Consulta'
    default:
      return category.replaceAll('.', ' · ').replaceAll('_', ' ')
  }
}

export function tenantAuditFieldPathLabel(path: string): string {
  const labels: Record<string, string> = {
    name: 'Nombre',
    email: 'Correo',
    descripcion: 'Descripción',
    codigo: 'Código',
    estado: 'Estado',
    activo: 'Activo',
  }

  if (labels[path]) {
    return labels[path]
  }

  const leaf = path.includes('.') ? path.slice(path.lastIndexOf('.') + 1) : path
  return leaf.replaceAll('.', ' · ').replaceAll('_', ' ')
}

export function tenantAuditResultLabel(result: string): string {
  if (result === 'success') {
    return 'Éxito'
  }

  if (result === 'failure') {
    return 'Fallo'
  }

  return 'Pendiente'
}

export function tenantAuditDisplayValue(value: string | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return '—'
  }

  const normalized = value.trim().toLowerCase()

  if (normalized === '1' || normalized === 'true') {
    return 'Sí'
  }

  if (normalized === '0' || normalized === 'false') {
    return 'No'
  }

  return value
}
