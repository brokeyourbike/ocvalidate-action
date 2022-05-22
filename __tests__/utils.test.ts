import * as utils from '../src/utils'

const filenamesDataProvider = [
  {filename: 'ocvalidate', wantOs: 'darwin'},
  {filename: 'ocvalidate.linux', wantOs: 'linux'},
  {filename: 'ocvalidate.exe', wantOs: 'win32'},
]

describe.each(filenamesDataProvider)('detectPlatformForFilename', (data) => {
  it(`should return correct OS with filename '${data.filename}'`, () => {
    const os = utils.detectPlatformForFilename(data.filename)
    expect(os).toEqual(data.wantOs)
  })
})

