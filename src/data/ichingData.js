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
    image:'The movement of heaven is full of power. Thus the superior man makes himself strong and untiring.' },
  { n:2,  name:'The Receptive',          ch:'Kūn',       lo:'Earth',   up:'Earth',    lines:[0,0,0,0,0,0],
    judgment:'Sublime success through the perseverance of a mare. If the superior man undertakes something and tries to lead, he goes astray; if he follows, he finds guidance. Friends in the southwest; losing friends in the northeast. Quiet perseverance brings good fortune.',
    image:'The earth\'s condition is receptive devotion. Thus the superior man who has breadth of character carries the outer world.' },
  { n:3,  name:'Difficulty at the Beginning', ch:'Zhūn', lo:'Thunder', up:'Water',    lines:[1,0,0,0,1,0],
    judgment:'Sublime success. Furthering through perseverance. Nothing should be undertaken. It furthers to appoint helpers.',
    image:'Clouds and thunder: the image of Difficulty at the Beginning. Thus the superior man brings order out of confusion.' },
  { n:4,  name:'Youthful Folly',         ch:'Méng',      lo:'Water',   up:'Mountain', lines:[0,1,0,0,0,1],
    judgment:'Success. It is not I who seek the young fool; the young fool seeks me. At the first oracle I inform him. If he asks two or three times, it is importunity; I give no information to the importunate. Perseverance furthers.',
    image:'A spring wells up at the foot of the mountain: the image of Youth. Thus the superior man fosters his character by thoroughness in all that he does.' },
  { n:5,  name:'Waiting',                ch:'Xū',        lo:'Heaven',  up:'Water',    lines:[1,1,1,0,1,0],
    judgment:'With sincerity, brilliant success. Perseverance brings good fortune. It furthers to cross the great water.',
    image:'Clouds rise up to heaven: the image of Waiting. Thus the superior man eats and drinks, is joyous and of good cheer.' },
  { n:6,  name:'Conflict',               ch:'Sòng',      lo:'Water',   up:'Heaven',   lines:[0,1,0,1,1,1],
    judgment:'Sincerity is obstructed. A cautious halt halfway brings good fortune. Going through to the end brings misfortune. It furthers to see the great man. It does not further to cross the great water.',
    image:'Heaven and water go their opposite ways: the image of Conflict. Thus in all his transactions the superior man carefully considers the beginning.' },
  { n:7,  name:'The Army',               ch:'Shī',       lo:'Water',   up:'Earth',    lines:[0,1,0,0,0,0],
    judgment:'The army needs perseverance and a strong man. Good fortune without blame.',
    image:'In the middle of the earth is water: the image of the Army. Thus the superior man increases his masses by generosity toward the people.' },
  { n:8,  name:'Holding Together',        ch:'Bǐ',       lo:'Earth',   up:'Water',    lines:[0,0,0,0,1,0],
    judgment:'Good fortune. Inquire of the oracle whether you possess sublimity, constancy, and perseverance; then there is no blame. Those who are uncertain gradually join. Whoever comes too late meets with misfortune.',
    image:'On the earth is water: the image of Holding Together. Thus the kings of antiquity bestowed the different states as fiefs and cultivated friendly relations with the feudal lords.' },
  { n:9,  name:'Small Taming',           ch:'Xiǎo Chù',  lo:'Heaven',  up:'Wind',     lines:[1,1,1,0,1,1],
    judgment:'Success. Dense clouds, no rain from our western region.',
    image:'The wind drives across heaven: the image of the Taming Power of the Small. Thus the superior man refines the outward aspect of his nature.' },
  { n:10, name:'Treading',               ch:'Lǚ',        lo:'Lake',    up:'Heaven',   lines:[1,1,0,1,1,1],
    judgment:'Treading upon the tail of the tiger. It does not bite the man. Success.',
    image:'Heaven above, the lake below: the image of Treading. Thus the superior man discriminates between high and low, and thereby fortifies the thinking of the people.' },
  { n:11, name:'Peace',                  ch:'Tài',       lo:'Heaven',  up:'Earth',    lines:[1,1,1,0,0,0],
    judgment:'The small departs, the great approaches. Good fortune. Success.',
    image:'Heaven and earth unite: the image of Peace. Thus the ruler divides and completes the course of heaven and earth, furthers and regulates the gifts of heaven and earth, and so aids the people.' },
  { n:12, name:'Standstill',             ch:'Pǐ',        lo:'Earth',   up:'Heaven',   lines:[0,0,0,1,1,1],
    judgment:'The great departs, the small approaches. Unfavorable for the perseverance of the superior man.',
    image:'Heaven and earth do not unite: the image of Standstill. Thus the superior man falls back upon his inner worth in order to escape the difficulties. He does not permit himself to be honored with revenue.' },
  { n:13, name:'Fellowship',             ch:'Tóng Rén',  lo:'Fire',    up:'Heaven',   lines:[1,0,1,1,1,1],
    judgment:'Fellowship with men in the open. Success. It furthers to cross the great water. The perseverance of the superior man furthers.',
    image:'Heaven together with fire: the image of Fellowship with Men. Thus the superior man organizes the clans and makes distinctions between things.' },
  { n:14, name:'Great Possession',       ch:'Dà Yǒu',    lo:'Heaven',  up:'Fire',     lines:[1,1,1,1,0,1],
    judgment:'Supreme success.',
    image:'Fire in heaven above: the image of Possession in Great Measure. Thus the superior man curbs evil and furthers good, and thereby obeys the benevolent will of heaven.' },
  { n:15, name:'Modesty',                ch:'Qiān',      lo:'Mountain', up:'Earth',   lines:[0,0,1,0,0,0],
    judgment:'Success. The superior man carries things through to completion.',
    image:'Within the earth, a mountain: the image of Modesty. Thus the superior man reduces that which is too much, and augments that which is too little. He weighs things and makes them equal.' },
  { n:16, name:'Enthusiasm',             ch:'Yù',        lo:'Earth',   up:'Thunder',  lines:[0,0,0,1,0,0],
    judgment:'It furthers to install helpers and to set armies marching.',
    image:'Thunder comes resounding out of the earth: the image of Enthusiasm. Thus the ancient kings made music in order to honor merit, and offered it with splendor to the Supreme Deity.' },
  { n:17, name:'Following',              ch:'Suí',       lo:'Thunder', up:'Lake',     lines:[1,0,0,1,1,0],
    judgment:'Supreme success. Perseverance furthers. No blame.',
    image:'Thunder in the middle of the lake: the image of Following. Thus the superior man at nightfall goes indoors for rest and recuperation.' },
  { n:18, name:'Work on the Decayed',    ch:'Gǔ',        lo:'Wind',    up:'Mountain', lines:[0,1,1,0,0,1],
    judgment:'Supreme success. It furthers to cross the great water. Before the starting point, three days. After the starting point, three days.',
    image:'The wind blows low on the mountain: the image of Decay. Thus the superior man stirs up the people and strengthens their spirit.' },
  { n:19, name:'Approach',               ch:'Lín',       lo:'Lake',    up:'Earth',    lines:[1,1,0,0,0,0],
    judgment:'Supreme success. Perseverance furthers. When the eighth month comes, there will be misfortune.',
    image:'The earth above the lake: the image of Approach. Thus the superior man is inexhaustible in his will to teach, and without limits in his tolerance and protection of the people.' },
  { n:20, name:'Contemplation',          ch:'Guān',      lo:'Earth',   up:'Wind',     lines:[0,0,0,0,1,1],
    judgment:'The ablution has been made, but not yet the offering. Full of trust, they look up.',
    image:'The wind blows over the earth: the image of Contemplation. Thus the kings of old visited the regions of the world, contemplated the people, and gave them instruction.' },
  { n:21, name:'Biting Through',         ch:'Shì Hé',    lo:'Thunder', up:'Fire',     lines:[1,0,0,1,0,1],
    judgment:'Success. It furthers to administer justice.',
    image:'Thunder and lightning: the image of Biting Through. Thus the kings of former times made firm the laws through clearly defined penalties.' },
  { n:22, name:'Grace',                  ch:'Bì',        lo:'Fire',    up:'Mountain', lines:[1,0,1,0,0,1],
    judgment:'Success. In small matters it furthers to undertake something.',
    image:'Fire at the foot of the mountain: the image of Grace. Thus does the superior man proceed when clearing up current affairs. But he dare not decide controversial issues in this way.' },
  { n:23, name:'Splitting Apart',        ch:'Bō',        lo:'Earth',   up:'Mountain', lines:[0,0,0,0,0,1],
    judgment:'It does not further to go anywhere.',
    image:'The mountain rests on the earth: the image of Splitting Apart. Thus those above can ensure their position only by giving generously to those below.' },
  { n:24, name:'Return',                 ch:'Fù',        lo:'Thunder', up:'Earth',    lines:[1,0,0,0,0,0],
    judgment:'Success. Going out and coming in without error. Friends come without blame. The way turns and returns; it comes back after seven days. It furthers to have somewhere to go.',
    image:'Thunder within the earth: the image of the Turning Point. Thus the kings of antiquity closed the passes at the time of solstice. Merchants and strangers did not go about, and the ruler did not travel through the provinces.' },
  { n:25, name:'Innocence',              ch:'Wú Wàng',   lo:'Thunder', up:'Heaven',   lines:[1,0,0,1,1,1],
    judgment:'Supreme success. Perseverance furthers. If someone is not as he should be, he has misfortune, and it does not further to undertake anything.',
    image:'Under heaven thunder rolls: all things attain the natural state of innocence. Thus the kings of old, rich in virtue and in harmony with the time, fostered and nourished all beings.' },
  { n:26, name:'Great Taming',           ch:'Dà Chù',    lo:'Heaven',  up:'Mountain', lines:[1,1,1,0,0,1],
    judgment:'Perseverance furthers. Not eating at home brings good fortune. It furthers to cross the great water.',
    image:'Heaven within the mountain: the image of the Taming Power of the Great. Thus the superior man acquaints himself with many sayings of antiquity and many deeds of the past, in order to strengthen his character thereby.' },
  { n:27, name:'Nourishment',            ch:'Yí',        lo:'Thunder', up:'Mountain', lines:[1,0,0,0,0,1],
    judgment:'Perseverance brings good fortune. Attend to the providing of nourishment, and to what a man seeks to fill his own mouth with.',
    image:'At the foot of the mountain, thunder: the image of Providing Nourishment. Thus the superior man is careful of his words and temperate in eating and drinking.' },
  { n:28, name:'Great Exceeding',        ch:'Dà Guò',    lo:'Wind',    up:'Lake',     lines:[0,1,1,1,1,0],
    judgment:'The ridgepole sags. It furthers to have somewhere to go. Success.',
    image:'The lake rises above the trees: the image of Preponderance of the Great. Thus the superior man, when he stands alone, is unconcerned, and if he has to renounce the world, he is undaunted.' },
  { n:29, name:'The Abysmal',            ch:'Kǎn',       lo:'Water',   up:'Water',    lines:[0,1,0,0,1,0],
    judgment:'Repeated danger. If you are sincere, you have success in your heart, and whatever you do succeeds.',
    image:'Water flows on and reaches the goal: the image of the Abysmal repeated. Thus the superior man walks in lasting virtue and carries on the business of teaching.' },
  { n:30, name:'The Clinging',           ch:'Lí',        lo:'Fire',    up:'Fire',     lines:[1,0,1,1,0,1],
    judgment:'Perseverance furthers. Success. Care of the cow brings good fortune.',
    image:'That which is bright rises twice: the image of Fire. Thus the great man, by perpetuating this brightness, illumines the four quarters of the world.' },
  { n:31, name:'Influence',              ch:'Xián',      lo:'Mountain', up:'Lake',    lines:[0,0,1,1,1,0],
    judgment:'Success. Perseverance furthers. To take a maiden to wife brings good fortune.',
    image:'A lake on the mountain: the image of Influence. Thus the superior man encourages people to approach him by his readiness to receive them.' },
  { n:32, name:'Duration',               ch:'Héng',      lo:'Wind',    up:'Thunder',  lines:[0,1,1,1,0,0],
    judgment:'Success. No blame. Perseverance furthers. It furthers to have somewhere to go.',
    image:'Thunder and wind: the image of Duration. Thus the superior man stands firm and does not change his direction.' },
  { n:33, name:'Retreat',                ch:'Dùn',       lo:'Mountain', up:'Heaven',  lines:[0,0,1,1,1,1],
    judgment:'Success. In what is small, perseverance furthers.',
    image:'Mountain under heaven: the image of Retreat. Thus the superior man keeps the inferior man at a distance, not angrily but with reserve.' },
  { n:34, name:'Great Power',            ch:'Dà Zhuàng', lo:'Heaven',  up:'Thunder',  lines:[1,1,1,1,0,0],
    judgment:'Perseverance furthers.',
    image:'Thunder in heaven above: the image of the Power of the Great. Thus the superior man does not tread upon paths that do not accord with established order.' },
  { n:35, name:'Progress',               ch:'Jìn',       lo:'Earth',   up:'Fire',     lines:[0,0,0,1,0,1],
    judgment:'The powerful prince is honored with horses in large numbers. In a single day he is granted audience three times.',
    image:'The sun rises over the earth: the image of Progress. Thus the superior man himself brightens his bright virtue.' },
  { n:36, name:'Darkening of the Light', ch:'Míng Yí',   lo:'Fire',    up:'Earth',    lines:[1,0,1,0,0,0],
    judgment:'In adversity it furthers to be persevering.',
    image:'The light has sunk into the earth: the image of Darkening of the Light. Thus does the superior man live with the great mass: he veils his light, yet still shines.' },
  { n:37, name:'The Family',             ch:'Jiā Rén',   lo:'Fire',    up:'Wind',     lines:[1,0,1,0,1,1],
    judgment:'The perseverance of the woman furthers.',
    image:'Wind comes forth from fire: the image of the Family. Thus the superior man has substance in his words and duration in his way of life.' },
  { n:38, name:'Opposition',             ch:'Kuí',       lo:'Lake',    up:'Fire',     lines:[1,1,0,1,0,1],
    judgment:'In small matters, good fortune.',
    image:'Above, fire; below, the lake: the image of Opposition. Thus amid all fellowship the superior man retains his individuality.' },
  { n:39, name:'Obstruction',            ch:'Jiǎn',      lo:'Mountain', up:'Water',   lines:[0,0,1,0,1,0],
    judgment:'The southwest furthers. The northeast does not further. It furthers to see the great man. Perseverance brings good fortune.',
    image:'Water on the mountain: the image of Obstruction. Thus the superior man turns his attention to himself and molds his character.' },
  { n:40, name:'Deliverance',            ch:'Jiě',       lo:'Water',   up:'Thunder',  lines:[0,1,0,1,0,0],
    judgment:'The southwest furthers. If there is no longer anything where one has to go, return brings good fortune. If there is still something where one has to go, hastening brings good fortune.',
    image:'Thunder and rain set in: the image of Deliverance. Thus the superior man pardons mistakes and forgives misdeeds.' },
  { n:41, name:'Decrease',               ch:'Sǔn',       lo:'Lake',    up:'Mountain', lines:[1,1,0,0,0,1],
    judgment:'With sincerity, supreme good fortune without blame. One may be persevering. It furthers to undertake something. How is this to be carried out? Two small bowls may be used for the sacrifice.',
    image:'At the foot of the mountain, the lake: the image of Decrease. Thus the superior man controls his anger and restrains his instincts.' },
  { n:42, name:'Increase',               ch:'Yì',        lo:'Thunder', up:'Wind',     lines:[1,0,0,0,1,1],
    judgment:'It furthers to undertake something. It furthers to cross the great water.',
    image:'Wind and thunder: the image of Increase. Thus the superior man: if he sees good, he imitates it; if he has faults, he rids himself of them.' },
  { n:43, name:'Breakthrough',           ch:'Guài',      lo:'Heaven',  up:'Lake',     lines:[1,1,1,1,1,0],
    judgment:'One must resolutely make the matter known at the court of the king. It must be announced truthfully. Danger. It is necessary to notify one\'s own city. It does not further to resort to arms. It furthers to undertake something.',
    image:'The lake has risen up to heaven: the image of Breakthrough. Thus the superior man dispenses riches downward and refrains from resting on his virtue.' },
  { n:44, name:'Coming to Meet',         ch:'Gòu',       lo:'Wind',    up:'Heaven',   lines:[0,1,1,1,1,1],
    judgment:'The maiden is powerful. One should not marry such a maiden.',
    image:'Under heaven, wind: the image of Coming to Meet. Thus does the prince act when disseminating his commands and proclaiming them to the four quarters of heaven.' },
  { n:45, name:'Gathering Together',     ch:'Cuì',       lo:'Earth',   up:'Lake',     lines:[0,0,0,1,1,0],
    judgment:'Success. The king approaches his temple. It furthers to see the great man; this brings success. Perseverance furthers. To bring great offerings creates good fortune. It furthers to undertake something.',
    image:'Over the earth, the lake: the image of Gathering Together. Thus the superior man renews his weapons in order to meet the unforeseen.' },
  { n:46, name:'Pushing Upward',         ch:'Shēng',     lo:'Wind',    up:'Earth',    lines:[0,1,1,0,0,0],
    judgment:'Supreme success. One must see the great man. Fear not. Departure toward the south brings good fortune.',
    image:'Within the earth, wood grows: the image of Pushing Upward. Thus the superior man of devoted character heaps up small things in order to achieve something high and great.' },
  { n:47, name:'Oppression',             ch:'Kùn',       lo:'Water',   up:'Lake',     lines:[0,1,0,1,1,0],
    judgment:'Success. Perseverance. The great man brings about good fortune. No blame. When one has something to say, it is not believed.',
    image:'There is no water in the lake: the image of Exhaustion. Thus the superior man stakes his life on following his will.' },
  { n:48, name:'The Well',               ch:'Jǐng',      lo:'Wind',    up:'Water',    lines:[0,1,1,0,1,0],
    judgment:'The town may be changed, but the well cannot be changed. It neither decreases nor increases. They come and go and draw from the well. If one gets down almost to the water and the rope does not go all the way, or the jug breaks, it brings misfortune.',
    image:'Water over wood: the image of the Well. Thus the superior man encourages the people at their work, and exhorts them to help one another.' },
  { n:49, name:'Revolution',             ch:'Gé',        lo:'Fire',    up:'Lake',     lines:[1,0,1,1,1,0],
    judgment:'On your own day you are believed. Supreme success, furthering through perseverance. Remorse disappears.',
    image:'Fire in the lake: the image of Revolution. Thus the superior man sets the calendar in order and makes the seasons clear.' },
  { n:50, name:'The Cauldron',           ch:'Dǐng',      lo:'Wind',    up:'Fire',     lines:[0,1,1,1,0,1],
    judgment:'Supreme good fortune. Success.',
    image:'Fire over wood: the image of the Cauldron. Thus the superior man consolidates his fate by making his position correct.' },
  { n:51, name:'The Arousing',           ch:'Zhèn',      lo:'Thunder', up:'Thunder',  lines:[1,0,0,1,0,0],
    judgment:'Success. The shock comes — oh, oh! Laughing words — ha, ha! The shock terrifies for a hundred miles, and he does not let fall the sacrificial spoon and chalice.',
    image:'Thunder repeated: the image of Shock. Thus in fear and trembling the superior man sets his life in order and examines himself.' },
  { n:52, name:'Keeping Still',          ch:'Gèn',       lo:'Mountain', up:'Mountain', lines:[0,0,1,0,0,1],
    judgment:'Keeping his back so still that he no longer feels his body. He goes into his courtyard and does not see his people. No blame.',
    image:'Mountains standing close together: the image of Keeping Still. Thus the superior man does not permit his thoughts to go beyond his situation.' },
  { n:53, name:'Development',            ch:'Jiàn',      lo:'Mountain', up:'Wind',    lines:[0,0,1,0,1,1],
    judgment:'The maiden is given in marriage. Good fortune. Perseverance furthers.',
    image:'On the mountain, a tree: the image of Development. Thus the superior man abides in dignity and virtue, in order to improve the mores.' },
  { n:54, name:'The Marrying Maiden',    ch:'Guī Mèi',   lo:'Lake',    up:'Thunder',  lines:[1,1,0,1,0,0],
    judgment:'Undertakings bring misfortune. Nothing that would further.',
    image:'Thunder over the lake: the image of the Marrying Maiden. Thus the superior man understands the transitory in the light of the eternity of the end.' },
  { n:55, name:'Abundance',              ch:'Fēng',      lo:'Fire',    up:'Thunder',  lines:[1,0,1,1,0,0],
    judgment:'Success. The king attains abundance. Be not sad. Be like the sun at midday.',
    image:'Both thunder and lightning come: the image of Abundance. Thus the superior man decides lawsuits and carries out punishments.' },
  { n:56, name:'The Wanderer',           ch:'Lǚ',        lo:'Mountain', up:'Fire',    lines:[0,0,1,1,0,1],
    judgment:'Success through smallness. Perseverance brings good fortune to the wanderer.',
    image:'Fire on the mountain: the image of the Wanderer. Thus the superior man is clear-minded and cautious in imposing penalties, and protracts no lawsuits.' },
  { n:57, name:'The Gentle',             ch:'Xùn',       lo:'Wind',    up:'Wind',     lines:[0,1,1,0,1,1],
    judgment:'Success through what is small. It furthers to have somewhere to go. It furthers to see the great man.',
    image:'Winds following one upon the other: the image of the Gently Penetrating. Thus the superior man spreads his commands abroad and carries out his undertakings.' },
  { n:58, name:'The Joyous',             ch:'Duì',       lo:'Lake',    up:'Lake',     lines:[1,1,0,1,1,0],
    judgment:'Success. Perseverance furthers.',
    image:'Lakes resting one on the other: the image of the Joyous. Thus the superior man joins with his friends for discussion and practice.' },
  { n:59, name:'Dispersion',             ch:'Huàn',      lo:'Water',   up:'Wind',     lines:[0,1,0,0,1,1],
    judgment:'Success. The king approaches his temple. It furthers to cross the great water. Perseverance furthers.',
    image:'The wind drives over the water: the image of Dispersion. Thus the kings of old sacrificed to the Lord and built temples.' },
  { n:60, name:'Limitation',             ch:'Jié',       lo:'Lake',    up:'Water',    lines:[1,1,0,0,1,0],
    judgment:'Success. Galling limitation must not be persevered in.',
    image:'Water over lake: the image of Limitation. Thus the superior man creates number and measure, and examines the nature of virtue and correct conduct.' },
  { n:61, name:'Inner Truth',            ch:'Zhōng Fú',  lo:'Lake',    up:'Wind',     lines:[1,1,0,0,1,1],
    judgment:'Pigs and fishes. Good fortune. It furthers to cross the great water. Perseverance furthers.',
    image:'Wind over lake: the image of Inner Truth. Thus the superior man discusses criminal cases in order to delay executions.' },
  { n:62, name:'Small Exceeding',        ch:'Xiǎo Guò',  lo:'Mountain', up:'Thunder', lines:[0,0,1,1,0,0],
    judgment:'Success. Perseverance furthers in small things; great things should not be done. The flying bird brings the message: it is not well to strive upward; it is well to remain below. Great good fortune.',
    image:'Thunder on the mountain: the image of Preponderance of the Small. Thus in his conduct the superior man gives preponderance to reverence. In bereavement he gives preponderance to grief. In his expenditures he gives preponderance to thrift.' },
  { n:63, name:'After Completion',       ch:'Jì Jì',     lo:'Fire',    up:'Water',    lines:[1,0,1,0,1,0],
    judgment:'Success in small matters. Perseverance furthers. Good fortune in the beginning, disorder at the end.',
    image:'Water over fire: the image of the condition in After Completion. Thus the superior man takes thought of misfortune and arms himself against it in advance.' },
  { n:64, name:'Before Completion',      ch:'Wèi Jì',    lo:'Water',   up:'Fire',     lines:[0,1,0,1,0,1],
    judgment:'Success. But if the little fox, after nearly completing the crossing, gets his tail in the water, there is nothing that would further.',
    image:'Fire over water: the image of the condition before transition. Thus the superior man is careful in the differentiation of things, so that each finds its place.' },
];

/* ── Lookup ──────────────────────────────────────────────────── */

const HEX_MAP = {};
HEXAGRAMS.forEach(h => { HEX_MAP[h.lines.join('')] = h; });

/** Look up a hexagram by its 6-line array (each 0 or 1, bottom→top). */
export function lookupHexagram(lines) {
  return HEX_MAP[lines.join('')] || null;
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
