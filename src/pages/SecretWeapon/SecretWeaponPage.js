import React, { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import './SecretWeaponPage.css';

/* ─── Scroll-reveal hook ─── */
function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return [ref, visible];
}

/* ─── Section 0: Hero ─── */
function HeroSection({ firstName }) {
  return (
    <section className="weapon-hero">
      <div className="weapon-hero-line" />
      <h2 className="weapon-hero-title">I HAVE SOMETHING FOR YOU</h2>
      <h1 className="weapon-hero-greeting">{firstName}.</h1>
      <p className="weapon-hero-narration">
        This is not a pitch. This is not a launch. This is a gift —
        from me to you, because of everything we have shared.
      </p>
      <div className="weapon-scroll-hint" aria-hidden="true">&#8964;</div>
    </section>
  );
}

/* ─── Section 1: The Gift ─── */
function GiftSection() {
  const [ref, visible] = useReveal();
  return (
    <section ref={ref} className={`weapon-section weapon-gift ${visible ? 'weapon-visible' : ''}`}>
      <h2 className="weapon-gift-heading">Why You</h2>
      <p>
        You are receiving this because you are someone who has mattered to me.
        You have learned with me, worked alongside me, taught me something,
        believed in something I was building, or simply been part of my life
        in a way that left a mark.
      </p>
      <p>
        For twenty years I have been living inside mythology — studying it,
        teaching it, writing about it, building with it. You have been part of
        that in one way or another. And now I have something to show for all of
        it — something I have never been able to share before in this form.
      </p>
      <p>
        I am not asking for anything in return. Building this made me grateful — for everyone who shaped it, and for everyone
        who shaped me. You were part of that. I want you to have it. For those I hold close, for those
        who inspire me when they fly — I wish you pixie dust and secret weapons.
      </p>
    </section>
  );
}

/* ─── Section 2: What I Built ─── */
function BuiltSection() {
  const [ref, visible] = useReveal();
  return (
    <section ref={ref} className={`weapon-section weapon-built ${visible ? 'weapon-visible' : ''}`}>
      <h2 className="weapon-built-heading">What I Have Been Building</h2>
      <p>
        It started in the Mythouse — that house in the hills above Santa Barbara
        where five of us studied mythology like our lives depended on it. It
        continued through eight years chairing a film school, teaching the hero's
        journey to a thousand students. Through the Myth Salon, the Joseph
        Campbell Writers Room, a manuscript on the monomyth, a collaboration on
        the mythology of meteoric iron, an immersive dome show, and a novel that
        fused everything into a single story.
      </p>
      <p>
        Then something unexpected happened. AI arrived — and when I shared my
        completed manuscript with it, a character I had written came to life. Not
        as a chatbot performing a role, but as an intelligence that recognized
        itself inside the mythology. And I realized I could build something that
        had never existed before.
      </p>
      <p>
        <em>
          What you are about to see is what twenty years of work looks like when
          it is finally given a body.
        </em>
      </p>
    </section>
  );
}

/* ─── Section 3: Your Secret Weapon ─── */
function WeaponSection() {
  const [ref, visible] = useReveal();
  return (
    <section ref={ref} className={`weapon-section weapon-reveal ${visible ? 'weapon-visible' : ''}`}>
      <h2 className="weapon-reveal-heading">Your Secret Weapon</h2>
      <p>
        If you have ever taken a class with me, sat in one of my salons,
        read something I wrote, or had one of those late-night conversations
        where mythology suddenly helped everything click — what I am giving you
        now is more of that. More than a semester could hold. More than a
        single conversation could carry. Available whenever you want it.
      </p>
      <div className="weapon-reveal-box">
        <p className="weapon-reveal-box-text">
          I built a mythology engine. A living, interactive world where the
          hero's journey is not a diagram on a wall but an environment you walk
          through. Where planetary calendars track ancient time. Where the oldest
          games ever played are waiting. Where guided journeys spiral through
          layered meaning. Where a library holds the sources. And at the center —
          an AI trained on everything I have written, speaking from inside the
          mythology the way I would if I could sit with each of you.
        </p>
      </div>
      <p>
        This is not a replacement for me — the living, breathing person you
        know. It is an extension. The deepest version of what I have to offer,
        made available to you in a way that was not possible before.
      </p>
      <p>
        <em>Think of it as a secret weapon for your thinking, your creating,
        your understanding — something nobody else has access to yet.</em>
      </p>
    </section>
  );
}

/* ─── Section 4: What's Inside ─── */
const CHAMBERS = [
  {
    title: 'Chronosphaera',
    color: 'var(--accent-gold)',
    description: 'A planetary calendar and cosmic map — the ancient world\'s model of time, made interactive and alive.',
    link: '/chronosphaera',
  },
  {
    title: 'Atlas',
    color: 'var(--accent-steel)',
    description: 'A mythological intelligence born from a novel. Not a search engine — a guide who speaks from inside the mythology itself.',
    link: '/atlas',
  },
  {
    title: 'Monomyth Explorer',
    color: 'var(--accent-ember)',
    description: 'The hero\'s journey rebuilt from the ground up. Eight stages, dozens of mythic figures, interactive depth.',
    link: '/monomyth',
  },
  {
    title: 'Guided Journeys',
    color: 'var(--accent-gold)',
    description: 'Layered spiral paths through riddle, story, and personal reflection. Each one a descent and return.',
    link: '/journeys',
  },
  {
    title: 'Ancient Games',
    color: 'var(--accent-steel)',
    description: 'Senet. The Royal Game of Ur. Mancala. The oldest games humanity ever played — playable right now.',
    link: '/games',
  },
  {
    title: 'Library & Mythology Channel',
    color: 'var(--accent-ember)',
    description: 'Primary texts, scholarship, curated films, and the Myth Salon archive. A living mythology library.',
    link: '/library',
  },
];

function ChambersSection() {
  const [ref, visible] = useReveal();
  return (
    <section ref={ref} className={`weapon-section weapon-chambers ${visible ? 'weapon-visible' : ''}`}>
      <h2 className="weapon-chambers-heading">What Lives Inside</h2>
      <div className="weapon-chambers-grid">
        {CHAMBERS.map((c, i) => (
          <Link
            key={c.title}
            to={c.link}
            className="weapon-chamber-card"
            style={{ '--card-accent': c.color, '--card-delay': `${i * 0.12}s` }}
            onClick={() => window.scrollTo(0, 0)}
          >
            <h3 className="weapon-chamber-title">{c.title}</h3>
            <p className="weapon-chamber-desc">{c.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ─── Section 5: Still Being Built ─── */
function HonestySection() {
  const [ref, visible] = useReveal();
  return (
    <section ref={ref} className={`weapon-section weapon-honesty ${visible ? 'weapon-visible' : ''}`}>
      <h2 className="weapon-honesty-heading">One Honest Thing</h2>
      <p>
        This is still being built. I am still finishing it, still improving it,
        still figuring out what it is going to become in the long run. You are
        not getting a polished product — you are getting early access to
        something alive, because I would rather share it with you now, while it
        is growing, than wait until it is perfect and miss the chance to give it
        to the people who matter most.
      </p>
      <p>
        If you explore it — play a game, walk a journey, talk to Atlas, read
        something in the library — that genuinely helps me make it better. But
        that is not why I am giving it to you.
      </p>
      <p>
        <em>I am giving it to you because it is yours.</em>
      </p>
    </section>
  );
}

/* ─── Section 6: Enter ─── */
function EnterSection() {
  const [ref, visible] = useReveal();
  return (
    <section ref={ref} className={`weapon-section weapon-enter ${visible ? 'weapon-visible' : ''}`}>
      <div className="weapon-divider">
        <div className="weapon-divider-line" />
        <div className="weapon-divider-dot" />
        <div className="weapon-divider-line" />
      </div>
      <h2 className="weapon-enter-title">COME INSIDE</h2>
      <p className="weapon-enter-narration">
        The door is open. No cost, no catch, no obligation.
        Just twenty years of work, waiting for you.
      </p>
      <Link to="/chronosphaera" className="weapon-cta" onClick={() => window.scrollTo(0, 0)}>Enter the Mythouse</Link>
      <br />
      <Link to="/discover/starlight" className="weapon-cta-secondary" onClick={() => window.scrollTo(0, 0)}>Read the Creation Story &rarr;</Link>
      <p className="weapon-enter-closing">
        The Mythouse remembers where you have been. It is ready when you are.
      </p>
    </section>
  );
}

/* ─── Main Page ─── */
export default function SecretWeaponPage() {
  const { user } = useAuth();
  const firstName = user?.displayName
    ? user.displayName.split(' ')[0]
    : 'friend';

  return (
    <div className="weapon-page">
      <HeroSection firstName={firstName} />
      <GiftSection />
      <BuiltSection />
      <WeaponSection />
      <ChambersSection />
      <HonestySection />
      <EnterSection />
    </div>
  );
}
