import { Api } from '@octokit/plugin-rest-endpoint-methods/dist-types/types'
import * as utils from './utils'

const OWNER = 'acidanthera'
const REPO = 'OpenCorePkg'

function getDownloadUrl (version: string, isRelease: boolean): string {
  return `https://github.com/${OWNER}/${REPO}/releases/download/${version}/OpenCore-${version}-${utils.getType(isRelease)}.zip`
}

export function getOpenCoreRelease (version: string, isRelease: boolean): utils.IOpenCoreRelease {
  const release: utils.IOpenCoreRelease = {
    type: utils.getType(isRelease),
    downloadUrl: getDownloadUrl(version, isRelease),
    version: version
  }
  return release
}

export async function getLatestCommitSha (octokit: Api): Promise<string> {
  const commits = await octokit.rest.repos.listCommits({
    owner: OWNER,
    repo: REPO,
    per_page: 1
  })

  if (commits.data.length < 1) {
    throw new Error(`Repo ${OWNER}/${REPO} don't have any commits`)
  }

  const commit = commits.data[0]
  return commit.sha.slice(0, 7)
}
