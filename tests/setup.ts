/// <reference types="node" />

jest.mock('@actions/core', () => ({
  getInput: jest.fn(),
  getBooleanInput: jest.fn(),
  setOutput: jest.fn(),
  setFailed: jest.fn(),
  info: jest.fn(),
  warning: jest.fn(),
  debug: jest.fn(),
  addPath: jest.fn(),
}));

jest.mock('@boringcache/action-core', () => {
  const actual = jest.requireActual('@boringcache/action-core');
  return {
    ...actual,
    ensureBoringCache: jest.fn().mockResolvedValue(undefined),
    execBoringCache: jest.fn().mockResolvedValue(0),
  };
});

jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  promises: {
    chmod: jest.fn(),
    rename: jest.fn(),
  },
}));

import * as core from '@actions/core';
const originalEnv = process.env;

beforeEach(() => {
  jest.resetAllMocks();
  // Re-setup default mocks after reset
  const actionCore = require('@boringcache/action-core');
  actionCore.ensureBoringCache.mockResolvedValue(undefined);
  actionCore.execBoringCache.mockResolvedValue(0);
  process.env = { ...originalEnv };
});

afterEach(() => {
  process.env = originalEnv;
});
export const mockGetInput = (inputs: {[key: string]: string}) => {
  (core.getInput as jest.Mock).mockImplementation((name: string) => inputs[name] || '');
};
export const mockGetBooleanInput = (inputs: {[key: string]: boolean}) => {
  (core.getBooleanInput as jest.Mock).mockImplementation((name: string) => inputs[name] || false);
};
