import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as tc from '@actions/tool-cache';
import * as glob from '@actions/glob';
import * as utils from '../src/utils';

// Mock the heavy @actions dependencies
vi.mock('@actions/core');
vi.mock('@actions/tool-cache');
vi.mock('@actions/glob');

describe('utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('detectPlatformForFilename', () => {
    const filenamesDataProvider = [
      { filename: 'ocvalidate', wantOs: 'darwin' },
      { filename: 'ocvalidate.linux', wantOs: 'linux' },
      { filename: 'ocvalidate.exe', wantOs: 'win32' },
    ];

    it.each(filenamesDataProvider)(
      "should return correct OS with filename '$filename'",
      (data) => {
        const os = utils.detectPlatformForFilename(data.filename);
        expect(os).toEqual(data.wantOs);
      },
    );
  });

  describe('getType & isValidType', () => {
    it('returns correct type based on boolean', () => {
      expect(utils.getType(true)).toBe(utils.RELEASE_TYPE);
      expect(utils.getType(false)).toBe(utils.DEBUG_TYPE);
    });

    it('validates types correctly', () => {
      expect(utils.isValidType(utils.RELEASE_TYPE)).toBe(true);
      expect(utils.isValidType(utils.DEBUG_TYPE)).toBe(true);
      expect(utils.isValidType('UNKNOWN')).toBe(false);
    });
  });

  describe('getFullVersion', () => {
    it('combines version and type', () => {
      const release: utils.IOpenCoreRelease = {
        type: 'RELEASE',
        version: '1.0.0',
        downloadUrl: '',
      };
      expect(utils.getFullVersion(release)).toBe('1.0.0-RELEASE');
    });
  });

  describe('isTrue', () => {
    it('evaluates truthy strings correctly', () => {
      ['1', 't', 'true', 'y', 'yes', 'TRUE', 'Yes'].forEach((val) => {
        expect(utils.isTrue(val)).toBe(true);
      });
      ['0', 'false', 'no', 'random'].forEach((val) => {
        expect(utils.isTrue(val)).toBe(false);
      });
    });
  });

  describe('cache', () => {
    it('caches the file and returns the path', async () => {
      vi.mocked(tc.cacheFile).mockResolvedValue('/cached/path');
      const file: utils.IOcvalidateVersionFile = {
        version: '1.0.0',
        path: '/temp/ocvalidate',
      };

      const result = await utils.cache(file);
      expect(tc.cacheFile).toHaveBeenCalledWith(
        '/temp/ocvalidate',
        utils.CACHE_KEY,
        utils.CACHE_KEY,
        '1.0.0',
      );
      expect(result).toBe('/cached/path');
    });
  });

  describe('download', () => {
    it('downloads, extracts, and finds ocvalidate for the matching platform', async () => {
      const mockOpencore = {
        type: 'RELEASE',
        version: '1.0.0',
        downloadUrl: 'http://example.com',
      };

      vi.mocked(tc.downloadTool).mockResolvedValue('/temp/download.zip');
      vi.mocked(tc.extractZip).mockResolvedValue('/temp/extracted');

      const mockGlobber = {
        glob: vi
          .fn()
          .mockResolvedValue([
            '/temp/extracted/Utilities/ocvalidate/ocvalidate.linux',
          ]),
      };
      vi.mocked(glob.create).mockResolvedValue(mockGlobber as any);

      const result = await utils.download(mockOpencore, 'linux');

      expect(result.version).toBe('1.0.0-RELEASE');
      expect(result.path).toBe(
        '/temp/extracted/Utilities/ocvalidate/ocvalidate.linux',
      );
    });

    it('throws if no matching file for platform is found', async () => {
      const mockOpencore = {
        type: 'RELEASE',
        version: '1.0.0',
        downloadUrl: 'http://example.com',
      };

      vi.mocked(tc.downloadTool).mockResolvedValue('/temp/download.zip');
      vi.mocked(tc.extractZip).mockResolvedValue('/temp/extracted');

      const mockGlobber = {
        glob: vi
          .fn()
          .mockResolvedValue([
            '/temp/extracted/Utilities/ocvalidate/ocvalidate.linux',
          ]),
      };
      vi.mocked(glob.create).mockResolvedValue(mockGlobber as any);

      await expect(utils.download(mockOpencore, 'darwin')).rejects.toThrow(
        'No ocvalidate file found for platform: darwin',
      );
    });
  });
});
