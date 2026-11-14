# GitHub Pages hosting

The root Vite application can be hosted at
https://davidelksfam.github.io/FieldShift/ without a Vercel backend. Public NASA,
SoilGrids and Esri requests run in the browser; their availability and CORS rules
still apply. Source-level cache/snapshot/missing-data behavior is unchanged.

## Deployment

Enable **GitHub Actions** as the repository's Pages source. The
[Pages workflow](../../.github/workflows/github-pages.yml) checks and builds each
push to `main`, uploads `dist` and deploys that exact artifact using GitHub's Pages
environment. It can also be dispatched manually. Only `main` is published by a
push; feature previews are not copied into production.

The workflow reads the Pages base path and passes it through `VITE_BASE_PATH`.
Root-domain/Vercel builds retain `/` by default. Bundled assets, the logo, Earth
textures and lazy chunks use Vite's resolved base. The service worker registers
under that base, caches matching first-party paths and only replaces caches with
the same base-path identity. External provider imagery/data are not precached.

The deployed `deployment.json` records the source commit and repository so a
successful deployment can be compared directly with `main`. It contains no
credentials or user data. Scientific V2 remains off by default.

## Verification

```bash
npm ci
npm run check
npm run test:browser
npm run test:browser:pages
```

The Pages check builds under `/FieldShift/` and verifies the logo, 3D startup,
landmark selection/zoom, current form simplifications, whole-field totals,
scoped service worker and offline reload. The existing root checks preserve
Vercel/root hosting compatibility. These browser checks use controlled provider
responses or deliberate provider failure; they do not establish live provider
availability.

After publication, compare `deployment.json` with the deployed `main` revision
and inspect the public URL with real map/data requests, checking source status,
the logo, preset/manual/GPS selection, zoom, language/theme and comparison flows.
Keep observed provider failures and fallbacks distinct from hosting failures.
