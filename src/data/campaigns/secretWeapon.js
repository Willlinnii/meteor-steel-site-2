/**
 * Secret Weapon Campaign — personal outreach to invite people to Mythouse
 *
 * Contact statuses: pending → drafted → sent → signed-up → active
 */

const SECRET_WEAPON_CAMPAIGN = {
  id: 'secret-weapon',
  name: 'Secret Weapon',
  description: 'Personal outreach campaign for /secret-weapon landing page',
  link: '/secret-weapon',
  statuses: ['pending', 'drafted', 'sent', 'signed-up', 'active'],
  groups: [
    {
      id: 'mythouse-originals',
      name: 'Mythouse Originals',
      contacts: [
        { id: 'matt-mclean', name: 'Matt McLean' },
        { id: 'mike-petro', name: 'Mike Petro' },
        { id: 'craig-dininger', name: 'Craig Dininger' },
        { id: 'devin-daimler', name: 'Devin Daimler' },
        { id: 'rosalie-bouck', name: 'Rosalie Bouck' },
        { id: 'robert-geiker', name: 'Robert Geiker' },
        { id: 'david-gustafson', name: 'David Gustafson' },
        { id: 'jamin-lirum', name: 'Jamin Lirum' },
        { id: 'dan-gurska', name: 'Dan Gurska' },
      ],
      messageTemplate:
`Hey [NAME],

We lived in a house together — a house that changed us. The conversations we had, the ideas we threw around late at night, the feeling that something bigger was happening... that was all real.

I've been building something that carries that spirit forward. It's called the Mythouse. Think of it as an invitation into a living mythology — a place where stories, games, and ideas come together in a way that I think you'll immediately recognize.

This isn't a pitch or a request. It's a gift — and you're one of the first people I want to share it with.

Check it out here: mythouse.org/secret-weapon

I'd love to hear what you think.

— Will`,
    },
    {
      id: 'hussian-students',
      name: 'Hussian College Students',
      contacts: [],
      messageTemplate:
`Hey [NAME],

You're in the middle of building your creative life right now — and I want to give you something that might help.

I've been working on something called the Mythouse. It's a place where mythology, storytelling, and interactive experiences come together. It's built for people like you — curious, creative, hungry to make things that matter.

No catch, no cost. Just an invitation.

Take a look: mythouse.org/secret-weapon

Let me know what you think — I'm genuinely curious to hear your perspective.

— Will`,
    },
    {
      id: 'hussian-faculty',
      name: 'Hussian College Faculty',
      contacts: [],
      messageTemplate:
`Hi [NAME],

I wanted to share something I've been building that I think aligns with what you're doing in the classroom.

The Mythouse is an interactive mythology platform — part storytelling engine, part educational experience. It weaves together the Hero's Journey, world mythology, and creative tools in a way that I think could genuinely resonate with your students.

I'd love to get your take on it — not as a sales pitch, but as a fellow educator and storyteller.

Here's the link: mythouse.org/secret-weapon

Warmly,
Will`,
    },
    {
      id: 'campbell-writers-room',
      name: 'Joseph Campbell Writers Room',
      contacts: [],
      messageTemplate:
`Hi [NAME],

Through the Campbell Writers Room, we share a deep appreciation for the power of myth in storytelling. I've been channeling that same energy into something I think you'll find compelling.

The Mythouse is a living mythology platform — it takes the ideas we discuss about Campbell, the monomyth, and archetypal storytelling and turns them into an interactive experience. Stories you can walk through. Ideas you can play with.

I'd love your thoughts: mythouse.org/secret-weapon

This is a gift, not an ask. I just think you'll get it.

— Will`,
    },
    {
      id: 'myth-salon',
      name: 'Myth Salon Contributors',
      contacts: [],
      messageTemplate:
`Hi [NAME],

The conversations we've had through Myth Salon have meant a lot to me — the way myth stays alive when people gather around it and take it seriously.

I've been building something that tries to capture that same feeling in a new form. The Mythouse is an interactive mythology platform where the stories aren't just told — they're experienced. Think of it as a digital hearth for the kind of mythic exploration we both care about.

I'd be honored if you'd take a look: mythouse.org/secret-weapon

— Will`,
    },
    {
      id: 'myths-tv',
      name: 'Myths TV Series',
      contacts: [],
      messageTemplate:
`Hi [NAME],

Working on the Myths series gave me a profound appreciation for bringing mythology to life through media. I've taken that same vision and extended it into something new.

The Mythouse is an interactive platform where mythology isn't just watched — it's explored, played with, and lived. It's the kind of project that I think speaks directly to what we were trying to do with the series.

Take a look when you get a chance: mythouse.org/secret-weapon

No strings attached — just want to share it with people who understand the vision.

— Will`,
    },
    {
      id: 'monomyth-core',
      name: 'Monomyth Core / Dissertation Advisors',
      contacts: [
        { id: 'dara-marks', name: 'Dara Marks' },
        { id: 'dennis-slattery', name: 'Dennis Slattery' },
        { id: 'lansing-smith', name: 'Lansing Smith' },
        { id: 'chris-vogler', name: 'Chris Vogler' },
        { id: 'robert-walter', name: 'Robert Walter' },
        { id: 'john-booker', name: 'John Booker' },
        { id: 'ken-lee', name: 'Ken Lee' },
      ],
      messageTemplate:
`Dear [NAME],

Your guidance through my dissertation work shaped the way I think about mythology — not as something to study from a distance, but as something to live inside of.

I've been building something that attempts to do exactly that. The Mythouse is an interactive mythology platform — a place where the monomyth isn't just analyzed but experienced. The Hero's Journey, the archetypes, the layers of world myth — they're all there, woven into an explorable space.

I would be deeply honored if you'd take a look: mythouse.org/secret-weapon

This is a gift — a continuation of the work you helped me begin.

With gratitude,
Will`,
    },
    {
      id: 'artists-musicians',
      name: 'Artists & Musicians',
      contacts: [
        { id: 'chris-holmes', name: 'Chris Holmes' },
        { id: 'bonnie-mckee', name: 'Bonnie McKee' },
        { id: 'jessie-rogg', name: 'Jessie Rogg' },
        { id: 'adrian-grenier-art', name: 'Adrian Grenier' },
        { id: 'jordan-grenier-art', name: 'Jordan Grenier' },
        { id: 'mayra-art', name: 'Mayra' },
      ],
      messageTemplate:
`Hey [NAME],

You know what it feels like to create something that taps into something deeper — something mythic. I've been building a project that lives in that same space.

The Mythouse is an interactive mythology platform — part story, part game, part living artwork. It's the kind of thing where music, visuals, and narrative all weave together into something you can explore.

I think you'd vibe with it: mythouse.org/secret-weapon

No ask here — just sharing something I made with someone whose creative sensibility I respect.

— Will`,
    },
    {
      id: 'austin-circle',
      name: 'Austin Circle',
      contacts: [
        { id: 'adrian-grenier-atx', name: 'Adrian Grenier' },
        { id: 'jordan-grenier-atx', name: 'Jordan Grenier' },
        { id: 'alex-lin', name: 'Alex Lin' },
        { id: 'keri', name: 'Keri' },
        { id: 'gracie', name: 'Gracie' },
        { id: 'tinkerbell', name: 'Tinkerbell' },
        { id: 'star-hartson', name: 'Star Hartson' },
        { id: 'naomi', name: 'Naomi' },
        { id: 'myra', name: 'Myra' },
        { id: 'dylan', name: 'Dylan' },
      ],
      messageTemplate:
`Hey [NAME],

You know those conversations we've had — the ones where we end up talking about meaning, creativity, the bigger picture? I've been building something that lives in that exact space.

It's called the Mythouse — an interactive mythology platform. Stories, games, ideas — all woven together into something you can actually explore. It's hard to describe in a message, so I'll just say: I think you'll get it immediately.

Check it out: mythouse.org/secret-weapon

This is a gift. I just want to share it with the people who matter to me.

— Will`,
    },
    {
      id: 'brothers',
      name: 'Brothers',
      contacts: [
        { id: 'alex-garrison', name: 'Alex Garrison' },
        { id: 'beckett-quintin', name: 'Beckett Quintin' },
      ],
      messageTemplate:
`Hey brother,

I've been building something that I'm really proud of, and you're one of the first people I want to show it to.

It's called the Mythouse — an interactive mythology experience. Think stories, games, and ideas all woven together. It's the thing I've been pouring myself into, and I think you'll see why when you explore it.

Here's the link: mythouse.org/secret-weapon

Let me know what you think. Seriously.

— Will`,
    },
    {
      id: 'parents',
      name: 'Parents',
      contacts: [
        { id: 'mom', name: 'Mom' },
        { id: 'dad', name: 'Dad' },
      ],
      messageTemplate:
`Hey Mom/Dad,

I want to show you what I've been working on. This is the thing — the Mythouse. It's an interactive mythology platform where you can explore stories, play games, and discover ideas from cultures all over the world.

I know I've talked about it a lot, but now you can actually see it and experience it for yourself.

Here's the link: mythouse.org/secret-weapon

I'd love to walk you through it, but feel free to explore on your own too.

Love,
Will`,
    },
    {
      id: 'extended-family',
      name: 'Extended Family',
      contacts: [
        { id: 'saunders', name: 'Saunders' },
        { id: 'linns', name: 'Linns' },
      ],
      messageTemplate:
`Hey [NAME],

I wanted to share something I've been building that I'm really excited about.

The Mythouse is an interactive mythology platform — a place where you can explore stories, play games, and discover ideas from cultures and traditions all around the world. It's been a labor of love, and I want to share it with the people closest to me.

Take a look when you get a chance: mythouse.org/secret-weapon

— Will`,
    },
    {
      id: 'collaborators-partners',
      name: 'Mythouse Collaborators & Partners',
      contacts: [
        { id: 'sunil-parab', name: 'Sunil Parab' },
        { id: 'dawn-barry', name: 'Dawn Barry' },
        { id: 'aj-floridas-collab', name: 'AJ Floridas' },
      ],
      messageTemplate:
`Hey [NAME],

You've been part of building this — and now I want to make sure you see the full picture of what we've created together.

The Mythouse is live, and the /secret-weapon page is how I'm personally inviting people into the experience. I'd love for you to see it through the eyes of someone receiving this invitation for the first time.

Check it out: mythouse.org/secret-weapon

Your work is in here. I hope that feels as good to see as it does to say.

— Will`,
    },
    {
      id: 'core-mythos-team',
      name: 'Core Mythos Team',
      contacts: [
        { id: 'aj-floridas-core', name: 'AJ' },
      ],
      messageTemplate:
`Hey [NAME],

You're in the inner circle — you know what we're building and why it matters.

The /secret-weapon page is ready, and I'm starting the personal outreach campaign. I want you to see the landing page and the message people will receive. Your feedback matters more than anyone's.

Take a look: mythouse.org/secret-weapon

Let's talk about it.

— Will`,
    },
  ],
};

export default SECRET_WEAPON_CAMPAIGN;
