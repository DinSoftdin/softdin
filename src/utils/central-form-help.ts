export const CENTRAL_USER_FIELD_HELP = {
  avatar:
    'Imagen de perfil del usuario. Se recomienda 512×512 px en JPG, PNG o WebP.',
  name:
    'Nombre completo con el que se identificará el usuario en SoftDIN Central y en los clientes asignados.',
  email:
    'Correo electrónico de acceso. Al crear un usuario se envía un enlace de activación para que defina su contraseña.',
  state:
    'Indica si el usuario puede iniciar sesión. Si está inactivo, no podrá acceder a SoftDIN hasta que un administrador lo reactive.',
} as const

export const CENTRAL_TENANT_FIELD_HELP = {
  logo:
    'Logo o imagen representativa del cliente. Se muestra en listados y en la plataforma del tenant.',
  name:
    'Razón social o nombre comercial del cliente. Es independiente de la sigla.',
  slug:
    'Identificador corto y único (solo letras minúsculas, números y guiones). Se usa en URLs, dominio y nombre de la base de datos.',
  domain:
    'Dominio principal para acceder al cliente. Si se omite al crear, se generará como sigla.localhost.',
  database:
    'Nombre de la base de datos MySQL dedicada del cliente. Si se omite al crear, se generará como din_{sigla}.',
  ownerEmail:
    'Usuario central existente que quedará asociado como propietario del cliente al crearlo.',
  status:
    'Activo permite operar con normalidad. Suspendido bloquea el acceso operacional al cliente.',
  serviceTypes:
    'Módulos habilitados para este cliente. RRHH permite crear o eliminar el tenant operacional; SGI estará disponible próximamente.',
} as const
