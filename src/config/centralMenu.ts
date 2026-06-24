export interface CentralMenuItem {
  label: string
  routeName: string
  icon: string
  ready?: boolean
  requiresSuperuser?: boolean
}

export const centralMenuItems: CentralMenuItem[] = [
  {
    label: 'Inicio',
    routeName: 'central-home',
    icon: '⌂',
    ready: true,
  },
  {
    label: 'Clientes',
    routeName: 'admin-tenants',
    icon: 'C',
    ready: true,
  },
  {
    label: 'Usuarios',
    routeName: 'admin-users',
    icon: 'U',
    ready: true,
  },
  {
    label: 'Auditoría',
    routeName: 'admin-audit',
    icon: 'A',
    ready: true,
  },
]
