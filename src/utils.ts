import * as path from 'path'
import * as core from '@actions/core'
import * as glob from '@actions/glob'
import * as tc from '@actions/tool-cache'

export const CACHE_KEY = 'ocvalidate'
export const LATEST_VERSION = 'latest'
export const RELEASE_TYPE = 'RELEASE'
export const DEBUG_TYPE = 'DEBUG'

export interface IOpenCoreRelease {
  type: string
  version: string
  downloadUrl: string
}

export interface IOcvalidateVersionFile {
  version: string
  path: string
}

export function getType (isRelease: boolean): string {
  return isRelease ? RELEASE_TYPE : DEBUG_TYPE
}

export function isValidType (type: string): boolean {
  return type === RELEASE_TYPE || type === DEBUG_TYPE
}

export function getFullVersion (opencore: IOpenCoreRelease): string {
  return `${opencore.version}-${opencore.type}`
}

export async function download (opencore: IOpenCoreRelease, platform: string): Promise<IOcvalidateVersionFile> {
  try {
    core.info(`Acquiring OpenCore ${opencore.version} from ${opencore.downloadUrl}`)
    const downloadPath = await tc.downloadTool(opencore.downloadUrl)

    core.info('Extracting OpenCore...')
    const opencoreDir = await tc.extractZip(downloadPath)
    core.info(`Successfully extracted OpenCore to ${opencoreDir}`)

    core.info('Searching for ocvalidate...')
    const searchPath = `${path.join(opencoreDir, 'Utilities/ocvalidate/ocvalidate')}*`
    const globber = await glob.create(searchPath, { followSymbolicLinks: false })

    for (const filePath of await globber.glob()) {
      if (platform !== detectPlatformForFilename(path.basename(filePath))) {
        continue
      }

      const file: IOcvalidateVersionFile = { version: getFullVersion(opencore), path: filePath }
      core.info(`Found ocvalidate version ${file.version} in ${file.path}`)
      return file
    }

    throw new Error(`No ocvalidate file found for platform: ${platform}`)
  } catch (err) {
    const errMessage = err instanceof Error ? err.message : ''
    throw new Error(`Failed to download ocvalidate from OpenCore ${opencore.version}: ${errMessage}`)
  }
}

export function detectPlatformForFilename (filename: string): string {
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
  core.info('Adding ocvalidate to the cache ...')
  const cachedFile = await tc.cacheFile(
    file.path,
    CACHE_KEY,
    CACHE_KEY,
    file.version
  )
  core.info(`Successfully cached ocvalidate ${file.version} to ${cachedFile}`)
  return cachedFile
}

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
