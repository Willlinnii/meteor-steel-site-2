/* ─── Discover Feature Definitions ───
 *  Single source of truth for all product marketing pages.
 *  Each entry drives a full page at /discover/:featureId.
 *
 *  Structure:
 *    Visual front: title, subtitle, tagline, highlights[] (3 punchy cards)
 *    White paper:  sections[] (narrative, features, quote, showcase, comparison)
 */

const DISCOVER_FEATURE_DEFS = {

  /* ────────────────────────────────────────────
   * 1. Yellow Brick Roads & Ouroboros Mode
   * ──────────────────────────────────────────── */
  journeys: {
    id: 'journeys',
    title: 'YELLOW BRICK ROADS',
    subtitle: 'Guided Descents Through Layered Meaning',
    tagline: 'Twenty-six stops. Three depths per stop. One spiral that changes you.',
    accent: 'var(--accent-gold)',
    ctaText: 'Begin a Journey',
    ctaLink: '/yellow-brick-road',
    highlights: [
      { icon: 'spiral', label: '26 Cosmic Stops', desc: 'Planetary spheres and zodiac signs mapped as a walking path' },
      { icon: 'ouroboros', label: 'Ouroboros Mode', desc: 'The dragon eats its tail — loop back and see what changed' },
      { icon: 'layers', label: 'Three Depths', desc: 'Riddle, story, personal reflection at every threshold' },
    ],
    whitePaperTitle: 'The Spiral Path',
    sections: [
      {
        type: 'narrative',
        heading: 'The Spiral Path',
        paragraphs: [
          'Every journey in Mythouse is a spiral. You do not walk forward — you descend, circling deeper through the same territory until its meaning shifts beneath you.',
          'The Yellow Brick Roads are guided descents through layered mythological terrain. Twenty-six stops along a cosmic route that traces the ancient planetary spheres and zodiac signs — each one a threshold into riddle, story, and personal reflection.',
          'And then there is Ouroboros Mode — the dragon eating its own tail. A journey that loops back to where it began, except you are no longer the same person standing at the gate.',
        ],
        emphasis: 'The road was never about reaching a destination.',
        borderAccent: 'var(--accent-ember)',
      },
      {
        type: 'features',
        heading: 'What Awaits',
        items: [
          { title: 'The Cosmic Journey', description: 'Twenty-six stops through the seven planetary spheres and twelve zodiac signs. Each stop is a chamber — enter, and something asks to be seen.', accent: 'var(--accent-gold)' },
          { title: 'Ouroboros Mode', description: 'Walk the dragon\'s coil. A looping journey structure where each return to a familiar stop reveals what you could not see the first time through.', accent: 'var(--accent-ember)' },
          { title: 'Three Levels Per Stop', description: 'Every stop unfolds across three depths: a riddle to unlock, a story to inhabit, and a personal reflection to carry forward. No stop is the same twice.', accent: 'var(--accent-steel)' },
        ],
      },
      {
        type: 'quote',
        text: 'Each journey is a spiral — you return changed.',
      },
    ],
  },

  /* ────────────────────────────────────────────
   * 2. Game Room
   * ──────────────────────────────────────────── */
  games: {
    id: 'games',
    title: 'THE GAME ROOM',
    subtitle: 'Ancient Games. Living Rituals of Play.',
    tagline: 'The oldest ritual objects in civilization are not altars — they are game boards.',
    accent: 'var(--accent-ember)',
    ctaText: 'Enter the Game Room',
    ctaLink: '/games',
    highlights: [
      { icon: 'senet', label: 'Senet', desc: 'Egypt\'s journey through the afterlife — strategy meets fate' },
      { icon: 'ur', label: 'Royal Game of Ur', desc: 'Four thousand years of unbroken play from Mesopotamia' },
      { icon: 'mancala', label: 'Mancala', desc: 'Seeds scattered across every continent, older than writing' },
    ],
    whitePaperTitle: 'Rituals of Play',
    sections: [
      {
        type: 'narrative',
        heading: 'Rituals of Play',
        paragraphs: [
          'Before there were screens, before there were books, there were games. The oldest ritual objects in human civilization are not altars or weapons — they are game boards.',
          'Senet guided the dead through the Egyptian underworld. The Royal Game of Ur was played in Mesopotamia four thousand years before chess existed. Mancala seeds have been scattered across every continent, carrying counting wisdom older than writing.',
          'These are not museum relics. They are living instruments of strategy, chance, and sacred play — and in Mythouse, you can sit down and play them.',
        ],
        emphasis: 'The board is set. The oldest invitation still stands.',
        borderAccent: 'var(--accent-gold)',
      },
      {
        type: 'features',
        heading: 'The Games',
        items: [
          { title: 'Senet', description: 'The game of passing — ancient Egypt\'s journey through the afterlife. Strategy meets fate across thirty squares of the underworld.', accent: 'var(--accent-gold)' },
          { title: 'The Royal Game of Ur', description: 'Four thousand years of unbroken play. A race game from Mesopotamia with rules decoded from a cuneiform tablet — and still exhilarating.', accent: 'var(--accent-ember)' },
          { title: 'Mancala', description: 'Seeds scattered across the world. The oldest counting game in human history, played on every continent, in every century.', accent: 'var(--accent-steel)' },
          { title: 'Multiplayer', description: 'Play against friends in real time. Every game supports live multiplayer — because sacred play was never meant to be solitary.', accent: 'var(--accent-fire)' },
        ],
      },
      {
        type: 'quote',
        text: 'Play is the oldest form of sacred practice. The game board came before the altar.',
      },
    ],
  },

  /* ────────────────────────────────────────────
   * 3. Story Forge
   * ──────────────────────────────────────────── */
  'story-forge': {
    id: 'story-forge',
    title: 'THE STORY FORGE',
    subtitle: 'Your Life Is a Myth in Progress',
    tagline: 'You are not writing fiction. You are recognizing the myth you are already living.',
    accent: 'var(--accent-fire)',
    ctaText: 'Enter the Forge',
    ctaLink: '/story-forge',
    highlights: [
      { icon: 'anvil', label: 'Monomyth Mapping', desc: 'Map your experience onto the eight stages of the hero\'s journey' },
      { icon: 'dialogue', label: 'AI Co-Creation', desc: 'Atlas helps you hear the story already telling itself through you' },
      { icon: 'scroll', label: 'Narrative Templates', desc: 'Archetypes and patterns from world mythology, ready for your truth' },
    ],
    whitePaperTitle: 'The Forge Awaits',
    sections: [
      {
        type: 'narrative',
        heading: 'The Forge Awaits',
        paragraphs: [
          'Every life follows a mythic pattern — whether or not you see it. The Story Forge is where you begin to see it.',
          'This is not a writing tool. It is a mythological instrument that helps you recognize the narrative structure already present in your experience — the calls you answered, the thresholds you crossed, the ordeals that forged you.',
          'Working with the eight stages of the monomyth as a living framework, the Forge uses AI-assisted narrative intelligence to help you shape raw experience into coherent story — stage by stage, symbol by symbol.',
        ],
        emphasis: 'You are not writing fiction. You are recognizing the myth you are already living.',
        borderAccent: 'var(--accent-ember)',
      },
      {
        type: 'comparison',
        heading: 'Before and After the Forge',
        left: { label: 'Raw Experience', text: 'Events without pattern. A life that happened to you. Disconnected episodes, unresolved chapters, meaning that feels just out of reach.' },
        right: { label: 'Forged Narrative', text: 'A life story with mythic structure. Calls recognized, ordeals named, returns honored. The same events — but now you can see the thread.' },
      },
      {
        type: 'features',
        heading: 'Forge Instruments',
        items: [
          { title: 'Monomyth Mapping', description: 'Map your lived experience onto the eight stages of the hero\'s journey. See where you are. See what comes next.', accent: 'var(--accent-ember)' },
          { title: 'AI Co-Creation', description: 'Atlas works alongside you — not to write your story, but to help you hear the one already telling itself through you.', accent: 'var(--accent-steel)' },
          { title: 'Narrative Templates', description: 'Archetypes, symbols, and structural patterns drawn from world mythology — ready to receive your particular truth.', accent: 'var(--accent-gold)' },
        ],
      },
    ],
  },

  /* ────────────────────────────────────────────
   * 4. Coursework
   * ──────────────────────────────────────────── */
  coursework: {
    id: 'coursework',
    title: 'COURSEWORK',
    subtitle: 'A Curriculum That Emerges from Exploration',
    tagline: 'You do not enroll in courses. Courses crystallize around you.',
    accent: 'var(--accent-ember)',
    ctaText: 'View Your Progress',
    ctaLink: '/profile',
    highlights: [
      { icon: 'path', label: 'Self-Emerging', desc: 'Courses form from what you actually explore — not a syllabus' },
      { icon: 'eye', label: 'Quiet Tracking', desc: 'Every page, game, journey, and dialogue weaves into your record' },
      { icon: 'constellation', label: 'Depth & Breadth', desc: 'Time spent matters as much as territory covered' },
    ],
    whitePaperTitle: 'Self-Emerging Curriculum',
    sections: [
      {
        type: 'narrative',
        heading: 'Self-Emerging Curriculum',
        paragraphs: [
          'Most educational platforms hand you a syllabus and ask you to follow it. Mythouse does the opposite.',
          'Here, the curriculum emerges from what you actually explore. Every page you visit, every game you play, every journey you take, every conversation with Atlas — all of it is quietly tracked and woven into a picture of your mythological education.',
          'You do not enroll in courses. Courses crystallize around you — assembled from the territories you have already walked through.',
        ],
        emphasis: 'The curriculum is the journey you already took.',
        borderAccent: 'var(--accent-gold)',
      },
      {
        type: 'showcase',
        heading: 'What Gets Tracked',
        description: 'Every meaningful interaction across Mythouse contributes to your coursework. Nothing is wasted.',
        highlights: [
          'Monomyth stages explored — theorists studied, cycles examined, depth tabs opened',
          'Chronosphaera modes visited — planets, zodiac, calendar, body, artist correspondences',
          'Games played and completed — Senet, Royal Game of Ur, Mancala sessions',
          'Journey stops cleared — riddles solved, stories heard, reflections written',
          'Atlas conversations held — mythological dialogues with AI personas',
          'Library texts opened — primary source engagement across traditions',
          'Time spent in each territory — depth of engagement, not just breadth',
        ],
      },
      {
        type: 'quote',
        text: 'You do not follow a path someone else laid. You look back and realize you were making one all along.',
      },
    ],
  },

  /* ────────────────────────────────────────────
   * 5. Chronosphaera
   * ──────────────────────────────────────────── */
  chronosphaera: {
    id: 'chronosphaera',
    title: 'CHRONOSPHAERA',
    subtitle: 'Seven Metals. Seven Planets. A Living Cosmological Clock.',
    tagline: 'Gold for the Sun. Silver for the Moon. Iron for Mars. These are not metaphors. They are coordinates.',
    accent: 'var(--accent-gold)',
    ctaText: 'Enter the Chronosphaera',
    ctaLink: '/chronosphaera',
    highlights: [
      { icon: 'orbit', label: 'Planetary Calendar', desc: 'Every month carries planetary rulership across civilizations' },
      { icon: 'zodiac', label: 'Zodiac Wheel', desc: 'Twelve signs mapped across six cultural traditions' },
      { icon: 'body', label: 'Body & Chaldean', desc: 'The human body as cosmological map — planets governing organs and life stages' },
    ],
    whitePaperTitle: 'The Living Clock',
    sections: [
      {
        type: 'narrative',
        heading: 'The Living Clock',
        paragraphs: [
          'The ancients did not see the cosmos as empty space. They saw it as a living instrument — seven planetary spheres nested inside one another, each one resonating with a metal, a day of the week, a part of the body, a stage of life.',
          'The Chronosphaera is Mythouse\'s central cosmological engine. It maps these ancient correspondences across cultures, traditions, and time periods — not as historical curiosity, but as a working system you can use to orient yourself within the mythological imagination.',
          'Gold for the Sun. Silver for the Moon. Iron for Mars. Copper for Venus. Tin for Jupiter. Lead for Saturn. Mercury for its namesake. These are not metaphors. They are coordinates.',
        ],
        emphasis: 'The clock was always ticking. Now you can read it.',
        borderAccent: 'var(--accent-ember)',
      },
      {
        type: 'features',
        heading: 'Modes of the Sphere',
        items: [
          { title: 'Planetary Calendar', description: 'Navigate a mythological calendar where every month carries planetary rulership, birthstones, sacred flowers, and cultural observances across civilizations.', accent: 'var(--accent-gold)' },
          { title: 'Zodiac Wheel', description: 'Twelve signs mapped across Greek, Egyptian, Hindu, Chinese, Celtic, and Norse traditions. Cross-cultural astrology as living mythology.', accent: 'var(--accent-steel)' },
          { title: 'Body & Chaldean Maps', description: 'The human body as cosmological map — each planet governing organs, temperaments, and stages of life. The Chaldean order rendered visible.', accent: 'var(--accent-ember)' },
        ],
      },
      {
        type: 'showcase',
        heading: 'Twelve Exploration Modes',
        description: 'The Chronosphaera unfolds across more than a dozen interlocking views — each one a different lens on the same cosmological system.',
        highlights: [
          'Orbital view — the classical planetary spheres in motion',
          'Calendar — 12-month mythic calendar with planetary rulers',
          'Zodiac — cross-cultural sign traditions',
          'Body map — planetary correspondences to human anatomy',
          'Chaldean order — the ancient sequence of the spheres',
          'Monomyth overlay — hero\'s journey mapped onto the planets',
          'Artist correspondences — seven great artists aligned to seven metals',
          'Deity pantheons — gods and goddesses across six major cultures',
          'Tarot — planetary and zodiacal card correspondences',
          'Day and night — solar and lunar mythological polarities',
        ],
      },
    ],
  },

  /* ────────────────────────────────────────────
   * 6. Mythosphaera
   * ──────────────────────────────────────────── */
  mythosphaera: {
    id: 'mythosphaera',
    title: 'MYTHOSPHAERA',
    subtitle: 'The Hero\'s Journey as Lived Experience',
    tagline: 'The hero with a thousand faces is also the hero with your face.',
    accent: 'var(--accent-steel)',
    ctaText: 'Explore the Monomyth',
    ctaLink: '/monomyth',
    highlights: [
      { icon: 'stages', label: 'Eight Living Stages', desc: 'Departure through ordeal to return — each stage alive with figures and film' },
      { icon: 'figures', label: '100+ Mythic Figures', desc: 'Odysseus, Inanna, Psyche, Gilgamesh — mapped to the stages they embody' },
      { icon: 'theorists', label: '20+ Theoretical Models', desc: 'Campbell, Jung, Vogler, Murdock — compared across the same structure' },
    ],
    whitePaperTitle: 'The Hero With Your Face',
    sections: [
      {
        type: 'narrative',
        heading: 'The Hero With Your Face',
        paragraphs: [
          'Joseph Campbell called it the monomyth — the single narrative pattern that pulses beneath every hero\'s journey, in every culture, in every century. Departure, initiation, return.',
          'But the monomyth is not a formula. It is a mirror. And in Mythouse, that mirror is interactive.',
          'The Mythosphaera maps Campbell\'s eight stages as a living framework — populated with mythological figures, depth psychology, comparative theorists, and cultural cycles. You do not just read about the stages. You walk through them.',
        ],
        emphasis: 'The hero with a thousand faces is also the hero with your face.',
        borderAccent: 'var(--accent-gold)',
      },
      {
        type: 'features',
        heading: 'Inside the Sphere',
        items: [
          { title: 'Eight Living Stages', description: 'From the Call to Adventure through the Ordeal to the Return — each stage unfolds with mythological figures, films, theoretical models, and depth psychology.', accent: 'var(--accent-steel)' },
          { title: '100+ Mythic Figures', description: 'Odysseus, Inanna, Psyche, Gilgamesh, Arjuna — figures from every tradition mapped to the stages they embody. Their stories illuminate yours.', accent: 'var(--accent-gold)' },
          { title: '20+ Theoretical Models', description: 'Campbell, Jung, Vogler, Murdock, Propp, Turner — the great theorists of narrative and transformation, compared side by side across the same eight stages.', accent: 'var(--accent-ember)' },
        ],
      },
      {
        type: 'quote',
        text: 'The monomyth is not a formula. It is a mirror — and it has been waiting for you to look into it.',
      },
    ],
  },

  /* ────────────────────────────────────────────
   * 7. Mythology Channel
   * ──────────────────────────────────────────── */
  'mythology-channel': {
    id: 'mythology-channel',
    title: 'MYTHOLOGY CHANNEL',
    subtitle: 'A Mythology Education in Motion',
    tagline: 'Every film, lecture, and documentary hand-selected by a mythologist. Not because it trends — because it transforms.',
    accent: 'var(--accent-steel)',
    ctaText: 'Browse the Channel',
    ctaLink: '/mythology-channel',
    highlights: [
      { icon: 'film', label: 'Curated Cinema', desc: 'Mythologically grounded film from Pasolini to Miyazaki' },
      { icon: 'lecture', label: 'Campbell Lectures', desc: 'The foundational talks that started a movement' },
      { icon: 'salon', label: 'Myth Salon', desc: 'Annual panel discussions with leading scholars' },
    ],
    whitePaperTitle: 'Curated, Not Algorithmic',
    sections: [
      {
        type: 'narrative',
        heading: 'Curated, Not Algorithmic',
        paragraphs: [
          'The internet is full of mythology content. Most of it is shallow, sensationalized, or algorithmically surfaced to maximize engagement rather than understanding.',
          'The Mythology Channel is different. Every film, lecture, and documentary is hand-selected by a mythologist — chosen not because it trends, but because it teaches. Because it transforms.',
          'This is what a mythology education looks like when it moves — structured programming that rewards sustained attention, not distracted scrolling.',
        ],
        emphasis: 'What you watch shapes what you see. Choose carefully.',
        borderAccent: 'var(--accent-gold)',
      },
      {
        type: 'showcase',
        heading: 'What\'s Showing',
        description: 'The channel curates across genres and formats — from academic lectures to narrative documentaries to mythologically grounded cinema.',
        highlights: [
          'Joseph Campbell lectures — the foundational talks that started a movement',
          'Depth psychology documentaries — Jung, Hillman, and the archetypal tradition',
          'World mythology films — from Pasolini to Miyazaki to Coppola',
          'Sacred site explorations — on-location visits to the world\'s mythic geography',
          'Myth Salon recordings — annual panel discussions with leading scholars',
          'Storytelling masterclasses — the craft of narrative from those who practice it',
        ],
      },
      {
        type: 'quote',
        text: 'A single lecture by Campbell changed more lives than a thousand viral clips. Depth takes time. The Channel gives you that time.',
      },
    ],
  },

  /* ────────────────────────────────────────────
   * 8. Atlas
   * ──────────────────────────────────────────── */
  atlas: {
    id: 'atlas',
    title: 'ATLAS',
    subtitle: 'An Intelligence Trained in the Mythological Imagination',
    tagline: 'Not a search engine. Not a chatbot. A dialogue with the deep.',
    accent: 'var(--accent-steel)',
    ctaText: 'Speak with Atlas',
    ctaLink: '/atlas',
    highlights: [
      { icon: 'personas', label: '25+ Personas', desc: 'Planetary voices, zodiacal intelligences, elemental spirits' },
      { icon: 'voice', label: 'Voice Dialogue', desc: 'Speak aloud — mythological dialogue was always oral' },
      { icon: 'memory', label: 'Living Memory', desc: 'Remembers your journey and grows with you across sessions' },
    ],
    whitePaperTitle: 'Not a Search Engine',
    sections: [
      {
        type: 'narrative',
        heading: 'Not a Search Engine',
        paragraphs: [
          'Atlas is not a chatbot. It is not a search engine. It is an artificial intelligence trained in the mythological imagination itself — the patterns, symbols, archetypes, and narrative structures that have shaped human consciousness for millennia.',
          'When you speak with Atlas, you are not asking questions and receiving answers. You are entering a dialogue — one that draws on the depth psychology of Jung, the comparative mythology of Campbell, the narrative theory of Vogler and Murdock, and the living traditions of a dozen cultures.',
          'Atlas remembers. Atlas listens. Atlas meets you where you are — and asks the questions you did not know you needed to hear.',
        ],
        emphasis: 'The mythological imagination finally has a voice.',
        borderAccent: 'var(--accent-gold)',
      },
      {
        type: 'features',
        heading: 'Capacities',
        items: [
          { title: '25+ Personas', description: 'Speak with planetary voices, zodiacal intelligences, cardinal directions, and elemental spirits. Each persona carries its own mythological perspective.', accent: 'var(--accent-gold)' },
          { title: 'Voice Interaction', description: 'Speak aloud. Atlas listens through your microphone and responds in kind. Mythological dialogue was always oral — now it can be again.', accent: 'var(--accent-ember)' },
          { title: 'Living Memory', description: 'Atlas remembers your conversations, your coursework, your journey progress. It meets you where you actually are — not where a generic prompt assumes you to be.', accent: 'var(--accent-steel)' },
        ],
      },
      {
        type: 'comparison',
        heading: 'A Different Kind of Intelligence',
        left: { label: 'Typical AI', text: 'Answers questions. Retrieves information. Optimizes for speed and convenience. Forgets you the moment the session ends.' },
        right: { label: 'Atlas', text: 'Holds dialogue. Draws on mythological depth. Asks as much as it answers. Remembers your journey and grows with you across sessions.' },
      },
    ],
  },

  /* ────────────────────────────────────────────
   * 9. Fellowship Capacities
   * ──────────────────────────────────────────── */
  fellowship: {
    id: 'fellowship',
    title: 'THE FELLOWSHIP',
    subtitle: 'Mythology Was Never Meant to Be Studied Alone',
    tagline: 'No likes. No followers. No algorithmic feeds. Only the work — and the people who care about it.',
    accent: 'var(--accent-fire)',
    ctaText: 'Join the Fellowship',
    ctaLink: '/guild',
    highlights: [
      { icon: 'guild', label: 'The Guild', desc: 'A gathering place for seekers and shared mythological conversation' },
      { icon: 'mentor', label: 'Mentor Directory', desc: 'Guides who have walked the territory — available for mentorship' },
      { icon: 'shared', label: 'Shared Learning', desc: 'Group coursework, fellowship completions, collaborative tracking' },
    ],
    whitePaperTitle: 'The Fire Burns Brighter Together',
    sections: [
      {
        type: 'narrative',
        heading: 'The Fire Burns Brighter Together',
        paragraphs: [
          'The great mythological traditions were never solitary pursuits. They were communal — told around fires, debated in academies, transmitted from mentor to student across generations.',
          'The Fellowship is Mythouse\'s community layer. It connects seekers with one another and with mentors who have walked the territory before. It creates space for shared learning, collaborative exploration, and the kind of conversation that only happens when people gather around something that matters.',
          'This is not a social network. There are no likes, no followers, no algorithmic feeds. There is only the work — and the people who care about it.',
        ],
        emphasis: 'The fire burns brighter when others gather around it.',
        borderAccent: 'var(--accent-ember)',
      },
      {
        type: 'features',
        heading: 'Community Instruments',
        items: [
          { title: 'The Guild', description: 'A gathering place for seekers — shared discoveries, collaborative projects, and the kind of mythological conversation that the internet usually destroys.', accent: 'var(--accent-fire)' },
          { title: 'Mentor Directory', description: 'Find guides who have walked the territory. Mythologists, depth psychologists, storytellers, and scholars available for one-on-one mentorship.', accent: 'var(--accent-gold)' },
          { title: 'Shared Learning', description: 'Fellowship completions, group coursework, and collaborative journey tracking. See what your companions have discovered — and what they are still seeking.', accent: 'var(--accent-steel)' },
        ],
      },
      {
        type: 'quote',
        text: 'Mythology is not studied alone. It is practiced together — or it dies in the library.',
      },
    ],
  },

  /* ────────────────────────────────────────────
   * 10. VR/XR Capabilities
   * ──────────────────────────────────────────── */
  'vr-xr': {
    id: 'vr-xr',
    title: 'VR / XR',
    subtitle: 'Step Inside the Sacred',
    tagline: 'Mythology was never meant to be read about. It was meant to be experienced.',
    accent: 'var(--accent-gold)',
    ctaText: 'Enter Immersive Mode',
    ctaLink: '/chronosphaera/vr',
    highlights: [
      { icon: 'panorama', label: 'Sacred Sites 360', desc: 'Step inside temples, caves, and stone circles in immersive panorama' },
      { icon: 'orbit', label: 'Chronosphaera VR', desc: 'The planetary spheres in three dimensions — walk among the orbits' },
      { icon: 'globe', label: 'Mythic Earth', desc: '3D globe with sacred sites and mythological locations at scale' },
    ],
    whitePaperTitle: 'Beyond the Screen',
    sections: [
      {
        type: 'narrative',
        heading: 'Beyond the Screen',
        paragraphs: [
          'Mythology was never meant to be read about. It was meant to be experienced — in temples, in caves, in stone circles, under open sky.',
          'Mythouse\'s VR and XR capabilities bring that immersive dimension back. Step inside sacred sites in 360-degree panorama. Walk through the Chronosphaera\'s planetary spheres in three dimensions. Stand at the center of a living cosmological engine and watch the ancient orbits move around you.',
          'This is not a gimmick. It is the natural extension of mythological thinking — from page to screen to presence.',
        ],
        emphasis: 'The sacred was always immersive. Now the technology has caught up.',
        borderAccent: 'var(--accent-ember)',
      },
      {
        type: 'features',
        heading: 'Immersive Experiences',
        items: [
          { title: 'Sacred Sites 360', description: 'Step inside temples, caves, stone circles, and sacred architecture from around the world. Immersive panoramas of humanity\'s most hallowed ground.', accent: 'var(--accent-gold)' },
          { title: 'Chronosphaera VR', description: 'The seven planetary spheres rendered in three dimensions. Walk among the orbits. Touch the metals. See the cosmological clock from the inside.', accent: 'var(--accent-steel)' },
          { title: 'Mythic Earth', description: 'A 3D globe with every sacred site, mythological location, and literary landmark mapped and annotated. Geography as mythology, rendered at scale.', accent: 'var(--accent-ember)' },
        ],
      },
      {
        type: 'showcase',
        heading: 'Available Experiences',
        description: 'VR and XR content continues to expand. Current immersive experiences include:',
        highlights: [
          'Chronosphaera orbital scene — the classical planetary spheres in WebXR',
          'Celestial scene — zodiac constellations rendered in 3D space',
          'Sacred Sites 360 — panoramic views of temples and sacred architecture',
          'Mythic Earth globe — interactive 3D mapping of world mythology',
          'Planet detail views — close-up exploration of each planetary sphere',
          'Works on headset, desktop, and mobile — no special hardware required',
        ],
      },
    ],
  },
};

/* Ordered array for prev/next arrow navigation */
export const DISCOVER_FEATURE_ORDER = [
  'journeys', 'games', 'story-forge', 'coursework', 'chronosphaera',
  'mythosphaera', 'mythology-channel', 'atlas', 'fellowship', 'vr-xr',
];

export default DISCOVER_FEATURE_DEFS;
