/**
 * narrativeBridge.js — Transforms computed chart data + character profiles
 * into dramatic, character-driven text.
 *
 * Pure functions. Deterministic. No AI, no React.
 * Consumes recursiveEngine output + planetCharacters + signCharacters.
 */

import { PLANET_CHARACTERS, getDignity, getDignityReading } from '../data/planetCharacters';
import { SIGN_CHARACTERS } from '../data/signCharacters';
import { analyzePositions, findNotableAspects, analyzeShifts } from './chartAnalysis';
import { getSolarCycleRule, ASPECT_MEANINGS } from '../data/recursiveRules';
import {
  HOUSE_MEANINGS, ANGLE_MEANINGS, LUNAR_NODE_MEANINGS,
  PART_OF_FORTUNE_MEANING, MUTUAL_RECEPTION_MEANING,
  EM_ASPECT_MODIFIERS,
} from '../data/recursiveRules';
import { getDignityWeight, getDignityVoice, VISION_CHARACTERS } from '../data/planetCharacters';

// ── Constants ────────────────────────────────────────────────────────────────

const HARD_ASPECTS = new Set(['Square', 'Opposition', 'Quincunx']);
const SOFT_ASPECTS = new Set(['Trine', 'Sextile']);
function getAspectType(name) {
  if (name === 'Conjunction') return 'fusion';
  if (HARD_ASPECTS.has(name)) return 'hard';
  if (SOFT_ASPECTS.has(name)) return 'soft';
  return 'neutral';
}

const DIGNITY_VERBS = {
  domicile: 'returns to',
  exaltation: 'rises in',
  detriment: 'enters hostile',
  fall: 'descends into',
  peregrine: 'travels through',
};

const DIGNITY_EXPANDED = {
  domicile: 'This is home ground — the planet operates without resistance, fully expressed in its own nature.',
  exaltation: 'The planet is elevated beyond its usual range — amplified, honored, operating at peak capacity.',
  detriment: 'The planet is in territory that opposes its nature — forced to work against the grain, constrained by an environment that does not support its instincts.',
  fall: 'The planet is undermined — its usual authority collapses, and it must find entirely new strategies to function.',
  peregrine: 'Neither empowered nor diminished — the planet adapts to foreign territory, learning a dialect that is not its own.',
};

const ASPECT_VERBS = {
  Conjunction: 'fuses with',
  Sextile: 'opens toward',
  Square: 'presses against',
  Trine: 'flows with',
  Opposition: 'faces',
};

const ASPECT_TENSIONS = {
  Conjunction: 'fusion',
  Sextile: 'flow',
  Square: 'tension',
  Trine: 'flow',
  Opposition: 'tension',
};

const ASPECT_INTERACTION = {
  Conjunction: 'merges with',
  Sextile: 'meets',
  Square: 'collides with',
  Trine: 'meets',
  Opposition: 'collides with',
};

const ASPECT_DRAMA = {
  Conjunction: 'The two drives occupy the same space — there is no separation between them. What one wants, the other must want too, or the fusion becomes a struggle for dominance within a single impulse.',
  Sextile: 'An opening exists between these two — not automatic, but available. The connection requires a small act of will to activate, like a door that is unlocked but not yet pushed open.',
  Square: 'These two drives are at cross purposes. Neither can ignore the other, and neither will yield. The friction is not optional — it demands action, forces a choice, and the tension does not resolve by waiting.',
  Trine: 'These two drives reinforce each other effortlessly. The energy flows without obstruction — what one initiates, the other supports. The danger is that ease can become complacency.',
  Opposition: 'These two drives face each other across the full diameter of the sky. Each sees in the other what it lacks. The tension is a mirror — productive only if both sides are acknowledged, destructive if one is denied.',
};

// ── Internal Helpers ─────────────────────────────────────────────────────────

function getRole(planetName) {
  return planetName;
}

function getEpithet(planetName) {
  const char = PLANET_CHARACTERS[planetName];
  if (!char) return planetName;
  return char.role.replace(/^The /, 'the ');
}

function getTagged(planetName) {
  const char = PLANET_CHARACTERS[planetName];
  if (!char) return planetName;
  return `${planetName}, ${char.role.replace(/^The /, 'the ')}`;
}

function getKeyword(planetName) {
  const char = PLANET_CHARACTERS[planetName];
  return char ? char.keyword : planetName.toLowerCase();
}

function getSignArchetype(signName) {
  const sign = SIGN_CHARACTERS[signName];
  return sign ? sign.archetype : signName;
}

function getSignKeyword(signName) {
  const sign = SIGN_CHARACTERS[signName];
  return sign ? sign.keyword : signName.toLowerCase();
}

function getSignElement(signName) {
  const sign = SIGN_CHARACTERS[signName];
  return sign ? sign.element : '';
}

function getSignModality(signName) {
  const sign = SIGN_CHARACTERS[signName];
  return sign ? sign.modality : '';
}

/**
 * Apply frame transformation.
 * Weather: return as-is (third person, cosmic).
 * Personal: rewrite "The {Role}" → "Your {keyword}".
 */
function applyFrame(text, planetName, frame) {
  if (frame !== 'personal') return text;
  const char = PLANET_CHARACTERS[planetName];
  if (!char) return text;
  const keyword = char.keyword;
  return text.replace(
    new RegExp(`\\b${planetName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g'),
    `Your ${keyword}`
  );
}

// ── Exported Functions ───────────────────────────────────────────────────────

/**
 * 1. narratePosition — Transform a position row into character-driven text.
 */
export function narratePosition(position, frame = 'weather') {
  if (!position || !position.name || !position.sign) {
    return { role: '', dignity: '', text: '', signDemand: '' };
  }

  const { name, sign } = position;
  const char = PLANET_CHARACTERS[name];
  const signChar = SIGN_CHARACTERS[sign];
  if (!char || !signChar) {
    return { role: name, dignity: 'peregrine', text: '', signDemand: '' };
  }

  const archetype = signChar.archetype;
  const dignity = getDignity(name, sign);
  const dignityReading = getDignityReading(name, sign);
  const verb = DIGNITY_VERBS[dignity] || 'travels through';

  // Sentence 1: The placement statement — tagged first mention
  let s1;
  if (dignity === 'peregrine') {
    s1 = `${getTagged(name)} ${verb} ${archetype}'s territory (${sign}).`;
  } else {
    s1 = `${getTagged(name)} ${verb} ${archetype}'s territory (${sign}, ${dignity}).`;
  }

  // Sentence 2: The full dignity reading from the character profile
  const s2 = dignityReading;

  // Sentence 3: What the sign demands of whatever enters it
  const s3 = `${sign}'s demand: ${signChar.demand}`;

  // Sentence 4: The element and modality effect on this planet
  const s4 = `${signChar.elementEffect} ${signChar.modalityEffect}`;

  // Sentence 5: The character's drive meeting the sign's keyword — planet name only
  const s5 = `${name}'s drive — ${char.drive.toLowerCase()} — meets ${archetype}'s insistence on ${signChar.keyword}. ${DIGNITY_EXPANDED[dignity]}`;

  let text = [s1, s2, s3, s4, s5].join(' ');
  text = applyFrame(text, name, frame);

  return { role: name, dignity, text, signDemand: signChar.demand };
}

/**
 * 2. narrateAspect — Transform an aspect into dramatic interaction.
 */
export function narrateAspect(aspect, positions, frame = 'weather') {
  if (!aspect || !aspect.planet1 || !aspect.planet2) {
    return { text: '', tension: '', dignityContrast: '' };
  }

  const { planet1, planet2, aspect: aspectType, orb } = aspect;
  const char1 = PLANET_CHARACTERS[planet1];
  const char2 = PLANET_CHARACTERS[planet2];
  const role1 = getRole(planet1);
  const role2 = getRole(planet2);
  const keyword1 = getKeyword(planet1);
  const keyword2 = getKeyword(planet2);
  const verb = ASPECT_VERBS[aspectType] || 'meets';
  const interaction = ASPECT_INTERACTION[aspectType] || 'meets';
  const tension = ASPECT_TENSIONS[aspectType] || 'connection';

  // Sentence 1: The core aspect statement
  const s1 = `${role1} ${verb} ${role2} — ${keyword1} ${interaction} ${keyword2}.`;

  // Sentence 2: The drama of this aspect type
  const s2 = ASPECT_DRAMA[aspectType] || '';

  // Sentence 3: What each planet wants — their drives in tension or flow
  let s3 = '';
  if (char1 && char2) {
    if (tension === 'tension') {
      s3 = `${role1} wants ${char1.drive.toLowerCase()} ${role2} wants ${char2.drive.toLowerCase()} These drives do not naturally cooperate — the ${aspectType.toLowerCase()} forces them into contact whether they are ready or not.`;
    } else if (tension === 'fusion') {
      s3 = `${role1} wants ${char1.drive.toLowerCase()} ${role2} wants ${char2.drive.toLowerCase()} In conjunction, these drives are indistinguishable — a single compound impulse that carries both agendas simultaneously.`;
    } else {
      s3 = `${role1} wants ${char1.drive.toLowerCase()} ${role2} wants ${char2.drive.toLowerCase()} The ${aspectType.toLowerCase()} allows these drives to support each other — what one initiates, the other amplifies.`;
    }
  }

  // Sentence 4: Orb tightness — how exact the contact is
  let s4 = '';
  if (orb !== undefined) {
    if (orb < 1) {
      s4 = `At ${orb}° orb, this is an exact aspect — the contact is at full intensity, unavoidable in the chart's architecture.`;
    } else if (orb < 3) {
      s4 = `At ${orb}° orb, the contact is tight — close enough to dominate the relationship between these two planets.`;
    } else {
      s4 = `At ${orb}° orb, the contact is present but loosening — still active, but not the primary driver.`;
    }
  }

  // Dignity contrast — expanded
  let dignityContrast = '';
  if (positions) {
    const posMap = Array.isArray(positions)
      ? Object.fromEntries(positions.map(p => [p.name, p]))
      : positions;

    const pos1 = posMap[planet1];
    const pos2 = posMap[planet2];

    if (pos1?.sign && pos2?.sign) {
      const d1 = getDignity(planet1, pos1.sign);
      const d2 = getDignity(planet2, pos2.sign);
      const notable1 = d1 !== 'peregrine';
      const notable2 = d2 !== 'peregrine';

      if (notable1 && notable2) {
        const strong1 = d1 === 'domicile' || d1 === 'exaltation';
        const strong2 = d2 === 'domicile' || d2 === 'exaltation';
        if (strong1 && !strong2) {
          dignityContrast = `${role1} operates from a position of strength (${d1} in ${pos1.sign}), while ${role2} is weakened (${d2} in ${pos2.sign}). The power imbalance colors the entire aspect — ${keyword1} has the upper hand, and ${keyword2} must adapt or resist from a disadvantaged position.`;
        } else if (!strong1 && strong2) {
          dignityContrast = `${role2} operates from a position of strength (${d2} in ${pos2.sign}), while ${role1} is weakened (${d1} in ${pos1.sign}). The power imbalance colors the entire aspect — ${keyword2} has the upper hand, and ${keyword1} must negotiate from constraint.`;
        } else if (strong1 && strong2) {
          dignityContrast = `Both planets are empowered — ${role1} in ${d1} (${pos1.sign}), ${role2} in ${d2} (${pos2.sign}). When two well-placed planets aspect each other, the dynamic is potent — two characters operating at full capacity, for better or worse.`;
        } else {
          dignityContrast = `Both planets are weakened — ${role1} in ${d1} (${pos1.sign}), ${role2} in ${d2} (${pos2.sign}). When two constrained planets form an aspect, the dynamic carries frustration — both characters working against the grain simultaneously.`;
        }
      } else if (notable1) {
        const strong1 = d1 === 'domicile' || d1 === 'exaltation';
        dignityContrast = `${role1} is ${strong1 ? 'empowered' : 'constrained'} in ${pos1.sign} (${d1}) — this colors how ${keyword1} shows up in the aspect.`;
      } else if (notable2) {
        const strong2 = d2 === 'domicile' || d2 === 'exaltation';
        dignityContrast = `${role2} is ${strong2 ? 'empowered' : 'constrained'} in ${pos2.sign} (${d2}) — this colors how ${keyword2} shows up in the aspect.`;
      }
    }
  }

  // Sentence 5: Archetypal polarity — what's at stake
  let s5 = '';
  if (char1 && char2) {
    if (tension === 'tension') {
      s5 = `The shadow risk: ${char1.shadow.split(',')[0].toLowerCase()} meeting ${char2.shadow.split(',')[0].toLowerCase()}. The light potential: ${char1.light.split(',')[0].toLowerCase()} meeting ${char2.light.split(',')[0].toLowerCase()}.`;
    } else {
      s5 = `When these two cooperate: ${char1.light.split('.')[0].toLowerCase()}; ${char2.light.split('.')[0].toLowerCase()}. The combination amplifies both — the question is whether the ease produces genuine integration or merely comfortable inertia.`;
    }
  }

  let text = [s1, s2, s3, s4, dignityContrast, s5].filter(Boolean).join(' ');
  text = applyFrame(text, planet1, frame);

  return { text, tension, dignityContrast };
}

/**
 * 3. narrateShift — Transform a perspective shift into character terms.
 */
export function narrateShift(shift, frame = 'weather') {
  if (!shift || !shift.planet) {
    return { text: '', dramatic: false };
  }

  const { planet, fromSign, toSign, shifted, degreeDelta } = shift;
  const char = PLANET_CHARACTERS[planet];

  if (!shifted) {
    const archetype = getSignArchetype(fromSign);
    const keyword = getSignKeyword(fromSign);
    const fromSignChar = SIGN_CHARACTERS[fromSign];
    const element = getSignElement(fromSign);
    const modality = getSignModality(fromSign);

    let text = `${getTagged(planet)} holds in ${archetype}'s territory — ${keyword} remains consistent across perspectives. Whether seen from Earth or the Sun, ${planet} stays in ${fromSign}, in ${element} ${modality} ground.`;
    if (fromSignChar) {
      text += ` The sign's demand does not shift: ${fromSignChar.demand}`;
    }
    if (char) {
      text += ` ${planet}'s question — ${char.question} — gets the same answer from both vantage points. The stability suggests this placement is structurally deep, not just a surface phenomenon.`;
    }
    text = applyFrame(text, planet, frame);
    return { text, dramatic: false };
  }

  const fromSignChar = SIGN_CHARACTERS[fromSign];
  const toSignChar = SIGN_CHARACTERS[toSign];
  const fromArchetype = getSignArchetype(fromSign);
  const toArchetype = getSignArchetype(toSign);
  const fromElement = getSignElement(fromSign);
  const toElement = getSignElement(toSign);
  const fromKeyword = getSignKeyword(fromSign);
  const toKeyword = getSignKeyword(toSign);
  const fromModality = getSignModality(fromSign);
  const toModality = getSignModality(toSign);

  // Sentence 1: The core shift — tagged first mention
  let s1 = `${getTagged(planet)} shifts from ${fromArchetype}'s ${fromElement} to ${toArchetype}'s ${toElement} — what appeared as ${fromKeyword} reveals itself as ${toKeyword}.`;

  // Sentence 2: What this means — the two territories compared
  let s2 = '';
  if (fromSignChar && toSignChar) {
    s2 = `From Earth, ${planet} occupies ${fromSign} (${fromElement}, ${fromModality}): ${fromSignChar.demand.split('.')[0].toLowerCase()}. From the Sun, ${planet} occupies ${toSign} (${toElement}, ${toModality}): ${toSignChar.demand.split('.')[0].toLowerCase()}.`;
  }

  // Sentence 3: Dignity shift — does the planet's dignity change?
  let s3 = '';
  if (char) {
    const d1 = getDignity(planet, fromSign);
    const d2 = getDignity(planet, toSign);
    if (d1 !== d2) {
      const reading1 = getDignityReading(planet, fromSign);
      const reading2 = getDignityReading(planet, toSign);
      s3 = `The dignity shifts too: from ${d1} to ${d2}. In ${fromSign}: ${reading1} In ${toSign}: ${reading2}`;
    } else {
      s3 = `The dignity remains ${d1} in both signs — the sign changes but the planet's essential condition does not.`;
    }
  }

  // Sentence 4: Element shift interpretation
  let s4 = '';
  if (fromElement !== toElement) {
    s4 = `The element shift from ${fromElement} to ${toElement} is significant — ${planet}'s entire mode of operation changes between perspectives. What works through ${fromElement} on the surface works through ${toElement} at depth.`;
  } else {
    s4 = `Both signs share ${fromElement} — the shift is within the same element, a change of expression rather than a change of substance.`;
  }

  // Sentence 5: The delta
  let s5 = '';
  if (degreeDelta !== undefined) {
    s5 = `The parallax is ${degreeDelta}° — ${degreeDelta > 10 ? 'a wide separation, suggesting Earth\'s perspective and the Sun\'s see this planet very differently' : 'a narrow gap, suggesting the shift is subtle but real'}.`;
  }

  let text = [s1, s2, s3, s4, s5].filter(Boolean).join(' ');
  text = applyFrame(text, planet, frame);

  return { text, dramatic: true };
}

/**
 * 4. narrateSynopsis — Character-driven synopsis.
 */
export function narrateSynopsis(weatherData, personalData, frame = 'weather') {
  if (!weatherData) return { text: '', highlights: [] };

  const geoPositions = weatherData.geocentric?.planets;
  const helioPositions = weatherData.heliocentric?.planets;
  const geoAspects = weatherData.geocentric?.aspects;

  const sentences = [];
  const highlights = [];

  // 1. Concentration — sign/element emphasis using sign archetypes (expanded)
  if (geoPositions) {
    const analysis = analyzePositions(geoPositions);

    if (analysis.stelliums.length > 0) {
      const st = analysis.stelliums[0];
      const signChar = SIGN_CHARACTERS[st.sign];
      const archetype = signChar?.archetype || st.sign;
      const element = signChar?.element || '';
      const roles = st.planets.map(n => getRole(n)).join(', ');
      sentences.push(
        `The sky concentrates in ${element} — ${archetype}'s territory (${st.sign}), where ${signChar?.demand?.split('.')[0]?.toLowerCase() || 'everything begins'}. ${roles} gather here, creating a stellium that amplifies ${st.sign}'s themes. ${signChar?.synthesis?.split('.').slice(0, 2).join('.') || ''}.`
      );
    } else if (analysis.clusters.length > 0) {
      const topClusters = analysis.clusters.slice(0, 2);
      for (const c of topClusters) {
        const signChar = SIGN_CHARACTERS[c.sign];
        const archetype = signChar?.archetype || c.sign;
        const roles = c.planets.map(n => getRole(n)).join(' and ');
        sentences.push(
          `${roles} cluster in ${c.sign} — ${archetype}'s territory. ${signChar?.elementEffect || ''}`
        );
      }
    } else if (analysis.dominantElement) {
      const el = analysis.dominantElement;
      const elementSigns = Object.entries(SIGN_CHARACTERS)
        .filter(([, s]) => s.element === el)
        .map(([name]) => name);
      const occupiedSigns = elementSigns.filter(s => {
        const posMap = Array.isArray(geoPositions)
          ? geoPositions.find(p => p.sign === s)
          : Object.values(geoPositions).find(p => p.sign === s);
        return posMap;
      });
      const archetypes = occupiedSigns.map(s => getSignArchetype(s)).join(', ');
      sentences.push(
        `The sky leans toward ${el} — the territory of ${archetypes}. ${el === 'fire' ? 'Initiative and expression dominate. The impulse is to act, to declare, to begin.' : el === 'earth' ? 'Structure and materiality dominate. The impulse is to build, to embody, to make real.' : el === 'air' ? 'Connection and thought dominate. The impulse is to communicate, to relate, to understand.' : 'Feeling and intuition dominate. The impulse is to dissolve, to feel, to surrender boundaries.'}`
      );
    }

    // Modality emphasis
    if (analysis.dominantModality) {
      const mod = analysis.dominantModality;
      sentences.push(
        `The dominant modality is ${mod} — ${mod === 'cardinal' ? 'the sky is initiating. Energy wants to start things, cross thresholds, begin new chapters. The pressure is toward action and departure.' : mod === 'fixed' ? 'the sky is consolidating. Energy wants to hold ground, deepen commitment, and refuse to let go until the work is complete.' : 'the sky is adapting. Energy wants to shift, translate, and dissolve fixed positions. The pressure is toward flexibility and release.'}`
      );
    }
  }

  // 2. Character spotlight — all notable dignities (expanded)
  if (geoPositions) {
    const rows = Array.isArray(geoPositions)
      ? geoPositions
      : Object.entries(geoPositions).map(([name, d]) => ({ name, ...d }));

    const empowered = [];
    const constrained = [];

    for (const r of rows) {
      if (!r.sign || !PLANET_CHARACTERS[r.name]) continue;
      const d = getDignity(r.name, r.sign);
      const char = PLANET_CHARACTERS[r.name];
      if (d === 'domicile') {
        empowered.push({ name: r.name, dignity: d, sign: r.sign });
        highlights.push({ planet: r.name, role: char.role, detail: d });
      } else if (d === 'exaltation') {
        empowered.push({ name: r.name, dignity: d, sign: r.sign });
        highlights.push({ planet: r.name, role: char.role, detail: d });
      } else if (d === 'detriment') {
        constrained.push({ name: r.name, dignity: d, sign: r.sign });
        highlights.push({ planet: r.name, role: char.role, detail: d });
      } else if (d === 'fall') {
        constrained.push({ name: r.name, dignity: d, sign: r.sign });
        highlights.push({ planet: r.name, role: char.role, detail: d });
      }
    }

    if (empowered.length > 0) {
      const parts = empowered.map(e => {
        const reading = getDignityReading(e.name, e.sign);
        return `${getTagged(e.name)} is ${e.dignity === 'domicile' ? 'home' : 'elevated'} in ${e.sign}. ${reading}`;
      });
      sentences.push(parts.join(' '));
    }

    if (constrained.length > 0) {
      const parts = constrained.map(c => {
        const reading = getDignityReading(c.name, c.sign);
        return `${getTagged(c.name)} is ${c.dignity === 'detriment' ? 'constrained' : 'in fall'} in ${c.sign}. ${reading}`;
      });
      sentences.push(parts.join(' '));
    }

    if (empowered.length === 0 && constrained.length === 0) {
      sentences.push('All planets are peregrine — traveling through signs that neither empower nor constrain them. The sky is neutral territory, with no planet operating from a position of particular strength or particular weakness.');
    }
  }

  // 3. Tightest aspect in character terms (expanded)
  if (geoAspects && geoAspects.length > 0) {
    const { tightest, tensions, flows, fusions } = findNotableAspects(geoAspects);
    if (tightest) {
      const tension = ASPECT_TENSIONS[tightest.aspect] || 'connection';
      const keyword1 = getKeyword(tightest.planet1);
      const keyword2 = getKeyword(tightest.planet2);
      const role1 = getRole(tightest.planet1);
      const role2 = getRole(tightest.planet2);
      const char1 = PLANET_CHARACTERS[tightest.planet1];
      const char2 = PLANET_CHARACTERS[tightest.planet2];
      sentences.push(
        `The tightest ${tension} runs between ${keyword1} and ${keyword2} — ${role1} ${ASPECT_VERBS[tightest.aspect] || 'meets'} ${role2} at ${tightest.orb}° orb. ${ASPECT_DRAMA[tightest.aspect] || ''}`
      );
      if (char1 && char2) {
        sentences.push(
          `${role1}'s question — ${char1.question} — intersects with ${role2}'s question — ${char2.question} The ${tightest.aspect.toLowerCase()} is where these two inquiries meet.`
        );
      }
    }

    // Aspect pattern summary
    if (tensions.length > 0 || flows.length > 0 || fusions.length > 0) {
      const parts = [];
      if (tensions.length > 0) parts.push(`${tensions.length} tension aspect${tensions.length > 1 ? 's' : ''} (squares and oppositions)`);
      if (flows.length > 0) parts.push(`${flows.length} flow aspect${flows.length > 1 ? 's' : ''} (trines and sextiles)`);
      if (fusions.length > 0) parts.push(`${fusions.length} fusion${fusions.length > 1 ? 's' : ''} (conjunctions)`);
      sentences.push(`The aspect pattern today: ${parts.join(', ')}. ${tensions.length > flows.length ? 'Tension dominates — the sky is pushing, not resting.' : flows.length > tensions.length ? 'Flow dominates — the sky supports movement and cooperation.' : 'Tension and flow are balanced — the sky provides both pressure and support.'}`);
    }
  }

  // 4. Shifts — expanded
  if (geoPositions && helioPositions) {
    const { shifts, shiftedNames, shiftedCount } = analyzeShifts(geoPositions, helioPositions);
    if (shiftedNames.length > 0) {
      const roles = shiftedNames.map(n => getRole(n));
      sentences.push(
        `From the Sun's vantage, ${roles.join(', ')} ${roles.length === 1 ? 'changes' : 'change'} territory — ${shiftedCount} of ${shifts.length} planets shift sign between Earth's perspective and the Sun's. What appears one way from the surface reveals a different configuration when the center looks outward. These shifts are where the recursive chart diverges most from the conventional one.`
      );
      // Detail each shift briefly
      for (const s of shifts.filter(x => x.shifted).slice(0, 3)) {
        const from = getSignArchetype(s.fromSign);
        const to = getSignArchetype(s.toSign);
        sentences.push(
          `${getRole(s.planet)}: ${from}'s ${getSignElement(s.fromSign)} → ${to}'s ${getSignElement(s.toSign)}.`
        );
      }
    } else {
      sentences.push('All planets hold their signs across both perspectives — the geocentric and heliocentric views agree. This is relatively uncommon and suggests a sky with structural consistency between surface and depth.');
    }
  }

  // 5. Solar cycle (expanded, with historical reversal dates)
  if (weatherData.solarCycle) {
    const sc = weatherData.solarCycle;
    const rule = getSolarCycleRule(sc.phase, sc.ascending);
    let solarNote = `Solar cycle ${sc.cycleNumber} is at ${rule.phase.toLowerCase()}. ${rule.meaning}`;
    if (sc.inReversal) {
      solarNote += ' The Sun\'s magnetic field is actively reversing right now — the poles are in transition.';
    } else if (sc.flipStart && sc.flipEnd) {
      const fmtDate = (d) => {
        const m = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        return `${m[d.getMonth()]} ${d.getFullYear()}`;
      };
      const fs = fmtDate(sc.flipStart);
      const fe = fmtDate(sc.flipEnd);
      if (sc.observed) {
        solarNote += fs === fe
          ? ` Polarity reversal observed around ${fs}.`
          : ` Polarity reversal observed from ${fs} to ${fe} (${sc.observed ? 'WSO/HMI magnetogram data' : 'estimated'}).`;
      } else {
        solarNote += ` Estimated reversal around ${fs}.`;
      }
    }
    solarNote += ' The Sun\'s ~11-year magnetic rhythm is the largest container the chart inhabits — everything else moves within it.';
    sentences.push(solarNote);
  }

  // 6. Personal transit connections (expanded)
  if (personalData && geoPositions) {
    const natalPositions = personalData.geocentric?.planets;
    if (natalPositions) {
      const natalMap = Array.isArray(natalPositions)
        ? Object.fromEntries(natalPositions.map(p => [p.name, p]))
        : natalPositions;
      const geoMap = Array.isArray(geoPositions)
        ? Object.fromEntries(geoPositions.map(p => [p.name, p]))
        : geoPositions;

      const activations = [];
      for (const [planet, transit] of Object.entries(geoMap)) {
        const natal = natalMap[planet];
        if (natal && natal.sign === transit.sign) {
          activations.push(planet);
        }
      }
      if (activations.length > 0) {
        const roles = activations.slice(0, 4).map(n => getRole(n));
        sentences.push(
          `Transit ${roles.join(', ')} now ${activations.length === 1 ? 'activates' : 'activate'} natal territory — the sky echoes your birth chart in ${activations.length === 1 ? 'this area' : 'these areas'}. When a transit planet occupies the same sign as its natal position, the themes of that placement are re-engaged, revisited, tested against the present.`
        );
      }
    }
  }

  let text = sentences.join(' ');
  if (frame === 'personal' && text) {
    text = text.replace(/The sky/g, 'Your sky').replace(/the sky/g, 'your sky');
  }

  return { text, highlights: highlights.slice(0, 5) };
}

/**
 * 5. narratePerspective — What a planet sees from its orbit, in character voice.
 */
export function narratePerspective(planetKey, perspectiveData, geoPositions, frame = 'weather') {
  if (!planetKey || !PLANET_CHARACTERS[planetKey]) {
    return { intro: '', observations: '' };
  }

  const char = PLANET_CHARACTERS[planetKey];

  // Intro: planet name with epithet as parenthetical
  let intro = `From ${planetKey}'s orbit — ${getEpithet(planetKey)} — ${char.theme} The question: ${char.question} The drive: ${char.drive.toLowerCase()} The fear: ${char.fear.toLowerCase()} Everything ${planetKey} sees is filtered through this lens — every other planet is either a resource, a threat, or an irrelevance to ${char.keyword}.`;
  intro = applyFrame(intro, planetKey, frame);

  // Observations: expanded — cover aspects, dignity, and shifts
  const observationParts = [];

  // Archetypal polarity
  observationParts.push(
    `${planetKey}'s archetype is ${char.archetype}. The shadow: ${char.shadow} The light: ${char.light}`
  );

  if (perspectiveData?.aspects?.length > 0) {
    const { tightest, tensions, flows, fusions } = findNotableAspects(perspectiveData.aspects);

    if (tightest) {
      const target = tightest.planet1 === planetKey ? tightest.planet2 : tightest.planet1;
      const targetRole = getRole(target);
      const targetChar = PLANET_CHARACTERS[target];
      const verb = ASPECT_VERBS[tightest.aspect] || 'meets';
      const tensionType = ASPECT_TENSIONS[tightest.aspect] || 'connection';
      observationParts.push(
        `${planetKey} ${verb} ${targetRole} most closely (${tightest.aspect}, ${tightest.orb}° orb). This is the primary relationship from ${planetKey}'s vantage — ${char.keyword} and ${getKeyword(target)} in ${tensionType}.${targetChar ? ` ${targetRole}'s question — ${targetChar.question} — is the loudest voice ${planetKey} hears right now.` : ''}`
      );
    }

    if (tensions.length > 0) {
      const tensionDetails = tensions.slice(0, 3).map(a => {
        const target = a.planet1 === planetKey ? a.planet2 : a.planet1;
        return `${getRole(target)} (${a.aspect}, ${a.orb}°)`;
      });
      observationParts.push(
        `Tension from: ${tensionDetails.join('; ')}. These are the friction points in ${planetKey}'s sky — the places where ${char.keyword} is challenged, resisted, or forced to adapt.`
      );
    }

    if (flows.length > 0) {
      const flowDetails = flows.slice(0, 3).map(a => {
        const target = a.planet1 === planetKey ? a.planet2 : a.planet1;
        return `${getRole(target)} (${a.aspect}, ${a.orb}°)`;
      });
      observationParts.push(
        `Flow with: ${flowDetails.join('; ')}. These are the support lines — the relationships that reinforce ${char.keyword} without resistance.`
      );
    }

    if (fusions.length > 0) {
      const fusionDetails = fusions.map(a => {
        const target = a.planet1 === planetKey ? a.planet2 : a.planet1;
        return getRole(target);
      });
      observationParts.push(
        `Fused with: ${fusionDetails.join(', ')}. These planets share ${planetKey}'s space — their drives are indistinguishable from ${char.keyword} at this distance.`
      );
    }

    // Total aspect count
    observationParts.push(
      `Total: ${perspectiveData.aspects.length} aspects from ${planetKey}'s vantage — ${tensions.length} tension, ${flows.length} flow, ${fusions.length} fusion.`
    );
  } else {
    observationParts.push(`${planetKey} forms no major aspects from this vantage — ${char.keyword} operates in relative isolation. The drive continues, but without significant contact from other planets.`);
  }

  // Check for sign shifts from this vantage vs geocentric
  if (perspectiveData?.positions && geoPositions) {
    const perspRows = Array.isArray(perspectiveData.positions)
      ? perspectiveData.positions
      : Object.entries(perspectiveData.positions).map(([name, d]) => ({ name, ...d }));
    const geoMap = Array.isArray(geoPositions)
      ? Object.fromEntries(geoPositions.map(p => [p.name, p]))
      : geoPositions;

    const shifted = perspRows.filter(r => {
      const geo = geoMap[r.name];
      return geo && r.sign !== geo.sign;
    });

    if (shifted.length > 0) {
      const shiftDetails = shifted.slice(0, 3).map(s => {
        const geo = geoMap[s.name];
        return `${getRole(s.name)} appears in ${s.sign} (from Earth: ${geo.sign})`;
      });
      observationParts.push(
        `From ${planetKey}'s orbit, the map rearranges: ${shiftDetails.join('; ')}. What Earth sees and what ${planetKey} sees are different skies — the recursive perspective reveals structure hidden from the surface.`
      );
    } else {
      observationParts.push(`From ${planetKey}'s orbit, all planets remain in the same signs as seen from Earth — the perspectives agree. ${planetKey} and the ground-level view share the same map.`);
    }
  }

  let observations = observationParts.join(' ');
  observations = applyFrame(observations, planetKey, frame);

  return { intro, observations };
}

/**
 * 6. narrateNatalPosition — Birth-specific position narrative.
 *    Speaks in permanent, origin terms — not "travels through" but "you were born into."
 */
export function narrateNatalPosition(position, natalChart) {
  if (!position || !position.name || !position.sign) {
    return { role: '', dignity: '', text: '', signDemand: '' };
  }

  const { name, sign } = position;
  const char = PLANET_CHARACTERS[name];
  const signChar = SIGN_CHARACTERS[sign];
  if (!char || !signChar) {
    return { role: name, dignity: 'peregrine', text: '', signDemand: '' };
  }

  const keyword = char.keyword;
  const archetype = signChar.archetype;
  const dignity = getDignity(name, sign);
  const dignityReading = getDignityReading(name, sign);
  const element = signChar.element;
  const modality = signChar.modality;

  const sentences = [];

  // Sentence 1: The permanent placement — tagged first mention
  if (dignity === 'domicile') {
    sentences.push(
      `You were born with ${getTagged(name)} in its own territory — ${archetype}'s house (${sign}, ${dignity}). This is ${name}'s home ground, the most natural expression of ${keyword} available to you.`
    );
  } else if (dignity === 'exaltation') {
    sentences.push(
      `You were born with ${getTagged(name)} elevated in ${archetype}'s territory (${sign}, ${dignity}). Your ${keyword} operates at an amplified register — not home, but honored.`
    );
  } else if (dignity === 'detriment') {
    sentences.push(
      `You were born with ${getTagged(name)} in hostile territory — ${archetype}'s domain (${sign}, ${dignity}). Your ${keyword} works against the grain here, a lifelong negotiation with an environment that does not naturally support it.`
    );
  } else if (dignity === 'fall') {
    sentences.push(
      `You were born with ${getTagged(name)} undermined in ${archetype}'s territory (${sign}, ${dignity}). Your ${keyword} cannot rely on its usual authority — it has had to develop entirely different strategies from the start.`
    );
  } else {
    sentences.push(
      `You were born with ${getTagged(name)} in ${archetype}'s territory (${sign}). Your ${keyword} adapts to foreign ground — neither empowered nor constrained, but learning ${archetype}'s dialect.`
    );
  }

  // Sentence 2: The full dignity reading from character profile
  sentences.push(dignityReading);

  // Sentence 3: Sign demand as lifelong negotiation
  sentences.push(
    `${sign}'s demand — ${signChar.demand} — is not a passing condition. This is the ground your ${keyword} stands on for life.`
  );

  // Sentence 4: Element and modality as constitutional temperament
  sentences.push(
    `Your ${keyword} operates through ${element} in ${modality} mode — this is constitutional temperament, not a phase. ${signChar.elementEffect} ${signChar.modalityEffect}`
  );

  // Sentence 5: The drive meeting the archetype — permanent edition, planet name only
  sentences.push(
    `${name}'s drive — ${char.drive.toLowerCase()} — lives permanently within ${archetype}'s insistence on ${signChar.keyword}. This is not a transit to be waited out but a structural feature of how you experience ${keyword}.`
  );

  return {
    role: name,
    dignity,
    text: sentences.join(' '),
    signDemand: signChar.demand,
  };
}

/**
 * 7. narrateNatalAspect — Birth-specific aspect narrative.
 *    Same structure as narrateAspect but framed in permanent terms.
 */
export function narrateNatalAspect(aspect, natalPositions) {
  if (!aspect || !aspect.planet1 || !aspect.planet2) {
    return { text: '', tension: '', dignityContrast: '' };
  }

  const { planet1, planet2, aspect: aspectType, orb } = aspect;
  const char1 = PLANET_CHARACTERS[planet1];
  const char2 = PLANET_CHARACTERS[planet2];
  const role1 = getRole(planet1);
  const role2 = getRole(planet2);
  const keyword1 = getKeyword(planet1);
  const keyword2 = getKeyword(planet2);
  const verb = ASPECT_VERBS[aspectType] || 'meets';
  const tension = ASPECT_TENSIONS[aspectType] || 'connection';

  // Sentence 1: The permanent aspect statement
  const s1 = `You were born with ${role1} ${verb} ${role2} — ${keyword1} and ${keyword2} are wired together in your chart.`;

  // Sentence 2: Permanence framing
  const s2 = `This is not a passing transit. This ${aspectType.toLowerCase()} shapes how ${keyword1} and ${keyword2} relate for your entire life.`;

  // Sentence 3: The drama of this aspect type
  const s3 = ASPECT_DRAMA[aspectType] || '';

  // Sentence 4: What each planet wants — their drives
  let s4 = '';
  if (char1 && char2) {
    if (tension === 'tension') {
      s4 = `${role1} wants ${char1.drive.toLowerCase()} ${role2} wants ${char2.drive.toLowerCase()} These drives do not naturally cooperate — the ${aspectType.toLowerCase()} is a permanent friction point, not a temporary challenge.`;
    } else if (tension === 'fusion') {
      s4 = `${role1} wants ${char1.drive.toLowerCase()} ${role2} wants ${char2.drive.toLowerCase()} In conjunction, these drives have never been separate for you — a single compound impulse that has shaped your experience from the beginning.`;
    } else {
      s4 = `${role1} wants ${char1.drive.toLowerCase()} ${role2} wants ${char2.drive.toLowerCase()} The ${aspectType.toLowerCase()} has supported these drives your whole life — an innate resource, not something you had to build.`;
    }
  }

  // Sentence 5: Orb tightness
  let s5 = '';
  if (orb !== undefined) {
    if (orb < 1) {
      s5 = `At ${orb}° orb, this is an exact natal aspect — one of the defining features of your chart's architecture, present from your first breath.`;
    } else if (orb < 3) {
      s5 = `At ${orb}° orb, the contact is tight — a dominant relationship in your birth chart, always active in the background of your experience.`;
    } else {
      s5 = `At ${orb}° orb, the contact is present but not the chart's tightest — a secondary thread in your natal pattern, activated by transits and progressions.`;
    }
  }

  // Dignity contrast — using the same logic as narrateAspect
  let dignityContrast = '';
  if (natalPositions) {
    const posMap = Array.isArray(natalPositions)
      ? Object.fromEntries(natalPositions.map(p => [p.name, p]))
      : natalPositions;

    const pos1 = posMap[planet1];
    const pos2 = posMap[planet2];

    if (pos1?.sign && pos2?.sign) {
      const d1 = getDignity(planet1, pos1.sign);
      const d2 = getDignity(planet2, pos2.sign);
      const notable1 = d1 !== 'peregrine';
      const notable2 = d2 !== 'peregrine';

      if (notable1 && notable2) {
        const strong1 = d1 === 'domicile' || d1 === 'exaltation';
        const strong2 = d2 === 'domicile' || d2 === 'exaltation';
        if (strong1 && !strong2) {
          dignityContrast = `In your chart, ${role1} holds strength (${d1} in ${pos1.sign}) while ${role2} is constrained (${d2} in ${pos2.sign}). This power imbalance is permanent — ${keyword1} has always had the upper hand, and ${keyword2} has always had to adapt.`;
        } else if (!strong1 && strong2) {
          dignityContrast = `In your chart, ${role2} holds strength (${d2} in ${pos2.sign}) while ${role1} is constrained (${d1} in ${pos1.sign}). The power imbalance is permanent — ${keyword2} has always had the upper hand.`;
        } else if (strong1 && strong2) {
          dignityContrast = `Both planets are empowered in your chart — ${role1} in ${d1} (${pos1.sign}), ${role2} in ${d2} (${pos2.sign}). Two well-placed characters aspecting each other from birth — this dynamic has been potent your entire life.`;
        } else {
          dignityContrast = `Both planets are constrained in your chart — ${role1} in ${d1} (${pos1.sign}), ${role2} in ${d2} (${pos2.sign}). Two characters working against the grain since birth, their aspect carrying an undertone of lifelong frustration.`;
        }
      } else if (notable1) {
        const strong1 = d1 === 'domicile' || d1 === 'exaltation';
        dignityContrast = `${role1} is ${strong1 ? 'empowered' : 'constrained'} in ${pos1.sign} (${d1}) since birth — this colors how ${keyword1} has always shown up in this aspect.`;
      } else if (notable2) {
        const strong2 = d2 === 'domicile' || d2 === 'exaltation';
        dignityContrast = `${role2} is ${strong2 ? 'empowered' : 'constrained'} in ${pos2.sign} (${d2}) since birth — this colors how ${keyword2} has always shown up in this aspect.`;
      }
    }
  }

  const text = [s1, s2, s3, s4, s5, dignityContrast].filter(Boolean).join(' ');

  return { text, tension, dignityContrast };
}

/**
 * 8. narrateNatalSynopsis — Birth-chart-specific synopsis.
 *    The personal reading's centerpiece — grounded in birth moment, not weather.
 */
export function narrateNatalSynopsis(recursiveData, natalChart) {
  if (!recursiveData || !natalChart) return { text: '', highlights: [] };

  const sentences = [];
  const highlights = [];
  const birthData = natalChart.birthData || {};

  // 1. Birth moment header
  const dateStr = formatBirthDate(birthData);
  const city = birthData.city || '';
  const birthSC = recursiveData.birthSolarCycle;
  if (dateStr) {
    let header = `Born ${dateStr}`;
    if (city) header += ` in ${city}`;
    header += '.';
    if (birthSC) {
      header += ` Solar cycle ${birthSC.cycleNumber} at ${birthSC.phase < 0.05 || birthSC.phase > 0.95 ? 'solar minimum' : birthSC.phase > 0.4 && birthSC.phase < 0.6 ? 'solar maximum' : birthSC.ascending ? 'ascending phase' : 'descending phase'}.`;
    }
    sentences.push(header);
  }

  // 2. Ascendant (if available)
  if (natalChart.ascendant && natalChart.ascendant.sign) {
    const asc = natalChart.ascendant;
    const signChar = SIGN_CHARACTERS[asc.sign];
    const archetype = signChar?.archetype || asc.sign;
    let ascText = `Rising sign: ${asc.sign}`;
    if (typeof asc.degree === 'number') ascText += ` ${asc.degree.toFixed(1)}°`;
    ascText += ` — ${archetype}.`;
    if (signChar?.demand) {
      ascText += ` ${signChar.demand}`;
    }
    ascText += ' This is the lens through which the world first sees you.';
    sentences.push(ascText);
  }

  const geoPositions = recursiveData.geocentric?.planets;
  const helioPositions = recursiveData.heliocentric?.planets;
  const geoAspects = recursiveData.geocentric?.aspects;

  // 3. Element/modality balance
  if (geoPositions) {
    const analysis = analyzePositions(geoPositions);
    if (analysis.dominantElement && analysis.dominantModality) {
      sentences.push(
        `Your chart leans toward ${analysis.dominantElement} / ${analysis.dominantModality} — your constitutional mode. ${analysis.dominantElement === 'fire' ? 'Initiative and expression are your default settings.' : analysis.dominantElement === 'earth' ? 'Structure and embodiment are your default settings.' : analysis.dominantElement === 'air' ? 'Connection and thought are your default settings.' : 'Feeling and intuition are your default settings.'}`
      );
    } else if (analysis.dominantElement) {
      sentences.push(`Your chart leans toward ${analysis.dominantElement} — this colors how you approach everything.`);
    }

    // Stellium in natal chart
    if (analysis.stelliums.length > 0) {
      const st = analysis.stelliums[0];
      const signChar = SIGN_CHARACTERS[st.sign];
      const roles = st.planets.map(n => getRole(n)).join(', ');
      sentences.push(
        `A natal stellium in ${st.sign} — ${roles} concentrated in ${signChar?.archetype || st.sign}'s territory since birth. This is a permanent center of gravity in your chart.`
      );
    }
  }

  // 4. Strongest dignities
  if (geoPositions) {
    const rows = Array.isArray(geoPositions)
      ? geoPositions
      : Object.entries(geoPositions).map(([name, d]) => ({ name, ...d }));

    const notable = [];
    for (const r of rows) {
      if (!r.sign || !PLANET_CHARACTERS[r.name]) continue;
      const d = getDignity(r.name, r.sign);
      if (d !== 'peregrine') {
        const char = PLANET_CHARACTERS[r.name];
        const reading = getDignityReading(r.name, r.sign);
        notable.push({ name: r.name, dignity: d, sign: r.sign, role: char.role, reading });
        highlights.push({ planet: r.name, role: char.role, detail: d });
      }
    }

    if (notable.length > 0) {
      const parts = notable.map(n => {
        const strong = n.dignity === 'domicile' || n.dignity === 'exaltation';
        return `${getTagged(n.name)} is ${strong ? (n.dignity === 'domicile' ? 'home' : 'elevated') : (n.dignity === 'detriment' ? 'constrained' : 'in fall')} in ${n.sign} since birth. ${n.reading}`;
      });
      sentences.push(parts.join(' '));
    }
  }

  // 5. Natal aspect pattern
  if (geoAspects && geoAspects.length > 0) {
    const { tightest, tensions, flows, fusions } = findNotableAspects(geoAspects);

    // Tension vs flow count
    const parts = [];
    if (tensions.length > 0) parts.push(`${tensions.length} tension aspect${tensions.length > 1 ? 's' : ''}`);
    if (flows.length > 0) parts.push(`${flows.length} flow aspect${flows.length > 1 ? 's' : ''}`);
    if (fusions.length > 0) parts.push(`${fusions.length} fusion${fusions.length > 1 ? 's' : ''}`);
    if (parts.length > 0) {
      sentences.push(
        `Your natal aspect pattern: ${parts.join(', ')}. ${tensions.length > flows.length ? 'Tension dominates your chart — you were built for friction, challenge, and forced growth.' : flows.length > tensions.length ? 'Flow dominates your chart — you were built for ease, support, and natural momentum.' : 'Tension and flow are balanced — your chart provides both pressure and support in equal measure.'}`
      );
    }

    // Tightest natal aspect in character terms
    if (tightest) {
      const role1 = getRole(tightest.planet1);
      const role2 = getRole(tightest.planet2);
      const keyword1 = getKeyword(tightest.planet1);
      const keyword2 = getKeyword(tightest.planet2);
      sentences.push(
        `The tightest natal aspect: ${role1} ${ASPECT_VERBS[tightest.aspect] || 'meets'} ${role2} at ${tightest.orb}° orb — ${keyword1} and ${keyword2} are the most tightly wired pair in your chart.`
      );
    }
  }

  // 6. Heliocentric divergence
  if (geoPositions && helioPositions) {
    const { shiftedNames, shiftedCount, shifts } = analyzeShifts(geoPositions, helioPositions);
    if (shiftedNames.length > 0) {
      const roles = shiftedNames.map(n => getRole(n));
      sentences.push(
        `At birth, ${roles.join(', ')} ${roles.length === 1 ? 'occupied a different sign' : 'occupied different signs'} from the Sun's vantage than from Earth's — ${shiftedCount} of ${shifts.length} planets shift between surface identity and deeper structure. This is the gap between how you appear and what drives you underneath.`
      );
    } else {
      sentences.push(
        'All your natal planets hold the same sign from both Earth and the Sun — unusual structural consistency between surface and depth in your chart.'
      );
    }
  }

  // 7. Chinese astrology
  if (natalChart.chinese?.pillar) {
    sentences.push(
      `In the Chinese system: ${natalChart.chinese.pillar} — a cross-cultural anchor point for this birth moment.`
    );
  }

  // 8. Solar cycle at birth vs now
  if (birthSC && recursiveData.solarCycle) {
    const currentSC = recursiveData.solarCycle;
    const birthPhaseLabel = birthSC.phase < 0.05 || birthSC.phase > 0.95 ? 'solar minimum' : birthSC.phase > 0.4 && birthSC.phase < 0.6 ? 'solar maximum' : birthSC.ascending ? 'ascending' : 'descending';
    const currentPhaseLabel = currentSC.phase < 0.05 || currentSC.phase > 0.95 ? 'solar minimum' : currentSC.phase > 0.4 && currentSC.phase < 0.6 ? 'solar maximum' : currentSC.ascending ? 'ascending' : 'descending';
    if (birthPhaseLabel !== currentPhaseLabel) {
      let scText = `You were born at ${birthPhaseLabel} (cycle ${birthSC.cycleNumber}); the Sun is now at ${currentPhaseLabel} (cycle ${currentSC.cycleNumber}).`;
      if (birthSC.observed) {
        const fmtDate = (d) => {
          const m = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
          return `${m[d.getMonth()]} ${d.getFullYear()}`;
        };
        scText += ` Your birth cycle's reversal was recorded ${fmtDate(birthSC.flipStart)} – ${fmtDate(birthSC.flipEnd)}.`;
      }
      scText += ' The electromagnetic container has shifted since your birth.';
      sentences.push(scText);
    }
  }

  return { text: sentences.join(' '), highlights: highlights.slice(0, 5) };
}

/** Format birth date from natalChart.birthData fields. */
function formatBirthDate(birthData) {
  if (!birthData) return '';
  const { year, month, day, hour, minute } = birthData;
  if (!year || !month || !day) return '';

  const months = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const monthName = months[(month - 1)] || '';

  let str = `${monthName} ${day}, ${year}`;
  if (hour != null && minute != null) {
    const h = hour % 12 || 12;
    const ampm = hour < 12 ? 'AM' : 'PM';
    const m = String(minute).padStart(2, '0');
    str += ` at ${h}:${m} ${ampm}`;
  }
  return str;
}

/**
 * 9. narrateSectionIntro — Augments static section intros with
 *    character-specific contextual sentences.
 */
export function narrateSectionIntro(sectionKey, weatherData, frame = 'weather') {
  if (!weatherData) return '';

  const geoPositions = weatherData.geocentric?.planets;
  const helioPositions = weatherData.heliocentric?.planets;
  const geoAspects = weatherData.geocentric?.aspects;

  switch (sectionKey) {
    case 'geocentric': {
      if (!geoPositions) return '';
      const analysis = analyzePositions(geoPositions);
      const parts = [];

      if (analysis.dominantElement) {
        parts.push(`${frame === 'personal' ? 'Your sky' : "Today's shared sky"} leans toward ${analysis.dominantElement} — ${analysis.dominantElement === 'fire' ? 'initiative and expression' : analysis.dominantElement === 'earth' ? 'structure and materiality' : analysis.dominantElement === 'air' ? 'connection and thought' : 'feeling and intuition'}.`);
      }
      if (analysis.dominantModality) {
        parts.push(`The dominant modality is ${analysis.dominantModality} — ${analysis.dominantModality === 'cardinal' ? 'the energy initiates' : analysis.dominantModality === 'fixed' ? 'the energy consolidates' : 'the energy adapts'}.`);
      }
      if (analysis.stelliums.length > 0) {
        const st = analysis.stelliums[0];
        parts.push(`A stellium in ${st.sign} — ${st.planets.map(n => getRole(n)).join(', ')} concentrated in ${getSignArchetype(st.sign)}'s territory.`);
      }

      return parts.join(' ') || '';
    }

    case 'departure': {
      if (!geoPositions || !helioPositions) return '';
      const { shiftedNames, shifts, shiftedCount } = analyzeShifts(geoPositions, helioPositions);
      if (shiftedNames.length === 0) {
        return 'All planets hold their signs in the crossing — the surface and the depth agree. This is a sky with unusual structural consistency.';
      }
      const roles = shiftedNames.slice(0, 4).map(n => getRole(n));
      const details = shifts.filter(s => s.shifted).slice(0, 3).map(s =>
        `${getRole(s.planet)}: ${s.fromSign} → ${s.toSign}`
      );
      let text = `${frame === 'personal' ? 'In your chart' : 'Today'}, ${roles.join(', ')} ${roles.length === 1 ? 'changes' : 'change'} territory in the crossing — ${shiftedCount} of ${shifts.length} planets see a different sign from the Sun's vantage. ${details.join('. ')}.`;
      return text;
    }

    case 'perspectives': {
      const parts = ['Each planet carries its own sky — what it sees colors what it means.'];
      if (geoPositions) {
        const rows = Array.isArray(geoPositions)
          ? geoPositions
          : Object.entries(geoPositions).map(([name, d]) => ({ name, ...d }));
        const dignified = rows.filter(r => {
          if (!PLANET_CHARACTERS[r.name]) return false;
          const d = getDignity(r.name, r.sign);
          return d !== 'peregrine';
        });
        if (dignified.length > 0) {
          const notes = dignified.slice(0, 3).map(r => {
            const d = getDignity(r.name, r.sign);
            return `${getRole(r.name)} (${d} in ${r.sign})`;
          });
          parts.push(`Notable conditions: ${notes.join(', ')}. These planets carry their dignity into every aspect they form.`);
        }
      }
      return parts.join(' ');
    }

    case 'integration': {
      return 'Every perspective contains every other. The recursive network has no privileged vantage — each planet\'s chart includes every other planet, and the web of mutual awareness is the actual structure. No single perspective tells the whole story; only the pattern across all of them approaches completeness.';
    }

    case 'solarCycle': {
      if (!weatherData.solarCycle) return '';
      const sc = weatherData.solarCycle;
      const rule = getSolarCycleRule(sc.phase, sc.ascending);
      let text = `The Sun's magnetic field is at ${rule.phase.toLowerCase()} — cycle ${sc.cycleNumber}. ${rule.meaning}`;
      if (sc.inReversal) {
        text += ' The field is actively reversing — both poles are in transition. This is the transformation point the entire cycle builds toward.';
      } else if (sc.flipStart && sc.observed) {
        const fmtDate = (d) => {
          const m = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
          return `${m[d.getMonth()]} ${d.getFullYear()}`;
        };
        text += ` This cycle's polarity reversal was observed ${fmtDate(sc.flipStart)} – ${fmtDate(sc.flipEnd)}.`;
      }
      text += ' This is the meta-rhythm that contains every other cycle the chart describes.';
      return text;
    }

    default:
      return '';
  }
}

// ── Phase 1: House, Angle, Node, PoF, Mutual Reception narratives ───────────

/**
 * Narrate a planet's house placement.
 *
 * @param {string} planet — 'Mars', 'Venus', etc.
 * @param {number} house — 1-12
 * @param {string} sign — zodiac sign
 * @param {string} [dignity] — 'domicile', 'exaltation', etc.
 * @returns {string}
 */
export function narrateHousePlacement(planet, house, sign, dignity) {
  const char = PLANET_CHARACTERS[planet];
  const houseMeaning = HOUSE_MEANINGS[house];
  if (!char || !houseMeaning) return '';

  const dignityNote = dignity && dignity !== 'peregrine'
    ? ` (${dignity} in ${sign})`
    : '';

  return `${char.role}${dignityNote} occupies the ${ordinal(house)} house — ${houseMeaning.name}. ${houseMeaning.theme} ${char.keyword} expresses through ${houseMeaning.keyword} here.`;
}

/**
 * Narrate Ascendant and Midheaven angles.
 *
 * @param {object} ascendant — { sign, degree }
 * @param {object} midheaven — { sign, degree }
 * @returns {string}
 */
export function narrateAngles(ascendant, midheaven) {
  const parts = [];

  if (ascendant) {
    const ascSign = SIGN_CHARACTERS?.[ascendant.sign];
    const ascMeaning = ANGLE_MEANINGS.Ascendant;
    parts.push(
      `The Ascendant rises in ${ascendant.sign} at ${ascendant.degree}°. ${ascMeaning.theme}${ascSign ? ` ${ascSign.archetype || ascendant.sign} sets the tone for how the world is met.` : ''}`
    );

    // Descendant is opposite
    const SIGNS_LIST = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
    const dscIdx = (ascendant.signIndex + 6) % 12;
    parts.push(
      `The Descendant falls in ${SIGNS_LIST[dscIdx]}. ${ANGLE_MEANINGS.Descendant.theme}`
    );
  }

  if (midheaven) {
    const mcMeaning = ANGLE_MEANINGS.Midheaven;
    parts.push(
      `The Midheaven reaches ${midheaven.sign} at ${midheaven.degree}°. ${mcMeaning.theme}`
    );

    // IC is opposite
    const SIGNS_LIST = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
    const icIdx = (midheaven.signIndex + 6) % 12;
    parts.push(
      `The IC rests in ${SIGNS_LIST[icIdx]}. ${ANGLE_MEANINGS.IC.theme}`
    );
  }

  return parts.join(' ');
}

/**
 * Narrate the lunar nodal axis.
 *
 * @param {{ northNode: { sign, degree }, southNode: { sign, degree } }} nodes
 * @param {string} frame — 'weather' or 'personal'
 * @returns {string}
 */
export function narrateLunarNodes(nodes, frame = 'weather') {
  if (!nodes) return '';

  const nn = nodes.northNode;
  const sn = nodes.southNode;
  const nnMeaning = LUNAR_NODE_MEANINGS.northNode;
  const snMeaning = LUNAR_NODE_MEANINGS.southNode;

  const nnSign = SIGN_CHARACTERS?.[nn.sign];
  const snSign = SIGN_CHARACTERS?.[sn.sign];

  const nnKeyword = nnSign?.keyword || nn.sign;
  const snKeyword = snSign?.keyword || sn.sign;

  const intro = frame === 'personal'
    ? 'Your nodal axis'
    : 'The nodal axis';

  return `${intro} runs from ${nn.sign} (North Node, ${nn.degree}°) to ${sn.sign} (South Node, ${sn.degree}°). ${nnMeaning.theme} ${snMeaning.theme} The North Node in ${nn.sign} asks for growth through ${nnKeyword}. The South Node in ${sn.sign} carries mastery of ${snKeyword} — gifts to draw on, not to cling to.`;
}

/**
 * Narrate the Part of Fortune.
 *
 * @param {object} pof — { sign, degree, isDayChart }
 * @returns {string}
 */
export function narratePartOfFortune(pof) {
  if (!pof) return '';
  const signChar = SIGN_CHARACTERS?.[pof.sign];
  const keyword = signChar?.keyword || pof.sign;
  return `The Part of Fortune falls at ${pof.degree}° ${pof.sign} (${pof.isDayChart ? 'day' : 'night'} chart formula). ${PART_OF_FORTUNE_MEANING.theme} Fulfillment flows most naturally through the qualities of ${pof.sign} — ${keyword}.`;
}

/**
 * Narrate mutual receptions.
 *
 * @param {Array<{ planet1, sign1, planet2, sign2 }>} receptions
 * @returns {string}
 */
export function narrateMutualReception(receptions) {
  if (!receptions || receptions.length === 0) return '';

  const parts = receptions.map(r => {
    const char1 = PLANET_CHARACTERS[r.planet1];
    const char2 = PLANET_CHARACTERS[r.planet2];
    const role1 = char1?.role || r.planet1;
    const role2 = char2?.role || r.planet2;
    return `${role1} in ${r.sign1} and ${role2} in ${r.sign2} form a mutual reception — each in the other's home sign. ${MUTUAL_RECEPTION_MEANING.theme}`;
  });

  return parts.join(' ');
}

/** Ordinal suffix helper: 1 → "1st", 2 → "2nd", etc. */
function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// ── Phase 2: Dignity-weighted voice + EM field narratives ────────────────────

/**
 * Get a dignity-modulated verb for a planet's action.
 * Dignified planets "command", "radiate"; debilitated "struggle", "adapt".
 */
export function getDignityVerb(planet, sign) {
  const w = getDignityWeight(planet, sign);
  if (w >= 2) return 'commands';
  if (w === 1) return 'radiates';
  if (w === -1) return 'struggles with';
  if (w <= -2) return 'is constrained by';
  return 'carries';
}

/**
 * Narrate the EM field's influence on an aspect or planet.
 *
 * @param {string} planet — planet name
 * @param {{ fieldType, fieldStrength, flipped }} fieldData — from computeFieldTopology
 * @param {Array} aspects — aspects this planet participates in
 * @param {object} solarCycle — solar cycle phase
 * @returns {string}
 */
export function narrateFieldInfluence(planet, fieldData, aspects, solarCycle) {
  if (!fieldData) return '';
  const mod = EM_ASPECT_MODIFIERS[planet];
  if (!mod) return '';

  const parts = [];

  // Base field note
  parts.push(mod.fieldNote);

  // Sun-specific: polarity flip
  if (planet === 'Sun' && fieldData.flipped && mod.flippedNote) {
    parts.push(mod.flippedNote);
  }

  // If this planet participates in tight aspects, note the EM modifier
  if (aspects && aspects.length > 0) {
    const tight = aspects.filter(a =>
      a.orb < 3 && (a.planet1 === planet || a.planet2 === planet)
    );
    if (tight.length > 0 && mod.asAspector) {
      parts.push(mod.asAspector);
    }
  }

  return parts.join(' ');
}

/**
 * Narrate a deep perspective — enhanced carried experience with vision character.
 *
 * @param {string} planetKey — planet name
 * @param {object} perspectiveData — { positions, aspects }
 * @param {object} geoPositions — geocentric positions for context
 * @returns {{ intro, observations, visionNarrative }}
 */
export function narrateDeepPerspective(planetKey, perspectiveData, geoPositions) {
  const char = PLANET_CHARACTERS[planetKey];
  const vision = VISION_CHARACTERS[planetKey];
  if (!char || !vision) return { intro: '', observations: '', visionNarrative: '' };

  const parts = [];

  // Unique vantage
  parts.push(`${planetKey}'s vantage: ${vision.uniqueVantage}`);

  // Blind spot
  parts.push(`The blind spot: ${vision.blindSpot}`);

  // Carried experience
  parts.push(vision.carried);

  // What this planet CAN see vs CANNOT see
  if (perspectiveData?.positions) {
    const visible = Object.keys(perspectiveData.positions);
    const allPlanets = ['Sun', 'Moon', 'Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn'];
    const hidden = allPlanets.filter(p => p !== planetKey && !visible.includes(p));

    if (hidden.length > 0) {
      parts.push(`From ${planetKey}'s orbit, ${hidden.join(' and ')} ${hidden.length === 1 ? 'is' : 'are'} not directly observable.`);
    }
  }

  // Dignity voice — how this planet speaks from its current sign
  if (geoPositions) {
    const geoMap = Array.isArray(geoPositions)
      ? Object.fromEntries(geoPositions.map(p => [p.name, p]))
      : geoPositions;
    const pos = geoMap[planetKey];
    if (pos?.sign) {
      const voice = getDignityVoice(planetKey, pos.sign);
      if (voice) {
        parts.push(`In ${pos.sign}, ${char.role} ${voice}.`);
      }
    }
  }

  return {
    intro: `From ${planetKey}'s orbit — ${vision.innerOuter} planet, ${vision.orbitalSpeed}, ${vision.sunProximity} from the Sun.`,
    observations: parts.join(' '),
    visionNarrative: vision.carried,
  };
}

// ── Phase 3: Transit activation with rich narrative ──────────────────────────

/**
 * Narrate a transit activation with full interpretive depth.
 *
 * @param {object} transitAspect — { transitPlanet, natalPlanet, aspect, orb, exact }
 * @param {object} transitPositions — current sky positions
 * @param {object} natalPositions — birth positions
 * @param {object} natalChart — full natal chart (for house context)
 * @returns {string}
 */
export function narrateTransitActivation(transitAspect, transitPositions, natalPositions, natalChart) {
  if (!transitAspect) return '';

  const { transitPlanet, natalPlanet, aspect, orb, exact } = transitAspect;
  const tChar = PLANET_CHARACTERS[transitPlanet];
  const nChar = PLANET_CHARACTERS[natalPlanet];
  if (!tChar || !nChar) return '';

  const tRole = tChar.role;
  const nRole = nChar.role;
  const verb = ASPECT_VERBS[aspect] || 'meets';
  const tension = ASPECT_TENSIONS[aspect] || 'connection';

  const parts = [];

  // Core description
  parts.push(
    `Transit ${tRole} ${verb} natal ${nRole} (${aspect}, ${orb}° orb${exact ? ' — exact' : ''}).`
  );

  // Dignity context for both planets
  const tMap = Array.isArray(transitPositions)
    ? Object.fromEntries(transitPositions.map(p => [p.name, p]))
    : (transitPositions || {});
  const nMap = Array.isArray(natalPositions)
    ? Object.fromEntries(natalPositions.map(p => [p.name, p]))
    : (natalPositions || {});

  const tPos = tMap[transitPlanet];
  const nPos = nMap[natalPlanet];

  if (tPos?.sign) {
    const tVerb = getDignityVerb(transitPlanet, tPos.sign);
    parts.push(`Transit ${transitPlanet} ${tVerb} from ${tPos.sign}.`);
  }
  if (nPos?.sign) {
    const nWeight = getDignityWeight(natalPlanet, nPos.sign);
    if (nWeight >= 1) {
      parts.push(`Natal ${natalPlanet} receives this from a position of strength in ${nPos.sign}.`);
    } else if (nWeight <= -1) {
      parts.push(`Natal ${natalPlanet} is already constrained in ${nPos.sign} — this transit adds pressure.`);
    }
  }

  // House context if available
  if (natalChart?.houses && nPos?.house) {
    const houseMeaning = HOUSE_MEANINGS?.[nPos.house];
    if (houseMeaning) {
      parts.push(`This activates the ${ordinal(nPos.house)} house — ${houseMeaning.name}: ${houseMeaning.keyword}.`);
    }
  }

  // Character interaction
  parts.push(
    `${tChar.keyword} and ${nChar.keyword} in ${tension} — ${tChar.question} meets ${nChar.question}`
  );

  return parts.join(' ');
}

// ── Phase 4: Progression narrative ──────────────────────────────────────────

/**
 * Generate a narrative for the overall progression state.
 * @param {object} progression - from computeSecondaryProgressions
 * @param {object} natalChart - the natal chart data
 * @param {Array} progressedAspects - from computeProgressedAspects
 * @param {Array} ingresses - from detectProgressedIngresses
 * @returns {string}
 */
export function narrateProgression(progression, natalChart, progressedAspects, ingresses) {
  if (!progression) return '';
  const parts = [];
  const age = progression.age;

  // Opening: age and progressed date
  const pDate = progression.progressedDate;
  const dateStr = `${pDate.getFullYear()}-${String(pDate.getMonth() + 1).padStart(2, '0')}-${String(pDate.getDate()).padStart(2, '0')}`;
  parts.push(`At age ${age}, your progressed chart corresponds to the sky ${dateStr} — one day after birth for each year lived.`);

  // Progressed Ascendant
  if (progression.progressedAscendant) {
    const pAsc = progression.progressedAscendant;
    const nAsc = natalChart?.ascendant;
    if (nAsc && pAsc.sign !== nAsc.sign) {
      parts.push(`Your progressed Ascendant has moved from ${nAsc.sign} to ${pAsc.sign}. The mask you present to the world has shifted character.`);
    } else if (pAsc.sign) {
      parts.push(`Your progressed Ascendant remains in ${pAsc.sign}, deepening that sign's expression.`);
    }
  }

  // Progressed lunar phase
  if (progression.lunarPhase?.phase) {
    parts.push(`Progressed lunar phase: ${progression.lunarPhase.phase}. This colors the inner emotional rhythm of this life period.`);
  }

  // Ingresses
  if (ingresses && ingresses.length > 0) {
    const ingressNotes = ingresses.map(ig =>
      `${ig.planet} has progressed from ${ig.natalSign} into ${ig.progressedSign}`
    );
    parts.push(`Sign changes since birth: ${ingressNotes.join('; ')}.`);
  }

  // Count significant aspects
  if (progressedAspects && progressedAspects.length > 0) {
    const exactCount = progressedAspects.filter(a => a.exact).length;
    parts.push(`${progressedAspects.length} progressed aspect${progressedAspects.length !== 1 ? 's' : ''} active${exactCount > 0 ? ` (${exactCount} exact)` : ''}.`);
  }

  return parts.join(' ');
}

/**
 * Generate a narrative for a single progressed-to-natal aspect.
 * @param {object} aspect - { progressedPlanet, natalPlanet, aspect, orb, exact }
 * @param {object} progressedPositions - positions at progressed date
 * @param {object} natalPositions - natal positions
 * @returns {string}
 */
export function narrateProgressedAspect(aspect, progressedPositions, natalPositions) {
  if (!aspect) return '';

  const { progressedPlanet, natalPlanet, aspect: aspectName, orb, exact } = aspect;
  const pChar = PLANET_CHARACTERS[progressedPlanet] || { keyword: progressedPlanet, question: '' };
  const nChar = PLANET_CHARACTERS[natalPlanet] || { keyword: natalPlanet, question: '' };
  const aspectMeaning = ASPECT_MEANINGS[aspectName] || {};

  const parts = [];

  // Opening
  const tightness = exact ? 'exact' : `${orb}\u00B0 orb`;
  parts.push(`Progressed ${progressedPlanet} ${aspectName.toLowerCase()} natal ${natalPlanet} (${tightness}).`);

  // Aspect quality
  const aType = getAspectType(aspectName);
  const tension = aType === 'hard' ? 'tension' : aType === 'soft' ? 'flow' : 'fusion';
  parts.push(`A slow-moving ${tension} that unfolds over months.`);

  // Dignity context
  const pMap = Array.isArray(progressedPositions)
    ? Object.fromEntries(progressedPositions.map(p => [p.name, p]))
    : (progressedPositions || {});
  const nMap = Array.isArray(natalPositions)
    ? Object.fromEntries(natalPositions.map(p => [p.name, p]))
    : (natalPositions || {});

  const pPos = pMap[progressedPlanet];
  const nPos = nMap[natalPlanet];

  if (pPos?.sign) {
    const pVerb = getDignityVerb(progressedPlanet, pPos.sign);
    parts.push(`Progressed ${progressedPlanet} ${pVerb} from ${pPos.sign}.`);
  }

  // Moon aspects are the most significant in progressions
  if (progressedPlanet === 'Moon') {
    parts.push('The progressed Moon is the fastest-moving progressed body — this aspect marks a distinct emotional chapter.');
  } else if (progressedPlanet === 'Sun') {
    parts.push('The progressed Sun moves roughly one degree per year — this aspect defines a multi-year life theme.');
  }

  // Character interaction
  parts.push(`${pChar.keyword} reaching toward ${nChar.keyword} — the evolved self meeting the natal imprint.`);

  return parts.join(' ');
}

// ── Phase 5: Synastry narrative ─────────────────────────────────────────────

/**
 * Generate narrative for a single synastry cross-aspect.
 * @param {object} aspect — { planet1, planet2, aspect, orb, exact }
 * @returns {string}
 */
export function narrateSynastryAspect(aspect) {
  if (!aspect) return '';

  const { planet1, planet2, aspect: aspectName, orb, exact } = aspect;
  const char1 = PLANET_CHARACTERS[planet1] || { keyword: planet1, question: '' };
  const char2 = PLANET_CHARACTERS[planet2] || { keyword: planet2, question: '' };
  const aspectMeaning = ASPECT_MEANINGS[aspectName] || {};

  const parts = [];
  const tightness = exact ? 'exact' : `${orb}\u00B0`;

  parts.push(`Person 1's ${planet1} ${aspectName.toLowerCase()} Person 2's ${planet2} (${tightness}).`);

  // Aspect type
  const aType = getAspectType(aspectName);
  if (aType === 'hard') {
    parts.push('This is a point of friction — but also of magnetism. Hard aspects in synastry create the intensity that makes a relationship feel alive.');
  } else if (aType === 'soft') {
    parts.push('This flows easily between the two charts. A channel of compatibility and mutual support.');
  } else if (aspectName === 'Conjunction') {
    parts.push('Their energies merge here. Conjunction in synastry means these planets operate as one — for better and for worse.');
  }

  // Character interaction
  parts.push(`${char1.keyword} meets ${char2.keyword}.`);

  return parts.join(' ');
}

/**
 * Generate narrative for a recursive synastry perspective — how one planet
 * sees the relationship from its own vantage.
 * @param {string} planet — the observer planet
 * @param {object} perspData — { sign1, sign2, separation, selfAspect, crossAspects }
 * @returns {string}
 */
export function narrateRecursiveSynastry(planet, perspData) {
  if (!planet || !perspData) return '';

  const char = PLANET_CHARACTERS[planet] || { keyword: planet };
  const parts = [];

  // Where this planet sits in each chart
  if (perspData.sign1 === perspData.sign2) {
    parts.push(`${planet} occupies ${perspData.sign1} in both charts — a shared frequency, an immediate recognition.`);
  } else {
    parts.push(`${planet} sits in ${perspData.sign1} for Person 1 and ${perspData.sign2} for Person 2 — the same archetype expressed through different signs.`);
  }

  // Self-aspect
  if (perspData.selfAspect) {
    const { aspect, orb } = perspData.selfAspect;
    if (aspect === 'Conjunction') {
      parts.push(`Their ${planet}s are conjunct (${orb}\u00B0) — they experience ${char.keyword} in nearly the same way.`);
    } else {
      parts.push(`Their ${planet}s form a ${aspect.toLowerCase()} (${orb}\u00B0). The ${char.keyword} principle operates differently in each person, creating ${aspect === 'Square' || aspect === 'Opposition' ? 'creative tension' : 'complementary expression'}.`);
    }
  } else {
    parts.push(`Their ${planet}s make no major aspect to each other — ${char.keyword} operates independently in each chart.`);
  }

  // Cross-aspects from this planet
  if (perspData.crossAspects && perspData.crossAspects.length > 0) {
    const top = perspData.crossAspects.slice(0, 3);
    const connections = top.map(ca => `${ca.target} (${ca.aspect.toLowerCase()}, ${ca.orb}\u00B0)`);
    parts.push(`From Person 1's ${planet}, the strongest connections to Person 2: ${connections.join(', ')}.`);
  }

  return parts.join(' ');
}

/**
 * Generate a synastry synopsis — the big picture of the relationship.
 * @param {object} synastryData — from computeSynastry
 * @param {object} analysis — from analyzeSynastryAspects
 * @param {Array} patterns — from findSynastryPatterns
 * @returns {string}
 */
export function narrateSynastrySynopsis(synastryData, analysis, patterns) {
  if (!synastryData || !analysis) return '';

  const parts = [];
  const { hardCount, softCount, score, tightest } = analysis;
  const total = synastryData.crossAspects?.length || 0;

  // Overall character
  if (total === 0) {
    return 'Few cross-aspects between these charts. The relationship may feel comfortable but lacks strong planetary triggers.';
  }

  if (softCount > hardCount * 2) {
    parts.push('This synastry is dominated by flowing aspects — the relationship has natural ease and compatibility.');
  } else if (hardCount > softCount * 2) {
    parts.push('This synastry is charged with hard aspects — the relationship carries intensity, challenge, and the potential for deep transformation.');
  } else {
    parts.push('A balanced mix of hard and soft aspects — the relationship has both ease and edge, comfort and growth.');
  }

  parts.push(`${total} cross-aspects total: ${softCount} soft, ${hardCount} hard.`);

  // Tightest aspect
  if (tightest) {
    parts.push(`The tightest connection: Person 1's ${tightest.planet1} ${tightest.aspect.toLowerCase()} Person 2's ${tightest.planet2} (${tightest.orb}\u00B0)${tightest.exact ? ' — exact' : ''}.`);
  }

  // Double whammies
  if (patterns && patterns.length > 0) {
    const dwNames = patterns.map(dw => `${dw.planet1}\u2013${dw.planet2}`);
    parts.push(`Double whammies (mutual aspects): ${dwNames.join(', ')}. These are the strongest threads binding these charts together.`);
  }

  return parts.join(' ');
}
