#!/usr/bin/env node
/**
 * Generate constellations.json from d3-celestial constellation line data
 * Maps constellation line vertices to stars in starsNorth.json / starsSouth.json
 */
const https = require('https');
const fs = require('fs');

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch(e) { reject(e); } });
      res.on('error', reject);
    });
  });
}

function round2(v) { return Math.round(v * 100) / 100; }

// IAU 88 constellation full names keyed by standard abbreviation
const IAU_NAMES = {
  And:'Andromeda', Ant:'Antlia', Aps:'Apus', Aql:'Aquila', Aqr:'Aquarius',
  Ara:'Ara', Ari:'Aries', Aur:'Auriga', Boo:'Boötes', Cae:'Caelum',
  Cam:'Camelopardalis', Cap:'Capricornus', Car:'Carina', Cas:'Cassiopeia',
  Cen:'Centaurus', Cep:'Cepheus', Cet:'Cetus', Cha:'Chamaeleon',
  Cir:'Circinus', CMa:'Canis Major', CMi:'Canis Minor', Cnc:'Cancer',
  Col:'Columba', Com:'Coma Berenices', CrA:'Corona Australis',
  CrB:'Corona Borealis', Crt:'Crater', Cru:'Crux', Crv:'Corvus',
  CVn:'Canes Venatici', Cyg:'Cygnus', Del:'Delphinus', Dor:'Dorado',
  Dra:'Draco', Equ:'Equuleus', Eri:'Eridanus', For:'Fornax', Gem:'Gemini',
  Gru:'Grus', Her:'Hercules', Hor:'Horologium', Hya:'Hydra', Hyi:'Hydrus',
  Ind:'Indus', Lac:'Lacerta', Leo:'Leo', Lep:'Lepus', Lib:'Libra',
  LMi:'Leo Minor', Lup:'Lupus', Lyn:'Lynx', Lyr:'Lyra', Men:'Mensa',
  Mic:'Microscopium', Mon:'Monoceros', Mus:'Musca', Nor:'Norma', Oct:'Octans',
  Oph:'Ophiuchus', Ori:'Orion', Pav:'Pavo', Peg:'Pegasus', Per:'Perseus',
  Phe:'Phoenix', Pic:'Pictor', PsA:'Piscis Austrinus', Psc:'Pisces',
  Pup:'Puppis', Pyx:'Pyxis', Ret:'Reticulum', Scl:'Sculptor', Sco:'Scorpius',
  Sct:'Scutum', Ser:'Serpens', Sex:'Sextans', Sge:'Sagitta',
  Sgr:'Sagittarius', Tau:'Taurus', Tel:'Telescopium', TrA:'Triangulum Australe',
  Tri:'Triangulum', Tuc:'Tucana', UMa:'Ursa Major', UMi:'Ursa Minor',
  Vel:'Vela', Vir:'Virgo', Vol:'Volans', Vul:'Vulpecula',
};

async function main() {
  console.log('Fetching constellation lines from d3-celestial...');
  const linesData = await fetch('https://raw.githubusercontent.com/ofrohn/d3-celestial/master/data/constellations.lines.json');

  console.log(`Got ${linesData.features.length} constellations`);

  const starsN = JSON.parse(fs.readFileSync(__dirname + '/../src/data/starsNorth.json', 'utf8'));
  const starsS = JSON.parse(fs.readFileSync(__dirname + '/../src/data/starsSouth.json', 'utf8'));
  console.log(`Stars: ${starsN.length} north, ${starsS.length} south`);

  // Build spatial index for fast nearest-star lookup
  // Grid cells keyed by rounded (ra*5, dec*5) for ~0.2° resolution
  function buildIndex(stars) {
    const idx = {};
    stars.forEach(([ra, dec, mag], i) => {
      const key = Math.round(ra * 5) + ',' + Math.round(dec * 5);
      if (!idx[key]) idx[key] = [];
      idx[key].push({ i, ra, dec, mag });
    });
    return idx;
  }

  const northIdx = buildIndex(starsN);
  const southIdx = buildIndex(starsS);

  // Find nearest star to a given coordinate, preferring brighter stars when close
  function findStar(ra, dec) {
    const idx = dec >= 0 ? northIdx : southIdx;
    const hemisphere = dec >= 0 ? 'n' : 's';
    let best = null;
    let bestDist = Infinity;

    // Search nearby grid cells (±3 cells = ±0.6°)
    for (let dra = -3; dra <= 3; dra++) {
      for (let ddec = -3; ddec <= 3; ddec++) {
        const key = (Math.round(ra * 5) + dra) + ',' + (Math.round(dec * 5) + ddec);
        const cell = idx[key];
        if (!cell) continue;
        for (const s of cell) {
          // Account for RA wraparound at ±180
          let dRa = Math.abs(s.ra - ra);
          if (dRa > 180) dRa = 360 - dRa;
          const dist = Math.sqrt(dRa ** 2 + (s.dec - dec) ** 2);
          if (dist < bestDist) {
            bestDist = dist;
            best = { i: s.i, hemisphere };
          }
        }
      }
    }

    return bestDist < 2.0 ? best : null; // 2° tolerance
  }

  const constellations = [];
  let totalMatched = 0;
  let totalVertices = 0;

  for (const feature of linesData.features) {
    const id = feature.id;
    const name = IAU_NAMES[id] || feature.properties.n || feature.properties.name || id;
    const multiLineString = feature.geometry.coordinates;

    const lineSegments = [];
    const northStarSet = new Set();
    const southStarSet = new Set();

    for (const lineString of multiLineString) {
      for (let j = 0; j < lineString.length - 1; j++) {
        const [ra1, dec1] = lineString[j];
        const [ra2, dec2] = lineString[j + 1];
        lineSegments.push([[round2(ra1), round2(dec1)], [round2(ra2), round2(dec2)]]);

        totalVertices += 2;
        const s1 = findStar(ra1, dec1);
        const s2 = findStar(ra2, dec2);

        if (s1) {
          totalMatched++;
          if (s1.hemisphere === 'n') northStarSet.add(s1.i);
          else southStarSet.add(s1.i);
        }
        if (s2) {
          totalMatched++;
          if (s2.hemisphere === 'n') northStarSet.add(s2.i);
          else southStarSet.add(s2.i);
        }
      }
    }

    constellations.push({
      id,
      name,
      lines: lineSegments,
      ns: [...northStarSet].sort((a, b) => a - b),
      ss: [...southStarSet].sort((a, b) => a - b),
    });
  }

  // Sort by name for readability
  constellations.sort((a, b) => a.name.localeCompare(b.name));

  const outPath = __dirname + '/../src/data/constellations.json';
  fs.writeFileSync(outPath, JSON.stringify(constellations));

  const fileSize = (fs.statSync(outPath).size / 1024).toFixed(1);
  const totalStars = constellations.reduce((s, c) => s + c.ns.length + c.ss.length, 0);
  console.log(`\nGenerated ${constellations.length} constellations`);
  console.log(`Total constellation stars: ${totalStars}`);
  console.log(`Vertex match rate: ${totalMatched}/${totalVertices} (${(100 * totalMatched / totalVertices).toFixed(1)}%)`);
  console.log(`File size: ${fileSize} KB`);

  // Show a few examples
  const examples = constellations.filter(c => ['Ori', 'UMa', 'Sco', 'Crx'].includes(c.id)).slice(0, 4);
  if (examples.length === 0) {
    // Show first 3 if specific ones not found
    constellations.slice(0, 3).forEach(c => {
      console.log(`  ${c.id} "${c.name}": ${c.lines.length} segments, ${c.ns.length}N + ${c.ss.length}S stars`);
    });
  } else {
    examples.forEach(c => {
      console.log(`  ${c.id} "${c.name}": ${c.lines.length} segments, ${c.ns.length}N + ${c.ss.length}S stars`);
    });
  }
}

main().catch(e => { console.error(e); process.exit(1); });
