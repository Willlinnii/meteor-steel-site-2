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
      'You must reach square 100 exactly \u2014 if your roll would take you past 100, you stay put.',
      'The first player to land exactly on square 100 wins.',
      'There are no choices to make \u2014 the game is pure luck, determined entirely by the dice and the board.',
    ],
    secrets: [
      {
        heading: 'Moksha Patam: The Board of Liberation',
        text: 'The game we know today as Snakes and Ladders began in the Indian subcontinent more than a thousand years ago under the name Moksha Patam ("Board of Liberation") or Gyan Chaupar ("Game of Knowledge"). It was conceived not as a child\u2019s pastime, but as a vivid teaching tool \u2014 a symbolic map of the human moral and spiritual journey.',
      },
      {
        heading: 'The Spiritual Map',
        text: 'The board was a square grid, often 8\u00d78, 9\u00d79, or the now-familiar 10\u00d710, whose numbered spaces represented the stages of human life and states of being. Each ladder embodied a virtue \u2014 truthfulness, generosity, devotion, or humility \u2014 that could elevate a soul toward moksha, spiritual liberation. Each snake represented a vice \u2014 greed, lust, anger, arrogance \u2014 that could pull a soul back into lower states of existence, binding it to samsara, the endless cycle of birth and death. The highest square was moksha, a final release into union with the divine.',
      },
      {
        heading: 'Karma and the Dice',
        text: 'Unlike purely strategic games, the dice determined fate, reminding players that fortune and misfortune were as much a part of the cosmic order as personal will. The original game had more snakes than ladders, reflecting the belief that the path to liberation is harder than the path to vice. In some traditions, the board encoded deeper cosmological structures: virtues aligned with spiritual planes and heavenly realms, vices mapped to realms of suffering or hellish rebirth.',
      },
      {
        heading: 'The 100-Space Cosmos',
        text: 'The 10\u00d710 grid \u2014 100 squares \u2014 represents the completeness of the universe, with its four quarters reflecting the four directions, seasons, or stages of life. The boustrophedon numbering (alternating left-to-right, then right-to-left) mirrors the serpentine path of a labyrinth. This 100-space system connects directly to Pachisi, another Indian game whose full circuit also spans 100 spaces \u2014 two expressions of the same underlying cosmic geometry.',
      },
      {
        heading: 'From India to the World',
        text: 'As the game spread, it was adapted into different cultural contexts. In 19th-century England, British colonizers stripped most of the overt religious imagery but kept the fun of the ups and downs, creating Snakes and Ladders. In the United States, Milton Bradley published it in 1943 as Chutes and Ladders, reframing it as a moral lesson for children. While the explicit spiritual symbolism faded, the underlying structure remained \u2014 a single path across the grid encoding moral and cosmic journeys in a 100-space system.',
      },
    ],
  },

  'senet': {
    rules: [
      'Senet is played on a 3\u00d710 board (30 squares) arranged in an S-shaped path.',
      'Each player has 7 pieces, placed on alternating squares in the first row.',
      'Movement is determined by casting four throwing sticks (one side marked, one unmarked).',
      'The path follows a serpentine track: squares 1\u201310 left to right, 11\u201320 right to left, 21\u201330 left to right.',
      'If your piece lands on an opponent\u2019s piece, you may exchange places (capture).',
      'Two or more of your pieces in a row form a blockade \u2014 the opponent cannot pass.',
      'Special squares include the House of Rebirth (15), House of Beauty (26), House of Water (27 \u2014 fall back to 15!), House of Three Truths (28 \u2014 need exact 3), House of Re-Atoum (29 \u2014 need exact 2).',
      'The first player to remove all their pieces from the board wins.',
    ],
    secrets: [
      {
        heading: 'Journey Through the Afterlife',
        text: 'Senet, one of the oldest known board games, appears in Egypt as early as the First Dynasty (c. 3100\u20132900 BCE). By the New Kingdom, Senet carried deep religious meaning. Tomb art shows the dead playing Senet as part of their journey through the Duat, and the Book of the Dead connects the game\u2019s final spaces with purification, judgment, and rebirth into the Field of Reeds. In life it was a pastime; in death it became a symbolic map of safe passage, cosmic order (ma\u2019at), and the cycles of renewal.',
      },
      {
        heading: 'From Days to the Month',
        text: 'Each square is a day. Ten squares make one week (the Egyptian decade). Three weeks per month: rows 1\u201310, 11\u201320, 21\u201330. The board\u2019s three rows are a fixed three-week month.',
      },
      {
        heading: 'From Month to Season to Year',
        text: 'The three-week month is mirrored by the three-season year. Just as a month repeats three decades, the year repeats three seasons \u2014 Akhet (Inundation), Peret (Emergence), and Shemu (Harvest). Each season is built from four months, echoing the four casting sticks. One month = 30 days, four months = one season, three seasons = 12 months, and 12 \u00d7 30 = 360 days, plus 5 epagomenal days outside the months, giving the 365-day civil year.',
      },
      {
        heading: 'The Lunar Month Overlay',
        text: 'The moving lunar month runs through the fixed civil month: 28 squares mark 14 half-phases \u00d7 2 (left/right progression). Seven pieces per player correspond to the seven lunar forms: New Moon, Waxing Crescent, First Quarter, Waxing Gibbous, Full Moon, Waning Gibbous, and Last Quarter. Squares 29\u201330 are the liminal threshold days before the next month.',
      },
      {
        heading: 'The Planetary Overlay',
        text: 'Seven pieces could also reflect the seven visible celestial bodies: Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn. In Egyptian religion these bodies were linked to major deities and the ordering of time, placing the game in harmony with both lunar phases and the broader planetary cycle.',
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
      'If you land on an opponent\u2019s piece (not on a rosette), they are captured and sent back to start.',
      'You cannot land on a square occupied by your own piece.',
      'You must roll the exact number needed to bear off each piece from the board.',
      'The first player to bear off all 7 pieces wins.',
    ],
    secrets: [
      {
        heading: 'The Oldest Playable Board Game',
        text: 'The Royal Game of Ur is one of the oldest known board games, originating in Mesopotamia around 2600 BCE. Archaeologists discovered examples in the Royal Cemetery at Ur (modern Iraq), crafted from inlaid wood, shell, and lapis lazuli. Cuneiform tablets from later periods record partial rules, showing it was a two-player race using dice-like tetrahedral throws. It spread widely across the ancient Near East and was played for over two millennia. In Mesopotamian culture, boards and movement could reflect celestial cycles, divination, and fate.',
      },
      {
        heading: 'Seven Planets',
        text: 'Each player\u2019s seven pieces correspond to the seven visible planets: Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn.',
      },
      {
        heading: 'Fourteen Steps and the Lunar Cycle',
        text: 'Each planetary piece moves through 14 steps along its track (home row plus shared squares), representing half a lunar cycle. The two players\u2019 lanes together cover 28 total steps \u2014 the days of the lunar month. This is four cycles of the seven planetary pieces: 7 \u00d7 4 = 28.',
      },
      {
        heading: 'The Full Month',
        text: 'The full back-and-forth movement between the two sides encodes a complete lunar month. The crossing of the shared squares mirrors the transition from waxing to waning, light to dark. Playing through 12 lunar cycles yields approximately 336 days; additional days to 360 or 365 were understood in Mesopotamian reckoning as epagomenal or intercalary \u2014 outside the main track of play.',
      },
      {
        heading: 'Rosettes: Sanctuary in the Storm',
        text: 'The five rosette squares represent divine protection \u2014 safe havens where fate cannot touch you. The rosette pattern appears throughout Mesopotamian art as a symbol of the goddess Ishtar (Venus). Landing on a rosette not only protects your piece but grants another roll \u2014 a gift from the divine, interrupting the normal flow of time.',
      },
    ],
  },

  'mehen': {
    rules: [
      'Mehen is played on a spiral board shaped like a coiled serpent.',
      'The track spirals inward from the tail at the outer edge toward the serpent\u2019s head at the center, then back out.',
      'Players start at the tail and race inward toward the head, then reverse course back to the tail.',
      'Each player has 7 pieces representing the seven classical celestial bodies.',
      'Roll a d6 to determine movement. Move one of your pieces forward along the spiral.',
      'You cannot land on a space occupied by your own piece.',
      'If you land on an opponent\u2019s piece, they are sent back to the nearest empty space behind them.',
      'Exact rolls are needed to reach the center and to finish the return journey.',
      'The first player to complete the full journey \u2014 to the center and back \u2014 wins.',
    ],
    secrets: [
      {
        heading: 'The Game of the Snake God',
        text: 'Mehen is an ancient Egyptian board game attested from the late Predynastic period through the Old Kingdom (c. 3000\u20132300 BCE). The game is named after the serpent deity Mehen, who coils protectively around the sun god Ra during his nightly journey through the underworld. Archaeological finds show coiled spiral boards carved in stone or painted on plaster, accompanied by lion-shaped figurines and small spheres. No ancient source records its rules, and the surviving boards vary greatly in size and space count.',
      },
      {
        heading: 'Mehen and the Solar Barque',
        text: 'In Egyptian mythology, the serpent Mehen coiled around the sun god Ra as he traveled through the Duat (underworld) each night, protecting him from the chaos serpent Apophis. The game\u2019s spiral path mirrors Ra\u2019s nightly journey: descent into darkness (traveling inward), reaching the nadir (the center), and returning to the surface as the reborn sun at dawn. To play Mehen is to enact the solar cycle.',
      },
      {
        heading: 'The Vanishing Game',
        text: 'Mehen was popular during Egypt\u2019s Old Kingdom and then mysteriously vanished around 2300 BCE. No one knows why. Some scholars believe it was absorbed into religious ritual and became too sacred for casual play. Others think it was replaced by Senet, which carried its own afterlife symbolism. The disappearance of Mehen remains one of the great mysteries of ancient gaming \u2014 a game so old it predates the pyramids, then simply gone.',
      },
      {
        heading: 'Born from Fallen Starlight',
        text: 'The version of Mehen in this collection did not begin as a historical reconstruction. It emerged from the creative process of designing a game board inspired by The Revelation of Fallen Starlight \u2014 a metanarrative of world mythology and the universal structures of story. The board and its rules were generated from that story\u2019s mythic logic, not from archaeological reference. Only after the game was complete did its creator realize something remarkable: the design closely matched one of the most ancient game boards known to humanity. By creative convergence, the game born from Fallen Starlight became a modern standardization of Mehen \u2014 the only ancient game for which no standardization existed.',
      },
      {
        heading: 'Calendar and Symbolic Structure',
        text: 'Two players each have 7 pieces representing the seven classical celestial bodies (Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn) and the seven days of the week. Each quarter of a ring has 7 spaces = one week. Four quarters = 28 days in a lunar month. The spiral contains 7 rings corresponding to the 7 planets. Seven steps inward plus six steps outward = 13 rings total, encoding 13 months of 28 days = 364 days, plus the central space as the extra day = 365 days in a solar year. The board divides into 4 seasonal quarters. Two players, two colors, and opposing halves represent summer and winter, day and night, growth and death.',
      },
    ],
  },

  'jackals-and-hounds': {
    rules: [
      'Jackals & Hounds is a two-player race game. Each player has 5 pegs (carved as hounds or jackals).',
      'The pegs start in the five starting spaces at the base of each track.',
      'Both tracks run parallel, meeting at the palm tree at the top.',
      'Players take turns casting throwing sticks or dice to determine movement.',
      'Pieces advance along the player\u2019s lane according to the throw.',
      'Certain holes are connected by shortcuts: landing on one instantly moves you to the other.',
      'The two lanes remain separate until the final shared space before the palm tree.',
      'Once a peg reaches the palm tree, it is removed from play.',
      'The first player to get all 5 pieces to the palm tree wins.',
    ],
    secrets: [
      {
        heading: 'The Game of Fifty-Eight Holes',
        text: 'Hounds and Jackals, also called the Game of Fifty-Eight Holes, is a Middle Kingdom Egyptian board game (c. 2000 BCE). The board features two parallel tracks of holes running from a base to a palm tree at the top, with each player controlling five pegs carved as hounds or jackals. The hound and jackal were both protective and guiding animals in Egyptian thought, linked to travel, hunting, and the afterlife \u2014 especially the jackal form of Anubis. Boards range from simple wooden pieces to elaborate ivory and precious-inlay examples found in tombs.',
      },
      {
        heading: 'A Game Without Borders',
        text: 'Hounds and Jackals was not confined to Egypt\u2019s borders \u2014 boards have been found as far afield as Mesopotamia, Israel, and Azerbaijan. Its presence in many lands by the late 3rd millennium BCE shows how a game could travel in the ancient world. The most famous surviving board (from the tomb of Reny-Seneb at Thebes, c. 1800 BCE, now in the Metropolitan Museum) features a palm tree between the two racing tracks \u2014 a symbol of victory, resurrection, and eternal life.',
      },
      {
        heading: '30 Steps = One Month',
        text: 'The race from start to the palm tree covers 30 steps \u2014 the days of an Egyptian civil month. The palm tree is the month\u2019s end and renewal marker.',
      },
      {
        heading: 'Five Planets and the 10-Day Week',
        text: 'The five visible planets (Mercury, Venus, Mars, Jupiter, Saturn) appear as the game\u2019s five pieces. Each appears twice in the two parallel tracks, yielding 10 positions \u2014 matching the Egyptian decade (10-day week).',
      },
      {
        heading: '24 Hours in the Day',
        text: 'The first five starting spaces function as symbolic epagomenal figures outside the month. Removing them leaves 25 spaces; subtract the final shared space before the palm tree and 24 active spaces remain \u2014 the 24 hours of the day. Two parallel tracks mean 12 hours for each player, echoing the 12 hours of day and 12 hours of night.',
      },
      {
        heading: 'The Year',
        text: '12 hours \u00d7 30 days = 360 days in the Egyptian civil year. Add the five starting spaces \u2014 the five epagomenal days outside the months, the mythic birthdays of Osiris, Horus, Set, Isis, and Nephthys \u2014 and you reach the Egyptian sacred year of 365.',
      },
    ],
  },

  'pachisi': {
    rules: [
      'Pachisi is played on a cross-shaped board by two to four players, each with 4 pawns starting in their nest.',
      'Players use six or seven cowrie shells as dice; the number landing mouth-up determines the move count.',
      'Pawns enter the board by rolling a qualifying number (often 6, 10, or 25).',
      'Movement follows a fixed counterclockwise path around the cross\u2019s arms, eventually leading each pawn up the player\u2019s home arm to the central square.',
      'Landing on an opponent\u2019s pawn captures it, sending it back to its nest.',
      'Safe squares, often marked or patterned, protect a pawn from capture.',
      'Multiple pawns can stack to block opponents.',
      'The first player to bring all four pawns into the central home square by exact count wins.',
    ],
    secrets: [
      {
        heading: 'The Cross-Shaped Cosmos',
        text: 'Pachisi is an ancient Hindu cross-and-circle race game, traditionally played on a large cloth board. The name comes from the Hindi word for "twenty-five," the highest possible score in a throw of cowrie shell dice. The board\u2019s four arms extend from a central square, often interpreted as the royal court or palace. In Hindu cultural symbolism, the four arms connect with the cardinal directions, the four goals of life (purusharthas), and the cycles of the cosmos.',
      },
      {
        heading: 'The Emperor\u2019s Living Board',
        text: 'By the 16th century, the Mughal emperor Akbar was so fond of Pachisi that he had enormous boards built in his palace courtyards at Fatehpur Sikri, using living pieces \u2014 members of his harem dressed in colored costumes \u2014 to play out the drama of the game. The stone-inlaid board can still be seen at the palace today.',
      },
      {
        heading: 'Four Arms = Four Directions',
        text: 'The four players (Red, Green, Yellow, Blue) mirror the four cardinal directions, four elements, and four Vedic guardian deities. The cross is not decorative \u2014 it is a cosmological framework.',
      },
      {
        heading: 'The Lunar Month, Embedded Twice',
        text: 'Each arm has 24 spaces before the center, plus its center square = 28, matching the lunar month. The final home stretch has 7 steps for the 7 classical celestial bodies \u2014 a second lunar-month pattern through 4 pieces \u00d7 7 steps = 28.',
      },
      {
        heading: 'The 100-Space System',
        text: '24 spaces + 1 center square = 25 per arm. 25 \u00d7 4 arms = 100 total spaces in the full circuit. This connects directly to Snakes & Ladders, which is a 10 \u00d7 10 = 100 grid \u2014 another Indian game encoding cosmic journeys in a 100-space system.',
      },
      {
        heading: 'The Solar Year',
        text: 'If the Pachisi cross were completed into a square grid, it would be 19 \u00d7 19 = 361 spaces. Add the 4 center squares = 365, the days in the solar year. Daily, lunar, and solar cycles integrate in one layout.',
      },
    ],
  },

  'nine-mens-morris': {
    rules: [
      'The board has three nested squares connected at their midpoints \u2014 24 intersections total.',
      'Each player begins with 9 pieces in contrasting colors.',
      'Placing Phase: Players take turns placing one piece on any empty point. Forming a mill (three in a line) lets you remove one opponent\u2019s piece.',
      'Moving Phase: Once all pieces are placed, players move one piece along a line to an adjacent empty point. New mills still allow removals.',
      'Flying Phase: When reduced to three pieces, a player may move a piece to any empty point on the board.',
      'A piece in a mill cannot be removed unless no other pieces are available.',
      'Victory: reduce the opponent to two pieces, or block all their moves.',
    ],
    secrets: [
      {
        heading: 'A Contest Between Cosmic Halves',
        text: 'Nine Men\u2019s Morris is one of the most enduring board games in human history, found carved into stones, temple floors, and wooden boards across the ancient world. The Romans knew it well. In mythic imagination, it was a contest between cosmic halves: light against dark, summer against winter, the season of growth against the season of decline. The board\u2019s three concentric squares represented the three realms of existence \u2014 the inner sanctum of the gods, the mortal middle realm, and the outer world\u2019s edge.',
      },
      {
        heading: 'Pathways of Power',
        text: 'The lines linking the three squares were pathways of power, like the Roman roads that tied the Empire together or the sacred routes along which the gods traveled. Each move was a march along these lines, a struggle to bind territory into mills \u2014 closed lines of three \u2014 just as a general would encircle a foe or the sun would complete its seasonal circuit.',
      },
      {
        heading: 'Calendars and Numbers',
        text: 'Nine pieces per player: the numerals, the countable foundation of the system. Eight points around each level: the days of the Roman nundinal week. Three levels \u00d7 eight points = 24: the hours of the day. Twenty-four divided between two players = the two halves of the year: the bright half (summer/growth) and the dark half (winter/death). Twelve points for each player\u2019s side = the twelve months of the year.',
      },
      {
        heading: 'A Wheel of Time',
        text: 'Nine Men\u2019s Morris is not just a contest \u2014 it is a wheel of time in miniature. Each mill formed can be seen as a month completing its circuit, each removal as a season\u2019s loss, and the shrinking of one\u2019s forces as the fading of the year toward its inevitable turning. To play was to take part in a symbolic rehearsal of time itself.',
      },
    ],
  },

  'alquerque': {
    rules: [
      'The board is a 5\u00d75 grid with lines connecting adjacent points vertically, horizontally, and diagonally.',
      'Each player has 12 pieces, placed on the points closest to them, leaving the center point empty.',
      'Players alternate turns, moving one piece to any directly connected empty point.',
      'Capture by jumping over an adjacent enemy piece into an empty point beyond it, along a line.',
      'Multiple captures in a single turn are allowed if each jump follows the same rule.',
      'Pieces move and capture in all directions from the start \u2014 there is no promotion.',
      'Win by capturing all opponent\u2019s pieces or blocking all their moves.',
    ],
    secrets: [
      {
        heading: 'The Ancestor of Checkers',
        text: 'Alquerque is the ancestor of modern checkers, born in the courtyards of the Middle East and carried westward through trade, conquest, and empire. The name comes from the Arabic al-qirq, "the board," and its square lattice has been found carved into stone in Egypt, Syria, and across the Islamic world. The game traveled into Europe through Moorish Spain, where it took root and eventually transformed into the familiar draughts and checkers of later centuries.',
      },
      {
        heading: 'A Dance Between Twin Forces',
        text: 'In the mythic imagination, Alquerque is a dance between twin forces \u2014 day and night, summer and winter, the waxing and waning of the moon. The twelve pieces each player commands stand for the months of the year. The single empty point at the center is the thirteenth month, the hidden hinge of the lunar year, and the still point around which the entire cycle turns.',
      },
      {
        heading: 'The Symbolic Year',
        text: '12 pieces per player = the 12 months of the solar year. The empty center point = the thirteenth lunar month, the intercalary hinge. 12 pieces \u00d7 2 players = 24 hours in a day, divided into light and dark halves. 7 pieces along the outermost line for each player = the 7 days of the week. 4 pieces in the inner square = the 4 weeks of a lunar month. 4 weeks \u00d7 7 days = 28 days in the lunar month. 28 \u00d7 13 months = 364 days. The missing 365th day is the empty central space \u2014 the unmeasured day, the festival or liminal turning of the year.',
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
      'When a piece reaches the bottom of a new ring, an Ordeal is triggered \u2014 a duel with your opponent. The winner gains an advantage.',
      'Gemstones sit at each ring, worth increasing points (28 \u00d7 ring number). Claim them by reaching their position.',
      'The game ends when the first player reaches the summit and claims the Fallen Starlight (worth 588 points).',
      'The winner is not necessarily the first to the top \u2014 it\u2019s the player with the most total points from gemstones, cards, and the Fallen Starlight.',
    ],
    secrets: [
      {
        heading: 'The Living Myth',
        text: 'This game is more than a pastime \u2014 it is an invitation into a living myth. Rooted in the ancient lineages of storytelling, sacred play, and the cosmic imagination, it draws players into a world where dice, boards, and cards become keys to a greater journey. Every turn, move, and choice resonates with archetypes as old as humanity, yet unfolds anew with each game. From the patterned spiral of the mountain board to the planetary alignments encoded in the pieces, it offers a way to step inside the architecture of myth and participate in its unfolding.',
      },
      {
        heading: 'Seven Rings, Seven Planets',
        text: 'The 7 rings of the spiral mountain correspond to the 7 classical planets and the 7 days of the week: Saturn (Saturday, lead), Moon (Monday, silver), Mars (Tuesday, iron), Mercury (Wednesday, quicksilver), Jupiter (Thursday, tin), Venus (Friday, copper), and the Sun (Sunday, gold). Each ring carries the energy and symbolism of its planet. Ascending the mountain is ascending through the celestial spheres \u2014 from the dense gravity of Saturn to the radiant crown of the Sun.',
      },
      {
        heading: '28 Spaces: The Lunar Month',
        text: 'Each ring contains 28 spaces, encoding the lunar cycle of approximately 28 days. The full spiral of 7 \u00d7 28 = 196 spaces represents a complete cosmological calendar. The gemstone at each ring is worth 28 \u00d7 the ring number, and the Fallen Starlight at the summit (588 points) equals the sum of all remaining months \u2014 a mathematical expression of the accumulated wisdom gathered on the ascent.',
      },
      {
        heading: 'Platonic Solids: The Geometry of Creation',
        text: 'The dice progression through the rings follows the Platonic solids \u2014 the five perfect polyhedra that Plato believed were the building blocks of the cosmos. The cube (d6, earth) gives way to the octahedron (d8, air), the dodecahedron (d12, the cosmos itself), and the icosahedron (d20, water). As you ascend, the dice become more complex, your range of movement increases, and the journey accelerates \u2014 mirroring the expansion of consciousness as one climbs the mountain of initiation.',
      },
      {
        heading: 'Chess Pieces as Planetary Archetypes',
        text: 'Each of the 7 pieces corresponds to a planetary archetype: the Checker (Saturn\u2019s slow grind), the Pawn (the Moon\u2019s humble cycle), the Rook (Mars\u2019 fortified strength), the Bishop (Mercury\u2019s diagonal cunning), the Knight (Jupiter\u2019s leaping grace), the Queen (Venus\u2019 sovereign beauty), and the King (the Sun\u2019s central authority). These are not just game tokens \u2014 they are characters in a mythic drama, each carrying the energy of their celestial patron up the spiral mountain.',
      },
      {
        heading: 'The Revelation of Fallen Starlight',
        text: 'This game and its book live within the same creative world as The Revelation of Fallen Starlight, carrying forward its vision of myth as a living, participatory force. In Revelation, the falling of starlight marks the turning of an age and the beginning of a journey toward wholeness. In the game, that journey takes form through play: the climb of the mountain, the cycles of loss and gain, the alignments of fate and choice. Both works share the same center \u2014 the tender heart of myth as a guide for navigating a changing world.',
      },
    ],
  },
  'monomyth-journey': {
    rules: [
      'The journey follows the eight stages of the Hero\u2019s Journey around the wheel: Surface, Calling, Crossing, Initiating, Nadir, Return, Arrival, Renewal.',
      'At each stage, Atlas asks you to describe what happens \u2014 the key events, themes, and transformations.',
      'If your answer is vague or wrong, Atlas will gently correct you and ask you to try again.',
      'If you demonstrate real understanding, Atlas will pass you and advance you to the next stage.',
      'You are encouraged to explore each stage\u2019s content on the page before answering.',
      'The journey is complete when you have walked all eight stages around the wheel.',
    ],
    secrets: [
      {
        heading: 'The Monomyth Wheel',
        text: 'The eight stages map to the universal pattern that Joseph Campbell called the monomyth \u2014 the hero\u2019s journey found in every culture. Surface is the ordinary world. Calling is the disruption. Crossing is the threshold into the unknown. Initiating is the road of trials. Nadir is the deepest point of transformation. Return is the journey back. Arrival is the homecoming. Renewal is the world transformed by the journey.',
      },
      {
        heading: 'Atlas as Guide',
        text: 'Unlike the Cosmic Journey where each entity tests you in their own voice, here Atlas speaks as Atlas \u2014 the mythic companion who has walked this wheel before. Atlas draws on the full depth of the Mythouse archive: theorists, myths, cycles, depth psychology, and symbols. The test is not memorization but understanding.',
      },
    ],
  },
  'meteor-steel-journey': {
    rules: [
      'The journey follows the eight stages of the Meteor Steel process around the wheel: Golden Age, Calling Star, Crater Crossing, Trials of Forge, Quench, Integration, Draw, Age of Steel.',
      'At each stage, Atlas asks you to describe what happens \u2014 the technology, mythology, and transformation.',
      'If your answer is vague or wrong, Atlas will gently correct you and ask you to try again.',
      'If you demonstrate real understanding, Atlas will pass you and advance you to the next stage.',
      'You are encouraged to explore each stage\u2019s content on the page before answering.',
      'The journey is complete when you have walked all eight stages around the wheel.',
    ],
    secrets: [
      {
        heading: 'Meteor Steel as Metaphor',
        text: 'The eight stages trace the literal process of forging meteor steel \u2014 from the golden age before the fall, through the meteor\u2019s arrival, impact, smelting, quenching, integration, drawing, and the new age of steel. But each stage is simultaneously a metaphor for personal transformation: disruption, ordeal, cooling, integration of shadow, emergence, and renewal.',
      },
      {
        heading: 'Carbon Is the Secret',
        text: 'The revelation at the heart of Meteor Steel is that carbon \u2014 the "impurity" that ancient metallurgists tried to remove \u2014 is precisely what gives steel its strength. This is the central metaphor of the Mythouse: transformation comes not from purification but from integration. The shadow, the feminine, the earthly, the dark \u2014 these are not enemies to be burned away but partners to be embraced.',
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
        text: 'The order of the planets follows the ancient Chaldean sequence \u2014 Moon, Mercury, Venus, Sun, Mars, Jupiter, Saturn \u2014 arranged by their apparent speed across the sky. This is the same order used in the days of the week and the planetary hours. To ascend through these spheres is to climb the celestial ladder that mystics from Babylon to Renaissance Florence described as the soul\u2019s journey between incarnation and the divine.',
      },
      {
        heading: 'Ascent and Descent',
        text: 'The ascending path confronts you with each planet\u2019s shadow \u2014 the vice, the wound, the unexamined pattern. The descending path asks you to integrate each planet\u2019s virtue \u2014 the gift, the medicine, the conscious expression. This mirrors the Hermetic principle: "As above, so below." You cannot truly possess the light until you have named the darkness. The zodiac ring between ascent and descent represents the twelve archetypal experiences of embodied life.',
      },
      {
        heading: 'Three Levels of Testing',
        text: 'Each entity tests at three levels that mirror the stages of alchemical transformation. Level 1 (Nigredo) asks: can you see the pattern? Level 2 (Albedo) asks: how does this pattern live in your own experience? Level 3 (Rubedo) asks: can you hold the tension between shadow and light without collapsing into either? These are the same three stages the alchemists described in the transformation of lead into gold \u2014 which was always, secretly, the transformation of the self.',
      },
    ],
  },
};

export default GAME_BOOK;
