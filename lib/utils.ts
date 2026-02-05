import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { ensureBoringCache } from '@boringcache/action-core';

export interface CacheConfig {
  workspace: string;
  fullKey: string;
  platformSuffix: string;
}

export async function setupBoringCache(cliVersion: string = 'v1.0.0'): Promise<void> {
  await ensureBoringCache({
    version: cliVersion,
    token: process.env.BORINGCACHE_API_TOKEN,
  });
}

export async function getCacheConfig(
  key: string, 
  enableCrossOsArchive: boolean, 
  enablePlatformSuffix: boolean = false
): Promise<CacheConfig> {
  const workspace = process.env.BORINGCACHE_DEFAULT_WORKSPACE ||
                   process.env.GITHUB_REPOSITORY?.split('/')[1] ||
                   'default';

  let platformSuffix = '';
  if (enablePlatformSuffix && !enableCrossOsArchive) {
    const platform = os.platform() === 'darwin' ? 'darwin' : 'linux';
    const arch = os.arch() === 'arm64' ? 'arm64' : 'amd64';
    platformSuffix = `-${platform}-${arch}`;
  }

  const fullKey = key + platformSuffix;

  return {
    workspace,
    fullKey,
    platformSuffix
  };
}

export function validateInputs(inputs: any): void {

  const hasCliFormat = inputs.workspace || inputs.entries;
  const hasCacheFormat = inputs.path || inputs.key;
  
  if (!hasCliFormat && !hasCacheFormat) {
    throw new Error('Either (workspace + entries) or (path + key) inputs are required');
  }
  
  if (hasCliFormat && hasCacheFormat) {

    core.warning('Both CLI format (workspace/entries) and actions/cache format (path/key) provided. Using CLI format.');
  }
  
  if (hasCliFormat) {
    if (!inputs.entries) {
      throw new Error('Input "entries" is required when using CLI format');
    }
  }
  
  if (hasCacheFormat && !hasCliFormat) {
    if (!inputs.path) {
      throw new Error('Input "path" is required when using actions/cache format');
    }
    if (!inputs.key) {
      throw new Error('Input "key" is required when using actions/cache format');
    }
  }
  

  if (inputs.workspace && !inputs.workspace.includes('/')) {
    throw new Error('Workspace must be in format "namespace/workspace" (e.g., "my-org/my-project")');
  }
}

export function resolvePaths(pathInput: string): string {
  return pathInput.split('\n')
    .map(p => p.trim())
    .filter(p => p)
    .map(cachePath => {
      if (path.isAbsolute(cachePath)) {
        return cachePath;
      }
      if (cachePath.startsWith('~/')) {
        return path.join(os.homedir(), cachePath.slice(2));
      }
      return path.resolve(process.cwd(), cachePath);
    })
    .join('\n');
}

export interface CacheEntry {
  path: string;
  tag: string;
}

export function parseEntries(entriesInput: string, action: 'save' | 'restore'): CacheEntry[] {
  return entriesInput.split(',')
    .map(entry => entry.trim())
    .filter(entry => entry)
    .map(entry => {
      // Unified format: tag:path for both save and restore.
      // Use the first colon so Windows drive letters are preserved in the path.
      const colonIndex = entry.indexOf(':');
      
      if (colonIndex === -1) {
        throw new Error(`Invalid entry format: ${entry}. Expected format: tag:path`);
      }
      const tag = entry.substring(0, colonIndex);
      const entryPath = entry.substring(colonIndex + 1);
      return { tag, path: resolvePath(entryPath) };
    });
}

export function resolvePath(pathInput: string): string {
  const trimmedPath = pathInput.trim();
  if (path.isAbsolute(trimmedPath)) {
    return trimmedPath;
  }
  if (trimmedPath.startsWith('~/')) {
    return path.join(os.homedir(), trimmedPath.slice(2));
  }
  return path.resolve(process.cwd(), trimmedPath);
}

export function getPlatformSuffix(enablePlatformSuffix: boolean, enableCrossOsArchive: boolean): string {
  if (!enablePlatformSuffix || enableCrossOsArchive) {
    return '';
  }
  
  const platform = os.platform() === 'darwin' ? 'darwin' : 'linux';
  const arch = os.arch() === 'arm64' ? 'arm64' : 'amd64';
  return `-${platform}-${arch}`;
}

export function getWorkspace(inputs: any): string {
  if (inputs.workspace) {
    return inputs.workspace;
  }
  

  const repo = process.env.GITHUB_REPOSITORY;
  if (repo) {
    const parts = repo.split('/');
    return `${parts[0]}/${parts[1]}`;
  }
  
  return 'default/default';
}

export function convertCacheFormatToEntries(inputs: any, action: 'save' | 'restore'): string {
  if (!inputs.path || !inputs.key) {
    throw new Error('actions/cache format requires both path and key inputs');
  }
  
  const paths = inputs.path.split('\n')
    .map((p: string) => p.trim())
    .filter((p: string) => p);
  

  const platformSuffix = getPlatformSuffix(inputs.enablePlatformSuffix, inputs.enableCrossOsArchive);
  const fullKey = inputs.key + platformSuffix;

  return paths.map((p: string) => `${fullKey}:${resolvePath(p)}`).join(',');
}
