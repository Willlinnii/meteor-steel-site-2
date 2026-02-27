# System Enforcement Map

> What is protected. What is not. No invisible rules.
>
> Last updated: 2026-02-27

---

## 1. Schema Constraints

### Firestore Rules (`firestore.rules`)

| Collection | Read | Write | Key Constraints |
|---|---|---|---|
| `users/{uid}/progress/{sectionId}` | Owner | Owner | Element tracking — dot-path IDs |
| `users/{uid}/meta/profile` | Owner, Admin | Owner | Profile, subscriptions, natal data |
| `users/{uid}/meta/secrets` | Owner | Owner | BYOK API keys — never public |
| `users/{uid}/meta/certificates` | Owner | Owner | Course completions |
| `users/{uid}/writings/{docId}` | Owner | Owner | User writings |
| `users/{uid}/story-cards/{cardId}` | All auth | Owner | Story cards |
| `users/{uid}/teacher-courses/{courseId}` | Owner | Owner | Teacher syllabi |
| `site-users/{userId}` | Admin | Never (server only) | User registry |
| `api-keys/{keyHash}` | Never | Never | Server-only |
| `handles/{handle}` | All auth | Never (server only) | Unique handle registry |
| `matches/{matchId}` | Players in `playerUids` | Players only (update) | Multiplayer games |
| `mentor-applications/{appId}` | Admin | Never (server only) | Mentor applications |
| `mentor-directory/{mentorId}` | All auth | Never (server only) | Mentor listings |
| `mentor-pairings/{pairingId}` | Mentor, Student, Admin | Never (server only) | Mentor-student pairs |
| `consulting-requests/{requestId}` | Consultant, Requester, Admin | Never (server only) | Consulting requests |
| `consulting-engagements/{engagementId}` | Client, Practitioner, Admin | Never (server only) | Engagements + sessions |
| `guild-posts/{postId}` | All auth | Never (server only) | Forum posts |
| `feed/{postId}` | All auth | Author (create/update/delete) | Social feed |
| `match-profiles/{userId}` | Owner | Owner | Matching profiles |
| `match-requests/{requestId}` | Sender, Recipient | Sender (create), Recipient (update) | Match requests |
| `match-conversations/{conversationId}` | Participants | Participants | DMs |
| `fellowship-posts/{postId}` | All auth | Author | Fellowship shares |
| `families/{familyId}` | Members | Members | Family groups |
| `friendGroups/{groupId}` | Members | Members | Friend groups |
| `curatedProducts/{productId}` | All auth | Admin or approved curator | Curated products |

### Storage Rules (`storage.rules`)

| Path | Max Size | Allowed Types | Access |
|---|---|---|---|
| `mentor-docs/{userId}/*` | 10MB | PDF, JPEG, PNG, WebP | Owner, Admin |
| `profile-photos/{userId}/*` | 5MB | JPEG, PNG, WebP | All auth (read) |
| `guild-images/{userId}/*` | 5MB | JPEG, PNG, WebP | All auth (read) |

**Status: ENFORCED** — Firestore and Storage rules are deployed and active.

---

## 2. Validation Rules (Runtime)

### Server-Side (API endpoints)

| Rule | File | Enforcement |
|---|---|---|
| Auth token required for all mentor/guild/consulting actions | `api/mentor.js`, `api/guild.js`, `api/consulting.js` | 401 returned |
| Admin email check for approve/reject | `api/mentor.js:109` | 403 returned |
| Handle format: `/^[a-zA-Z0-9_-]{3,20}$/` | `api/user-actions.js:16` | 400 returned |
| Bio max length: 500 chars | `api/mentor.js:409` | 400 returned |
| Mentor capacity: 1-20 | `api/mentor.js:428` | 400 returned |
| Guild post title max: 200 chars | `api/mentor.js:22` | Validated |
| Guild post body max: 10,000 chars | `api/mentor.js:23` | Validated |
| Guild max images: 4 | `api/mentor.js:24` | Validated |
| Syllabus text min: 50 chars | `api/mentor.js` (teacher handler) | 400 returned |
| TTS max chars: 290 | `api/tts.js` | Enforced |
| Chat rate limit: 10 req/min | `api/chat.js:36-37` | 429 returned |
| Consulting types: character, narrative, coaching, media, adventure | `api/mentor.js:19` | Set validation |
| Valid action routing in mentor.js | `api/mentor.js:89` | 400 for unknown actions |
| API key format validation | `api/_lib/apiKeyAuth.js` | 401/403 returned |
| Tier-based endpoint access | `api/_lib/tierConfig.js` | 403 for insufficient tier |

### Client-Side

| Rule | File | Enforcement |
|---|---|---|
| Profile photo max: 5MB, max dimension: 400px | `src/profile/photoUpload.js` | Client-side reject |
| Mentor doc max: 10MB | `src/profile/mentorUpload.js` | Client-side reject |
| Media 360 image max: 20MB, video max: 100MB | `src/lib/media360Upload.js` | Client-side reject |
| Feed images max: 4, each max 5MB | `src/pages/Feed/FeedPage.js` | Client-side reject |
| Conversation history max: 200 messages | `src/writings/WritingsContext.js` | Trimmed |
| Guild reply nesting max: 3 levels | `src/pages/Guild/GuildForum.js` | UI prevents deeper nesting |

**Status: ENFORCED** — Server-side validation is active. Client-side is advisory (can be bypassed).

---

## 3. Runtime Checks (Business Logic)

| Check | File | What It Protects |
|---|---|---|
| Mentor eligibility: credential level >= 2 | `src/profile/mentorEngine.js:83` | Only qualified users can apply |
| Required mentor courses: monomyth-explorer, celestial-clocks-explorer, atlas-conversationalist | `api/mentor.js:24`, `api/guild.js:32-36` | Mentor activation + guild posting |
| Consulting engagement stages follow client-type template | `api/mentor.js:27-67` | Stage structure integrity |
| Bundle expansion: master-key → all subs, starlight-bundle → both books | `api/_lib/stripeProducts.js:121-129` | Purchase entitlements |
| Course requirement types validated: element, count, time, group_all, group_pct, atlas | `src/coursework/courseEngine.js:331-361` | Progress tracking |
| Pairing capacity check: mentor at capacity → reject | `api/mentor.js:612` | Prevents over-assignment |
| Duplicate pairing check | `api/mentor.js:561-568` | One active pairing per pair |
| Match player verification | `firestore.rules` | Only players can access match data |

**Status: ENFORCED** — These are in code and active.

---

## 4. Tests and What They Protect

### `src/coursework/courseEngine.test.js` (29 tests)

| Test Group | What It Protects |
|---|---|
| COURSES data integrity (4 tests) | Unique IDs, required fields (name, description, requirements), valid requirement types |
| checkRequirement (10 tests) | Element/count/time/group_all/group_pct/atlas requirement evaluation logic |
| requirementProgress (3 tests) | Progress fraction calculation per requirement type |
| Course-level helpers (5 tests) | Course completion (all requirements met), progress averaging, incomplete requirement detection |
| Utility functions (2 tests) | Element collection across progress, active course filtering |

### `src/data/journeyDefs.test.js` (14 tests)

| Test Group | What It Protects |
|---|---|
| Structural integrity (5 tests) | Non-empty defs, key=id match, required fields present, unique completionElements, completionElement pattern |
| Journey stages (4 tests) | Non-empty stage arrays, stage id+label present, unique stage IDs within journey, cosmic null stages |
| Challenge modes (3 tests) | Valid mode values (wheel/cosmic), cosmic=3 levels, wheel=1 level |
| Intro/completion text (2 tests) | Every journey has intro array + completion string |

### `src/tests/dataIntegrity.test.js` (292 tests)

| Test Group | What It Protects |
|---|---|
| Canonical entity counts (10 tests) | 7 planets, 12 zodiac, 4 elements, 4 cardinals, 8 monomyth, 88 constellations, 26 YBR, 12 calendar, library, medicine wheels |
| Planet data integrity (6 tests) | Required fields, planet name set, unique metals |
| Zodiac data integrity (2 tests) | Sign/element fields, standard 12 names |
| Monomyth data integrity (2 tests) | Stage IDs match expected set, each value is string |
| Sacred sites (2 tests) | 200+ entries, name + coordinates per site |
| Pantheon files (234 tests) | 78 files discovered, valid JSON, 3+ deities, name fields (78 files × 3 checks) |
| Figures (4 tests) | Array with 10+ figures, name/id fields, 8 stage keys per figure |
| Octave pattern integrity (14 tests) | steelProcess 8 keys, synthesis 8 keys, stageOverviews 8+1 keys, psychles 8 keys, fallenStarlight titles/chapters 8 keys each, 6 cycles with 8 stages each, 20+ models with 8 stages each, required fields and non-empty strings |
| Heptad pattern integrity (7 tests) | 7 unique metals, days, sins, virtues, chakras, organs; every planet has body.chakra + body.organ |
| Journey pattern integrity (5 tests) | 6 journeys have 8 stops, planetary has 7, zodiac has 12, cosmic uses YBR (26), 9 total definitions |

### `src/tests/apiHandlers.test.js` (49 tests)

| Test Group | What It Protects |
|---|---|
| Stripe products integrity | Product definitions, pricing, bundle expansion |
| Tier config integrity | API tier definitions, endpoint access |
| Content index | Content routing and discovery |
| Mentor action routing | Valid action dispatch, unknown action rejection |

### `src/tests/routeExistence.test.js` (41 tests)

| Test Group | What It Protects |
|---|---|
| Lazy-loaded page imports (41 tests) | Every lazy-loaded route component can be dynamically imported without error |

### `src/tests/featureExistence.test.js` (181 tests)

| Test Group | What It Protects |
|---|---|
| Core page modules exist (37 + 37 + 37 tests) | Every page directory exists on disk; every page module can be required and resolves |
| Core shared components exist (15 tests) | ChatPanel, CircleNav, OrbitalDiagram, MetalDetailPanel, RingButton — file exists, can be required, exports default |
| Core contexts exist (12 tests) | AuthContext, ProfileContext, CourseworkContext, WritingsContext — file exists, can be required, exports provider + hook |
| Layout structure integrity (10 tests) | SiteHeader, SiteNav, SiteFooter defined with correct HTML elements and CSS classes; ErrorBoundary wraps Routes; layout order enforced (header → nav → boundary → footer); ChatPanel included |

### Runtime schema validation (13 schemas)

| Schema | File Validated | Enforcement |
|---|---|---|
| planets, zodiac, monomyth, elements, cardinals, figures | Core ontology entities | Dev-mode console warnings via `validateCanonicalData.js` |
| steelProcess, synthesis, stageOverviews, psychles, fallenStarlight, cycles, models | Octave pattern files | Dev-mode console warnings via `validateCanonicalData.js` |

**Total: 606 tests across 6 suites + 13 runtime schemas**

**Status: ENFORCED in CI** — GitHub Actions runs all tests on push/PR to main. Pre-commit hooks (lint-staged) run related tests on staged files.

---

## 5. Build-Time Enforcement

| Check | How | Status |
|---|---|---|
| Tests pass | GitHub Actions CI (`.github/workflows/ci.yml`) | **ENFORCED** |
| ESLint (react-app preset) | Runs during `npm run build` via react-scripts | **ENFORCED** (errors fail build) |
| Build completes | Vercel deployment fails if build fails | **ENFORCED** |
| Pre-commit hooks (lint-staged) | Runs ESLint + related tests on staged files | **ENFORCED** |
| Runtime schema validation | 13 schemas checked in dev mode via `validateCanonicalData.js` | **ENFORCED** (dev only) |
| Route integrity | 41 lazy-loaded imports tested in `routeExistence.test.js` | **ENFORCED** |
| Component/context existence | 171 tests in `featureExistence.test.js` | **ENFORCED** |
| TypeScript type checking | No TypeScript in project | **NOT APPLICABLE** |
| UI layout structure | 10 tests verify SiteHeader/SiteNav/SiteFooter/ErrorBoundary/order | **ENFORCED** |

---

## 6. What Is NOT Protected

> These are the gaps. If something goes wrong here, nothing catches it.

| Gap | Risk | Priority |
|---|---|---|
| **UI layout tests are source-level only** | Layout tests verify App.js source text; they don't render the DOM. A CSS change that hides header would not be caught. | LOW |
| **Error boundary is single-layer** | `ErrorBoundary` wraps all routes in App.js, but per-page boundaries would isolate failures better | LOW |
| **Enrichment data files unvalidated** | 13 core schemas validated; ~138 remaining data files (enrichment, content, pantheons) have no runtime shape checks | MEDIUM |
| **Paywall bypass is active** | `hasSubscription()`/`hasPurchase()` return `true` for everyone. | LOW (intentional, but must be restored) |
| **No CSS isolation** | Global class names can collide across pages. 3 pages extracted, rest in App.css. | LOW |
| **No layout component** | Layout defined inline in App.js. No single authority. | LOW (structural debt) |

---

## 7. Rules That Exist Only in Comments/Prompts

> These are rules that ARE NOT enforced by code, tests, or schema. They exist only as human knowledge or AI instructions.

| Rule | Where It Lives | Should Be Enforced By |
|---|---|---|
| "Temporary full-access override — remove when ready" | `ProfileContext.js` comment | Environment variable gate |
| "NEVER say you cannot compute a natal chart" | `api/_lib/engine.js:848` | Prompt engineering only (acceptable) |
| "MUST account for daylight saving time" | `api/chat.js:69` | Comment only — no validation |
| Planet persona tones (Sun=sovereign, Moon=reflective, etc.) | `api/_lib/engine.js:97-104` | Prompt only (acceptable for AI behavior) |
| Navigation links as `[[Label\|/path]]` format | `api/_lib/engine.js` persona rules | Prompt only (acceptable) |
| "Do not break fourth wall about Mythouse/Atlas" | `api/_lib/engine.js` persona rules | Prompt only (acceptable) |
| Writing voice: "Never inflate the author into the hero" | `MEMORY.md` | Advisory only (human editorial) |
| Element ID dot-path convention | `courseEngine.js` comments | Should have schema validation |
| Chronosphaera naming (not "metals" or "seven-metals") | `MEMORY.md` | Should have grep check in CI |

---

*This document is the command dashboard. If it's not listed here, it's not protected.*
