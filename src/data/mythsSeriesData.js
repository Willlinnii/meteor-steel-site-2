import episodesJson from './mythsEpisodes.json';

const show = episodesJson.show;
const episodes = episodesJson.episodes;

const LABEL_MAP = {
  'ark-of-the-covenant': 'Lost Ark',
  'curse-of-king-tut': 'King Tut',
  'alexander-the-great': 'Alexander',
  'fourth-pyramid': '4th Pyramid',
  'bigfoot-and-yeti': 'Bigfoot',
  'bermuda-triangle': 'Bermuda',
  'israels-lost-tribes': 'Lost Tribe',
  'holy-grail': 'Holy Grail',
  'king-arthur': 'King Arthur',
  'el-dorado': 'El Dorado',
  'nibelung': 'Nibelung',
  'robin-hood': 'Robin Hood',
  'amazons': 'Amazons',
  'atlantis': 'Atlantis',
  'cleopatra': 'Cleopatra',
  'illuminati': 'Illuminati',
  'great-flood': 'Great Flood',
  'megaliths': 'Megaliths',
  'pope-joan': 'Pope Joan',
  'witches': 'Witches',
  'ghosts': 'Ghosts',
  'frankenstein': 'Frankenstein',
  'zombies': 'Zombies',
  'sea-monsters': 'Sea Monsters',
  'mothman': 'Mothman',
  'attila': 'Attila',
  'nostradamus': 'Nostradamus',
  'tunguska': 'Tunguska',
  'dragons': 'Dragons',
};

const PLAYLIST_MAP = {
  'ghosts': 'https://www.youtube.com/embed/videoseries?list=PLX31T_KS3jtqkcrqA1Jpj5c3-jffVoc_h',
  'witches': 'https://www.youtube.com/embed/videoseries?list=PLX31T_KS3jtppSM9ueK7CY1CPaEpCxNXy',
  'cleopatra': 'https://www.youtube.com/embed/videoseries?list=PLX31T_KS3jtohECypMjsx_kxBKPrv_yD4',
  'megaliths': 'https://www.youtube.com/embed/videoseries?list=PLX31T_KS3jtqcTzznkOyHsWFY_ZQ4BvCC',
  'curse-of-king-tut': 'https://www.youtube.com/embed/videoseries?list=PLX31T_KS3jtrm5hNAMJQKPlQ4KuttjT1d',
  'king-arthur': 'https://www.youtube.com/embed/videoseries?list=PLX31T_KS3jtrGGQlaaSO_o64b4iUBHk4P',
  'robin-hood': 'https://www.youtube.com/embed/videoseries?list=PLX31T_KS3jtpDZgIliPMj-Qwvh5p2CwUb',
  'ark-of-the-covenant': 'https://www.youtube.com/embed/videoseries?list=PLX31T_KS3jtpHwY3i0o5U1zB71gHW5aWS',
  'israels-lost-tribes': 'https://www.youtube.com/embed/videoseries?list=PLX31T_KS3jtqOjryaqOSBL-AnjJ-eQAVi',
  'attila': 'https://www.youtube.com/embed/videoseries?list=PLX31T_KS3jtppVJoGzBRvftGvrYhQH_-h',
  'pope-joan': 'https://www.youtube.com/embed/videoseries?list=PLX31T_KS3jtpw47MzUG8s-iE1DQwkcP6y',
  'bermuda-triangle': 'https://www.youtube.com/embed/videoseries?list=PLX31T_KS3jtqM4CG22_OTotKtCkmMR0t4',
  'atlantis': 'https://www.youtube.com/embed/videoseries?list=PLX31T_KS3jtppzUYsYneNzFVwSqLULVx6',
  'illuminati': 'https://www.youtube.com/embed/videoseries?list=PLX31T_KS3jtpSSF9vpJO4SCqzJvloyTeV',
  'bigfoot-and-yeti': 'https://www.youtube.com/embed/videoseries?list=PLX31T_KS3jtpZ8pJcFTrymXcq-UZyvuxI',
  'dragons': 'https://www.youtube.com/embed/videoseries?list=PLX31T_KS3jtodikL_dZQWeUy3LMHuu3iw',
  'el-dorado': 'https://www.youtube.com/embed/videoseries?list=PLX31T_KS3jtqZFPkION0-HUeUyesARvoi',
  'nibelung': 'https://www.youtube.com/embed/videoseries?list=PLX31T_KS3jtris1XmvH_Cpkgk-4tL5sx1',
  'amazons': 'https://www.youtube.com/embed/videoseries?list=PLX31T_KS3jtpWv41Q_3d5hG-H5LPt1fIr',
  'great-flood': 'https://www.youtube.com/embed/videoseries?list=PLX31T_KS3jtq1rSI0wPFXpVQ-SB6AZ-Oo',
  'mothman': 'https://www.youtube.com/embed/videoseries?list=PLX31T_KS3jtrMOmOeV8RmRhJYo6IwLyvA',
};

function buildEpisode(id) {
  const ep = episodes.find(e => e.id === id);
  if (!ep) {
    return { id, label: LABEL_MAP[id] || id, title: LABEL_MAP[id] || id, summary: '', entries: [], themes: [], references: [], music: [], playlist: PLAYLIST_MAP[id] || null };
  }
  return {
    id: ep.id,
    label: LABEL_MAP[ep.id] || ep.title,
    title: ep.title,
    summary: ep.summary || '',
    entries: ep.entries || [],
    themes: ep.themes || [],
    references: ep.references || [],
    music: ep.music || [],
    playlist: PLAYLIST_MAP[ep.id] || null,
  };
}

// Documentary placeholder (not in JSON)
const documentary = {
  id: 'documentary',
  label: 'Documentary',
  title: 'Myths: The Documentary',
  summary: 'Behind the scenes of Myths: The Greatest Mysteries of Humanity.',
  entries: [],
  themes: [],
  references: [],
  music: [],
};

// Ring 1 — Outer (10)
const ring1Ids = ['documentary', 'dragons', 'holy-grail', 'king-arthur', 'el-dorado', 'ark-of-the-covenant', 'nibelung', 'robin-hood', 'amazons', 'atlantis'];
// Ring 2 — Middle (10)
const ring2Ids = ['alexander-the-great', 'cleopatra', 'fourth-pyramid', 'illuminati', 'israels-lost-tribes', 'curse-of-king-tut', 'bermuda-triangle', 'great-flood', 'megaliths', 'pope-joan'];
// Ring 3 — Inner (10)
const ring3Ids = ['witches', 'ghosts', 'frankenstein', 'zombies', 'bigfoot-and-yeti', 'sea-monsters', 'mothman', 'attila', 'nostradamus', 'tunguska'];

export const ring1 = ring1Ids.map(id => id === 'documentary' ? documentary : buildEpisode(id));
export const ring2 = ring2Ids.map(id => buildEpisode(id));
export const ring3 = ring3Ids.map(id => buildEpisode(id));

export const allEpisodes = [...ring1, ...ring2, ...ring3];

export const title = show.title;
export const subtitle = 'A Television Series';
export const description = show.description;
export const rokuUrl = show.rokuUrl;
