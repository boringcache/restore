import * as core from '@actions/core';
import { execBoringCache, ensureBoringCache } from '@boringcache/action-core';
import { run } from '../lib/restore-only';
import { mockGetInput, mockGetBooleanInput } from './setup';

describe('Restore Action', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.GITHUB_REPOSITORY;
    delete process.env.BORINGCACHE_API_TOKEN;

    (execBoringCache as jest.Mock).mockResolvedValue(0);
    (ensureBoringCache as jest.Mock).mockResolvedValue(undefined);
  });

  describe('Workspace Format', () => {
    it('should execute boringcache restore with correct arguments', async () => {
      mockGetInput({
        workspace: 'my-org/my-project',
        entries: 'deps:node_modules,build:dist',
      });
      mockGetBooleanInput({});

      await run();

      expect(ensureBoringCache).toHaveBeenCalledWith({ version: 'v1.5.0' });

      expect(execBoringCache).toHaveBeenCalledWith(
        expect.arrayContaining(['restore', 'my-org/my-project', 'deps:node_modules,build:dist']),
        expect.any(Object)
      );

      expect(core.setOutput).toHaveBeenCalledWith('cache-hit', 'true');
    });

    it('should handle cache miss', async () => {
      mockGetInput({
        workspace: 'my-org/my-project',
        entries: 'deps:node_modules',
      });
      mockGetBooleanInput({});

      (execBoringCache as jest.Mock).mockResolvedValue(1);

      await run();

      expect(core.setOutput).toHaveBeenCalledWith('cache-hit', 'false');
    });
  });

  describe('actions/cache Format', () => {
    it('should convert actions/cache format to tag:path format', async () => {
      process.env.GITHUB_REPOSITORY = 'owner/repo';

      mockGetInput({
        path: '~/.npm',
        key: 'deps-hash123',
      });
      mockGetBooleanInput({});

      await run();

      expect(execBoringCache).toHaveBeenCalledWith(
        expect.arrayContaining(['restore', 'owner/repo', expect.stringMatching(/deps-hash123.*:.*\.npm/)]),
        expect.any(Object)
      );
    });
  });

  describe('Options', () => {
    it('should handle fail-on-cache-miss option', async () => {
      mockGetInput({
        workspace: 'my-org/my-project',
        entries: 'deps:node_modules',
      });
      mockGetBooleanInput({
        'fail-on-cache-miss': true,
      });

      (execBoringCache as jest.Mock).mockResolvedValue(1);

      await run();

      expect(core.setFailed).toHaveBeenCalledWith('Cache miss and fail-on-cache-miss is enabled');
    });

    it('should pass --no-platform when no-platform is true', async () => {
      mockGetInput({
        workspace: 'my-org/my-project',
        entries: 'deps:node_modules',
      });
      mockGetBooleanInput({ 'no-platform': true });

      await run();

      expect(execBoringCache).toHaveBeenCalledWith(
        expect.arrayContaining(['restore', 'my-org/my-project', 'deps:node_modules', '--no-platform']),
        expect.any(Object)
      );
    });

    it('should pass --no-platform when enableCrossOsArchive is true', async () => {
      mockGetInput({
        workspace: 'my-org/my-project',
        entries: 'deps:node_modules',
      });
      mockGetBooleanInput({ enableCrossOsArchive: true });

      await run();

      expect(execBoringCache).toHaveBeenCalledWith(
        expect.arrayContaining(['restore', 'my-org/my-project', 'deps:node_modules', '--no-platform']),
        expect.any(Object)
      );
    });

    it('should pass --verbose when verbose is true', async () => {
      mockGetInput({
        workspace: 'my-org/my-project',
        entries: 'deps:node_modules',
      });
      mockGetBooleanInput({ verbose: true });

      await run();

      expect(execBoringCache).toHaveBeenCalledWith(
        expect.arrayContaining(['restore', 'my-org/my-project', 'deps:node_modules', '--verbose']),
        expect.any(Object)
      );
    });

    it('should pass --lookup-only when lookup-only is true', async () => {
      mockGetInput({
        workspace: 'my-org/my-project',
        entries: 'deps:node_modules',
      });
      mockGetBooleanInput({ 'lookup-only': true });

      await run();

      expect(execBoringCache).toHaveBeenCalledWith(
        expect.arrayContaining(['restore', 'my-org/my-project', 'deps:node_modules', '--lookup-only']),
        expect.any(Object)
      );
    });

    it('should pass all flags together', async () => {
      mockGetInput({
        workspace: 'my-org/my-project',
        entries: 'deps:node_modules',
      });
      mockGetBooleanInput({
        'no-platform': true,
        'fail-on-cache-miss': true,
        'lookup-only': true,
        verbose: true,
      });

      await run();

      expect(execBoringCache).toHaveBeenCalledWith(
        expect.arrayContaining([
          'restore', 'my-org/my-project', 'deps:node_modules',
          '--no-platform', '--fail-on-cache-miss', '--lookup-only', '--verbose',
        ]),
        expect.any(Object)
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid inputs gracefully', async () => {
      mockGetInput({}); // No inputs
      mockGetBooleanInput({});

      await run();

      expect(core.setFailed).toHaveBeenCalledWith(
        expect.stringContaining('Either (workspace + entries) or (path + key) inputs are required')
      );
    });

    it('should handle CLI installation failure', async () => {
      mockGetInput({
        workspace: 'my-org/my-project',
        entries: 'deps:node_modules',
      });
      mockGetBooleanInput({});

      (ensureBoringCache as jest.Mock).mockRejectedValue(new Error('Installation failed'));

      await run();

      expect(core.setFailed).toHaveBeenCalledWith(
        expect.stringContaining('Installation failed')
      );
    });
  });
});
