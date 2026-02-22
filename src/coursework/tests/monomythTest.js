// Monomyth stage test questions
// Each stage maps to an array of { id, prompt, options, correctIndices }

export const MONOMYTH_TEST = {
  'golden-age': [
    {
      id: 'q1',
      prompt: 'In the surface stage, when the story begins, the surface reality of the protagonist:',
      options: [
        'Is representative of the status quo, common sense, persona, and the thematic problem.',
        'Provides a mundane baseline for contrast with the extraordinary world.',
        'Is a stagnant balance that might be repetitive, comfortable, or paralyzed with unrecognized oppression.',
        'Is where the situation, circumstance, and main characters are introduced, set up, and disrupted.',
      ],
      correctIndices: [0, 1, 2, 3],
    },
    {
      id: 'q2',
      prompt: 'The wasteland motif:',
      options: [
        'Has its origins in the loss and return of life after winter and drought periods of lifelessness and heightened threat.',
        'Can be extended into the context of general lifelessness and the lack of fertility, including the spiritual disaster of life without meaning or soul.',
        'Without myth, heroes are often those who redeem the world from waste by freeing water and/or soul. Indra, for example, is a world redeemer because he frees life-restoring waters.',
        'Can express itself on a microcosmic level through a specific character.',
      ],
      correctIndices: [0, 1, 2, 3],
    },
    {
      id: 'q3',
      prompt: 'To change the future and redeem the wasteland, the protagonists may need to:',
      options: [
        'Establish a revitalized relationship with the past.',
        'Establish a new fertile norm by actuating a revived relationship with the source of creation.',
        'Carry an emerging interest of collective will.',
        'Overturn an accumulation of norms by saying no to a dragon guardian of the status quo.',
      ],
      correctIndices: [0, 1, 2, 3],
    },
    {
      id: 'q4',
      prompt: 'The feeling of estrangement, separation, solitude, is one of the deepest emotional and existential motivations of the human psyche:',
      options: [
        'The Oedipus complex concerns anxiety of separation itself, experienced most directly through the separation of child from mother.',
        'Quests for lovers and totems can be surrogate quests for wholeness. Sometimes this wholeness is sought on the grandest level with cosmos or God, and sometimes on the smallest with a memento or a small community.',
        'According to Campbell, the Oedipus complex sets up a foundational narrative pattern within the nuclear family in which the father, as the intruder of an infant\'s union with the mother, is experienced as bad, while the mother is seen as the source of union and nourishment.',
        'Insofar as the Grail quest portrays a journey from the pre-birth union with mother to a new union with a lover, the Oedipus complex represents a regressive path back towards the mother\'s womb.',
      ],
      correctIndices: [0, 1, 2, 3],
    },
  ],

  'falling-star': [
    {
      id: 'q1',
      prompt: 'The calling:',
      options: [
        'Could be a message from a messenger, a stirring within the hero, dream, fantasy, vision, haunting, kidnapping.',
        'Comes when the horizon of familiarity has been outgrown. As Campbell says, this includes ideals, old concepts, and emotional patterns.',
        'Might be described as the shadow\'s disruption of ego and its identification with the persona it has contrived. Such a shadow disruption is often a trick, synchronicity, or Freudian slip at minimum. It\'s an interruption of the known by something from the unknown, a meteor from another place.',
        'The call is a disruptive interjection from something that is being repressed, ignored, or denied, a reality that has been hidden or overlooked. Following the disruption, the same repressions will appear in the form of an inner refusal and/or outer resistance.',
      ],
      correctIndices: [0, 1, 2, 3],
    },
  ],

  'impact-crater': [
    {
      id: 'q1',
      prompt: 'The crossing of the threshold can be associated with:',
      options: [
        'A change in landscape that corresponds with the diversing of a boundary between known and unknown. This represents a departure from a secure path of certain safety in favor of exploration, which means darkness and danger.',
        'This is when Alice goes through the rabbit hole, when Dorothy rides the tornado to Oz, when we cross through the wardrobe to Narnia or the phone from The Matrix. This is when the seafarer is swallowed by the whale or when Osiris enters into the Duat.',
        'Plot point one, when the story breaks into Act 2 and begins in earnest.',
        'A transition into an entirely different metaphysical cosmology and/or emotional reality.',
      ],
      correctIndices: [0, 1, 2, 3],
    },
  ],

  'forge': [
    {
      id: 'q1',
      prompt: 'The initiation:',
      options: [
        'Might be described as the road of trials, a phase of tests, allies and helpers, fun and games.',
        'This is when the hero journeys in and with the whale towards the bottom of the sea.',
        'This is when the light wanes and the strength of the darkness is learned. This is when the repressed metaphysical reality is learned: magic, the force, dreams, superpowers, how to love, how to be creative, et cetera. This is an initiation into the skills of the other reality into which the hero or heroine has ventured.',
        'This is when the camel becomes the lion out of recognition that the burden it\'s been carrying is in the service of "thou shalt," the tyrannical force that holds together the world as everything it should be.',
      ],
      correctIndices: [0, 1, 2, 3],
    },
    {
      id: 'q2',
      prompt: 'The initiation stage of the journey:',
      options: [
        'Is the first half of Act 2.',
        'Is between the crossing and the midpoint.',
        'Is defined by conflict, tests, trials, and progressive complications.',
        'Is always focused on the larger arch plot.',
      ],
      correctIndices: [0, 1, 2],
    },
    {
      id: 'q3',
      prompt: 'This is in the world that is:',
      options: [
        'Beneath and of the waves.',
        'Made of particles like sand and stone.',
        'Other when compared with the world from which the character or individual has departed.',
        'The normal world run by the public actions of famous adults in their primes.',
      ],
      correctIndices: [0, 2],
    },
    {
      id: 'q4',
      prompt: 'Examples of this phase include:',
      options: [
        'Inanna removing articles of her clothing as she descends into the underworld.',
        'Buddha becoming emaciated in the forest as he pursues the ascetic path.',
        'Dorothy on the yellow brick road meeting the lion, scarecrow, and tin man.',
        'The sword being drawn from the stone.',
      ],
      correctIndices: [0, 1, 2],
    },
  ],

  'quenching': [
    {
      id: 'q1',
      prompt: 'The nadir:',
      options: [
        'Midnight, winter solstice, new moon.',
        'Conception occurs within the dark space of the midnight womb.',
        'This is the dark night of the soul or darkest moment. This is the final death of the last light that becomes the darkness that becomes the new light.',
        'The first spark of light might be associated with the elixir or the sword or whatever the special object is that will come back and deliver a new day. This object of fire is hope. It\'s also a metaphor for the solution required to solve the problem, which may be literal, but should be conceptual, intellectual, personal, and psychological.',
      ],
      correctIndices: [0, 1, 2, 3],
    },
    {
      id: 'q2',
      prompt: 'The nadir, in a basic three-act structure:',
      options: [
        'Is the end of Act 2 that begins Act 3.',
        'Is the climax of Act 3.',
        'Often centers around an ordeal or crisis that will break us into Act 3.',
        'Is sometimes associated with an innermost chamber or center of existence.',
      ],
      correctIndices: [0, 2, 3],
    },
    {
      id: 'q3',
      prompt: 'The via negativa that takes place between the midpoint and the nadir:',
      options: [
        'Is the negative road down which Socrates guided his interlocutors. This was the road on which one participates in the deconstruction of their own beliefs.',
        'Is the road of descent on which Inanna removes more and more of her "me" of her clothing as she approaches the netherworld\'s lowest point.',
        'Is when the team might break apart and/or turn on itself.',
        'Takes place in a training zone removed from the main plot or antagonistic forces.',
      ],
      correctIndices: [0, 1, 2],
    },
    {
      id: 'q4',
      prompt: 'At the midpoint:',
      options: [
        'The return journey begins.',
        'The oracle tells Neo he is not the one and the team is betrayed.',
        'Siddhartha realized that the ascetic path does not lead to enlightenment.',
        'The plan often breaks down and that which the will is willing proves unwilling.',
      ],
      correctIndices: [1, 2, 3],
    },
  ],

  'integration': [
    {
      id: 'q1',
      prompt: 'The return:',
      options: [
        'From the turning point towards home to our arrival at that threshold at the horizon. This is that journey.',
        'This is the journey from midnight to sunrise, from conception to birth, from the winter solstice to spring equinox.',
        'This might look like an escape and/or attack, a magic flight, a rallying of the troops, and/or a storming towards the castle.',
        'The risk at this point is regression. This is when the forces of the underworld try and draw us back to our own ego.',
      ],
      correctIndices: [0, 1, 2, 3],
    },
    {
      id: 'q2',
      prompt: 'The return is:',
      options: [
        'A time for the hero to express resolve. The motif of the refusal of the return emphasizes the requirement of a strong choice for the successful return.',
        'Often motivated by a need to escape approaching threats.',
        'With a thing, insight, solution, or person needed to bring a new day.',
        'Not an essential part of the journey for a true hero, who may choose to stay in the world of adventure.',
      ],
      correctIndices: [0, 1, 2],
    },
    {
      id: 'q3',
      prompt: 'Why does the hero sometimes struggle to choose to return?',
      options: [
        'Desire to remain in the discovered state of bliss, adventure, and union.',
        'Doubt that those in the normal world will receive what\'s been retrieved in a positive way.',
        'Unwillingness to return to a reality that is mundane compared to the world known through the quest.',
        'They have not changed or found the solution they need.',
      ],
      correctIndices: [0, 1, 2],
    },
    {
      id: 'q4',
      prompt: 'Returning is sometimes divisible into:',
      options: [
        'Escaping.',
        'Rallying.',
        'Attacking or storming towards the return threshold.',
        'Resisting the return.',
      ],
      correctIndices: [0, 1, 2, 3],
    },
  ],

  'drawing': [
    {
      id: 'q1',
      prompt: 'The arrival:',
      options: [
        'This is the return threshold which the hero will cross with the elixir.',
        'This is the sunrise horizon over which the sun delivers its light to the world.',
        'This is rebirth, resurrection, or reemergence (re in parentheses next to birth and emergence) from a womb of adventure.',
        'This is when the hero demonstrates a choice that demonstrates a self that has been wanting to be born since the beginning of the journey.',
      ],
      correctIndices: [0, 1, 2, 3],
    },
    {
      id: 'q2',
      prompt: 'Climax should be seen as a moment:',
      options: [
        'Of crescendo equals fortissimo!',
        'Driven by a choice of the character that brings about absolute and irreversible change.',
        'That brings more meaning than noise.',
        'Both inevitable and unexpected.',
      ],
      correctIndices: [0, 1, 2, 3],
    },
    {
      id: 'q3',
      prompt: 'On the resurrection or renewal of a character:',
      options: [
        'As Tolkien writes, redeemed man will be like and unlike the fallen man previously known.',
        'The final challenge often requires a display of the newly formed self that incorporates lessons learned from the journey through a decision that the old self would be unable to make.',
        'Following their rebirth, the character should be able to put something above personal interests, a core feature of the hero.',
        'Remembering that a choice without consequences is no choice at all, the ultimate choices made in these final scenes are often those of great self-sacrifice, which sometimes even means death.',
      ],
      correctIndices: [0, 1, 2, 3],
    },
    {
      id: 'q4',
      prompt: 'The climax features:',
      options: [
        'The defeat of the primary antagonistic force.',
        'The crossing of the final return barrier.',
        'The delivery of an elixir or solution that brings a new day.',
        'A resurrection and/or transmutation of the self.',
      ],
      correctIndices: [0, 1, 2, 3],
    },
  ],

  'new-age': [
    {
      id: 'q1',
      prompt: 'New day:',
      options: [
        'Following the climactic ledge of transformation comes the fulfillment of its promise, a new reality, individual and relationship.',
        'This is often the end of the story, the delivery of a new day, the establishment of a new norm.',
        'This is when the hero might be described as having the freedom to live and/or as master of two worlds, which is to say the hero is now free and able to live happily at home while at the same time he does not fear or other what is no longer unknown.',
        'The new day is also the new year, the new creation, the new life, new world.',
      ],
      correctIndices: [0, 1, 2, 3],
    },
  ],
};
