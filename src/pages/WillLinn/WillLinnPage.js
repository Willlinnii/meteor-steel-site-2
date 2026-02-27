import React, { useState, useMemo } from 'react';
import './WillLinnPage.css';

// ── CV Data ──────────────────────────────────────────────
const CV_CATEGORIES = [
  {
    id: 'leadership',
    label: 'Academic & Institutional Leadership',
    items: [
      {
        title: 'Master of Ceremonies, KinEarth',
        org: 'Kintsugi Ranch, Austin, TX',
        dates: '2024\u2013Present',
        sortYear: 2024,
        desc: 'Led and coordinated monthly community gatherings (Sermons of the Earth) in collaboration with Jordan and Adrian Grenier, supporting community-building through program design, facilitation, communications, budget oversight, and coordination of logistics. Delivered public-facing talks translating mythological, philosophical, and depth-psychological frameworks for audiences beyond the academic classroom.',
        tags: ['Community', 'Ceremony', 'Program Design'],
      },
      {
        title: 'Founding Chair, General Education Department',
        org: 'Hussian College (formerly Relativity School / Studio School), Los Angeles',
        dates: '2015\u20132023',
        sortYear: 2015,
        desc: 'Built myth and storytelling into the DNA of a new film and performing arts college. Designed core curriculum, recruited and managed 8\u201312 instructors per semester, wrote accreditation materials, oversaw department and library budgets, originated scholarships and grants, and served on program advisory committees across all departments through multiple institutional transformations including acquisition.',
        tags: ['Curriculum', 'Faculty Leadership', 'Accreditation', 'Budgeting'],
      },
      {
        title: 'Founder & Executive Director, Joseph Campbell Writers\u2019 Room',
        org: 'Joseph Campbell Foundation & Studio School, Los Angeles',
        dates: '2017\u20132019',
        sortYear: 2017,
        desc: 'Writing Resource Center at Los Angeles Center Studios supporting student and professional scripts. Announced in IndieWire. Oversaw renovation, fundraising, web development, marketing, a certificate program for the Jung Institute of LA, Script Lab Summits with ScreenCraft, an Academy Award event, and mythic studio tours with Atlas Obscura.',
        tags: ['Writing', 'Production', 'Partnerships'],
      },
      {
        title: 'Editor & Interns Director',
        org: 'Joseph Campbell Foundation',
        dates: '2017\u20132019',
        sortYear: 2017,
        desc: 'Oversaw JCF interns writing for the Campbell in Culture and Mythic Resources series on jcf.org. One of several leadership positions held at JCF over an eight-year period beginning in 2011.',
        tags: ['Editorial', 'Mentorship'],
      },
      {
        title: 'Founder, Mythouse.org',
        org: 'Mythouse',
        dates: '2021\u2013Present',
        sortYear: 2021,
        desc: 'Community for myth and storytelling hosting an interactive calendar of mythic time, resources on mythological topics, and a library of Myth Salons with figures from Chris Vogler to Maria Tatar. Partnered with communities in Scotland (Maiden Mother Crone) and India (Sindu Veda). Co-led Myth Salons with Dana White with founding support from the Pacifica Alumni Association.',
        tags: ['Community', 'Public Scholarship', 'International'],
      },
      {
        title: 'Curriculum Developer & Speaker, Climate Bootcamp',
        org: 'Harvard Alumni Association & Climate Reality',
        dates: '2020',
        sortYear: 2020,
        desc: 'Structured the course sequence as a transformational narrative. Built on StoryAtlas\u2014a course delivery platform created with a former student. Faculty included representatives from Ivy League colleges, a Fortune 50 CEO, a head of state, and lead climate advisor to the White House.',
        tags: ['Curriculum', 'Climate', 'Harvard'],
      },
      {
        title: 'Director, Writing Lab',
        org: 'Relativity School, Los Angeles',
        dates: '2015\u20132017',
        sortYear: 2015,
        desc: 'Oversaw the development of student stories while managing screenwriters and mythologists working with students.',
        tags: ['Writing', 'Mentorship'],
      },
    ],
  },
  {
    id: 'education',
    label: 'Education',
    items: [
      { title: 'Ph.D., World Mythology & Depth Psychology', org: 'Pacifica Graduate Institute', dates: '2015', sortYear: 2015 },
      { title: 'M.A., World Mythology & Depth Psychology', org: 'Pacifica Graduate Institute', dates: '2015', sortYear: 2015 },
      { title: 'B.A., Philosophy', org: 'Sewanee: The University of the South', dates: '2008', sortYear: 2008 },
      { title: 'CORe (Certificate of Readiness)', org: 'Harvard Business School', dates: '2013', sortYear: 2013 },
      { title: 'High School Diploma', org: 'Cranbrook-Kingswood School', dates: '2004', sortYear: 2004 },
    ],
  },
  {
    id: 'media',
    label: 'Media Production & Public Scholarship',
    items: [
      {
        title: 'Producer & Co-Founder, Fascinated by Everything',
        org: 'FBE',
        dates: '2020\u2013Present',
        sortYear: 2020,
        desc: 'Visionary Experiences for immersive mediums\u2014dome shows, VR, projection-mapped events, documentary art, audio landscapes. The Psychedelic Mixtape premiered at COSM Studios (2025) and airs in planetariums worldwide. Sources and structures narration by Aldous Huxley, Joseph Campbell, and Maria Tatar.',
        tags: ['Immersive', 'VR', 'Production'],
      },
      {
        title: 'Meta-Expert / "Co-Host", Myths: The Greatest Mysteries of Humanity',
        org: 'ZDF / Storyhouse \u2014 Sky, History Channel, Channel 5, Roku',
        dates: '2019\u20132023',
        sortYear: 2019,
        desc: 'Three seasons, 30 episodes exploring living myths\u2014from the Grail, Flood, and Amazons to Werewolves, Vampires, and Zombies to Cleopatra, Alexander, and Pope Joan. Airing across Europe and the Americas. Currently preparing a new series on mythic treasures.',
        tags: ['Television', 'International', 'Mythology'],
      },
      {
        title: 'Interviewee, Feature Documentaries',
        org: 'Exhibit A Productions (Alexandre Philippe)',
        dates: '2019\u20132023',
        sortYear: 2019,
        desc: 'Memory: Origins of Alien (2019, Sundance premiere) and The Taking (2023). Both received theatrical releases. Participated in panels at ComicCon, Esalen, and Santa Barbara Film Festival.',
        tags: ['Film', 'Documentary', 'Sundance'],
      },
      {
        title: 'Producer, Dead Thing',
        org: 'Feature Film \u2014 Shudder / AMC+',
        dates: '2025',
        sortYear: 2025,
        desc: 'Supported production from story notes to finding resources. Selected by Hollywood Reporter as a top Horror Film of the year; highlighted in the New York Times annual wrap up.',
        tags: ['Film', 'Production'],
      },
      {
        title: 'Founder & Co-Host, Mythosophia',
        org: 'KZSB Santa Barbara News-Press Radio',
        dates: '2014\u20132018',
        sortYear: 2014,
        desc: 'Radio show featuring guests including Jeffrey Kripal, Christine Downing, Dennis Slattery, John Colarusso, Glen Slater, and others across 16+ episodes on mythology in culture.',
        tags: ['Radio', 'Public Scholarship'],
      },
      {
        title: 'Producer, Mythology Channel',
        org: 'Mythouse / Mythology Channel',
        dates: '2015\u2013Present',
        sortYear: 2015,
        desc: 'Production arm supporting Mythouse\u2014clients including KZSB, Jung Institute of LA, Pacifica Graduate Institute, and the Philosophical Research Society. Now prioritizes original productions and StoryAtlas course materials.',
        tags: ['Production', 'Media'],
      },
    ],
  },
  {
    id: 'publications',
    label: 'Publications & Dissertation',
    items: [
      {
        title: '"Archetypal Patterns of the Pacific Rim"',
        org: 'Journal of Asian Pop Culture, Penn State University Press',
        dates: '2025',
        sortYear: 2025,
        desc: 'Co-authored with Shane Surrey, Ph.D.',
        tags: ['Peer-Reviewed'],
      },
      {
        title: '"Joseph Campbell Is the Hidden Link Between 2001, Star Wars, and Mad Max: Fury Road"',
        org: 'IndieWire',
        dates: '2018',
        sortYear: 2018,
        tags: ['Press'],
      },
      {
        title: '"70 Years of the Hero\'s Journey"',
        org: 'Joseph Campbell Foundation',
        dates: '2019',
        sortYear: 2019,
        tags: ['Essay'],
      },
      {
        title: '"Rebirth of the Adult Imagination"',
        org: 'Imagine Magazine',
        dates: '2022',
        sortYear: 2022,
        tags: ['Essay'],
      },
      {
        title: 'Ph.D. Dissertation: Western Myths of Knowledge: Particles of Stone & Waves of Elixir',
        org: 'Pacifica Graduate Institute. Committee: Evans Lansing Smith (Chair), Keiron Le Grice, Maria Tatar',
        dates: '2015',
        sortYear: 2015,
        tags: ['Dissertation'],
      },
      {
        title: 'M.A. Thesis: Theme Parks, Merchandise, and Ritual Storytelling',
        org: 'Pacifica Graduate Institute',
        dates: '2011',
        sortYear: 2011,
        tags: ['Thesis'],
      },
    ],
  },
  {
    id: 'courses',
    label: 'Courses Taught',
    items: [
      { title: 'GED 159: Story: Mediums & Genres', org: 'Relativity School / Studio School / Hussian College', dates: '2016\u20132022', sortYear: 2016, tags: ['Undergraduate Core'] },
      { title: 'GED 204: Philosophy', org: 'Studio School / Hussian College', dates: '2018\u20132023', sortYear: 2018, tags: ['Undergraduate Core'] },
      { title: 'GED 202: Anthropology', org: 'Studio School / Hussian College', dates: '2019\u20132022', sortYear: 2019, tags: ['Undergraduate Core'] },
      { title: 'GED 111: Writing Process', org: 'Studio School / Hussian College', dates: '2019\u20132021', sortYear: 2019, tags: ['Undergraduate Core'] },
      { title: 'MS 699: Technopoesis & Myths of Steel', org: 'Pacifica Graduate Institute', dates: '2018', sortYear: 2018, tags: ['Doctoral Seminar'] },
      { title: 'Mythology & the Hero\u2019s Journey', org: 'DAS School, Amsterdam', dates: '2018', sortYear: 2018, tags: ['Postdoctoral'] },
      { title: 'FDC 342: Expanding Narrative', org: 'Relativity School / Studio School / Hussian College', dates: '2016\u20132019', sortYear: 2016, tags: ['Undergraduate Elective'] },
      { title: 'GED 404: Arthurian Myth & Grail Romances', org: 'Studio School', dates: '2018', sortYear: 2018, tags: ['Independent Study'] },
      { title: 'CDN 505: Mythic Storytelling for Commercial Dance', org: 'Studio School', dates: '2017', sortYear: 2017, tags: ['Post-Baccalaureate'] },
      { title: 'GED 406: Myth & Shakespeare', org: 'Studio School', dates: '2017', sortYear: 2017, tags: ['Independent Study'] },
      { title: 'Mythology & Storytelling Camp', org: 'Relativity School / Studio School / Hussian College', dates: '2017\u20132022', sortYear: 2017, tags: ['Summer', 'High School'] },
      { title: 'Leadership & Storytelling', org: 'ICL Academy, Dwight Schools', dates: '2016\u20132018', sortYear: 2016, tags: ['High School'] },
      { title: 'GED 101: Hero\u2019s Journey & Mythic Storytelling', org: 'Relativity School', dates: '2015', sortYear: 2015, tags: ['Undergraduate Core'] },
      { title: 'Arthurian & Grail Myths', org: 'Birmingham-Southern University, UK', dates: '2012', sortYear: 2012, tags: ['Travel Course'] },
    ],
  },
  {
    id: 'consulting',
    label: 'Consulting & Additional Roles',
    items: [
      {
        title: 'Mythic Consulting',
        org: 'Original Creative Agency',
        dates: '2019\u20132024',
        sortYear: 2019,
        desc: 'Worked with leading musicians to integrate personal, creative, and professional narratives into coherent myth. Artists included Bonnie McKee & Miguel.',
        tags: ['Music', 'Branding', 'Narrative'],
      },
      {
        title: 'Narrative Advisor',
        org: 'ShipShape',
        dates: '2019\u2013Present',
        sortYear: 2019,
        desc: 'Cultivated archetypal animal characters for home communication platform. Supported branding and marketing journeys. Originated the ShipShape name.',
        tags: ['Branding', 'AI', 'Narrative'],
      },
      {
        title: 'Writer & Creator, Irreverent Comic Series',
        org: 'Fartcoin.fun',
        dates: '2025',
        sortYear: 2025,
        desc: 'AI-generated comics employing mythic humor and archetypal critique of monetary systems.',
        tags: ['AI', 'Comics', 'Creative'],
      },
    ],
  },
  {
    id: 'boards',
    label: 'Advisory Boards',
    items: [
      { title: 'BFA Film and Digital Content, Program Advisory Committee', org: 'Relativity School / Studio School / Hussian College', dates: '2015\u20132023', sortYear: 2015 },
      { title: 'BFA Commercial Dance, Program Advisory Committee', org: 'Relativity School / Studio School / Hussian College', dates: '2015\u20132023', sortYear: 2015 },
      { title: 'BFA Acting for Film and Television, Program Advisory Committee', org: 'Relativity School / Studio School / Hussian College', dates: '2015\u20132023', sortYear: 2015 },
      { title: 'BFA Musical Theatre, Program Advisory Committee', org: 'Relativity School / Studio School / Hussian College', dates: '2015\u20132023', sortYear: 2015 },
      { title: 'Educational Advisory Board', org: 'Joseph Campbell Foundation', dates: '2020\u20132021', sortYear: 2020 },
      { title: 'Advisory Board', org: 'Joseph Campbell Writers\u2019 Room', dates: '2017\u20132018', sortYear: 2017 },
      { title: 'Advisory Committee', org: 'ShipShape.ai', dates: '2016\u20132021', sortYear: 2016 },
      { title: 'Mythworker Board, Mythological RoundTable\u00ae Directors', org: 'Joseph Campbell Foundation', dates: '2014\u20132019', sortYear: 2014 },
    ],
  },
  {
    id: 'presentations',
    label: 'Select Presentations & Talks',
    items: [
      { title: 'Autonomy in the Automation Age', org: 'Tethics & Chill, Austin, TX', dates: '2025', sortYear: 2025, tags: ['AI', 'Mythology'] },
      { title: 'Meteor Steel', org: 'Traditional Cosmology Society, University of Edinburgh', dates: '2024', sortYear: 2024, tags: ['Invited Talk'] },
      { title: 'Osiris: A Transformational Narrative', org: 'Edge Esmeralda, Isis Oasis Lodge, Northern California', dates: '2024', sortYear: 2024, tags: ['Guided Journey'] },
      { title: 'Remembering Tam Lin / Bridget Cleary / Thomas the Rhymer / Merlin', org: 'Maiden Mother Crone, Edinburgh, Scotland', dates: '2024', sortYear: 2024, tags: ['Panel'] },
      { title: 'Transformational Narratives', org: 'Climate Bootcamp, Harvard Alumni Association', dates: '2022', sortYear: 2022, tags: ['Harvard'] },
      { title: '"Does the Hero\u2019s Journey Work?"', org: 'National Film Festival for Talented Youth', dates: '2021', sortYear: 2021, tags: ['Film Festival'] },
      { title: 'The Hero\u2019s Journey & Change', org: 'Illuminate Film Festival (with Chris Vogler)', dates: '2021', sortYear: 2021, tags: ['Film Festival'] },
      { title: '"25th Anniversary of The Writer\u2019s Journey"', org: 'with Vogler, Aronofsky, Kripal \u2014 Mythouse / ScreenCraft / MWP', dates: '2020', sortYear: 2020, tags: ['Major Event'] },
      { title: 'Memory: Origins of Alien \u2014 Panel', org: 'Comic-Con & Sundance', dates: '2019', sortYear: 2019, tags: ['Film Festival'] },
      { title: '"Man of Steel"', org: 'International Assoc. for Comparative Mythology, Edinburgh', dates: '2017', sortYear: 2017, tags: ['Conference'] },
      { title: '"Dragon Sickness & Rings of Gold"', org: 'Mythopoeic Society Conference', dates: '2017', sortYear: 2017, tags: ['Conference'] },
      { title: 'Narrative Psychles', org: 'Philosophical Research Society / Myth Salon / UFVA', dates: '2017\u20132018', sortYear: 2017, tags: ['Public Talk'] },
    ],
  },
  {
    id: 'projects',
    label: 'Mythic Projects & Cultural Infrastructure',
    items: [
      {
        title: 'Atlas AI',
        org: 'In Development',
        dates: 'Current',
        sortYear: 2026,
        desc: 'A mythic\u2013educational artificial intelligence conceived as a living steward of story, archive, and cultural continuity. Designed as a mythic guide, research companion, and pedagogical presence supporting courses, archival navigation, public scholarship, and creative development.',
        tags: ['AI', 'Education'],
      },
      {
        title: 'Myth Salon Library & Archive',
        org: 'Mentone, Alabama',
        dates: 'Current',
        sortYear: 2026,
        desc: 'A living mythological archive anchoring a growing mythic campus. Built from major donations, functioning as research archive, public cultural space, and educational resource integrated with StoryAtlas courses and Mythology Channel productions.',
        tags: ['Archive', 'Library', 'Community'],
      },
      {
        title: 'Trail of Time (Transformational Trail)',
        org: 'Mentone, Alabama',
        dates: 'Current',
        sortYear: 2026,
        desc: 'An outdoor mythic and pedagogical environment\u2014a walkable narrative landscape integrating story, ecology, ritual, and reflection.',
        tags: ['Experiential', 'Ecology'],
      },
      {
        title: 'StoryAtlas',
        org: 'TheStoryAtlas.com',
        dates: 'In Development',
        sortYear: 2026,
        desc: 'A mythic\u2013educational platform mapping human experience through archetypal patterns, narrative structures, and lived myth. Connects scholarship, storytelling, and embodied practice.',
        tags: ['Platform', 'Curriculum', 'Education'],
      },
    ],
  },
];

// ── Mode Definitions ─────────────────────────────────────
const MODES = {
  all: {
    label: 'All',
    subtitle: 'Mythologist \u00b7 Academic Leader \u00b7 Cultural Scholar',
    bio: [
      'Will Linn is an academic leader, mythologist, and cultural scholar with extensive experience founding, leading, and sustaining educational programs through periods of growth, transition, and institutional stress. He served for eight years as Founding Chair of General Education at Hussian College, where he led core curriculum design, faculty hiring and supervision, accreditation-related initiatives, and cross-departmental coordination across multiple institutional transformations.',
      'He holds a Ph.D. in World Mythology and Depth Psychology from Pacifica Graduate Institute and is a recipient of Pacifica\u2019s Alumni of the Year award. He has served in senior roles with the Joseph Campbell Foundation, including Executive Director of the Joseph Campbell Writers\u2019 Room. His work emphasizes institutional integrity, narrative coherence, and the integration of depth and structure within complex organizations.',
    ],
    bullets: [
      'Senior academic leader with 8+ years founding and chairing core curriculum at an accredited arts institution',
      'Extensive experience in accreditation support, faculty leadership, budgeting, and institutional transition',
      'Pacifica-trained mythologist with active public scholarship and media presence',
      'Bridge-builder between depth psychology, curriculum design, and narrative-driven institutional leadership',
    ],
    // category order: primary (expanded), secondary (collapsed)
    primary: ['leadership', 'education', 'media', 'publications', 'courses', 'consulting', 'boards', 'presentations', 'projects'],
    secondary: [],
  },
  teaching: {
    label: 'Teaching',
    subtitle: 'Educator \u00b7 Curriculum Architect \u00b7 Department Chair',
    bio: [
      'Will Linn is a senior academic leader with eight years of experience founding and chairing General Education at Hussian College, a film and performing arts institution in Los Angeles. He designed the core curriculum from the ground up, recruited and supervised faculty teams of 8\u201312 each semester, and led the department through multiple institutional transformations\u2014including acquisition\u2014while maintaining accreditation standards, budget oversight, and program coherence.',
      'He holds a Ph.D. in World Mythology and Depth Psychology from Pacifica Graduate Institute, where he is a recipient of the Alumni of the Year award and has served on doctoral dissertation committees. His teaching spans undergraduate core requirements, graduate seminars, postdoctoral intensives, and high school programs across institutions in the U.S. and Europe, with courses in storytelling, philosophy, anthropology, mythology, and writing.',
    ],
    bullets: [
      '8+ years as Founding Chair of General Education\u2014curriculum design, faculty hiring, accreditation, budgeting',
      '14 distinct courses taught across undergraduate, graduate, postdoctoral, and high school levels',
      'Doctoral seminar at Pacifica Graduate Institute; postdoctoral course at DAS School, Amsterdam',
      'Served on doctoral dissertation committees; managed Writing Lab and Joseph Campbell Writers\u2019 Room',
    ],
    primary: ['courses', 'leadership', 'education', 'boards'],
    secondary: ['publications', 'presentations', 'projects', 'media', 'consulting'],
  },
  research: {
    label: 'Research',
    subtitle: 'Mythologist \u00b7 Depth Psychologist \u00b7 Scholar',
    bio: [
      'Will Linn holds a Ph.D. in World Mythology and Depth Psychology from Pacifica Graduate Institute, where his doctoral committee included Evans Lansing Smith (Chair), Keiron Le Grice, and Maria Tatar. His dissertation, Western Myths of Knowledge: Particles of Stone & Waves of Elixir, investigates the mythological foundations of Western epistemology. He is a recipient of Pacifica\u2019s Alumni of the Year award and has served on multiple doctoral dissertation committees.',
      'His research spans comparative mythology, archetypal theory, narrative structure, and the intersection of myth with technology and contemporary culture. He has published in peer-reviewed journals, contributed to public scholarship platforms, and presented at international conferences from Edinburgh to Amsterdam. His ongoing projects\u2014Atlas AI, StoryAtlas, and the Myth Salon Library\u2014extend mythological research into digital infrastructure, archival preservation, and pedagogical design.',
    ],
    bullets: [
      'Ph.D. in World Mythology & Depth Psychology; dissertation committee included Maria Tatar (Harvard)',
      'Peer-reviewed publication in Journal of Asian Pop Culture (Penn State University Press, 2025)',
      'Invited talks at University of Edinburgh, International Assoc. for Comparative Mythology, Mythopoeic Society',
      'Building Atlas AI and StoryAtlas\u2014research infrastructure connecting mythological scholarship with AI',
    ],
    primary: ['publications', 'education', 'presentations', 'projects'],
    secondary: ['leadership', 'courses', 'boards', 'media', 'consulting'],
  },
  media: {
    label: 'Media',
    subtitle: 'Producer \u00b7 On-Camera Expert \u00b7 Immersive Creator',
    bio: [
      'Will Linn is a producer, on-camera mythology expert, and immersive experience creator whose work spans television, film, documentary, dome shows, VR, and radio. As Meta-Expert and co-host of Myths: The Greatest Mysteries of Humanity (ZDF/Storyhouse), he appeared across three seasons and 30 episodes airing on ZDF, Sky, History Channel, Channel 5, and Roku throughout Europe and the Americas.',
      'He is co-founder and Head Mythologist of Fascinated by Everything, whose Psychedelic Mixtape premiered at COSM Studios and will air in planetariums worldwide. He has been featured in theatrical documentaries including Memory: Origins of Alien (Sundance, 2019) and The Taking (2023), produced a feature film selected by Hollywood Reporter as a top horror film of 2025, and co-hosted Mythosophia on KZSB radio. He produces and moderates the Myth Salon series, with 60+ episodes featuring scholars from Maria Tatar to Chris Vogler.',
    ],
    bullets: [
      '30 episodes as on-camera mythology expert across 3 seasons of international television (ZDF/Sky/History)',
      'Co-founder of Fascinated by Everything\u2014immersive dome shows, VR, projection-mapped experiences',
      'Featured in Sundance-premiering documentary; produced top-rated horror film (Shudder/AMC+)',
      '60+ Myth Salon episodes produced; Mythosophia radio show (KZSB, 2014\u20132018)',
    ],
    primary: ['media', 'consulting', 'presentations', 'projects'],
    secondary: ['leadership', 'publications', 'courses', 'education', 'boards'],
  },
};

// ── Helpers ──────────────────────────────────────────────
function getEndYear(dates) {
  if (!dates) return 9999;
  if (/present|current/i.test(dates)) return 9999;
  const nums = dates.match(/\d{4}/g);
  return nums ? parseInt(nums[nums.length - 1], 10) : 0;
}

const CV_MAP = Object.fromEntries(CV_CATEGORIES.map(c => [c.id, c]));

// ── Component ───────────────────────────────────────────
export default function WillLinnPage() {
  const [mode, setMode] = useState('all');
  const [sortMode, setSortMode] = useState('category');
  const [activeCategories, setActiveCategories] = useState(new Set(CV_CATEGORIES.map(c => c.id)));
  const [collapsedCats, setCollapsedCats] = useState(new Set());
  const [videoUrl, setVideoUrl] = useState('');
  const [videoInput, setVideoInput] = useState('');

  const modeConfig = MODES[mode];

  const switchMode = (newMode) => {
    setMode(newMode);
    setSortMode('category');
    // Show all categories but collapse secondary ones
    const config = MODES[newMode];
    setActiveCategories(new Set(CV_CATEGORIES.map(c => c.id)));
    setCollapsedCats(new Set(config.secondary));
  };

  const toggleCategory = (id) => {
    setActiveCategories(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleCollapse = (id) => {
    setCollapsedCats(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Reorder categories based on mode priority
  const orderedCategories = useMemo(() => {
    const order = [...modeConfig.primary, ...modeConfig.secondary];
    return order.map(id => CV_MAP[id]).filter(Boolean);
  }, [modeConfig]);

  const sortedData = useMemo(() => {
    const filtered = orderedCategories.filter(c => activeCategories.has(c.id));

    if (sortMode === 'category') return filtered;

    const allItems = [];
    filtered.forEach(cat => {
      cat.items.forEach(item => {
        allItems.push({ ...item, categoryLabel: cat.label, categoryId: cat.id });
      });
    });

    allItems.sort((a, b) => {
      const ay = getEndYear(a.dates) === 9999 ? a.sortYear + 100 : getEndYear(a.dates);
      const by = getEndYear(b.dates) === 9999 ? b.sortYear + 100 : getEndYear(b.dates);
      return sortMode === 'newest' ? by - ay : ay - by;
    });

    return allItems;
  }, [sortMode, activeCategories, orderedCategories]);

  const handleVideoEmbed = () => {
    if (!videoInput.trim()) return;
    let url = videoInput.trim();
    const watchMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    if (watchMatch) {
      url = `https://www.youtube.com/embed/${watchMatch[1]}`;
    }
    const playlistMatch = url.match(/[?&]list=([^&\s]+)/);
    if (playlistMatch && !url.includes('/embed/')) {
      url = `https://www.youtube.com/embed/videoseries?list=${playlistMatch[1]}`;
    }
    setVideoUrl(url);
  };

  return (
    <div className="wl-page">
      {/* ── Mode Switcher ── */}
      <div className="wl-mode-bar">
        {Object.entries(MODES).map(([key, cfg]) => (
          <button
            key={key}
            className={`wl-mode-btn${mode === key ? ' active' : ''}`}
            onClick={() => switchMode(key)}
          >
            {cfg.label}
          </button>
        ))}
      </div>

      {/* ── Introduction ── */}
      <div className="wl-intro-card">
        <div className="wl-intro-header">
          <div className="wl-avatar-placeholder">WL</div>
          <div className="wl-name-block">
            <h1>Will Linn, Ph.D.</h1>
            <p className="wl-subtitle">{modeConfig.subtitle}</p>
            <div className="wl-contact-row">
              <a href="mailto:willlinnii@gmail.com">willlinnii@gmail.com</a>
              <span>&middot;</span>
              <span>(310) 579-1469</span>
              <span>&middot;</span>
              <a href="https://mythouse.org" target="_blank" rel="noopener noreferrer">Mythouse.org</a>
            </div>
          </div>
        </div>

        {modeConfig.bio.map((para, i) => (
          <p key={`${mode}-bio-${i}`} className="wl-bio" style={i > 0 ? { marginTop: 12 } : undefined}>
            {para}
          </p>
        ))}

        <ul className="wl-summary-list">
          {modeConfig.bullets.map((b, i) => <li key={`${mode}-b-${i}`}>{b}</li>)}
        </ul>
      </div>

      {/* ── Video ── */}
      <div className="wl-section">
        <h2 className="wl-section-title">Featured Video</h2>
        <div className="wl-video-wrapper">
          {videoUrl ? (
            <iframe
              src={videoUrl}
              title="Featured Video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="wl-video-placeholder">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              <span style={{ fontSize: '0.9rem' }}>Paste a YouTube URL below to embed</span>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <input
            type="text"
            placeholder="YouTube URL (e.g. https://youtube.com/watch?v=...)"
            value={videoInput}
            onChange={e => setVideoInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleVideoEmbed()}
            style={{
              flex: 1,
              background: 'rgba(26,26,36,0.6)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 8,
              padding: '8px 12px',
              color: 'var(--text-primary)',
              fontFamily: "'Crimson Pro', serif",
              fontSize: '0.9rem',
            }}
          />
          <button
            onClick={handleVideoEmbed}
            style={{
              background: 'rgba(196,113,58,0.2)',
              border: '1px solid var(--accent-ember)',
              color: 'var(--accent-ember)',
              borderRadius: 8,
              padding: '8px 16px',
              cursor: 'pointer',
              fontFamily: "'Cinzel', serif",
              fontSize: '0.8rem',
            }}
          >
            Embed
          </button>
        </div>
      </div>

      {/* ── CV ── */}
      <div className="wl-section">
        <h2 className="wl-section-title">Curriculum Vitae</h2>

        {/* Sort controls */}
        <div className="wl-cv-controls">
          <button className={`wl-sort-btn${sortMode === 'category' ? ' active' : ''}`} onClick={() => setSortMode('category')}>By Category</button>
          <button className={`wl-sort-btn${sortMode === 'newest' ? ' active' : ''}`} onClick={() => setSortMode('newest')}>Newest First</button>
          <button className={`wl-sort-btn${sortMode === 'oldest' ? ' active' : ''}`} onClick={() => setSortMode('oldest')}>Oldest First</button>
          <div className="wl-cv-divider" />
          {orderedCategories.map(cat => (
            <button
              key={cat.id}
              className={`wl-filter-btn${activeCategories.has(cat.id) ? ' active' : ''}`}
              onClick={() => toggleCategory(cat.id)}
            >
              {cat.label.length > 25 ? cat.label.slice(0, 22) + '\u2026' : cat.label}
            </button>
          ))}
        </div>

        {/* Render */}
        {sortMode === 'category' ? (
          sortedData.map(cat => (
            <div key={cat.id} className="wl-cv-category">
              <h3
                className="wl-cv-category-title"
                onClick={() => toggleCollapse(cat.id)}
              >
                {cat.label}
                {modeConfig.primary.includes(cat.id) && mode !== 'all' && (
                  <span className="wl-cv-primary-badge">Featured</span>
                )}
                <span className={`wl-cv-toggle${collapsedCats.has(cat.id) ? ' collapsed' : ''}`}>&#9660;</span>
              </h3>
              {!collapsedCats.has(cat.id) && (
                cat.id === 'education' ? (
                  <ul className="wl-edu-list">
                    {cat.items.map((item, i) => (
                      <li key={i} className="wl-edu-item">
                        <div>
                          <span className="wl-edu-item-degree">{item.title}</span>
                          <br />
                          <span className="wl-edu-item-school">{item.org}</span>
                        </div>
                        <span className="wl-edu-item-year">{item.dates}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  cat.items.map((item, i) => (
                    <CVItem key={i} item={item} />
                  ))
                )
              )}
            </div>
          ))
        ) : (
          sortedData.map((item, i) => (
            <CVItem key={i} item={item} showCategory />
          ))
        )}
      </div>
    </div>
  );
}

function CVItem({ item, showCategory }) {
  return (
    <div className="wl-cv-item">
      <div className="wl-cv-item-header">
        <div>
          <p className="wl-cv-item-title">{item.title}</p>
          <p className="wl-cv-item-org">{item.org}</p>
          {showCategory && item.categoryLabel && (
            <p style={{ color: 'var(--accent-gold)', fontSize: '0.75rem', margin: '2px 0 0', fontFamily: "'Cinzel', serif" }}>
              {item.categoryLabel}
            </p>
          )}
        </div>
        <span className="wl-cv-item-dates">{item.dates}</span>
      </div>
      {item.desc && <p className="wl-cv-item-desc">{item.desc}</p>}
      {item.tags && item.tags.length > 0 && (
        <div className="wl-cv-item-tags">
          {item.tags.map(tag => <span key={tag} className="wl-cv-tag">{tag}</span>)}
        </div>
      )}
    </div>
  );
}
