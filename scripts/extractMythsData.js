const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');

const DOCX_PATH = '/Users/willlinn/Library/CloudStorage/OneDrive-Personal/0. Glinter Holdings/0. Glinter Holdings LLC/Glinter IP/Creative Matter/Mythouse Games/5. MYTHS Episodes - All Interviews CUT.docx';

const EPISODES = [
  // Season 1
  { id: 'king-arthur', title: 'King Arthur', startLine: 0, endLine: 180 },
  { id: 'bermuda-triangle', title: 'Bermuda Triangle', startLine: 180, endLine: 260 },
  { id: 'holy-grail', title: 'Holy Grail', startLine: 260, endLine: 402 },
  { id: 'el-dorado', title: 'The Search for El Dorado', startLine: 402, endLine: 644 },
  { id: 'ark-of-the-covenant', title: 'Secrets of the Lost Ark', startLine: 644, endLine: 1148 },
  // Lines 1148-1652 are a duplicate of the Ark section — skipped
  { id: 'israels-lost-tribes', title: "Israel's Lost Tribes", startLine: 1652, endLine: 1970 },
  { id: 'mothman', title: 'Mothman', startLine: 1970, endLine: 2136 },
  { id: 'nostradamus', title: 'Nostradamus', startLine: 2136, endLine: 2406 },
  { id: 'tunguska', title: 'Tunguska', startLine: 2406, endLine: 2478 },
  { id: 'megaliths', title: 'Megaliths & Stonehenge', startLine: 2478, endLine: 2802 },
  // Season 2
  { id: 'curse-of-king-tut', title: 'Curse of King Tut', startLine: 2802, endLine: 2870 },
  { id: 'nibelung', title: 'Nibelung Saga', startLine: 2870, endLine: 3406 },
  { id: 'fourth-pyramid', title: 'The Secret of the Fourth Pyramid', startLine: 3406, endLine: 3622 },
  { id: 'alexander-the-great', title: 'Tomb of Alexander the Great', startLine: 3622, endLine: 3864 },
  { id: 'cleopatra', title: "Cleopatra's Legacy", startLine: 3864, endLine: 4226 },
  { id: 'amazons', title: 'The Amazons', startLine: 4226, endLine: 4424 },
  { id: 'pope-joan', title: 'Pope Joan', startLine: 4424, endLine: 4558 },
  { id: 'illuminati', title: 'Illuminati', startLine: 4558, endLine: 4832 },
  { id: 'attila', title: 'Attila', startLine: 4832, endLine: 4910 },
  { id: 'ghosts', title: 'Ghosts', startLine: 4910, endLine: 4978 },
  // Season 3
  { id: 'frankenstein', title: 'Frankenstein', startLine: 4978, endLine: 5082 },
  { id: 'robin-hood', title: 'Robin Hood', startLine: 5082, endLine: 5278 },
  { id: 'zombies', title: 'Zombies', startLine: 5278, endLine: 5792 },
  { id: 'bigfoot-and-yeti', title: 'Bigfoot & Yeti', startLine: 5792, endLine: 6274 },
  { id: 'witches', title: 'Witches', startLine: 6274, endLine: 6758 },
  { id: 'dragons', title: 'Dragons', startLine: 6758, endLine: 7228 },
  { id: 'great-flood', title: 'The Great Flood', startLine: 7228, endLine: 7334 },
  { id: 'sea-monsters', title: 'Sea Monsters', startLine: 7334, endLine: 7464 },
  { id: 'atlantis', title: 'Atlantis', startLine: 7464, endLine: 7573 },
];

function extractQA(lines) {
  // Group lines into paragraphs
  const paragraphs = [];
  let current = '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed === ' ') {
      if (current.trim()) {
        paragraphs.push(current.trim());
      }
      current = '';
    } else {
      current += (current ? ' ' : '') + trimmed;
    }
  }
  if (current.trim()) {
    paragraphs.push(current.trim());
  }

  // Organize into Q&A entries
  const entries = [];
  let currentEntry = null;

  for (const para of paragraphs) {
    // Skip very short or metadata paragraphs
    if (para.length < 15) continue;
    if (para.startsWith('CHAPTER EXERPT')) continue;
    if (para.startsWith('EGYPTIAN')) continue;
    if (para.startsWith('Source:')) continue;
    if (para.startsWith('KEYS')) continue;
    if (para.match(/^-{3,}$/)) continue;
    if (para.match(/^[·\-]\s*$/)) continue;

    // Check if this is a question (contains '?' and is relatively short, or starts with common question patterns)
    const isQuestion = (
      (para.includes('?') && para.length < 300 && !para.startsWith('o ')) ||
      para.startsWith('- ') && para.includes('?')
    );

    // Clean up bullet points and formatting
    let cleaned = para
      .replace(/^[-·]\s+/, '')
      .replace(/^o\s+/, '')
      .replace(/^\d+\.\s+/, '')
      .replace(/^◊\s*/, '')
      .trim();

    if (isQuestion) {
      // Start a new Q&A entry
      if (currentEntry) {
        entries.push(currentEntry);
      }
      currentEntry = {
        question: cleaned,
        answers: []
      };
    } else if (currentEntry) {
      currentEntry.answers.push(cleaned);
    } else {
      // Content without a question - make it a standalone entry
      entries.push({
        question: null,
        answers: [cleaned]
      });
    }
  }

  if (currentEntry) {
    entries.push(currentEntry);
  }

  return entries;
}

async function main() {
  const result = await mammoth.extractRawText({ path: DOCX_PATH });
  const lines = result.value.split('\n');

  const data = {
    show: {
      title: 'Myths: The Greatest Mysteries of Humanity',
      rokuUrl: 'https://therokuchannel.roku.com/details/8d3e32d528a0553f834a3fd93dd75f2b/myths-the-greatest-mysteries-of-humanity',
      description: 'Each episode examines legendary myths with the assistance of scientists, archaeologists and experts. From biblical stories such as the Holy Grail, to historical mysteries like Attila\'s tomb, to modern legends — the series explores inexplicable events and ancient legends.',
    },
    episodes: EPISODES.map(ep => {
      const content = lines.slice(ep.startLine, Math.min(ep.endLine, lines.length));
      const entries = extractQA(content);

      // Create a short summary from the first substantial answer
      const firstAnswer = entries.find(e => e.answers.length > 0 && e.answers[0].length > 50);
      const summary = firstAnswer
        ? firstAnswer.answers[0].substring(0, 200).replace(/\s+\S*$/, '') + '...'
        : '';

      return {
        id: ep.id,
        title: ep.title,
        summary,
        entries: entries.map(e => ({
          question: e.question,
          text: e.answers.join('\n\n')
        })).filter(e => e.text.length > 20) // Only keep entries with substantial content
      };
    })
  };

  const outPath = path.join(__dirname, '..', 'src', 'data', 'mythsEpisodes.json');
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2));

  console.log('Written to', outPath);
  console.log('Episodes:', data.episodes.length);
  data.episodes.forEach(ep => {
    console.log(`  ${ep.title}: ${ep.entries.length} entries`);
  });
}

main().catch(console.error);
