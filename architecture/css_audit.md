# CSS Audit Report

**Date:** 2026-02-27
**Auditor:** Claude (automated)
**Scope:** All CSS files under `src/`

---

## 1. Current State

| Metric | Value |
|--------|-------|
| Total CSS files in `src/` | 51 |
| Total CSS lines (all files) | ~39,108 |
| App.css lines | 7,691 |
| App.css size | ~157 KB |
| Page CSS files | 38 |
| Component CSS files | 12 |
| Auth CSS files | 1 |
| App.css as % of total | ~19.7% |
| Page directories | 48 |
| Pages **with** dedicated CSS | 34 |
| Pages **without** dedicated CSS | 14 |

**Key finding:** App.css is 7,691 lines (157 KB). Per CLAUDE.md rule 3: "No new styles in App.css." The file contains styles for at least 15 distinct features/pages that should be extracted into page-scoped files.

---

## 2. File Inventory

### App.css (7,691 lines)

| Line Range | Section | Lines | Notes |
|-----------|---------|-------|-------|
| 1-14 | `:root` design tokens | 14 | KEEP: Global design tokens |
| 15-28 | Global reset + body | 14 | KEEP: Global baseline |
| 30-61 | `.app` starfield background | 32 | KEEP: Global shell |
| 63-78 | Mythosophia page | 16 | EXTRACT: page-specific |
| 80-112 | Site footer | 33 | KEEP: Global layout component |
| 113-172 | Site header + mobile | 60 | KEEP: Global layout component |
| 174-264 | Site navigation | 91 | KEEP: Global layout component |
| 266-771 | Circle navigation (Home) | 506 | EXTRACT: Home page styles |
| 772-974 | Content area / figure cards | 203 | EXTRACT: Home page content |
| 975-1021 | Figure selector | 47 | EXTRACT: Home page component |
| 1022-1188 | Development panel | 167 | EXTRACT: Home page dev panel |
| 1189-1254 | Meteor shower | 66 | Shared animation - could stay |
| 1256-1315 | Responsive (circle nav) | 60 | EXTRACT: Goes with circle nav |
| 1316-1567 | Story Forge | 252 | EXTRACT: Forge feature |
| 1568-1664 | Story Forge Library | 97 | EXTRACT: Forge feature |
| 1665-1701 | Story Interview Panel | 37 | EXTRACT: Forge feature |
| 1702-1739 | Fallen Starlight chapters | 38 | EXTRACT: FallenStarlight page |
| 1740-1967 | Chat Panel | 228 | MIXED: Global component (used on all pages) |
| 1969-2048 | Persona Chat Panel | 80 | EXTRACT: Chronosphaera component |
| 2049-2123 | Voice toggle + mic | 75 | MIXED: Shared by Chat + Persona |
| 2124-2190 | Fallen Starlight audio | 67 | EXTRACT: FallenStarlight page |
| 2191-2309 | Chapter audio player | 119 | EXTRACT: FallenStarlight page |
| 2310-2364 | Coursework mode toggles | 55 | KEEP: Global feature (header) |
| 2365-2488 | Header toggles (book, XR, store, YBR, forge, 3D) | 124 | KEEP: Global header buttons |
| 2489-2564 | Coursework visual indicators | 76 | KEEP: Global overlay system |
| 2565-2655 | Course completion popup | 91 | KEEP: Global overlay |
| 2656-2809 | Mentor contract popup | 154 | EXTRACT: MentorDirectory feature |
| 2811-3385 | Profile page (basics, courses, certs) | 575 | EXTRACT: Profile page |
| 3386-3460 | Profile: My Story | 75 | EXTRACT: Profile page |
| 3461-3515 | Profile: Social Media Links | 55 | EXTRACT: Profile page |
| 3516-3609 | Profile: AI Settings (BYOK) | 94 | EXTRACT: Profile page |
| 3610-3712 | Profile: Developer API | 103 | EXTRACT: Profile page |
| 3713-3755 | Profile: API Tier Panels | 43 | EXTRACT: Profile page |
| 3756-3781 | Profile: Sign Out | 26 | EXTRACT: Profile page |
| 3782-4027 | Profile: Install App | 246 | EXTRACT: Profile page |
| 4028-4097 | Profile: Rank | 70 | EXTRACT: Profile page |
| 4098-4150 | Profile: Credentials | 53 | EXTRACT: Profile page |
| 4151-4426 | Profile: Subscriptions | 276 | EXTRACT: Profile page |
| 4427-4539 | Subscription Gate Popup | 113 | EXTRACT: Profile/Store feature |
| 4540-4758 | Store Modal | 219 | EXTRACT: Store feature |
| 4759-4802 | Profile: Onboarding | 44 | EXTRACT: Profile page |
| 4803-4897 | Profile: Mentorship | 95 | EXTRACT: Profile page |
| 4898-5702 | Profile: Natal Chart | 805 | EXTRACT: Profile page |
| 5703-5945 | Profile: Live Sky / Transits | 243 | EXTRACT: Profile page |
| 5946-6127 | Profile: Numerology | 182 | EXTRACT: Profile page |
| 6128-6269 | Profile: Embedded Chat | 142 | EXTRACT: Profile page |
| 6271-6563 | Mentor Directory & Pairing | 293 | EXTRACT: MentorDirectory page |
| 6564-6614 | Profile Photo Upload | 51 | EXTRACT: Profile page |
| 6615-7036 | Guild Page (forum, directory) | 422 | EXTRACT: Guild page |
| 7037-7198 | Guild Directory + Consulting | 162 | EXTRACT: Guild page |
| 7199-7279 | Selector Ring | 81 | EXTRACT: Home page component |
| 7281-7479 | Conversational Forge Draft | 199 | EXTRACT: Forge feature |
| 7480-7522 | Forge Controls Row | 43 | EXTRACT: Forge feature |
| 7523-7691 | Protagonism Generator | 169 | EXTRACT: Home page / Forge |

### Page CSS Files (38 files, 29,159 lines)

| File | Lines | Prefix Convention |
|------|-------|-------------------|
| `pages/Admin/AdminPage.css` | 3,315 | `.admin-*` |
| `pages/Admin/ContactsPage.css` | 624 | `.contacts-*` |
| `pages/ArtBook/ArtBookPage.css` | 347 | `.artbook-*` |
| `pages/Atlas/AtlasPage.css` | 348 | `.atlas-*` |
| `pages/Chronosphaera/ChronosphaeraPage.css` | 3,748 | `.chrono-*` |
| `pages/Consulting/ConsultingDashboardPage.css` | 394 | `.consulting-*` |
| `pages/Consulting/ConsultingPage.css` | 286 | `.consulting-*` |
| `pages/Crown/CrownPage.css` | 356 | `.crown-*` |
| `pages/CuratedProducts/CuratedProductsPage.css` | 338 | `.curated-*` |
| `pages/Dashboard/DashboardPage.css` | 99 | `.dashboard-*` |
| `pages/Discover/DiscoverPage.css` | 414 | `.discover-*` |
| `pages/DiscoverFeature/DiscoverFeaturePage.css` | 534 | `.discover-feature-*` |
| `pages/DiscoverStarlight/DiscoverStarlightPage.css` | 372 | `.discover-starlight-*` |
| `pages/Dodecahedron/DodecahedronPage.css` | 991 | `.dodec-*` |
| `pages/Feed/FeedPage.css` | 392 | `.feed-*` |
| `pages/Fellowship/FellowshipPage.css` | 729 | `.fellowship-*` |
| `pages/Games/GamesPage.css` | 3,501 | `.games-*` |
| `pages/Matching/MatchingPage.css` | 633 | `.matching-*` |
| `pages/Microcosmos/MicrocosmosPage.css` | 211 | `.microcosmos-*` |
| `pages/Monomyth/MonomythPage.css` | 298 | `.mono-*` |
| `pages/MythicEarth/MythicEarthPage.css` | 1,440 | `.mythic-earth-*` |
| `pages/MythologyChannel/MythologyChannelPage.css` | 1,035 | `.mythtv-*` |
| `pages/Myths/MythsPage.css` | 3,179 | `.myths-*` |
| `pages/MythSalonLibrary/MythSalonLibraryPage.css` | 635 | `.library-*` |
| `pages/OuroborosJourney/OuroborosJourneyPage.css` | 704 | `.journey-*` |
| `pages/Profile/FriendsSection.css` | 179 | `.friends-*` |
| `pages/Profile/StoryCardDeck.css` | 253 | `.story-card-*` |
| `pages/Profile/StoryMatchingSection.css` | 478 | `.story-matching-*` |
| `pages/Ring2D/Ring2DPage.css` | 127 | `.ring2d-*` |
| `pages/SacredSites360/SacredSites360Page.css` | 294 | `.sacred-*` |
| `pages/SecretWeapon/SecretWeaponPage.css` | 401 | `.secret-weapon-*` |
| `pages/SecretWeaponAPI/SecretWeaponAPIPage.css` | 560 | `.sw-api-*` |
| `pages/StoryOfStories/StoryOfStoriesPage.css` | 184 | `.sos-*` |
| `pages/Teacher/TeacherPage.css` | 754 | `.teacher-*` |
| `pages/Treasures/TreasuresPage.css` | 249 | `.treasures-*` |
| `pages/WillLinn/WillLinnPage.css` | 408 | `.willlinn-*` |
| `pages/XR/XRPage.css` | 153 | `.xr-*` |
| `pages/YellowBrickRoad/YellowBrickRoadPage.css` | 196 | `.ybr-*` |

### Component CSS Files (12 files, 2,258 lines)

| File | Lines | Purpose |
|------|-------|---------|
| `components/chronosphaera/SolarMagneticField.css` | 159 | Solar magnetic field viz |
| `components/chronosphaera/vr/CelestialScene.css` | 630 | VR celestial scene |
| `components/CrossStageModal.css` | 156 | Cross-stage modal overlay |
| `components/DodecahedronButton.css` | 365 | 3D dodecahedron button |
| `components/ErrorBoundary.css` | 94 | Error boundary UI |
| `components/layout/AppLayout.css` | 17 | App layout shell |
| `components/layout/Sidebar.css` | 175 | Sidebar navigation |
| `components/PanoViewer.css` | 41 | 360 panorama viewer |
| `components/RingButton.css` | 66 | Ring button component |
| `components/StageTest.css` | 242 | Stage test component |
| `components/TrailOverlay.css` | 119 | Trail overlay |

### Auth CSS (1 file, 194 lines)

| File | Lines | Purpose |
|------|-------|---------|
| `auth/LoginPage.css` | 194 | Login/auth page |

---

## 3. Compliance Check

### Compliant Pages (have dedicated CSS with page-prefix naming)

These pages follow the "page-scoped CSS with page-prefix naming" rule:

- Admin, ArtBook, Atlas, Chronosphaera, Consulting, Crown, CuratedProducts
- Dashboard, Discover, DiscoverFeature, DiscoverStarlight, Dodecahedron
- Feed, Fellowship, Games, Matching, Microcosmos, Monomyth
- MythicEarth, MythologyChannel, Myths, MythSalonLibrary, OuroborosJourney
- Ring2D, SacredSites360, SecretWeapon, SecretWeaponAPI, StoryOfStories
- Teacher, Treasures, WillLinn, XR, YellowBrickRoad

**Total compliant: 34 page directories**

### Partially Compliant

- **Profile**: Has 3 sub-component CSS files (FriendsSection, StoryCardDeck, StoryMatchingSection) but the main ProfilePage styles (~3,100 lines) live in App.css. **No ProfilePage.css exists.**

---

## 4. Violations

### Pages Dumping Styles into App.css

These pages have **no dedicated CSS file** and their styles are embedded in App.css:

| Page | App.css Section | Approx Lines in App.css |
|------|----------------|------------------------|
| **Profile** | Lines 2811-6269 | ~3,459 (largest offender) |
| **Guild** | Lines 6615-7198 | ~584 |
| **MentorDirectory** | Lines 6271-6563 | ~293 |
| **FallenStarlight** | Lines 1702-1739, 2124-2309 | ~224 |
| **Store** | Lines 4540-4758 | ~219 |
| **Home (CircleNav)** | Lines 266-974, 1256-1315 | ~769 |
| **StoryForge (Home feature)** | Lines 1316-1701, 7281-7522 | ~628 |

### Pages with No CSS at All (using inline styles or App.css classes)

These page directories contain only `.js` files with no `.css`:

| Page Directory | Status |
|---------------|--------|
| `Creations/` | No CSS file |
| `FallenStarlight/` | Styles in App.css |
| `FamilyManage/` | No CSS file |
| `FriendsManage/` | No CSS file |
| `Genealogy/` | No CSS file |
| `Guild/` | Styles in App.css |
| `MentorDirectory/` | Styles in App.css |
| `Store/` | Styles in App.css |
| `StoryBook/` | No CSS file |
| `Traditions/` | No CSS file |
| `Translator/` | No CSS file |
| `Trusts/` | No CSS file |
| `Welcome/` | Uses `styles.js` (inline styles) |
| `Will/` | No CSS file |

---

## 5. Recommendations (Prioritized)

### Priority 1: Extract Profile Styles (~3,459 lines)

**File to create:** `src/pages/Profile/ProfilePage.css`
**Lines to extract:** 2811-6269 (Profile page, natal chart, numerology, embedded chat, mentorship, subscriptions, install app, etc.)
**Impact:** Removes 45% of the extractable content from App.css
**Prefix:** `.profile-*` (already consistently used)
**Risk:** Low -- all selectors already use the `.profile-*` prefix

### Priority 2: Extract Home / CircleNav Styles (~769 lines)

**File to create:** `src/pages/Home/HomePage.css` (or wherever home page lives)
**Lines to extract:** 266-974, 1256-1315, 7199-7279 (circle nav, world zones, stage labels, figure selector, content area, responsive, selector ring)
**Impact:** Removes ~10% of App.css
**Prefix:** `.circle-*`, `.world-*`, `.center-*`, `.stage-*`, `.model-*`, `.direction-*`, `.selector-ring-*`, `.ring-selector-*`
**Risk:** Medium -- some selectors like `.container`, `.section-tab`, `.section-content`, `.content-area`, `.figure-card`, `.figure-name`, `.figure-content`, `.overview-text`, `.empty-content` are generic names that could collide

### Priority 3: Extract Story Forge Styles (~628 lines)

**File to create:** `src/components/StoryForge/StoryForge.css` or `src/pages/Home/StoryForge.css`
**Lines to extract:** 1316-1701, 7281-7522 (forge templates, forge library, story interview, conversational forge draft, forge controls, protagonism generator)
**Impact:** Removes ~8% of App.css
**Prefix:** `.forge-*`, `.protagonism-*` (already consistently used)
**Risk:** Low

### Priority 4: Extract Guild Styles (~584 lines)

**File to create:** `src/pages/Guild/GuildPage.css`
**Lines to extract:** 6615-7198 (guild page, forum, directory, consulting)
**Impact:** Removes ~8% of App.css
**Prefix:** `.guild-*`, `.consulting-*` (already consistently used)
**Risk:** Low

### Priority 5: Extract MentorDirectory Styles (~293 lines)

**File to create:** `src/pages/MentorDirectory/MentorDirectoryPage.css`
**Lines to extract:** 6271-6563 plus 2656-2809 (mentor contract popup)
**Impact:** Removes ~6% of App.css
**Prefix:** `.mentor-*` (already consistently used)
**Risk:** Low -- some mentor styles are also used on Profile page, so keep shared ones in App.css or create a shared component CSS

### Priority 6: Extract Fallen Starlight Styles (~224 lines)

**File to create:** `src/pages/FallenStarlight/FallenStarlightPage.css`
**Lines to extract:** 1702-1739, 2124-2309 (chapter display, audio player, chapter audio)
**Impact:** Removes ~3% of App.css
**Prefix:** `.chapter-*`, `.audio-*`
**Risk:** Low -- but `.audio-play-toggle` is a fixed-position FAB that may be used from multiple pages

### Priority 7: Extract Store Modal Styles (~219 lines)

**File to create:** `src/pages/Store/StorePage.css`
**Lines to extract:** 4540-4758, 4427-4539 (store modal, subscription gate)
**Impact:** Removes ~3% of App.css
**Prefix:** `.store-*`, `.subscription-gate-*`
**Risk:** Medium -- store modal is an overlay triggered from the header, not exclusively a page; may need to remain global or go in a component CSS

### Summary: What Should Stay in App.css After Extraction

After all extractions, App.css should contain only:

| Section | Lines | Purpose |
|---------|-------|---------|
| Design tokens (`:root`) | ~14 | Global CSS variables |
| Global reset (`*`, `body`) | ~14 | Baseline |
| `.app` background | ~32 | App shell |
| Site footer | ~33 | Global layout |
| Site header + mobile | ~60 | Global layout |
| Site navigation | ~91 | Global layout |
| Meteor shower | ~66 | Shared animation |
| Chat Panel | ~228 | Global overlay component |
| Voice toggle / mic | ~75 | Shared by chat panels |
| Coursework toggles + indicators | ~131 | Global feature |
| Header toggles | ~124 | Global header buttons |
| Course completion popup | ~91 | Global overlay |
| XR controls slot | ~25 | Global header |
| **Estimated remaining** | **~984** | Down from 7,691 |

This would reduce App.css by approximately **87%** (from 7,691 to ~984 lines).

---

## 6. Naming Conventions

### Established Page Prefixes

| Page | CSS Prefix | Example |
|------|-----------|---------|
| Chronosphaera | `.chrono-*` | `.chrono-heading`, `.chrono-planet-card` |
| Monomyth | `.mono-*` | `.mono-stage`, `.mono-content` |
| Dodecahedron | `.dodec-*` | `.dodec-face`, `.dodec-viewer` |
| Crown | `.crown-*` | `.crown-page`, `.crown-card` |
| Games | `.games-*` | `.games-page`, `.games-grid` |
| Atlas | `.atlas-*` | `.atlas-page`, `.atlas-voice` |
| Fellowship | `.fellowship-*` | `.fellowship-page`, `.fellowship-feed` |
| Myths | `.myths-*` | `.myths-page`, `.myths-panel` |
| MythologyChannel | `.mythtv-*` | `.mythtv-page`, `.mythtv-show` |
| Profile | `.profile-*` | `.profile-page`, `.profile-avatar` |
| Guild | `.guild-*` | `.guild-page`, `.guild-tab` |
| Store | `.store-*` | `.store-modal-*` |
| Forge | `.forge-*` | `.forge-template-grid`, `.forge-draft-chat` |
| Journey | `.journey-*` | `.journey-page`, `.journey-card` |
| Library | `.library-*` | `.library-page`, `.library-shelf` |

### Prefix Collision Risks

- `.mentor-*` is used by both MentorDirectory and Profile mentorship sections
- `.consulting-*` is used by Consulting page AND Guild consulting section
- `.natal-*` is heavily used (~800 lines) in Profile but has no page prefix

### Recommended New Prefixes for Extraction

| Feature | Suggested Prefix |
|---------|-----------------|
| Home circle nav | `.circlenav-*` (rename from `.circle-*` to avoid ambiguity) |
| Fallen Starlight | `.starlight-*` |
| Protagonism Generator | `.protag-*` |
| Story Interview | `.interview-*` |

---

## 7. Risk Assessment

### `!important` Usage (5 instances)

All in App.css:

| Line | Selector | Risk |
|------|----------|------|
| 170 | `.mobile-menu-trigger` | Low: redundant `display: none !important` (already hidden by default) |
| 2024 | `.persona-chat-send` | Medium: overrides `.chat-send` border-color |
| 2025 | `.persona-chat-send` | Medium: overrides `.chat-send` color |
| 2029 | `.persona-chat-send:hover` | Medium: overrides `.chat-send:hover` background |
| 2030 | `.persona-chat-send:hover` | Medium: overrides `.chat-send:hover` box-shadow |

**Recommendation:** The persona chat `!important` usage (lines 2024-2030) exists because `.persona-chat-send` reuses `.chat-send` base styles but needs different colors. A better approach would be to use a more specific selector chain or a separate class with higher specificity.

### Global / Unscoped Selectors in App.css

| Selector | Line | Risk |
|----------|------|------|
| `*` | 16 | Low: standard reset |
| `body` | 22 | Low: standard baseline |
| `.app` | 30 | Low: top-level container |
| `.container` | 774 | **HIGH**: Generic name, could collide with any library or future component |
| `.section-tab` | 788 | **HIGH**: Generic name used in Home page but not prefixed |
| `.section-content` | 902 | **HIGH**: Generic name, not page-scoped |
| `.content-area` | 908 | **HIGH**: Generic name, not page-scoped |
| `.figure-card` | 916 | Medium: Home-specific but unprefixed |
| `.figure-name` | 926 | Medium: Home-specific but unprefixed |
| `.figure-content` | 935 | Medium: Home-specific but unprefixed |
| `.overview-text` | 946 | Medium: Home-specific but unprefixed |
| `.empty-content` | 968 | Medium: Generic name |
| `.dev-*` | 1022+ | Medium: Development panel, generic prefix |
| `.chapter-title` | 1704 | Medium: Could collide with other "chapter" concepts |
| `.chat-*` | 1740+ | Low: Chat is a global component, reasonable to stay |

### Specificity Concerns

- The home page circle nav styles (`.circle-*`, `.world-*`, `.center-*`, `.stage-*`) use generic class names that should be prefixed when extracted
- `.section-tab`, `.section-content`, `.content-area` are used by the Home page but could easily match other pages' elements
- The forge styles (`.forge-*`) are reasonably scoped but are a Home page feature, not a separate page

### Animation Name Collisions

| Animation | Defined In | Risk |
|-----------|-----------|------|
| `meteor-fall` | App.css:1239 | Low: unique name |
| `dev-pulse` | App.css:1127 | Low: unique name |
| `circle-ybr-pulse` | App.css:754 | Low: unique name |
| `chat-mic-pulse` | App.css:2114 | Low: unique name |
| `cw-fade-in` | App.css:2581 | Medium: reused by multiple sections |
| `cw-panel-in` | App.css:2597 | Medium: reused by multiple sections |
| `cw-star-spin` | App.css:2609 | Low: unique name |
| `cw-shimmer` | App.css:2551 | Low: unique name |
| `sub-details-in` | App.css:4250 | Low: unique name |
| `chineseInfoFade` | App.css:5436 | Low: unique name |
| `spin` | Referenced at 6612 but not defined in App.css | Medium: depends on external definition |
| `xrSlotFadeIn` | App.css:2353 | Low: unique name |

### Dead Code Suspicions

- Lines 63-78 (`.mythosophia-page`, `.mythosophia-iframe`): Appears to be a simple iframe page. Verify if Mythosophia page still exists or if these are dead styles.
- The `.dev-*` panel styles (lines 1022-1188): These are for an Atlas/development chat panel. May be superseded by AtlasPage.css.

---

## Appendix: Extraction Effort Estimate

| Task | Lines to Move | New File | Effort |
|------|--------------|----------|--------|
| Profile extraction | ~3,459 | `ProfilePage.css` | Medium (largest, but cleanly prefixed) |
| Home/CircleNav extraction | ~769 | `HomePage.css` | Medium (needs prefix renaming) |
| StoryForge extraction | ~628 | `StoryForge.css` | Low (cleanly prefixed) |
| Guild extraction | ~584 | `GuildPage.css` | Low (cleanly prefixed) |
| MentorDirectory extraction | ~447 | `MentorDirectoryPage.css` | Low (cleanly prefixed) |
| FallenStarlight extraction | ~224 | `FallenStarlightPage.css` | Low |
| Store extraction | ~219 | `StorePage.css` | Medium (global overlay) |
| Dev panel + Protagonism | ~336 | Part of `HomePage.css` | Low |
| **Total extractable** | **~6,666** | | |
| **Remaining in App.css** | **~1,025** | | |

**Recommended order:** Profile > Guild > StoryForge > MentorDirectory > FallenStarlight > Home/CircleNav > Store

Profile first because it is the single largest block, is cleanly prefixed, and is the most actively developed page. Home/CircleNav is deferred despite its size because the generic selectors need careful renaming to avoid regressions.
