"use strict";
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
exports.setupBoringCache = setupBoringCache;
exports.getCacheConfig = getCacheConfig;
exports.validateInputs = validateInputs;
exports.resolvePaths = resolvePaths;
exports.parseEntries = parseEntries;
exports.resolvePath = resolvePath;
exports.getPlatformSuffix = getPlatformSuffix;
exports.getWorkspace = getWorkspace;
exports.convertCacheFormatToEntries = convertCacheFormatToEntries;
const core = __importStar(require("@actions/core"));
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const action_core_1 = require("@boringcache/action-core");
async function setupBoringCache(cliVersion = 'v1.0.0') {
    await (0, action_core_1.ensureBoringCache)({
        version: cliVersion,
        token: process.env.BORINGCACHE_API_TOKEN,
    });
}
async function getCacheConfig(key, enableCrossOsArchive, enablePlatformSuffix = false) {
    var _a;
    const workspace = process.env.BORINGCACHE_DEFAULT_WORKSPACE ||
        ((_a = process.env.GITHUB_REPOSITORY) === null || _a === void 0 ? void 0 : _a.split('/')[1]) ||
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
function validateInputs(inputs) {
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
function resolvePaths(pathInput) {
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
function parseEntries(entriesInput, action) {
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
function resolvePath(pathInput) {
    const trimmedPath = pathInput.trim();
    if (path.isAbsolute(trimmedPath)) {
        return trimmedPath;
    }
    if (trimmedPath.startsWith('~/')) {
        return path.join(os.homedir(), trimmedPath.slice(2));
    }
    return path.resolve(process.cwd(), trimmedPath);
}
function getPlatformSuffix(enablePlatformSuffix, enableCrossOsArchive) {
    if (!enablePlatformSuffix || enableCrossOsArchive) {
        return '';
    }
    const platform = os.platform() === 'darwin' ? 'darwin' : 'linux';
    const arch = os.arch() === 'arm64' ? 'arm64' : 'amd64';
    return `-${platform}-${arch}`;
}
function getWorkspace(inputs) {
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
function convertCacheFormatToEntries(inputs, action) {
    if (!inputs.path || !inputs.key) {
        throw new Error('actions/cache format requires both path and key inputs');
    }
    const paths = inputs.path.split('\n')
        .map((p) => p.trim())
        .filter((p) => p);
    const platformSuffix = getPlatformSuffix(inputs.enablePlatformSuffix, inputs.enableCrossOsArchive);
    const fullKey = inputs.key + platformSuffix;
    return paths.map((p) => `${fullKey}:${resolvePath(p)}`).join(',');
}
