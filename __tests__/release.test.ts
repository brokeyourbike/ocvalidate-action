import { describe, it, expect, vi } from 'vitest';
import type { Api } from '@octokit/plugin-rest-endpoint-methods/dist-types/types';
import * as utils from '../src/utils';
import * as release from '../src/release';

describe('getOpenCoreRelease', () => {
  it('can prepare download url', () => {
    expect(release.getOpenCoreRelease('1.0.0', true)).toStrictEqual({
      type: 'RELEASE',
      downloadUrl:
        'https://github.com/acidanthera/OpenCorePkg/releases/download/1.0.0/OpenCore-1.0.0-RELEASE.zip',
      version: '1.0.0',
    } as utils.IOpenCoreRelease);

    expect(release.getOpenCoreRelease('1.0.0', false)).toStrictEqual({
      type: 'DEBUG',
      downloadUrl:
        'https://github.com/acidanthera/OpenCorePkg/releases/download/1.0.0/OpenCore-1.0.0-DEBUG.zip',
      version: '1.0.0',
    } as utils.IOpenCoreRelease);
  });
});

describe('getLatestCommitSha', () => {
  it('returns the shortened sha of the latest commit', async () => {
    const mockOctokit = {
      rest: {
        repos: {
          listCommits: vi
            .fn()
            .mockResolvedValue({ data: [{ sha: 'abcdef1234567890' }] }),
        },
      },
    } as unknown as Api;

    const sha = await release.getLatestCommitSha(mockOctokit);
    expect(sha).toBe('abcdef1');
  });

  it('throws an error if no commits are found', async () => {
    const mockOctokit = {
      rest: {
        repos: {
          listCommits: vi.fn().mockResolvedValue({ data: [] }),
        },
      },
    } as unknown as Api;

    await expect(release.getLatestCommitSha(mockOctokit)).rejects.toThrow(
      "Repo acidanthera/OpenCorePkg don't have any commits",
    );
  });
});

describe('getLatestCommitsSha', () => {
  it('returns an array of shortened shas', async () => {
    const mockOctokit = {
      rest: {
        repos: {
          listCommits: vi.fn().mockResolvedValue({
            data: [{ sha: 'abcdef1234567890' }, { sha: '0987654321fedcba' }],
          }),
        },
      },
    } as unknown as Api;

    const shas = await release.getLatestCommitsSha(mockOctokit);
    expect(shas).toEqual(['abcdef1', '0987654']);
  });

  it('throws an error if no commits are found', async () => {
    const mockOctokit = {
      rest: {
        repos: {
          listCommits: vi.fn().mockResolvedValue({ data: [] }),
        },
      },
    } as unknown as Api;

    await expect(release.getLatestCommitsSha(mockOctokit)).rejects.toThrow(
      "Repo acidanthera/OpenCorePkg don't have any commits",
    );
  });
});
