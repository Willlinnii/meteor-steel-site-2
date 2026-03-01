/**
 * I Ching — Book of Changes.
 * 8 trigrams, 64 hexagrams, coin-toss oracle.
 * King Wen sequence. Line values: 1 = yang (solid), 0 = yin (broken).
 * Lines ordered bottom → top (index 0 = bottom).
 *
 * Trigram correspondences from the Shuo Gua (Discussion of the Trigrams).
 * Hexagram Judgment texts (guà cí 卦辭) and Image texts (xiàng 象)
 * after the Legge translation (1882, public domain).
 */

export const TRIGRAMS = [
  {
    id: 0, name: 'Earth', ch: 'Kūn', symbol: '☷', attr: 'Receptive', lines: [0,0,0],
    family: 'Mother', direction: 'SW', season: 'Late Summer', bodyPart: 'Belly', animal: 'Cow',
    quality: 'Shuo Gua: yielding, devoted. The mother. Earth, cloth, kettle, frugality, the level, a large cart, the multitude. All creatures receive nourishment.',
  },
  {
    id: 1, name: 'Mountain', ch: 'Gèn', symbol: '☶', attr: 'Stillness', lines: [0,0,1],
    family: 'Third Son', direction: 'NE', season: 'Early Spring', bodyPart: 'Hand', animal: 'Dog',
    quality: 'Shuo Gua: keeping still. Third son. Paths, small stones, doors, openings, fruits, seeds, watchmen, gatekeepers. Where things end and begin again.',
  },
  {
    id: 2, name: 'Water', ch: 'Kǎn', symbol: '☵', attr: 'Abysmal', lines: [0,1,0],
    family: 'Second Son', direction: 'N', season: 'Winter', bodyPart: 'Ear', animal: 'Pig',
    quality: 'Shuo Gua: dangerous. Second son. Ditches, hidden things, bending and straightening, the bow, the wheel, anxiety, the moon, a thief. The trigram of toil.',
  },
  {
    id: 3, name: 'Wind', ch: 'Xùn', symbol: '☴', attr: 'Gentle', lines: [0,1,1],
    family: 'First Daughter', direction: 'SE', season: 'Late Spring', bodyPart: 'Thighs', animal: 'Rooster',
    quality: 'Shuo Gua: penetrating. First daughter. Wood, wind, a plumb line, a carpenter\'s square, white, long, high, advancing and retreating, strong scent.',
  },
  {
    id: 4, name: 'Thunder', ch: 'Zhèn', symbol: '☳', attr: 'Arousing', lines: [1,0,0],
    family: 'First Son', direction: 'E', season: 'Spring', bodyPart: 'Foot', animal: 'Dragon',
    quality: 'Shuo Gua: inciting movement. First son. The dragon, dark yellow, spreading, a great road, decisiveness. God comes forth in Zhèn.',
  },
  {
    id: 5, name: 'Fire', ch: 'Lí', symbol: '☲', attr: 'Clinging', lines: [1,0,1],
    family: 'Second Daughter', direction: 'S', season: 'Summer', bodyPart: 'Eye', animal: 'Pheasant',
    quality: 'Shuo Gua: brightness, clinging. Second daughter. Lightning, sun, helmet and armor, spear and sword, dryness, the pheasant, the tortoise, the crab.',
  },
  {
    id: 6, name: 'Lake', ch: 'Duì', symbol: '☱', attr: 'Joyous', lines: [1,1,0],
    family: 'Third Daughter', direction: 'W', season: 'Autumn', bodyPart: 'Mouth', animal: 'Sheep',
    quality: 'Shuo Gua: joyous. Third daughter. The mouth, a sorceress, tongue, smashing, breaking, hard and salty soil. The season of harvest.',
  },
  {
    id: 7, name: 'Heaven', ch: 'Qián', symbol: '☰', attr: 'Creative', lines: [1,1,1],
    family: 'Father', direction: 'NW', season: 'Late Autumn', bodyPart: 'Head', animal: 'Horse',
    quality: 'Shuo Gua: strong, creative. The father. Heaven, jade, metal, ice, deep red, a good horse, an old horse, a thin horse, a piebald horse, tree-fruit.',
  },
];

/* trigramId = line[0]*4 + line[1]*2 + line[2] (bottom, middle, top) */
export function trigramId(lines3) {
  return lines3[0] * 4 + lines3[1] * 2 + lines3[2];
}

/**
 * Each hexagram: n = King Wen number, name, ch = pinyin,
 * lo/up = lower/upper trigram name, lines = [6 values, bottom→top],
 * judgment = traditional Judgment text (guà cí 卦辭),
 * image = Great Image text (dà xiàng 大象) from the Ten Wings,
 * both after the Legge translation (1882).
 */
export const HEXAGRAMS = [
  { n:1,  name:'The Creative',           ch:'Qián',      lo:'Heaven',  up:'Heaven',   lines:[1,1,1,1,1,1],
    judgment:'Sublime success. Furthering through perseverance.',
    image:'The movement of heaven is full of power. Thus the superior man makes himself strong and untiring.',
    lineTexts:[
      'Hidden dragon. Do not act.',
      'Dragon appearing in the field. It furthers to see the great man.',
      'All day long the superior man is creatively active. At nightfall his mind is still beset with cares. Danger. No blame.',
      'Wavering flight over the depths. No blame.',
      'Flying dragon in the heavens. It furthers to see the great man.',
      'Arrogant dragon will have cause to repent.',
    ],
    allLines:'There appears a flight of dragons without heads. Good fortune.' },
  { n:2,  name:'The Receptive',          ch:'Kūn',       lo:'Earth',   up:'Earth',    lines:[0,0,0,0,0,0],
    judgment:'Sublime success through the perseverance of a mare. If the superior man undertakes something and tries to lead, he goes astray; if he follows, he finds guidance. Friends in the southwest; losing friends in the northeast. Quiet perseverance brings good fortune.',
    image:'The earth\'s condition is receptive devotion. Thus the superior man who has breadth of character carries the outer world.',
    lineTexts:[
      'When there is hoarfrost underfoot, solid ice is not far off.',
      'Straight, square, great. Without purpose, yet nothing remains unfurthered.',
      'Hidden lines. One is able to remain persevering. If by chance you are in the service of a king, seek not works, but bring to completion.',
      'A tied-up sack. No blame, no praise.',
      'A yellow lower garment brings supreme good fortune.',
      'Dragons fight in the meadow. Their blood is black and yellow.',
    ],
    allLines:'Lasting perseverance furthers.' },
  { n:3,  name:'Difficulty at the Beginning', ch:'Zhūn', lo:'Thunder', up:'Water',    lines:[1,0,0,0,1,0],
    judgment:'Sublime success. Furthering through perseverance. Nothing should be undertaken. It furthers to appoint helpers.',
    image:'Clouds and thunder: the image of Difficulty at the Beginning. Thus the superior man brings order out of confusion.',
    lineTexts:[
      'Hesitation and hindrance. It furthers to remain persevering. It furthers to appoint helpers.',
      'Difficulties pile up. Horse and wagon part. He is not a robber; he wants to woo when the time is right. The maiden is chaste and does not pledge herself. Ten years — then she pledges herself.',
      'Whoever hunts deer without the forester only loses his way in the forest. The superior man understands the signs of the time and prefers to desist. To go on brings humiliation.',
      'Horse and wagon part. Strive for union. To go brings good fortune. Everything acts to further.',
      'Difficulties in blessing. A little perseverance brings good fortune. Great perseverance brings misfortune.',
      'Horse and wagon part. Bloody tears flow.',
    ] },
  { n:4,  name:'Youthful Folly',         ch:'Méng',      lo:'Water',   up:'Mountain', lines:[0,1,0,0,0,1],
    judgment:'Success. It is not I who seek the young fool; the young fool seeks me. At the first oracle I inform him. If he asks two or three times, it is importunity; I give no information to the importunate. Perseverance furthers.',
    image:'A spring wells up at the foot of the mountain: the image of Youth. Thus the superior man fosters his character by thoroughness in all that he does.',
    lineTexts:[
      'To make a fool develop, it furthers to apply discipline. The fetters should be removed. To go on in this way brings humiliation.',
      'To bear with fools in kindliness brings good fortune. To know how to take women brings good fortune. The son is capable of taking charge of the household.',
      'Take not a maiden who, when she sees a man of bronze, loses possession of herself. Nothing furthers.',
      'Entangled folly brings humiliation.',
      'Childlike folly brings good fortune.',
      'In punishing folly it does not further to commit transgressions. The only thing that furthers is to prevent transgressions.',
    ] },
  { n:5,  name:'Waiting',                ch:'Xū',        lo:'Heaven',  up:'Water',    lines:[1,1,1,0,1,0],
    judgment:'With sincerity, brilliant success. Perseverance brings good fortune. It furthers to cross the great water.',
    image:'Clouds rise up to heaven: the image of Waiting. Thus the superior man eats and drinks, is joyous and of good cheer.',
    lineTexts:[
      'Waiting in the meadow. It furthers to abide in what endures. No blame.',
      'Waiting on the sand. There is some gossip. The end brings good fortune.',
      'Waiting in the mud brings about the arrival of the enemy.',
      'Waiting in blood. Get out of the pit.',
      'Waiting at meat and drink. Perseverance brings good fortune.',
      'One falls into the pit. Three uninvited guests arrive. Honor them, and in the end there will be good fortune.',
    ] },
  { n:6,  name:'Conflict',               ch:'Sòng',      lo:'Water',   up:'Heaven',   lines:[0,1,0,1,1,1],
    judgment:'Sincerity is obstructed. A cautious halt halfway brings good fortune. Going through to the end brings misfortune. It furthers to see the great man. It does not further to cross the great water.',
    image:'Heaven and water go their opposite ways: the image of Conflict. Thus in all his transactions the superior man carefully considers the beginning.',
    lineTexts:[
      'If one does not perpetuate the affair, there is a little gossip. In the end, good fortune comes.',
      'One cannot engage in conflict; one returns home, gives way. The people of his town, three hundred households, remain free of guilt.',
      'To nourish oneself on ancient virtue induces perseverance. Danger. In the end, good fortune comes. If by chance you are in the service of a king, seek not works.',
      'One cannot engage in conflict. One turns back and submits to fate, changes one\'s attitude, and finds peace in perseverance. Good fortune.',
      'To contend before him brings supreme good fortune.',
      'Even if by chance a leather belt is bestowed on one, by the end of a morning it will have been snatched away three times.',
    ] },
  { n:7,  name:'The Army',               ch:'Shī',       lo:'Water',   up:'Earth',    lines:[0,1,0,0,0,0],
    judgment:'The army needs perseverance and a strong man. Good fortune without blame.',
    image:'In the middle of the earth is water: the image of the Army. Thus the superior man increases his masses by generosity toward the people.',
    lineTexts:[
      'An army must set forth in proper order. If the order is not good, misfortune threatens.',
      'In the midst of the army. Good fortune. No blame. The king bestows a triple decoration.',
      'Perchance the army carries corpses in the wagon. Misfortune.',
      'The army retreats. No blame.',
      'There is game in the field. It furthers to catch it. Without blame. Let the eldest lead the army. The younger transports corpses; then perseverance brings misfortune.',
      'The great prince issues commands, founds states, vests families with fiefs. Inferior people should not be employed.',
    ] },
  { n:8,  name:'Holding Together',        ch:'Bǐ',       lo:'Earth',   up:'Water',    lines:[0,0,0,0,1,0],
    judgment:'Good fortune. Inquire of the oracle whether you possess sublimity, constancy, and perseverance; then there is no blame. Those who are uncertain gradually join. Whoever comes too late meets with misfortune.',
    image:'On the earth is water: the image of Holding Together. Thus the kings of antiquity bestowed the different states as fiefs and cultivated friendly relations with the feudal lords.',
    lineTexts:[
      'Hold to him in truth and loyalty; this is without blame. Truth, like a full earthen bowl: thus in the end good fortune comes from without.',
      'Hold to him inwardly. Perseverance brings good fortune.',
      'You hold together with the wrong people.',
      'Hold to him outwardly also. Perseverance brings good fortune.',
      'Manifestation of holding together. The king uses beaters on three sides only and forgoes game that runs off in front. The citizens need no warning. Good fortune.',
      'He finds no head for holding together. Misfortune.',
    ] },
  { n:9,  name:'Small Taming',           ch:'Xiǎo Chù',  lo:'Heaven',  up:'Wind',     lines:[1,1,1,0,1,1],
    judgment:'Success. Dense clouds, no rain from our western region.',
    image:'The wind drives across heaven: the image of the Taming Power of the Small. Thus the superior man refines the outward aspect of his nature.',
    lineTexts:[
      'Return to the way. How could there be blame in this? Good fortune.',
      'He allows himself to be drawn into returning. Good fortune.',
      'The spokes burst out of the wagon wheels. Man and wife roll their eyes.',
      'If you are sincere, blood vanishes and fear gives way. No blame.',
      'If you are sincere and loyally attached, you are rich in your neighbor.',
      'The rain comes, there is rest. This is due to the lasting effect of character. Perseverance brings the woman into danger. The moon is nearly full. If the superior man persists, misfortune comes.',
    ] },
  { n:10, name:'Treading',               ch:'Lǚ',        lo:'Lake',    up:'Heaven',   lines:[1,1,0,1,1,1],
    judgment:'Treading upon the tail of the tiger. It does not bite the man. Success.',
    image:'Heaven above, the lake below: the image of Treading. Thus the superior man discriminates between high and low, and thereby fortifies the thinking of the people.',
    lineTexts:[
      'Simple conduct. Progress without blame.',
      'Treading a smooth, level course. The perseverance of a dark man brings good fortune.',
      'A one-eyed man is able to see, a lame man is able to tread. He treads on the tail of the tiger. The tiger bites the man. Misfortune. Thus does a warrior act on behalf of his great prince.',
      'He treads on the tail of the tiger. Caution and circumspection lead ultimately to good fortune.',
      'Resolute conduct. Perseverance with awareness of danger.',
      'Look to your conduct and weigh the favorable signs. When everything is fulfilled, supreme good fortune comes.',
    ] },
  { n:11, name:'Peace',                  ch:'Tài',       lo:'Heaven',  up:'Earth',    lines:[1,1,1,0,0,0],
    judgment:'The small departs, the great approaches. Good fortune. Success.',
    image:'Heaven and earth unite: the image of Peace. Thus the ruler divides and completes the course of heaven and earth, furthers and regulates the gifts of heaven and earth, and so aids the people.',
    lineTexts:[
      'When ribbon grass is pulled up, the sod comes with it. Each according to his kind. Undertakings bring good fortune.',
      'Bearing with the uncultured in gentleness, fording the river with resolution, not neglecting what is distant, not regarding one\'s companions: thus one may manage to walk in the middle.',
      'No plain not followed by a slope. No going not followed by a return. He who remains persevering in danger is without blame. Do not complain about this truth; enjoy the good fortune you still possess.',
      'He flutters down, not boasting of his wealth, together with his neighbor, guileless and sincere.',
      'The sovereign I gives his daughter in marriage. This brings blessing and supreme good fortune.',
      'The wall falls back into the moat. Use no army now. Make your commands known within your own town. Perseverance brings humiliation.',
    ] },
  { n:12, name:'Standstill',             ch:'Pǐ',        lo:'Earth',   up:'Heaven',   lines:[0,0,0,1,1,1],
    judgment:'The great departs, the small approaches. Unfavorable for the perseverance of the superior man.',
    image:'Heaven and earth do not unite: the image of Standstill. Thus the superior man falls back upon his inner worth in order to escape the difficulties. He does not permit himself to be honored with revenue.',
    lineTexts:[
      'When ribbon grass is pulled up, the sod comes with it. Each according to his kind. Perseverance brings good fortune and success.',
      'They bear and endure; this means good fortune for inferior people. The standstill serves to help the great man to attain success.',
      'They bear shame.',
      'He who acts at the command of the highest remains without blame. Those of like mind partake of the blessing.',
      'Standstill is giving way. Good fortune for the great man. "What if it should fail, what if it should fail?" In this way he ties it to a cluster of mulberry shoots.',
      'The standstill comes to an end. First standstill, then good fortune.',
    ] },
  { n:13, name:'Fellowship',             ch:'Tóng Rén',  lo:'Fire',    up:'Heaven',   lines:[1,0,1,1,1,1],
    judgment:'Fellowship with men in the open. Success. It furthers to cross the great water. The perseverance of the superior man furthers.',
    image:'Heaven together with fire: the image of Fellowship with Men. Thus the superior man organizes the clans and makes distinctions between things.',
    lineTexts:[
      'Fellowship with men at the gate. No blame.',
      'Fellowship with men in the clan. Humiliation.',
      'He hides weapons in the thicket; he climbs the high hill in front of it. For three years he does not rise up.',
      'He climbs up on his wall; he cannot attack. Good fortune.',
      'Men bound in fellowship first weep and lament, but afterward they laugh. After great struggles they succeed in meeting.',
      'Fellowship with men in the meadow. No remorse.',
    ] },
  { n:14, name:'Great Possession',       ch:'Dà Yǒu',    lo:'Heaven',  up:'Fire',     lines:[1,1,1,1,0,1],
    judgment:'Supreme success.',
    image:'Fire in heaven above: the image of Possession in Great Measure. Thus the superior man curbs evil and furthers good, and thereby obeys the benevolent will of heaven.',
    lineTexts:[
      'No relationship with what is harmful; there is no blame in this. If one remains conscious of difficulty, one remains without blame.',
      'A big wagon for loading. One may undertake something. No blame.',
      'A prince offers it to the Son of Heaven. A petty man cannot do this.',
      'He makes a difference between himself and his neighbor. No blame.',
      'He whose truth is accessible, yet dignified, has good fortune.',
      'He is blessed by heaven. Good fortune. Nothing that does not further.',
    ] },
  { n:15, name:'Modesty',                ch:'Qiān',      lo:'Mountain', up:'Earth',   lines:[0,0,1,0,0,0],
    judgment:'Success. The superior man carries things through to completion.',
    image:'Within the earth, a mountain: the image of Modesty. Thus the superior man reduces that which is too much, and augments that which is too little. He weighs things and makes them equal.',
    lineTexts:[
      'A superior man modest about his modesty may cross the great water. Good fortune.',
      'Modesty that comes to expression. Perseverance brings good fortune.',
      'A superior man of modesty and merit carries things to conclusion. Good fortune.',
      'Nothing that would not further modesty in movement.',
      'No boasting of wealth before one\'s neighbor. It is favorable to attack with force. Nothing that would not further.',
      'Modesty that comes to expression. It is favorable to set armies marching to chastise one\'s own city and one\'s country.',
    ] },
  { n:16, name:'Enthusiasm',             ch:'Yù',        lo:'Earth',   up:'Thunder',  lines:[0,0,0,1,0,0],
    judgment:'It furthers to install helpers and to set armies marching.',
    image:'Thunder comes resounding out of the earth: the image of Enthusiasm. Thus the ancient kings made music in order to honor merit, and offered it with splendor to the Supreme Deity.',
    lineTexts:[
      'Enthusiasm that expresses itself brings misfortune.',
      'Firm as a rock. Not a whole day. Perseverance brings good fortune.',
      'Enthusiasm that looks upward creates remorse. Hesitation brings remorse.',
      'The source of enthusiasm. He achieves great things. Doubt not. You gather friends around you as a hair clasp gathers the hair.',
      'Persistently ill, and still does not die.',
      'Deluded enthusiasm. But if after completion one changes, there is no blame.',
    ] },
  { n:17, name:'Following',              ch:'Suí',       lo:'Thunder', up:'Lake',     lines:[1,0,0,1,1,0],
    judgment:'Supreme success. Perseverance furthers. No blame.',
    image:'Thunder in the middle of the lake: the image of Following. Thus the superior man at nightfall goes indoors for rest and recuperation.',
    lineTexts:[
      'The standard is changing. Perseverance brings good fortune. To go out of the door in company produces deeds.',
      'If one clings to the little boy, one loses the strong man.',
      'If one clings to the strong man, one loses the little boy. Through following one finds what one seeks. It furthers to remain persevering.',
      'Following creates success. Perseverance brings misfortune. To go one\'s way with sincerity brings clarity. How could there be blame in this?',
      'Sincere in the good. Good fortune.',
      'He meets with firm allegiance and is still further bound. The king introduces him to the Western Mountain.',
    ] },
  { n:18, name:'Work on the Decayed',    ch:'Gǔ',        lo:'Wind',    up:'Mountain', lines:[0,1,1,0,0,1],
    judgment:'Supreme success. It furthers to cross the great water. Before the starting point, three days. After the starting point, three days.',
    image:'The wind blows low on the mountain: the image of Decay. Thus the superior man stirs up the people and strengthens their spirit.',
    lineTexts:[
      'Setting right what has been spoiled by the father. If there is a son, no blame rests upon the departed father. Danger. In the end, good fortune.',
      'Setting right what has been spoiled by the mother. One must not be too persevering.',
      'Setting right what has been spoiled by the father. There will be a little remorse. No great blame.',
      'Tolerating what has been spoiled by the father. In continuing one sees humiliation.',
      'Setting right what has been spoiled by the father. One meets with praise.',
      'He does not serve kings and princes, sets himself higher goals.',
    ] },
  { n:19, name:'Approach',               ch:'Lín',       lo:'Lake',    up:'Earth',    lines:[1,1,0,0,0,0],
    judgment:'Supreme success. Perseverance furthers. When the eighth month comes, there will be misfortune.',
    image:'The earth above the lake: the image of Approach. Thus the superior man is inexhaustible in his will to teach, and without limits in his tolerance and protection of the people.',
    lineTexts:[
      'Joint approach. Perseverance brings good fortune.',
      'Joint approach. Good fortune. Everything furthers.',
      'Comfortable approach. Nothing that would further. If one is induced to grieve over it, one becomes free of blame.',
      'Complete approach. No blame.',
      'Wise approach. This is right for a great prince. Good fortune.',
      'Great-hearted approach. Good fortune. No blame.',
    ] },
  { n:20, name:'Contemplation',          ch:'Guān',      lo:'Earth',   up:'Wind',     lines:[0,0,0,0,1,1],
    judgment:'The ablution has been made, but not yet the offering. Full of trust, they look up.',
    image:'The wind blows over the earth: the image of Contemplation. Thus the kings of old visited the regions of the world, contemplated the people, and gave them instruction.',
    lineTexts:[
      'Boy-like contemplation. For an inferior man, no blame. For a superior man, humiliation.',
      'Contemplation through the crack of the door. Furthering for the perseverance of a woman.',
      'Contemplation of my life decides the choice between advance and retreat.',
      'Contemplation of the light of the kingdom. It furthers to exert influence as the guest of a king.',
      'Contemplation of my life. The superior man is without blame.',
      'Contemplation of his life. The superior man is without blame.',
    ] },
  { n:21, name:'Biting Through',         ch:'Shì Hé',    lo:'Thunder', up:'Fire',     lines:[1,0,0,1,0,1],
    judgment:'Success. It furthers to administer justice.',
    image:'Thunder and lightning: the image of Biting Through. Thus the kings of former times made firm the laws through clearly defined penalties.',
    lineTexts:[
      'His feet are fastened in the stocks, so that his toes disappear. No blame.',
      'Bites through tender meat, so that his nose disappears. No blame.',
      'Bites on old dried meat and strikes on something poisonous. Slight humiliation. No blame.',
      'Bites on dried gristly meat. Receives metal arrows. It furthers to be mindful of difficulties and to be persevering. Good fortune.',
      'Bites on dried lean meat. Receives yellow gold. Perseveringly aware of danger. No blame.',
      'His neck is fastened in the wooden cangue, so that his ears disappear. Misfortune.',
    ] },
  { n:22, name:'Grace',                  ch:'Bì',        lo:'Fire',    up:'Mountain', lines:[1,0,1,0,0,1],
    judgment:'Success. In small matters it furthers to undertake something.',
    image:'Fire at the foot of the mountain: the image of Grace. Thus does the superior man proceed when clearing up current affairs. But he dare not decide controversial issues in this way.',
    lineTexts:[
      'He lends grace to his toes, leaves the carriage, and walks.',
      'Lends grace to the beard on his chin.',
      'Graceful and moist. Constant perseverance brings good fortune.',
      'Grace or simplicity? A white horse comes as if on wings. He is not a robber; he will woo at the right time.',
      'Grace in hills and gardens. The roll of silk is meager and small. Humiliation, but in the end good fortune.',
      'Simple grace. No blame.',
    ] },
  { n:23, name:'Splitting Apart',        ch:'Bō',        lo:'Earth',   up:'Mountain', lines:[0,0,0,0,0,1],
    judgment:'It does not further to go anywhere.',
    image:'The mountain rests on the earth: the image of Splitting Apart. Thus those above can ensure their position only by giving generously to those below.',
    lineTexts:[
      'The leg of the bed is split. Those who persevere are destroyed. Misfortune.',
      'The bed is split at the edge. Those who persevere are destroyed. Misfortune.',
      'He splits with them. No blame.',
      'The bed is split up to the skin. Misfortune.',
      'A shoal of fishes. Favor comes through the court ladies. Everything acts to further.',
      'There is a large fruit still uneaten. The superior man receives a carriage. The house of the inferior man is split apart.',
    ] },
  { n:24, name:'Return',                 ch:'Fù',        lo:'Thunder', up:'Earth',    lines:[1,0,0,0,0,0],
    judgment:'Success. Going out and coming in without error. Friends come without blame. The way turns and returns; it comes back after seven days. It furthers to have somewhere to go.',
    image:'Thunder within the earth: the image of the Turning Point. Thus the kings of antiquity closed the passes at the time of solstice. Merchants and strangers did not go about, and the ruler did not travel through the provinces.',
    lineTexts:[
      'Return from a short distance. No need for remorse. Great good fortune.',
      'Quiet return. Good fortune.',
      'Repeated return. Danger. No blame.',
      'Walking in the midst of others, one returns alone.',
      'Noble-hearted return. No remorse.',
      'Missing the return. Misfortune. Misfortune from within and without. If armies are set marching in this way, one will in the end suffer a great defeat, disastrous for the ruler of the country. For ten years it will not be possible to attack again.',
    ] },
  { n:25, name:'Innocence',              ch:'Wú Wàng',   lo:'Thunder', up:'Heaven',   lines:[1,0,0,1,1,1],
    judgment:'Supreme success. Perseverance furthers. If someone is not as he should be, he has misfortune, and it does not further to undertake anything.',
    image:'Under heaven thunder rolls: all things attain the natural state of innocence. Thus the kings of old, rich in virtue and in harmony with the time, fostered and nourished all beings.',
    lineTexts:[
      'Innocent behavior brings good fortune.',
      'If one does not count on the harvest while plowing, nor on the use of the ground while clearing it, it furthers to undertake something.',
      'Undeserved misfortune. The cow that was tethered by someone is the wanderer\'s gain, the citizen\'s loss.',
      'He who can be persevering remains without blame.',
      'Use no medicine in an illness incurred through no fault of your own. It will pass of itself.',
      'Innocent action brings misfortune. Nothing furthers.',
    ] },
  { n:26, name:'Great Taming',           ch:'Dà Chù',    lo:'Heaven',  up:'Mountain', lines:[1,1,1,0,0,1],
    judgment:'Perseverance furthers. Not eating at home brings good fortune. It furthers to cross the great water.',
    image:'Heaven within the mountain: the image of the Taming Power of the Great. Thus the superior man acquaints himself with many sayings of antiquity and many deeds of the past, in order to strengthen his character thereby.',
    lineTexts:[
      'Danger is at hand. It furthers to desist.',
      'The axletrees are taken from the wagon.',
      'A good horse that follows others. Awareness of danger, with perseverance, furthers. Practice chariot driving and armed defense daily. It furthers to have somewhere to go.',
      'The headboard of a young bull. Great good fortune.',
      'The tusk of a gelded boar. Good fortune.',
      'One attains the way of heaven. Success.',
    ] },
  { n:27, name:'Nourishment',            ch:'Yí',        lo:'Thunder', up:'Mountain', lines:[1,0,0,0,0,1],
    judgment:'Perseverance brings good fortune. Attend to the providing of nourishment, and to what a man seeks to fill his own mouth with.',
    image:'At the foot of the mountain, thunder: the image of Providing Nourishment. Thus the superior man is careful of his words and temperate in eating and drinking.',
    lineTexts:[
      'You let your magic tortoise go, and look at me with the corners of your mouth drooping. Misfortune.',
      'Turning to the summit for nourishment, deviating from the path to seek nourishment from the hill. Continuing to do this brings misfortune.',
      'Turning away from nourishment. Perseverance brings misfortune. Do not act thus for ten years. Nothing serves to further.',
      'Turning to the summit for provision of nourishment brings good fortune. Spying about with sharp eyes like a tiger with insatiable craving. No blame.',
      'Turning away from the path. To remain persevering brings good fortune. One should not cross the great water.',
      'The source of nourishment. Awareness of danger brings good fortune. It furthers to cross the great water.',
    ] },
  { n:28, name:'Great Exceeding',        ch:'Dà Guò',    lo:'Wind',    up:'Lake',     lines:[0,1,1,1,1,0],
    judgment:'The ridgepole sags. It furthers to have somewhere to go. Success.',
    image:'The lake rises above the trees: the image of Preponderance of the Great. Thus the superior man, when he stands alone, is unconcerned, and if he has to renounce the world, he is undaunted.',
    lineTexts:[
      'To spread white rushes underneath. No blame.',
      'A dry poplar sprouts at the root. An older man takes a young wife. Everything furthers.',
      'The ridgepole sags to the breaking point. Misfortune.',
      'The ridgepole is braced. Good fortune. If there are ulterior motives, it is humiliating.',
      'A withered poplar puts forth flowers. An older woman takes a husband. No blame. No praise.',
      'One must go through the water. It goes over one\'s head. Misfortune. No blame.',
    ] },
  { n:29, name:'The Abysmal',            ch:'Kǎn',       lo:'Water',   up:'Water',    lines:[0,1,0,0,1,0],
    judgment:'Repeated danger. If you are sincere, you have success in your heart, and whatever you do succeeds.',
    image:'Water flows on and reaches the goal: the image of the Abysmal repeated. Thus the superior man walks in lasting virtue and carries on the business of teaching.',
    lineTexts:[
      'Repetition of the Abysmal. In the abyss one falls into a pit. Misfortune.',
      'The abyss is dangerous. One should strive to attain small things only.',
      'Forward and backward, abyss on abyss. In danger like this, pause at first and wait, otherwise you will fall into a pit in the abyss. Do not act this way.',
      'A jug of wine, a bowl of rice with it; earthen vessels simply handed in through the window. There is certainly no blame in this.',
      'The abyss is not filled to overflowing, it is filled only to the rim. No blame.',
      'Bound with cords and ropes, shut in between thorn-hedged prison walls: for three years one does not find the way. Misfortune.',
    ] },
  { n:30, name:'The Clinging',           ch:'Lí',        lo:'Fire',    up:'Fire',     lines:[1,0,1,1,0,1],
    judgment:'Perseverance furthers. Success. Care of the cow brings good fortune.',
    image:'That which is bright rises twice: the image of Fire. Thus the great man, by perpetuating this brightness, illumines the four quarters of the world.',
    lineTexts:[
      'The footprints run crisscross. If one is seriously intent, no blame.',
      'Yellow light. Supreme good fortune.',
      'In the light of the setting sun, men either beat the pot and sing or loudly bewail the approach of old age. Misfortune.',
      'Its coming is sudden; it flames up, dies down, is thrown away.',
      'Tears in floods, sighing and lamenting. Good fortune.',
      'The king used him to march forth and chastise. Then it is best to kill the leaders and take captive the followers. No blame.',
    ] },
  { n:31, name:'Influence',              ch:'Xián',      lo:'Mountain', up:'Lake',    lines:[0,0,1,1,1,0],
    judgment:'Success. Perseverance furthers. To take a maiden to wife brings good fortune.',
    image:'A lake on the mountain: the image of Influence. Thus the superior man encourages people to approach him by his readiness to receive them.',
    lineTexts:[
      'The influence shows itself in the big toe.',
      'The influence shows itself in the calves of the legs. Misfortune. Tarrying brings good fortune.',
      'The influence shows itself in the thighs. Holds to that which follows it. To continue is humiliating.',
      'Perseverance brings good fortune. Remorse disappears. If a man is agitated in mind, and his thoughts go hither and thither, only those friends on whom he fixes his conscious thoughts will follow.',
      'The influence shows itself in the back of the neck. No remorse.',
      'The influence shows itself in the jaws, cheeks, and tongue.',
    ] },
  { n:32, name:'Duration',               ch:'Héng',      lo:'Wind',    up:'Thunder',  lines:[0,1,1,1,0,0],
    judgment:'Success. No blame. Perseverance furthers. It furthers to have somewhere to go.',
    image:'Thunder and wind: the image of Duration. Thus the superior man stands firm and does not change his direction.',
    lineTexts:[
      'Seeking duration too hastily brings misfortune persistently. Nothing that would further.',
      'Remorse disappears.',
      'He who does not give duration to his character meets with disgrace. Persistent humiliation.',
      'No game in the field.',
      'Giving duration to one\'s character through perseverance. This is good fortune for a woman but misfortune for a man.',
      'Restlessness as an enduring condition brings misfortune.',
    ] },
  { n:33, name:'Retreat',                ch:'Dùn',       lo:'Mountain', up:'Heaven',  lines:[0,0,1,1,1,1],
    judgment:'Success. In what is small, perseverance furthers.',
    image:'Mountain under heaven: the image of Retreat. Thus the superior man keeps the inferior man at a distance, not angrily but with reserve.',
    lineTexts:[
      'At the tail in retreat. This is dangerous. One must not wish to undertake anything.',
      'He holds him fast with yellow oxhide. No one can tear him loose.',
      'A halted retreat is nerve-wracking and dangerous. To retain people as men- and maidservants brings good fortune.',
      'Voluntary retreat brings good fortune to the superior man and downfall to the inferior man.',
      'Friendly retreat. Perseverance brings good fortune.',
      'Cheerful retreat. Everything serves to further.',
    ] },
  { n:34, name:'Great Power',            ch:'Dà Zhuàng', lo:'Heaven',  up:'Thunder',  lines:[1,1,1,1,0,0],
    judgment:'Perseverance furthers.',
    image:'Thunder in heaven above: the image of the Power of the Great. Thus the superior man does not tread upon paths that do not accord with established order.',
    lineTexts:[
      'Power in the toes. Continuing brings misfortune. This is certainly true.',
      'Perseverance brings good fortune.',
      'The inferior man works through power. The superior man does not act thus. To continue is dangerous. A goat butts against a hedge and gets its horns entangled.',
      'Perseverance brings good fortune. Remorse disappears. The hedge opens; there is no entanglement. Power depends upon the axle of a big cart.',
      'Loses the goat with ease. No remorse.',
      'A goat butts against a hedge. It cannot go backward, it cannot go forward. Nothing serves to further. If one notes the difficulty, this brings good fortune.',
    ] },
  { n:35, name:'Progress',               ch:'Jìn',       lo:'Earth',   up:'Fire',     lines:[0,0,0,1,0,1],
    judgment:'The powerful prince is honored with horses in large numbers. In a single day he is granted audience three times.',
    image:'The sun rises over the earth: the image of Progress. Thus the superior man himself brightens his bright virtue.',
    lineTexts:[
      'Progressing, but turned back. Perseverance brings good fortune. If one meets with no confidence, one should remain calm. No mistake.',
      'Progressing, but in sorrow. Perseverance brings good fortune. Then one obtains great happiness from one\'s ancestress.',
      'All are in accord. Remorse disappears.',
      'Progress like a hamster. Perseverance brings danger.',
      'Remorse disappears. Take not gain and loss to heart. Undertakings bring good fortune. Everything serves to further.',
      'Making progress with the horns is permissible only for the purpose of punishing one\'s own city. To be conscious of danger brings good fortune. No blame. Perseverance brings humiliation.',
    ] },
  { n:36, name:'Darkening of the Light', ch:'Míng Yí',   lo:'Fire',    up:'Earth',    lines:[1,0,1,0,0,0],
    judgment:'In adversity it furthers to be persevering.',
    image:'The light has sunk into the earth: the image of Darkening of the Light. Thus does the superior man live with the great mass: he veils his light, yet still shines.',
    lineTexts:[
      'Darkening of the light during flight. He lowers his wings. The superior man does not eat for three days on his wanderings. But he has somewhere to go. The host has occasion to gossip.',
      'Darkening of the light injures him in the left thigh. He gives aid with the strength of a horse. Good fortune.',
      'Darkening of the light during the hunt in the south. Their great leader is captured. One must not expect perseverance too soon.',
      'He penetrates the left side of the belly. One gets at the very heart of the darkening of the light, and leaves gate and courtyard.',
      'Darkening of the light as with Prince Chi. Perseverance furthers.',
      'Not light but darkness. First he climbed up to heaven, then he plunged into the depths of the earth.',
    ] },
  { n:37, name:'The Family',             ch:'Jiā Rén',   lo:'Fire',    up:'Wind',     lines:[1,0,1,0,1,1],
    judgment:'The perseverance of the woman furthers.',
    image:'Wind comes forth from fire: the image of the Family. Thus the superior man has substance in his words and duration in his way of life.',
    lineTexts:[
      'Firm seclusion within the family. Remorse disappears.',
      'She should not follow her whims. She must attend within to the food. Perseverance brings good fortune.',
      'When tempers flare up in the family, too great severity brings remorse. Good fortune nonetheless. When woman and child dally and laugh, it leads in the end to humiliation.',
      'She is the treasure of the house. Great good fortune.',
      'As a king he approaches his family. Fear not. Good fortune.',
      'His work commands respect. In the end good fortune comes.',
    ] },
  { n:38, name:'Opposition',             ch:'Kuí',       lo:'Lake',    up:'Fire',     lines:[1,1,0,1,0,1],
    judgment:'In small matters, good fortune.',
    image:'Above, fire; below, the lake: the image of Opposition. Thus amid all fellowship the superior man retains his individuality.',
    lineTexts:[
      'Remorse disappears. If you lose your horse, do not run after it; it will come back of its own accord. When you see evil people, guard yourself against mistakes.',
      'One meets his lord in a narrow street. No blame.',
      'One sees the wagon dragged back, the oxen halted, a man\'s hair and nose cut off. Not a good beginning, but a good end.',
      'Isolated through opposition, one meets a like-minded man with whom one can associate in good faith. Despite the danger, no blame.',
      'Remorse disappears. The companion bites his way through the wrappings. If one goes to him, how could it be a mistake?',
      'Isolated through opposition, one sees one\'s companion as a pig covered with dirt, as a wagon full of devils. First one draws a bow against him, then one lays the bow aside. He is not a robber; he will woo at the right time. As one goes, rain falls; then good fortune comes.',
    ] },
  { n:39, name:'Obstruction',            ch:'Jiǎn',      lo:'Mountain', up:'Water',   lines:[0,0,1,0,1,0],
    judgment:'The southwest furthers. The northeast does not further. It furthers to see the great man. Perseverance brings good fortune.',
    image:'Water on the mountain: the image of Obstruction. Thus the superior man turns his attention to himself and molds his character.',
    lineTexts:[
      'Going leads to obstructions, coming meets with praise.',
      'The king\'s servant is beset by obstruction upon obstruction, but it is not his own fault.',
      'Going leads to obstructions; hence he comes back.',
      'Going leads to obstructions, coming leads to union.',
      'In the midst of the greatest obstructions, friends come.',
      'Going leads to obstructions, coming leads to great good fortune. It furthers to see the great man.',
    ] },
  { n:40, name:'Deliverance',            ch:'Jiě',       lo:'Water',   up:'Thunder',  lines:[0,1,0,1,0,0],
    judgment:'The southwest furthers. If there is no longer anything where one has to go, return brings good fortune. If there is still something where one has to go, hastening brings good fortune.',
    image:'Thunder and rain set in: the image of Deliverance. Thus the superior man pardons mistakes and forgives misdeeds.',
    lineTexts:[
      'Without blame.',
      'One kills three foxes in the field and receives a yellow arrow. Perseverance brings good fortune.',
      'If a man carries a burden on his back and nonetheless rides in a carriage, he thereby encourages robbers to draw near. Perseverance leads to humiliation.',
      'Deliver yourself from your great toe. Then the companion comes, and him you can trust.',
      'If only the superior man can deliver himself, it brings good fortune. Thus he proves to inferior men that he is in earnest.',
      'The prince shoots at a hawk on a high wall. He kills it. Everything serves to further.',
    ] },
  { n:41, name:'Decrease',               ch:'Sǔn',       lo:'Lake',    up:'Mountain', lines:[1,1,0,0,0,1],
    judgment:'With sincerity, supreme good fortune without blame. One may be persevering. It furthers to undertake something. How is this to be carried out? Two small bowls may be used for the sacrifice.',
    image:'At the foot of the mountain, the lake: the image of Decrease. Thus the superior man controls his anger and restrains his instincts.',
    lineTexts:[
      'Going quickly when one\'s tasks are finished is without blame. But one must reflect on how much one may decrease others.',
      'Perseverance furthers. To undertake something brings misfortune. Without decreasing oneself, one is able to bring increase to others.',
      'When three people journey together, their number decreases by one. When one man journeys alone, he finds a companion.',
      'If a man decreases his faults, it makes the other hasten to come and rejoice. No blame.',
      'Someone does indeed increase him. Ten pairs of tortoises cannot oppose it. Supreme good fortune.',
      'If one is increased without depriving others, there is no blame. Perseverance brings good fortune. It furthers to undertake something. One obtains servants but no longer has a separate home.',
    ] },
  { n:42, name:'Increase',               ch:'Yì',        lo:'Thunder', up:'Wind',     lines:[1,0,0,0,1,1],
    judgment:'It furthers to undertake something. It furthers to cross the great water.',
    image:'Wind and thunder: the image of Increase. Thus the superior man: if he sees good, he imitates it; if he has faults, he rids himself of them.',
    lineTexts:[
      'It furthers to accomplish great deeds. Supreme good fortune. No blame.',
      'Someone does indeed increase him; ten pairs of tortoises cannot oppose it. Constant perseverance brings good fortune. The king presents him before God. Good fortune.',
      'One is enriched through unfortunate events. No blame, if you are sincere and walk in the middle, and report with a seal to the prince.',
      'If you walk in the middle and report to the prince, he will follow. It furthers to be used in the removal of the capital.',
      'If in truth you have a kind heart, ask not. Supreme good fortune. Truly, kindness will be recognized as your virtue.',
      'He brings increase to no one. Indeed, someone even strikes him. He does not keep his heart constantly steady. Misfortune.',
    ] },
  { n:43, name:'Breakthrough',           ch:'Guài',      lo:'Heaven',  up:'Lake',     lines:[1,1,1,1,1,0],
    judgment:'One must resolutely make the matter known at the court of the king. It must be announced truthfully. Danger. It is necessary to notify one\'s own city. It does not further to resort to arms. It furthers to undertake something.',
    image:'The lake has risen up to heaven: the image of Breakthrough. Thus the superior man dispenses riches downward and refrains from resting on his virtue.',
    lineTexts:[
      'Mighty in the forward-striding toes. When one goes and is not equal to the undertaking, one makes a mistake.',
      'A cry of alarm. Arms at evening and at night. Fear nothing.',
      'To be powerful in the cheekbones brings misfortune. The superior man is firmly resolved. He walks alone and is caught in the rain. He is bespattered, and people murmur against him. No blame.',
      'There is no skin on his thighs, and walking comes hard. If a man were to let himself be led like a sheep, remorse would disappear. But if these words are heard, they will not be believed.',
      'In dealing with weeds, firm resolution is necessary. Walking in the middle remains free of blame.',
      'No cry. In the end misfortune comes.',
    ] },
  { n:44, name:'Coming to Meet',         ch:'Gòu',       lo:'Wind',    up:'Heaven',   lines:[0,1,1,1,1,1],
    judgment:'The maiden is powerful. One should not marry such a maiden.',
    image:'Under heaven, wind: the image of Coming to Meet. Thus does the prince act when disseminating his commands and proclaiming them to the four quarters of heaven.',
    lineTexts:[
      'It must be checked with a brake of bronze. Perseverance brings good fortune. If one lets it take its course, one experiences misfortune. Even a lean pig has it in him to rage around.',
      'There is a fish in the tank. No blame. Does not further guests.',
      'There is no skin on his thighs, and walking comes hard. If one is mindful of the danger, no great mistake is made.',
      'No fish in the tank. This leads to misfortune.',
      'A melon covered with willow leaves. Hidden lines. Then it drops down to one from heaven.',
      'He comes to meet with his horns. Humiliation. No blame.',
    ] },
  { n:45, name:'Gathering Together',     ch:'Cuì',       lo:'Earth',   up:'Lake',     lines:[0,0,0,1,1,0],
    judgment:'Success. The king approaches his temple. It furthers to see the great man; this brings success. Perseverance furthers. To bring great offerings creates good fortune. It furthers to undertake something.',
    image:'Over the earth, the lake: the image of Gathering Together. Thus the superior man renews his weapons in order to meet the unforeseen.',
    lineTexts:[
      'If you are sincere, but not to the end, there will sometimes be confusion, sometimes gathering together. If you call out, then after one grasp of the hand you can laugh again. Regret not. Going is without blame.',
      'Letting oneself be drawn brings good fortune and remains blameless. If one is sincere, it furthers to bring even a small offering.',
      'Gathering together amid sighs. Nothing that would further. Going is without blame. Slight humiliation.',
      'Great good fortune. No blame.',
      'If in gathering together one has position, this brings no blame. If there are some who are not yet sincerely in the work, sublime and enduring perseverance is needed. Then remorse disappears.',
      'Lamenting and sighing, floods of tears. No blame.',
    ] },
  { n:46, name:'Pushing Upward',         ch:'Shēng',     lo:'Wind',    up:'Earth',    lines:[0,1,1,0,0,0],
    judgment:'Supreme success. One must see the great man. Fear not. Departure toward the south brings good fortune.',
    image:'Within the earth, wood grows: the image of Pushing Upward. Thus the superior man of devoted character heaps up small things in order to achieve something high and great.',
    lineTexts:[
      'Pushing upward that meets with confidence brings great good fortune.',
      'If one is sincere, it furthers to bring even a small offering. No blame.',
      'One pushes upward into an empty city.',
      'The king offers him Mount Ch\'i. Good fortune. No blame.',
      'Perseverance brings good fortune. One pushes upward by steps.',
      'Pushing upward in darkness. It furthers to be unremittingly persevering.',
    ] },
  { n:47, name:'Oppression',             ch:'Kùn',       lo:'Water',   up:'Lake',     lines:[0,1,0,1,1,0],
    judgment:'Success. Perseverance. The great man brings about good fortune. No blame. When one has something to say, it is not believed.',
    image:'There is no water in the lake: the image of Exhaustion. Thus the superior man stakes his life on following his will.',
    lineTexts:[
      'One sits oppressed under a bare tree and strays into a gloomy valley. For three years one sees nothing.',
      'One is oppressed while at meat and drink. The man with the scarlet knee bands is just coming. It furthers to offer sacrifice. To set forth brings misfortune. No blame.',
      'A man permits himself to be oppressed by stone, and leans on thorns and thistles. He enters his house and does not see his wife. Misfortune.',
      'He comes very quietly, oppressed in a golden carriage. Humiliation, but the end is reached.',
      'His nose and feet are cut off. Oppression at the hands of the man with the purple knee bands. Joy comes softly. It furthers to make offerings and libations.',
      'He is oppressed by creeping vines. He moves uncertainly and says, "Movement brings remorse." If one feels remorse over this and makes a start, good fortune comes.',
    ] },
  { n:48, name:'The Well',               ch:'Jǐng',      lo:'Wind',    up:'Water',    lines:[0,1,1,0,1,0],
    judgment:'The town may be changed, but the well cannot be changed. It neither decreases nor increases. They come and go and draw from the well. If one gets down almost to the water and the rope does not go all the way, or the jug breaks, it brings misfortune.',
    image:'Water over wood: the image of the Well. Thus the superior man encourages the people at their work, and exhorts them to help one another.',
    lineTexts:[
      'One does not drink the mud of the well. No animals come to an old well.',
      'At the wellhole one shoots fishes. The jug is broken and leaks.',
      'The well is cleaned, but no one drinks from it. This is my heart\'s sorrow, for one might draw from it. If the king were clear-minded, good fortune might be enjoyed in common.',
      'The well is being lined. No blame.',
      'In the well there is a clear, cold spring from which one can drink.',
      'One draws from the well without hindrance. It is dependable. Supreme good fortune.',
    ] },
  { n:49, name:'Revolution',             ch:'Gé',        lo:'Fire',    up:'Lake',     lines:[1,0,1,1,1,0],
    judgment:'On your own day you are believed. Supreme success, furthering through perseverance. Remorse disappears.',
    image:'Fire in the lake: the image of Revolution. Thus the superior man sets the calendar in order and makes the seasons clear.',
    lineTexts:[
      'Wrapped in the hide of a yellow cow.',
      'When one\'s own day comes, one may create revolution. Starting brings good fortune. No blame.',
      'Starting brings misfortune. Perseverance brings danger. When talk of revolution has gone the rounds three times, one may commit himself, and men will believe him.',
      'Remorse disappears. Men believe him. Changing the form of government brings good fortune.',
      'The great man changes like a tiger. Even before questioning he is believed.',
      'The superior man changes like a panther. The inferior man molts in the face. Starting brings misfortune. To remain persevering brings good fortune.',
    ] },
  { n:50, name:'The Cauldron',           ch:'Dǐng',      lo:'Wind',    up:'Fire',     lines:[0,1,1,1,0,1],
    judgment:'Supreme good fortune. Success.',
    image:'Fire over wood: the image of the Cauldron. Thus the superior man consolidates his fate by making his position correct.',
    lineTexts:[
      'A ting with legs upturned. Furthers removal of stagnating stuff. One takes a concubine for the sake of her son. No blame.',
      'There is food in the ting. My comrades are envious, but they cannot harm me. Good fortune.',
      'The handle of the ting is altered. One is impeded in his way of life. The fat of the pheasant is not eaten. Once rain falls, remorse is spent. Good fortune comes in the end.',
      'The legs of the ting are broken. The prince\'s meal is spilled and his person is soiled. Misfortune.',
      'The ting has yellow handles, golden carrying rings. Perseverance furthers.',
      'The ting has rings of jade. Great good fortune. Nothing that would not act to further.',
    ] },
  { n:51, name:'The Arousing',           ch:'Zhèn',      lo:'Thunder', up:'Thunder',  lines:[1,0,0,1,0,0],
    judgment:'Success. The shock comes — oh, oh! Laughing words — ha, ha! The shock terrifies for a hundred miles, and he does not let fall the sacrificial spoon and chalice.',
    image:'Thunder repeated: the image of Shock. Thus in fear and trembling the superior man sets his life in order and examines himself.',
    lineTexts:[
      'Shock comes — oh, oh! Then follow laughing words — ha, ha! Good fortune.',
      'Shock comes bringing danger. A hundred thousand times you lose your treasures and must climb the nine hills. Do not go in pursuit of them. After seven days you will get them back again.',
      'Shock comes and makes one distraught. If shock spurs to action, one remains free of misfortune.',
      'Shock is mired.',
      'Shock goes hither and thither. Danger. However, nothing at all is lost. Yet there are things to be done.',
      'Shock brings ruin and terrified gazing around. Going ahead brings misfortune. If it has not yet reached one\'s own body but has reached one\'s neighbor first, there is no blame. One\'s comrades have something to talk about.',
    ] },
  { n:52, name:'Keeping Still',          ch:'Gèn',       lo:'Mountain', up:'Mountain', lines:[0,0,1,0,0,1],
    judgment:'Keeping his back so still that he no longer feels his body. He goes into his courtyard and does not see his people. No blame.',
    image:'Mountains standing close together: the image of Keeping Still. Thus the superior man does not permit his thoughts to go beyond his situation.',
    lineTexts:[
      'Keeping his toes still. No blame. Continued perseverance furthers.',
      'Keeping his calves still. He cannot rescue him whom he follows. His heart is not glad.',
      'Keeping his hips still. Making his sacrum stiff. Dangerous. The heart suffocates.',
      'Keeping his trunk still. No blame.',
      'Keeping his jaws still. The words have order. Remorse disappears.',
      'Noble-hearted keeping still. Good fortune.',
    ] },
  { n:53, name:'Development',            ch:'Jiàn',      lo:'Mountain', up:'Wind',    lines:[0,0,1,0,1,1],
    judgment:'The maiden is given in marriage. Good fortune. Perseverance furthers.',
    image:'On the mountain, a tree: the image of Development. Thus the superior man abides in dignity and virtue, in order to improve the mores.',
    lineTexts:[
      'The wild goose gradually draws near the shore. The young son is in danger. There is talk. No blame.',
      'The wild goose gradually draws near the cliff. Eating and drinking in peace and concord. Good fortune.',
      'The wild goose gradually draws near the plateau. The man goes forth and does not return. The woman carries a child but does not bring it forth. Misfortune. It furthers to fight off robbers.',
      'The wild goose gradually draws near the tree. Perhaps it will find a flat branch. No blame.',
      'The wild goose gradually draws near the summit. For three years the woman has no child. In the end nothing can hinder her. Good fortune.',
      'The wild goose gradually draws near the cloud heights. Its feathers can be used for the sacred dance. Good fortune.',
    ] },
  { n:54, name:'The Marrying Maiden',    ch:'Guī Mèi',   lo:'Lake',    up:'Thunder',  lines:[1,1,0,1,0,0],
    judgment:'Undertakings bring misfortune. Nothing that would further.',
    image:'Thunder over the lake: the image of the Marrying Maiden. Thus the superior man understands the transitory in the light of the eternity of the end.',
    lineTexts:[
      'The marrying maiden as a concubine. A lame man who is able to tread. Undertakings bring good fortune.',
      'A one-eyed man who is able to see. The perseverance of a solitary man furthers.',
      'The marrying maiden as a slave. She marries as a concubine.',
      'The marrying maiden draws out the allotted time. A late marriage comes in due course.',
      'The sovereign I gave his daughter in marriage. The embroidered garments of the princess were not as gorgeous as those of the serving maid. The moon that is nearly full brings good fortune.',
      'The woman holds the basket, but there are no fruits in it. The man stabs the sheep, but no blood flows. Nothing that acts to further.',
    ] },
  { n:55, name:'Abundance',              ch:'Fēng',      lo:'Fire',    up:'Thunder',  lines:[1,0,1,1,0,0],
    judgment:'Success. The king attains abundance. Be not sad. Be like the sun at midday.',
    image:'Both thunder and lightning come: the image of Abundance. Thus the superior man decides lawsuits and carries out punishments.',
    lineTexts:[
      'When a man meets his destined ruler, they can be together ten days, and it is not a mistake. Going meets with recognition.',
      'The curtain is of such fullness that the polestars can be seen at noon. Through going one meets with mistrust and hate. If one rouses him through truth, good fortune comes.',
      'The underbrush is of such abundance that the small stars can be seen at noon. He breaks his right arm. No blame.',
      'The curtain is of such fullness that the polestars can be seen at noon. He meets his ruler, who is of like kind. Good fortune.',
      'Lines are coming. Blessing and fame draw near. Good fortune.',
      'His house is in a state of abundance. He screens off his family. He peers through the gate and no longer perceives anyone. For three years he sees nothing. Misfortune.',
    ] },
  { n:56, name:'The Wanderer',           ch:'Lǚ',        lo:'Mountain', up:'Fire',    lines:[0,0,1,1,0,1],
    judgment:'Success through smallness. Perseverance brings good fortune to the wanderer.',
    image:'Fire on the mountain: the image of the Wanderer. Thus the superior man is clear-minded and cautious in imposing penalties, and protracts no lawsuits.',
    lineTexts:[
      'If the wanderer busies himself with trivial things, he draws down misfortune upon himself.',
      'The wanderer comes to an inn. He has his property with him. He wins the steadfastness of a young servant.',
      'The wanderer\'s inn burns down. He loses the steadfastness of his young servant. Danger.',
      'The wanderer rests in a shelter. He obtains his property and an ax. My heart is not glad.',
      'He shoots a pheasant. It drops with the first arrow. In the end this brings both praise and office.',
      'The bird\'s nest burns up. The wanderer laughs at first, then must needs lament and weep. Through carelessness he loses his cow. Misfortune.',
    ] },
  { n:57, name:'The Gentle',             ch:'Xùn',       lo:'Wind',    up:'Wind',     lines:[0,1,1,0,1,1],
    judgment:'Success through what is small. It furthers to have somewhere to go. It furthers to see the great man.',
    image:'Winds following one upon the other: the image of the Gently Penetrating. Thus the superior man spreads his commands abroad and carries out his undertakings.',
    lineTexts:[
      'In advancing and in retreating, the perseverance of a warrior furthers.',
      'Penetration under the bed. Priests and magicians are used in great number. Good fortune. No blame.',
      'Repeated penetration. Humiliation.',
      'Remorse vanishes. During the hunt three kinds of game are caught.',
      'Perseverance brings good fortune. Remorse vanishes. Nothing that does not further. No beginning, but an end. Before the change, three days. After the change, three days. Good fortune.',
      'Penetration under the bed. He loses his property and his ax. Perseverance brings misfortune.',
    ] },
  { n:58, name:'The Joyous',             ch:'Duì',       lo:'Lake',    up:'Lake',     lines:[1,1,0,1,1,0],
    judgment:'Success. Perseverance furthers.',
    image:'Lakes resting one on the other: the image of the Joyous. Thus the superior man joins with his friends for discussion and practice.',
    lineTexts:[
      'Contented joyousness. Good fortune.',
      'Sincere joyousness. Good fortune. Remorse disappears.',
      'Coming joyousness. Misfortune.',
      'Joyousness that is weighed is not at peace. After ridding himself of mistakes a man has joy.',
      'Sincerity toward disintegrating influences is dangerous.',
      'Seductive joyousness.',
    ] },
  { n:59, name:'Dispersion',             ch:'Huàn',      lo:'Water',   up:'Wind',     lines:[0,1,0,0,1,1],
    judgment:'Success. The king approaches his temple. It furthers to cross the great water. Perseverance furthers.',
    image:'The wind drives over the water: the image of Dispersion. Thus the kings of old sacrificed to the Lord and built temples.',
    lineTexts:[
      'He brings help with the strength of a horse. Good fortune.',
      'At the dissolution he hurries to that which supports him. Remorse disappears.',
      'He dissolves his self. No remorse.',
      'He dissolves his bond with his group. Supreme good fortune. Dispersion leads in turn to accumulation. This is something that ordinary men do not think of.',
      'His loud cries are as dissolving as sweat. Dissolution! A king abides without blame.',
      'He dissolves his blood. Departing, keeping at a distance, going out, is without blame.',
    ] },
  { n:60, name:'Limitation',             ch:'Jié',       lo:'Lake',    up:'Water',    lines:[1,1,0,0,1,0],
    judgment:'Success. Galling limitation must not be persevered in.',
    image:'Water over lake: the image of Limitation. Thus the superior man creates number and measure, and examines the nature of virtue and correct conduct.',
    lineTexts:[
      'Not going out of the door and the courtyard is without blame.',
      'Not going out of the gate and the courtyard brings misfortune.',
      'He who knows no limitation will have cause to lament. No blame.',
      'Contented limitation. Success.',
      'Sweet limitation brings good fortune. Going brings esteem.',
      'Galling limitation. Perseverance brings misfortune. Remorse disappears.',
    ] },
  { n:61, name:'Inner Truth',            ch:'Zhōng Fú',  lo:'Lake',    up:'Wind',     lines:[1,1,0,0,1,1],
    judgment:'Pigs and fishes. Good fortune. It furthers to cross the great water. Perseverance furthers.',
    image:'Wind over lake: the image of Inner Truth. Thus the superior man discusses criminal cases in order to delay executions.',
    lineTexts:[
      'Being prepared brings good fortune. If there are secret designs, it is disquieting.',
      'A crane calling in the shade. Its young answers it. I have a good goblet. I will share it with you.',
      'He finds a comrade. Now he beats the drum, now he stops. Now he sobs, now he sings.',
      'The moon nearly at the full. The team horse goes astray. No blame.',
      'He possesses truth, which links together. No blame.',
      'Cockcrow penetrating to heaven. Perseverance brings misfortune.',
    ] },
  { n:62, name:'Small Exceeding',        ch:'Xiǎo Guò',  lo:'Mountain', up:'Thunder', lines:[0,0,1,1,0,0],
    judgment:'Success. Perseverance furthers in small things; great things should not be done. The flying bird brings the message: it is not well to strive upward; it is well to remain below. Great good fortune.',
    image:'Thunder on the mountain: the image of Preponderance of the Small. Thus in his conduct the superior man gives preponderance to reverence. In bereavement he gives preponderance to grief. In his expenditures he gives preponderance to thrift.',
    lineTexts:[
      'The bird meets with misfortune through flying.',
      'She passes by her ancestor and meets her ancestress. He does not reach his prince and meets the official. No blame.',
      'If one is not extremely careful, somebody may come up from behind and strike him. Misfortune.',
      'No blame. He meets him without passing by. Going brings danger. One must be on guard. Do not act. Be constantly persevering.',
      'Dense clouds, no rain from our western territory. The prince shoots and hits him who is in the cave.',
      'He passes him by, not meeting him. The flying bird leaves him. Misfortune. This means bad luck and injury.',
    ] },
  { n:63, name:'After Completion',       ch:'Jì Jì',     lo:'Fire',    up:'Water',    lines:[1,0,1,0,1,0],
    judgment:'Success in small matters. Perseverance furthers. Good fortune in the beginning, disorder at the end.',
    image:'Water over fire: the image of the condition in After Completion. Thus the superior man takes thought of misfortune and arms himself against it in advance.',
    lineTexts:[
      'He brakes his wheels. He gets his tail in the water. No blame.',
      'The woman loses the curtain of her carriage. Do not run after it; on the seventh day you will get it.',
      'The Illustrious Ancestor disciplines the Devil\'s Country. After three years he conquers it. Inferior people must not be employed.',
      'The finest clothes turn to rags. Be careful all day long.',
      'The neighbor in the east who slaughters an ox does not attain as much real happiness as the neighbor in the west with his small offering.',
      'He gets his head in the water. Danger.',
    ] },
  { n:64, name:'Before Completion',      ch:'Wèi Jì',    lo:'Water',   up:'Fire',     lines:[0,1,0,1,0,1],
    judgment:'Success. But if the little fox, after nearly completing the crossing, gets his tail in the water, there is nothing that would further.',
    image:'Fire over water: the image of the condition before transition. Thus the superior man is careful in the differentiation of things, so that each finds its place.',
    lineTexts:[
      'He gets his tail in the water. Humiliating.',
      'He brakes his wheels. Perseverance brings good fortune.',
      'Before completion, attack brings misfortune. It furthers to cross the great water.',
      'Perseverance brings good fortune. Remorse disappears. Shock, thus to discipline the Devil\'s Country. For three years, great realms are awarded.',
      'Perseverance brings good fortune. No remorse. The light of the superior man is true. Good fortune.',
      'There is drinking of wine in genuine confidence. No blame. But if one wets his head, he loses it, in truth.',
    ] },
];

/* ── Lookup ──────────────────────────────────────────────────── */

const HEX_MAP = {};
HEXAGRAMS.forEach(h => { HEX_MAP[h.lines.join('')] = h; });

/** Look up a hexagram by its 6-line array (each 0 or 1, bottom→top). */
export function lookupHexagram(lines) {
  return HEX_MAP[lines.join('')] || null;
}

/* ── Structural utilities ──────────────────────────────────── */

/** Nuclear trigrams: inner lines [1..3] and [2..4] form lower/upper nuclear trigrams. */
export function nuclearTrigrams(lines) {
  const lowerLines = [lines[1], lines[2], lines[3]];
  const upperLines = [lines[2], lines[3], lines[4]];
  const lower = TRIGRAMS[trigramId(lowerLines)];
  const upper = TRIGRAMS[trigramId(upperLines)];
  const hexagram = lookupHexagram([lines[1], lines[2], lines[3], lines[2], lines[3], lines[4]]);
  return { lower, upper, hexagram };
}

/** Complement (cuò guà 錯卦): flip every line. */
export function hexagramComplement(lines) {
  return lookupHexagram(lines.map(l => l === 1 ? 0 : 1));
}

/** Inverse (zōng guà 綜卦): reverse the line order (turn upside-down). */
export function hexagramInverse(lines) {
  return lookupHexagram(lines.slice().reverse());
}

/** Fu Xi number: binary encoding, MSB = top line (index 5), LSB = bottom (index 0). */
export function fuxiNumber(lines) {
  const binary = lines.slice().reverse().join('');
  const decimal = parseInt(binary, 2);
  return { decimal, binary };
}

/** King Wen pair: inverse if not self-inverse, otherwise complement. */
export function kingWenPair(hexagram) {
  const inv = hexagramInverse(hexagram.lines);
  if (inv.n !== hexagram.n) return inv;
  return hexagramComplement(hexagram.lines);
}

/** Trigram complement: flip all three lines. */
export function trigramComplement(trigram) {
  const flipped = trigram.lines.map(l => l === 1 ? 0 : 1);
  return TRIGRAMS[trigramId(flipped)];
}

/* ── Coin-toss helpers ───────────────────────────────────────── */

/**
 * Toss 3 coins → line value.
 * Heads = 3, Tails = 2.  Sum: 6 = old yin, 7 = young yang, 8 = young yin, 9 = old yang.
 */
export function tossLine() {
  const coins = [0,0,0].map(() => Math.random() < 0.5 ? 3 : 2);
  const sum = coins[0] + coins[1] + coins[2];
  return { coins, sum };
}

/** Convert a toss sum (6-9) to the primary line value (0=yin, 1=yang). */
export function tossToLine(sum) {
  return (sum === 7 || sum === 9) ? 1 : 0;
}

/** Is the line changing? (6 = old yin changes to yang, 9 = old yang changes to yin) */
export function isChanging(sum) {
  return sum === 6 || sum === 9;
}

/** Get the changed line value (old yin → yang, old yang → yin). */
export function changedLine(sum) {
  if (sum === 6) return 1;  // old yin → yang
  if (sum === 9) return 0;  // old yang → yin
  return tossToLine(sum);   // stable — unchanged
}
