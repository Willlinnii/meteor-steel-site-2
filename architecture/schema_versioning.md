# Schema Versioning & Migration Strategy

> How the Mythouse data schema evolves without breaking what already exists.
>
> Version: 1.0
> Date: 2026-02-27

---

## 1. Current State (v1.0)

The baseline schema is defined in `architecture/ontology_spec_v1.md` (version 1.0, dated 2026-02-27). It establishes:

- **Narrative spine**: 8 monomyth stages, 30+ theorists, 20+ models, 100+ figures, 6 cycles, 50+ films, 30+ myths, synthesis, steel process
- **Cosmological structure**: 7 planets, 12 zodiac signs, 4 elements, 4 cardinal directions, 88 constellations, 12 calendar months, medicine wheels, day/night polarity
- **Enrichment files**: 11 planet-extension files (deities, archetypes, artists, etc.)
- **Pantheons**: 78 per-culture tradition files
- **Content**: Fallen Starlight, Story of Stories, Mythology Channel, sacred sites, libraries, temples, treasures
- **Product structure**: 9 journey definitions, 26 YBR stops, 11 courses, 7 ranks, 8 credential categories, 20+ Stripe products, 3 API tiers, 5 mentor types
- **User data (Firestore)**: Progress tracking via dot-path element IDs, writings, story cards, certificates, teacher courses, guild/feed/fellowship posts

This is the schema everything is built against. All tests in `dataIntegrity.test.js`, `courseEngine.test.js`, and `journeyDefs.test.js` validate v1.0 invariants.

---

## 2. Version Numbering

The schema follows semantic versioning: **MAJOR.MINOR.PATCH**

### MAJOR (v1.0 -> v2.0)

A breaking change to canonical structure. Triggers a full migration cycle.

Examples:
- Adding a 9th monomyth stage or removing one
- Adding an 8th planet (e.g., Uranus/Neptune/Pluto)
- Renaming entity IDs (e.g., `golden-age` -> `paradise`)
- Removing required fields from existing entities
- Changing the element ID dot-path convention
- Changing the structure of Firestore user data documents
- Altering entity relationships (e.g., changing which planet rules which sign)

### MINOR (v1.0 -> v1.1)

An additive, non-breaking change. Existing data and code continues to work unchanged.

Examples:
- Adding a new optional field to planets (e.g., `modernAssociation`)
- Adding a new enrichment file (e.g., `chronosphaeraMusic.json`)
- Adding a new pantheon file (79th tradition)
- Adding a new journey definition (10th journey)
- Adding a new course to `courseEngine.js`
- Adding a new requirement type alongside existing ones
- Adding new figures, theorists, or films to existing stage mappings

### PATCH (v1.0 -> v1.0.1)

Content-only changes within existing structure. No schema impact.

Examples:
- Fixing a typo in a deity description
- Updating text in Fallen Starlight chapters
- Correcting GPS coordinates for a sacred site
- Editing a theorist bio
- Updating episode scripts in Mythology Channel data

---

## 3. Migration Rules

### MAJOR Changes

1. **Propose before implementing.** Per CLAUDE.md rule #1: "No silent schema changes. If a change affects entity structure, propose it first. Reference the ontology spec." AI must propose, human must approve.
2. **Create a new spec version.** `ontology_spec_v1.md` stays as historical record. Create `ontology_spec_v2.md` with all changes documented.
3. **Update `dataIntegrity.test.js`.** Every count assertion, field shape check, and ID set validation must reflect the new schema. The test file is the executable contract.
4. **Update `system_enforcement_map.md`.** Section 4 (Tests and What They Protect) must reflect any new or changed test coverage.
5. **Update `courseEngine.js` constants.** If canonical sets change (stages, planets, zodiac, etc.), update `ALL_STAGES`, `PLANETS`, `ZODIAC_SIGNS`, `CARDINAL_POINTS` and all derived element ID patterns.
6. **Assess Firestore user data impact.** See Section 6 below. Element ID renames require a migration script.
7. **Update CLAUDE.md** if governance rules or architecture references change.
8. **Run full test suite.** All 516+ tests must pass before the change ships.

### MINOR Changes

1. **Update the current spec in-place.** Increment the minor version in the existing `ontology_spec_v1.md` header (e.g., v1.0 -> v1.1).
2. **Add tests for new structure.** New entities or fields should get corresponding assertions in `dataIntegrity.test.js`.
3. **No Firestore migration needed.** Additive changes do not affect existing user data.
4. **Update `system_enforcement_map.md`** if new tests or runtime checks are added.

### PATCH Changes

1. **No spec updates needed.** Content corrections within existing fields do not affect the schema.
2. **No test updates needed.** Tests validate structure, not content text.
3. **No Firestore impact.** User data references IDs, not content strings.
4. **Log in the change log** (Section 5) for traceability.

---

## 4. Protected Invariants

These values are locked at v1.0. Changing any of them constitutes a MAJOR version bump.

### 8 Monomyth Stage IDs (ordered)

```
golden-age, falling-star, impact-crater, forge, quenching, integration, drawing, new-age
```

Enforced by: `dataIntegrity.test.js` ("stage IDs match expected set"), `courseEngine.js` (`ALL_STAGES` constant), `courseEngine.test.js` (requirement element patterns).

### 7 Planet IDs

```
Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn
```

Enforced by: `dataIntegrity.test.js` ("planet names match the expected set"), `courseEngine.js` (`PLANETS` constant).

### 12 Zodiac Sign IDs and Their Element/Modality Assignments

```
Aries, Taurus, Gemini, Cancer, Leo, Virgo, Libra, Scorpio, Sagittarius, Capricorn, Aquarius, Pisces
```

Each sign's element (Fire/Earth/Air/Water) and planetary ruler are fixed. Enforced by: `dataIntegrity.test.js` ("all 12 standard zodiac names present", "each sign has sign and element").

### 4 Element IDs

```
Fire, Earth, Air, Water
```

Enforced by: `dataIntegrity.test.js` ("4 elements").

### 4 Cardinal Direction IDs

```
vernal-equinox, summer-solstice, autumnal-equinox, winter-solstice
```

Enforced by: `dataIntegrity.test.js` ("4 cardinal directions"), `courseEngine.js` (`CARDINAL_POINTS` constant).

### Naming Convention

"Chronosphaera" is the canonical name. Not "metals," not "seven-metals," not "Seven Metals." This rename is complete and permanent. Referenced in CLAUDE.md rule #6 and MEMORY.md.

### Element ID Dot-Path Convention

Element tracking IDs use the format `section.subsection.stage.item` (dot-separated). Examples:

```
monomyth.overview.golden-age
monomyth.theorists.forge.campbell
chronosphaera.planet.Sun
games.senet.completed
journeys.monomyth.completed
atlas.messages.voice.saturn
```

Changing this convention affects every Firestore progress document and every course requirement definition.

---

## 5. Change Log

### v1.0.0 (2026-02-27)

- Category: MAJOR (initial release)
- Change: Baseline schema established. Ontology spec, enforcement map, data integrity tests, and UI contract created.
- Files affected: `architecture/ontology_spec_v1.md`, `architecture/system_enforcement_map.md`, `architecture/ui_contract.json`, `src/tests/dataIntegrity.test.js`
- Tests updated: Yes (516+ tests across all suites)
- Spec updated: Yes (v1.0 created)

---

### Template for Future Entries

```
## vX.Y.Z (YYYY-MM-DD)
- Category: [MAJOR|MINOR|PATCH]
- Change: [description]
- Files affected: [list]
- Tests updated: [yes/no]
- Spec updated: [yes/no]
- Firestore migration: [not needed | script at path | manual steps described]
- Breaking: [yes/no — if yes, describe what breaks]
```

---

## 6. Firestore Migration Notes

### How User Data References the Schema

User progress is stored in Firestore at `users/{uid}/progress/{sectionId}`, where each document contains an `elements` map. The keys in this map are dot-path element IDs defined in `courseEngine.js`:

```
users/abc123/progress/monomyth
  elements: {
    "monomyth.overview.golden-age": { visited: true, ts: ... },
    "monomyth.theorists.forge.campbell": { visited: true, ts: ... }
  }

users/abc123/progress/chronosphaera
  elements: {
    "chronosphaera.planet.Sun": { visited: true, ts: ... }
  }

users/abc123/progress/journeys
  elements: {
    "journeys.monomyth.completed": { visited: true, ts: ... }
  }
```

### Why ID Renames Are Dangerous

If a monomyth stage ID changes from `golden-age` to `paradise`, every element ID containing `golden-age` in every user's progress document becomes orphaned. The user's tracked progress silently disappears. Course completion checks that look for the new ID find nothing. Certificates earned under the old IDs become unverifiable.

This is the single biggest reason entity ID changes require a MAJOR version bump.

### Migration Approach for MAJOR Changes

If a MAJOR change is approved that affects element IDs:

1. **Write a migration script** (Node.js, run once) that:
   - Queries all `users/{uid}/progress/{sectionId}` documents
   - Remaps old element IDs to new element IDs in the `elements` map
   - Writes back the updated documents
   - Logs all changes for audit
2. **Run the script in a staging Firestore** first.
3. **Back up production Firestore** before running against production.
4. **Update `courseEngine.js`** requirement definitions to reference the new IDs.
5. **Update all tracking calls** in page components that emit the old IDs.
6. **Deploy code and run migration in sequence** — the new code must not go live until the migration completes, otherwise users see broken progress.

### Other User Data Affected by Schema Changes

| Collection | What References Schema | Migration Risk |
|---|---|---|
| `users/{uid}/progress/{sectionId}` | Element IDs (dot-path) | HIGH — ID renames break progress |
| `users/{uid}/meta/certificates` | Course IDs from `courseEngine.js` | MEDIUM — course ID renames orphan certs |
| `users/{uid}/writings/{docId}` | Free-form content, no schema refs | NONE |
| `users/{uid}/story-cards/{cardId}` | May reference stage or planet names | LOW — display-only |
| `users/{uid}/teacher-courses/{courseId}` | Course structure references | MEDIUM — depends on what changes |
| `guild-posts/{postId}` | Free-form content | NONE |
| `feed/{postId}` | Free-form content | NONE |

### Additive Changes (MINOR) and Firestore

Adding new element IDs, new courses, or new journey types requires no Firestore migration. New tracking simply begins accumulating in user progress documents alongside existing data. Old progress remains valid.

---

*Schema changes are the highest-risk operation in the system. When in doubt, add — do not rename or remove.*
