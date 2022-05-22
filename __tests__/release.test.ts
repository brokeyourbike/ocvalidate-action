import * as utils from '../src/utils'
import * as release from '../src/release'

test('can prepare download url', () => {
  expect(release.getOpenCoreRelease('1.0.0', true)).toStrictEqual({
    type: 'RELEASE',
    downloadUrl: 'https://github.com/acidanthera/OpenCorePkg/releases/download/1.0.0/OpenCore-1.0.0-RELEASE.zip',
    version: '1.0.0'
  } as utils.IOpenCoreRelease)

  expect(release.getOpenCoreRelease('1.0.0', false)).toStrictEqual({
    type: 'DEBUG',
    downloadUrl: 'https://github.com/acidanthera/OpenCorePkg/releases/download/1.0.0/OpenCore-1.0.0-DEBUG.zip',
    version: '1.0.0'
  } as utils.IOpenCoreRelease)
})
