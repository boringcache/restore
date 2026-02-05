"use strict";
/// <reference types="node" />
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockGetBooleanInput = exports.mockGetInput = void 0;
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
jest.mock('@actions/exec', () => ({
    exec: jest.fn(),
}));
jest.mock('fs', () => ({
    promises: {
        chmod: jest.fn(),
        rename: jest.fn(),
    },
}));
const core = __importStar(require("@actions/core"));
const originalEnv = process.env;
beforeEach(() => {
    jest.resetAllMocks();
    process.env = { ...originalEnv };
});
afterEach(() => {
    process.env = originalEnv;
});
const mockGetInput = (inputs) => {
    core.getInput.mockImplementation((name) => inputs[name] || '');
};
exports.mockGetInput = mockGetInput;
const mockGetBooleanInput = (inputs) => {
    core.getBooleanInput.mockImplementation((name) => inputs[name] || false);
};
exports.mockGetBooleanInput = mockGetBooleanInput;
