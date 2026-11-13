# Reels video performance baselines

## Baseline script

```bash
# Production (recommended for comparison)
AUDIT_URL="https://feels-menu.vercel.app/?view=reels" \
BASELINE_LABEL=pre \
OUT_PATH=docs/performance/baselines/pre-implementation.json \
node scripts/reels-video-baseline.mjs

# After changes
BASELINE_LABEL=post \
OUT_PATH=docs/performance/baselines/post-implementation.json \
node scripts/reels-video-baseline.mjs
```

Requires Playwright browsers (`npx playwright install` once).

## R2 headers check (read-only)

```bash
node scripts/r2-media-headers-check.mjs
```

Writes `r2-headers-check.json` in this folder.

## Metrics captured

- `maxVideoElements` during the script
- Per product (`espresso-duplo`, `cappuccino`, `espresso`): `focusToPlayingMs`, `videoCount`, `readyState`
- MP4 network request counts from Playwright responses
- `performance.getEntriesByType('resource')` for `.mp4` (transferSize may be 0 cross-origin)

Validate TTFF on a physical iPhone via Safari Web Inspector when automated `transferSize` is opaque.
