declare module 'softdinlibreriajs/src/EnumContinente.js' {
  export interface EnumContinenteItem {
    id: number
    code: string
    description: string
  }

  export default class EnumContinente {
    static readonly ASIA: number
    static readonly AFRICA: number
    static readonly EUROPA: number
    static readonly AMERICA_NORTE: number
    static readonly AMERICA_SUR: number
    static readonly OCEANIA: number

    static getAll(): EnumContinenteItem[]
    static getById(id: number): EnumContinenteItem | null
    static getByDescription(description: string): EnumContinenteItem | null
  }
}
