import { tenantLogoPublicUrl } from '@/services/tenant.service'
import type { Tenant } from '@/types/auth'

const DEFAULT_TITLE = 'SoftDIN'
const DEFAULT_FAVICON_SVG = '/favicon.svg'
const DEFAULT_FAVICON_PNG = '/favicon.png'

const FAVICON_SELECTORS = [
  'link[rel="icon"][type="image/svg+xml"]',
  'link[rel="icon"][type="image/png"]',
  'link[rel="apple-touch-icon"]',
] as const

function faviconLinks(): HTMLLinkElement[] {
  return FAVICON_SELECTORS.flatMap((selector) =>
    Array.from(document.querySelectorAll<HTMLLinkElement>(selector)),
  )
}

function setFaviconSvg(href: string): void {
  document.querySelectorAll<HTMLLinkElement>('link[rel="icon"][type="image/svg+xml"]').forEach((link) => {
    link.href = href
  })
}

function setFaviconPng(href: string): void {
  document
    .querySelectorAll<HTMLLinkElement>('link[rel="icon"][type="image/png"], link[rel="apple-touch-icon"]')
    .forEach((link) => {
      link.href = href
    })
}

export function resetDocumentBranding(): void {
  document.title = DEFAULT_TITLE
  setFaviconSvg(DEFAULT_FAVICON_SVG)
  setFaviconPng(DEFAULT_FAVICON_PNG)
}

export function applyTenantDocumentBranding(
  tenant: Tenant,
  pageTitle?: string | null,
  logoVersion = 0,
): void {
  const slugLabel = tenant.slug.toUpperCase()
  document.title = pageTitle ? `${slugLabel} · ${pageTitle}` : slugLabel

  if (tenant.has_logo) {
    const logoUrl = tenantLogoPublicUrl(tenant.slug, logoVersion)
    faviconLinks().forEach((link) => {
      link.href = logoUrl
      link.type = 'image/png'
    })
    return
  }

  setFaviconSvg(DEFAULT_FAVICON_SVG)
  setFaviconPng(DEFAULT_FAVICON_PNG)
}
