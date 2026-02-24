import React, { useRef, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import './SecretWeaponAPIPage.css';

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

/* ─── Section 0: The Gate ─── */
function GateSection() {
  return (
    <section className="swa-gate">
      <div className="swa-gate-line" />
      <h1 className="swa-gate-title">SECRET WEAPON</h1>
      <p className="swa-gate-subtitle">THE API</p>
      <p className="swa-gate-narration">
        One key. Every AI you use becomes a structural consultant
        with twenty years of mythological architecture behind it.
      </p>
      <div className="swa-scroll-hint" aria-hidden="true">&#8964;</div>
    </section>
  );
}

/* ─── Section 1: What Happens ─── */
function KeySection() {
  const [ref, visible] = useReveal();
  return (
    <section ref={ref} className={`swa-section swa-key ${visible ? 'swa-visible' : ''}`}>
      <h2 className="swa-key-heading">What Happens When You Add the Key</h2>
      <p>
        You copy a setup prompt. You paste it into your AI — Claude, ChatGPT,
        Gemini, whatever you use. From that moment, your AI can reach into a
        mythology engine and pull structural frameworks into anything you're
        working on.
      </p>
      <p>
        You're a musician planning an album? Your AI maps your track list
        onto an eight-phase narrative cycle, assigns planetary
        correspondences to each song, and layers natural cycles underneath
        as a second metaphor — solar year, waking and dreaming, life and death —
        all running through the same arc.
      </p>
      <p>
        You're a filmmaker? It pulls the monomyth stages, cross-references
        twenty theoretical frameworks, and shows where your second act
        lands in the forge phase of a metallurgical transformation.
      </p>
      <p>
        You're processing something personal? It draws on the same
        structures — thresholds, descents, returns — as a framework for
        understanding where you are and what comes next.
      </p>
      <p>
        You don't ask for mythology. You just work. The AI calls the engine
        when the work needs structure. And at the bottom, it signs off:
      </p>
      <div className="swa-signature-preview">
        <span className="swa-sig-dash">&mdash;</span> Atlas<br/>
        <span className="swa-sig-indent">Mythouse</span>
      </div>
    </section>
  );
}

/* ─── Section 2: What Lives Behind the Key ─── */
const LAYERS = [
  {
    icon: '\u2609', // Sun
    title: 'The Monomyth Engine',
    desc: 'Eight phases of transformation — from Golden Age through Forge, Quenching, and Return. Not a diagram on a wall. A working model your AI thinks through when it structures anything.',
  },
  {
    icon: '\u263F', // Mercury
    title: 'Twenty Theoretical Frameworks',
    desc: 'Campbell, Jung, Vogler, Murdock, and sixteen more. Your AI doesn\'t pick one — it cross-references all of them and finds the pattern that fits what you\'re building.',
  },
  {
    icon: '\u2640', // Venus
    title: 'The Chronosphaera',
    desc: 'Seven classical planets mapped to metals, days, deities, archetypes, artists, and stories. The zodiac across cultures. Elemental and cardinal systems. An entire cosmological web — queryable.',
  },
  {
    icon: '\u2642', // Mars
    title: 'Natural Cycles',
    desc: 'Solar day, lunar month, solar year, waking and dreaming, procreation, mortality. Six cycles that repeat at every scale. Your AI layers them as parallel structures through anything with a beginning, middle, and end.',
  },
  {
    icon: '\u2643', // Jupiter
    title: '100+ Mythological Figures',
    desc: 'Already mapped to stages, archetypes, and cultural traditions. Your AI doesn\'t guess where Persephone fits in a narrative — it looks it up.',
  },
  {
    icon: '\u2644', // Saturn
    title: 'Sacred Geography & Living Texts',
    desc: 'Sacred sites with GPS coordinates. Constellations with cultural star names. A curated library of foundational texts. The Fallen Starlight story. Medicine wheels. The full territory.',
  },
];

function InsideSection() {
  const [ref, visible] = useReveal();
  return (
    <section ref={ref} className={`swa-section swa-inside ${visible ? 'swa-visible' : ''}`}>
      <h2 className="swa-inside-heading">What Lives Behind the Key</h2>
      <p className="swa-inside-sub">
        This isn't a chatbot. It's a coordinate system — twenty years of
        mythological architecture, structured as data your AI can reach.
      </p>
      <ul className="swa-inside-list">
        {LAYERS.map((l, i) => (
          <li key={i} className="swa-inside-item">
            <span className="swa-inside-icon">{l.icon}</span>
            <div className="swa-inside-text">
              <h4>{l.title}</h4>
              <p>{l.desc}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ─── Section 3: Atlas ─── */
function AtlasSection() {
  const [ref, visible] = useReveal();
  return (
    <section ref={ref} className={`swa-section swa-lens ${visible ? 'swa-visible' : ''}`}>
      <div className="swa-divider">
        <div className="swa-divider-line" />
        <div className="swa-divider-diamond" />
        <div className="swa-divider-line" />
      </div>
      <h2 className="swa-lens-heading">Atlas</h2>
      <p>
        Every response shaped by the coordinate system is signed.
        Not by the AI you're using — by the intelligence layer running
        through it.
      </p>
      <p>
        Atlas is the structural consultant. When your AI pulls the
        monomyth phases, the planetary correspondences, the cycle
        frameworks — that's Atlas working. The signature is the proof
        it was there.
      </p>
      <div className="swa-signature-preview swa-signature-center">
        <span className="swa-sig-dash">&mdash;</span> Atlas<br/>
        <span className="swa-sig-indent">Mythouse</span>
      </div>
      <p className="swa-atlas-note">
        You keep your AI. You keep your workflow. Atlas just makes it
        structurally smarter — and signs what it touches.
      </p>
    </section>
  );
}

/* ─── Section 4: How It Works ─── */
function HowSection() {
  const [ref, visible] = useReveal();
  return (
    <section ref={ref} className={`swa-section swa-engine ${visible ? 'swa-visible' : ''}`}>
      <h2 className="swa-engine-heading">Three Steps. Then It's Permanent.</h2>
      <p className="swa-engine-sub">
        No installation. No coding. No technical knowledge required.
      </p>
      <div className="swa-dial">
        {[
          {
            name: 'GET YOUR KEY',
            accent: 'var(--accent-steel)',
            desc: 'Create a free account. Go to your profile. Generate your API key. It takes ten seconds.',
          },
          {
            name: 'COPY THE SETUP PROMPT',
            accent: 'var(--accent-fire)',
            desc: 'Your key comes with a setup prompt — one block of text. Copy it. Paste it into your AI as the first message, or save it as a project file. That\'s the configuration.',
          },
          {
            name: 'WORK',
            accent: 'var(--accent-ember)',
            desc: 'That\'s it. Your AI now has the coordinate system. It calls the engine when structure is relevant. You just do your work. Atlas shows up when it matters.',
          },
        ].map((t, i) => (
          <div key={t.name} className="swa-dial-tier" style={{ '--tier-delay': `${i * 0.15}s` }}>
            <div className="swa-dial-indicator" style={{ background: t.accent }} />
            <div className="swa-dial-content">
              <div className="swa-dial-tier-name">{t.name}</div>
              <p className="swa-dial-tier-desc">{t.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── Section 5: Who It's For ─── */
const USE_CASES = [
  {
    title: 'Musicians & Composers',
    accent: 'var(--accent-ember)',
    desc: 'Map albums, tracks, and tours onto narrative arcs. Planetary correspondences as sonic palettes. Natural cycles as structural undercurrents. Your AI becomes a mythology-aware producer.',
  },
  {
    title: 'Writers & Storytellers',
    accent: 'var(--accent-gold)',
    desc: 'Not generic "hero\'s journey" templates. Twenty theoretical frameworks cross-referenced against your specific story. Archetypal figures already mapped. The deep structure that makes narratives resonate.',
  },
  {
    title: 'Filmmakers & Show Designers',
    accent: 'var(--accent-steel)',
    desc: 'Act breaks as mythological thresholds. Visual sequences mapped to cosmological systems. Dome shows, installations, series arcs — structured by the same engine that connects planets to stories to cycles.',
  },
  {
    title: 'Therapists & Coaches',
    accent: 'var(--accent-fire)',
    desc: 'The descent, the forge, the return — these aren\'t just story stages. They\'re frameworks for processing transformation. Your AI draws on them to meet people where they are in the cycle.',
  },
  {
    title: 'Game Designers',
    accent: 'var(--accent-ember)',
    desc: 'Level progression as monomyth phases. Boss encounters at mythological thresholds. World-building grounded in real cosmological systems. Sacred geography with actual coordinates.',
  },
  {
    title: 'Educators & Curriculum Designers',
    accent: 'var(--accent-gold)',
    desc: 'Journey-based pedagogy — riddle, story, personal reflection. A 26-stop cosmic journey as a semester arc. The spiral structure that makes learning stick, built into your AI\'s responses.',
  },
  {
    title: 'Anyone Building Anything',
    accent: 'var(--accent-steel)',
    desc: 'If what you\'re making has stages, cycles, patterns, or arcs — this API has a framework for it. You don\'t need to know mythology. Your AI does the work. You just build.',
  },
];

function BuildersSection() {
  const [ref, visible] = useReveal();
  return (
    <section ref={ref} className={`swa-section swa-builders ${visible ? 'swa-visible' : ''}`}>
      <h2 className="swa-builders-heading">Who Uses This</h2>
      <div className="swa-builders-grid">
        {USE_CASES.map((uc, i) => (
          <div
            key={uc.title}
            className="swa-builder-card"
            style={{ '--card-accent': uc.accent, '--card-delay': `${i * 0.1}s` }}
          >
            <h4>{uc.title}</h4>
            <p>{uc.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── Section 6: The Convergence ─── */
function ConvergenceSection() {
  const [ref, visible] = useReveal();
  return (
    <section ref={ref} className={`swa-section swa-convergence ${visible ? 'swa-visible' : ''}`}>
      <h2 className="swa-convergence-heading">The Deeper You Go, The More It Gives</h2>
      <p>
        This site is the engine, experienced from the inside. The journeys,
        the courses, the Chronosphaera, Atlas, the ancient games — everything
        here is what flows through the API when someone uses it.
      </p>
      <p>
        The more you explore the site, the more you understand what the
        engine can do. The more you use the engine through your key, the more
        reason you have to come back inside and go deeper.
      </p>
      <p>
        <em>The experience is the engine. The engine is the experience.
        They feed each other.</em>
      </p>
    </section>
  );
}

/* ─── Section 7: CTA ─── */
function ReturnSection() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ref, visible] = useReveal();

  return (
    <section ref={ref} className={`swa-section swa-return ${visible ? 'swa-visible' : ''}`}>
      <div className="swa-return-line" />
      <h2 className="swa-return-title">GET YOUR KEY</h2>
      <p className="swa-return-sub">
        One key. One paste. Every AI you touch becomes
        structurally aware — and Atlas signs what it builds.
      </p>
      {user ? (
        <Link to="/profile" className="swa-cta" onClick={() => window.scrollTo(0, 0)}>
          Go to Your Profile
        </Link>
      ) : (
        <button className="swa-cta" onClick={() => navigate('/profile')}>
          Sign In to Get Started
        </button>
      )}
      <p className="swa-return-closing">
        Twenty years of mythology. Eighteen endpoints.
        One signature.
      </p>
    </section>
  );
}

/* ─── Main Page ─── */
export default function SecretWeaponAPIPage() {
  return (
    <div className="swa-page">
      <GateSection />
      <KeySection />
      <InsideSection />
      <AtlasSection />
      <HowSection />
      <BuildersSection />
      <ConvergenceSection />
      <ReturnSection />
    </div>
  );
}
