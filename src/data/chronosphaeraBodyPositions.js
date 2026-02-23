/**
 * Position-pinned body data for the Chronosphaera body view.
 *
 * The body is the stable reference frame. Chakras, sins, organs, and glands
 * belong to positions on the body (Crown → Root). Planets are visitors that
 * pick up whatever data lives at their current position.
 */

// The 3 planet orderings (Crown → Root, index 0 → 6)
export const CHAKRA_ORDERINGS = {
  chaldean:     ['Saturn','Jupiter','Mars','Sun','Venus','Mercury','Moon'],
  heliocentric: ['Sun','Mercury','Venus','Moon','Mars','Jupiter','Saturn'],
  weekdays:     ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn'],
};

export const CHAKRA_MODE_LABELS = {
  chaldean: 'Chaldean Order',
  heliocentric: 'Heliocentric Order',
  weekdays: 'Weekday Order',
};

// Position-pinned data: index 0 = Crown, index 6 = Root.
// These properties belong to the POSITION, not to any planet.
export const BODY_POSITIONS = [
  {
    chakra: { label: 'Crown', sanskrit: 'Sahasrara', location: 'Top of head', theme: 'Unity, transcendence, meaning', element: 'Consciousness' },
    sin: 'Pride',
    virtue: 'Humility',
    organ: 'Skin',
    organDescription: 'Skin regulates temperature and acts as a protective barrier.',
    secondaryOrgan: null,
    gland: { gland: 'Pineal', hormones: 'Melatonin, DMT' },
    description: 'The Crown Chakra is the seat of spiritual connection and universal consciousness. When Pride occupies this position, an inflated sense of self-importance severs the link to something larger. Humility — recognizing that the self is part of a greater whole — restores the Crown\'s capacity for transcendence and meaning.',
  },
  {
    chakra: { label: 'Third Eye', sanskrit: 'Ajna', location: 'Between eyebrows', theme: 'Insight, intuition, imagination', element: 'Mind / Light' },
    sin: 'Envy',
    virtue: 'Gratitude',
    organ: 'Nervous System',
    organDescription: 'The nervous system coordinates sensory and motor functions.',
    secondaryOrgan: null,
    gland: { gland: 'Pituitary', hormones: 'Oxytocin, Endorphins, Regulatory Hormones' },
    description: 'The Third Eye Chakra governs perception, intuition, and inner sight. When Envy clouds this position, jealousy distorts how we see others and ourselves, replacing clarity with resentment. Gratitude restores clear perception — the ability to see what is present rather than what is lacking.',
  },
  {
    chakra: { label: 'Throat', sanskrit: 'Vishuddha', location: 'Throat', theme: 'Expression, truth, communication', element: 'Ether / Space' },
    sin: 'Wrath',
    virtue: 'Patience',
    organ: 'Muscular System',
    organDescription: 'Muscular system enables movement and structural support.',
    secondaryOrgan: null,
    gland: { gland: 'Pancreas', hormones: 'Insulin, Glucagon' },
    description: 'The Throat Chakra governs communication and authentic expression. When Wrath occupies this position, anger disrupts the capacity for honest speech, replacing dialogue with aggression. Patience restores the Throat\'s power — the ability to speak truth without violence and to listen without defensiveness.',
  },
  {
    chakra: { label: 'Heart', sanskrit: 'Anahata', location: 'Center of chest', theme: 'Love, compassion, connection', element: 'Air' },
    sin: 'Greed',
    virtue: 'Charity',
    organ: 'Respiratory System',
    organDescription: 'Respiratory system exchanges gases, vital for energy and life.',
    secondaryOrgan: 'Circulatory System',
    gland: { gland: 'Thyroid & Parathyroid', hormones: 'Thyroxine, Triiodothyronine, Calcitonin' },
    description: 'The Heart Chakra is the center of love, empathy, and connection. When Greed hardens this position, the desire to accumulate replaces the instinct to give. Charity reopens the heart — generosity not as sacrifice but as recognition that giving and receiving are the same motion.',
  },
  {
    chakra: { label: 'Solar Plexus', sanskrit: 'Manipura', location: 'Upper abdomen', theme: 'Power, will, identity, confidence', element: 'Fire' },
    sin: 'Gluttony',
    virtue: 'Temperance',
    organ: 'Digestive System',
    organDescription: 'Digestive system processes food into energy and nutrients.',
    secondaryOrgan: 'Muscular System',
    gland: { gland: 'Gonads (Ovaries/Testes)', hormones: 'Estrogen, Progesterone, Testosterone' },
    description: 'The Solar Plexus Chakra is the seat of personal power, will, and identity. When Gluttony bloats this position, excess and indulgence overwhelm self-discipline. Temperance restores the fire of Manipura — the ability to consume what sustains and release what does not serve.',
  },
  {
    chakra: { label: 'Sacral', sanskrit: 'Svadhishthana', location: 'Lower abdomen / pelvis', theme: 'Emotion, pleasure, sexuality, creativity', element: 'Water' },
    sin: 'Lust',
    virtue: 'Chastity',
    organ: 'Reproductive System',
    organDescription: 'Reproductive system underpins procreation and sexual health.',
    secondaryOrgan: 'Lymphatic System',
    gland: { gland: 'Thymus', hormones: 'Thymosin' },
    description: 'The Sacral Chakra governs emotion, creativity, and sexual energy. When Lust distorts this position, creative and sexual energies are misused — pleasure pursued without connection. Chastity, understood not as denial but as intentionality, restores the Sacral\'s creative flow.',
  },
  {
    chakra: { label: 'Root', sanskrit: 'Muladhara', location: 'Base of spine', theme: 'Survival, safety, grounding, belonging', element: 'Earth' },
    sin: 'Sloth',
    virtue: 'Diligence',
    organ: 'Skeletal System',
    organDescription: 'The skeletal system provides the body\'s framework and protection.',
    secondaryOrgan: null,
    gland: { gland: 'Adrenal', hormones: 'Adrenaline (Epinephrine), Cortisol' },
    description: 'The Root Chakra grounds us to the earth and our basic survival instincts. When Sloth occupies this position, inertia prevents the establishment of a stable foundation for physical and spiritual growth. Diligence — persistent effort directed toward what matters — restores the Root\'s grounding power.',
  },
];

// Rich descriptions of each planet-at-position pairing for weekday mode only.
// Keyed by planet name (weekday assigns one planet per position uniquely).
export const WEEKDAY_PAIRING_DESCRIPTIONS = {
  Sun: 'The Crown Chakra, linked to the Sun, symbolizes our connection to the divine and universal consciousness. The Sun, representing vitality, ego, and self, when associated with Pride, highlights how an inflated sense of self-importance can sever spiritual connections. Pride, as the most severe sin according to Christian tradition, aligns with the Crown Chakra\'s role as the spiritual pinnacle, reminding us that detachment from ego is essential for true enlightenment.',
  Moon: 'The Third Eye Chakra, connected to intuition and insight, when influenced by Envy, associated with the Moon, reflects how jealousy clouds our perception and distorts reality. The Moon, with its phases and changes, symbolizes the fluctuating nature of desire and envy, affecting our ability to see clearly and understand deeper truths.',
  Mars: 'The Throat Chakra governs communication, and when impacted by Wrath, associated with Mars, the god of war, it emphasizes how anger can disrupt our ability to communicate effectively. Mars\' aggressive energy can lead to destructive speech and hinder compassionate listening, reflecting the need for control over our words and emotions.',
  Mercury: 'The Heart Chakra, the center of love and empathy, when influenced by Greed, linked to Mercury, the messenger and god of commerce, suggests how a desire for material wealth and accumulation can harden the heart. Mercury\'s association with trade and wealth highlights the risk of valuing possessions over connections, undermining the openness and generosity of the Anahata.',
  Jupiter: 'The Solar Plexus Chakra, associated with personal power and self-worth, when imbalanced by Gluttony, connected to Jupiter, the king of gods, emphasizes excess and indulgence. Jupiter\'s expansive influence can lead to an overemphasis on power and consumption, overshadowing self-discipline and inner strength.',
  Venus: 'The Sacral Chakra, related to creativity and emotional life, when distorted by Lust, associated with Venus, the goddess of love and beauty, highlights the misuse of creative and sexual energies. Venus\' allure underscores the temptation to succumb to physical desires, which can disrupt emotional balance and creative expression.',
  Saturn: 'The Root Chakra, grounding us to the earth and our basic survival instincts, when affected by Sloth, linked to Saturn, the god of time and discipline, reflects a lack of motivation and discipline. Saturn\'s slow, enduring energy, when negative, can lead to inertia, preventing the establishment of a stable foundation for physical and spiritual growth.',
};
