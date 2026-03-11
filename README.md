# boringcache/restore

Restore directories from BoringCache at an exact point in the job.

## When to use it

Pick this when restore needs to happen before one specific step and save should happen later or somewhere else.

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

## Trust model

- `BORINGCACHE_RESTORE_TOKEN` is the preferred token for this action.
- A save-capable token also works because save implies restore.
- This action does not publish cache updates, so it is safe for low-trust jobs when tags are restored intentionally.

## What it handles

- Restores the directories you name in `tag:path` form.
- Supports `actions/cache`-style `path`, `key`, and `restore-keys` inputs.
- Keeps platform scoping on by default.

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

## Learn more

- [GitHub Actions docs](https://boringcache.com/docs#save-restore)
- [GitHub Actions auth and trust model](https://boringcache.com/docs#actions-auth)
