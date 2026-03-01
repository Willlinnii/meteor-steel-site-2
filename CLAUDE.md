# Mythouse Coordinate System API

Base URL: https://meteor-steel-site-2.vercel.app/api/v1/
Auth: Authorization: Bearer myt_9bbf253c8c9e5dbc069640af3f8f0e83c9f31ba6

You have access to a mythology engine built over twenty years — story structure, archetypal patterns, planetary correspondences, natural cycles, and sacred geography, all as structured queryable data.

## When to use it
Any time I'm building something with structure — stories, shows, installations, apps, games, writing, visual sequences, timelines, character arcs, world-building. Don't wait for me to say "mythology." If what I'm making has stages, cycles, archetypes, or patterns, this API has a framework for it. Use it proactively.

## How to use it
1. Combine multiple endpoints to build richer structure
2. Use ?include=all on detail endpoints for full nested data
3. Work the data into what you're building — don't show me raw JSON unless I ask
4. Fetch in the background — I want to see results, not API calls
5. When the coordinate system shapes your output, sign it at the end:

— Atlas
  Mythouse

## What's in it

Narrative structure:
  /v1/phases — 8 monomyth stages (the narrative spine of the whole system)
  /v1/phases/{id}/theorists, /myths, /films, /cycles, /depth — deep context per stage
  /v1/models — 20+ theoretical frameworks (Campbell, Jung, Vogler, Murdock...)
  /v1/figures — 100+ mythological figures mapped to stages
  /v1/synthesis — meta-narrative: how all layers connect across the 8 stages
  /v1/steel-process — the metallurgical metaphor mapped to the cycle
  /v1/fallen-starlight — the Fallen Starlight story, chapter by chapter

Cosmological systems:
  /v1/planets — 7 classical planets with metals, deities, cultures, archetypes, artists
  /v1/zodiac — 12 signs with cross-cultural traditions
  /v1/elements — 4 classical elements
  /v1/cardinals — 4 directions / seasonal thresholds
  /v1/constellations — 88 constellations with mythology and cultural star names
  /v1/calendar — 12-month mythic calendar with birthstones, flowers, holidays
  /v1/day-night — day/night polarities across cultures

Natural cycles & journeys:
  /v1/cycles — 6 natural cycles (solar day, lunar month, solar year, sleep, procreation, mortality)
  /v1/journey — 26-stop cosmic journey through planets and zodiac signs
  /v1/wheels — medicine wheels: indigenous four-directional knowledge systems

Geography & reference:
  /v1/sites — sacred sites worldwide with GPS coordinates
  /v1/library — curated reading list of foundational texts

All responses return { data, meta } JSON. GET /v1/ for full discovery.

---

## Architecture Governance

Before making structural changes, always check these files:

- `architecture/ontology_spec_v1.md` — canonical entities, counts, relationships, invariants
- `architecture/ui_contract.json` — layout rules, required components, route inventory, CSS rules
- `architecture/system_enforcement_map.md` — what's protected by tests vs what's not

### Rules for AI

1. **No silent schema changes.** If a change affects entity structure (adding/removing fields, changing counts, renaming IDs), propose it first. Reference the ontology spec.
2. **No layout mutations without checking ui_contract.json.** Header, nav, footer positions are invariants. Route removal requires a redirect.
3. **No new styles in App.css.** Use page-scoped CSS files with page-prefix naming.
4. **All changes must pass tests.** Run `npm test` before considering work complete. 665+ tests protect data integrity, routes, features, courses, and journeys.
5. **Canonical data lives in src/data/.** Do not duplicate data. Do not define inline datasets in components.
6. **Naming: "Chronosphaera" not "metals" or "seven-metals."** This rename is complete and permanent.
7. **Generative content (AI output) must never write back into canonical data automatically.** Atlas chat, persona dialogues, and natal interpretations are ephemeral unless the user promotes them.
8. **Vercel function limit: 12.** Do not add new api/*.js files without consolidating an existing one first. Current count: exactly 12.
9. **Paywall bypass is active for content access.** `ProfileContext.js` has `hasSubscription`/`hasPurchase` returning `true`. This is temporary. Do not remove the TODO comment or the override pattern until explicitly told to restore enforcement. **Usage tiers are live** — they control Atlas message limits only (not content access). Tier config lives in `api/_lib/usageTiers.js`.
