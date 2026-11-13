# Media hosting (Cloudflare R2)

## How URLs work

`data/menu-snapshot.json` keeps **paths** like `/menu/cappuccino.mp4` and `/brand/intro-menu.mp4`, or you can paste **full HTTPS URLs** per item.

At build time, `VITE_MEDIA_ORIGIN` (optional) prefixes relative paths:

| Snapshot value | `VITE_MEDIA_ORIGIN` | Result |
|----------------|---------------------|--------|
| `/menu/foo.mp4` | empty | `/menu/foo.mp4` (Vercel `public/`) |
| `/menu/foo.mp4` | `https://media.example.com` | `https://media.example.com/menu/foo.mp4` |
| `https://cdn.example.com/foo.mp4` | any | unchanged |

Production builds read `.env.production` in the repo (`VITE_MEDIA_ORIGIN`). Override in **Vercel → Environment Variables** if you change the bucket domain later.

## R2 layout

Mirror the repo `public/` tree on the bucket:

```text
brand/intro-menu.mp4
brand/intro-menu-poster.jpg
brand/coffee-feelings-logo.png
menu/espresso-duplo.mp4
menu/espresso-duplo-video-poster.jpg
menu/cappuccino.mp4
menu/cappuccino-video-poster.jpg
menu/*.jpg
```

## Video frame posters (reels)

Reels use **frame posters** (`videoPoster` in `menu-snapshot.json`), not the illustrative product photo. The feed grid keeps `image`.

Generate posters before deploy (requires **ffmpeg**), from R2 or `public/`:

```bash
VITE_MEDIA_ORIGIN=https://your-bucket.r2.dev npm run media:posters
```

Upload the new `*-video-poster.jpg` files to R2 with the MP4s. Re-run when a video file changes.

## Fast Start (moov before mdat)

Reels and hub videos should be **progressive MP4** with the `moov` atom before `mdat` so Safari can read metadata and start playback without downloading the full file.

Inspection (Nov 2026, `public/menu/` and the same paths on R2):

| File | `ftyp` @0 | `moov` @32 | Re-encode needed |
|------|-----------|------------|------------------|
| `espresso-duplo.mp4` | yes | yes | **No** |
| `cappuccino.mp4` | yes | yes | **No** |
| `brand/intro-menu.mp4` | yes | yes | **No** |

Commands used:

```bash
ffprobe -v trace public/menu/espresso-duplo.mp4 2>&1 | rg "type:'moov'"
```

If a future upload fails fast-start checks, re-mux only (no quality change):

```bash
ffmpeg -i input.mp4 -c copy -movflags +faststart output.mp4
```

Do **not** re-process current production files unless a new asset is added.

## R2 delivery headers (read-only checks)

Run locally (no bucket changes):

```bash
node scripts/r2-media-headers-check.mjs
```

Output: `docs/performance/r2-headers-check.json` — records `Accept-Ranges`, `206` slice responses, and whether `Access-Control-Allow-Origin` appears on HEAD/GET with your site `Origin`. Configure missing CORS on the bucket manually if the report shows gaps.

## CORS (required for video from another origin)

Allow your site origin(s), for example `https://your-menu.vercel.app`:

- **Allowed methods:** `GET`, `HEAD`
- **Allowed headers:** `Range` (Safari/iOS byte-range for video)
- **Expose headers:** `Content-Length`, `Content-Range`, `Accept-Ranges`

## After upload

1. Set `VITE_MEDIA_ORIGIN` to your public bucket URL or custom domain.
2. Redeploy Vercel.
3. Optionally remove large `.mp4` from `public/` in git once Cloudflare serves them (images can stay or move too).

You can also set per-field full URLs in `menu-snapshot.json` without using `VITE_MEDIA_ORIGIN`.
