const { Body, GeoVector, Ecliptic, SiderealTime } = require('astronomy-engine');

// --- Constants ---

const SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

const VEDIC_SIGNS = [
  'Mesha', 'Vrishabha', 'Mithuna', 'Karka', 'Simha', 'Kanya',
  'Tula', 'Vrishchika', 'Dhanu', 'Makara', 'Kumbha', 'Meena',
];

const PLANETS = [
  { name: 'Sun', body: Body.Sun },
  { name: 'Moon', body: Body.Moon },
  { name: 'Mercury', body: Body.Mercury },
  { name: 'Venus', body: Body.Venus },
  { name: 'Mars', body: Body.Mars },
  { name: 'Jupiter', body: Body.Jupiter },
  { name: 'Saturn', body: Body.Saturn },
];

const ASPECTS = [
  { name: 'Conjunction', angle: 0, orb: 8 },
  { name: 'Sextile', angle: 60, orb: 6 },
  { name: 'Square', angle: 90, orb: 8 },
  { name: 'Trine', angle: 120, orb: 8 },
  { name: 'Opposition', angle: 180, orb: 8 },
];

const CHINESE_ANIMALS = [
  'Rat', 'Ox', 'Tiger', 'Rabbit', 'Dragon', 'Snake',
  'Horse', 'Goat', 'Monkey', 'Rooster', 'Dog', 'Pig',
];

const CHINESE_ELEMENTS = ['Wood', 'Fire', 'Earth', 'Metal', 'Water'];

// --- Helper functions ---

function lonToSign(lon) {
  const normalized = ((lon % 360) + 360) % 360;
  const signIndex = Math.floor(normalized / 30);
  const degree = +(normalized % 30).toFixed(1);
  return { longitude: +normalized.toFixed(2), sign: SIGNS[signIndex], degree, signIndex };
}

function lonToVedicSign(tropicalLon, year) {
  // Lahiri Ayanamsa: ~24.1° for 2024, drifts ~0.014°/year
  const ayanamsa = 24.1 + (year - 2024) * 0.0139;
  const siderealLon = ((tropicalLon - ayanamsa) % 360 + 360) % 360;
  const signIndex = Math.floor(siderealLon / 30);
  const degree = +(siderealLon % 30).toFixed(1);
  return { sign: VEDIC_SIGNS[signIndex], degree };
}

function getPlanetLongitude(body, date) {
  const vec = GeoVector(body, date, true);
  return Ecliptic(vec).elon;
}

function computeAscendant(date, latitude, longitude) {
  const gst = SiderealTime(date); // Greenwich Sidereal Time in hours
  const lst = ((gst + longitude / 15) % 24 + 24) % 24; // Local Sidereal Time
  const lstRad = lst * 15 * Math.PI / 180;
  const obliquity = 23.4393 * Math.PI / 180;
  const latRad = latitude * Math.PI / 180;

  const ascRad = Math.atan2(
    Math.cos(lstRad),
    -(Math.sin(lstRad) * Math.cos(obliquity) + Math.tan(latRad) * Math.sin(obliquity))
  );
  return ((ascRad * 180 / Math.PI) % 360 + 360) % 360;
}

function computeMidheaven(date, longitude) {
  const gst = SiderealTime(date);
  const lst = ((gst + longitude / 15) % 24 + 24) % 24;
  const lstRad = lst * 15 * Math.PI / 180;
  const obliquity = 23.4393 * Math.PI / 180;

  const mcRad = Math.atan2(Math.sin(lstRad), Math.cos(lstRad) * Math.cos(obliquity));
  return ((mcRad * 180 / Math.PI) % 360 + 360) % 360;
}

function computeWholeSignHouses(ascSignIndex) {
  // Whole Sign: House 1 = entire sign of Ascendant, House 2 = next sign, etc.
  return Array.from({ length: 12 }, (_, i) => {
    const houseSignIndex = (ascSignIndex + i) % 12;
    return {
      house: i + 1,
      sign: SIGNS[houseSignIndex],
      startDegree: houseSignIndex * 30,
    };
  });
}

function findAspects(positions) {
  // positions: array of { name, longitude }
  const found = [];
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      let sep = Math.abs(positions[i].longitude - positions[j].longitude);
      if (sep > 180) sep = 360 - sep;

      for (const aspect of ASPECTS) {
        const orb = Math.abs(sep - aspect.angle);
        if (orb <= aspect.orb) {
          found.push({
            planet1: positions[i].name,
            planet2: positions[j].name,
            aspect: aspect.name,
            orb: +orb.toFixed(1),
          });
          break; // one aspect per pair
        }
      }
    }
  }
  return found;
}

function getHouseForLongitude(lon, houses) {
  if (!houses) return null;
  // In Whole Sign, each house spans exactly 30° starting at startDegree
  const normalized = ((lon % 360) + 360) % 360;
  for (const h of houses) {
    const start = h.startDegree;
    const end = (start + 30) % 360;
    if (start < end) {
      if (normalized >= start && normalized < end) return h.house;
    } else {
      // wraps around 360
      if (normalized >= start || normalized < end) return h.house;
    }
  }
  return 1; // fallback
}

// --- Main computation ---

function computeNatalChart({ year, month, day, hour, minute, latitude, longitude, city, utcOffset }) {
  const timeMissing = hour === -1;
  // If birth time unknown, use noon LOCAL as a reasonable default for planet positions
  const effectiveHour = timeMissing ? 12 : hour;
  const effectiveMinute = timeMissing ? 0 : minute;

  // utcOffset is the UTC offset in hours (e.g. -5 for CDT, -6 for CST, +1 for CET).
  // Convert local birth time to UTC: UTC = local - utcOffset
  const offset = typeof utcOffset === 'number' ? utcOffset : 0;
  const date = new Date(Date.UTC(year, month - 1, day, effectiveHour - offset, effectiveMinute));

  // Compute planet positions
  const planetData = PLANETS.map(({ name, body }) => {
    const lon = getPlanetLongitude(body, date);
    const info = lonToSign(lon);
    return { name, ...info };
  });

  // Ascendant & Midheaven (only with birth time)
  let ascendant = null;
  let midheaven = null;
  let houses = null;

  if (!timeMissing) {
    const ascDeg = computeAscendant(date, latitude, longitude);
    const ascInfo = lonToSign(ascDeg);
    ascendant = { ...ascInfo };

    const mcDeg = computeMidheaven(date, longitude);
    const mcInfo = lonToSign(mcDeg);
    midheaven = { ...mcInfo };

    houses = computeWholeSignHouses(ascInfo.signIndex);
  }

  // Assign houses to planets
  const planets = planetData.map(p => ({
    name: p.name,
    longitude: p.longitude,
    sign: p.sign,
    degree: p.degree,
    house: houses ? getHouseForLongitude(p.longitude, houses) : null,
  }));

  // Aspects (include Ascendant if available)
  const aspectPositions = planets.map(p => ({ name: p.name, longitude: p.longitude }));
  if (ascendant) {
    aspectPositions.push({ name: 'Ascendant', longitude: ascendant.longitude });
  }
  const aspects = findAspects(aspectPositions);

  // Vedic sidereal positions
  const vedicPlanets = planetData.map(p => ({
    name: p.name,
    ...lonToVedicSign(p.longitude, year),
  }));
  const vedicAscendant = ascendant ? lonToVedicSign(ascendant.longitude, year) : null;

  // Chinese zodiac
  const animalIdx = ((year - 4) % 12 + 12) % 12;
  const elementIdx = Math.floor((((year - 4) % 10) + 10) % 10 / 2);
  const animal = CHINESE_ANIMALS[animalIdx];
  const element = CHINESE_ELEMENTS[elementIdx];

  return {
    birthData: { year, month, day, hour: timeMissing ? null : hour, minute: timeMissing ? null : minute, latitude, longitude, city: city || null },
    planets,
    ascendant,
    midheaven,
    houses,
    aspects,
    vedic: {
      planets: vedicPlanets,
      ascendant: vedicAscendant,
    },
    chinese: { animal, element, pillar: `${element} ${animal}` },
    timeMissing,
  };
}

module.exports = { computeNatalChart };
