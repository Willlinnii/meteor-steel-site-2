# Ontology Specification v1.0

> The canonical entity inventory for Mythouse — The Story Atlas.
>
> This document defines what exists, where it lives, and how entities relate.
> Changes to entity structure require a version bump and migration plan.
>
> Version: 1.0
> Date: 2026-02-27

---

## Data Authority Layers

All data in this system falls into one of three layers:

| Layer | Description | Who Can Modify | Example |
|---|---|---|---|
| **Canonical** | Core ontology. Structured, versioned, tested. Single source of truth. | Human approval required. AI must propose, not implement. | Planets, zodiac, stages, figures |
| **Overlay** | User-generated or editorial enrichment layered on top of canonical. | Users (their own), admins (curated). | Writings, story cards, teacher syllabi, feed posts |
| **Generative** | AI-produced synthesis. Ephemeral unless explicitly promoted to canonical or overlay. | AI creates, human approves promotion. | Atlas chat responses, persona dialogues, natal interpretations |

**Rule: Generative content must NEVER write back into canonical automatically.**

---

## Entity Inventory

### Narrative Structure (The Spine)

| Entity | Canonical Source | Count | Required Fields | Relationships |
|---|---|---|---|---|
| **Monomyth Stage** | `src/data/monomyth.json` | 8 | id, name, atlas, psychles, forms, scripts, myths | Has theorists, myths, films, cycles, depth |
| **Theorist** | `src/data/monomythTheorists.json` | ~30 | id, name, bio, books | Mapped to stages |
| **Theoretical Model** | `src/data/monomythModels.json` | 20+ | id, name, description | Mapped to stages |
| **Mythic Figure** | `src/data/figures.json` | 100+ | id, name, stage, culture | Belongs to stage, culture |
| **Natural Cycle** | `src/data/monomythCycles.json` | 6 | id, name, stages | Maps to 8-stage cycle |
| **Film Reference** | `src/data/monomythFilms.json` | 50+ | id, title, stages | Mapped to stages |
| **Mythic Example** | `src/data/monomythMyths.json` | 30+ | id, name, stages | Mapped to stages |
| **Synthesis** | `src/data/synthesis.json` | 8 entries | stage, layers | Connects all layers per stage |
| **Steel Process** | `src/data/steelProcess.json` | 7 steps | id, label | Parallel to monomyth stages |

### Cosmological Structure

| Entity | Canonical Source | Count | Required Fields | Relationships |
|---|---|---|---|---|
| **Planet** | `src/data/chronosphaera.json` | 7 | number, metal, planet, day, sin, deities | Has element, deities, zodiac rulers, body parts |
| **Zodiac Sign** | `src/data/chronosphaeraZodiac.json` | 12 | id, name, element, ruler | Ruled by planet, belongs to element |
| **Element** | `src/data/chronosphaeraElements.json` | 4 | id, name, qualities | Contains zodiac signs |
| **Cardinal Direction** | `src/data/chronosphaeraCardinals.json` | 4 | id, name, season | Marks seasonal thresholds |
| **Constellation** | `src/data/constellations.json` + `constellationContent.json` | 88 | id, name, mythology | Independent (some overlap zodiac) |
| **Calendar Month** | `src/data/mythicCalendar.json` | 12 | month, birthstone, flower | Links to zodiac, cultural holidays |
| **Day/Night Polarity** | `src/data/dayNight.json` | Paired entries | — | Cross-cultural archetype pairs |
| **Medicine Wheel** | `src/data/medicineWheels.json` + `medicineWheelContent.json` | Multiple traditions | id, tradition | 4-directional per tradition |

### Enrichment Files (Planet System)

These files enrich the core 7 planets. They do NOT duplicate — they extend.

| File | What It Adds |
|---|---|
| `chronosphaeraDeities.json` | Expanded deity profiles per planet across 6+ cultures |
| `chronosphaeraArchetypes.json` | Archetypal associations per planet |
| `chronosphaeraArtists.json` | Creative/artistic associations |
| `chronosphaeraModern.json` | Modern cultural connections |
| `chronosphaeraStories.json` | Narrative content per planet |
| `chronosphaeraTheology.json` | Theological frameworks |
| `chronosphaeraShared.json` | Cross-cutting themes |
| `chronosphaeraPlanetaryCultures.json` | Planet data organized by culture |
| `chronosphaeraHebrew.json` | Hebrew alphabet / Qabbalah correspondences |
| `chronosphaeraBodyPositions.js` | Body position mappings (Chaldean, heliocentric) |
| `chronosphaeraBeyondRings.js` | Structures beyond the 7 classical planets |

### Pantheons (Cultural Deity Collections)

| Entity | Canonical Source | Count | Structure |
|---|---|---|---|
| **Pantheon** | `src/data/*Pantheon.json` (78 files) | 78 traditions | Array of deities per culture |

Each pantheon file is independently authored but follows a consistent structure:
- Array of deity objects
- Each deity: name, aliases, domains, symbols, myths, cultural context

**Rule: Pantheons are per-culture. There is no unified "deities table." Cross-cultural connections are made through planet-deity mappings in `chronosphaeraDeities.json`, not by merging pantheons.**

### Content & Narrative

| Entity | Canonical Source | Size | Notes |
|---|---|---|---|
| **Fallen Starlight** (book) | `src/data/fallenStarlight.json` | 126K | 8 chapters mapped to stages |
| **Story of Stories** (book) | `src/data/storyOfStoriesData.js` | 134K | Full proposal document |
| **Mythology Channel Episodes** | `src/data/mythsEpisodes.json` | 570K | 30 episodes, 3 seasons, full scripts |
| **Mythology Channel Series** | `src/data/mythologyChannelSeries.js` | 12K | Show metadata |
| **Sacred Sites** | `src/data/mythicEarthSites.json` | 203K | 2000+ sites with GPS |
| **Ancient Libraries** | `src/data/ancientLibraries.json` | 100K | Historical libraries |
| **Ancient Temples** | `src/data/ancientTemples.json` | 64K | Sacred architecture |
| **Library (Reading List)** | `src/data/mythSalonLibrary.json` | 23K | Curated foundational texts |
| **Treasures** | `src/data/treasuresData.js` | 92K | Art, relics, sacred objects |

### Product & Journey Structure

| Entity | Canonical Source | Count | Notes |
|---|---|---|---|
| **Journey Definition** | `src/data/journeyDefs.js` | 9 | SINGLE SOURCE OF TRUTH for all journey types |
| **Yellow Brick Road Path** | `src/data/yellowBrickRoad.json` | 26 stops | 7 ascending + 12 zodiac + 7 descending |
| **Course** | `src/coursework/courseEngine.js` | 11 | Requirements, completion logic |
| **Rank** | `src/profile/profileEngine.js` | 7 | Earned via course completion |
| **Credential Category** | `src/profile/profileEngine.js` | 8 | Scholar, storyteller, healer, etc. |
| **Stripe Product** | `api/_lib/stripeProducts.js` | 20+ | Subscriptions + one-time purchases |
| **API Tier** | `api/_lib/tierConfig.js` | 3 | free, call, ambient |
| **Mentor Type** | `src/profile/mentorEngine.js` | 5 | scholar, storyteller, healer, mediaVoice, adventurer |
| **Consulting Type** | `api/mentor.js` | 5 | character, narrative, coaching, media, adventure |
| **Discover Feature** | `src/data/discoverFeatureDefs.js` | ~15 | Marketing/feature pages |

### User-Generated (Overlay Layer)

| Entity | Storage | Access |
|---|---|---|
| User Profile | Firestore `users/{uid}/meta/profile` | Owner, Admin |
| User Writings | Firestore `users/{uid}/writings/{docId}` | Owner |
| Story Cards | Firestore `users/{uid}/story-cards/{cardId}` | Owner write, all read |
| Course Progress | Firestore `users/{uid}/progress/{sectionId}` | Owner |
| Certificates | Firestore `users/{uid}/meta/certificates` | Owner |
| Teacher Courses | Firestore `users/{uid}/teacher-courses/{courseId}` | Owner |
| Guild Posts | Firestore `guild-posts/{postId}` | All read, server write |
| Fellowship Posts | Firestore `fellowship-posts/{postId}` | All read, author write |
| Feed Posts | Firestore `feed/{postId}` | All read, author write |

### Generative (AI Layer)

| Entity | Generated By | Persistence | Promotion Path |
|---|---|---|---|
| Atlas Chat Responses | Claude (Anthropic) | Session only (WritingsContext, max 200 msgs) | User saves to writings |
| Persona Dialogues | Claude/OpenAI | Session only | None — ephemeral |
| Natal Chart Interpretations | Claude + astronomy-engine | Rendered in UI | Saved to profile if user confirms |
| Journey Challenge Evaluations | Claude | Progress tracking (pass/fail) | Stored as coursework element |
| Syllabus Entity Extraction | Claude Haiku | Session only (TeacherPage state) | Displayed, not persisted |

---

## Relationship Map

```
Monomyth Stages (8)
  ├── Theorists (30+) — mapped per stage
  ├── Models (20+) — mapped per stage
  ├── Figures (100+) — mapped per stage + culture
  ├── Films (50+) — mapped per stage
  ├── Myths (30+) — mapped per stage
  ├── Cycles (6) — parallel to stages
  ├── Steel Process (7) — parallel to stages
  └── Synthesis — connects all layers per stage

Planets (7)
  ├── Metals — 1:1
  ├── Days — 1:1
  ├── Deities — many per planet, per culture
  ├── Zodiac Signs — ruler relationship (planet rules sign)
  ├── Elements — via zodiac (sign belongs to element)
  ├── Body Parts — chakra, organ
  ├── Archetypes — per planet
  └── Artists — per planet

Zodiac (12)
  ├── Element (4) — each sign belongs to one
  ├── Planet ruler — each sign has one
  ├── Cardinal (4) — equinox/solstice markers
  └── Calendar Month — loose association

Journeys (9)
  ├── Stages — from journeyDefs or yellowBrickRoad
  ├── Challenge Mode — wheel (1 level) or cosmic (3 levels)
  └── Completion Element — tracked in coursework

Courses (11)
  ├── Requirements — element, count, time, group_all, group_pct, atlas
  └── Completion → unlocks Ranks + Credentials
```

---

## Invariants (Must Hold True)

1. **8 monomyth stages.** IDs are: golden-age, falling-star, impact-crater, forge, quenching, integration, drawing, new-age. This set cannot change without a major version bump.

2. **7 classical planets.** Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn. This set cannot change.

3. **12 zodiac signs.** The standard 12. This set cannot change.

4. **4 elements.** Fire, Earth, Air, Water. This set cannot change.

5. **4 cardinal directions.** Vernal equinox, summer solstice, autumnal equinox, winter solstice. This set cannot change.

6. **Journey completion elements follow pattern `journeys.{id}.completed`.** Tested.

7. **Course requirement types are one of: element, count, time, group_all, group_pct, atlas.** Tested.

8. **Element tracking IDs use dot-path convention.** E.g., `monomyth.theorists.forge.campbell`. Not currently tested beyond coursework.

9. **Pantheons are per-culture, never merged into a single table.** Cross-cultural connections go through planet-deity mappings.

10. **Naming convention: "Chronosphaera" not "metals" or "seven-metals."** Tracked in MEMORY.md, should be enforced in CI grep.

---

## Migration Rules

When this spec changes:

1. Bump version number (v1.0 → v1.1 for additions, v2.0 for breaking changes)
2. Document what changed and why
3. Update all tests that enforce the changed invariant
4. Update system_enforcement_map.md
5. If entity shape changes: update data files, API handlers, and any components that consume the entity
6. If entity count changes (e.g., adding a planet): update all arrays/constants that enumerate the set
7. Never change canonical data shape without updating this spec first

---

*This is the ontology. Everything flows from here.*
