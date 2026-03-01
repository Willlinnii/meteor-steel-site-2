/**
 * I Ching — Book of Changes.
 * 8 trigrams, 64 hexagrams, coin-toss oracle.
 * King Wen sequence. Line values: 1 = yang (solid), 0 = yin (broken).
 * Lines ordered bottom → top (index 0 = bottom).
 */

export const TRIGRAMS = [
  { id: 0, name: 'Earth',    ch: 'Kūn',  symbol: '☷', attr: 'Receptive',  lines: [0,0,0] },
  { id: 1, name: 'Mountain', ch: 'Gèn',  symbol: '☶', attr: 'Stillness',  lines: [0,0,1] },
  { id: 2, name: 'Water',    ch: 'Kǎn',  symbol: '☵', attr: 'Abysmal',    lines: [0,1,0] },
  { id: 3, name: 'Wind',     ch: 'Xùn',  symbol: '☴', attr: 'Gentle',     lines: [0,1,1] },
  { id: 4, name: 'Thunder',  ch: 'Zhèn', symbol: '☳', attr: 'Arousing',   lines: [1,0,0] },
  { id: 5, name: 'Fire',     ch: 'Lí',   symbol: '☲', attr: 'Clinging',   lines: [1,0,1] },
  { id: 6, name: 'Lake',     ch: 'Duì',  symbol: '☱', attr: 'Joyous',     lines: [1,1,0] },
  { id: 7, name: 'Heaven',   ch: 'Qián', symbol: '☰', attr: 'Creative',   lines: [1,1,1] },
];

/* trigramId = line[0]*4 + line[1]*2 + line[2] (bottom, middle, top) */
export function trigramId(lines3) {
  return lines3[0] * 4 + lines3[1] * 2 + lines3[2];
}

/**
 * Each hexagram: n = King Wen number, name, ch = pinyin,
 * lo/up = lower/upper trigram name, lines = [6 values, bottom→top],
 * judgment = brief interpretive text.
 */
export const HEXAGRAMS = [
  { n:1,  name:'The Creative',           ch:'Qián',      lo:'Heaven',  up:'Heaven',   lines:[1,1,1,1,1,1], judgment:'Supreme creative power. The dragon ascends. Initiating force succeeds through perseverance. Act boldly from strength.' },
  { n:2,  name:'The Receptive',          ch:'Kūn',       lo:'Earth',   up:'Earth',    lines:[0,0,0,0,0,0], judgment:'Devoted receptivity. The mare moves freely across the earth. Follow rather than lead. Strength through yielding.' },
  { n:3,  name:'Difficulty at the Beginning', ch:'Zhūn', lo:'Thunder', up:'Water',    lines:[1,0,0,0,1,0], judgment:'Birth pains. Thunder and rain fill the air. Do not advance — gather helpers and establish order first.' },
  { n:4,  name:'Youthful Folly',         ch:'Méng',      lo:'Water',   up:'Mountain', lines:[0,1,0,0,0,1], judgment:'The young fool seeks the teacher. Water springs from beneath the mountain. Learn through experience, not force.' },
  { n:5,  name:'Waiting',                ch:'Xū',        lo:'Heaven',  up:'Water',    lines:[1,1,1,0,1,0], judgment:'Clouds rise over heaven. Nourishment comes to those who wait with sincerity. Do not force the crossing.' },
  { n:6,  name:'Conflict',               ch:'Sòng',      lo:'Water',   up:'Heaven',   lines:[0,1,0,1,1,1], judgment:'Heaven and water move in opposite directions. Meet the counselor halfway. Do not pursue the conflict to its end.' },
  { n:7,  name:'The Army',               ch:'Shī',       lo:'Water',   up:'Earth',    lines:[0,1,0,0,0,0], judgment:'Water stored within the earth — hidden power. The multitude needs discipline and a just leader. Organization prevails.' },
  { n:8,  name:'Holding Together',        ch:'Bǐ',       lo:'Earth',   up:'Water',    lines:[0,0,0,0,1,0], judgment:'Water on the earth gathers into streams. Unity through a central principle. Those who arrive late meet misfortune.' },
  { n:9,  name:'Small Taming',           ch:'Xiǎo Chù',  lo:'Heaven',  up:'Wind',     lines:[1,1,1,0,1,1], judgment:'Wind rides across heaven. The gentle restrains the strong. Small measures succeed; great ones must wait.' },
  { n:10, name:'Treading',               ch:'Lǚ',        lo:'Lake',    up:'Heaven',   lines:[1,1,0,1,1,1], judgment:'Treading on the tiger\'s tail — it does not bite. Pleasant conduct even in dangerous places brings good fortune.' },
  { n:11, name:'Peace',                  ch:'Tài',       lo:'Heaven',  up:'Earth',    lines:[1,1,1,0,0,0], judgment:'Heaven and earth unite. The small departs, the great approaches. Prosperity and harmony through proper exchange.' },
  { n:12, name:'Standstill',             ch:'Pǐ',        lo:'Earth',   up:'Heaven',   lines:[0,0,0,1,1,1], judgment:'Heaven and earth do not commune. Stagnation. The great departs, the small approaches. Withdraw and wait.' },
  { n:13, name:'Fellowship',             ch:'Tóng Rén',  lo:'Fire',    up:'Heaven',   lines:[1,0,1,1,1,1], judgment:'Fire under heaven — fellowship in the open. Unite with others in the light. Success comes through shared purpose.' },
  { n:14, name:'Great Possession',       ch:'Dà Yǒu',    lo:'Heaven',  up:'Fire',     lines:[1,1,1,1,0,1], judgment:'Fire above heaven — supreme abundance. Suppress evil and promote good. Great possession demands great responsibility.' },
  { n:15, name:'Modesty',                ch:'Qiān',      lo:'Mountain', up:'Earth',   lines:[0,0,1,0,0,0], judgment:'A mountain hidden within the earth. The modest are lifted; the proud are lowered. Balance all things through humility.' },
  { n:16, name:'Enthusiasm',             ch:'Yù',        lo:'Earth',   up:'Thunder',  lines:[0,0,0,1,0,0], judgment:'Thunder breaks from the earth in spring. Move with the natural momentum. Music and devotion stir the hearts of all.' },
  { n:17, name:'Following',              ch:'Suí',       lo:'Thunder', up:'Lake',     lines:[1,0,0,1,1,0], judgment:'Thunder within the lake — rest in the cycle. Adapt to the time. To lead, first learn to follow without resistance.' },
  { n:18, name:'Work on the Decayed',    ch:'Gǔ',        lo:'Wind',    up:'Mountain', lines:[0,1,1,0,0,1], judgment:'Wind at the foot of the mountain — decay and renewal. What has been spoiled must be repaired. Three days before, three days after.' },
  { n:19, name:'Approach',               ch:'Lín',       lo:'Lake',    up:'Earth',    lines:[1,1,0,0,0,0], judgment:'The earth above the lake — approach with generosity. The strong approaches the yielding. Teach and lead, but know the turn will come.' },
  { n:20, name:'Contemplation',          ch:'Guān',      lo:'Earth',   up:'Wind',     lines:[0,0,0,0,1,1], judgment:'Wind blows over the earth. The tower provides a wide view. Observe the meaning of things, then act from understanding.' },
  { n:21, name:'Biting Through',         ch:'Shì Hé',    lo:'Thunder', up:'Fire',     lines:[1,0,0,1,0,1], judgment:'Thunder and lightning — decisive action. An obstacle in the mouth is bitten through. Apply the law firmly and clearly.' },
  { n:22, name:'Grace',                  ch:'Bì',        lo:'Fire',    up:'Mountain', lines:[1,0,1,0,0,1], judgment:'Fire at the foot of the mountain — beauty illuminates the still. Attend to form, but do not let ornament replace substance.' },
  { n:23, name:'Splitting Apart',        ch:'Bō',        lo:'Earth',   up:'Mountain', lines:[0,0,0,0,0,1], judgment:'The mountain rests on the earth but crumbles beneath. Do not travel. Rest and wait for the cycle to turn.' },
  { n:24, name:'Return',                 ch:'Fù',        lo:'Thunder', up:'Earth',    lines:[1,0,0,0,0,0], judgment:'Thunder within the earth — the turning point. After the darkest time, light returns. The old cycle ends; the new one stirs.' },
  { n:25, name:'Innocence',              ch:'Wú Wàng',   lo:'Thunder', up:'Heaven',   lines:[1,0,0,1,1,1], judgment:'Thunder under heaven — all things move in accordance with nature. Act from genuine impulse, free of ulterior motive.' },
  { n:26, name:'Great Taming',           ch:'Dà Chù',    lo:'Heaven',  up:'Mountain', lines:[1,1,1,0,0,1], judgment:'Heaven within the mountain — great reserves of power held still. Study the past to understand the present. Restrained strength.' },
  { n:27, name:'Nourishment',            ch:'Yí',        lo:'Thunder', up:'Mountain', lines:[1,0,0,0,0,1], judgment:'The mountain over thunder — a mouth. Attend to what you take in and what you put out. Right nourishment sustains all things.' },
  { n:28, name:'Great Exceeding',        ch:'Dà Guò',    lo:'Wind',    up:'Lake',     lines:[0,1,1,1,1,0], judgment:'The lake rises above the trees — an extraordinary time. The ridgepole sags. Act boldly, for the structure cannot hold as it is.' },
  { n:29, name:'The Abysmal',            ch:'Kǎn',       lo:'Water',   up:'Water',    lines:[0,1,0,0,1,0], judgment:'Water flows on, never filling up. Danger upon danger. Maintain sincerity of heart and the way through will appear.' },
  { n:30, name:'The Clinging',           ch:'Lí',        lo:'Fire',    up:'Fire',     lines:[1,0,1,1,0,1], judgment:'Fire clings to what it burns. Brightness doubled. Care for what sustains you. Gentle persistence brings radiance.' },
  { n:31, name:'Influence',              ch:'Xián',      lo:'Mountain', up:'Lake',    lines:[0,0,1,1,1,0], judgment:'The lake on the mountain — mutual attraction. Stillness below, joy above. Open yourself to influence without grasping.' },
  { n:32, name:'Duration',               ch:'Héng',      lo:'Wind',    up:'Thunder',  lines:[0,1,1,1,0,0], judgment:'Thunder and wind strengthen each other endlessly. Persist in your direction. What endures is not rigid — it moves within its path.' },
  { n:33, name:'Retreat',                ch:'Dùn',       lo:'Mountain', up:'Heaven',  lines:[0,0,1,1,1,1], judgment:'The mountain under heaven — withdraw at the right time. Retreat is not defeat. The strong knows when to yield ground.' },
  { n:34, name:'Great Power',            ch:'Dà Zhuàng', lo:'Heaven',  up:'Thunder',  lines:[1,1,1,1,0,0], judgment:'Thunder above heaven — tremendous force. Power must be guided by what is right. Strength without justice overreaches.' },
  { n:35, name:'Progress',               ch:'Jìn',       lo:'Earth',   up:'Fire',     lines:[0,0,0,1,0,1], judgment:'The sun rises over the earth — steady advance. The prince is honored with horses. Clarity rises naturally from devotion.' },
  { n:36, name:'Darkening of the Light', ch:'Míng Yí',   lo:'Fire',    up:'Earth',    lines:[1,0,1,0,0,0], judgment:'The light sinks into the earth. Conceal your brightness in times of darkness. Persevere inwardly while yielding outwardly.' },
  { n:37, name:'The Family',             ch:'Jiā Rén',   lo:'Fire',    up:'Wind',     lines:[1,0,1,0,1,1], judgment:'Wind arises from fire — influence radiates outward from the hearth. Words must carry weight. Set the inner world in order.' },
  { n:38, name:'Opposition',             ch:'Kuí',       lo:'Lake',    up:'Fire',     lines:[1,1,0,1,0,1], judgment:'Fire above, lake below — they move apart. In opposition, small tasks can still be accomplished. Seek unity in the differences.' },
  { n:39, name:'Obstruction',            ch:'Jiǎn',      lo:'Mountain', up:'Water',   lines:[0,0,1,0,1,0], judgment:'Water on the mountain — danger ahead. Turn back and examine yourself. The obstruction teaches where true strength lies.' },
  { n:40, name:'Deliverance',            ch:'Jiě',       lo:'Water',   up:'Thunder',  lines:[0,1,0,1,0,0], judgment:'Thunder and rain clear the air. Tension releases. Forgive transgressions and return to the ordinary. Swift resolution brings peace.' },
  { n:41, name:'Decrease',               ch:'Sǔn',       lo:'Lake',    up:'Mountain', lines:[1,1,0,0,0,1], judgment:'The lake at the foot of the mountain — what is below decreases, what is above increases. Sincere sacrifice brings supreme good fortune.' },
  { n:42, name:'Increase',               ch:'Yì',        lo:'Thunder', up:'Wind',     lines:[1,0,0,0,1,1], judgment:'Wind and thunder — increase through movement. Cross the great water. When those above give to those below, all prosper.' },
  { n:43, name:'Breakthrough',           ch:'Guài',      lo:'Heaven',  up:'Lake',     lines:[1,1,1,1,1,0], judgment:'The lake has risen to heaven — the dam must break. Proclaim the truth resolutely but not with violence. One yin remains.' },
  { n:44, name:'Coming to Meet',         ch:'Gòu',       lo:'Wind',    up:'Heaven',   lines:[0,1,1,1,1,1], judgment:'Wind under heaven — the dark principle returns unexpectedly. Do not marry this maiden. Recognize what approaches before it takes hold.' },
  { n:45, name:'Gathering Together',     ch:'Cuì',       lo:'Earth',   up:'Lake',     lines:[0,0,0,1,1,0], judgment:'The lake gathers above the earth. Bring offerings to the temple. People unite under what they revere. Be prepared for the unexpected.' },
  { n:46, name:'Pushing Upward',         ch:'Shēng',     lo:'Wind',    up:'Earth',    lines:[0,1,1,0,0,0], judgment:'Wood grows within the earth — upward movement. The devoted one rises steadily. No anxiety — see the great person and push southward.' },
  { n:47, name:'Oppression',             ch:'Kùn',       lo:'Water',   up:'Lake',     lines:[0,1,0,1,1,0], judgment:'The lake has no water — exhaustion. Words are not believed. In the depths of oppression, the resolute person finds their fate and does not lose their cheerfulness.' },
  { n:48, name:'The Well',               ch:'Jǐng',      lo:'Wind',    up:'Water',    lines:[0,1,1,0,1,0], judgment:'Water over wood — the well. The town may change, but the well remains. Draw from the deep source. Do not let the rope fall short.' },
  { n:49, name:'Revolution',             ch:'Gé',        lo:'Fire',    up:'Lake',     lines:[1,0,1,1,1,0], judgment:'Fire within the lake — transformation. The calendar is reformed. When the time is right, revolution succeeds. Remove the old, establish the new.' },
  { n:50, name:'The Cauldron',           ch:'Dǐng',      lo:'Wind',    up:'Fire',     lines:[0,1,1,1,0,1], judgment:'Fire over wood — the sacrificial vessel. Nourish the worthy and present offerings. Supreme good fortune through service to the highest.' },
  { n:51, name:'The Arousing',           ch:'Zhèn',      lo:'Thunder', up:'Thunder',  lines:[1,0,0,1,0,0], judgment:'Repeated thunder — shock. The shock comes, then laughter. Fear leads to reflection, reflection to care. Do not drop the sacrificial spoon.' },
  { n:52, name:'Keeping Still',          ch:'Gèn',       lo:'Mountain', up:'Mountain', lines:[0,0,1,0,0,1], judgment:'Mountains standing together — absolute stillness. Still the mind until it no longer races ahead. Rest the back; do not grasp. No blame.' },
  { n:53, name:'Development',            ch:'Jiàn',      lo:'Mountain', up:'Wind',    lines:[0,0,1,0,1,1], judgment:'A tree on the mountain grows slowly but stands firm. Gradual progress. The maiden is given in marriage — step by step, in good order.' },
  { n:54, name:'The Marrying Maiden',    ch:'Guī Mèi',   lo:'Lake',    up:'Thunder',  lines:[1,1,0,1,0,0], judgment:'Thunder over the lake — strong feeling moves outward. Undertakings bring misfortune. Know your position and act accordingly.' },
  { n:55, name:'Abundance',              ch:'Fēng',      lo:'Fire',    up:'Thunder',  lines:[1,0,1,1,0,0], judgment:'Thunder and lightning together — fullness. The zenith does not last. Be like the sun at midday — illuminate all things without grief for the turning.' },
  { n:56, name:'The Wanderer',           ch:'Lǚ',        lo:'Mountain', up:'Fire',    lines:[0,0,1,1,0,1], judgment:'Fire on the mountain — the traveler. Be cautious and do not linger. Small successes. The wanderer\'s perseverance brings good fortune through humility.' },
  { n:57, name:'The Gentle',             ch:'Xùn',       lo:'Wind',    up:'Wind',     lines:[0,1,1,0,1,1], judgment:'Winds follow one upon the other — gentle penetration. Quiet persistence achieves what force cannot. See the great person. Small offerings.' },
  { n:58, name:'The Joyous',             ch:'Duì',       lo:'Lake',    up:'Lake',     lines:[1,1,0,1,1,0], judgment:'Lakes resting one on the other — shared joy. Friends discuss and practice together. True joy is not pleasure alone but the delight of the way.' },
  { n:59, name:'Dispersion',             ch:'Huàn',      lo:'Water',   up:'Wind',     lines:[0,1,0,0,1,1], judgment:'Wind blows over the water — dissolving. The king approaches the temple. What separates must be dissolved through devotion and shared purpose.' },
  { n:60, name:'Limitation',             ch:'Jié',       lo:'Lake',    up:'Water',    lines:[1,1,0,0,1,0], judgment:'Water above the lake — the lake has limits. Sweet limitation frees the spirit. Bitter limitation must not be persevered in.' },
  { n:61, name:'Inner Truth',            ch:'Zhōng Fú',  lo:'Lake',    up:'Wind',     lines:[1,1,0,0,1,1], judgment:'Wind over the lake stirs the surface — inner truth reaches outward. Even pigs and fishes are moved. Cross the great water with sincerity.' },
  { n:62, name:'Small Exceeding',        ch:'Xiǎo Guò',  lo:'Mountain', up:'Thunder', lines:[0,0,1,1,0,0], judgment:'Thunder on the mountain — the small exceeds. The flying bird leaves a message. Do not strive upward, strive downward. Humility in small matters.' },
  { n:63, name:'After Completion',       ch:'Jì Jì',     lo:'Fire',    up:'Water',    lines:[1,0,1,0,1,0], judgment:'Water over fire — everything in its place. Success in small matters. The fox crosses the stream; if it wets its tail, nothing furthers.' },
  { n:64, name:'Before Completion',      ch:'Wèi Jì',    lo:'Water',   up:'Fire',     lines:[0,1,0,1,0,1], judgment:'Fire over water — not yet across. The young fox nearly completes the crossing. Order is emerging but not yet achieved. Care and patience.' },
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
