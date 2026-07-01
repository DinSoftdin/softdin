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

/** Registros maestros del tenant (sidebar operacional). */
export const registrosMaestrosMenu: MenuModule = {
  id: 'registros-maestros',
  label: 'Registros Maestros',
  icon: 'M',
  children: [
    { label: 'Geografía', route: '/registros-maestros/geografia', routeName: 'registros-maestros-geografia', ready: true },
    { label: 'Cargos', route: '/registros-maestros/cargos', routeName: 'registros-maestros-cargos', ready: false },
    { label: 'Terceros', route: '/registros-maestros/terceros', routeName: 'registros-maestros-terceros', ready: false },
  ],
}

/** Menú modular: activar `ready: true` al implementar cada pantalla. */
export const menuModules: MenuModule[] = [
  registrosMaestrosMenu,
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
]
