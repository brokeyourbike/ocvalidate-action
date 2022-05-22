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
}
