import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Api } from '@octokit/plugin-rest-endpoint-methods/dist-types/types';
import * as prerelease from '../src/prerelease';

vi.mock('@actions/core');

describe('prerelease', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTagName', () => {
    it('formats the tag name correctly', () => {
      expect(prerelease.getTagName('abcdef1')).toBe('OpenCorePkg-abcdef1');
    });
  });

  describe('findOpenCoreRelease', () => {
    it('filters invalid assets and returns the matching release', async () => {
      const mockOctokit = {
        rest: {
          repos: {
            getReleaseByTag: vi.fn().mockResolvedValue({ data: { id: 123 } }),
            listReleaseAssets: vi.fn().mockResolvedValue({
              data: [
                {
                  name: 'OpenCore-1.0.0-UNKNOWN.zip',
                  browser_download_url: 'url1',
                }, // Invalid type
                {
                  name: 'OpenCore-INVALID-RELEASE.zip',
                  browser_download_url: 'url2',
                }, // Invalid semver
                {
                  name: 'OpenCore-1.0.0-RELEASE.zip',
                  browser_download_url: 'url3',
                }, // Match
              ],
            }),
          },
        },
      } as unknown as Api;

      const result = await prerelease.findOpenCoreRelease(
        mockOctokit,
        'abcdef1',
        true, // isRelease = true -> 'RELEASE'
      );

      expect(result).toStrictEqual({
        type: 'RELEASE',
        version: '1.0.0',
        downloadUrl: 'url3',
      });
    });

    it('throws an error if no matching release is found', async () => {
      const mockOctokit = {
        rest: {
          repos: {
            getReleaseByTag: vi.fn().mockResolvedValue({ data: { id: 123 } }),
            listReleaseAssets: vi.fn().mockResolvedValue({
              data: [
                {
                  name: 'OpenCore-1.0.0-DEBUG.zip',
                  browser_download_url: 'url1',
                }, // Wrong type
              ],
            }),
          },
        },
      } as unknown as Api;

      await expect(
        prerelease.findOpenCoreRelease(mockOctokit, 'abcdef1', true),
      ).rejects.toThrow(
        'Cannot found OpenCore release matching sha abcdef1 and type RELEASE',
      );
    });
  });
});
