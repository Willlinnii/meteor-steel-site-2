// Named zodiac stars — mythically significant, brightest per constellation
// Coordinates are equatorial [lonDeg, latDeg] matching constellations.json line endpoints

const NAMED_STARS = [
  // ── Aries ──
  {
    name: 'Hamal',
    designation: 'α Arietis',
    constellation: 'Aries',
    lonDeg: 31.79,
    latDeg: 23.46,
    magnitude: 2.0,
    isCluster: false,
    isRoyalStar: false,
    color: '#ffcc66',
    mythology: 'Hamal marks the head of the celestial Ram. In antiquity it served as the vernal equinox marker, making Aries the first sign of the zodiac. Babylonian star catalogues listed it as the lead star of the heavenly flock.',
    cultures: {
      babylonian: { name: 'MUL.LÚ.ḪUN.GÁ' },
      vedic: { name: 'Ashwini' },
    },
  },

  // ── Taurus ──
  {
    name: 'Aldebaran',
    designation: 'α Tauri',
    constellation: 'Taurus',
    lonDeg: 68.98,
    latDeg: 16.51,
    magnitude: 0.87,
    isCluster: false,
    isRoyalStar: true,
    color: '#ff8844',
    mythology: 'The fiery eye of the Bull and one of the four Royal Stars of Persia — Watcher of the East, guardian of the vernal equinox in ancient times. A red giant 44 times the diameter of the Sun, its name means "the Follower" because it rises after the Pleiades.',
    cultures: {
      vedic: { name: 'Rohini' },
      babylonian: { name: 'Pidnu-sha-Shame' },
      islamic: { name: 'al-Dabarān' },
    },
  },
  {
    name: 'Pleiades',
    designation: 'M45',
    constellation: 'Taurus',
    lonDeg: 56.75,
    latDeg: 24.12,
    magnitude: 1.6,
    isCluster: true,
    isRoyalStar: false,
    color: '#aaccff',
    mythology: 'The Seven Sisters — one of the most culturally significant sky objects worldwide. Nearly every civilisation has named this cluster: Subaru in Japan, Matariki in Polynesia, Krittika in Vedic tradition. In Greek myth, they are the daughters of Atlas and Pleione, placed in the sky by Zeus.',
    cultures: {
      vedic: { name: 'Krittika' },
      babylonian: { name: 'MUL.MUL' },
      norse: { name: "Freyja's Hens" },
      islamic: { name: 'al-Thurayya' },
    },
  },

  // ── Gemini ──
  {
    name: 'Castor',
    designation: 'α Geminorum',
    constellation: 'Gemini',
    lonDeg: 113.65,
    latDeg: 31.89,
    magnitude: 1.58,
    isCluster: false,
    isRoyalStar: false,
    color: '#ddeeff',
    mythology: 'The mortal twin — actually a sextuple star system appearing as one bright point. In Greek myth, Castor was the horseman twin, skilled in warfare, whose mortality became the catalyst for the twins\u2019 eternal bond when Pollux refused immortality without him.',
    cultures: {
      vedic: { name: 'Punarvasu' },
      babylonian: { name: 'Mashmashu' },
    },
  },
  {
    name: 'Pollux',
    designation: 'β Geminorum',
    constellation: 'Gemini',
    lonDeg: 116.33,
    latDeg: 28.03,
    magnitude: 1.14,
    isCluster: false,
    isRoyalStar: false,
    color: '#ffcc88',
    mythology: 'The immortal twin — the closest giant star to Earth at 34 light-years. Son of Zeus, Pollux was the boxer of the pair. When Castor died, Pollux begged Zeus to share his immortality, and both were placed together as stars forever.',
    cultures: {
      vedic: { name: 'Pushya' },
    },
  },

  // ── Cancer ──
  {
    name: 'Al Tarf',
    designation: 'β Cancri',
    constellation: 'Cancer',
    lonDeg: 124.13,
    latDeg: 9.19,
    magnitude: 3.5,
    isCluster: false,
    isRoyalStar: false,
    color: '#ffcc66',
    mythology: 'Meaning "the end" or "the tip," Al Tarf is the brightest star in Cancer — a dim constellation that the ancients associated with the gate through which souls descend into incarnation. Its faintness was itself mythologically significant: a threshold barely seen.',
  },

  // ── Leo ──
  {
    name: 'Regulus',
    designation: 'α Leonis',
    constellation: 'Leo',
    lonDeg: 152.09,
    latDeg: 11.97,
    magnitude: 1.36,
    isCluster: false,
    isRoyalStar: true,
    color: '#ccddff',
    mythology: 'Heart of the Lion and Royal Star of Persia — Watcher of the North. Regulus sits almost exactly on the ecliptic, closer than any other first-magnitude star. Its name means "little king," and it was the star of kingship in Babylonian, Persian, and Egyptian traditions.',
    cultures: {
      vedic: { name: 'Magha' },
      babylonian: { name: 'LUGAL' },
      islamic: { name: 'Qalb al-Asad' },
    },
  },
  {
    name: 'Denebola',
    designation: 'β Leonis',
    constellation: 'Leo',
    lonDeg: 177.26,
    latDeg: 14.57,
    magnitude: 2.14,
    isCluster: false,
    isRoyalStar: false,
    color: '#ddeeff',
    mythology: 'The tail of the Lion, from the Arabic "Dhanab al-Asad." One of the stars forming the Spring Triangle asterism. In medieval astrology it was associated with misfortune, but in older traditions it marked the completion of the lion\u2019s form — the end of the royal beast.',
  },

  // ── Virgo ──
  {
    name: 'Spica',
    designation: 'α Virginis',
    constellation: 'Virgo',
    lonDeg: -158.7,
    latDeg: -11.16,
    magnitude: 0.97,
    isCluster: false,
    isRoyalStar: false,
    color: '#bbccff',
    mythology: 'The ear of grain held by the celestial Maiden — the harvest star. Spica helped Hipparchus discover the precession of the equinoxes around 130 BCE. Across cultures it represents the fertility of the earth: Demeter\u2019s sheaf, Isis\u2019s wheat, the Vedic Chitra.',
    cultures: {
      vedic: { name: 'Chitra' },
      babylonian: { name: 'Shala' },
      islamic: { name: 'al-Simāk al-Aʿzal' },
    },
  },

  // ── Libra ──
  {
    name: 'Zubeneschamali',
    designation: 'β Librae',
    constellation: 'Libra',
    lonDeg: -130.75,
    latDeg: -9.38,
    magnitude: 2.6,
    isCluster: false,
    isRoyalStar: false,
    color: '#ccddee',
    mythology: '"The northern claw" — a remnant of when Libra\u2019s stars belonged to Scorpius. Some observers report a greenish tint, making it one of the very few stars perceived as green by the naked eye. The Scales were later separated as the only non-living zodiac constellation.',
  },
  {
    name: 'Zubenelgenubi',
    designation: 'α Librae',
    constellation: 'Libra',
    lonDeg: -137.28,
    latDeg: -16.04,
    magnitude: 2.75,
    isCluster: false,
    isRoyalStar: false,
    color: '#eedd99',
    mythology: '"The southern claw" — a wide double star visible to keen eyes. In Babylonian astronomy these two stars were the Claws of the Scorpion; the Romans reinterpreted them as the Scales of Justice, the only zodiac sign derived from a human instrument rather than a living form.',
  },

  // ── Scorpio ──
  {
    name: 'Antares',
    designation: 'α Scorpii',
    constellation: 'Scorpio',
    lonDeg: -112.65,
    latDeg: -26.43,
    magnitude: 1.06,
    isCluster: false,
    isRoyalStar: true,
    color: '#ff6644',
    mythology: '"Rival of Mars" — so named for its red colour rivalling the planet. Royal Star of Persia, Watcher of the West. A red supergiant 700 times the Sun\u2019s diameter, it marks the heart of the Scorpion that slew Orion, placed opposite him in the sky so they never appear together.',
    cultures: {
      vedic: { name: 'Jyeshtha' },
      babylonian: { name: 'LISI' },
      islamic: { name: 'Qalb al-ʿAqrab' },
    },
  },
  {
    name: 'Shaula',
    designation: 'λ Scorpii',
    constellation: 'Scorpio',
    lonDeg: -96.6,
    latDeg: -37.1,
    magnitude: 1.62,
    isCluster: false,
    isRoyalStar: false,
    color: '#aabbff',
    mythology: '"The stinger" — the raised tail-tip of the Scorpion. Together with Lesath, it forms a close pair known as the Cat\u2019s Eyes in some traditions. In Polynesian navigation, Shaula served as one of the key steering stars for voyaging canoes across the Pacific.',
    cultures: {
      vedic: { name: 'Mula' },
    },
  },

  // ── Sagittarius ──
  {
    name: 'Kaus Australis',
    designation: 'ε Sagittarii',
    constellation: 'Sagittarius',
    lonDeg: -83.96,
    latDeg: -34.38,
    magnitude: 1.85,
    isCluster: false,
    isRoyalStar: false,
    color: '#ccddff',
    mythology: '"The southern bow" — the brightest star in Sagittarius, marking the base of the Archer\u2019s bow. The bow of the Centaur points toward the heart of Scorpius, a cosmological alignment that cultures from Mesopotamia to Mesoamerica recognised as significant.',
    cultures: {
      vedic: { name: 'Purva Ashadha' },
      islamic: { name: 'Kaus al-Janūbī' },
    },
  },

  // ── Capricorn ──
  {
    name: 'Deneb Algedi',
    designation: 'δ Capricorni',
    constellation: 'Capricorn',
    lonDeg: -33.24,
    latDeg: -16.13,
    magnitude: 2.85,
    isCluster: false,
    isRoyalStar: false,
    color: '#ddeeff',
    mythology: '"Tail of the goat" — marking the fish-tail end of the Sea-Goat, one of the oldest constellation forms. In Sumerian tradition, Capricorn was Suhurma\u0161u, the goat-fish who carried the god Ea, lord of the cosmic waters beneath the earth.',
    cultures: {
      vedic: { name: 'Shravana' },
      babylonian: { name: 'Suhurmashu' },
    },
  },

  // ── Aquarius ──
  {
    name: 'Sadalsuud',
    designation: 'β Aquarii',
    constellation: 'Aquarius',
    lonDeg: -37.11,
    latDeg: -5.57,
    magnitude: 2.87,
    isCluster: false,
    isRoyalStar: false,
    color: '#eedd88',
    mythology: '"Luckiest of the lucky" — a name from the Arabic tradition of weather-stars, marking the season when winter retreats and spring rain begins. In the cosmological Water-Bearer, this star sits where the stream pours forth, linking it to renewal, the flood, and the gift of life.',
    cultures: {
      vedic: { name: 'Shatabhisha' },
      islamic: { name: "Sa'd al-Su'ūd" },
    },
  },

  // ── Pisces ──
  {
    name: 'Eta Piscium',
    designation: 'η Piscium',
    constellation: 'Pisces',
    lonDeg: 22.87,
    latDeg: 15.35,
    magnitude: 3.62,
    isCluster: false,
    isRoyalStar: false,
    color: '#ffcc66',
    mythology: 'The brightest star in Pisces, a giant star 294 light-years away. In the myth of Aphrodite and Eros, the two Fishes are bound by a cord — this star sits near the knot. The faintness of Pisces was itself a symbol: the cycle ending in dissolution before rebirth in Aries.',
  },
];

export default NAMED_STARS;
