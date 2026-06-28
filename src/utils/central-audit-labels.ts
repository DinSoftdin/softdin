export function auditCategoryLabel(category: string): string {
  if (category.includes('login.success')) {
    return 'Inicio de sesión'
  }

  if (category.includes('login.failure')) {
    return 'Intento de acceso fallido'
  }

  switch (category) {
    case 'central.api.create':
      return 'Creación en central'
    case 'central.api.update':
      return 'Actualización en central'
    case 'central.api.delete':
      return 'Eliminación en central'
    case 'central.api.read':
      return 'Consulta en central'
    default:
      return category.replaceAll('.', ' · ').replaceAll('_', ' ')
  }
}

export function auditFieldPathLabel(path: string): string {
  const labels: Record<string, string> = {
    name: 'Nombre',
    email: 'Correo',
    slug: 'Sigla',
    status: 'Estado',
    domain: 'Dominio',
    database: 'Base de datos',
    is_admin: 'Admin de plataforma',
    is_superuser: 'Super-Usuario',
    state: 'Estado del usuario',
    role: 'Rol',
    user_id: 'Usuario',
    has_logo: 'Logo del cliente',
    logo_mime: 'Tipo de logo',
    has_avatar: 'Avatar',
    avatar_mime: 'Tipo de avatar',
    'logo.has_logo': 'Logo del cliente',
    'logo.logo_mime': 'Tipo de logo',
    'avatar.has_avatar': 'Avatar',
    'avatar.avatar_mime': 'Tipo de avatar',
    'user.name': 'Nombre',
    'user.email': 'Correo',
    'user.slug': 'Sigla',
    'user.status': 'Estado',
    'user.is_admin': 'Admin de plataforma',
    'user.is_superuser': 'Super-Usuario',
    'user.state': 'Estado del usuario',
    'user.has_avatar': 'Avatar',
    'tenant.name': 'Nombre del cliente',
    'tenant.slug': 'Sigla del cliente',
    'tenant.status': 'Estado del cliente',
    'assignment.role': 'Rol asignado',
    'assignment.user_has_avatar': 'Avatar del usuario',
  }

  return labels[path] ?? path.replaceAll('.', ' · ').replaceAll('_', ' ')
}

export function auditResultLabel(result: string): string {
  if (result === 'success') {
    return 'Éxito'
  }

  if (result === 'failure') {
    return 'Fallo'
  }

  return 'Pendiente'
}

export function auditDisplayValue(value: string | null | undefined): string {
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
