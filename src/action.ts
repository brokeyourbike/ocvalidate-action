import * as os from 'os'
import * as fs from 'fs'
import * as core from '@actions/core'
import * as github from '@actions/github'
import * as tc from '@actions/tool-cache'
import * as utils from './utils'
import * as release from './release'
import * as prerelease from './prerelease'

export async function run (): Promise<void> {
  try {
    const platform: string = os.platform()

    const opencoreVersion = core.getInput('opencore-version')
    const token = core.getInput('token')
    const isRelease = utils.isTrue(core.getInput('release'))

    if (opencoreVersion === '') {
      core.setFailed('OpenCore version is not specified')
      return
    }

    core.info(`Setup ocvalidate from OpenCore version ${opencoreVersion}`)

    let opencore: utils.IOpenCoreRelease
    if (opencoreVersion === utils.LATEST_VERSION) {
      const octokit = github.getOctokit(token)
      const commitSha = await release.getLatestCommitSha(octokit)
      opencore = await prerelease.findOpenCoreRelease(octokit, commitSha, isRelease)
    } else {
      opencore = release.getOpenCoreRelease(opencoreVersion, isRelease)
    }

    let ocvalidatePath: string = tc.find(utils.CACHE_KEY, utils.getFullVersion(opencore))
    if (ocvalidatePath !== '') {
      core.info(`Found in cache @ ${ocvalidatePath}`)
      addToPath(ocvalidatePath)
      return
    }

    const file = await utils.download(opencore, platform)
    ocvalidatePath = await utils.cache(file)

    addToPath(ocvalidatePath)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to install ocvalidate'
    core.setFailed(message)
  }
}

function addToPath (path: string): void {
  core.addPath(path)
  core.info('Added ocvalidate to the path')

  core.info('Making it executable..')
  fs.chmodSync(path, 0o755)
}
