/**
 * Punto único de acceso a softdinlibreriajs (npm).
 * El resto de la app no debe importar la librería directamente.
 */
import EnumContinente from 'softdinlibreriajs/src/EnumContinente.js'

export type ContinenteEnumItem = {
  id: number
  code: string
  description: string
}

export function getContinentesEnum(): ContinenteEnumItem[] {
  return EnumContinente.getAll()
}

export function getContinenteDescriptions(): string[] {
  return EnumContinente.getAll().map((item) => item.description)
}

export function getContinenteByDescription(description: string): ContinenteEnumItem | null {
  return EnumContinente.getByDescription(description)
}

export function getContinenteById(id: number): ContinenteEnumItem | null {
  return EnumContinente.getById(id)
}

export { EnumContinente }

/** ID por defecto: América del Sur (Colombia). */
export const DEFAULT_CONTINENTE_ID = EnumContinente.AMERICA_SUR
