import * as path from 'path'
import * as core from '@actions/core'
import * as glob from '@actions/glob'
import * as tc from '@actions/tool-cache'

export const CACHE_KEY = 'ocvalidate'
export const PRODUCTION_OWNER = 'acidanthera'
export const PRODUCTION_REPO = 'OpenCorePkg'
export const PRE_PRODUCTION_OWNER = 'dortania'
export const PRE_PRODUCTION_REPO = 'build-repo'

export interface IOcvalidateVersionFile {
  version: string
  filePath: string
  os: string
}

export function buildType (isRelease: boolean): string {
  return isRelease ? 'RELEASE' : 'DEBUG'
}

export function prepareDownloadUrl (version: string, isRelease: boolean): string {
  return `https://github.com/${PRODUCTION_OWNER}/${PRODUCTION_REPO}/releases/download/${version}/OpenCore-${version}-${buildType(isRelease)}.zip`
}

export function getPreProductionTagName (smallSha: string): string {
  return `OpenCorePkg-${smallSha}`
}

export function getSmallSha (sha: string): string {
  return sha.slice(0, 7)
}

export async function findAndDownload (
  version: string,
  isRelease: boolean,
  platform: string,
  auth: string | undefined
): Promise<IOcvalidateVersionFile> {
  const opencoreUrl = prepareDownloadUrl(version, isRelease)

  try {
    core.info(`Acquiring OpenCore ${version} from ${opencoreUrl}`)
    const downloadPath = await tc.downloadTool(opencoreUrl, undefined, auth)

    core.info('Extracting opencore...')
    const opencoreDir = await tc.extractZip(downloadPath)
    core.info(`Successfully extracted opencore to ${opencoreDir}`)

    const searchPath = `${path.join(opencoreDir, 'Utilities/ocvalidate/ocvalidate')}*`
    const globber = await glob.create(searchPath, { followSymbolicLinks: false })

    for (const filePath of await globber.glob()) {
      const os = detectOsForFilename(path.basename(filePath))
      const file: IOcvalidateVersionFile = { version, os, filePath }

      if (file.os === platform) {
        return file
      }
    }

    throw new Error(`No file for platform: ${platform}`)
  } catch (err) {
    const errMessage = err instanceof Error ? err.message : ''
    throw new Error(`Failed to find ${version}: ${errMessage}`)
  }
}

export function detectOsForFilename (filename: string): string {
  const target = filename.toLowerCase()

  if (target.includes('.linux')) {
    return 'linux'
  }
  if (target.includes('.exe')) {
    return 'win32'
  }

  return 'darwin'
}

export async function cache (
  file: IOcvalidateVersionFile
): Promise<string> {
  core.info('Adding to the cache ...')
  const cachedFile = await tc.cacheFile(
    file.filePath,
    CACHE_KEY,
    CACHE_KEY,
    file.version
  )
  core.info(`Successfully cached ocvalidate to ${cachedFile}`)
  return cachedFile
}

/**
 * Parses action input to determine is value is true.
 */
export const isTrue = (variable: string): boolean => {
  const lowercase = variable.toLowerCase()
  return (
    lowercase === '1' ||
    lowercase === 't' ||
    lowercase === 'true' ||
    lowercase === 'y' ||
    lowercase === 'yes'
  )
}
