# Rapid prototype visual review

User-authorized baseline, following approved brand tokens, logo, fonts and light-green layout. Screenshots come from the production build after browser-flow testing. Sample field inputs are hypothetical; real cached POWER data and source limitations are labeled in the app.

- [Desktop Arabic](screenshots/desktop-ar.png)
- [Desktop English](screenshots/desktop-en.png)
- [Mobile Arabic](screenshots/mobile-ar.png)
- [Mobile English](screenshots/mobile-en.png)

Browser checks cover all four screens in both languages at 390, 768 and 1440 pixels, JSON export, weather CSV delivery, field save/reload, unavailable water/demand and interactive scenarios. A separate 200% zoom check found no horizontal page overflow. Production build/type checks and thirteen interface/brand tests pass. These are implementation checks, not agronomic validation.

[Runbook](../engineering/PROTOTYPE_RUNBOOK.md) documents the source bundle, assumptions, reproduction and deployment target. PR #6 separately proposes a seasonal feature pipeline against the old contract; this prototype preserves that parallel work and does not overwrite its files.
