import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import './DiscoverPage.css';

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

/* ─── Feature Chambers data ─── */
const CHAMBERS = [
  {
    title: 'Monomyth Explorer',
    quote: 'The hero with a thousand faces is also the hero with your face. Walk the stages. See yourself in the pattern.',
    path: '/monomyth',
    accent: '#c4713a', // ember
  },
  {
    title: 'Chronosphaera',
    quote: 'Seven metals. Seven planets. Seven days. The ancients saw the cosmos as a living clock — and so can you.',
    path: '/chronosphaera',
    accent: '#c9a961', // gold
  },
  {
    title: 'Atlas',
    quote: 'An intelligence trained in the mythological imagination. Not a search engine — a dialogue with the deep.',
    path: '/atlas',
    accent: '#8b9dc3', // steel
  },
  {
    title: 'Story Forge',
    quote: 'Your life is a myth in progress. The Forge is where you shape it — stage by stage, symbol by symbol.',
    path: '/story-forge',
    accent: '#d4a574', // fire
  },
  {
    title: 'Journeys',
    quote: 'Guided descents through layered meaning. Each journey is a spiral — you return changed.',
    path: '/yellow-brick-road',
    accent: '#c9a961',
  },
  {
    title: 'Ancient Games',
    quote: 'Senet. The Royal Game of Ur. Mancala. These are not relics — they are living rituals of play.',
    path: '/games',
    accent: '#c4713a',
  },
  {
    title: 'Mythology Channel',
    quote: 'Curated film, lecture, and documentary — a mythology education in motion.',
    path: '/mythology-channel',
    accent: '#8b9dc3',
  },
  {
    title: 'Mythic Earth',
    quote: 'Every place on the map holds a story beneath the surface. This is geography as mythology.',
    path: '/mythic-earth',
    accent: '#d4a574',
  },
  {
    title: 'Sacred Sites 360',
    quote: 'Step inside temples, caves, and stone circles. Immersive panoramas of humanity\'s most sacred ground.',
    path: '/sacred-sites-360',
    accent: '#c9a961',
  },
  {
    title: 'Library',
    quote: 'Primary texts. Scholarship. The mythic tradition preserved and searchable — a living archive.',
    path: '/library',
    accent: '#8b9dc3',
  },
  {
    title: 'Coursework',
    quote: 'Track your path through the material. Courses emerge from what you explore — not from a syllabus.',
    path: '/profile',
    accent: '#c4713a',
  },
  {
    title: 'The Guild',
    quote: 'Mythology is not meant to be studied alone. The Guild connects seekers. Guild members guide the descent.',
    path: '/guild',
    accent: '#d4a574',
  },
];

const SEEKER_NODES = [
  'Depth & Psyche',
  'Story & Craft',
  'Myth & Scholarship',
  'Spirit & Transformation',
  'Play & Discovery',
  'Culture & History',
];

const RESONANCE = [
  'If you study the symbols that dream through us — you belong here.',
  'If you write, direct, or build worlds from the raw material of myth — you belong here.',
  'If you read the old stories not as relics but as living mirrors — you belong here.',
  'If you seek the sacred without being told what to believe — you belong here.',
  'If you learn through play, riddles, and the joy of ancient strategy — you belong here.',
  'If you trace the patterns that connect civilizations across time — you belong here.',
];

/* ─── Constellation SVG ─── */
function Constellation() {
  const cx = 200, cy = 170, r = 120;
  const nodes = SEEKER_NODES.map((label, i) => {
    const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
    return { label, x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  });

  // Lines connecting each node to center and to neighbors
  const lines = [];
  nodes.forEach((n, i) => {
    lines.push({ x1: cx, y1: cy, x2: n.x, y2: n.y });
    const next = nodes[(i + 1) % nodes.length];
    lines.push({ x1: n.x, y1: n.y, x2: next.x, y2: next.y });
  });

  return (
    <svg viewBox="0 0 400 340" width="400" height="340">
      {lines.map((l, i) => (
        <line key={i} className="discover-constellation-line"
          x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} />
      ))}
      {/* Center node */}
      <circle cx={cx} cy={cy} r={18} className="discover-node-circle" />
      <text x={cx} y={cy - 4} className="discover-node-center">THE</text>
      <text x={cx} y={cy + 10} className="discover-node-center">SEEKER</text>
      {/* Outer nodes */}
      {nodes.map((n, i) => {
        const parts = n.label.split(' & ');
        return (
          <g key={i}>
            <circle cx={n.x} cy={n.y} r={14} className="discover-node-circle"
              style={{ animationDelay: `${i * 0.4}s` }} />
            <text x={n.x} y={n.y - 4} className="discover-node-label">{parts[0]} &</text>
            <text x={n.x} y={n.y + 10} className="discover-node-label">{parts[1]}</text>
          </g>
        );
      })}
    </svg>
  );
}

/* ─── Section Components ─── */

function GateSection() {
  return (
    <section className="discover-gate">
      <div className="discover-gate-line" />
      <h1 className="discover-gate-title">MYTHOUSE</h1>
      <p className="discover-gate-narration">
        Every story begins at a threshold. You are standing at one now.
      </p>
      <div className="discover-scroll-hint" aria-hidden="true">&#8964;</div>
    </section>
  );
}

function CallingSection() {
  const [ref, visible] = useReveal();
  return (
    <section ref={ref} className={`discover-section discover-calling ${visible ? 'discover-visible' : ''}`}>
      <h2 className="discover-calling-heading">The Calling</h2>
      <p>
        Mythouse is not a website. It is a living mythological instrument — built for those who sense
        that the old stories still pulse beneath the surface of the modern world.
      </p>
      <p>
        Here, Joseph Campbell's monomyth is not just theory. It is an experience you walk through.
        Ancient planetary wisdom is not a footnote — it is a working calendar.
        An AI does not answer questions — it holds dialogue with the mythological imagination itself.
      </p>
      <p>
        <em>You did not arrive here by accident.</em>
      </p>
    </section>
  );
}

function SeekersSection() {
  const [ref, visible] = useReveal();
  return (
    <section ref={ref} className={`discover-section discover-seekers ${visible ? 'discover-visible' : ''}`}>
      <h2 className="discover-seekers-heading">The Seekers</h2>
      <div className="discover-constellation">
        <Constellation />
      </div>
      {/* Mobile fallback */}
      <div className="discover-constellation-mobile">
        {SEEKER_NODES.map((label, i) => (
          <div key={i} className="discover-constellation-mobile-node">{label}</div>
        ))}
      </div>
      <ul className="discover-resonance-list">
        {RESONANCE.map((text, i) => (
          <li key={i} className="discover-resonance-item">{text}</li>
        ))}
      </ul>
    </section>
  );
}

function DescentSection() {
  const [ref, visible] = useReveal();
  return (
    <section ref={ref} className={`discover-section discover-descent ${visible ? 'discover-visible' : ''}`}>
      <h2 className="discover-descent-heading">The Descent</h2>
      <div className="discover-descent-line" aria-hidden="true" />
      {CHAMBERS.map((c, i) => (
        <div key={i} className="discover-chamber">
          <div className="discover-chamber-spacer" />
          <div className="discover-chamber-card" style={{ borderTopColor: c.accent }}>
            <h3>{c.title}</h3>
            <p>{c.quote}</p>
            <Link to={c.path} className="discover-chamber-link">Enter &rarr;</Link>
          </div>
        </div>
      ))}
    </section>
  );
}

function MakerSection() {
  const [ref, visible] = useReveal();
  return (
    <section ref={ref} className={`discover-section discover-maker ${visible ? 'discover-visible' : ''}`}>
      <div className="discover-divider">
        <div className="discover-divider-line" />
        <div className="discover-divider-diamond" />
        <div className="discover-divider-line" />
      </div>
      <h2 className="discover-maker-heading">The Maker</h2>
      <p>
        Mythouse was created by Will Linn — a mythologist, technologist, and storyteller who has spent
        two decades working at the intersection of ancient narrative and modern experience.
      </p>
      <p>
        He holds a Ph.D. in Mythological Studies from Pacifica Graduate Institute, where the work of
        Joseph Campbell and depth psychology is not merely studied but lived. He has served as a scholar
        with the Joseph Campbell Foundation, built StoryAtlas — a narrative intelligence platform — and
        brought mythological thinking to television and digital media.
      </p>
      <p>
        <em>Mythouse is the instrument he was always building toward — a place where the mythological
        imagination can finally breathe in its native form.</em>
      </p>
    </section>
  );
}

function ReturnSection() {
  const [ref, visible] = useReveal();
  return (
    <section ref={ref} className={`discover-section discover-return ${visible ? 'discover-visible' : ''}`}>
      <div className="discover-return-line" />
      <h2 className="discover-return-title">CROSS THE THRESHOLD</h2>
      <Link to="/home" className="discover-cta">Enter Mythouse</Link>
      <p className="discover-return-closing">The only question left is yours.</p>
    </section>
  );
}

/* ─── Main Page ─── */
export default function DiscoverPage() {
  return (
    <div>
      <GateSection />
      <CallingSection />
      <SeekersSection />
      <DescentSection />
      <MakerSection />
      <ReturnSection />
    </div>
  );
}
