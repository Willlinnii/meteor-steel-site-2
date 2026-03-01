/**
 * signCharacters.js — Compiled character profiles for the twelve zodiac signs.
 *
 * Pure data. No React.
 * Synthesized from chronosphaeraZodiac.json.
 * Used by the recursive chart's narrative layer to describe what a sign
 * demands of any planet that enters it.
 */

export const SIGN_CHARACTERS = {
  Aries: {
    sign: 'Aries',
    symbol: '\u2648',
    element: 'fire',
    modality: 'cardinal',
    ruler: 'Mars',
    house: 1,
    dates: 'March 21 \u2013 April 19',

    archetype: 'The Pioneer',
    stage: 'Initiation and Beginnings',
    keyword: 'initiation',

    demand: 'Act. Move first. Whatever enters Aries must lead or be led \u2014 there is no mediation, no deliberation. The sign strips away hesitation and leaves only the nerve to begin.',

    synthesis: 'This region of the sky marks the beginning. Every tradition saw the same thing: a threshold crossed, the first act of will that sets everything else in motion. The ram appears because the animal that leads is the animal that charges \u2014 headfirst, without hesitation. Mars rules here not because of war but because of the nerve it takes to start something. Spring equinox, first sign, cardinal fire \u2014 the pattern is initiation itself. The courage to be born. The courage to go first.',

    elementEffect: 'Fire signs ignite whatever enters them. A planet in Aries burns with initiative and expression \u2014 action before reflection.',
    modalityEffect: 'Cardinal signs initiate. A planet here is pushed to start something, cross a threshold, break from what was.',
  },

  Taurus: {
    sign: 'Taurus',
    symbol: '\u2649',
    element: 'earth',
    modality: 'fixed',
    ruler: 'Venus',
    house: 2,
    dates: 'April 20 \u2013 May 20',

    archetype: 'The Sustainer',
    stage: 'Establishment and Stability',
    keyword: 'endurance',

    demand: 'Stay. Hold ground. Whatever enters Taurus must slow down and commit \u2014 no shortcuts, no abstractions. The sign demands embodiment, patience, and the willingness to build something that lasts.',

    synthesis: 'This region of the sky is about what endures. The bull appears in every tradition because it is the animal that does not move unless it means to \u2014 and when it does, nothing stops it. What recurs most is fertility and strength held in reserve: the power to sustain, to nourish, to hold ground. Venus rules here because the deepest pleasure is not novelty but continuation. The field that feeds you. The body that carries you. The beauty that does not need to announce itself.',

    elementEffect: 'Earth signs ground whatever enters them. A planet in Taurus becomes material, sensual, and concerned with what is real and tangible.',
    modalityEffect: 'Fixed signs consolidate. A planet here digs in and refuses to move until the work is done or the ground gives way.',
  },

  Gemini: {
    sign: 'Gemini',
    symbol: '\u264A',
    element: 'air',
    modality: 'mutable',
    ruler: 'Mercury',
    house: 3,
    dates: 'May 21 \u2013 June 20',

    archetype: 'The Messenger',
    stage: 'Communication and Duality',
    keyword: 'connection',

    demand: 'Speak. Divide and reconnect. Whatever enters Gemini must name itself twice \u2014 once for each twin. The sign demands versatility, curiosity, and the willingness to see from more than one angle.',

    synthesis: 'Two figures stand in this part of the sky, and every tradition that named them saw the same tension: one mortal, one divine. The pattern that recurs most is not duality for its own sake but the insistence that both halves need each other. Mercury rules here because the messenger is the one who moves between worlds \u2014 carrying knowledge from one side to the other, translating what neither twin could say alone.',

    elementEffect: 'Air signs circulate whatever enters them. A planet in Gemini becomes communicative, intellectually restless, and oriented toward exchange.',
    modalityEffect: 'Mutable signs adapt. A planet here shifts, translates, and refuses to be pinned to a single expression.',
  },

  Cancer: {
    sign: 'Cancer',
    symbol: '\u264B',
    element: 'water',
    modality: 'cardinal',
    ruler: 'Moon',
    house: 4,
    dates: 'June 21 \u2013 July 22',

    archetype: 'The Nurturer',
    stage: 'Birth and Emotional Foundation',
    keyword: 'protection',

    demand: 'Feel. Protect. Whatever enters Cancer must soften its shell enough to feel \u2014 and then build a shell strong enough to survive the feeling. The sign demands emotional honesty and the courage to need.',

    synthesis: 'This part of the sky is where things get protected. The crab appears because it is the creature that builds its armor from the inside out \u2014 soft body first, then shell. The Moon rules here because the emotional life comes before the rational one. Every tradition saw this: the gateway of birth, the summer solstice, the point where light is fullest and the soul enters the world.',

    elementEffect: 'Water signs dissolve whatever enters them into feeling. A planet in Cancer becomes emotional, intuitive, and oriented toward security.',
    modalityEffect: 'Cardinal signs initiate. A planet here begins something emotional \u2014 a bond, a home, a protective boundary.',
  },

  Leo: {
    sign: 'Leo',
    symbol: '\u264C',
    element: 'fire',
    modality: 'fixed',
    ruler: 'Sun',
    house: 5,
    dates: 'July 23 \u2013 August 22',

    archetype: 'The Sovereign',
    stage: 'Self-Expression and Identity',
    keyword: 'radiance',

    demand: 'Shine. Declare yourself. Whatever enters Leo must become fully visible \u2014 no hiding, no dilution. The sign demands that you stand in your own light and mean it.',

    synthesis: 'Every culture that looked at this part of the sky saw sovereignty. The lion appears because no other animal commands attention simply by being present. The Sun rules here because Leo is not about acquiring power \u2014 it is about radiating it. What recurs most is the connection between courage and generosity: the lion that guards, the king that gives, the heart star Regulus beating at the center of the constellation.',

    elementEffect: 'Fire signs ignite whatever enters them. A planet in Leo burns with sustained creative force \u2014 not the spark of beginning but the sustained blaze of expression.',
    modalityEffect: 'Fixed signs hold. A planet here commits to its light and refuses to dim.',
  },

  Virgo: {
    sign: 'Virgo',
    symbol: '\u264D',
    element: 'earth',
    modality: 'mutable',
    ruler: 'Mercury',
    house: 6,
    dates: 'August 23 \u2013 September 22',

    archetype: 'The Healer',
    stage: 'Refinement and Service',
    keyword: 'discernment',

    demand: 'Refine. Separate the wheat from the chaff. Whatever enters Virgo must submit to precision \u2014 no exaggeration, no waste. The sign demands integrity and the willingness to serve what is true.',

    synthesis: 'This region of the sky holds grain in one hand and judgment in the other. The maiden appears in every tradition because the harvest does not happen by accident \u2014 it requires discernment, timing, and labor no one sees. Mercury rules here not for cleverness but for precision: the ability to separate what nourishes from what does not.',

    elementEffect: 'Earth signs ground whatever enters them. A planet in Virgo becomes practical, analytical, and concerned with what actually works.',
    modalityEffect: 'Mutable signs adapt. A planet here adjusts, calibrates, and refines until the pattern is clean.',
  },

  Libra: {
    sign: 'Libra',
    symbol: '\u264E',
    element: 'air',
    modality: 'cardinal',
    ruler: 'Venus',
    house: 7,
    dates: 'September 23 \u2013 October 22',

    archetype: 'The Diplomat',
    stage: 'Relationship and Harmony',
    keyword: 'balance',

    demand: 'Weigh. Find the center. Whatever enters Libra must consider the other side \u2014 no unilateral action, no imbalance. The sign demands fairness and the discipline of seeing both sides long enough to find where they meet.',

    synthesis: 'This is the only region of the sky named for a tool, not a creature \u2014 and that says everything. The scales appear in every tradition because judgment is not an opinion; it is a mechanism. Venus rules here not for beauty but for the deeper thing beauty requires: proportion. What recurs most is the equinox itself \u2014 day and night in perfect balance, the year tipping from light into dark.',

    elementEffect: 'Air signs circulate whatever enters them. A planet in Libra becomes relational, aware of others, and oriented toward exchange and symmetry.',
    modalityEffect: 'Cardinal signs initiate. A planet here begins a relationship, a negotiation, or a search for equilibrium.',
  },

  Scorpio: {
    sign: 'Scorpio',
    symbol: '\u264F',
    element: 'water',
    modality: 'fixed',
    ruler: 'Mars',
    house: 8,
    dates: 'October 23 \u2013 November 21',

    archetype: 'The Alchemist',
    stage: 'Transformation and Deep Connection',
    keyword: 'transformation',

    demand: 'Go deeper. Whatever enters Scorpio must face what it has been avoiding \u2014 no surfaces, no polite fictions. The sign demands honesty about power, desire, and what lies underneath.',

    synthesis: 'This part of the sky is where something dies so something else can live. The scorpion appears because it is the creature that stings from below \u2014 the danger you did not see coming, the truth you were not ready for. Mars rules here for a different reason than in Aries: not the courage to begin but the will to go through.',

    elementEffect: 'Water signs dissolve whatever enters them into feeling. A planet in Scorpio encounters depth, intensity, and the demand for total emotional truth.',
    modalityEffect: 'Fixed signs hold. A planet here locks onto its transformative process and will not let go until the old form is fully dissolved.',
  },

  Sagittarius: {
    sign: 'Sagittarius',
    symbol: '\u2650',
    element: 'fire',
    modality: 'mutable',
    ruler: 'Jupiter',
    house: 9,
    dates: 'November 22 \u2013 December 21',

    archetype: 'The Explorer',
    stage: 'Expansion and Truth-Seeking',
    keyword: 'meaning',

    demand: 'Aim higher. Whatever enters Sagittarius must expand beyond its comfort zone \u2014 no settling, no small thinking. The sign demands faith in a trajectory even when the target cannot be seen.',

    synthesis: 'This region of the sky is half animal and half human, and the arrow points up. The centaur appears because the question this part of the cycle asks is whether the beast and the sage can share the same body. Jupiter rules here because expansion is not just movement outward \u2014 it is the faith required to aim at something you cannot see.',

    elementEffect: 'Fire signs ignite whatever enters them. A planet in Sagittarius burns with philosophical urgency and the need to move toward meaning.',
    modalityEffect: 'Mutable signs adapt. A planet here keeps adjusting its aim, learning new languages, finding truth in unfamiliar territory.',
  },

  Capricorn: {
    sign: 'Capricorn',
    symbol: '\u2651',
    element: 'earth',
    modality: 'cardinal',
    ruler: 'Saturn',
    house: 10,
    dates: 'December 22 \u2013 January 19',

    archetype: 'The Builder',
    stage: 'Achievement and Responsibility',
    keyword: 'mastery',

    demand: 'Build. Earn it. Whatever enters Capricorn must prove itself against time \u2014 no borrowed authority, no shortcuts. The sign demands discipline, accountability, and the patience to climb.',

    synthesis: 'This part of the sky is where the goat meets the ocean and keeps climbing. The sea-goat appears everywhere because the image is irreducible: an animal that belongs on the mountain peak with a tail that belongs in the deep. Saturn rules here because time is the only material that cannot be faked, and everything Capricorn builds is tested against it.',

    elementEffect: 'Earth signs ground whatever enters them. A planet in Capricorn becomes structural, ambitious, and tested by material reality.',
    modalityEffect: 'Cardinal signs initiate. A planet here begins an ascent \u2014 a career, an institution, a legacy intended to outlast the builder.',
  },

  Aquarius: {
    sign: 'Aquarius',
    symbol: '\u2652',
    element: 'air',
    modality: 'fixed',
    ruler: 'Saturn',
    house: 11,
    dates: 'January 20 \u2013 February 18',

    archetype: 'The Visionary',
    stage: 'Innovation and Collective Consciousness',
    keyword: 'liberation',

    demand: 'Distribute. Pour what you know into the collective. Whatever enters Aquarius must think beyond the personal \u2014 no hoarding, no hierarchy. The sign demands that individual insight serve the group.',

    synthesis: 'This is the only region of the sky where a human figure does not fight, flee, or fall \u2014 it pours. The water-bearer appears because the image answers a question no animal can: what do you do with what you know? Saturn rules here because liberation and discipline are not opposites \u2014 you cannot pour steadily with shaking hands.',

    elementEffect: 'Air signs circulate whatever enters them. A planet in Aquarius becomes systemic, collective, and oriented toward the future.',
    modalityEffect: 'Fixed signs hold. A planet here commits to its vision and refuses to compromise it for comfort or convention.',
  },

  Pisces: {
    sign: 'Pisces',
    symbol: '\u2653',
    element: 'water',
    modality: 'mutable',
    ruler: 'Jupiter',
    house: 12,
    dates: 'February 19 \u2013 March 20',

    archetype: 'The Mystic',
    stage: 'Transcendence and Spirituality',
    keyword: 'surrender',

    demand: 'Dissolve. Let go of the boundary between self and everything else. Whatever enters Pisces must accept that control is an illusion \u2014 the sign demands compassion, faith, and the willingness to not know.',

    synthesis: 'This is where the wheel dissolves. Two fish swim in opposite directions, tied together by a cord, and that cord is the last image the zodiac offers before it begins again. Jupiter rules here because the final expansion is not outward but inward \u2014 into everything at once. What recurs most across every tradition is the theme of surrender that is not defeat.',

    elementEffect: 'Water signs dissolve whatever enters them into feeling. A planet in Pisces loses its edges \u2014 boundaries soften, intuition replaces logic, and empathy becomes the primary sense.',
    modalityEffect: 'Mutable signs adapt. A planet here flows between states, absorbs what surrounds it, and translates experience into something the soul can use.',
  },
};
