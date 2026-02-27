/**
 * Feature Existence Tests
 *
 * Verifies that all core page directories, their main component files,
 * critical shared components, and context providers still exist and can
 * be resolved. Catches silent deletion or broken moves during refactors.
 *
 * Uses fs.existsSync for file presence and dynamic import() for module
 * resolution — does NOT render any components.
 *
 * Derived from: src/pages/, src/components/, src/auth/, src/profile/,
 *               src/coursework/, src/writings/ (2026-02-27)
 */

const fs = require('fs');
const path = require('path');

const pagesDir = path.resolve(__dirname, '..', 'pages');

// ---------------------------------------------------------------------------
// 1. Core page modules exist
// ---------------------------------------------------------------------------
describe('Core page modules exist', () => {
  // Each entry maps a page directory to its main component file.
  // Convention: DirectoryName/DirectoryNamePage.js (except Welcome → index.js)
  const pageModules = [
    { dir: 'Admin',              file: 'AdminPage.js' },
    { dir: 'ArtBook',            file: 'ArtBookPage.js' },
    { dir: 'Atlas',              file: 'AtlasPage.js' },
    { dir: 'Chronosphaera',      file: 'ChronosphaeraPage.js' },
    { dir: 'Consulting',         file: 'ConsultingPage.js' },
    { dir: 'Creations',          file: 'CreationsPage.js' },
    { dir: 'Crown',              file: 'CrownPage.js' },
    { dir: 'CuratedProducts',    file: 'CuratedProductsPage.js' },
    { dir: 'Dashboard',          file: 'DashboardPage.js' },
    { dir: 'Discover',           file: 'DiscoverPage.js' },
    { dir: 'DiscoverFeature',    file: 'DiscoverFeaturePage.js' },
    { dir: 'DiscoverStarlight',  file: 'DiscoverStarlightPage.js' },
    { dir: 'Dodecahedron',       file: 'DodecahedronPage.js' },
    { dir: 'FallenStarlight',    file: 'FallenStarlightPage.js' },
    { dir: 'FamilyManage',       file: 'FamilyManagePage.js' },
    { dir: 'Feed',               file: 'FeedPage.js' },
    { dir: 'Fellowship',         file: 'FellowshipPage.js' },
    { dir: 'FriendsManage',      file: 'FriendsManagePage.js' },
    { dir: 'Games',              file: 'GamesPage.js' },
    { dir: 'Genealogy',          file: 'GenealogyPage.js' },
    { dir: 'Guild',              file: 'GuildPage.js' },
    { dir: 'Matching',           file: 'MatchingPage.js' },
    { dir: 'MentorDirectory',    file: 'MentorDirectoryPage.js' },
    { dir: 'Microcosmos',        file: 'MicrocosmosPage.js' },
    { dir: 'Monomyth',           file: 'MonomythPage.js' },
    { dir: 'MythicEarth',        file: 'MythicEarthPage.js' },
    { dir: 'MythologyChannel',   file: 'MythologyChannelPage.js' },
    { dir: 'Myths',              file: 'MythsPage.js' },
    { dir: 'MythSalonLibrary',   file: 'MythSalonLibraryPage.js' },
    { dir: 'OuroborosJourney',   file: 'OuroborosJourneyPage.js' },
    { dir: 'Profile',            file: 'ProfilePage.js' },
    { dir: 'Ring2D',             file: 'Ring2DPage.js' },
    { dir: 'SacredSites360',     file: 'SacredSites360Page.js' },
    { dir: 'SecretWeapon',       file: 'SecretWeaponPage.js' },
    { dir: 'SecretWeaponAPI',    file: 'SecretWeaponAPIPage.js' },
    { dir: 'Store',              file: 'StorePage.js' },
    { dir: 'StoryBook',          file: 'StoryBookPage.js' },
    { dir: 'StoryOfStories',     file: 'StoryOfStoriesPage.js' },
    { dir: 'Teacher',            file: 'TeacherPage.js' },
    { dir: 'Traditions',         file: 'TraditionsPage.js' },
    { dir: 'Translator',         file: 'TranslatorPage.js' },
    { dir: 'Treasures',          file: 'TreasuresPage.js' },
    { dir: 'Trusts',             file: 'TrustsPage.js' },
    { dir: 'Welcome',            file: 'index.js' },
    { dir: 'Will',               file: 'WillPage.js' },
    { dir: 'WillLinn',           file: 'WillLinnPage.js' },
    { dir: 'XR',                 file: 'XRPage.js' },
    { dir: 'YellowBrickRoad',    file: 'YellowBrickRoadPage.js' },
  ];

  test.each(pageModules)(
    'pages/$dir/ directory exists',
    ({ dir }) => {
      const dirPath = path.join(pagesDir, dir);
      expect(fs.existsSync(dirPath)).toBe(true);
    }
  );

  test.each(pageModules)(
    'pages/$dir/$file exists',
    ({ dir, file }) => {
      const filePath = path.join(pagesDir, dir, file);
      expect(fs.existsSync(filePath)).toBe(true);
    }
  );

  test.each(pageModules)(
    'pages/$dir/$file can be required (module resolves)',
    ({ dir, file }) => {
      const modulePath = path.join('..', 'pages', dir, file.replace(/\.js$/, ''));
      try {
        require(modulePath);
      } catch (err) {
        // Only fail if the module literally cannot be found. Runtime errors
        // (e.g. canvas.getContext in jsdom) are environment limitations, not
        // missing-file problems — the file still exists and resolves.
        if (err.code === 'MODULE_NOT_FOUND') {
          throw err;
        }
      }
    }
  );
});

// ---------------------------------------------------------------------------
// 2. Core shared components exist
// ---------------------------------------------------------------------------
describe('Core shared components exist', () => {
  const sharedComponents = [
    { name: 'ChatPanel',        relPath: '../components/ChatPanel' },
    { name: 'CircleNav',        relPath: '../components/CircleNav' },
    { name: 'OrbitalDiagram',   relPath: '../components/chronosphaera/OrbitalDiagram' },
    { name: 'MetalDetailPanel', relPath: '../components/chronosphaera/MetalDetailPanel' },
    { name: 'RingButton',       relPath: '../components/RingButton' },
  ];

  test.each(sharedComponents)(
    '$name file exists on disk',
    ({ relPath }) => {
      const absPath = path.resolve(__dirname, relPath + '.js');
      expect(fs.existsSync(absPath)).toBe(true);
    }
  );

  test.each(sharedComponents)(
    '$name can be required',
    ({ relPath }) => {
      expect(() => require(relPath)).not.toThrow();
    }
  );

  test.each(sharedComponents)(
    '$name exports a default',
    ({ relPath }) => {
      const mod = require(relPath);
      expect(mod.default).toBeDefined();
    }
  );
});

// ---------------------------------------------------------------------------
// 3. Core contexts exist
// ---------------------------------------------------------------------------
describe('Core contexts exist', () => {
  const contexts = [
    {
      name: 'AuthContext',
      relPath: '../auth/AuthContext',
      expectedExports: ['useAuth', 'AuthProvider'],
    },
    {
      name: 'ProfileContext',
      relPath: '../profile/ProfileContext',
      expectedExports: ['useProfile', 'ProfileProvider'],
    },
    {
      name: 'CourseworkContext',
      relPath: '../coursework/CourseworkContext',
      expectedExports: ['useCoursework', 'CourseworkProvider'],
    },
    {
      name: 'WritingsContext',
      relPath: '../writings/WritingsContext',
      expectedExports: ['useWritings', 'WritingsProvider'],
    },
  ];

  test.each(contexts)(
    '$name file exists on disk',
    ({ relPath }) => {
      const absPath = path.resolve(__dirname, relPath + '.js');
      expect(fs.existsSync(absPath)).toBe(true);
    }
  );

  test.each(contexts)(
    '$name can be required',
    ({ relPath }) => {
      expect(() => require(relPath)).not.toThrow();
    }
  );

  test.each(contexts)(
    '$name exports its provider and hook ($expectedExports)',
    ({ relPath, expectedExports }) => {
      const mod = require(relPath);
      expectedExports.forEach((exportName) => {
        expect(mod[exportName]).toBeDefined();
        expect(typeof mod[exportName]).toBe('function');
      });
    }
  );
});

// ---------------------------------------------------------------------------
// 4. Layout structure integrity (App.js)
// ---------------------------------------------------------------------------
describe('Layout structure integrity', () => {
  const appSource = fs.readFileSync(
    path.resolve(__dirname, '..', 'App.js'),
    'utf-8'
  );

  test('SiteHeader function is defined', () => {
    expect(appSource).toMatch(/function SiteHeader\(\)/);
  });

  test('SiteNav function is defined', () => {
    expect(appSource).toMatch(/function SiteNav\(\)/);
  });

  test('SiteFooter function is defined', () => {
    expect(appSource).toMatch(/function SiteFooter\(\)/);
  });

  test('SiteHeader renders a <header> element with class "site-header"', () => {
    expect(appSource).toMatch(/<header className="site-header">/);
  });

  test('SiteNav renders a <nav> element with class "site-nav"', () => {
    expect(appSource).toMatch(/<nav className="site-nav">/);
  });

  test('SiteFooter renders a <footer> element with class "site-footer"', () => {
    expect(appSource).toMatch(/<footer className="site-footer">/);
  });

  test('ErrorBoundary component is imported', () => {
    expect(appSource).toMatch(/import ErrorBoundary from/);
  });

  test('ErrorBoundary wraps Routes', () => {
    // ErrorBoundary must appear before <Routes> and close after </Routes>
    const boundaryOpen = appSource.indexOf('<ErrorBoundary>');
    const routesOpen = appSource.indexOf('<Routes>');
    const routesClose = appSource.indexOf('</Routes>');
    const boundaryClose = appSource.indexOf('</ErrorBoundary>');
    expect(boundaryOpen).toBeGreaterThan(-1);
    expect(routesOpen).toBeGreaterThan(boundaryOpen);
    expect(routesClose).toBeGreaterThan(routesOpen);
    expect(boundaryClose).toBeGreaterThan(routesClose);
  });

  test('Layout order: SiteHeader before SiteNav before ErrorBoundary before SiteFooter', () => {
    const headerPos = appSource.indexOf('<SiteHeader />');
    const navPos = appSource.indexOf('<SiteNav />');
    const boundaryPos = appSource.indexOf('<ErrorBoundary>');
    const footerPos = appSource.indexOf('<SiteFooter />');
    expect(headerPos).toBeGreaterThan(-1);
    expect(navPos).toBeGreaterThan(headerPos);
    expect(boundaryPos).toBeGreaterThan(navPos);
    expect(footerPos).toBeGreaterThan(boundaryPos);
  });

  test('ChatPanel is included in layout', () => {
    expect(appSource).toMatch(/<ChatPanel \/>/);
  });
});
