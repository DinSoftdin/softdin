export interface MenuItem {
  label: string
  route?: string
  routeName?: string
  ready?: boolean
  adminOnly?: boolean
}

export interface MenuModule {
  id: string
  label: string
  icon: string
  adminOnly?: boolean
  children: MenuItem[]
}

/** Menú modular: activar `ready: true` al implementar cada pantalla. */
export const menuModules: MenuModule[] = [
  {
    id: 'maestros',
    label: 'Maestros',
    icon: 'M',
    children: [
      { label: 'Cargos', route: '/maestros/cargos', routeName: 'maestros-cargos', ready: false },
      { label: 'Países', route: '/maestros/paises', routeName: 'maestros-paises', ready: false },
      { label: 'Terceros', route: '/maestros/terceros', routeName: 'maestros-terceros', ready: false },
    ],
  },
  {
    id: 'nomina',
    label: 'Nómina',
    icon: 'N',
    children: [
      { label: 'Empleados', route: '/nomina/empleados', routeName: 'nomina-empleados', ready: false },
      { label: 'Liquidaciones', route: '/nomina/liquidaciones', routeName: 'nomina-liquidaciones', ready: false },
    ],
  },
  {
    id: 'hov',
    label: 'Hojas de vida',
    icon: 'H',
    children: [
      { label: 'Consulta', route: '/hov/consulta', routeName: 'hov-consulta', ready: false },
    ],
  },
  {
    id: 'otr',
    label: 'Otros',
    icon: 'O',
    children: [
      { label: 'Reportes', route: '/otros/reportes', routeName: 'otros-reportes', ready: false },
    ],
  },
  {
    id: 'admin',
    label: 'Administración',
    icon: 'A',
    adminOnly: true,
    children: [
      {
        label: 'Clientes (Tenants)',
        route: '/admin/tenants',
        routeName: 'admin-tenants',
        ready: false,
      },
    ],
  },
]
