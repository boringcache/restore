import * as core from '@actions/core';
import * as exec from '@actions/exec';
import { run } from '../lib/restore-only';
import { mockGetInput, mockGetBooleanInput } from './setup';

describe('Restore Action', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.GITHUB_REPOSITORY;
    delete process.env.BORINGCACHE_API_TOKEN;
    

    (exec.exec as jest.Mock).mockResolvedValue(0);
  });

  describe('Workspace Format', () => {
    it('should execute boringcache restore with correct arguments', async () => {
      mockGetInput({
        workspace: 'my-org/my-project',
        entries: 'deps:node_modules,build:dist',
      });
      mockGetBooleanInput({});
      
      await run();
      

      expect(exec.exec).toHaveBeenCalledWith('boringcache', ['--version'], { 
        ignoreReturnCode: true, 
        silent: true 
      });
      

      expect(exec.exec).toHaveBeenCalledWith(
        'boringcache',
        ['restore', 'my-org/my-project', 'deps:node_modules,build:dist'],
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
      

      (exec.exec as jest.Mock)
        .mockImplementation((command: string, args?: string[]) => {
          if (command === 'boringcache' && args?.[0] === '--version') {
            return Promise.resolve(0);
          }
          if (command === 'boringcache' && args?.[0] === 'restore') {
            return Promise.resolve(1); // Cache miss
          }
          return Promise.resolve(0);
        });
      
      await run();
      
      expect(core.setOutput).toHaveBeenCalledWith('cache-hit', 'false');
    });
  });

  describe('actions/cache Format', () => {
    it('should convert actions/cache format to workspace format', async () => {
      process.env.GITHUB_REPOSITORY = 'owner/repo';
      
      mockGetInput({
        path: '~/.npm',
        key: 'deps-hash123',
      });
      mockGetBooleanInput({});
      
      await run();
      

      expect(exec.exec).toHaveBeenCalledWith(
        'boringcache',
        ['restore', 'owner/repo', expect.stringMatching(/deps-hash123:.*\.npm/)],
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
      

      (exec.exec as jest.Mock)
        .mockImplementation((command: string, args?: string[]) => {
          if (command === 'boringcache' && args?.[0] === '--version') {
            return Promise.resolve(0);
          }
          if (command === 'boringcache' && args?.[0] === 'restore') {
            return Promise.resolve(1); // Cache miss
          }
          return Promise.resolve(0);
        });
      
      await run();
      
      expect(core.setFailed).toHaveBeenCalledWith('Cache miss and fail-on-cache-miss is enabled');
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
      

      (exec.exec as jest.Mock)
        .mockImplementation((command: string, args?: string[]) => {
          if (command === 'boringcache' && args?.[0] === '--version') {
            return Promise.resolve(1);
          }
          if (command === 'bash') {
            return Promise.reject(new Error('Installation failed'));
          }
          return Promise.resolve(0);
        });
      
      await run();
      
      expect(core.setFailed).toHaveBeenCalledWith(
        expect.stringContaining('Failed to install BoringCache CLI: Error: Installation failed')
      );
    });
  });
});