import * as utils from '../src/utils'

const filenamesDataProvider = [
  {filename: 'ocvalidate', wantOs: 'darwin'},
  {filename: 'ocvalidate.linux', wantOs: 'linux'},
  {filename: 'ocvalidate.exe', wantOs: 'win32'},
]

describe.each(filenamesDataProvider)('detectOsForFilename', (data) => {
  it(`should return correct OS with filename '${data.filename}'`, () => {
    const os = utils.detectOsForFilename(data.filename)
    expect(os).toEqual(data.wantOs)
  })
})

test('can prepare download url', () => {
  const version = '1.0.0'
  const url = utils.prepareDownloadUrl(version)
  expect(url).toBe('https://github.com/acidanthera/OpenCorePkg/releases/download/1.0.0/OpenCore-1.0.0-RELEASE.zip')
})
