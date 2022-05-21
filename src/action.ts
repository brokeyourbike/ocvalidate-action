import * as os from 'os'
import * as core from '@actions/core'
import * as github from '@actions/github'
import * as tc from '@actions/tool-cache'
import * as utils from './utils'

export async function run (): Promise<void> {
  try {
    const platform: string = os.platform()

    const versionSpec = core.getInput('opencore-version')
    const token = core.getInput('token')
    const isRelease = utils.isTrue(core.getInput('release'))

    const auth = token === '' ? undefined : `token ${token}`

    if (versionSpec === '') {
      core.setFailed('Version is not specified')
      return
    }

    const octokit = github.getOctokit(token)

    const commits = await octokit.rest.repos.listCommits({
      owner: 'acidanthera',
      repo: 'OpenCorePkg',
      per_page: 1
    });

    if (commits.data.length < 1) {
      core.setFailed('Repo acidanthera/OpenCorePkg don\'t have any commits')
      return
    }

    const commit = commits.data[0]
    const smallSha = commit.sha.slice(0, 7)
    console.log(commit)

    const release = await octokit.rest.repos.getReleaseByTag({
      owner: 'dortania',
      repo: 'build-repo',
      tag: `OpenCorePkg-${smallSha}`,
    });

    console.log(release)

    const assets = await octokit.rest.repos.listReleaseAssets({
      owner: 'dortania',
      repo: 'build-repo',
      release_id: release.data.id,
    });

    console.log(assets)

    return

    core.info(`Setup opencore version spec ${versionSpec}`)

    let ocvalidatePath: string

    ocvalidatePath = tc.find(utils.CACHE_KEY, versionSpec)
    if (ocvalidatePath !== '') {
      core.info(`Found in cache @ ${ocvalidatePath}`)
    } else {
      const filePath = await utils.findAndDownload(versionSpec, isRelease, platform, auth)
      ocvalidatePath = await utils.cache(filePath)
    }

    core.addPath(ocvalidatePath)
    core.info('Added ocvalidate to the path')
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to `run`'
    core.setFailed(message)
  }
}
