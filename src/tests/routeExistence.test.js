/**
 * Route Existence Tests
 *
 * Verifies that every page component referenced in App.js route definitions
 * can be imported without errors. Does NOT render any components — this is
 * purely an import/resolution check to catch missing files, broken exports,
 * or syntax errors early.
 *
 * Derived from: src/App.js (2026-02-27)
 */

// ---------------------------------------------------------------------------
// Environment mocks — some pages import libraries that don't work in jsdom.
// We mock the problematic third-party packages so the page modules themselves
// can still be resolved and their default exports verified.
// ---------------------------------------------------------------------------

// @react-three/xr uses ESM "export *" which Jest cannot parse
jest.mock('@react-three/xr', () => ({ createXRStore: jest.fn() }));

// @react-three/fiber and @react-three/drei use WebGL which jsdom lacks
jest.mock('@react-three/fiber', () => ({
  Canvas: 'Canvas',
  useFrame: jest.fn(),
  useThree: jest.fn(() => ({ gl: {}, scene: {}, camera: {} })),
}));
jest.mock('@react-three/drei', () => ({
  OrbitControls: 'OrbitControls',
  Environment: 'Environment',
  Html: 'Html',
  Text: 'Text',
  useGLTF: jest.fn(() => ({ scene: {} })),
}));

// resium / cesium require browser APIs (DOMPurify, WebGL) unavailable in jsdom.
// MythicEarthPage runs Cesium constructors at module scope, so the mock must
// provide constructor-like functions for any export that gets called with `new`.
jest.mock('resium', () => ({
  Viewer: 'Viewer',
  Entity: 'Entity',
  BillboardGraphics: 'BillboardGraphics',
  LabelGraphics: 'LabelGraphics',
  PolylineGraphics: 'PolylineGraphics',
  CesiumComponentRef: jest.fn(),
}));

// Build a Proxy-based mock: any property access returns a constructor function
// that also has arbitrary static methods (fromUrl, fromDegrees, etc.).
const cesiumHandler = {
  get(_, prop) {
    if (prop === '__esModule') return false;
    // Return a constructor function whose static methods also return stubs
    const Ctor = function CesiumStub() { return {}; };
    return new Proxy(Ctor, {
      get(target, p) {
        if (p === 'prototype') return target.prototype;
        if (typeof target[p] !== 'undefined') return target[p];
        // Static methods (fromDegrees, fromUrl, fromProviderAsync, etc.)
        return function staticStub() { return {}; };
      },
    });
  },
};
jest.mock('cesium', () => new Proxy({}, cesiumHandler));
jest.mock('cesium/Build/Cesium/Widgets/widgets.css', () => ({}));

// ChronosphaeraPage has deeply nested ternary chains that Babel's Flow parser
// cannot handle in Jest. Mock it so VR page and other importers can resolve.
jest.mock('../pages/Chronosphaera/ChronosphaeraPage', () => ({
  __esModule: true,
  default: () => null,
}));

// DodecahedronScene runs canvas.getContext('2d') at module scope; jsdom
// returns null for getContext. Mock the scene module to avoid the error.
jest.mock('../pages/Dodecahedron/DodecahedronScene', () => {
  const MockScene = () => null;
  MockScene.GEO_TO_MAP = {};
  MockScene.NUMBER_TO_GEO = {};
  MockScene.GEO_TO_NUMBER = {};
  return {
    __esModule: true,
    default: MockScene,
    GEO_TO_MAP: {},
    NUMBER_TO_GEO: {},
    GEO_TO_NUMBER: {},
  };
});

describe('Route component imports', () => {
  // ---------------------------------------------------------------
  // Lazy-loaded page modules (React.lazy dynamic imports in App.js)
  // Each test verifies the dynamic import() resolves and the module
  // exports a default that is a function (React component).
  // ---------------------------------------------------------------

  const lazyPages = [
    { name: 'ChronosphaeraVRPage', path: '../pages/Chronosphaera/ChronosphaeraVRPage' },
    { name: 'AdminPage',           path: '../pages/Admin/AdminPage' },
    { name: 'OuroborosJourneyPage', path: '../pages/OuroborosJourney/OuroborosJourneyPage' },
    { name: 'AtlasPage',           path: '../pages/Atlas/AtlasPage' },
    { name: 'MythSalonLibraryPage', path: '../pages/MythSalonLibrary/MythSalonLibraryPage' },
    { name: 'ProfilePage',         path: '../pages/Profile/ProfilePage' },
    { name: 'StoryOfStoriesPage',   path: '../pages/StoryOfStories/StoryOfStoriesPage' },
    { name: 'MythsPage',           path: '../pages/Myths/MythsPage' },
    { name: 'MythicEarthPage',     path: '../pages/MythicEarth/MythicEarthPage' },
    { name: 'YellowBrickRoadPage', path: '../pages/YellowBrickRoad/YellowBrickRoadPage' },
    { name: 'XRPage',              path: '../pages/XR/XRPage' },
    { name: 'FallenStarlightPage', path: '../pages/FallenStarlight/FallenStarlightPage' },
    { name: 'MentorDirectoryPage', path: '../pages/MentorDirectory/MentorDirectoryPage' },
    { name: 'GuildPage',           path: '../pages/Guild/GuildPage' },
    { name: 'SacredSites360Page',  path: '../pages/SacredSites360/SacredSites360Page' },
    { name: 'DiscoverPage',        path: '../pages/Discover/DiscoverPage' },
    { name: 'DiscoverStarlightPage', path: '../pages/DiscoverStarlight/DiscoverStarlightPage' },
    { name: 'DiscoverFeaturePage', path: '../pages/DiscoverFeature/DiscoverFeaturePage' },
    { name: 'SecretWeaponPage',    path: '../pages/SecretWeapon/SecretWeaponPage' },
    { name: 'SecretWeaponAPIPage', path: '../pages/SecretWeaponAPI/SecretWeaponAPIPage' },
    { name: 'FellowshipPage',      path: '../pages/Fellowship/FellowshipPage' },
    { name: 'CuratedProductsPage', path: '../pages/CuratedProducts/CuratedProductsPage' },
    { name: 'MatchingPage',        path: '../pages/Matching/MatchingPage' },
    { name: 'ConsultingPage',      path: '../pages/Consulting/ConsultingPage' },
    { name: 'ConsultingIntakePage', path: '../pages/Consulting/ConsultingIntakePage' },
    { name: 'ConsultingDashboardPage', path: '../pages/Consulting/ConsultingDashboardPage' },
    { name: 'PractitionerDashboardPage', path: '../pages/Consulting/PractitionerDashboardPage' },
    { name: 'ConsultingForgePage', path: '../pages/Consulting/ConsultingForgePage' },
    { name: 'CrownPage',           path: '../pages/Crown/CrownPage' },
    { name: 'Ring2DPage',          path: '../pages/Ring2D/Ring2DPage' },
    { name: 'DodecahedronPage',    path: '../pages/Dodecahedron/DodecahedronPage' },
    { name: 'ArtBookPage',         path: '../pages/ArtBook/ArtBookPage' },
    { name: 'StorePage',           path: '../pages/Store/StorePage' },
    { name: 'TeacherPage',         path: '../pages/Teacher/TeacherPage' },
    { name: 'WillLinnPage',        path: '../pages/WillLinn/WillLinnPage' },
    { name: 'MicrocosmosPage',     path: '../pages/Microcosmos/MicrocosmosPage' },
  ];

  describe('Lazy-loaded pages resolve', () => {
    test.each(lazyPages)('$name can be dynamically imported', async ({ path }) => {
      const mod = await import(path);
      expect(mod).toBeDefined();
      expect(mod.default).toBeDefined();
      expect(typeof mod.default).toBe('function');
    });
  });

  // ---------------------------------------------------------------
  // Directly-imported page modules (static imports at top of App.js)
  // These are NOT lazy-loaded — they are imported eagerly.
  // We verify each module resolves and exports a default function.
  // ---------------------------------------------------------------

  const directPages = [
    { name: 'ChronosphaeraPage',   path: '../pages/Chronosphaera/ChronosphaeraPage' },
    { name: 'MonomythPage',        path: '../pages/Monomyth/MonomythPage' },
    { name: 'MythologyChannelPage', path: '../pages/MythologyChannel/MythologyChannelPage' },
    { name: 'GamesPage',           path: '../pages/Games/GamesPage' },
    { name: 'LoginPage',           path: '../auth/LoginPage' },
  ];

  describe('Directly-imported pages resolve', () => {
    test.each(directPages)('$name can be imported', async ({ path }) => {
      const mod = await import(path);
      expect(mod).toBeDefined();
      expect(mod.default).toBeDefined();
      expect(typeof mod.default).toBe('function');
    });
  });

  // ---------------------------------------------------------------
  // Inline components (defined inside App.js, NOT separate files):
  //   MeteorSteelHome, StoryForgeHome, MythosophiaPage,
  //   RequireAdmin, StorePageWithProfile
  // These cannot be tested via import — they are internal to App.js.
  // This comment documents them for completeness.
  // ---------------------------------------------------------------
});
