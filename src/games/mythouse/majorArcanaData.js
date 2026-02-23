// Major Arcana Data — 154 cards (7 cultures × 22 positions)
// Transcribed from the Mythouse Game Book

export const CULTURES = [
  { key: 'roman',      label: 'Roman' },
  { key: 'greek',      label: 'Greek' },
  { key: 'norse',      label: 'Norse' },
  { key: 'babylonian', label: 'Babylonian' },
  { key: 'vedic',      label: 'Vedic' },
  { key: 'islamic',    label: 'Islamic' },
  { key: 'christian',  label: 'Medieval Christianity' },
];

// 22 arcana positions shared across all cultures
// 3 elements: Air (#0), Water (#12), Fire (#20)
// 7 planets: Mercury (#1), Moon (#2), Venus (#3), Jupiter (#10), Mars (#16), Sun (#19), Saturn (#21)
// 12 zodiac: Aries (#4), Taurus (#5), Gemini (#6), Cancer (#7), Libra (#8), Virgo (#9),
//            Leo (#11), Scorpio (#13), Sagittarius (#14), Capricorn (#15), Aquarius (#17), Pisces (#18)
// Source: Arthur Edward Waite, "The Pictorial Key to the Tarot" (1910),
// Part II: "The Doctrine Behind the Veil." Public domain.
// Full text available at Project Gutenberg (gutenberg.org/ebooks/18753).
export const ARCANA_POSITIONS = [
  { number: 0,  tarot: 'The Fool',            type: 'element', correspondence: 'Air',
    waiteDesc: 'With light step, as if earth and its trammels had little power to restrain him, a young man in gorgeous vestments pauses at the brink of a precipice among the great heights of the world; he surveys the blue distance before him\u2014its expanse of sky rather than the prospect below. His act of eager walking is still indicated, though he is stationary at the given moment; his dog is still bounding. The edge which opens on the depth has no terror; it is as if angels were waiting to uphold him, if it came about that he leaped from the height. His countenance is full of intelligence and expectant dream. He has a rose in one hand and in the other a costly wand, from which depends over his right shoulder a wallet curiously embroidered. He is a prince of the other world on his travels through this one\u2014all amidst the morning glory, in the keen air. The sun, which shines behind him, knows whence he came, whither he is going, and how he will return by another path after many days. He is the spirit in search of experience.' },
  { number: 1,  tarot: 'The Magician',         type: 'planet',  correspondence: 'Mercury',
    waiteDesc: 'A youthful figure in the robe of a magician, having the countenance of divine Apollo, with smile of confidence and shining eyes. Above his head is the mysterious sign of the Holy Spirit, the sign of life, like an endless cord, forming the figure 8 in a horizontal position. About his waist is a serpent-cincture, the serpent appearing to devour its own tail. This is familiar to most as a conventional symbol of eternity, but here it indicates more especially the eternity of attainment in the spirit. In the Magician\u2019s right hand is a wand raised towards heaven, while the left hand is pointing to the earth. This dual sign is known in very high grades of the Instituted Mysteries; it shews the descent of grace, virtue and light, drawn from things above and derived to things below. The suggestion throughout is therefore the possession and communication of the Powers and Gifts of the Spirit. On the table in front of the Magician are the symbols of the four Tarot suits, signifying the elements of natural life, which lie like counters before the adept, and he adapts them as he wills. Beneath are roses and lilies, the flos campi and lilium convallium, changed into garden flowers, to shew the culture of aspiration. This card signifies the divine motive in man, reflecting God, the will in the liberation of its union with that which is above. It is also the unity of individual being on all planes, and in a very high sense it is thought, in the fixation thereof.' },
  { number: 2,  tarot: 'The High Priestess',   type: 'planet',  correspondence: 'Moon',
    waiteDesc: 'She has the lunar crescent at her feet, a horned diadem on her head, with a globe in the middle place, and a large solar cross on her breast. The scroll in her hands is inscribed with the word Tora, signifying the Greater Law, the Secret Law and the second sense of the Word. It is partly covered by her mantle, to shew that some things are implied and some spoken. She is seated between the white and black pillars\u2014J. and B.\u2014of the mystic Temple, and the veil of the Temple is behind her: it is embroidered with palms and pomegranates. The vestments are flowing and gauzy, and the mantle suggests light\u2014a shimmering radiance. She has been called occult Science on the threshold of the Sanctuary of Isis, but she is really the Secret Church, the House which is of God and man. She represents also the Second Marriage of the Prince who is no longer of this world; she is the spiritual Bride and Mother, the daughter of the stars and the Higher Garden of Eden. She is, in fine, the Queen of the borrowed light, but this is the light of all. She is the Moon nourished by the milk of the Supernal Mother. In a manner, she is also the Supernal Mother herself\u2014that is to say, she is the bright reflection. It is in this sense of reflection that her truest and highest name in symbolism is Shekinah\u2014the co-habiting glory. There are some respects in which this card is the highest and holiest of the Greater Arcana.' },
  { number: 3,  tarot: 'The Empress',           type: 'planet',  correspondence: 'Venus',
    waiteDesc: 'A stately figure, seated, having rich vestments and royal aspect, as of a daughter of heaven and earth. Her diadem is of twelve stars, gathered in a cluster. The symbol of Venus is on the shield which rests near her. A field of corn is ripening in front of her, and beyond there is a fall of water. The sceptre which she bears is surmounted by the globe of this world. She is the inferior Garden of Eden, the Earthly Paradise, all that is symbolized by the visible house of man. She is not Regina coeli, but she is still refugium peccatorum, the fruitful mother of thousands. There are also certain aspects in which she has been correctly described as desire and the wings thereof, as the woman clothed with the sun, as Gloria Mundi and the veil of the Sanctum Sanctorum; but she is not, I may add, the soul that has attained wings, unless all the symbolism is counted up another and unusual way. She is above all things universal fecundity and the outer sense of the Word. In another order of ideas, the card of the Empress signifies the door or gate by which an entrance is obtained into this life, as into the Garden of Venus; and then the way which leads out therefrom, into that which is beyond, is the secret known to the High Priestess: it is communicated by her to the elect.' },
  { number: 4,  tarot: 'The Emperor',            type: 'zodiac',  correspondence: 'Aries',
    waiteDesc: 'He has a form of the Crux ansata for his sceptre and a globe in his left hand. He is a crowned monarch\u2014commanding, stately, seated on a throne, the arms of which are fronted by rams\u2019 heads. He is executive and realization, the power of this world, here clothed with the highest of its natural attributes. He is occasionally represented as seated on a cubic stone, which, however, confuses some of the issues. He is the virile power, to which the Empress responds, and in this sense is he who seeks to remove the Veil of Isis; yet she remains virgo intacta. It should be understood that this card and that of the Empress do not precisely represent the condition of married life, though this state is implied. On the surface, as I have indicated, they stand for mundane royalty, uplifted on the seats of the mighty; but above this there is the suggestion of another presence. They signify also\u2014and the male figure especially\u2014the higher kingship, occupying the intellectual throne. Hereof is the lordship of thought rather than of the animal world.' },
  { number: 5,  tarot: 'The Hierophant',         type: 'zodiac',  correspondence: 'Taurus',
    waiteDesc: 'He wears the triple crown and is seated between two pillars, but they are not those of the Temple which is guarded by the High Priestess. In his left hand he holds a sceptre terminating in the triple cross, and with his right hand he gives the well-known ecclesiastical sign which is called that of esotericism, distinguishing between the manifest and concealed part of doctrine. It is noticeable in this connexion that the High Priestess makes no sign. At his feet are the crossed keys, and two priestly ministers in albs kneel before him. He has been usually called the Pope, which is a particular application of the more general office that he symbolizes. He is the ruling power of external religion, as the High Priestess is the prevailing genius of the esoteric, withdrawn power. He is rather the summa totius theologiae, when it has passed into the utmost rigidity of expression; but he symbolizes also all things that are righteous and sacred on the manifest side. As such, he is the channel of grace belonging to the world of institution as distinct from that of Nature, and he is the leader of salvation for the human race at large.' },
  { number: 6,  tarot: 'The Lovers',             type: 'zodiac',  correspondence: 'Gemini',
    waiteDesc: 'The sun shines in the zenith, and beneath is a great winged figure with arms extended, pouring down influences. In the foreground are two human figures, male and female, unveiled before each other, as if Adam and Eve when they first occupied the paradise of the earthly body. Behind the man is the Tree of Life, bearing twelve fruits, and the Tree of the Knowledge of Good and Evil is behind the woman; the serpent is twining round it. The figures suggest youth, virginity, innocence and love before it is contaminated by gross material desire. This is in all simplicity the card of human love, here exhibited as part of the way, the truth and the life. It replaces, by recourse to first principles, the old card of marriage, which I have described previously, and the later follies which depicted man between vice and virtue. In a very high sense, the card is a mystery of the Covenant and Sabbath.' },
  { number: 7,  tarot: 'The Chariot',            type: 'zodiac',  correspondence: 'Cancer',
    waiteDesc: 'An erect and princely figure carrying a drawn sword and corresponding, broadly speaking, to the traditional description which I have given in the first part. On the shoulders of the victorious hero are supposed to be the Urim and Thummim. He has led captivity captive; he is conquest on all planes\u2014in the mind, in science, in progress, in certain trials of initiation. He has thus replied to the sphinx, and it is on this account that I have accepted the variation of Eliphas L\u00e9vi; two sphinxes thus draw his chariot. He is above all things triumph in the mind. It is to be understood for this reason (a) that the question of the sphinx is concerned with a Mystery of Nature and not of the world of Grace, to which the charioteer could offer no answer; (b) that the planes of his conquest are manifest or external and not within himself; (c) that the liberation which he effects may leave himself in the bondage of the logical understanding; (d) that the tests of initiation through which he has passed in triumph are to be understood physically or rationally; and (e) that if he came to the pillars of that Temple between which the High Priestess is seated, he could not open the scroll called Tora, nor if she questioned him could he answer. He is not hereditary royalty and he is not priesthood.' },
  { number: 8,  tarot: 'Justice',                type: 'zodiac',  correspondence: 'Libra',
    waiteDesc: 'As this card follows the traditional symbolism and carries above all its obvious meanings, there is little to say regarding it outside the few considerations collected in the first part, to which the reader is referred. It will be seen, however, that the figure is seated between pillars, like the High Priestess, and on this account it seems desirable to indicate that the moral principle which deals unto every man according to his works\u2014while, of course, it is in strict analogy with higher things\u2014differs in its essence from the spiritual justice which is involved in the idea of election. The operation of this is like the breathing of the Spirit where it wills, and we have no canon of criticism or ground of explanation concerning it. It is analogous to the possession of the fairy gifts and the high gifts and the gracious gifts of the poet: we have them or have not, and their presence is as much a mystery as their absence. The law of Justice is not however involved by either alternative. In conclusion, the pillars of Justice open into one world and the pillars of the High Priestess into another.' },
  { number: 9,  tarot: 'The Hermit',             type: 'zodiac',  correspondence: 'Virgo',
    waiteDesc: 'The variation from the conventional models in this card is only that the lamp is not enveloped partially in the mantle of its bearer, who blends the idea of the Ancient of Days with the Light of the World. It is a star which shines in the lantern. I have said that this is a card of attainment, and to extend this conception the figure is seen holding up his beacon on an eminence. Therefore the Hermit is not, as Court de G\u00e9belin explained, a wise man in search of truth and justice; nor is he, as a later explanation proposes, an especial example of experience. His beacon intimates that \u201cwhere I am, you also may be.\u201d It is further a card which is understood quite incorrectly when it is connected with the idea of occult isolation, as the protection of personal magnetism against admixture. In true Martinism, the significance of the term Philosophe inconnu was of another order. It did not refer to the intended concealment of the Instituted Mysteries, much less of their substitutes, but\u2014like the card itself\u2014to the truth that the Divine Mysteries secure their own protection from those who are unprepared.' },
  { number: 10, tarot: 'Wheel of Fortune',       type: 'planet',  correspondence: 'Jupiter',
    waiteDesc: 'In this symbol I have again followed the reconstruction of Eliphas L\u00e9vi, who has furnished several variants. It is legitimate\u2014as I have intimated\u2014to use Egyptian symbolism when this serves our purpose, provided that no theory of origin is implied therein. I have, however, presented Typhon in his serpent form. The symbolism is, of course, not exclusively Egyptian, as the four Living Creatures of Ezekiel occupy the angles of the card, and the wheel itself follows other indications of L\u00e9vi in respect of Ezekiel\u2019s vision, as illustrative of the particular Tarot Key. With the French occultist, and in the design itself, the symbolic picture stands for the perpetual motion of a fluidic universe and for the flux of human life. The Sphinx is the equilibrium therein. The transliteration of Taro as Rota is inscribed on the wheel, counterchanged with the letters of the Divine Name\u2014to shew that Providence is implied through all. But this is the Divine intention within, and the similar intention without is exemplified by the four Living Creatures. Behind the general notion expressed in the symbol there lies the denial of chance and the fatality which is implied therein.' },
  { number: 11, tarot: 'Strength',               type: 'zodiac',  correspondence: 'Leo',
    waiteDesc: 'A woman, over whose head there broods the same symbol of life which we have seen in the card of the Magician, is closing the jaws of a lion. The only point in which this design differs from the conventional presentations is that her beneficent fortitude has already subdued the lion, which is being led by a chain of flowers. For reasons which satisfy myself, this card has been interchanged with that of justice, which is usually numbered eight. Fortitude, in one of its most exalted aspects, is connected with the Divine Mystery of Union; the virtue, of course, operates in all planes, and hence draws on all in its symbolism. It connects also with innocentia inviolata, and with the strength which resides in contemplation. These higher meanings are, however, matters of inference, and I do not suggest that they are transparent on the surface of the card. They are intimated in a concealed manner by the chain of flowers, which signifies, among many other things, the sweet yoke and the light burden of Divine Law, when it has been taken into the heart of hearts. The card has nothing to do with self-confidence in the ordinary sense, though this has been suggested\u2014but it concerns the confidence of those whose strength is God, who have found their refuge in Him.' },
  { number: 12, tarot: 'The Hanged Man',          type: 'element', correspondence: 'Water',
    waiteDesc: 'The gallows from which he is suspended forms a Tau cross, while the figure\u2014from the position of the legs\u2014forms a fylfot cross. There is a nimbus about the head of the seeming martyr. It should be noted (1) that the tree of sacrifice is living wood, with leaves thereon; (2) that the face expresses deep entrancement, not suffering; (3) that the figure, as a whole, suggests life in suspension, but life and not death. It is a card of profound significance, but all the significance is veiled. It has been called falsely a card of martyrdom, a card of prudence, a card of the Great Work, of duty or of the way of the cross; but these representations show only the lesser aspects. In its mystical aspect it expresses the relation, in one of its aspects, between the Divine and the Universe. He who can understand that the story of his higher nature is imbedded in this symbolism will receive intimations concerning a great awakening that is possible, and will know that after the sacred Mystery of Death there is a glorious Mystery of Resurrection.' },
  { number: 13, tarot: 'Death',                   type: 'zodiac',  correspondence: 'Scorpio',
    waiteDesc: 'The veil or mask of life is perpetuated in change, transformation and passage from lower to higher, and this is more fitly represented in the rectified Tarot by one of the apocalyptic visions than by the crude notion of the reaping skeleton. Behind it lies the whole world of ascent in the spirit. The mysterious horseman moves slowly, bearing a black banner emblazoned with the Mystic Rose, which signifies life. Between two pillars on the verge of the horizon there shines the sun of immortality. The horseman carries no visible weapon, but king and child and maiden fall before him, while a prelate with clasped hands awaits his end. The natural transit of man to the next stage of his being either is or may be one form of his progress, but the exotic and almost unknown entrance, while still in this life, into the state of mystical death is a change in the form of consciousness and the passage into a state to which ordinary death is neither the path nor gate.' },
  { number: 14, tarot: 'Temperance',              type: 'zodiac',  correspondence: 'Sagittarius',
    waiteDesc: 'A winged angel, with the sign of the sun upon his forehead and on his breast the square and triangle of the septenary. I speak of him in the masculine sense, but the figure is neither male nor female. It is held to be pouring the essences of life from chalice to chalice. It has one foot upon the earth and one upon waters, thus illustrating the nature of the essences. A direct path goes up to certain heights on the verge of the horizon, and above there is a great light, through which a crown is seen vaguely. Hereof is some part of the Secret of Eternal Life, as it is possible to man in his incarnation. All the conventional emblems are renounced herein. It is called Temperance fantastically, because, when the rule of it obtains in our consciousness, it tempers, combines and harmonises the psychic and material natures. Under that rule we know in our rational part something of whence we came and whither we are going.' },
  { number: 15, tarot: 'The Devil',               type: 'zodiac',  correspondence: 'Capricorn',
    waiteDesc: 'The Horned Goat of Mendes, with wings like those of a bat, is standing on an altar. At the pit of the stomach there is the sign of Mercury. The right hand is upraised and extended, being the reverse of that benediction which is given by the Hierophant in the fifth card. In the left hand there is a great flaming torch, inverted towards the earth. A reversed pentagram is on the forehead. There is a ring in front of the altar, from which two chains are carried to the necks of two figures, male and female. These are analogous with those of the fifth card, as if Adam and Eve after the Fall. Hereof is the chain and fatality of the material life. The figures are tailed, to signify the animal nature, but there is human intelligence in the faces, and he who is exalted above them is not to be their master for ever. Even now, he is also a bondsman, sustained by the evil that is in him and blind to the liberty of service. What it does signify is the Dweller on the Threshold without the Mystical Garden when those are driven forth therefrom who have eaten the forbidden fruit.' },
  { number: 16, tarot: 'The Tower',               type: 'planet',  correspondence: 'Mars',
    waiteDesc: 'Occult explanations attached to this card are meagre and mostly disconcerting. It is idle to indicate that it depicts ruin in all its aspects, because it bears this evidence on the surface. I agree rather with Grand Orient that it is the ruin of the House of Life, when evil has prevailed therein, and above all that it is the rending of a House of Doctrine. I understand that the reference is, however, to a House of Falsehood. It illustrates also in the most comprehensive way the old truth that \u201cexcept the Lord build the house, they labour in vain that build it.\u201d There is a sense in which the catastrophe is a reflection from the previous card, but not on the side of the symbolism which I have tried to indicate therein. It is more correctly a question of analogy; one is concerned with the fall into the material and animal state, while the other signifies destruction on the intellectual side. The Tower has been spoken of as the chastisement of pride and the intellect overwhelmed in the attempt to penetrate the Mystery of God; but in neither case do these explanations account for the two persons who are the living sufferers. The one is the literal word made void and the other its false interpretation. In yet a deeper sense, it may signify also the end of a dispensation.' },
  { number: 17, tarot: 'The Star',                type: 'zodiac',  correspondence: 'Aquarius',
    waiteDesc: 'A great, radiant star of eight rays, surrounded by seven lesser stars\u2014also of eight rays. The female figure in the foreground is entirely naked. Her left knee is on the land and her right foot upon the water. She pours Water of Life from two great ewers, irrigating sea and land. Behind her is rising ground and on the right a shrub or tree, whereon a bird alights. The figure expresses eternal youth and beauty. The star is l\u2019\u00e9toile flamboyante, which appears in Masonic symbolism, but has been confused therein. That which the figure communicates to the living scene is the substance of the heavens and the elements. It has been said truly that the mottoes of this card are \u201cWaters of Life freely\u201d and \u201cGifts of the Spirit.\u201d But she is in reality the Great Mother in the Kabalistic Sephira Binah, which is supernal Understanding, who communicates to the Sephiroth that are below in the measure that they can receive her influx.' },
  { number: 18, tarot: 'The Moon',                type: 'zodiac',  correspondence: 'Pisces',
    waiteDesc: 'The distinction between this card and some of the conventional types is that the moon is increasing on what is called the side of mercy, to the right of the observer. It has sixteen chief and sixteen secondary rays. The card represents life of the imagination apart from life of the spirit. The path between the towers is the issue into the unknown. The dog and wolf are the fears of the natural mind in the presence of that place of exit, when there is only reflected light to guide it. The last reference is a key to another form of symbolism. The intellectual light is a reflection and beyond it is the unknown mystery which it cannot shew forth. It illuminates our animal nature, types of which are represented below\u2014the dog, the wolf and that which comes up out of the deeps, the nameless and hideous tendency which is lower than the savage beast. It strives to attain manifestation, symbolized by crawling from the abyss of water to the land, but as a rule it sinks back whence it came. The face of the mind directs a calm gaze upon the unrest below; the dew of thought falls; the message is: Peace, be still; and it may be that there shall come a calm upon the animal nature, while the abyss beneath shall cease from giving up a form.' },
  { number: 19, tarot: 'The Sun',                 type: 'planet',  correspondence: 'Sun',
    waiteDesc: 'The naked child mounted on a white horse and displaying a red standard has been mentioned already as the better symbolism connected with this card. It is the destiny of the Supernatural East and the great and holy light which goes before the endless procession of humanity, coming out from the walled garden of the sensitive life and passing on the journey home. The card signifies, therefore, the transit from the manifest light of this world, represented by the glorious sun of earth, to the light of the world to come, which goes before aspiration and is typified by the heart of a child. But the last allusion is again the key to a different form or aspect of the symbolism. The sun is that of consciousness in the spirit\u2014the direct as the antithesis of the reflected light. The characteristic type of humanity has become a little child therein\u2014a child in the sense of simplicity and innocence in the sense of wisdom. In that simplicity, he bears the seal of Nature and of Art; in that innocence, he signifies the restored world. When the self-knowing spirit has dawned in the consciousness above the natural mind, that mind in its renewal leads forth the animal nature in a state of perfect conformity.' },
  { number: 20, tarot: 'Judgement',                type: 'element', correspondence: 'Fire',
    waiteDesc: 'I have said that this symbol is essentially invariable in all Tarot sets, or at least the variations do not alter its character. The great angel is here encompassed by clouds, but he blows his bannered trumpet, and the cross as usual is displayed on the banner. The dead are rising from their tombs\u2014a woman on the right, a man on the left hand, and between them their child, whose back is turned. But in this card there are more than three who are restored, and it has been thought worth while to make this variation as illustrating the insufficiency of current explanations. It should be noted that all the figures are as one in the wonder, adoration and ecstasy expressed by their attitudes. It is the card which registers the accomplishment of the great work of transformation in answer to the summons of the Supernal\u2014which summons is heard and answered from within. Herein is the intimation of a significance which cannot well be carried further in the present place. What is that within us which does sound a trumpet and all that is lower in our nature rises in response\u2014almost in a moment, almost in the twinkling of an eye? Let the card continue to depict, for those who can see no further, the Last Judgment and the resurrection in the natural body; but let those who have inward eyes look and discover therewith. They will understand that it has been called truly in the past a card of eternal life, and for this reason it may be compared with that which passes under the name of Temperance.' },
  { number: 21, tarot: 'The World',                type: 'planet',  correspondence: 'Saturn',
    waiteDesc: 'As this final message of the Major Trumps is unchanged\u2014and indeed unchangeable\u2014in respect of its design, it has been partly described already regarding its deeper sense. It represents also the perfection and end of the Cosmos, the secret which is within it, the rapture of the universe when it understands itself in God. It is further the state of the soul in the consciousness of Divine Vision, reflected from the self-knowing spirit. But these meanings are without prejudice to that which I have said concerning it on the material side. It has more than one message on the macrocosmic side and is, for example, the state of the restored world when the law of manifestation shall have been carried to the highest degree of natural perfection. But it is perhaps more especially a story of the past, referring to that day when all was declared to be good, when the morning stars sang together and all the Sons of God shouted for joy. One of the worst explanations concerning it is that the figure symbolizes the Magus when he has reached the highest degree of initiation; another account says that it represents the absolute, which is ridiculous. The figure has been said to stand for Truth, which is, however, more properly allocated to the seventeenth card. Lastly, it has been called the Crown of the Magi.' },
];

export const MAJOR_ARCANA = [
  // ============================
  // ROMAN DECK (22 cards)
  // ============================
  {
    culture: 'roman', number: 0, name: 'Air',
    description: 'Air (Latin: aer) was one of the four classical elements, embodying movement, intellect, and breath. The Romans imagined the winds as gods; Aeolus is called the master of all winds. In Aristotle\'s classical scheme, air was "hot and wet", symbolizing life and communication. Personified by the Venti (wind gods) and Aeolus, king of the winds, air represents breath, movement, and thought.',
  },
  {
    culture: 'roman', number: 1, name: 'Mercury',
    description: 'Mercury (Latin: Mercurius) is the Roman messenger god of trade, travel, and thieves, modeled on Greek Hermes. Clever and swift, Mercury as an infant invented the lyre from a tortoise shell. He guided souls to the underworld and protected commerce. In art he wears winged sandals and carries the caduceus. Mercury\'s day is Wednesday (dies Mercurii) and his metal is quicksilver.',
  },
  {
    culture: 'roman', number: 2, name: 'Luna',
    description: 'The Moon (Latin: Luna) is personified as the goddess Luna (Greek Selene). She governs the night sky, tides, and cycles of time. Luna is often shown driving a two-horse chariot and wearing a crescent moon. She corresponds to Monday (dies Lunae) and the metal silver. In myth, Luna took the shepherd Endymion as lover, granting him eternal sleep to preserve his youth.',
  },
  {
    culture: 'roman', number: 3, name: 'Venus',
    description: 'Venus is the Roman goddess of love, beauty, desire, fertility and prosperity. She famously emerged from sea foam, a birth later called Venus Anadyomene. Venus was revered as the ancestor of Rome through her son Aeneas and linked love to victory. Her symbols include the rose, myrtle, and a seashell. Friday (dies Veneris) is named for Venus and her metal is copper.',
  },
  {
    culture: 'roman', number: 4, name: 'Aries',
    description: 'Aries, the Ram, is the fire sign of leadership and courage. In myth the celestial ram carried Phrixus to safety; his golden fleece would later be sought by Jason. Aries is ruled by Mars (the war god). It represents new beginnings and bold action, the springtime energy of the zodiac. The golden ram of Phrixus became a constellation honoring bravery.',
  },
  {
    culture: 'roman', number: 5, name: 'Taurus',
    description: 'Taurus, the Bull, is a steadfast earth sign of fertility and strength. It recalls the myth where Zeus transformed into a white bull to abduct the princess Europa \u2013 a tale that explains the star pattern. Taurus is ruled by Venus, giving it an affinity with sensuality and beauty. The bull stands for stability, abundance, and the earth\'s richness.',
  },
  {
    culture: 'roman', number: 6, name: 'Gemini',
    description: 'Gemini, the Twins, is an air sign of communication and duality. It is linked to the Dioscuri \u2013 Castor and Pollux \u2013 twin brothers of Roman myth. Though one was mortal and one divine, Zeus honored their bond by placing them both in the sky. Gemini is ruled by Mercury, adding intellect and versatility to the twin symbolism.',
  },
  {
    culture: 'roman', number: 7, name: 'Cancer',
    description: 'Cancer, the Crab, is a water sign of home and emotion. In myth, Hera sent a giant crab to distract Hercules during his battle with the Hydra; when Hercules crushed it, Hera placed the crab in the stars as Cancer. Cancer is ruled by the Moon (silver) and is associated with nurturing, care, and strong loyalty.',
  },
  {
    culture: 'roman', number: 8, name: 'Libra',
    description: 'Libra, the Scales, is an air sign of balance, justice and harmony. Its symbol \u2013 a balanced pair of scales \u2013 is often associated with the goddess of justice (Greek Astraea or Roman Iustitia). Libra is ruled by Venus, blending fairness with grace. The scales represent symmetry, equilibrium, and the weighing of choices.',
  },
  {
    culture: 'roman', number: 9, name: 'Virgo',
    description: 'Virgo, the Maiden, is an earth sign of purity, service and harvest. The Romans saw Virgo as connected to Ceres (goddess of grain) \u2013 the virgin of the wheat fields \u2013 or as Astraea/Iustitia (justice) holding scales. Virgo brings carefulness and attention to detail. She is often depicted with sheaves of wheat, symbolizing the harvest.',
  },
  {
    culture: 'roman', number: 10, name: 'Jupiter',
    description: 'Jupiter (Latin: Juppiter) is the chief Roman god of sky and thunder. He wields the lightning bolt, watches from atop the oak, and upholds law and order. His festival spaces include the great temple on the Capitoline. Thursday (dies Jovis) is named for him, and his metal is tin. Jupiter\'s myths mirror Zeus: he overthrew his father Saturn and ruled the Olympian gods.',
  },
  {
    culture: 'roman', number: 11, name: 'Leo',
    description: 'Leo, the Lion, is a fire sign of courage and nobility. It recalls the Nemean Lion: Hercules\' first labor was to slay this invulnerable beast, which Zeus then honored in the sky. Leo is ruled by the Sun, giving it a golden, proud spirit. The lion represents strength, royalty, and the heroic character of the sun\'s king.',
  },
  {
    culture: 'roman', number: 12, name: 'Water',
    description: 'Water was one of the four elements, embodying emotion, intuition, and life-giving flow. In classical thought, water is "cold and wet". Roman deities of water include Neptune (god of the sea) and numerous river gods and nymphs. Water symbolizes purification, healing, and the unconscious \u2013 fluidity, adaptability, and the cleansing power of the deep.',
  },
  {
    culture: 'roman', number: 13, name: 'Scorpio',
    description: 'Scorpio, the Scorpion, is a water sign of intensity and transformation. In myth, a scorpion was sent (by Artemis or Hera) to kill the great hunter Orion; after the battle both were placed in the sky as constellations. Scorpio is ruled by Mars (and in later times Pluto), coloring it with passion and power. The scorpion symbolizes transformation and challenges that conquer pride.',
  },
  {
    culture: 'roman', number: 14, name: 'Sagittarius',
    description: 'Sagittarius, the Archer, is a fire sign of adventure and wisdom. The centaur Chiron is its mythic model \u2013 a wise teacher of heroes who was later placed among the stars. Sagittarius is ruled by Jupiter (optimism) and depicted as a centaur drawing a bow. The half-man, half-horse figure symbolizes the guiding direction of heroism.',
  },
  {
    culture: 'roman', number: 15, name: 'Capricorn',
    description: 'Capricorn, the Sea-Goat, is an earth sign of ambition and discipline. In myth, it can represent Amalthea the goat (whose horn became the cornucopia of plenty) or the god Pan transforming his legs into a fish\'s tail to escape the monster Typhon. Capricorn is ruled by Saturn, giving it steady endurance and practicality.',
  },
  {
    culture: 'roman', number: 16, name: 'Mars',
    description: 'Mars (Latin: Mars) is the Roman god of war and blood, second only to Jupiter. He wields a spear and shield, often accompanied by a wolf or woodpecker. Mars was also the father of Romulus and Remus, the founders of Rome. His day is Tuesday (dies Martis) and his metal is iron. Mars embodies courage, conflict, and martial honor.',
  },
  {
    culture: 'roman', number: 17, name: 'Aquarius',
    description: 'Aquarius, the Water-Bearer, is an air sign of vision and community. It connects to Ganymede, the beautiful Trojan youth Zeus (Jupiter) placed in heaven as cupbearer. Symbolized by a man pouring water, Aquarius represents life\'s nourishment and humanitarian ideals. The water of knowledge flows freely for all.',
  },
  {
    culture: 'roman', number: 18, name: 'Pisces',
    description: 'Pisces, the Fish, is a water sign of compassion and intuition. According to myth, Aphrodite and her son Eros (Cupid) fled the monster Typhon by transforming into fish and tying themselves together. The two fish of Pisces (often shown tied by a cord) symbolize unity through faith, swimming in opposite directions yet bound together.',
  },
  {
    culture: 'roman', number: 19, name: 'Sol',
    description: 'The Sun (Latin: Sol) is the shining god who drives a chariot of fire across the sky each day. His Roman name is Sol (Greek Helios). The Sun\'s key myth is Phaethon: his mortal son begged to drive the sun-chariot and disastrously lost control, scorching earth and dying. Sunday (dies Solis) bears his name, and his metal is gold.',
  },
  {
    culture: 'roman', number: 20, name: 'Fire',
    description: 'Fire was one of the elemental forces, symbolizing transformation, passion, and creativity. In ancient theory, fire is "hot and dry", giving it consuming energy and light. The Romans worshiped the hearth goddess Vesta and the smith-god Vulcan as guardians of sacred fire. Fire cleanses and energizes, representing courage, purification, and change.',
  },
  {
    culture: 'roman', number: 21, name: 'Saturn',
    description: 'Saturn (Latin: Saturnus) was the ancient Roman god of time, agriculture and abundance. His mythical reign was a Golden Age of plenty, where peace and bounty prevailed. Saturn is father of Jupiter and his temple in Rome held the state treasury. The feast of Saturnalia (December) honored him with feasting and role-reversals. Saturday (dies Saturni) and the planet Saturn are named for him. His symbol is the sickle and his metal is lead.',
  },

  // ============================
  // GREEK DECK (22 cards)
  // ============================
  {
    culture: 'greek', number: 0, name: 'Air',
    description: 'In Greek thought, Air is one of the four classical elements and was embodied by the invisible winds and breezes of the gods. The winds, or Anemoi, are personified as deities \u2013 Boreas, Notos, Zephyrus, and Eurus \u2013 sons of Astraeus and Eos. Aeolus, the divine keeper of the winds, ruled over them from the island of Aeolia. Air symbolizes movement, breath of life, and the quick messenger aspect.',
  },
  {
    culture: 'greek', number: 1, name: 'Hermes',
    description: 'Hermes is the fleet-footed messenger of the Olympian gods. He is the trickster and guide: son of Zeus and Maia, he invented the lyre, stole Apollo\'s cattle as an infant, and became god of travel, commerce, and thieves. Astrologically Hermes corresponds to Mercury (metal: quicksilver) and is linked to the day Wednesday. His caduceus and winged sandals are iconic symbols of speed and communication.',
  },
  {
    culture: 'greek', number: 2, name: 'Selene',
    description: 'This card represents the Moon, personified in Greek myth by the goddess Selene (and sometimes by Artemis, the lunar huntress). Selene drives her silver chariot across the night sky and is famous for loving the shepherd Endymion, whom she visits each night in his enchanted sleep. The Moon\'s metal is silver and it is associated with Monday. The Moon evokes night, intuition, and the nurturing, cyclical rhythms of nature.',
  },
  {
    culture: 'greek', number: 3, name: 'Aphrodite',
    description: 'Aphrodite is the Olympian goddess of love and beauty, born from the sea-foam. She is associated with the planet Venus (metal: copper) and rules Friday. In myth she emerged at Cyprus and became famous for affairs with Ares and loves of Paris, Anchises and others. Aphrodite embodies attraction, charm, and the creative spark of love and art.',
  },
  {
    culture: 'greek', number: 4, name: 'Aries',
    description: 'Aries recalls the Golden Ram of myth. In Greek story the flying ram Chrysomallus rescued Phrixus and Helle and carried them to safety, later becoming the Golden Fleece. Zeus honored this ram by placing it among the stars as the constellation Aries. As the first sign of the zodiac, Aries symbolizes beginnings, leadership and the bold energy of spring. Traditionally ruled by Mars/Ares, Aries connects to courage and new ventures.',
  },
  {
    culture: 'greek', number: 5, name: 'Taurus',
    description: 'Taurus is the great Bull of Greek lore. The chief myth is of Europa: Zeus took the form of a beautiful white bull to woo and carry Europa safely to Crete. For this, the bull was set among the heavens. In Greek tradition Taurus represents strength and stability, linking to the earth\'s richness. In astrology Taurus is ruled by Venus/Aphrodite, highlighting its sensuous, fertile nature.',
  },
  {
    culture: 'greek', number: 6, name: 'Gemini',
    description: 'The twins Castor and Pollux (the Dioscuri) are Gemini\'s figures. In myth one brother (Pollux) was divine (son of Zeus) and the other (Castor) mortal. They shared a deep bond, adventuring together as Argonauts. When Castor died, Pollux begged Zeus to share his immortality; Zeus placed them both in the sky as the constellation Gemini. They symbolize brotherhood, duality, and the interplay of mortal and divine.',
  },
  {
    culture: 'greek', number: 7, name: 'Cancer',
    description: 'Cancer depicts the giant crab of Heracles\' labors. Hera sent this crab (called Carcinos) to distract Heracles during his battle with the Hydra. Heracles crushed the crab underfoot, and in honor Hera placed the crab among the stars as Cancer. The Cancer sign thus recalls self-sacrifice and loyalty, as well as themes of home, protection and tenacity.',
  },
  {
    culture: 'greek', number: 8, name: 'Libra',
    description: 'Libra\'s symbol of the scales evokes justice and balance in Greek myth. It is often linked to Astraea or Themis, goddesses of justice. Astraea \u2013 a virgin personification of justice \u2013 is depicted holding the scales of impartiality. In some stories she lived among humans in the Golden Age and then ascended to the heavens. Libra stands for harmony, law, and the act of weighing choices.',
  },
  {
    culture: 'greek', number: 9, name: 'Virgo',
    description: 'Virgo is the Maiden, frequently associated with Astraea (goddess of justice) or Demeter\'s daughter Persephone. In myth Astraea lived among people in the mythic Golden Age, but as humanity grew unjust she ascended to become the constellation Virgo. Virgo thus represents purity, service and the seasonal renewal of spring. It embodies the ideals of modesty and the sustaining cycle of life.',
  },
  {
    culture: 'greek', number: 10, name: 'Zeus',
    description: 'Zeus is the chief Olympian, the sky and thunder god. As son of Cronus and Rhea, he overthrew the Titans and became king of the gods on Mount Olympus. Zeus wields the thunderbolt and is symbolized by the eagle. In astrology he corresponds to Jupiter (metal: tin, ruling Thursday). In myth he fathered many gods and heroes, embodying authority, justice, and protection of order.',
  },
  {
    culture: 'greek', number: 11, name: 'Leo',
    description: 'Leo represents the mighty Nemean Lion of Hercules\' labors. In Greek myth Heracles slew this invulnerable lion as his first task, after which the lion was placed in the heavens as Leo. Thus the constellation and sign signify courage, royalty and strength. Regulus, the lion\'s "heart", is one of its brightest stars. Leo\'s lion imagery recalls noble leadership and the heroic character of the sun\'s king.',
  },
  {
    culture: 'greek', number: 12, name: 'Water',
    description: 'Water in Greek cosmology spans rivers, seas and oceans. Poseidon is the Olympian god of the sea and horses, while the Titan Oceanus and his consort Tethys personified the world-encircling ocean. Many nymphs and river gods (Potamoi) inhabit fresh waters. The element Water symbolizes adaptability, intuition and the source of life, from cosmic rivers to the Mediterranean waves.',
  },
  {
    culture: 'greek', number: 13, name: 'Scorpio',
    description: 'Scorpio is the scorpion sent against Orion. In myth Orion boasted he would slay all beasts on Earth, so Artemis (or Apollo and Artemis) sent a giant scorpion to humble him. The scorpion stung Orion and killed him; to commemorate this struggle, Zeus placed both Orion and the scorpion in the sky. Scorpio represents transformation, intensity and the idea of challenges that conquer pride.',
  },
  {
    culture: 'greek', number: 14, name: 'Sagittarius',
    description: 'Sagittarius is the centaur archer. Greek tradition links it to Chiron, the wise centaur tutor of heroes, or to Crotus, son of Pan and inventor of archery. One myth says Zeus honored Crotus (a skilled hunter who lived among the Muses) by placing him with bow and arrow among the stars. Sagittarius stands for adventure, wisdom in action, and the guiding direction of heroism.',
  },
  {
    culture: 'greek', number: 15, name: 'Capricorn',
    description: 'Capricorn, the Sea-Goat, is linked to the goat Amalthea and the god Pan. Amalthea was the goat who nursed the infant Zeus, and after her horn was broken it became the cornucopia of plenty. Pan \u2013 with goat\'s legs \u2013 dove into a river and became part goat, part fish when Typhon attacked. Thus Capricorn unites earth and sea, symbolizing nourishment, resourcefulness and the union of practicality with depth.',
  },
  {
    culture: 'greek', number: 16, name: 'Ares',
    description: 'Ares is the fiery Greek god of war and valor. He is the brutal force of battle \u2013 son of Zeus and Hera \u2013 and is less the strategist (that\'s Athena) than the raw courage and chaos of fighting. His symbols are spear and helmet, and he fathered gods of Fear and Panic. Astrologically Ares (Mars) is linked to iron and to Tuesday. Ares is a reminder of the price of war and the warrior\'s spirit.',
  },
  {
    culture: 'greek', number: 17, name: 'Aquarius',
    description: 'Aquarius is the Water-Bearer, usually identified with Ganymede, the beautiful youth of Troy. Zeus (as an eagle) abducted Ganymede to serve as cupbearer to the gods. In the sky Ganymede is Aquarius pouring a pitcher of water. This card symbolizes service, renewal and generosity. The flowing water also recalls ritual libations offered to deities, linking Aquarius to hospitality and the lifegiving flow of civilization\'s knowledge.',
  },
  {
    culture: 'greek', number: 18, name: 'Pisces',
    description: 'Pisces shows the two fish of myth. The story goes that Aphrodite and her son Eros fled the monster Typhoeus and were either carried by or turned into two fish for safety. These divine fish are then placed in the stars as the constellation Pisces. Pisces represents unity and duality (two fish bound together), sacrifice and compassion. In some traditions the fish themselves swam Aphrodite and Eros to safety, making fish sacred.',
  },
  {
    culture: 'greek', number: 19, name: 'Helios',
    description: 'The Sun is embodied by Helios (later Apollo) in Greek myth. Helios is the Titan who personifies daylight \u2013 he drives a golden chariot with fiery steeds across the sky every day. He watches over oaths and can see all things by day. As a symbol, the Sun (gold) stands for clarity, life and victory. Helios\' brilliant crown and chariot emphasize warmth and illumination. Sunday is his day.',
  },
  {
    culture: 'greek', number: 20, name: 'Fire',
    description: 'Fire in Greek myth carries the spark of innovation and transformation. The Titan Prometheus famously stole fire from the gods to give to humanity, bringing knowledge and progress. The god Hephaestus tends the divine forge and volcanoes, creating metalwork and weapons. Fire thus symbolizes craft, passion and change \u2013 it warms, destroys, and forges new forms. Fire evokes inspiration and courage.',
  },
  {
    culture: 'greek', number: 21, name: 'Kronos',
    description: 'Kronos (Cronus) is the elder Titan, lord of the Golden Age and father of Zeus. He overthrew his father Uranus and reigned until told a child would dethrone him. To prevent this, Kronos swallowed each newborn god, until Zeus escaped and forced Kronos to disgorge his siblings. Eventually Zeus banished the Titans. Kronos (later equated with Roman Saturn) is the planet Saturn (metal: lead, Saturday). He embodies time\'s passage and the cycles of generations.',
  },

  // ============================
  // NORSE DECK (22 cards)
  // ============================
  {
    culture: 'norse', number: 0, name: 'Ostara',
    description: 'Ostara (Old High German \u0112ostre) is the Germanic goddess of spring, dawn and fertility. She is traditionally celebrated at the spring equinox, symbolizing the rebirth of light and life. Her festival marks winter\'s end and the rise of the sun (the East at dawn). Ostara\'s name is linked to "Easter," reflecting themes of renewal and the returning light.',
  },
  {
    culture: 'norse', number: 1, name: 'Odin',
    description: 'Odin (Old Norse \u00d3\u00f0inn; also W\u014dden) is the chief god of the Norse pantheon, associated with war, poetry, runic magic and deep wisdom. He is famed for his relentless quest for knowledge, even sacrificing one eye for wisdom. Odin is the patron of r\u00fan (rune magic), divination and eloquence. He teaches poetry and speech (the Mead of Poetry legend) and practices sei\u00f0r (sorcery). He was equated with Mercury by the Romans.',
  },
  {
    culture: 'norse', number: 2, name: 'M\u00e1ni',
    description: 'M\u00e1ni is the personification of the Moon in Norse myth (Old Norse M\u00e1ni "Moon"). He is the brother of the sun-goddess S\u00f3l. According to the Prose Edda, the gods set M\u00e1ni on a chariot in the sky so he "guides the path of the moon and controls its waxing and waning." M\u00e1ni carries Hj\u00faki and Bil (children in the moon, per legend) and will be devoured by a wolf at Ragnar\u00f6k. He embodies the mystery of night and lunar time.',
  },
  {
    culture: 'norse', number: 3, name: 'Freyja',
    description: 'Freyja (Old Norse "Lady") is the Vanir goddess of love, beauty, fertility and sexuality. She presides over childbirth, passion and the growth of life. In addition to love, Freyja is a powerful practitioner of sei\u00f0r (shamanic magic for seeing the future) and also a battle deity. She receives half of slain warriors in her field F\u00f3lkvangr, making her a chooser of the slain. Freyja\'s passionate, radiant nature embodies sensuality and strength.',
  },
  {
    culture: 'norse', number: 4, name: 'Harpa',
    description: 'Harpa is the Old Norse name for the first month of the summer half (roughly mid-April to mid-May). It marks the turning point of spring into early summer, celebrating the returning sun and warmer days. The name Harpa ("harp") likely honors Eostre/Ostara (spring goddess). Traditional Bl\u00f3t (sacrifice) festivals to Ostara took place at Harpa\'s start. It symbolizes renewal and rebirth as nature awakens.',
  },
  {
    culture: 'norse', number: 5, name: 'Skerpla',
    description: 'Skerpla is the second month of summer (around May) in the Old Norse calendar. Its name may mean "brightness" or "clearness," reflecting longer, brighter days of late spring. During Skerpla, Norse farmers prepared fields for planting and celebrated growth. Rites honored fertility deities like Freyja and nature\'s fertility. Skerpla stands for the full unfolding of spring as life returns to the land.',
  },
  {
    culture: 'norse', number: 6, name: 'S\u00f3lm\u00e1nu\u00f0r',
    description: 'S\u00f3lm\u00e1nu\u00f0r literally means "sun month." It is the third summer month (roughly mid-June to mid-July), coinciding with the summer solstice. This is the height of summer, when the sun\'s power is greatest. The "twin forces" in its theme may reflect the interplay of light and the yet-long nights, or the need to choose one\'s path in full daylight. S\u00f3lm\u00e1nu\u00f0r symbolizes peak vitality, clarity, and the choices that come with summer\'s plenitude.',
  },
  {
    culture: 'norse', number: 7, name: 'Heyannir',
    description: 'Heyannir is the Old Norse name for the hay-harvest month (roughly mid-August to mid-September). It can also be called Tv\u00edm\u00e1nu\u00f0r ("double month") for late summer. The name means "haying" or "haymaking season." Heyannir represents the active movement of midsummer \u2013 fields are cut, animals fed, and stores gathered. It embodies the motion of community life and gratitude for abundance.',
  },
  {
    culture: 'norse', number: 8, name: 'Gorm\u00e1nu\u00f0r',
    description: 'Gorm\u00e1nu\u00f0r is the first month of winter (mid-October to mid-November). Its Old Norse name means "Slaughter Month" \u2013 the time when livestock were slaughtered and salted for winter. As autumn deepens, Gorm\u00e1nu\u00f0r falls around the autumn equinox. It symbolizes the balance of light and dark when night begins to overtake day, reflecting a divine act of balance between life (harvest) and death (winding down).',
  },
  {
    culture: 'norse', number: 9, name: 'Haustm\u00e1nu\u00f0r',
    description: 'Haustm\u00e1nu\u00f0r ("harvest month") is late autumn (mid-September to mid-October). It is the season for gathering in crops (the traditional harvest festival). This time is rich in harvest wisdom \u2013 lessons and sustenance gleaned from the year\'s labor. Communities held feasts and gave thanks for the bounty. Haustm\u00e1nu\u00f0r symbolizes collecting the "fruits" of our actions and gaining insight before winter\'s rest.',
  },
  {
    culture: 'norse', number: 10, name: 'Thor',
    description: 'Thor (Old Norse \u00de\u00f3rr) is the hammer-wielding Norse god associated with thunder, storms and immense physical strength. Protector of humanity and the gods, he ensures the cycles of nature (storms bring fertility) and battles the chaotic forces like J\u00f6rmungandr. Thor embodies cyclical renewal: storm clouds roll away after thunder, planting and growth follow rain. He represents courage and the natural order underlying storms.',
  },
  {
    culture: 'norse', number: 11, name: 'Tv\u00edm\u00e1nu\u00f0r',
    description: 'Tv\u00edm\u00e1nu\u00f0r literally means "double month" and is an alternate name for late summer (same period as Heyannir). It emphasizes abundance as if two months\' worth of growth are packed together. Symbolically, Tv\u00edm\u00e1nu\u00f0r suggests heightened radiance and vitality \u2013 times when the light and life force feel doubled. It celebrates the exuberance of summer\'s bounty and the ecstatic communal joys of feasting.',
  },
  {
    culture: 'norse', number: 12, name: 'Haustbl\u00f3t',
    description: 'Haustbl\u00f3t is the traditional Norse fall equinox feast. The term literally means "autumn sacrifice" (Haust = autumn, bl\u00f3t = sacrificial feast). It was held to honor the gods and land spirits as the growing season ended. Haustbl\u00f3t marks the descent into winter\'s dark half. It is associated with the sun\'s setting in the West and with offerings for protection through winter. The ritual emphasizes gratitude and solemn acceptance of nature\'s cycle.',
  },
  {
    culture: 'norse', number: 13, name: '\u00ddlir',
    description: '\u00ddlir is the late-autumn month (mid-November to mid-December). It is a cognate of the word "Yule," signaling the approach of midwinter. The name is linked with frost and the cold. \u00ddlir represents the threshold of winter \u2013 days are short, nights long, and the earth seems to be dying. Mythically it evokes the spirit of descent into the underworld or Hela\'s realm. A time of introspection and journeying inward.',
  },
  {
    culture: 'norse', number: 14, name: 'M\u00f6rsugur',
    description: 'M\u00f6rsugr (also J\u00f3lm\u00e1nu\u00f0r or Hr\u00fatm\u00e1nu\u00f0r) is the midwinter month (mid-December to mid-January). The Old Norse name means "fat-sucker" or "ram-month," referring to winter\'s feast time. It is the heart of winter and Yule celebrations. Symbolically, M\u00f6rsugr stands for inner alchemy and integration. As the darkest nights reign, seeds of inner work mature \u2013 integrating wisdom and preparing for renewal.',
  },
  {
    culture: 'norse', number: 15, name: '\u00deorri',
    description: '\u00deorri is a late-winter month (mid-January to mid-February), named after a legendary figure (Thorri, a king of winter). Historically, midwinter festivals (\u00deorrabl\u00f3t) are held in this time. \u00deorri symbolizes frost, trial and confinement. It\'s the coldest, most challenging part of winter, testing endurance. Spiritually, it represents the soul\'s "inward bondage" \u2013 facing inner fears and strengths during hardship.',
  },
  {
    culture: 'norse', number: 16, name: 'T\u00fdr',
    description: 'T\u00fdr (Old Norse T\u00fdr) is the Norse god of war and heroic glory, best known for sacrificing his hand to bind the wolf Fenrir. He embodies honor, duty and the establishment of cosmic law. The breaking of T\u00fdr\'s hand is the bold rupture: he boldly ruptured his own body to keep Fenrir (chaos) chained. This act exemplifies divine justice \u2013 he upholds order at great personal cost.',
  },
  {
    culture: 'norse', number: 17, name: 'G\u00f3a',
    description: 'G\u00f3u (or G\u00f3a) is a pre-spring month (mid-February to mid-March), the daughter of \u00deorri in myth. It heralds the approach of spring. G\u00f3a stands for vision and clear insight. Late winter skies are often crisp and starry, suggesting clarity. As light gradually returns, this period is a time of prophetic dreaming and seeing one\'s path forward out of winter.',
  },
  {
    culture: 'norse', number: 18, name: 'Einm\u00e1nu\u00f0r',
    description: 'Einm\u00e1nu\u00f0r ("one-month") is the final winter month (mid-March to mid-April). It closes out the old year and ends winter\'s cycle. Symbolically it is a liminal time of dreams and closure. Winter\'s "long night" ends, and the world prepares to rebirth. Einm\u00e1nu\u00f0r invites dreaming and wrapping up old lessons before the new cycle of life begins with Ostara.',
  },
  {
    culture: 'norse', number: 19, name: 'S\u00f3l',
    description: 'The Sun (Old Norse S\u00f3l or Sunna) is the personified sun-goddess who drives the sun-chariot across the sky. She is M\u00e1ni\'s sister in myth and the life-giving center of the cosmos. The Sun embodies light, warmth and sustenance. All growth and vision depend on her. As the "central solar force," she represents clarity, truth and the divine spark in all creation.',
  },
  {
    culture: 'norse', number: 20, name: 'Yule',
    description: 'Yule (Old Norse J\u00f3l) is the midwinter feast marking the winter solstice. It was celebrated by Germanic peoples as the rebirth of the sun. Norse tradition holds that on the solstice the sun begins to return. Yule symbolizes cosmic rebirth and the rekindling of life\'s warmth. As the sun "turns" from its winter descent, people feast and honor light, reflecting the turning point from death back to life.',
  },
  {
    culture: 'norse', number: 21, name: 'Saturn',
    description: 'Saturn (Latin Saturnus) is an ancient Roman god of time, cycles and renewal. He embodies the boundaries of time, overseeing the cyclic order of seasons and ages. Saturn was venerated for governing transitions (the passing of years) and imposing limits. He represents structure, discipline and the dissolution-rebirth cycle: every ending (winter) contains the seed of a new beginning (spring).',
  },

  // ============================
  // BABYLONIAN DECK (22 cards)
  // ============================
  {
    culture: 'babylonian', number: 0, name: 'Enlil',
    description: 'Enlil was the chief Mesopotamian god of air and wind. His name meant "Lord Wind," and ancient hymns celebrate how stormy winds issue from his mouth as divine command. He was often called "Lord of the Air" and credited with issuing the decrees of destiny.',
  },
  {
    culture: 'babylonian', number: 1, name: 'Nabu',
    description: 'Nabu (Akkadian Nab\u00fb) was the patron god of scribes, wisdom and intellectual arts. He was worshipped as a divine scribe or "god of wisdom," protector of literacy and the rational arts. In Babylonian astronomy Nabu was identified with the planet Mercury.',
  },
  {
    culture: 'babylonian', number: 2, name: 'Sin',
    description: 'Sin (Sumerian Nanna) is the Mesopotamian moon god. He is explicitly called "lord of wisdom" in early hymns. As the moon-god he ruled the lunar cycles that governed calendars, fertility and tides. He was believed to bestow prosperity, governing the rise of the waters and the quantity of dairy, in his role as a lunar lifegiver.',
  },
  {
    culture: 'babylonian', number: 3, name: 'Ishtar',
    description: 'Ishtar (Akkadian, Sumerian Inanna) was the great goddess of love, beauty, war and fertility. In early texts she is described as beautiful and desirous, yet also the patron of warriors. In later tradition Ishtar became strongly identified with the planet Venus. She is described as the goddess of war and sexual love, an astral deity associated with the planet Venus.',
  },
  {
    culture: 'babylonian', number: 4, name: 'Marduk',
    description: 'Marduk was the patron god of Babylon, later exalted as king of the gods. In the creation epic En\u016bma Eli\u0161, Marduk defeats the chaos dragon Tiamat and fashions the cosmos from her body, establishing order. After this he is proclaimed "king of the gods" and "source of their authority." The deck associates Marduk with the Aries ram figure, symbolizing new beginnings and authority.',
  },
  {
    culture: 'babylonian', number: 5, name: 'Gugalanna',
    description: 'Gugalanna (also called Guanna) is identified in Sumerian myth as the "Bull of Heaven." He appears as the husband of the underworld goddess Ereshkigal and is equated with the Bull of Heaven that Gilgamesh and Enkidu slay in the Epic of Gilgamesh. Thus Gugalanna embodies the bull figure, corresponding to Taurus.',
  },
  {
    culture: 'babylonian', number: 6, name: 'Mash-mashu',
    description: '"Mash-mashu" refers to the twin stars of the constellation Gemini. Babylonian astronomy split the Twins into two: Castor was called Mash-mashu-Mahru ("the western one of the Twins") and together with Pollux they formed Mas-tab-ba-gal-gal ("the Great Twins"). These twin star-deities align naturally with the zodiac sign Gemini.',
  },
  {
    culture: 'babylonian', number: 7, name: 'Alul',
    description: 'The zodiac sign Cancer is "the Crab." In Babylonian astrological lists the sign Cancer is literally called "the Crab." The names Alul or Nangar likely refer to local words for the crab figure. This card evokes the crab constellation of the Mesopotamian sky.',
  },
  {
    culture: 'babylonian', number: 8, name: 'Zibanitu',
    description: 'Libra is the scales or balance. Babylonian astronomy names Libra as "the Balance." In Sumerian the word Zib\u0101nu/Zib\u0101nitum literally means "weighing scales." Ancient texts gloss the constellation Libra as Zib\u0101nu, "weighing scales," reflecting its symbol of justice and equilibrium.',
  },
  {
    culture: 'babylonian', number: 9, name: 'Shala',
    description: 'Virgo was envisioned as a goddess with a sheaf of grain. In the MUL.APIN star compendium, part of the constellation we call Virgo was explicitly termed "the Furrow," representing the grain-goddess Shala (Shulpae) with her ear of barley. This aligns Shala, goddess of grain and fertility, with the Virgo archetype.',
  },
  {
    culture: 'babylonian', number: 10, name: 'Ninurta',
    description: 'Ninurta (also Ningirsu) was a warrior god of storms and agriculture. In early myth he slays the demon Asag and uses his body to build the Tigris and Euphrates canals \u2013 a feat linking him to fertility and plowing. By later times Ninurta is chiefly revered as a heroic warrior-deity. He carried Jupiter\'s influence in Babylonian astrology.',
  },
  {
    culture: 'babylonian', number: 11, name: 'Latarak',
    description: 'Latarak (Sumerian Urgul\u00fb) is a protective deity associated with the lion. Lexical lists translate Latarak\'s name as urgul\u00fb, meaning "lion." He is often depicted wearing a lion-skin and serves as a guardian figure. Thus Latarak embodies the lion\'s strength, corresponding to Leo.',
  },
  {
    culture: 'babylonian', number: 12, name: 'Ea',
    description: 'Ea (Sumerian Enki) is the god of fresh water (the subterranean Apsu), wisdom and creation. He is described as the lord of the Waters/Apsu. In mythology Ea is a source of knowledge and magical purification: ritual cleansing waters were even called "Ea\'s water." He orders creation and bestows insight.',
  },
  {
    culture: 'babylonian', number: 13, name: 'Ishara',
    description: 'Ishara (I\u0161\u1e2bara) was a Mesopotamian goddess whose symbol was the scorpion. Artifacts show her only in scorpion form. Astronomical texts associate her name with the scorpion star: one canto of MUL.APIN calls "the Scorpion" star "I\u0161\u1e2bara, goddess of all inhabited lands." Hence Ishara and the Sumerian word girtab ("scorpion") are linked to Scorpio.',
  },
  {
    culture: 'babylonian', number: 14, name: 'Pabilsag',
    description: 'Pabilsag is a warrior-hero god depicted as a bow-wielding archer. He is mentioned in mythology alongside Ninurta and the healing goddess Ninisina. In astronomy, Pabilsag was the divine representation of the constellation Sagittarius. As an archer-hero, he fits the zodiac archer.',
  },
  {
    culture: 'babylonian', number: 15, name: 'Suhurmashu',
    description: 'Capricornus, the sea-goat, was known to the Sumerians as Suhur-mash-Ha, literally "goat-fish." Babylonian star lore explicitly identifies Capricornus as the hybrid goat-fish Suhur-mashu. This amphibious creature symbolizes winter storms or fertility of rain (goat on land, fish at sea).',
  },
  {
    culture: 'babylonian', number: 16, name: 'Nergal',
    description: 'Nergal is the god of war, disease and the underworld. He became king of the underworld and was feared as a pestilential bringer of death. Texts describe him as accompanying armies yet ensuring peace through terror. In astronomy Nergal corresponds to Mars, the red planet of war.',
  },
  {
    culture: 'babylonian', number: 17, name: 'Gula',
    description: 'Gula (also Nintinugga) is the goddess of healing and restoration. In texts she is explicitly a divine physician, often symbolized by dogs. In Babylonian star lore the constellation Aquarius (the water-bearer) was called Gula and sometimes associated with Ea (the god of water). Rammanu is an Akkadian epithet of the storm god Hadad, echoing watery, life-giving aspects.',
  },
  {
    culture: 'babylonian', number: 18, name: 'Anunitum',
    description: 'Pisces, the twin fishes, was associated with the goddess Anunitum (Anunitu), an Ishtar-like deity. Astrological texts say Annunitum\'s name was given to the "eastern fish" of Pisces. The Babylonian term kun means "two tails" and was applied to Pisces. This sign was linked to Anunitum and Simmah, goddesses envisioned as the Euphrates and Tigris rivers.',
  },
  {
    culture: 'babylonian', number: 19, name: 'Shamash',
    description: 'Shamash (Sumerian Utu) is the great sun god. He traversed the sky to bring light and life, and was the divine judge of gods and men. Shamash "exercised the power of light over darkness and evil" and thus became known as "the god of justice and equity." The famous Code of Hammurabi was said to be received from Shamash. He bears the solar disk as his symbol.',
  },
  {
    culture: 'babylonian', number: 20, name: 'Gibil',
    description: 'Gibil (Akkadian Girra) is the god of fire, the forge and smithcraft. He embodies both the destructive and creative power of flame. Texts note he "was a god associated with fire, both in its positive and negative aspects" and that he "played a role in ritual purification." His symbol is a torch. In myths he heats the forge and purifies by burning away impurity.',
  },
  {
    culture: 'babylonian', number: 21, name: 'Ninurta/Ninazu',
    description: 'This final card combines Ninurta with Ninazu. Ninazu is another warrior-type god associated with snakes and vegetation. Together they embody the stern, "Saturnine" qualities of fate, agriculture and judgment. Ninurta is linked to farming (patron of farmers) and destiny (slayer of demons), while Ninazu rules the subterranean realm. The combined symbolism suggests endings and legacies for humanity\'s labors.',
  },

  // ============================
  // VEDIC DECK (22 cards)
  // ============================
  {
    culture: 'vedic', number: 0, name: 'V\u0101yu',
    description: 'V\u0101yu is the Vedic wind deity, revered as the cosmic breath (pr\u0101\u1e47a) that sustains life. In the Rigveda he is a principal god, and the Upanishads praise him as Pr\u0101\u1e47a, the "life-breath of the world." In later Hindu tradition V\u0101yu becomes one of the dikp\u0101las (directional guardians), ruling the northwest quarter. He is the father of heroes like Hanuman and Bh\u012bma.',
  },
  {
    culture: 'vedic', number: 1, name: 'Budha',
    description: 'Budha is the deified planet Mercury. In Sanskrit texts he represents intelligence, communication and learning. Hindu astrology personifies Mercury as a benevolent deity associated with the mind and eloquence. Mythologically Budha is described as the son of Chandra (the Moon) and Tara, and he is often invoked for wisdom and clarity of thought.',
  },
  {
    culture: 'vedic', number: 2, name: 'Chandra',
    description: 'Chandra (also called Soma) is the lunar deity in Vedic tradition. He personifies the Moon and is linked with the night, vegetation and nourishment of the earth. Chandra is counted among the Navagraha (nine planetary deities). In Hindu cosmology, Chandra drives a celestial chariot each night. He is seen as a gentle, nurturing god who influences the mind and body through the lunar cycle.',
  },
  {
    culture: 'vedic', number: 3, name: 'Shukra',
    description: 'Shukra is the Sanskrit name for the planet Venus, also personified as a sage (\u015aukracharya) in Hindu myth. The name means "bright" or "clear." Shukra became the guru (teacher) of the asuras (demons) and is famed for his wisdom and magical knowledge. As Venus he symbolizes beauty, luxury and the arts. Shukra is regarded as a beneficent graha (planet), bestowing refinement and prosperity.',
  },
  {
    culture: 'vedic', number: 4, name: 'Mesha',
    description: 'Mesha is the Sanskrit term for the zodiac sign Aries, symbolized by the ram. The word Mesha literally means "ram" or "sheep," signifying new beginnings and creative energy. It is the first (cardinal) fire sign of the Hindu zodiac. In Vedic astrology, Mesha is governed by Mars (Mangala), endowing it with courage and initiative.',
  },
  {
    culture: 'vedic', number: 5, name: 'Vrishabha',
    description: 'Vrishabha is the Sanskrit name for Taurus, the bull. In Vedic symbolism it represents stability, fertility and material abundance. The bull\'s traits of strength and resilience reflect Taurus\' earthy nature. Taurus is an earth sign ruled by Venus (Shukra). The Moon (Chandra) is exalted in Vrishabha. The sign is associated with comfort, wealth and the enjoyment of life\'s pleasures.',
  },
  {
    culture: 'vedic', number: 6, name: 'Mithuna',
    description: 'Mithuna literally means "pair" or "twins," representing the dual nature of Gemini. It stands for intellectual exchange and communication. In Vedic astrology Mithuna is an air sign governed by Budha (Mercury). Mercury\'s rulership emphasizes Gemini\'s associations with mental agility, speech and learning.',
  },
  {
    culture: 'vedic', number: 7, name: 'Karka',
    description: 'Karka (also Karkata) is the name for Cancer, symbolized by the crab. It is a watery, movable (cardinal) sign associated with emotion, nurture and the home. Karka is ruled by Chandra (the Moon). The Moon\'s governance highlights Cancer\'s sensitivity and cyclical nature, as the Moon waxes and wanes.',
  },
  {
    culture: 'vedic', number: 8, name: 'Tula',
    description: 'Tula is the Sanskrit name for Libra, symbolized by the scales. This sign represents balance, harmony and justice. Ancient descriptions note that Libra is depicted as a set of scales that balance material and spiritual life. In Vedic astrology Tula is an airy, movable sign ruled by Shukra (Venus). The Venus rulership underscores Libra\'s associations with beauty, partnership and social grace.',
  },
  {
    culture: 'vedic', number: 9, name: 'Kanya',
    description: 'Kanya means "maiden" and is the name for Virgo, an earth sign associated with purity, service and refinement. In Jyotisha, Virgo is seen as "consciousness in bondage" that aspires to higher ideals. Kanya is ruled by Budha (Mercury). Mercury\'s influence brings focus on intellect, discrimination and analytical skills.',
  },
  {
    culture: 'vedic', number: 10, name: 'Brihaspati',
    description: 'Brihaspati is the Vedic guru (teacher) of the devas (gods), associated with fire and piety. In the Rigveda he appears as the counselor of the gods, the lord of sacred speech and cosmic order. Later tradition identifies Brihaspati with the planet Jupiter. As Guru (Jupiter) he is revered for wisdom and expansion, the divine teacher whose blessings bring knowledge and spiritual growth.',
  },
  {
    culture: 'vedic', number: 11, name: 'Simha',
    description: 'Simha is Sanskrit for "lion," symbolizing Leo. This is a fiery fixed sign associated with leadership, courage and creativity. Vedic sources describe Simha as embodying the divine urge to procreate and manifest creation. Leo is ruled by Surya (the Sun). The Sun\'s rulership gives Simha its radiant confidence and authority.',
  },
  {
    culture: 'vedic', number: 12, name: 'Varu\u1e47a',
    description: 'Varu\u1e47a is one of the great Vedic gods, originally the sovereign of \u1e5bta (cosmic law) and the primeval waters. He presides over Apas, the celestial and earthly waters, and is called Sindhu-pati (Lord of the Ocean) in the Rigveda. In later tradition Varu\u1e47a is named among the dikp\u0101las as the guardian of the West. He is invoked as the judge who binds the wicked and sustains cosmic order.',
  },
  {
    culture: 'vedic', number: 13, name: 'Vrishchika',
    description: 'Vrishchika is Scorpio, the eighth sign, symbolized by the scorpion. It is a fixed water sign noted for intensity, passion and transformation. The scorpion emblem hints at hidden power and regeneration. In Vedic astrology Scorpio is governed by Mangala (Mars). Mangala\'s martial energy gives Vrishchika its courage and willpower.',
  },
  {
    culture: 'vedic', number: 14, name: 'Dhanu',
    description: 'Dhanu is Sanskrit for "bow" (Sagittarius), symbolized by an archer or centaur. It represents the spiritual quest and the transforming of the base into the noble. Vedic literature describes Dhanu as a religious, fiery sign that "unfolds divine essence" and leads to broader consciousness. Sagittarius is a fire sign ruled by Guru (Jupiter), highlighting themes of wisdom, expansion and faith.',
  },
  {
    culture: 'vedic', number: 15, name: 'Makara',
    description: 'Makara means "sea-creature" (often depicted as a crocodile-goat hybrid) and denotes Capricorn. It is an earth sign associated with discipline, karma and spiritual aspiration through hard work. Capricorn is ruled by Shani (Saturn). Shani\'s influence makes Makara a sign of structure, responsibility and endurance.',
  },
  {
    culture: 'vedic', number: 16, name: 'Mangala',
    description: 'Mangala is the Vedic name for Mars, the red planet. He is worshipped as the god of war, strength and raw energy. His names (Lohita "the red one") and iconography (riding a ram, carrying weapons) emphasize courage and martial prowess. In mythology Mangala is often described as the son of Bh\u016bmi (Earth), reflecting his earthy, fiery nature. He embodies righteous anger and determination.',
  },
  {
    culture: 'vedic', number: 17, name: 'Kumbha',
    description: 'Kumbha means "pitcher" and is Aquarius, symbolized by a water-bearer. In Vedic imagery the water stands for the universal life-force and purification of the soul. Aquarian energy is tied to self-sacrifice for higher ideals and the flow of divine inspiration. Aquarius is an air sign ruled by Shani (Saturn), emphasizing its link with reform and breaking old patterns.',
  },
  {
    culture: 'vedic', number: 18, name: 'Meena',
    description: 'Meena means "fish" and is Pisces, the final sign of the zodiac. It is depicted as two fish swimming in opposite directions, symbolizing the end of worldly striving and the merging of the individual soul with the universal. Vedic sages called Pisces Antyaya (the end) or Yasha (glory). Pisces is a watery, common (mutable) sign ruled by Guru (Jupiter), lending it a spiritual, compassionate quality.',
  },
  {
    culture: 'vedic', number: 19, name: 'Surya',
    description: 'Surya is the personification of the Sun in Vedic cosmology. He is one of the principal deities, revered as the source of light, life and wisdom. The Rigveda contains hymns to S\u016brya as the "rising sun" who dispels darkness and empowers knowledge, goodness and all life. Iconographically he rides a chariot drawn by seven horses (symbolizing the days of the week and the spectrum of light).',
  },
  {
    culture: 'vedic', number: 20, name: 'Agni',
    description: 'Agni is the Vedic fire god and a chief deity of the Rigveda. He is invoked in nearly every Vedic sacrificial ritual, for he is the "mouth of the gods" who carries offerings from earth to heaven. Agni exists on three levels \u2013 as earthly fire, atmospheric lightning, and the sun \u2013 making him the vital mediator between humans and the divine. He symbolizes transformation, purification, and inner spiritual fire.',
  },
  {
    culture: 'vedic', number: 21, name: 'Shani',
    description: 'Shani is the divine personification of the planet Saturn. He is revered as the stern lord of karma and justice, governing time and the consequences of one\'s actions. Shani dispenses rewards or hardships according to each person\'s thoughts, speech and deeds. In myth Shani is the son of Surya (the Sun) and Chhaya (Shadow). He is often depicted riding a crow or buffalo, symbolizing the heavy but purifying burden of karmic law.',
  },

  // ============================
  // ISLAMIC DECK (22 cards)
  // ============================
  {
    culture: 'islamic', number: 0, name: 'al-Haw\u0101\u02be',
    description: 'Air (al-Haw\u0101\u02be) is one of the four classical elements in Islamic and Greco-Arab natural philosophy. It is described as a light, hot, and moist element that occupies the space between Water and Fire. Air is associated with the vital breath (Arabic nafas or r\u016b\u1e25), the animating spirit \u2013 it enters into the breath and enables movement and life throughout the body. Air represents communication, change, and the soul\'s inspiration.',
  },
  {
    culture: 'islamic', number: 1, name: '\u02bfU\u1e6d\u0101rid',
    description: 'Mercury (\u02bfU\u1e6d\u0101rid in Arabic) is one of the seven classical planets known to medieval Islamic astronomers. In Greco-Roman mythology, Mercury is identified with Hermes, the swift messenger of the gods. In astrology Mercury governs communication, intellect, and travel. Arabic scholars of the Islamic Golden Age noted its rapid motion and visibility only near sunrise or sunset. Mercury represents intelligence, messages, and the power of words.',
  },
  {
    culture: 'islamic', number: 2, name: 'al-Qamar',
    description: 'The Moon (al-Qamar in Arabic) is referred to as one of the two great luminaries in astrology. Al-Qamar signifies emotion, intuition, and the subconscious, governing rhythms, cycles, and motherly instincts. The Moon has special significance in Islam \u2013 the Islamic calendar is lunar, and the crescent moon is an enduring symbol. The Moon stands for inner knowledge, changing phases of the soul, and intuitive wisdom.',
  },
  {
    culture: 'islamic', number: 3, name: 'al-Zuhara',
    description: 'Venus (al-Zuhara in Arabic, meaning "the bright one") is the planet of love and beauty, associated with the goddess Aphrodite. Arabic astronomers recognized al-Zuhra as a brilliant star \u2013 the morning and evening star. In astrology, Venus governs love, attraction, art, and harmony, embodying feminine energy and aesthetic sensibility. Venus represents affection, beauty, and desire.',
  },
  {
    culture: 'islamic', number: 4, name: 'al-\u1e24amal',
    description: 'Aries (al-\u1e24amal in Arabic, literally "the Ram") is the first sign of the zodiac. It is a Fire sign noted for energy and initiative, traditionally ruled by Mars, which imparts courage and assertiveness. As the Spring equinox sign, Aries heralds the start of the astrological year with a burst of activity. In Arabic star lore, al-\u1e24amal refers to the ram constellation marking the spring season. Aries signifies beginnings, leadership, and assertive willpower.',
  },
  {
    culture: 'islamic', number: 5, name: 'al-Thawr',
    description: 'Taurus (al-Thawr, "the Bull" in Arabic) is the second zodiac sign, symbolized by the bull \u2013 an emblem of strength, stability, and perseverance. It is an Earth sign ruled by Venus, giving it an affinity for comfort, art, and sensual pleasures. The Arabic name al-Thawr directly means a bull and reflects the ancient image of this constellation as a mighty bull. Taurus represents stability, endurance, and the fruitful abundance of the earth.',
  },
  {
    culture: 'islamic', number: 6, name: 'al-Jawz\u0101\u02be',
    description: 'Gemini (al-Jawz\u0101\u02be, often interpreted as "the Twins") is the third sign of the zodiac. Gemini is an Air sign noted for versatility and intellect, ruled by Mercury. Gemini individuals are adaptable, inquisitive, and communicative, excelling at gathering information and connecting ideas. Historically, Arabic astronomy called this sign Al-Taw\u02beam\u0101n ("the Two Twins"). Gemini stands for duality, communication, and the interplay of ideas.',
  },
  {
    culture: 'islamic', number: 7, name: 'al-Sara\u1e6d\u0101n',
    description: 'Cancer (al-Sara\u1e6d\u0101n, "the Crab") is the fourth zodiac sign. It is a Water sign ruled by the Moon, imbuing Cancer with sensitive and nurturing qualities. Cancer governs home, family, and deep emotions. The Arabic term al-Sara\u1e6d\u0101n literally means a crab. Cancer marked the summer solstice in ancient times and is associated with the gateway of life. Cancer represents emotional depth, care, and the protective shell we form around what we hold dear.',
  },
  {
    culture: 'islamic', number: 8, name: 'al-M\u012bz\u0101n',
    description: 'Libra (al-M\u012bz\u0101n, "the Balance/Scales") is symbolized by scales denoting balance and justice. Libra is an Air sign governed by Venus, giving it an affinity for harmony, beauty, and relationships. In Arabic, al-M\u012bz\u0101n clearly refers to weighing scales, a concept tied to justice (the word appears in the Qur\'an to denote balance and fairness). Libra embodies justice, harmony, and the principle of balance.',
  },
  {
    culture: 'islamic', number: 9, name: 'al-\u02bfAdhr\u0101\u02be',
    description: 'Virgo (al-\u02bfAdhr\u0101\u02be, "the Virgin") is represented by a maiden carrying a sheaf of wheat (signifying harvest and wisdom). It is an Earth sign ruled by Mercury, associated with analysis, meticulousness, and service. The Arabic name explicitly means "the virgin." In Islamic astronomical manuscripts, Virgo was sometimes illustrated as a maiden on a throne. Virgo stands for purity, precision, and devoted labor.',
  },
  {
    culture: 'islamic', number: 10, name: 'al-Mushtar\u012b',
    description: 'Jupiter (al-Mushtar\u012b in Arabic) is the largest of the classical planets and known as the Greater Benefic in astrology. In Roman tradition Jupiter is equivalent to Zeus, the king of the Greek gods. Jupiter signifies expansion, luck, philosophy, and benevolence. In Arabic al-Mushtar\u012b carries a connotation of "the one who is rich" or "the patron." Jupiter represents growth, fortune, and higher learning.',
  },
  {
    culture: 'islamic', number: 11, name: 'al-Asad',
    description: 'Leo (al-Asad, "the Lion") is the fifth sign of the zodiac, synonymous with courage and royalty. It is a Fire sign ruled by the Sun, imbuing Leo with radiance and confidence. Leo is characterized by creativity, leadership, and generosity. The Arabic name al-Asad means "the lion." Leo stands for power, charisma, and the heart\'s courage \u2013 the inner monarch that encourages us to shine and lead.',
  },
  {
    culture: 'islamic', number: 12, name: 'al-M\u0101\u02be',
    description: 'Water (al-M\u0101\u02be) is one of the four elemental building blocks of the world. In Islamic cosmology and Unani medicine, Water is a heavy, cold, and moist element. Water is considered the source of life and cohesion: "Water has especially a life-giving power, since many animals originated in water, and the seed of all animals is liquid." Water embodies the flow of feelings, connection, healing, and nourishment of the soul.',
  },
  {
    culture: 'islamic', number: 13, name: 'al-\u02bfAqrab',
    description: 'Scorpio (al-\u02bfAqrab, "the Scorpion") is the eighth zodiac sign. It is a Water sign traditionally ruled by Mars, giving Scorpio an intense and transformative quality. Scorpio is associated with depth, secrets, death and rebirth, and power. Scorpios are passionate, resourceful, and mysterious, unafraid to delve into profound aspects of life. Scorpio represents transformation, hidden truth, and the cycles of ending and renewal.',
  },
  {
    culture: 'islamic', number: 14, name: 'al-R\u0101m\u012b',
    description: 'Sagittarius (al-R\u0101m\u012b, "the Archer") is the ninth sign of the zodiac, represented as a centaur archer. Also known in Arabic as al-Qaws ("the Bow"). Sagittarius is a Fire sign ruled by Jupiter, giving Sagittarians a questing, optimistic, and adventurous spirit. The archer\'s arrow symbolizes aiming for lofty goals or higher truth. Sagittarius stands for expansion, exploration, and the pursuit of wisdom.',
  },
  {
    culture: 'islamic', number: 15, name: 'al-Jad\u012b',
    description: 'Capricorn (al-Jad\u012b, "the Kid/Goat") is the tenth zodiac sign, symbolized by a mountain goat known for sure-footed determination. It is an Earth sign ruled by Saturn, lending a serious, disciplined nature. In Arabic, al-Jad\u012b literally means a young goat. Capricorn signifies achievement through effort, the wisdom of age, and climbing steadily toward mastery.',
  },
  {
    culture: 'islamic', number: 16, name: 'al-Mirr\u012bkh',
    description: 'Mars (al-Mirr\u012bkh in Arabic) is the red planet, named after the Roman god of war. In Arabic astronomy Mars was well-known for its reddish color and was sometimes poetically called "Merrikh the Blazing." Mars represents energy, aggression, and action, signifying willpower, conflict, and the force that pushes forward. Mars stands for strength, initiative, and the purifying fire of challenge.',
  },
  {
    culture: 'islamic', number: 17, name: 'S\u0101kib al-m\u0101\u02be',
    description: 'Aquarius (S\u0101kib al-m\u0101\u02be, "Pourer of Water"), also called al-Dalw ("the Bucket"). Its symbol is the Water-Bearer, a figure pouring water from a jar representing knowledge being shared. Aquarius is actually an Air sign ruled by Saturn. It is known for progressive, independent, and humanitarian qualities. In Islamic tradition it was sometimes identified with the figure Idris or Enoch. Aquarius embodies innovation, altruism, and humanitarian vision.',
  },
  {
    culture: 'islamic', number: 18, name: 'al-\u1e24\u016bt',
    description: 'Pisces (al-\u1e24\u016bt, "the Fish") is the twelfth and final sign of the zodiac, represented by two fishes swimming in opposite directions. It is a Water sign ruled by Jupiter, associated with dreams and spirituality. Pisces is known for empathy, imagination, and sensitivity. The Arabic word \u1e25\u016bt means a fish (or large fish). Pisces represents spiritual insight, compassion, and the flow between worlds.',
  },
  {
    culture: 'islamic', number: 19, name: 'al-Shams',
    description: 'The Sun (al-Shams in Arabic) is the central star and one of the seven classical planets. In astrology the Sun represents the core self, vitality, and ego. The Arabic name al-Shams is feminine in grammar and features prominently in Islamic culture (e.g., S\u016brat ash-Shams in the Qur\'an). The Sun governs Leo and signifies leadership, creativity, and life force. The Sun card radiates consciousness, success, and joy.',
  },
  {
    culture: 'islamic', number: 20, name: 'al-N\u0101r',
    description: 'Fire (al-N\u0101r) is one of the four primary elements, characterized in Islamic alchemical writings as hot, dry, and the lightest element. Fire is associated with heat, energy, and transformation \u2013 it "matures, refines, and intermingles with all things," acting as a catalyst for change. Fire corresponds to willpower and the spirit; the element of passion and intensity. The Arabic word n\u0101r means fire. Fire represents energy, will, and cleansing power.',
  },
  {
    culture: 'islamic', number: 21, name: 'Zuhal',
    description: 'Saturn (Zuhal in Arabic) is the outermost planet of the seven classical planets, noted for its slow movement. In astrology Saturn embodies structure, limitation, discipline, and wisdom through hardship. It is called the Greater Malefic because it brings challenges, lessons, and karmic consequences. Saturn rules Capricorn and Aquarius. The Arabic name Zuhal has been used since pre-Islamic times. Saturn stands for completion, worldly wisdom, and the tests that forge strength.',
  },

  // ============================
  // MEDIEVAL CHRISTIANITY DECK (22 cards)
  // ============================
  {
    culture: 'christian', number: 0, name: 'Matthew',
    description: 'Matthew the Evangelist is symbolized by a winged man or angel, representing Christ\'s human nature and reason. In esoteric terms this figure is linked to the Air element and the zodiac sign Aquarius (the "man"), one of the four fixed signs. Matthew\'s Gospel emphasizes Jesus\'s humanity and teachings, reflecting the intellectual and communicative qualities associated with air. This iconography comes from Ezekiel\'s vision of the four living creatures.',
  },
  {
    culture: 'christian', number: 1, name: 'Raphael',
    description: 'Raphael is the archangel traditionally associated with the planet Mercury, known as the angel of healing, knowledge, and journeys. In the Book of Tobit, Raphael guides Tobias on a long journey and heals his family, mirroring Mercury\'s domain over travel and medicine. Medieval scholars explicitly linked Raphael to Mercury, aligning his quick and clever nature with the planetary messenger. Raphael\'s name means "God heals."',
  },
  {
    culture: 'christian', number: 2, name: 'Gabriel',
    description: 'Gabriel is the archangel associated with the Moon, revered as the divine messenger who announced the birth of Christ. Authors have placed the Moon under Gabriel\'s charge because of the angel\'s role in motherhood and revelation. The Moon\'s qualities of changeability and reflection resonate with Gabriel\'s function in delivering prophetic messages and nurturing new beginnings. In Kabbalistic tradition, Gabriel is linked to the sephira Yesod.',
  },
  {
    culture: 'christian', number: 3, name: 'Haniel',
    description: 'Haniel (also Hanael or Anael) is the archangel of Venus, embodying grace, beauty, and love. The name Haniel means "Joy of God" or "Grace of God." Traditionally depicted in emerald green robes with symbols like roses and a lit lantern, Haniel\'s imagery is intertwined with Venusian themes of fertility, art, and passion. Haniel nurtures compassion and creativity, inspiring love and friendship in keeping with Venus\'s gentle influence.',
  },
  {
    culture: 'christian', number: 4, name: 'Aries',
    description: 'Aries is the first sign of the zodiac (March 21\u2013April 19), symbolized by the Ram and associated with Fire. Aries is a cardinal fire sign ruled by Mars, known for boldness, courage, and initiating energy. Those born under Aries are often described as natural leaders. The ram\'s horns have also been linked to sacrificial imagery, and in a Christian context Aries\'s spring season heralds new beginnings \u2013 a parallel to the resurrection theme of Easter.',
  },
  {
    culture: 'christian', number: 5, name: 'Taurus (Luke)',
    description: 'Taurus (April 20\u2013May 20) is an earth sign represented by the Bull or Ox. In Christian iconography the Ox is the symbol of St. Luke the Evangelist, associated with sacrifice and service. Luke\'s Gospel begins with a priest offering sacrifice in the Temple, and the ox signifies Christ\'s priestly role and sacrifice for redemption. Taurus\'s stability and earthly dedication reflect Luke\'s emphasis on the steadfast, sacrificial aspect of Jesus\'s ministry.',
  },
  {
    culture: 'christian', number: 6, name: 'Gemini',
    description: 'Gemini (May 21\u2013June 21) is a mutable air sign symbolized by the Twins. Geminis thrive on intellectual stimulation and are renowned for their quick wit, eloquent communication, and dual nature. Ruled by Mercury, this sign embodies adaptability and curiosity. The Twins motif reflects an intrinsic duality: Geminis can see both sides of a situation and effortlessly switch between roles. They are the communicators of the zodiac.',
  },
  {
    culture: 'christian', number: 7, name: 'Cancer',
    description: 'Cancer (June 22\u2013July 22) is a water sign symbolized by the Crab, known for deep emotional sensitivity and protective nature. Cancer is nurturing, empathetic, and home-loving, with a powerful capacity for healing. Ruled by the Moon, Cancer carries intuition and a gentle, changeable temperament. The Crab reflects the Cancerian tendency to guard soft inner feelings with a tough exterior.',
  },
  {
    culture: 'christian', number: 8, name: 'Libra',
    description: 'Libra (Sept 23\u2013Oct 23) is an air sign represented by the Scales, the only inanimate symbol of the zodiac, signifying balance and justice. Ruled by Venus, Libra has a refined aesthetic sense and a love of fairness and beauty. In medieval Christian allegory, the scales are associated with Archangel Michael weighing souls, underscoring Libra\'s connection to justice and moral balance. Librans are peacemakers and mediators.',
  },
  {
    culture: 'christian', number: 9, name: 'Virgo',
    description: 'Virgo (Aug 23\u2013Sept 22) is an earth sign represented by the Virgin or maiden, often associated with wheat and agriculture. Virgos are logical, practical, and meticulous. Ruled by Mercury, Virgo processes information inwardly \u2013 sorting, refining, and improving. The Virgin symbol reflects qualities of modesty and dedication; in a Christian context it has been linked to the Virgin Mary or to an ideal of spiritual purity and humility.',
  },
  {
    culture: 'christian', number: 10, name: 'Zadkiel',
    description: 'Zadkiel is the archangel corresponding to Jupiter, often revered as the angel of mercy, benevolence, and memory. The name Zadkiel derives from zedek, the Hebrew word for "righteousness," historically used as a name for the planet Jupiter. In biblical lore, Zadkiel stayed Abraham\'s hand from sacrificing Isaac, embodying divine compassion and justice tempered with mercy. Under Jupiter\'s expansive influence, Zadkiel represents generosity and forgiveness.',
  },
  {
    culture: 'christian', number: 11, name: 'Leo',
    description: 'Leo (July 23\u2013Aug 22) is a fire sign symbolized by the Lion, often called the "king of the zodiac." Leos are known for bold confidence, warmth, and leadership, lighting up any room with charisma and generosity. Ruled by the Sun, Leo carries solar energy \u2013 expressive, creative, and life-giving. In Christian symbolism, the lion is associated with St. Mark and Christ\'s royal authority, aligning with the virtue of Strength.',
  },
  {
    culture: 'christian', number: 12, name: 'John (Eagle)',
    description: 'John the Evangelist is symbolized by a rising Eagle, representing the soaring, divine insight of his Gospel. The eagle is associated with the fixed water sign Scorpio in its elevated form (the eagle being the transmuted symbol of the scorpion). John\'s Gospel "rises" to pierce heavenly mysteries \u2013 it opens with a lofty theological prologue. The eagle points to transformation and resurrection, mirroring John\'s focus on spiritual rebirth through Christ.',
  },
  {
    culture: 'christian', number: 13, name: 'Scorpio',
    description: 'Scorpio (Oct 24\u2013Nov 21) is a water sign symbolized by the Scorpion, though esoteric lore gives it the higher symbol of the Eagle to represent transcendence. Scorpios are renowned for their enigmatic, intense nature and profound emotional depth. This sign is associated with transformation, life-death-rebirth cycles, and hidden power. In Christian mystical interpretation, Scorpio\'s eagle aspect is linked to spiritual rebirth and the cleansing power of baptism.',
  },
  {
    culture: 'christian', number: 14, name: 'Sagittarius',
    description: 'Sagittarius (Nov 22\u2013Dec 21) is a fire sign symbolized by the Archer, a centaur aiming an arrow toward the heavens. Sagittarians are famous for boundless optimism, adventurous spirit, and philosophical insight. Ruled by Jupiter, this sign hungers for truth and understanding. The Archer\'s arrow represents the drive to aim high and pursue lofty ideals. In medieval context, Sagittarius\'s time of year was linked to advent and preparation for the coming light.',
  },
  {
    culture: 'christian', number: 15, name: 'Capricorn',
    description: 'Capricorn (Dec 22\u2013Jan 19) is an earth sign symbolized by the Goat, renowned for a disciplined, ambitious character. Ruled by Saturn, Capricorn embodies endurance, order, and maturity. In medieval symbolism, Saturn\'s archangel Cassiel and Capricorn individuals impart lessons of temperance, wisdom, and perseverance. Capricorns value tradition and take on leadership roles, ensuring things are built to last.',
  },
  {
    culture: 'christian', number: 16, name: 'Camael',
    description: 'Camael (also Chamuel or Kamael) is the archangel associated with Mars, often portrayed as a fierce warrior of God. Camael is called the "Archangel of Divine Justice," entrusted with carrying out God\'s judgments and protecting the faithful. According to lore, Camael led the angelic forces that expelled Adam and Eve from Eden with a flaming sword. His Mars influence channels righteous anger and bravery \u2013 "holy warfare" against evil.',
  },
  {
    culture: 'christian', number: 17, name: 'Aquarius',
    description: 'Aquarius (Jan 20\u2013Feb 18) is an air sign symbolized by the Water Bearer, representing spreading knowledge and innovation to humanity. Aquarians are independent, innovative, and humanitarian in spirit. Traditionally ruled by Saturn, Aquarius combines discipline with originality. The "man with a pitcher of water" in the Gospels (Luke 22:10) has been seen as an Aquarian motif heralding a new age. Aquarius stands for enlightened society and fellowship.',
  },
  {
    culture: 'christian', number: 18, name: 'Pisces',
    description: 'Pisces (Feb 19\u2013Mar 20) is a water sign symbolized by two Fish swimming in opposite directions. Pisceans are known for their dreamy nature, deep empathy, and artistic flair. As the last sign of the wheel, Pisces has absorbed lessons from all the others, giving remarkable compassion. In Christian symbolism, the Fish (ichthys) is a symbol of Christ and baptism. Pisces represents profound compassion, self-sacrifice, and spiritual unity.',
  },
  {
    culture: 'christian', number: 19, name: 'Michael',
    description: 'Michael is the archangel associated with the Sun, revered as the chief of the heavenly hosts and a warrior of light. The Sun symbolizes kingship, truth, and divine authority \u2013 qualities Michael epitomizes. He is shown with a fiery sword or radiant countenance, battling darkness with heavenly radiance. Sunday was regarded as Michael\'s day. Michael represents Divine Light, victory of good, and the triumph of God\'s truth over evil.',
  },
  {
    culture: 'christian', number: 20, name: 'Mark (Lion)',
    description: 'Mark the Evangelist is symbolized by a winged Lion, denoting kingly courage and the fiery vigor of his Gospel. The lion corresponds to Leo (a fixed fire sign), and Mark\'s symbol is linked to the element of Fire. Mark\'s Gospel begins by evoking "a voice crying out in the wilderness," likened to a lion\'s roar. The Fire element signifies the passionate intensity of Mark\'s message. Mark\'s lion stands for the virtue of courage and the awakening roar.',
  },
  {
    culture: 'christian', number: 21, name: 'Cassiel',
    description: 'Cassiel is the archangel associated with Saturn, traditionally depicted as a watcher who remains on the fringes of worldly affairs. Medieval angelologists named Cassiel the ruler of Saturn\'s sphere \u2013 detached, solitary, and exceedingly patient. Cassiel is sometimes called the "Angel of Time" or "Father Time," reflecting Saturn\'s governance over aging and fate. He teaches prudence, self-discipline, and isolation for spiritual growth. Cassiel corresponds to The World card, representing completion and cosmic law.',
  },
];
