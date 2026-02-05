# boringcache/restore

**Cache once. Reuse everywhere.**

BoringCache is a universal build artifact cache for CI, Docker, and local development. It stores and restores directories you choose so build outputs, dependencies, and tool caches can be reused across environments.

BoringCache does not run builds and is not tied to any build tool. It works with any language, framework, or workflow by caching directories explicitly selected by the user.

Caches are content-addressed and verified before restore. If identical content already exists, uploads are skipped. The same cache can be reused in GitHub Actions, Docker/BuildKit, and on developer machines using the same CLI.

This action provides explicit restore steps for workflows that need precise control over when caches are read. If you want automatic restore at job start and save at job end, use `boringcache/action` instead.

## Quick start

```yaml
- uses: boringcache/restore@v1
  with:
    workspace: my-org/my-project
    entries: deps:node_modules
  env:
    BORINGCACHE_API_TOKEN: ${{ secrets.BORINGCACHE_API_TOKEN }}
```

Entries use `tag:path` format (for example, `deps:node_modules`).

## Mental model

This action restores directories you explicitly choose.

- You decide what is expensive (dependencies, build outputs, toolchains)
- BoringCache fingerprints the directory contents
- If the content matches an existing cache, it is restored
- You decide what to do on a cache miss (install, build, etc.)

This action does not infer what should be cached and does not modify your build.

## Common patterns

### Simple CI cache (conditional install)

```yaml
- uses: boringcache/restore@v1
  id: cache
  with:
    workspace: my-org/my-project
    entries: deps:node_modules
  env:
    BORINGCACHE_API_TOKEN: ${{ secrets.BORINGCACHE_API_TOKEN }}

- run: npm ci
  if: steps.cache.outputs.cache-hit != 'true'
```

### Advanced pattern: Restore + save pair

```yaml
- uses: boringcache/restore@v1
  id: cache
  with:
    workspace: my-org/my-project
    entries: deps:node_modules
  env:
    BORINGCACHE_API_TOKEN: ${{ secrets.BORINGCACHE_API_TOKEN }}

- run: npm ci

- uses: boringcache/save@v1
  with:
    workspace: my-org/my-project
    entries: deps:node_modules
  env:
    BORINGCACHE_API_TOKEN: ${{ secrets.BORINGCACHE_API_TOKEN }}
```

## Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `workspace` | No | repo name | Workspace in `org/repo` form. Defaults to `BORINGCACHE_DEFAULT_WORKSPACE` or repo name. |
| `entries` | No | - | Comma-separated `tag:path` pairs. Required unless using actions/cache-compatible inputs. |
| `path` | No | - | Files/directories to restore (actions/cache compatible). |
| `key` | No | - | Cache key (actions/cache compatible). |
| `restore-keys` | No | - | Fallback restore keys (actions/cache compatible). |
| `enableCrossOsArchive` | No | `false` | Enable cross-OS sharing by disabling platform suffixes (actions/cache compatibility). |
| `no-platform` | No | `false` | Disable OS/arch scoping for cache tags. |
| `fail-on-cache-miss` | No | `false` | Fail if cache is not found. |
| `lookup-only` | No | `false` | Check cache existence without downloading. |
| `verbose` | No | `false` | Enable detailed output. |

## Outputs

| Output | Description |
|--------|-------------|
| `cache-hit` | `true` if an exact match was found |
| `cache-primary-key` | Key used for restore |
| `cache-matched-key` | Key that matched |

## Platform behavior

Platform scoping is what makes it safe to reuse caches across machines.

By default, caches are isolated by OS and architecture. Use `no-platform: true` or `enableCrossOsArchive: true` only for portable artifacts (sources, lockfiles).

## Environment variables

| Variable | Description |
|----------|-------------|
| `BORINGCACHE_API_TOKEN` | API token (required) |
| `BORINGCACHE_DEFAULT_WORKSPACE` | Default workspace (if not specified in inputs) |

## Migrating from actions/cache/restore (optional)

```diff
- uses: actions/cache/restore@v4
+ uses: boringcache/restore@v1
+ env:
+   BORINGCACHE_API_TOKEN: ${{ secrets.BORINGCACHE_API_TOKEN }}
```

## Troubleshooting

- Unauthorized or workspace not found: ensure `BORINGCACHE_API_TOKEN` is set and the workspace exists.
- Cache miss: check `workspace` and `entries`, and remember platform scoping.
- Cache hit detection: rely on the `cache-hit` output rather than CLI exit codes.

## Release notes

See https://github.com/boringcache/restore/releases.

## License

MIT
