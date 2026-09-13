export type DesktopUpdateCheckResult =
  | {
      ok: true
      latestVersion: string
      releasesUrl: string
    }
  | {
      ok: false
      message: string
    }

export type DesktopUpdateApi = {
  checkForUpdates: () => Promise<DesktopUpdateCheckResult>
  openUpdatePage: () => Promise<{ ok: boolean; message?: string }>
}

declare global {
  interface Window {
    facadeFlowDesktop?: DesktopUpdateApi
  }
}

const VERSION_PARTS = 3

function parseVersion(version: string): number[] | null {
  const normalized = version.trim().replace(/^v/i, '').split('-')[0]
  const parts = normalized.split('.')
  if (parts.length < 1 || parts.length > VERSION_PARTS) return null

  const parsed = parts.map((part) => Number(part))
  if (parsed.some((part) => !Number.isInteger(part) || part < 0)) return null

  while (parsed.length < VERSION_PARTS) parsed.push(0)
  return parsed
}

export function compareAppVersions(left: string, right: string): number {
  const leftParts = parseVersion(left)
  const rightParts = parseVersion(right)
  if (!leftParts || !rightParts) return 0

  for (let index = 0; index < VERSION_PARTS; index += 1) {
    if (leftParts[index] > rightParts[index]) return 1
    if (leftParts[index] < rightParts[index]) return -1
  }

  return 0
}

export function getDesktopUpdateApi(): DesktopUpdateApi | null {
  return window.facadeFlowDesktop ?? null
}
