/**
 * planetaryPhysics.js — Canonical physical constants for solar system bodies.
 *
 * Real astronomical data: axial tilts, magnetic fields, orbital radii,
 * body sizes, and interpretive templates for the EM field overlay.
 */

// ── Field type enum ──────────────────────────────────────────────────────────

export const FIELD_TYPES = {
  DIPOLE: 'dipole',
  INDUCED: 'induced',
  NONE: 'none',
  RESIDUAL: 'residual',
};

// ── Physical constants per body ──────────────────────────────────────────────

export const PLANETARY_PHYSICS = {
  Sun: {
    axialTilt: 7.25,
    rotationPeriod: 25.38,       // days (equatorial)
    magneticField: {
      type: FIELD_TYPES.DIPOLE,
      surfaceStrength: 1,        // Gauss
      dipoleTilt: 0,             // aligned with rotation axis
      notes: 'Flips polarity every ~11 years at solar maximum',
    },
    orbitalRadius: 0,            // AU
    bodyRadius: 1.0,             // relative scale
    color: '#f0c040',
    metal: 'Gold',
  },
  Mercury: {
    axialTilt: 0.03,
    rotationPeriod: 58.65,
    magneticField: {
      type: FIELD_TYPES.DIPOLE,
      surfaceStrength: 0.003,    // ~0.01x Earth, weak but real
      dipoleTilt: 0,             // nearly aligned
      notes: 'Offset 0.2R northward from center',
    },
    orbitalRadius: 0.387,
    bodyRadius: 0.38,
    color: '#b8b8c8',
    metal: 'Mercury',
  },
  Venus: {
    axialTilt: 177.4,            // retrograde rotation
    rotationPeriod: 243.02,
    magneticField: {
      type: FIELD_TYPES.INDUCED,
      surfaceStrength: 0,
      dipoleTilt: null,
      notes: 'No intrinsic field; induced magnetosphere from solar wind',
    },
    orbitalRadius: 0.723,
    bodyRadius: 0.95,
    color: '#e8b060',
    metal: 'Copper',
  },
  Earth: {
    axialTilt: 23.44,
    rotationPeriod: 1.0,
    magneticField: {
      type: FIELD_TYPES.DIPOLE,
      surfaceStrength: 0.5,      // Gauss
      dipoleTilt: 11.5,          // degrees from rotation axis
      notes: 'Geodynamo — liquid iron core generates active field',
    },
    orbitalRadius: 1.0,
    bodyRadius: 1.0,
    color: '#4a9bd9',
    metal: 'Iron',
  },
  Moon: {
    axialTilt: 6.7,
    rotationPeriod: 27.32,
    magneticField: {
      type: FIELD_TYPES.NONE,
      surfaceStrength: 0,
      dipoleTilt: null,
      notes: 'No current global field; had one ~3.5 billion years ago',
    },
    orbitalRadius: 0.00257,      // AU from Earth (special case)
    bodyRadius: 0.27,
    color: '#c8d8e8',
    metal: 'Silver',
  },
  Mars: {
    axialTilt: 25.19,
    rotationPeriod: 1.026,
    magneticField: {
      type: FIELD_TYPES.RESIDUAL,
      surfaceStrength: 0,
      dipoleTilt: null,
      notes: 'No global field; residual crustal magnetism from ancient dynamo',
    },
    orbitalRadius: 1.524,
    bodyRadius: 0.53,
    color: '#d06040',
    metal: 'Iron',
  },
  Jupiter: {
    axialTilt: 3.13,
    rotationPeriod: 0.414,       // ~9.9 hours
    magneticField: {
      type: FIELD_TYPES.DIPOLE,
      surfaceStrength: 10000,    // ~20,000x Earth at equator, using 10000 Gauss order
      dipoleTilt: 9.6,           // degrees from rotation axis
      notes: 'Strongest planetary field; magnetosphere extends millions of km',
    },
    orbitalRadius: 5.203,
    bodyRadius: 11.2,
    color: '#a0b8c0',
    metal: 'Tin',
  },
  Saturn: {
    axialTilt: 26.73,
    rotationPeriod: 0.444,       // ~10.7 hours
    magneticField: {
      type: FIELD_TYPES.DIPOLE,
      surfaceStrength: 300,      // ~600x Earth
      dipoleTilt: 0.8,           // mysteriously near-perfect alignment
      notes: 'Dipole almost perfectly aligned with rotation axis — unique in the solar system',
    },
    orbitalRadius: 9.537,
    bodyRadius: 9.45,
    color: '#908070',
    metal: 'Lead',
  },
};

// ── Normalized orbital radii for diagram positioning ─────────────────────────
// Log-compressed so inner planets aren't invisible next to Jupiter/Saturn

export const ORBITAL_RADII_NORM = {
  Mercury: 60,
  Venus: 90,
  Earth: 120,
  Moon: 120,     // grouped with Earth
  Mars: 150,
  Jupiter: 195,
  Saturn: 240,
  Sun: 0,        // always at center when Sun-centric
};

// ── Dipole display scaling ───────────────────────────────────────────────────
// Log scale so Jupiter doesn't dwarf everything visually

const BASE_DIPOLE_SCALE = 18;

export function getDipoleDisplayLength(surfaceStrength) {
  if (!surfaceStrength || surfaceStrength <= 0) return 0;
  return Math.log10(surfaceStrength + 1) * BASE_DIPOLE_SCALE;
}

// ── Interpretive templates per body ──────────────────────────────────────────

export const EM_INTERPRETATIONS = {
  Sun: "The Sun's magnetic field is the container for the entire system. Its dipole flips every ~11 years at solar maximum — the only body that truly resets. When the field reverses, the heliosphere reorganizes. Everything that orbits carries the imprint of whichever polarity was dominant when the cycle turned.",

  Mercury: "Mercury holds a faint but real magnetic field — a whisper of a dipole, offset northward from the planet's center. It shouldn't have one at all, given its slow rotation and small core. Yet it does. The messenger carries a shield too thin to stop the solar wind, but present enough to deflect it.",

  Venus: "Venus has no intrinsic magnetic field. The solar wind meets the atmosphere directly, inducing a transient magnetosphere that exists only as long as the wind blows. Venus borrows its field from the Sun. What looks like protection is borrowed time.",

  Earth: "Earth's magnetic field is the archetype — the geodynamo, generated by liquid iron churning in the outer core. Tilted 11.5 degrees from the rotation axis, it creates the magnetosphere that shields the surface from solar wind. Without it, the atmosphere would erode. The field has reversed hundreds of times in geological history.",

  Moon: "The Moon has no current magnetic field. It had one — roughly 3.5 billion years ago, its small core generated a dynamo. The field died as the core cooled. What remains are patches of crustal magnetism, ghost imprints of a field that once was. The Moon remembers what it can no longer sustain.",

  Mars: "Mars has no current global magnetic field. Its dynamo died billions of years ago, and the solar wind stripped much of the atmosphere. What remains are residual magnetic anomalies frozen in ancient crust — the southern hemisphere carries the strongest remnants. Mars holds the shape of what it lost.",

  Jupiter: "Jupiter carries the strongest magnetic field in the solar system — 20,000 times Earth's. Its magnetosphere extends millions of kilometers, engulfing the Galilean moons. The dipole is tilted 9.6 degrees from the rotation axis, driving intense radiation belts. Jupiter doesn't just orbit the Sun — it carries its own magnetic kingdom.",

  Saturn: "Saturn's magnetic field is an anomaly. Its dipole is aligned almost perfectly with the rotation axis — less than one degree of tilt. Every other magnetized body shows significant offset. Saturn's perfect alignment remains one of the unsolved problems in planetary science. The keeper's field is unnervingly orderly.",
};
