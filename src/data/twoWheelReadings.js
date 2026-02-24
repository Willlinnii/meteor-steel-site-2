/**
 * Two-Wheel Zodiac — Embodied Self / Timeless Self Reading Engine
 *
 * Tropical (Seasonal) = The Embodied Self — the body, mortality, the lived mortal
 * experience, the cutting edge of existence where the soul makes choices and advances.
 *
 * Sidereal (Stellar) = The Timeless Self — the essential being beyond the mortal
 * frame, not limited to time the way the body is.
 */

// What each sign means as your mortal/embodied self
export const EMBODIED_READING = {
  Aries:
    'Your embodied self is doing the work of beginning — breaking ground that has never been broken, initiating action before the reasons are fully clear. The body leads with instinct and courage, throwing itself into the unknown because standing still is not an option. This is the mortal self as pioneer: choosing first, understanding later.',
  Taurus:
    'Your embodied self is doing the work of stabilizing — planting roots, building shelter, learning what the body actually needs versus what the mind fears it needs. The mortal frame finds its rhythm in the sensory world: texture, weight, warmth, sustenance. This is the embodied self as keeper: making the ground solid enough to stand on.',
  Gemini:
    'Your embodied self is doing the work of naming — reaching out in every direction, gathering language, making connections between things that were not connected before. The body moves quickly, restlessly, because there is always another thread to follow. This is the mortal self as messenger: mapping the territory by talking to everyone in it.',
  Cancer:
    'Your embodied self is doing the work of sheltering — building the inner space where vulnerability can exist without armor. The body knows before the mind does what feels safe and what does not. This is the mortal self as guardian: creating the conditions where something tender can survive.',
  Leo:
    'Your embodied self is doing the work of becoming visible — stepping into the center, letting the full weight of individual presence be felt. The body radiates and demands to be witnessed, not out of vanity but because the mortal self must learn what it is by expressing it completely. This is the embodied self as sovereign: discovering authority through creative display.',
  Virgo:
    'Your embodied self is doing the work of refining — sorting through the raw material of experience, finding what actually works and discarding what does not. The body pays attention to details that others miss entirely. This is the mortal self as craftsperson: improving the lived world one precise correction at a time.',
  Libra:
    'Your embodied self is doing the work of relating — finding the other, learning the shape of itself through what it is not. The body seeks balance, harmony, and the kind of beauty that arises from things being in right proportion. This is the mortal self as mirror: discovering itself through partnership and encounter.',
  Scorpio:
    'Your embodied self is doing the work of transformation — going into the places that the other signs avoid, finding power in what has been hidden or buried. The body knows that some things must be destroyed before anything new can grow. This is the mortal self as alchemist: turning confrontation with death into depth of living.',
  Sagittarius:
    'Your embodied self is doing the work of expanding — pushing past every known boundary, testing how far the mortal frame can actually go. The body hungers for direct experience of what lies beyond the horizon. This is the embodied self as archer: aiming past the edge of the map because the map is never enough.',
  Capricorn:
    'Your embodied self is doing the work of building — taking on responsibility, climbing toward mastery, accepting the slow discipline that real authority requires. The body understands time as a material to be shaped. This is the mortal self as architect: constructing something that will outlast the hands that built it.',
  Aquarius:
    'Your embodied self is doing the work of reimagining — stepping outside the inherited structure, seeing the pattern from above, and choosing which parts to keep and which to replace. The body operates at a frequency that others experience as different or ahead of its time. This is the mortal self as innovator: living as if the future has already arrived.',
  Pisces:
    'Your embodied self is doing the work of dissolving — releasing the boundaries that the other signs have spent the whole cycle building. The body is permeable, absorptive, moved by currents that have no name. This is the mortal self as mystic: experiencing the world as a single undivided thing and carrying the weight of that openness.',
};

// What each sign means as your timeless/essential self
export const TIMELESS_READING = {
  Aries:
    'Your timeless self carries the essential momentum of initiation — the deep impulse to begin, to break open what has calcified, to move toward what has never been tried. This is not recklessness but the primal fire that makes anything new possible. The essential being knows that courage is the first requirement of every cycle.',
  Taurus:
    'Your timeless self carries the essential momentum of embodiment — the deep knowledge that spirit needs form, that ideas mean nothing until they have weight and texture. This is the ground note beneath every incarnation: the insistence that beauty is real, that pleasure is meaningful, that the body is not a mistake.',
  Gemini:
    'Your timeless self carries the essential momentum of connection — the deep need to bridge, to translate, to carry messages between realms that cannot speak directly to each other. This is the intelligence that moves between worlds: restless, curious, never satisfied with a single perspective.',
  Cancer:
    'Your timeless self carries the essential momentum of belonging — the deep current that moves toward home, toward the place where the soul recognizes itself. This is not sentimentality but the gravitational pull of origin: the knowledge that everything that ventures out must have somewhere to return to.',
  Leo:
    'Your timeless self carries the essential momentum of radiance — the deep need to manifest, to make the invisible visible, to bring into form what exists only as potential. This is the creative fire at the center of things: the knowledge that consciousness itself wants to be expressed, witnessed, and known.',
  Virgo:
    'Your timeless self carries the essential momentum of service — the deep understanding that wholeness requires attention to each part, that the sacred exists in the specific. This is the precision of nature itself: the knowledge that every system, left unattended, drifts toward disorder.',
  Libra:
    'Your timeless self carries the essential momentum of equilibrium — the deep pattern-recognition that knows when things are in balance and when they are not. This is the aesthetic intelligence that underlies justice, harmony, and relationship: the knowledge that nothing exists in isolation.',
  Scorpio:
    'Your timeless self carries the essential momentum of transformation — the deep familiarity with the cycle of death and regeneration that runs beneath all living systems. This is the power that lives in the underworld: the knowledge that what is buried is not gone but composting into the next form.',
  Sagittarius:
    'Your timeless self carries the essential momentum of meaning — the deep hunger to understand why, to find the pattern that connects all the scattered experiences into a coherent story. This is the fire of philosophy and faith: the knowledge that there is always more than what is immediately visible.',
  Capricorn:
    'Your timeless self carries the essential momentum of structure — the deep understanding that form is not a limitation but a vessel, that discipline is what allows vision to become real. This is the mountain the soul keeps climbing: the knowledge that mastery is earned across time, not given.',
  Aquarius:
    'Your timeless self carries the essential momentum of liberation — the deep impulse to free what has been trapped, to see what the collective cannot yet see, to serve the future rather than the past. This is the current that moves through all systems toward greater freedom and interconnection.',
  Pisces:
    'Your timeless self carries the essential momentum of unity — the deep memory that all boundaries are provisional, that separation is useful but not final. This is the ocean that every river returns to: the knowledge that compassion, imagination, and surrender are not weaknesses but the final skills of the cycle.',
};

// How the mortal self leads and completes the timeless self's work for each common pair
// Keyed by tropical sign; each entry assumes sidereal = one sign back
export const PAIR_DYNAMIC = {
  Aries: {
    sidereal: 'Pisces',
    reading:
      'Your mortal self is an Aries — the pioneer, the one who begins. Your timeless self is a Pisces — the mystic, the one who remembers unity. The embodied self leads with courage and decisive action, breaking open new ground. Behind that, the timeless self provides the deep compassion and spiritual sensitivity that gives the pioneering impulse its meaning. Your body charges forward; your essential being whispers that what you are really charging toward is a new form of wholeness. The mortal self completes what the Piscean depth has been yearning for: a beginning that is not afraid of the unknown.',
  },
  Taurus: {
    sidereal: 'Aries',
    reading:
      'Your mortal self is a Taurus — the builder, the keeper of what is real. Your timeless self is an Aries — the initiator, the one who starts the fire. The embodied self leads by grounding the timeless self\'s restless impulse to begin: it takes the raw courage and gives it form, weight, permanence. Your body says: we are not just starting something — we are making it last. The mortal self completes what the Arian fire has been driving toward: something that can actually be held.',
  },
  Gemini: {
    sidereal: 'Taurus',
    reading:
      'Your mortal self is a Gemini — the messenger, the one who names and connects. Your timeless self is a Taurus — the embodier, the one who insists on the real. The embodied self leads by giving language and movement to what the timeless self has been patiently building in silence. Your body reaches out, bridges, translates — and behind that restless motion, the deep self provides the steadiness that keeps the connections from scattering. The mortal self completes what the Taurean ground has been holding: it carries what is solid into conversation with everything else.',
  },
  Cancer: {
    sidereal: 'Gemini',
    reading:
      'Your mortal self is a Cancer — the guardian, the one who builds the inner shelter. Your timeless self is a Gemini — the connector, the one who moves between worlds. The embodied self leads by creating emotional depth and safety, giving the timeless self\'s restless curiosity somewhere to land. Your body knows what home feels like before your mind can explain it. The mortal self completes what the Geminian intelligence has been reaching for: not just information but belonging.',
  },
  Leo: {
    sidereal: 'Cancer',
    reading:
      'Your mortal self is a Leo — the sovereign, the one who becomes fully visible. Your timeless self is a Cancer — the guardian, the one who protects the tender interior. The embodied self leads by stepping into the light, expressing outwardly what the deep self has been nurturing in private. Your body radiates and creates; behind that display, the essential being provides the emotional authenticity that prevents the performance from becoming hollow. The mortal self completes what the Cancerian heart has been sheltering: it brings the vulnerable interior into the world without apology.',
  },
  Virgo: {
    sidereal: 'Leo',
    reading:
      'Your mortal self is a Virgo — the craftsperson, the one who refines. Your timeless self is a Leo — the radiant one, the creative fire. The embodied self leads by attending to the detail, the correction, the practical work that turns vision into something useful. Behind that precision, the deep self provides the warmth and creative generosity that keeps the refining from becoming sterile. The mortal self completes what the Leonine fire has been expressing: it gives the creative impulse form, specificity, and a standard of excellence.',
  },
  Libra: {
    sidereal: 'Virgo',
    reading:
      'Your mortal self is a Libra — the mirror, the one who finds itself through relationship. Your timeless self is a Virgo — the discerner, the one who serves through precision. The embodied self leads by entering partnership, seeking balance, creating beauty through the encounter with the other. Behind that relational instinct, the deep self provides the analytical clarity that prevents harmony from becoming mere accommodation. The mortal self completes what the Virgoan devotion has been working toward: not just service but genuine meeting.',
  },
  Scorpio: {
    sidereal: 'Libra',
    reading:
      'Your mortal self is a Scorpio — the alchemist, the one who transforms through confrontation. Your timeless self is a Libra — the harmonizer, the one who seeks equilibrium. The embodied self leads by going beneath the surface, into the hidden places where real change happens. Behind that intensity, the deep self provides the instinct for fairness and beauty that ensures the transformation creates something balanced rather than just powerful. The mortal self completes what the Libran ideal has been reaching for: not just balance but depth.',
  },
  Sagittarius: {
    sidereal: 'Scorpio',
    reading:
      'Your mortal self is a Sagittarius — the archer, the one who aims beyond the known. Your timeless self is a Scorpio — the transformer, the one who knows the underworld. The embodied self leads by expanding, seeking, pushing past every boundary toward meaning and truth. Behind that outward thrust, the deep self provides the emotional intensity and willingness to go through darkness that gives the quest its authenticity. The mortal self completes what the Scorpionic depths have been composting: it carries what was buried back into the light as wisdom.',
  },
  Capricorn: {
    sidereal: 'Sagittarius',
    reading:
      'Your mortal self is a Capricorn — the architect, the one who builds across time. Your timeless self is a Sagittarius — the seeker, the one who hungers for meaning. The embodied self leads by taking on structure, responsibility, and the long discipline of mastery. Behind that ambition, the deep self provides the philosophical fire and optimism that prevents the climbing from becoming joyless. The mortal self completes what the Sagittarian vision has been reaching for: not just understanding but achievement — truth made solid.',
  },
  Aquarius: {
    sidereal: 'Capricorn',
    reading:
      'Your mortal self is an Aquarius — the innovator, the one who reimagines the structure. Your timeless self is a Capricorn — the builder, the one who understands what endures. The embodied self leads by stepping outside the inherited system, seeing it from above, and choosing what to keep and what to redesign. Behind that detachment, the deep self provides the discipline and respect for form that prevents revolution from becoming chaos. The mortal self completes what the Capricornian labor has been constructing: not just a structure but a better one.',
  },
  Pisces: {
    sidereal: 'Aquarius',
    reading:
      'Your mortal self is a Pisces — the mystic, the one who dissolves boundaries. Your timeless self is an Aquarius — the visionary, the one who sees the pattern of the whole. The embodied self leads by releasing, surrendering, letting the walls between self and world become permeable. Behind that openness, the deep self provides the intellectual clarity and communal vision that keeps the dissolution purposeful rather than lost. The mortal self completes what the Aquarian liberation has been working toward: not just freedom from the old structure but a return to the unity that was always underneath.',
  },
};

// Template for the rare overlap case where tropical and sidereal signs match
export const SAME_SIGN_READING =
  'Your tropical and sidereal signs are both {sign} — the embodied self and the timeless self are pointing in the same direction. This alignment was the default roughly two thousand years ago, when the vernal equinox coincided with the start of the constellation Aries. For you, the mortal work and the essential momentum are not in tension — they reinforce each other. The body is doing exactly what the deeper being has always been moving toward. This can feel like unusual clarity of purpose, or like a single-mindedness that has less of the productive friction most people carry between their two signs. You are not split between two archetypes; you are concentrated in one.';
