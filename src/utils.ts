import * as fs from 'fs'
import * as path from 'path'
import * as tc from '@actions/tool-cache'
import * as core from '@actions/core'

export const CACHE_KEY = 'ocvalidate'

export interface IOcvalidateVersionFile {
  version: string
  filePath: string
  os: string
}

export function prepareDownloadUrl (version: string): string {
  return `https://github.com/acidanthera/OpenCorePkg/releases/download/${version}/OpenCore-${version}-RELEASE.zip`
}

export async function findAndDownload (
  version: string,
  platform: string,
  auth: string | undefined
): Promise<IOcvalidateVersionFile> {
  const opencoreUrl = prepareDownloadUrl(version)

  try {
    core.info(`Acquiring OpenCore ${version} from ${opencoreUrl}`)
    const downloadPath = await tc.downloadTool(opencoreUrl, undefined, auth)

    core.info('Extracting opencore...')
    const opencoreDir = await extractOpencoreArchive(downloadPath)
    core.info(`Successfully extracted opencore to ${opencoreDir}`)

    const ocvalidateDir = path.join(opencoreDir, 'Utilities/ocvalidate')
    for (const filename of fs.readdirSync(ocvalidateDir)) {
      const os = detectOsForFilename(filename)
      const file: IOcvalidateVersionFile = { version, os, filePath: path.join(ocvalidateDir, filename) }

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
  const cachedDir = await tc.cacheFile(
    file.filePath,
    CACHE_KEY,
    CACHE_KEY,
    file.version
  )
  core.info(`Successfully cached ocvalidate to ${cachedDir}`)
  return cachedDir
}

export async function extractOpencoreArchive (archivePath: string): Promise<string> {
  return await tc.extractZip(archivePath)
}
