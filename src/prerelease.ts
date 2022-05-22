import * as semver from 'semver'
import * as core from '@actions/core'
import { Api } from '@octokit/plugin-rest-endpoint-methods/dist-types/types'
import * as utils from './utils'

const OWNER = 'dortania'
const REPO = 'build-repo'

export function getTagName (sha: string): string {
  return `OpenCorePkg-${sha}`
}

export async function findOpenCoreRelease (octokit: Api, sha: string, isRelease: boolean): Promise<utils.IOpenCoreRelease> {
  const release = await octokit.rest.repos.getReleaseByTag({
    owner: OWNER,
    repo: REPO,
    tag: getTagName(sha)
  })

  const assets = await octokit.rest.repos.listReleaseAssets({
    owner: OWNER,
    repo: REPO,
    release_id: release.data.id
  })

  const targetType = utils.getType(isRelease)

  for (const a of assets.data) {
    const r: utils.IOpenCoreRelease = {
      downloadUrl: a.browser_download_url,
      type: getType(a.name),
      version: getVersion(a.name)
    }

    if (!utils.isValidType(r.type)) {
      core.debug(`OpenCore type '${r.type}' is not valid`)
      continue
    }

    if (semver.valid(r.version) === null) {
      core.debug(`OpenCore version '${r.version}' is not valid`)
      continue
    }

    if (targetType === r.type) {
      return r
    }
  }

  throw new Error(`Cannot found OpenCore release matching sha ${sha} and type ${targetType}`)
}

function getType (filename: string): string {
  const matches = filename.match(/-(?<type>\w+).zip$/)
  return matches?.length === 2 ? matches[1] : ''
}

function getVersion (filename: string): string {
  const matches = filename.match(/-(?<version>[0-9.]+)-/)
  return matches?.length === 2 ? matches[1] : ''
}
