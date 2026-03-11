# boringcache/restore

Restore directories from BoringCache at a specific point in your workflow.

Use this when cache timing needs to be explicit. For automatic restore + save, use `boringcache/action`.

## Quick start

```yaml
- uses: boringcache/restore@v1
  id: cache
  with:
    workspace: my-org/my-project
    entries: deps:node_modules
  env:
    BORINGCACHE_RESTORE_TOKEN: ${{ secrets.BORINGCACHE_RESTORE_TOKEN }}
```

## Key inputs

| Input | Description |
|-------|-------------|
| `workspace` | Workspace in `org/repo` form. Defaults to the repo name. |
| `entries` | Comma-separated `tag:path` pairs. |
| `path`, `key`, `restore-keys` | `actions/cache` compatibility inputs. |
| `lookup-only` | Check existence without downloading. |
| `fail-on-cache-miss` | Fail when no cache is found. |
| `no-platform` / `enableCrossOsArchive` | Disable platform suffixing for portable caches only. |

## Outputs

| Output | Description |
|--------|-------------|
| `cache-hit` | Whether an exact match was restored. |
| `cache-primary-key` | Primary key used for restore. |
| `cache-matched-key` | Key that matched. |

## Docs

- [GitHub Actions docs](https://boringcache.com/docs#save-restore)
- [GitHub Actions auth and trust model](https://boringcache.com/docs#actions-auth)
