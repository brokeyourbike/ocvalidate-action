import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as core from '@actions/core';
import * as tc from '@actions/tool-cache';
import * as os from 'os';
import { run } from '../src/action';
import * as utils from '../src/utils';
import * as release from '../src/release';

vi.mock('@actions/core');
vi.mock('@actions/github', () => ({
  getOctokit: vi.fn().mockReturnValue({}),
}));
vi.mock('@actions/tool-cache');
vi.mock('os');
vi.mock('../src/utils', async (importOriginal) => {
  const actual = await importOriginal<typeof utils>();
  return {
    ...actual,
    download: vi.fn(),
    cache: vi.fn(),
  };
});
vi.mock('../src/release');
vi.mock('../src/prerelease', () => ({
  findOpenCoreRelease: vi.fn().mockResolvedValue({
    type: 'RELEASE',
    version: '1.0.0',
    downloadUrl: 'latest-url',
  }),
}));

describe('run', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(os.platform).mockReturnValue('linux');
  });

  it('fails if opencore-version is not specified', async () => {
    vi.mocked(core.getInput).mockImplementation((name) => {
      if (name === 'opencore-version') return '';
      return '';
    });

    await run();

    expect(core.setFailed).toHaveBeenCalledWith(
      'OpenCore version is not specified',
    );
  });

  it('uses cached version if available', async () => {
    vi.mocked(core.getInput).mockImplementation((name) => {
      if (name === 'opencore-version') return '1.0.0';
      if (name === 'release') return 'true';
      return '';
    });

    vi.mocked(release.getOpenCoreRelease).mockReturnValue({
      type: 'RELEASE',
      version: '1.0.0',
      downloadUrl: 'url',
    });
    vi.mocked(tc.find).mockReturnValue('/cached/path');

    await run();

    expect(core.info).toHaveBeenCalledWith('Found in cache @ /cached/path');
    expect(core.addPath).toHaveBeenCalledWith('/cached/path');
    expect(utils.download).not.toHaveBeenCalled();
  });

  it('downloads and caches if not in cache (specific version)', async () => {
    vi.mocked(core.getInput).mockImplementation((name) => {
      if (name === 'opencore-version') return '1.0.0';
      if (name === 'release') return 'true';
      return '';
    });

    vi.mocked(release.getOpenCoreRelease).mockReturnValue({
      type: 'RELEASE',
      version: '1.0.0',
      downloadUrl: 'url',
    });
    vi.mocked(tc.find).mockReturnValue(''); // Not cached
    vi.mocked(utils.download).mockResolvedValue({
      version: '1.0.0-RELEASE',
      path: '/downloaded/path',
    });
    vi.mocked(utils.cache).mockResolvedValue('/new/cached/path');

    await run();

    expect(utils.download).toHaveBeenCalled();
    expect(utils.cache).toHaveBeenCalled();
    expect(core.addPath).toHaveBeenCalledWith('/new/cached/path');
  });

  it('downloads and caches latest version', async () => {
    vi.mocked(core.getInput).mockImplementation((name) => {
      if (name === 'opencore-version') return 'latest';
      if (name === 'release') return 'true';
      return '';
    });

    vi.mocked(release.getLatestCommitsSha).mockResolvedValue(['abcdef1']);
    vi.mocked(tc.find).mockReturnValue('');
    vi.mocked(utils.download).mockResolvedValue({
      version: '1.0.0-RELEASE',
      path: '/downloaded/path',
    });
    vi.mocked(utils.cache).mockResolvedValue('/new/cached/path');

    await run();

    expect(release.getLatestCommitsSha).toHaveBeenCalled();
    expect(utils.download).toHaveBeenCalled();
    expect(core.addPath).toHaveBeenCalledWith('/new/cached/path');
  });

  it('catches errors and calls setFailed', async () => {
    vi.mocked(core.getInput).mockImplementation((name) => {
      if (name === 'opencore-version') return '1.0.0';
      return '';
    });

    vi.mocked(release.getOpenCoreRelease).mockImplementation(() => {
      throw new Error('Some unexpected error');
    });

    await run();

    expect(core.setFailed).toHaveBeenCalledWith('Some unexpected error');
  });
});
