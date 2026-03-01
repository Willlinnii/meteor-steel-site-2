/**
 * Rich content data for Mythology Channel series info popups.
 * Keyed by show id (matches SHOWS array in MythologyChannelPage.js).
 */
const SERIES_INFO = {
  'myths-tv': {
    title: 'Myths: Greatest Mysteries',
    tagline: 'The international TV series exploring humanity\'s greatest myths.',
    description: [
      'Myths: Greatest Mysteries is an international television series spanning 30 episodes across three seasons. The series travels the globe to investigate the enduring power of myth — from creation stories to hero journeys, from underworld descents to tales of transformation.',
      'Aired across Europe, the United Kingdom, South America, and Central America, the series has been translated into a dozen languages. Each season deepens the inquiry: the outer ring surveys the world\'s great mythic traditions, the middle ring traces recurring patterns across cultures, and the inner ring explores the personal dimensions of myth in modern life.',
    ],
    people: [
      { name: 'Will Linn, Ph.D.', role: 'Recurring meta-expert & mythologist' },
    ],
    links: [
      { label: 'See Full Series on Roku', url: 'https://therokuchannel.roku.com/details/5dab3993319a5c3d96f82be3d66a0f2e/myths-greatest-mysteries' },
    ],
    hasDetailPage: true,
  },

  'myth-salon': {
    title: 'Myth Salon',
    tagline: 'The Eranos of the West Coast.',
    description: [
      'Myth Salon began as intimate gatherings in co-founder Dana White\'s home — conversations where mythology, depth psychology, and the soul of culture came alive through dialogue. Dennis Patrick Slattery described it as "the Eranos of the West Coast."',
      'With early support from the Pacifica Graduate Institute Alumni Association, Myth Salon grew into a vital community space. During COVID-19, it became a lifeline of connection for mythologists, storytellers, and seekers worldwide.',
      'Dana\'s singing bowl opened every gathering. After her passing, a memorial recognition is held at every Myth & Film event. The annual tentpole — the Myth & Film event — takes place at the International Society for Mythology\'s Mythologium conference.',
    ],
    people: [
      { name: 'Will Linn', role: 'Founder' },
      { name: 'Dana White', role: 'Co-founder (in memoriam)' },
      { name: 'Maria Tatar', role: 'Core panelist' },
      { name: 'Chris Vogler', role: 'Core panelist' },
      { name: 'Maureen Murdock', role: 'Core panelist' },
      { name: 'John Bucher', role: 'Core panelist' },
      { name: 'Clyde Ford', role: 'Core panelist' },
      { name: 'Dara Marks', role: 'Core panelist' },
    ],
    links: [],
    hasDetailPage: false,
  },

  'mythosophia': {
    title: 'Mythosophia',
    tagline: 'Where mythology meets the wisdom tradition.',
    description: [
      'Mythosophia began in 2011 as an email list for the Joseph Campbell Foundation\'s Mythological Roundtable Network of the Ojai Foundation. By 2013 it had evolved into the Mythosophia Radio Series on Mythosophia.net — long-form conversations at the intersection of myth, philosophy, and lived experience.',
      'In 2020, Mythosophia merged into Mythouse.org and is now co-produced with the International Society for Mythology (ISM). The series carries forward its founding impulse: a philosophical synthesis where mythology meets the wisdom tradition.',
    ],
    people: [],
    links: [],
    hasDetailPage: false,
  },

  'deep-sight': {
    title: 'Deep Sight',
    tagline: 'Visionary explorations of myth and the imaginal.',
    description: [
      'Deep Sight ventures into the imaginal realm — what Henry Corbin called the mundus imaginalis — the intermediate world between sense perception and abstract intellect where images carry their own reality and meaning.',
      'Drawing from depth psychology, active imagination, and mythic vision, each episode explores how the imaginal dimension shapes human experience: dreams, creative vision, sacred encounter, and the living image at the heart of every myth.',
    ],
    people: [],
    links: [],
    hasDetailPage: false,
  },

  'journey-of-the-goddess': {
    title: 'Journey of the Goddess',
    tagline: 'Tracing the feminine divine through myth, culture, and consciousness.',
    description: [
      'Journey of the Goddess follows the thread of the feminine divine across the world\'s mythic traditions — from Inanna\'s descent to Demeter\'s search, from Kali\'s dance of destruction to the Virgin of Guadalupe\'s apparition.',
      'Connected to the Heroine\'s Journey tradition, the series explores how the goddess archetype illuminates women\'s experience and challenges the hero-centric narratives that dominate Western storytelling.',
    ],
    people: [],
    links: [],
    hasDetailPage: false,
  },

  'transformational-narrative': {
    title: 'Transformational Narrative',
    tagline: 'Story as a living technology of transformation.',
    description: [
      'Transformational Narrative examines the power of story to reshape consciousness and culture. Beyond entertainment, beyond instruction — narrative as a living technology that reorganizes how we perceive ourselves and the world.',
      'Each episode investigates how stories transform: personal stories that heal, cultural narratives that shift collective understanding, and mythic patterns that have guided human transformation for millennia.',
    ],
    people: [],
    links: [],
    hasDetailPage: false,
  },

  'dennis-slattery': {
    title: 'Myth, Poetics & Culture',
    tagline: 'Mythopoetics, literature, and the life of the imagination.',
    description: [
      'Myth, Poetics & Culture features the work of Dennis Patrick Slattery, Professor Emeritus at Pacifica Graduate Institute and one of the foremost scholars of mythopoetics. His talks explore the deep connections between mythology, literature, and the poetic imagination.',
      'A member of the Mythouse Scholar Advisory Circle, Slattery brings decades of teaching and writing to bear on questions of how myth lives in language, how poetry carries archetypal truth, and how culture is shaped by the stories it tells itself.',
    ],
    people: [
      { name: 'Dennis Patrick Slattery', role: 'Professor Emeritus, Pacifica Graduate Institute' },
    ],
    links: [],
    hasDetailPage: false,
  },

  'lionel-corbett': {
    title: 'Depth & Meaning',
    tagline: 'The numinous — where psyche meets the sacred.',
    description: [
      'Depth & Meaning features Lionel Corbett, Jungian analyst and author, exploring the numinous — the direct experience of the sacred as it manifests in psyche and dream.',
      'Corbett\'s work bridges analytical psychology and the study of religious experience, investigating how the divine appears not only in traditional religious forms but in the intimate, often unexpected encounters of everyday life — in dreams, symptoms, relationships, and the deep movements of the soul.',
    ],
    people: [
      { name: 'Lionel Corbett', role: 'Jungian analyst & author' },
    ],
    links: [],
    hasDetailPage: false,
  },

  'myth-is-all-around-us': {
    title: 'Myth is All Around Us',
    tagline: 'Mythic patterns hiding in plain sight.',
    description: [
      'Myth is All Around Us reveals the mythic patterns woven into everyday life — in architecture and city planning, in sports rituals and holiday traditions, in the stories we tell at dinner tables and the dreams that visit us at night.',
      'The series invites viewers to develop mythic sight: the ability to recognize archetypal patterns operating in the ordinary world, transforming the mundane into the meaningful.',
    ],
    people: [],
    links: [],
    hasDetailPage: false,
  },

  'scholar-talks': {
    title: 'Scholar Talks',
    tagline: 'Academic lectures on mythology, religion, and depth psychology.',
    description: [
      'Scholar Talks brings together leading voices in mythology, religion, and depth psychology for substantive academic presentations. Contributors come from the Mythouse Scholar Advisory Circle and the broader community of mythological scholarship.',
      'The series preserves and shares the kind of deep, rigorous inquiry that happens at academic conferences and specialized symposia — making it accessible to anyone drawn to the serious study of myth.',
    ],
    people: [
      { name: 'John Colarusso', role: 'Scholar Advisory Circle' },
      { name: 'Dennis Patrick Slattery', role: 'Scholar Advisory Circle' },
      { name: 'Robert Guyker', role: 'Scholar Advisory Circle' },
      { name: 'Rosalie Bouck', role: 'Scholar Advisory Circle' },
      { name: 'Sunil Parab', role: 'Scholar Advisory Circle' },
    ],
    links: [],
    hasDetailPage: false,
  },

  'mastery-circle': {
    title: 'Mastery Circle',
    tagline: 'Deep-dive sessions on mythological mastery and practice.',
    description: [
      'Mastery Circle offers intensive sessions for those committed to deepening their understanding and practice of mythology. Beyond introductory survey — these are working sessions where participants engage with mythic material at a level of sustained attention and rigor.',
      'Each session focuses on a specific mythic tradition, text, or practice, building the kind of fluency that comes only through repeated, disciplined engagement with the material.',
    ],
    people: [],
    links: [],
    hasDetailPage: false,
  },

  'mythology-classroom': {
    title: 'Mythology Classroom',
    tagline: 'Foundations of mythological study.',
    description: [
      'Mythology Classroom provides educational sessions teaching the foundations of mythological study — the key figures, traditions, methods, and frameworks that form the basis of serious engagement with myth.',
      'Designed for those entering the field or deepening their foundational knowledge, the series covers essential ground: comparative methodology, major mythic traditions, core theoretical frameworks, and the practical skills of mythological interpretation.',
    ],
    people: [
      { name: 'Sunil Parab', role: 'Leader, Sindhu Veda & Mythology Classroom' },
    ],
    links: [],
    hasDetailPage: false,
  },

  'the-tao': {
    title: 'The Tao',
    tagline: 'The Way that can be told is not the eternal Way.',
    description: [
      'The Tao explores Taoist philosophy and its mythic dimensions — the interplay of yin and yang, the principle of wu wei (non-action), and the understanding of nature as the primary teacher.',
      'Drawing from the Tao Te Ching, Chuang Tzu, and the broader Taoist tradition, the series traces how Taoist wisdom appears in mythology, in the cycles of nature, and in the practice of living in harmony with the Way.',
    ],
    people: [],
    links: [],
    hasDetailPage: false,
  },

  'pulling-focus': {
    title: 'Pulling Focus',
    tagline: 'Documentary depths and archetypal realities.',
    description: [
      'Pulling Focus is the flagship series of the Mythology Channel production company, exploring the intersection of documentary filmmaking and archetypal reality. Each episode examines how non-fiction storytelling reveals the mythic patterns operating beneath the surface of real events.',
      'The series brings together expertise in media production, depth psychology, and mythological interpretation — finding the archetypal dimensions in documentary work.',
    ],
    people: [
      { name: 'Cindi Anderson', role: 'Executive Producer, PhD Mythologist & Media Specialist' },
      { name: 'Odette Springer', role: 'Music Producer & Documentary Director' },
      { name: 'Teri Strickland', role: 'Music Studio Co-Founder, Therapist' },
    ],
    links: [],
    hasDetailPage: false,
  },

  'climate-journey': {
    title: 'Climate Journey',
    tagline: 'Mythic perspectives on the climate crisis.',
    description: [
      'Climate Journey brings mythic perspective to the defining challenge of our time. The series explores how mythological frameworks illuminate the climate crisis — not as a merely technical problem, but as a story about humanity\'s relationship to the Earth.',
      'Emerged from a partnership between the Harvard Alumni Association, Climate Reality, and StoryAtlas, the Climate Journey has reached over 7,000 students. The associated Climate Bootcamp offers structured coursework for those ready to engage more deeply.',
    ],
    people: [],
    links: [
      { label: 'Enter the Climate Bootcamp', url: 'https://www.thestoryatlas.com/my-courses/climate-bootcamp/introducing-the-situation' },
    ],
    hasDetailPage: false,
  },

  'healer-thousand-faces': {
    title: 'Healer with a Thousand Faces',
    tagline: 'Conversations with friends & teachers about how our wounds lead us to our wandering, our wondering, our weird, our wisdom, and our work in the world.',
    description: [
      'Healer with a Thousand Faces explores the ancient connection between wounding and healing — the idea that the path to becoming a healer begins with one\'s own wounds. Through conversations with friends and teachers, the series traces how suffering opens the door to wandering, wondering, weirdness, wisdom, and ultimately, our work in the world.',
      'The title echoes Campbell\'s Hero with a Thousand Faces, but shifts the lens from the hero\'s conquest to the healer\'s transformation — the wounded healer archetype that runs through shamanic traditions, depth psychology, and the lived experience of those called to serve.',
    ],
    people: [],
    links: [
      { label: 'Listen on Spotify', url: 'https://open.spotify.com/show/4r1gfmbphIXH2VcAs9NWnY?si=QBe7A5srSuGSbAHZjhWb8Q' },
      { label: 'Listen on Apple Podcasts', url: 'https://podcasts.apple.com/us/podcast/the-healer-with-a-thousand-faces/id1842982595' },
    ],
    hasDetailPage: false,
  },
};

export default SERIES_INFO;
