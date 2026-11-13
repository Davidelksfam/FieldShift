# Field Shift rapid prototype

[Open the live prototype](https://fieldshift-tau.vercel.app) · Vercel production, verified READY.

Runnable Next.js + TypeScript baseline, explicitly requested by the user. Four screens cover field inputs, illustrative crop comparison, hypothetical water scenarios and evidence. Arabic RTL / English LTR, approved light-green branding, browser-local field saving and JSON export are included.

```sh
npm ci
npm run dev
npm test
npm run build
npm start
```

See the [prototype runbook](../docs/engineering/PROTOTYPE_RUNBOOK.md) for browser tests, source regeneration, assumptions and Vercel setup. Deploy with `web/` as project root. No runtime secrets are needed.

Real cached weather comes from the public Fayoum POWER query point. Farmer sample values, crop schedules and demonstration demand figures are labeled hypothetical; crop suitability is unreviewed. The app provides a complete interface baseline, not validated agronomic advice.

All visual work follows [the approved brand system](../docs/brand/README.md) and [web agent instructions](AGENTS.md). This user authorization supersedes earlier preparation-only scope for this rapid prototype; official competition facts and scientific review remain separate.
