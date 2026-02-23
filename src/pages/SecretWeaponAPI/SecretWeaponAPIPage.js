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
        An API key that connects your tools to a mythology engine
        built over twenty years.
      </p>
      <div className="swa-scroll-hint" aria-hidden="true">&#8964;</div>
    </section>
  );
}

/* ─── Section 1: What the Key Does ─── */
function KeySection() {
  const [ref, visible] = useReveal();
  return (
    <section ref={ref} className={`swa-section swa-key ${visible ? 'swa-visible' : ''}`}>
      <h2 className="swa-key-heading">What the Key Does</h2>
      <p>
        You generate an API key. You add it to your project. When you send
        a message through that key, you are not talking to a raw AI model —
        you are talking to an intelligence shaped by mythological frameworks,
        archetypal patterns, and a constellation of personas trained on
        decades of scholarship.
      </p>
      <p>
        Ask it about the hero's journey and it responds from inside the
        structure — not summarizing Campbell, but thinking through the stages.
        Ask it about a planetary correspondence and it draws on the
        Chronosphaera's web of associations between metals, days, gods,
        and stories. Ask it to help you write and it brings narrative
        architecture — not templates, but the deep patterns that make
        stories work.
      </p>
      <p>
        One endpoint. One key. The entire engine behind it.
      </p>
      <div className="swa-code-block">
        <span className="swa-code-comment">{'// send a message through the engine'}</span>{'\n'}
        <span className="swa-code-key">const</span> res = <span className="swa-code-key">await</span> fetch(<span className="swa-code-string">'/api/mythouse'</span>, {'{\n'}
        {'  '}<span className="swa-code-key">method</span>: <span className="swa-code-string">'POST'</span>,{'\n'}
        {'  '}<span className="swa-code-key">headers</span>: {'{\n'}
        {'    '}<span className="swa-code-string">'Content-Type'</span>: <span className="swa-code-string">'application/json'</span>,{'\n'}
        {'    '}<span className="swa-code-string">'Authorization'</span>: <span className="swa-code-string">'Bearer myt_your_key_here'</span>{'\n'}
        {'  },\n'}
        {'  '}<span className="swa-code-key">body</span>: JSON.stringify({'{\n'}
        {'    '}<span className="swa-code-key">messages</span>: [{'{ '}
        <span className="swa-code-key">role</span>: <span className="swa-code-string">'user'</span>,{' '}
        <span className="swa-code-key">content</span>: <span className="swa-code-string">"What stage of the journey is this?"</span>
        {' }]\n'}
        {'  }'}){'  \n'}
        {'}'});
      </div>
    </section>
  );
}

/* ─── Section 2: What's Inside ─── */
const LAYERS = [
  {
    icon: '\u2609', // Sun
    title: 'Atlas & Personas',
    desc: 'A mythological intelligence and a constellation of voices — each with distinct perspective, grounding, and depth. Available through the API as conversational partners for any context.',
  },
  {
    icon: '\u263F', // Mercury
    title: 'The Hero\'s Journey',
    desc: 'The monomyth as an active framework. Not a diagram — a working model of stages, thresholds, and transformations that the engine thinks through on every response.',
  },
  {
    icon: '\u2640', // Venus
    title: 'The Chronosphaera',
    desc: 'Planetary correspondences, ancient calendar systems, alchemical associations. The entire web of connections between metals, days, gods, archetypes, and stories — queryable.',
  },
  {
    icon: '\u2642', // Mars
    title: 'Narrative Architecture',
    desc: 'Story structure at the mythological level. The engine understands where someone is in a narrative arc and can shape responses to meet them at their stage.',
  },
  {
    icon: '\u2643', // Jupiter
    title: 'Mythological Scholarship',
    desc: 'Twenty years of research, primary texts, comparative mythology, and the living Myth Salon tradition. Embedded in the engine, not appended as context.',
  },
  {
    icon: '\u2644', // Saturn
    title: 'Journey Intelligence',
    desc: 'Guided spiral structures — riddle, story, personal reflection — that the engine can deploy in therapeutic, educational, or creative contexts.',
  },
];

function InsideSection() {
  const [ref, visible] = useReveal();
  return (
    <section ref={ref} className={`swa-section swa-inside ${visible ? 'swa-visible' : ''}`}>
      <h2 className="swa-inside-heading">What Lives Behind the Key</h2>
      <p className="swa-inside-sub">
        This site is the explorable inside of the engine. Everything you
        encounter here is what flows through the API when you use it.
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

/* ─── Section 3: The Lens ─── */
function LensSection() {
  const [ref, visible] = useReveal();
  return (
    <section ref={ref} className={`swa-section swa-lens ${visible ? 'swa-visible' : ''}`}>
      <div className="swa-divider">
        <div className="swa-divider-line" />
        <div className="swa-divider-diamond" />
        <div className="swa-divider-line" />
      </div>
      <h2 className="swa-lens-heading">A Lens, Not a Replacement</h2>
      <p>
        The Secret Weapon API does not replace foundation models. It sits
        between you and them. When intelligence passes through this key,
        it is shaped by frameworks, personas, and scholarship that no
        system prompt can replicate.
      </p>
      <p>
        You are not choosing this instead of Claude or GPT. You are
        accessing them through something that makes them work differently —
        with mythological depth, narrative awareness, and associative
        richness built in.
      </p>
    </section>
  );
}

/* ─── Section 4: The Dial ─── */
const TIERS = [
  {
    name: 'EXPERIENCE',
    accent: 'var(--accent-steel)',
    desc: 'You are here now. The site itself — courses, journeys, Atlas, the Chronosphaera, ancient games — is the full engine, experienced from the inside. Free. No key required.',
  },
  {
    name: 'CALL',
    accent: 'var(--accent-fire)',
    desc: 'Take the engine with you. Each request through your API key carries the meaning architecture into your own tools and projects. You ask, the engine responds — shaped by everything that lives here.',
  },
  {
    name: 'AMBIENT',
    accent: 'var(--accent-ember)',
    desc: 'The engine is fully on. The complete context loads into your environment so every interaction passes through the full depth — not waiting to be called, but present.',
  },
];

function DialSection() {
  const [ref, visible] = useReveal();
  return (
    <section ref={ref} className={`swa-section swa-engine ${visible ? 'swa-visible' : ''}`}>
      <h2 className="swa-engine-heading">One Engine. One Dial.</h2>
      <p className="swa-engine-sub">
        The site, the key, and the ambient layer are the same intelligence
        at different levels of access.
      </p>
      <div className="swa-dial">
        {TIERS.map((t, i) => (
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

/* ─── Section 5: For Builders ─── */
const USE_CASES = [
  {
    title: 'Therapeutic Tools',
    accent: 'var(--accent-ember)',
    desc: 'Load the engine into a therapy or coaching app. Your users get mythologically grounded, archetypally aware responses — without designing the frameworks from scratch.',
  },
  {
    title: 'Creative Environments',
    accent: 'var(--accent-gold)',
    desc: 'Writing tools, worldbuilding platforms, narrative design. The engine brings story structure, symbolic depth, and associative richness into the creative process.',
  },
  {
    title: 'Education Platforms',
    accent: 'var(--accent-steel)',
    desc: 'The journey architecture and spiral pedagogy — riddle, story, reflection — become available to any learning platform that integrates the key.',
  },
  {
    title: 'Personal Projects',
    accent: 'var(--accent-fire)',
    desc: 'A script, a prototype, a workflow. The full meaning architecture is available from a single API call. Start small. The engine meets you wherever you are.',
  },
];

function BuildersSection() {
  const [ref, visible] = useReveal();
  return (
    <section ref={ref} className={`swa-section swa-builders ${visible ? 'swa-visible' : ''}`}>
      <h2 className="swa-builders-heading">Built For</h2>
      <div className="swa-builders-grid">
        {USE_CASES.map((uc, i) => (
          <div
            key={uc.title}
            className="swa-builder-card"
            style={{ '--card-accent': uc.accent, '--card-delay': `${i * 0.12}s` }}
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
      <h2 className="swa-convergence-heading">Where Education Becomes Engine</h2>
      <p>
        Every other platform separates learning from tooling. You study here,
        you build there. The application is always disconnected from the understanding.
      </p>
      <p>
        This is different. The deeper you go into the experience — journeys,
        courses, Atlas conversations, ancient games — the more you understand
        the engine. And the more you use the engine through your key, the more
        reason you have to come back inside and go deeper.
      </p>
      <p>
        <em>The learning is the engine. The engine is the learning.
        They are not sequential. They are simultaneous.</em>
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
        The site you are standing inside right now is the engine.
        The key lets you take it with you.
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
        Explore the site. Go deeper. And when you are ready —
        turn the dial.
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
      <LensSection />
      <DialSection />
      <BuildersSection />
      <ConvergenceSection />
      <ReturnSection />
    </div>
  );
}
