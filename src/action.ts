import * as os from 'os'
import * as path from 'path'
import * as core from '@actions/core'
import * as tc from '@actions/tool-cache'
import * as utils from './utils'

export async function run (): Promise<void> {
  try {
    const platform: string = os.platform()

    const versionSpec = core.getInput('opencore-version')
    const token = core.getInput('token')

    const auth = token === '' ? undefined : `token ${token}`

    if (versionSpec === '') {
      core.setFailed('Version is not specified')
      return
    }

    core.info(`Setup opencore version spec ${versionSpec}`)

    let ocvalidatePath: string

    ocvalidatePath = tc.find(utils.CACHE_KEY, versionSpec)
    if (ocvalidatePath !== '') {
      core.info(`Found in cache @ ${ocvalidatePath}`)
    } else {
      const filePath = await utils.findAndDownload(versionSpec, platform, auth)
      ocvalidatePath = await utils.cache(filePath)
    }

    core.addPath(path.dirname(ocvalidatePath))
    core.info('Added ocvalidate to the path')
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to `run`'
    core.setFailed(message)
  }
}
