const { getZodiacSign, getMonth, getMonthHolidays } = require('./DataBridge');

// Campaign month definitions: zodiac order with cultural layering
const CAMPAIGN_MONTHS = [
  { num: 1,  sign: 'Aries',       calMonth: 'March',     startDate: 'Mar 21', endDate: 'Apr 19', cultures: ['roman', 'greek'] },
  { num: 2,  sign: 'Taurus',      calMonth: 'April',     startDate: 'Apr 20', endDate: 'May 20', cultures: ['roman', 'greek', 'babylonian'] },
  { num: 3,  sign: 'Gemini',      calMonth: 'May',       startDate: 'May 21', endDate: 'Jun 20', cultures: ['roman', 'greek', 'babylonian', 'vedic'] },
  { num: 4,  sign: 'Cancer',      calMonth: 'June',      startDate: 'Jun 21', endDate: 'Jul 22', cultures: ['roman', 'greek', 'babylonian', 'vedic', 'norse'] },
  { num: 5,  sign: 'Leo',         calMonth: 'July',      startDate: 'Jul 23', endDate: 'Aug 22', cultures: ['roman', 'greek', 'babylonian', 'vedic', 'norse', 'islamic'] },
  { num: 6,  sign: 'Virgo',       calMonth: 'August',    startDate: 'Aug 23', endDate: 'Sep 22', cultures: ['roman', 'greek', 'babylonian', 'vedic', 'norse', 'islamic', 'medieval'] },
  { num: 7,  sign: 'Libra',       calMonth: 'September', startDate: 'Sep 23', endDate: 'Oct 22', cultures: ['roman', 'greek', 'babylonian', 'vedic', 'norse', 'islamic', 'medieval'] },
  { num: 8,  sign: 'Scorpio',     calMonth: 'October',   startDate: 'Oct 23', endDate: 'Nov 21', cultures: ['roman', 'greek', 'babylonian', 'vedic', 'norse', 'islamic', 'medieval'] },
  { num: 9,  sign: 'Sagittarius', calMonth: 'November',  startDate: 'Nov 22', endDate: 'Dec 21', cultures: ['roman', 'greek', 'babylonian', 'vedic', 'norse', 'islamic', 'medieval'] },
  { num: 10, sign: 'Capricorn',   calMonth: 'December',  startDate: 'Dec 22', endDate: 'Jan 19', cultures: ['roman', 'greek', 'babylonian', 'vedic', 'norse', 'islamic', 'medieval'] },
  { num: 11, sign: 'Aquarius',    calMonth: 'January',   startDate: 'Jan 20', endDate: 'Feb 18', cultures: ['roman', 'greek', 'babylonian', 'vedic', 'norse', 'islamic', 'medieval'] },
  { num: 12, sign: 'Pisces',      calMonth: 'February',  startDate: 'Feb 19', endDate: 'Mar 20', cultures: ['roman', 'greek', 'babylonian', 'vedic', 'norse', 'islamic', 'medieval'] },
];

const CULTURE_LABELS = {
  roman: 'Roman', greek: 'Greek', babylonian: 'Babylonian',
  vedic: 'Vedic', norse: 'Norse', islamic: 'Islamic', medieval: 'Medieval',
};

const BASE_HASHTAGS = ['#MythicYear', '#CelestialClocks', '#MeteorSteel', '#Mythology', '#Zodiac', '#AncientWisdom'];

const SIGN_HASHTAGS = {
  Aries: ['#Aries', '#AriesSeason', '#FireSign'],
  Taurus: ['#Taurus', '#TaurusSeason', '#EarthSign'],
  Gemini: ['#Gemini', '#GeminiSeason', '#AirSign'],
  Cancer: ['#Cancer', '#CancerSeason', '#WaterSign'],
  Leo: ['#Leo', '#LeoSeason', '#FireSign'],
  Virgo: ['#Virgo', '#VirgoSeason', '#EarthSign'],
  Libra: ['#Libra', '#LibraSeason', '#AirSign'],
  Scorpio: ['#Scorpio', '#ScorpioSeason', '#WaterSign'],
  Sagittarius: ['#Sagittarius', '#SagittariusSeason', '#FireSign'],
  Capricorn: ['#Capricorn', '#CapricornSeason', '#EarthSign'],
  Aquarius: ['#Aquarius', '#AquariusSeason', '#AirSign'],
  Pisces: ['#Pisces', '#PiscesSeason', '#WaterSign'],
};

const CULTURE_HASHTAGS = {
  roman: ['#RomanMythology', '#AncientRome'],
  greek: ['#GreekMythology', '#AncientGreece'],
  babylonian: ['#BabylonianMythology', '#Mesopotamia'],
  vedic: ['#VedicAstrology', '#HinduMythology'],
  norse: ['#NorseMythology', '#VikingLore'],
  islamic: ['#IslamicAstronomy', '#IslamicGoldenAge'],
  medieval: ['#MedievalSymbolism', '#MedievalMythology'],
};

const POST_TYPE_HASHTAGS = {
  monthIntro: ['#NewMonth', '#MythicCalendar'],
  zodiacIntro: ['#ZodiacSign', '#Astrology'],
  culturalSpotlight: ['#CulturalMythology', '#WorldMythology'],
  holidayPost: ['#Holidays', '#CulturalCalendar'],
  ctaPost: ['#ExploreMyth', '#InteractiveMyth'],
};

// Days of week for post scheduling within a month
const SCHEDULE_DAYS = ['Monday', 'Wednesday', 'Friday', 'Saturday'];

function buildHashtags(sign, cultures, postType, extra = []) {
  const tags = new Set([
    ...BASE_HASHTAGS,
    ...SIGN_HASHTAGS[sign] || [],
    ...POST_TYPE_HASHTAGS[postType] || [],
    ...extra,
  ]);
  cultures.forEach(c => {
    (CULTURE_HASHTAGS[c] || []).forEach(t => tags.add(t));
  });
  const arr = [...tags];
  // Target 15-20 hashtags
  return arr.slice(0, 20);
}

function truncateCaption(text, limit = 2200) {
  if (text.length <= limit) return text;
  return text.substring(0, limit - 3) + '...';
}

function buildMonthIntroPost(campaignMonth, zodiac, calMonth) {
  const sign = zodiac.sign;
  const symbol = zodiac.symbol;
  const stone = calMonth.stone;
  const flower = calMonth.flower;
  const mood = calMonth.mood;

  const title = `Welcome to ${calMonth.month} ${symbol} — ${sign} Season Begins`;
  const caption = truncateCaption(
`${calMonth.month} has arrived, and with it, ${sign} season ${symbol}

${mood}

This month's stone is ${stone.name}: ${stone.description.substring(0, 200)}...

This month's flower is ${flower.name}: ${flower.description.substring(0, 200)}...

Over the coming weeks, we'll explore ${sign} through the lens of ${campaignMonth.cultures.map(c => CULTURE_LABELS[c]).join(', ')} mythology. Each tradition reveals a different facet of this powerful archetype.

Explore ${sign} across ancient traditions on Celestial Clocks
meteorsteel.com/metals`
  );

  return {
    postType: 'monthIntro',
    title,
    caption,
    cultures: campaignMonth.cultures.map(c => CULTURE_LABELS[c]),
    hashtags: buildHashtags(sign, campaignMonth.cultures, 'monthIntro', ['#NewSeason']),
    stone: stone.name,
    flower: flower.name,
  };
}

function buildZodiacIntroPost(campaignMonth, zodiac) {
  const sign = zodiac.sign;
  const symbol = zodiac.symbol;

  const title = `${sign} ${symbol}: ${zodiac.archetype}`;
  const caption = truncateCaption(
`Who is ${sign}? ${symbol}

Element: ${zodiac.element} | Modality: ${zodiac.modality} | Ruling Planet: ${zodiac.rulingPlanet}
Dates: ${zodiac.dates} | House: ${zodiac.house}

${zodiac.description}

The archetype of ${zodiac.archetype} represents ${zodiac.stageOfExperience}. Across cultures, this sign has taken many forms — from the ${zodiac.cultures.roman.myth} of Rome to the ${zodiac.cultures.vedic.name} of Vedic tradition.

This month, we'll journey through ${campaignMonth.cultures.length} cultural perspectives on ${sign}, uncovering how different civilizations understood this celestial archetype.

Explore ${sign} across ${campaignMonth.cultures.length} ancient traditions on Celestial Clocks
meteorsteel.com/metals`
  );

  return {
    postType: 'zodiacIntro',
    title,
    caption,
    cultures: ['All'],
    hashtags: buildHashtags(sign, campaignMonth.cultures, 'zodiacIntro', [`#${zodiac.element}Sign`, '#Archetype']),
  };
}

function buildCulturalSpotlightPost(campaignMonth, zodiac, culture) {
  const sign = zodiac.sign;
  const symbol = zodiac.symbol;
  const cultureData = zodiac.cultures[culture];
  if (!cultureData) return null;

  const label = CULTURE_LABELS[culture];
  const title = `${label} ${sign}: ${cultureData.name}`;
  const caption = truncateCaption(
`How did the ${label} tradition see ${sign}? ${symbol}

${label} Name: ${cultureData.name}
Myth: ${cultureData.myth}

${cultureData.description}

Every culture that gazed at the stars found its own meaning in the constellation we call ${sign}. The ${label} perspective reveals how ${zodiac.element.toLowerCase()} energy and the archetype of ${zodiac.archetype} were understood in a completely different world.

${campaignMonth.num <= 6
  ? `We're ${campaignMonth.num} months into The Mythic Year, exploring ${campaignMonth.cultures.length} cultural traditions so far. New perspectives are added each month as our journey deepens.`
  : `With all 7 cultural traditions now in play, we can see the full tapestry of how humanity understood ${sign} across civilizations.`
}

Explore ${sign} across all traditions on Celestial Clocks
meteorsteel.com/metals`
  );

  return {
    postType: 'culturalSpotlight',
    title,
    caption,
    cultures: [label],
    hashtags: buildHashtags(sign, [culture], 'culturalSpotlight', [`#${label}`]),
  };
}

function buildCulturalComparisonPost(campaignMonth, zodiac, culture1, culture2) {
  const sign = zodiac.sign;
  const symbol = zodiac.symbol;
  const c1 = zodiac.cultures[culture1];
  const c2 = zodiac.cultures[culture2];
  if (!c1 || !c2) return null;

  const label1 = CULTURE_LABELS[culture1];
  const label2 = CULTURE_LABELS[culture2];
  const title = `${sign} ${symbol}: ${label1} vs ${label2}`;
  const caption = truncateCaption(
`Two worlds, one sky — how ${label1} and ${label2} traditions saw ${sign} differently ${symbol}

${label1}: "${c1.name}" — ${c1.myth}
${c1.description.substring(0, 300)}

${label2}: "${c2.name}" — ${c2.myth}
${c2.description.substring(0, 300)}

Same stars, different stories. The ${zodiac.element} energy of ${sign} manifested as ${c1.name} in ${label1} tradition and ${c2.name} in ${label2} thought. Both saw ${zodiac.archetype.replace('The ', '')} energy, but expressed it through their own cultural lens.

Explore all ${campaignMonth.cultures.length} perspectives on ${sign} at Celestial Clocks
meteorsteel.com/metals`
  );

  return {
    postType: 'culturalSpotlight',
    title,
    caption,
    cultures: [label1, label2],
    hashtags: buildHashtags(sign, [culture1, culture2], 'culturalSpotlight', ['#ComparativeMythology']),
  };
}

function buildHolidayPost(campaignMonth, zodiac, holiday) {
  const sign = zodiac.sign;
  const symbol = zodiac.symbol;

  const title = `${holiday.name} ${symbol}`;
  const caption = truncateCaption(
`${holiday.name} falls during ${sign} season ${symbol} — and its mythic roots run deep.

${holiday.description}

During The Mythic Year, we connect each holiday to the zodiac season it inhabits. ${holiday.name} resonates with ${sign}'s energy as ${zodiac.archetype} — the stage of ${zodiac.stageOfExperience.toLowerCase()}.

What connections do you see between ${holiday.name} and ${sign} season?

Explore the mythic calendar on Celestial Clocks
meteorsteel.com/metals`
  );

  return {
    postType: 'holidayPost',
    title,
    caption,
    cultures: campaignMonth.cultures.map(c => CULTURE_LABELS[c]),
    holiday: holiday.name,
    hashtags: buildHashtags(sign, campaignMonth.cultures, 'holidayPost', ['#MythicHoliday']),
  };
}

function buildCTAPost(campaignMonth, zodiac) {
  const sign = zodiac.sign;
  const symbol = zodiac.symbol;

  const title = `Explore ${sign} ${symbol} on Celestial Clocks`;
  const caption = truncateCaption(
`Your journey through ${sign} season continues ${symbol}

This month we've explored ${sign} — ${zodiac.archetype} — through ${campaignMonth.cultures.length} cultural lenses: ${campaignMonth.cultures.map(c => CULTURE_LABELS[c]).join(', ')}.

${zodiac.element} sign. ${zodiac.modality} modality. Ruled by ${zodiac.rulingPlanet}. House ${zodiac.house}.

But reading about mythology is only the beginning. On Celestial Clocks, you can explore ${sign} interactively — see how each culture interpreted the same stars, compare myths side by side, and discover connections you won't find anywhere else.

Dive into ${sign} on Celestial Clocks — link in bio
meteorsteel.com/metals

${campaignMonth.num < 12 ? `Next month: ${CAMPAIGN_MONTHS[campaignMonth.num].sign} ${getZodiacSign(CAMPAIGN_MONTHS[campaignMonth.num].sign).symbol} season begins!` : `Thank you for joining us on The Mythic Year journey through all 12 signs!`}`
  );

  return {
    postType: 'ctaPost',
    title,
    caption,
    cultures: campaignMonth.cultures.map(c => CULTURE_LABELS[c]),
    hashtags: buildHashtags(sign, campaignMonth.cultures, 'ctaPost', ['#LinkInBio', '#ExploreMore']),
  };
}

function selectHolidays(holidays, maxCount = 4) {
  // Prioritize holidays with strong mythic content (longer descriptions)
  const scored = holidays.map(h => ({
    ...h,
    score: h.description.length + (h.name.toLowerCase().includes('solstice') || h.name.toLowerCase().includes('equinox') ? 200 : 0)
      + (h.name.toLowerCase().includes('myth') ? 150 : 0),
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, maxCount);
}

function buildMonth(campaignMonth) {
  const zodiac = getZodiacSign(campaignMonth.sign);
  const calMonth = getMonth(campaignMonth.calMonth);
  const holidays = getMonthHolidays(campaignMonth.calMonth);
  const holidayTarget = Math.min(4, Math.max(2, Math.ceil(holidays.length * 0.5)));
  const selectedHolidays = selectHolidays(holidays, holidayTarget);

  const posts = [];
  let weekNum = 1;
  let dayIdx = 0;

  function nextDay() {
    const day = SCHEDULE_DAYS[dayIdx % SCHEDULE_DAYS.length];
    if (dayIdx > 0 && dayIdx % SCHEDULE_DAYS.length === 0) weekNum++;
    dayIdx++;
    return { weekNumber: weekNum, dayOfWeek: day };
  }

  // 1. Month Intro (first post)
  posts.push({
    ...buildMonthIntroPost(campaignMonth, zodiac, calMonth),
    ...nextDay(),
  });

  // 2. Zodiac Intro (second post)
  posts.push({
    ...buildZodiacIntroPost(campaignMonth, zodiac),
    ...nextDay(),
  });

  // 3. Cultural Spotlights — individual post for EVERY active culture
  const cultures = campaignMonth.cultures;
  cultures.forEach(culture => {
    const post = buildCulturalSpotlightPost(campaignMonth, zodiac, culture);
    if (post) {
      posts.push({ ...post, ...nextDay() });
    }
  });

  // Comparison posts: pair cultures for contrast (1-2 comparisons)
  if (cultures.length >= 4) {
    // Compare two non-adjacent cultural traditions for variety
    const pairs = [
      [cultures[0], cultures[cultures.length - 1]],
      [cultures[1], cultures[Math.min(3, cultures.length - 1)]],
    ];
    pairs.forEach(([c1, c2]) => {
      if (c1 !== c2) {
        const post = buildCulturalComparisonPost(campaignMonth, zodiac, c1, c2);
        if (post) {
          posts.push({ ...post, ...nextDay() });
        }
      }
    });
  } else if (cultures.length >= 2) {
    const post = buildCulturalComparisonPost(campaignMonth, zodiac, cultures[0], cultures[1]);
    if (post) {
      posts.push({ ...post, ...nextDay() });
    }
  }

  // 4. Holiday Posts
  selectedHolidays.forEach(holiday => {
    posts.push({
      ...buildHolidayPost(campaignMonth, zodiac, holiday),
      ...nextDay(),
    });
  });

  // 5. CTA Post (last post of month)
  posts.push({
    ...buildCTAPost(campaignMonth, zodiac),
    ...nextDay(),
  });

  return posts;
}

function buildCampaign() {
  let globalId = 1;
  const allPosts = [];

  CAMPAIGN_MONTHS.forEach(cm => {
    const monthPosts = buildMonth(cm);
    monthPosts.forEach(post => {
      allPosts.push({
        id: globalId++,
        campaignMonth: cm.num,
        zodiacSign: cm.sign,
        calendarMonth: cm.calMonth,
        startDate: cm.startDate,
        endDate: cm.endDate,
        ...post,
      });
    });
  });

  return allPosts;
}

module.exports = { buildCampaign, CAMPAIGN_MONTHS, CULTURE_LABELS };
