# BoringCache Restore

## What It Does

Restore-only cache action. Use with `boringcache/save` for granular control over when caching happens.

## Quick Reference

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

## When to Use

- Conditional install based on cache hit
- Multiple restore points in a workflow
- Paired with `boringcache/save` for explicit save timing

## Inputs

| Input | Description |
|-------|-------------|
| `workspace` | BoringCache workspace (`org/repo`) |
| `entries` | Cache entries (`tag:path,tag2:path2`) |
| `fail-on-cache-miss` | Fail if cache not found |
| `lookup-only` | Check existence without downloading |

## Outputs

| Output | Description |
|--------|-------------|
| `cache-hit` | `true` if exact match found |

## Code Structure

- `lib/restore-only.ts` - Main entry point (no post phase)
- `lib/utils.ts` - Shared utilities

## Build

```bash
npm install && npm run build && npm test
```

---
**See [../AGENTS.md](../AGENTS.md) for shared conventions.**
