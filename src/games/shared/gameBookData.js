/**
 * Rules and Secrets for each Mythouse Game.
 * Rules: how to play each game.
 * Secrets: esoteric history, math, and symbolism from the Mythouse Game Book.
 */

const GAME_BOOK = {
  'snakes-and-ladders': {
    rules: [
      'Players start off the board and take turns rolling a single die (d6).',
      'Move your token forward by the number rolled, starting from square 1.',
      'If you land at the bottom of a ladder, climb up to the square at its top.',
      'If you land on the head of a snake, slide down to the square at its tail.',
      'You must reach square 100 exactly — if your roll would take you past 100, you stay put.',
      'The first player to land exactly on square 100 wins.',
      'There are no choices to make — the game is pure luck, determined entirely by the dice and the board.',
    ],
    secrets: [
      {
        heading: 'Moksha Patam: The Game of Liberation',
        text: 'Snakes and Ladders began as Moksha Patam in medieval India, a game of moral instruction. The board was painted with a grid of squares, and instead of an equal race, it depicted a spiritual journey. Ladders represented good deeds that lifted a player upward, while snakes represented evil deeds leading one astray. Playing it, children and adults would learn that life\'s climb to salvation (moksha) could be helped by honesty, kindness, and faith, but a single act of vice might send you sliding back.',
      },
      {
        heading: 'Karma and the Dice',
        text: 'Although it was essentially a game of chance — you moved by the roll of a die — the underlying message was that destiny (karma) rewarded virtue. The original game had more snakes than ladders, reflecting the belief that the path to liberation is harder than the path to vice. British colonizers in the 19th century brought it to England, stripping most of the overt religious imagery but keeping the fun of the ups and downs. Thus Moksha Patam became Snakes and Ladders, a fixture of Victorian parlors and children\'s playrooms around the world.',
      },
      {
        heading: 'The Mathematics of Fate',
        text: 'On a standard 10×10 board, it takes an average of about 39 rolls to finish — but the variance is enormous. A player can reach square 100 in as few as 7 rolls with perfect ladder luck, or languish for over 200 turns caught in snake loops. The game is a Markov chain: your future depends only on your current position, not your history. Mathematicians have used it to study absorbing states and expected hitting times.',
      },
      {
        heading: 'The Grid of Ten',
        text: 'The 10×10 grid encodes a decimal cosmology. Ten is the Pythagorean tetractys — the sum of 1+2+3+4 — and was considered sacred. The boustrophedon numbering (alternating left-to-right, then right-to-left) mirrors the serpentine path of a labyrinth or the winding path up a sacred mountain. Each row can be read as a stage of ascent, with the 100th square representing union with the divine.',
      },
    ],
  },

  'senet': {
    rules: [
      'Senet is played on a 3×10 board (30 squares) arranged in an S-shaped path.',
      'Each player has 5 pieces. Players take turns throwing stick dice (4 sticks, each with a light and dark side).',
      'Stick dice results: 1 light side up = 1 (extra turn), 2 = 2, 3 = 3, 4 = 4 (extra turn), 0 light = 5 (extra turn).',
      'Move one of your pieces forward by the number rolled.',
      'You cannot land on your own piece. If you land on an opponent\'s piece, they swap positions (unless they\'re protected).',
      'Two or more of your pieces in a row form a blockade that cannot be passed or swapped.',
      'Special squares: House of Rebirth (15), House of Beauty (26), House of Water (27 — fall back to 15!), House of Three Truths (28 — need exact 3), House of Re-Atoum (29 — need exact 2).',
      'Bear off your pieces from the end of the board. The first player to remove all 5 pieces wins.',
    ],
    secrets: [
      {
        heading: 'Journey Through the Afterlife',
        text: 'By around 3100 BC, Egyptians were moving little pegs or tokens through Senet\'s thirty squares, hoping to be the first to reach the end. Senet boards were found in tombs — even King Tutankhamun had a set — and paintings show queens and nobles absorbed in play. Queen Nefertari is depicted playing Senet against an invisible opponent, believed to be the gods of the afterlife themselves.',
      },
      {
        heading: 'The Soul\'s Passage',
        text: 'Over time, Senet took on deep symbolic meaning: Egyptians came to see it as a representation of the soul\'s journey through the afterlife. Each square on the board could hold religious significance, with the final square representing the soul\'s union with the sun god Ra. In this way, an evening\'s entertainment also became a subtle lesson in one\'s hoped-for path to paradise. The House of Water (square 27) represents the perilous waters that could drown the soul, casting it back to the House of Rebirth to begin again.',
      },
      {
        heading: 'Stick Dice and Binary Counting',
        text: 'Senet\'s stick dice are one of the oldest randomization devices. Four flat sticks, each with a light and dark side, produce five outcomes weighted toward 1 and 5 (which both grant extra turns). This creates a binary counting system — each stick is essentially a coin flip — making the probability distribution a binomial with n=4. The extra turns on 1, 4, and 5 keep the game dynamic and unpredictable, echoing the Egyptian belief that the gods intervene in the journey of the soul.',
      },
      {
        heading: 'Thirty Squares, Thirty Days',
        text: 'The 30 squares of Senet correspond to the 30 days of the Egyptian civil month. The S-path through three rows of ten mirrors the three decans of the month. The game board itself becomes a calendar, and each move through the squares traces the passage of time through the cycle of death and rebirth.',
      },
    ],
  },

  'royal-game-of-ur': {
    rules: [
      'The Royal Game of Ur is a race game for two players on a board of 20 squares.',
      'Each player has 7 pieces that must travel a path of 14 squares (some shared, some private).',
      'Roll 4 tetrahedral dice (each has 2 marked corners out of 4): results range from 0 to 4.',
      'Enter a new piece or advance an existing piece by the number rolled.',
      'Landing on a rosette grants an extra turn and makes your piece safe from capture.',
      'If you land on an opponent\'s piece (not on a rosette), they are captured and sent back to start.',
      'You cannot land on a square occupied by your own piece.',
      'You must roll the exact number needed to bear off each piece from the board.',
      'The first player to bear off all 7 pieces wins.',
    ],
    secrets: [
      {
        heading: 'The Oldest Playable Board Game',
        text: 'In the land of Mesopotamia, roughly 4,500 years ago, people in the city of Ur were playing what we now call The Royal Game of Ur. This could be the oldest board game still playable today — archaeologists uncovered beautiful boards inlaid with shell and lapis lazuli in the Royal Cemetery of Ur in Iraq. Thanks to a cuneiform tablet left by a Babylonian astronomer around 177 BC, modern scholars even know the rules.',
      },
      {
        heading: 'Divination and the Will of the Gods',
        text: 'This wasn\'t just a casual pastime — later Babylonian writings suggest the game was used for divination, with the landing on certain squares believed to tell a player\'s fortune. Across the Middle East, from Mesopotamia to Crete and Sri Lanka, people of all classes enjoyed this lively race game. At the height of its popularity, the Royal Game of Ur acquired a mystical aura: gameplay was thought to carry messages from the gods and reveal one\'s fate.',
      },
      {
        heading: 'Tetrahedral Dice: The Simplest Platonic Solid',
        text: 'The game uses tetrahedral dice — four-sided pyramids, the simplest of the five Platonic solids. With only 2 of 4 vertices marked, each die is a fair coin flip. Rolling four produces a binomial distribution peaking at 2, creating the right balance of movement and stalling. The tetrahedron represents fire in Plato\'s Timaeus — the element of transformation, fitting for a game that transforms fortune.',
      },
      {
        heading: 'Rosettes: Sanctuary in the Storm',
        text: 'The five rosette squares on the board are believed to represent divine protection — safe havens where fate cannot touch you. The rosette pattern (a flower of overlapping petals) appears throughout Mesopotamian art as a symbol of the goddess Ishtar (Venus). Landing on a rosette not only protects your piece but grants another roll — a gift from the divine, interrupting the normal flow of time.',
      },
    ],
  },

  'mehen': {
    rules: [
      'Mehen is played on a spiral board shaped like a coiled serpent.',
      'The track runs from the tail (outside) to the head (center), then back out — 80 spaces total.',
      'Players start at position 0 (the tail) and race toward the center (position 40), then reverse course back to the tail.',
      'Roll a d6 to determine movement. Move one of your pieces forward along the spiral.',
      'You cannot land on a space occupied by your own piece.',
      'If you land on an opponent\'s piece, they are sent back to the nearest empty space behind them.',
      'Exact rolls are needed to reach the center (position 40) and to finish the return journey.',
      'The first player to complete the full journey — to the center and back — wins.',
    ],
    secrets: [
      {
        heading: 'The Game of the Snake God',
        text: 'In ancient Egypt over 5,000 years ago, some of the world\'s first board games emerged. One of these was Mehen, the "game of the snake," played on a stone board carved into the shape of a coiled serpent. Players raced lion-shaped pieces along the snake\'s back, winding toward the center. The game\'s name honors Mehen, a protective snake-god — the very board evoking a serpent encircling the sun, hinting at cosmic symbolism.',
      },
      {
        heading: 'Mehen and the Solar Barque',
        text: 'In Egyptian mythology, the serpent Mehen coiled around the sun god Ra as he traveled through the Duat (underworld) each night, protecting him from the chaos serpent Apophis. The game\'s spiral path mirrors Ra\'s nightly journey: descent into darkness (traveling inward), reaching the nadir (the center), and returning to the surface as the reborn sun at dawn. To play Mehen is to enact the solar cycle.',
      },
      {
        heading: 'The Vanishing Game',
        text: 'Mehen was popular during Egypt\'s Old Kingdom and then mysteriously vanished around 2300 BC. No one knows why. Some scholars believe it was absorbed into religious ritual and became too sacred for casual play. Others think it was replaced by Senet, which carried its own afterlife symbolism. The disappearance of Mehen remains one of the great mysteries of ancient gaming — a game so old it predates the pyramids, then simply gone.',
      },
      {
        heading: 'Spiral Geometry',
        text: 'The spiral is one of humanity\'s oldest symbols, found carved in stone from Ireland to Malta to the American Southwest. It represents growth, evolution, and the journey inward. In sacred geometry, the spiral connects the finite to the infinite — each turn bringing you closer to the center yet never quite arriving in a smooth curve. Mehen\'s discrete 80-space spiral quantizes this infinite form into a playable journey, a game-board mandala.',
      },
    ],
  },

  'jackals-and-hounds': {
    rules: [
      'Jackals & Hounds (also known as 58 Holes) is a race game for two players.',
      'Each player has 5 pieces (pegs) that race along a track of 29 holes.',
      'The two tracks run in parallel — players cannot interact with each other\'s pieces.',
      'Roll a d6 and move one of your pieces forward by that number.',
      'Certain holes are connected by shortcuts: landing on one instantly moves you to the other (6↔12, 10↔18, 20↔24).',
      'You cannot land on a hole occupied by your own piece.',
      'A piece must reach hole 29 with an exact roll.',
      'The first player to get all 5 pieces to the finish (hole 29) wins.',
    ],
    secrets: [
      {
        heading: 'The 58 Holes',
        text: 'By the Middle Kingdom (around 4,000 years ago), a new Egyptian game appeared, today called Hounds and Jackals. A carved ivory board with palm-tree motif featured two sets of 29 holes and ten peg pieces carved with dog or jackal heads. Each player raced their five pegs from one end of the board to the other, much like a modern race game.',
      },
      {
        heading: 'A Game Without Borders',
        text: 'Hounds and Jackals was not confined to Egypt\'s borders — boards have been found as far afield as Mesopotamia, Israel, and even Azerbaijan. Its presence in many lands by the late 3rd millennium BC shows how a fun idea could travel in the ancient world. One can imagine merchants or diplomats carrying these game sets with them, spreading a bit of Egyptian leisure wherever they went.',
      },
      {
        heading: 'The Palm Tree of Life',
        text: 'The most famous surviving board (from the tomb of Reny-Seneb at Thebes, c. 1800 BC, now in the Metropolitan Museum) features a palm tree between the two racing tracks. The palm was a symbol of victory, resurrection, and eternal life in Egyptian culture. The two parallel tracks winding around the tree of life suggest the dual journey of the soul — two paths that may diverge and reconnect through hidden shortcuts, much like the shortcuts on the board itself.',
      },
      {
        heading: 'Shortcuts and Fate',
        text: 'The shortcut connections (marked by lines between certain holes on the board) represent the unpredictable turns of fortune. Unlike Snakes & Ladders where slides go backward, Jackals & Hounds shortcuts always leap forward — gifts from the gods that accelerate the journey. The number of connected holes varies between surviving boards, suggesting the game was continually reimagined across cultures, each community inscribing its own understanding of fate into the connections.',
      },
    ],
  },

  'pachisi': {
    rules: [
      'Pachisi is played on a cross-shaped board with a 68-square circuit.',
      'Each player has 4 pieces that start off the board in a waiting area. Enter pieces with a grace roll (1, 6, or 25), then travel the full circuit and return up a home stretch of 7 squares.',
      'Roll cowrie shell dice: 6 shells produce values from 1 to 6 with special grace rolls on 6 and 1 (extra turn).',
      'Enter a piece onto the board or advance an existing piece by the amount rolled.',
      'Castle squares (marked positions) are safe — no captures can occur on them.',
      'If you land on an opponent\'s piece on a non-castle square, they are captured and must re-enter from home base.',
      'A piece must travel the full circuit and then enter the home stretch to finish.',
      'The first player to get all 4 pieces home wins.',
    ],
    secrets: [
      {
        heading: 'The Cross-Shaped Cosmos',
        text: 'In ancient India, friends and family gathered to play Pachisi, a lively cross-shaped board game that is the ancestor of today\'s Parcheesi and Ludo. Pachisi boards were often made of cloth, folded up and carried anywhere, and moves were determined by throwing cowrie shells instead of dice. The cross shape represents the four cardinal directions and the four seasons — a mandala of cosmic order.',
      },
      {
        heading: 'The Mahabharata\'s Dice Game',
        text: 'The game\'s history in India goes back many centuries. It even appears in the legends — the great Sanskrit epic Mahabharata describes a similar game of dice (referred to as Pasha) in which the Pandava brothers lose their kingdom. That famous tale hints at how deeply ingrained board games were in Indian culture as metaphors for fate and fortune — a game with the power to change the course of empires.',
      },
      {
        heading: 'The Emperor\'s Living Board',
        text: 'By the 16th century, the Mughal emperor Akbar was so fond of Pachisi that he had enormous boards built in his palace courtyards at Fatehpur Sikri, using living pieces — members of his harem dressed in colored costumes — to play out the drama of the game. The stone-inlaid board can still be seen at the palace today, a monument to a time when games were played on the scale of architecture.',
      },
      {
        heading: 'Cowrie Shells: Currency and Oracle',
        text: 'Cowrie shells have served as currency, jewelry, and divination tools across Africa, Asia, and the Pacific for thousands of years. In Pachisi, they replace dice — thrown in a group, the number landing mouth-up determines the move. The cowrie\'s natural binary (mouth up or down) creates a binomial probability distribution, much like Senet\'s stick dice. The shell\'s resemblance to an eye or a mouth gave it talismanic power — each throw was a reading of fortune.',
      },
    ],
  },

  'mythouse': {
    rules: [
      'The board is a spiral mountain with 7 concentric rings, each containing 28 spaces (representing a lunar month).',
      'Each player has 7 pieces corresponding to celestial archetypes: Checker, Pawn, Rook, Bishop, Knight, Queen, and King.',
      'Start on the outermost ring. Roll the dice and move one piece forward along the spiral.',
      'Dice progression: you begin with a d6 (cube). As you ascend, higher rings unlock more complex Platonic solid dice (d8, d12, d20).',
      'Landing on a chute sends a piece down to a lower ring. Landing on a ladder boosts a piece up to a higher ring.',
      'When a piece reaches the bottom of a new ring, an Ordeal is triggered — a duel with your opponent. The winner gains an advantage.',
      'Gemstones sit at each ring, worth increasing points (28 × ring number). Claim them by reaching their position.',
      'The game ends when the first player reaches the summit and claims the Fallen Starlight (worth 588 points).',
      'The winner is not necessarily the first to the top — it\'s the player with the most total points from gemstones, cards, and the Fallen Starlight.',
    ],
    secrets: [
      {
        heading: 'The Living Myth',
        text: 'This game is more than a pastime — it is an invitation into a living myth. Rooted in the ancient lineages of storytelling, sacred play, and the cosmic imagination, it draws players into a world where dice, boards, and cards become keys to a greater journey. Every turn, move, and choice resonates with archetypes as old as humanity, yet unfolds anew with each game. From the patterned spiral of the mountain board to the planetary alignments encoded in the pieces, it offers a way to step inside the architecture of myth and participate in its unfolding.',
      },
      {
        heading: 'Seven Rings, Seven Planets',
        text: 'The 7 rings of the spiral mountain correspond to the 7 classical planets and the 7 days of the week: Saturn (Saturday, lead), Moon (Monday, silver), Mars (Tuesday, iron), Mercury (Wednesday, quicksilver), Jupiter (Thursday, tin), Venus (Friday, copper), and the Sun (Sunday, gold). Each ring carries the energy and symbolism of its planet. Ascending the mountain is ascending through the celestial spheres — from the dense gravity of Saturn to the radiant crown of the Sun.',
      },
      {
        heading: '28 Spaces: The Lunar Month',
        text: 'Each ring contains 28 spaces, encoding the lunar cycle of approximately 28 days. The full spiral of 7 × 28 = 196 spaces represents a complete cosmological calendar. The gemstone at each ring is worth 28 × the ring number, and the Fallen Starlight at the summit (588 points) equals the sum of all remaining months — a mathematical expression of the accumulated wisdom gathered on the ascent.',
      },
      {
        heading: 'Platonic Solids: The Geometry of Creation',
        text: 'The dice progression through the rings follows the Platonic solids — the five perfect polyhedra that Plato believed were the building blocks of the cosmos. The cube (d6, earth) gives way to the octahedron (d8, air), the dodecahedron (d12, the cosmos itself), and the icosahedron (d20, water). As you ascend, the dice become more complex, your range of movement increases, and the journey accelerates — mirroring the expansion of consciousness as one climbs the mountain of initiation.',
      },
      {
        heading: 'Chess Pieces as Planetary Archetypes',
        text: 'Each of the 7 pieces corresponds to a planetary archetype: the Checker (Saturn\'s slow grind), the Pawn (the Moon\'s humble cycle), the Rook (Mars\' fortified strength), the Bishop (Mercury\'s diagonal cunning), the Knight (Jupiter\'s leaping grace), the Queen (Venus\' sovereign beauty), and the King (the Sun\'s central authority). These are not just game tokens — they are characters in a mythic drama, each carrying the energy of their celestial patron up the spiral mountain.',
      },
      {
        heading: 'The Revelation of Fallen Starlight',
        text: 'This game and its book live within the same creative world as The Revelation of Fallen Starlight, carrying forward its vision of myth as a living, participatory force. In Revelation, the falling of starlight marks the turning of an age and the beginning of a journey toward wholeness. In the game, that journey takes form through play: the climb of the mountain, the cycles of loss and gain, the alignments of fate and choice. Both works share the same center — the tender heart of myth as a guide for navigating a changing world.',
      },
    ],
  },
  'monomyth-journey': {
    rules: [
      'The journey follows the eight stages of the Hero\'s Journey around the wheel: Surface, Calling, Crossing, Initiating, Nadir, Return, Arrival, Renewal.',
      'At each stage, Atlas asks you to describe what happens — the key events, themes, and transformations.',
      'If your answer is vague or wrong, Atlas will gently correct you and ask you to try again.',
      'If you demonstrate real understanding, Atlas will pass you and advance you to the next stage.',
      'You are encouraged to explore each stage\'s content on the page before answering.',
      'The journey is complete when you have walked all eight stages around the wheel.',
    ],
    secrets: [
      {
        heading: 'The Monomyth Wheel',
        text: 'The eight stages map to the universal pattern that Joseph Campbell called the monomyth — the hero\'s journey found in every culture. Surface is the ordinary world. Calling is the disruption. Crossing is the threshold into the unknown. Initiating is the road of trials. Nadir is the deepest point of transformation. Return is the journey back. Arrival is the homecoming. Renewal is the world transformed by the journey.',
      },
      {
        heading: 'Atlas as Guide',
        text: 'Unlike the Cosmic Journey where each entity tests you in their own voice, here Atlas speaks as Atlas — the mythic companion who has walked this wheel before. Atlas draws on the full depth of the Mythouse archive: theorists, myths, cycles, depth psychology, and symbols. The test is not memorization but understanding.',
      },
    ],
  },
  'meteor-steel-journey': {
    rules: [
      'The journey follows the eight stages of the Meteor Steel process around the wheel: Golden Age, Calling Star, Crater Crossing, Trials of Forge, Quench, Integration, Draw, Age of Steel.',
      'At each stage, Atlas asks you to describe what happens — the technology, mythology, and transformation.',
      'If your answer is vague or wrong, Atlas will gently correct you and ask you to try again.',
      'If you demonstrate real understanding, Atlas will pass you and advance you to the next stage.',
      'You are encouraged to explore each stage\'s content on the page before answering.',
      'The journey is complete when you have walked all eight stages around the wheel.',
    ],
    secrets: [
      {
        heading: 'Meteor Steel as Metaphor',
        text: 'The eight stages trace the literal process of forging meteor steel — from the golden age before the fall, through the meteor\'s arrival, impact, smelting, quenching, integration, drawing, and the new age of steel. But each stage is simultaneously a metaphor for personal transformation: disruption, ordeal, cooling, integration of shadow, emergence, and renewal.',
      },
      {
        heading: 'Carbon Is the Secret',
        text: 'The revelation at the heart of Meteor Steel is that carbon — the "impurity" that ancient metallurgists tried to remove — is precisely what gives steel its strength. This is the central metaphor of the Mythouse: transformation comes not from purification but from integration. The shadow, the feminine, the earthly, the dark — these are not enemies to be burned away but partners to be embraced.',
      },
    ],
  },
  'yellow-brick-road': {
    rules: [
      'The journey begins on Earth and passes through 26 celestial encounters: 7 ascending planets (Moon through Saturn), 12 zodiac signs (Aries through Pisces), then 7 descending planets (Saturn through Moon).',
      'Each entity tests you three times at deepening levels: first recognition of the pattern, then how it lives in you, then whether you can hold both shadow and light.',
      'Ascending planets test your awareness of shadow and vice. Zodiac signs test your understanding of archetypal experience. Descending planets test your integration of virtue and light.',
      'You may ask Atlas for a hint at any time, but Atlas will guide without giving answers directly.',
      'There are no wrong answers, only deeper ones. The journey is complete when you return to Earth having visited all 26 encounters.',
    ],
    secrets: [
      {
        heading: 'The Chaldean Path',
        text: 'The order of the planets follows the ancient Chaldean sequence — Moon, Mercury, Venus, Sun, Mars, Jupiter, Saturn — arranged by their apparent speed across the sky. This is the same order used in the days of the week and the planetary hours. To ascend through these spheres is to climb the celestial ladder that mystics from Babylon to Renaissance Florence described as the soul\'s journey between incarnation and the divine.',
      },
      {
        heading: 'Ascent and Descent',
        text: 'The ascending path confronts you with each planet\'s shadow — the vice, the wound, the unexamined pattern. The descending path asks you to integrate each planet\'s virtue — the gift, the medicine, the conscious expression. This mirrors the Hermetic principle: "As above, so below." You cannot truly possess the light until you have named the darkness. The zodiac ring between ascent and descent represents the twelve archetypal experiences of embodied life.',
      },
      {
        heading: 'Three Levels of Testing',
        text: 'Each entity tests at three levels that mirror the stages of alchemical transformation. Level 1 (Nigredo) asks: can you see the pattern? Level 2 (Albedo) asks: how does this pattern live in your own experience? Level 3 (Rubedo) asks: can you hold the tension between shadow and light without collapsing into either? These are the same three stages the alchemists described in the transformation of lead into gold — which was always, secretly, the transformation of the self.',
      },
    ],
  },
};

export default GAME_BOOK;
