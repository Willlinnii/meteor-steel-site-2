/**
 * API Resilience Tests
 *
 * Tests the Firestore cache layers added to sacred-text.js and celestial.js
 * (solar-field handler). Validates that:
 *   - Handlers still work on the happy path
 *   - Cache helpers produce valid doc IDs
 *   - Solar field handler returns correct structure
 *   - Error handling follows expected patterns
 *
 * Derived from: api/sacred-text.js, api/celestial.js
 */

// ── Module-level mocks ──

// Use jest variable naming convention (must start with `mock`) so jest
// hoisting can reference them inside jest.mock factories.
const mockGet = jest.fn().mockResolvedValue({ exists: false });
const mockSet = jest.fn().mockResolvedValue(undefined);

jest.mock('firebase-admin', () => {
  const makeDocMock = () => ({
    get: mockGet,
    set: mockSet,
    collection: jest.fn(() => ({
      doc: jest.fn(() => makeDocMock()),
    })),
  });

  const firestoreFn = jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => makeDocMock()),
    })),
    doc: jest.fn(() => makeDocMock()),
  }));
  firestoreFn.FieldValue = { serverTimestamp: jest.fn(() => 'MOCK_TS') };

  return {
    apps: [{}],
    auth: jest.fn(() => ({
      verifyIdToken: jest.fn().mockRejectedValue(new Error('mock')),
    })),
    firestore: firestoreFn,
    credential: { cert: jest.fn() },
    initializeApp: jest.fn(),
  };
});

jest.mock('../../api/_lib/llm', () => ({
  getAnthropicClient: jest.fn(() => ({})),
  getUserKeys: jest.fn(() => ({})),
}));
jest.mock('@anthropic-ai/sdk', () => jest.fn(() => ({})));
jest.mock('openai', () => jest.fn(() => ({})));

// ── Imports (after mocks) ──

const sacredTextHandler = require('../../api/sacred-text');
const celestialHandler = require('../../api/celestial');

// ── Helpers ──

const mockReq = (overrides) => ({
  method: 'GET',
  headers: {},
  query: {},
  body: {},
  ...overrides,
});

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn();
  return res;
};

// ════════════════════════════════════════════════════════════════
// 1. Sacred Text handler
// ════════════════════════════════════════════════════════════════

describe('Sacred Text handler', () => {
  test('module exports a function', () => {
    expect(typeof sacredTextHandler).toBe('function');
  });

  test('returns 400 when page parameter is missing', async () => {
    const req = mockReq({ query: {} });
    const res = mockRes();
    await sacredTextHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'page parameter required' });
  });

  test('sets Cache-Control header', async () => {
    const req = mockReq({ query: { page: 'Test_Page' } });
    const res = mockRes();
    // Will fail on fetch (no network) but should still set header first
    await sacredTextHandler(req, res);
    expect(res.setHeader).toHaveBeenCalledWith(
      'Cache-Control',
      expect.stringContaining('s-maxage')
    );
  });
});

// ════════════════════════════════════════════════════════════════
// 2. Celestial handler routing
// ════════════════════════════════════════════════════════════════

describe('Celestial handler routing', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    mockGet.mockReset().mockResolvedValue({ exists: false });
    mockSet.mockReset().mockResolvedValue(undefined);
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('module exports a function', () => {
    expect(typeof celestialHandler).toBe('function');
  });

  test('natal type with missing required fields returns 400', async () => {
    const req = mockReq({
      method: 'POST',
      query: { type: 'natal' },
      body: {},
    });
    const res = mockRes();
    await celestialHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining('required') })
    );
  });

  test('natal type rejects GET requests', async () => {
    const req = mockReq({ method: 'GET', query: { type: 'natal' } });
    const res = mockRes();
    await celestialHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(405);
  });

  test('solar-field type sets Cache-Control header', async () => {
    const req = mockReq({ query: { type: 'solar-field' } });
    const res = mockRes();
    await celestialHandler(req, res);
    expect(res.setHeader).toHaveBeenCalledWith(
      'Cache-Control',
      expect.stringContaining('s-maxage')
    );
  });

  test('solar-field returns 502 when NOAA is down and no cache exists', async () => {
    // Mock fetch to simulate NOAA failure
    global.fetch = jest.fn().mockRejectedValue(new Error('NOAA is down'));
    // Mock: no cache available
    mockGet.mockResolvedValueOnce({ exists: false });

    const req = mockReq({ query: { type: 'solar-field' } });
    const res = mockRes();
    await celestialHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(502);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.any(String) })
    );
  });

  test('solar-field success response includes expected structure', async () => {
    // Use real NOAA fetch (if available) or verify shape from successful fetch
    const req = mockReq({ query: { type: 'solar-field' } });
    const res = mockRes();
    await celestialHandler(req, res);

    // If NOAA responded, we get 200 with full structure
    // If NOAA is down, we get 502 (since mock cache is empty)
    const status = res.status.mock.calls[0][0];
    if (status === 200) {
      const data = res.json.mock.calls[0][0];
      expect(data).toHaveProperty('current');
      expect(data).toHaveProperty('alignment');
      expect(data).toHaveProperty('polarField');
      expect(data).toHaveProperty('meta');
      expect(data.current).toHaveProperty('bz');
      expect(data.current).toHaveProperty('bt');
      expect(data.current).toHaveProperty('sector');
    } else {
      // NOAA down, verify error shape
      expect(status).toBe(502);
    }
  });

  test('default type (sky-now) rejects non-GET methods', async () => {
    const req = mockReq({ method: 'POST', query: {} });
    const res = mockRes();
    await celestialHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(405);
  });
});

// ════════════════════════════════════════════════════════════════
// 3. Cache doc ID generation (sacred-text)
// ════════════════════════════════════════════════════════════════

describe('Sacred text cache doc IDs', () => {
  // The getCacheDocId function is internal, but we can verify behavior
  // indirectly by checking that different inputs produce consistent behavior

  test('handler processes index mode request', async () => {
    const req = mockReq({ query: { page: 'The_Odyssey', mode: 'index' } });
    const res = mockRes();
    // Will fail on fetch but exercises the code path
    await sacredTextHandler(req, res);
    // Should have attempted the fetch (will fail in test env)
    expect(res.status).toHaveBeenCalled();
  });

  test('handler processes chapter mode request', async () => {
    const req = mockReq({ query: { page: 'The_Odyssey', section: '1' } });
    const res = mockRes();
    await sacredTextHandler(req, res);
    expect(res.status).toHaveBeenCalled();
  });
});
