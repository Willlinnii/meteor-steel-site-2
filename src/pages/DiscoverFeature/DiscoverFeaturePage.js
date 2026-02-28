import React, { useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import useReveal from '../../hooks/useReveal';
import DISCOVER_FEATURE_DEFS, { DISCOVER_FEATURE_ORDER } from '../../data/discoverFeatureDefs';
import './DiscoverFeaturePage.css';

/* ─── SVG Icons for highlight cards ─── */
const ICONS = {
  spiral:        <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M24 4a20 20 0 0 1 0 40 16 16 0 0 1 0-32 12 12 0 0 1 0 24 8 8 0 0 1 0-16 4 4 0 0 1 0 8" strokeLinecap="round"/></svg>,
  ouroboros:     <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="24" cy="24" r="16"/><path d="M40 24l-4-3v6z" fill="currentColor" stroke="none"/><circle cx="8" cy="24" r="2" fill="currentColor"/></svg>,
  layers:        <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M24 8L4 18l20 10 20-10z"/><path d="M4 26l20 10 20-10" opacity=".6"/><path d="M4 34l20 10 20-10" opacity=".3"/></svg>,
  senet:         <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="6" y="14" width="36" height="20" rx="2"/><line x1="18" y1="14" x2="18" y2="34"/><line x1="30" y1="14" x2="30" y2="34"/><line x1="6" y1="24" x2="42" y2="24"/><circle cx="12" cy="19" r="2" fill="currentColor"/><circle cx="36" cy="29" r="2" fill="currentColor"/></svg>,
  ur:            <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="4" y="16" width="40" height="16" rx="2"/><line x1="12" y1="16" x2="12" y2="32"/><line x1="20" y1="16" x2="20" y2="32"/><line x1="28" y1="16" x2="28" y2="32"/><line x1="36" y1="16" x2="36" y2="32"/><circle cx="8" cy="24" r="1.5" fill="currentColor"/><path d="M24 20l2 4-2 4-2-4z" fill="currentColor"/></svg>,
  mancala:       <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5"><ellipse cx="24" cy="24" rx="20" ry="12"/><circle cx="12" cy="22" r="2" fill="currentColor"/><circle cx="20" cy="20" r="2" fill="currentColor"/><circle cx="28" cy="20" r="2" fill="currentColor"/><circle cx="36" cy="22" r="2" fill="currentColor"/><circle cx="16" cy="27" r="2" fill="currentColor"/><circle cx="32" cy="27" r="2" fill="currentColor"/></svg>,
  anvil:         <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 32h28"/><path d="M14 32v-6h20v6"/><path d="M18 26v-8c0-2 2-4 6-4s6 2 6 4v8"/><path d="M22 10l2-4 2 4" strokeLinecap="round"/></svg>,
  dialogue:      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 12h20v14H14l-6 5v-5z" rx="2"/><path d="M20 20h20v14H26l-6 5v-5z" rx="2" opacity=".5"/></svg>,
  scroll:        <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 8c-3 0-6 2-6 5v22c0 3 3 5 6 5"/><path d="M14 8h22v27c0 3-3 5-6 5H14c3 0 6-2 6-5V13c0-3-3-5-6-5z"/><line x1="20" y1="16" x2="32" y2="16" opacity=".5"/><line x1="20" y1="22" x2="32" y2="22" opacity=".5"/><line x1="20" y1="28" x2="28" y2="28" opacity=".5"/></svg>,
  path:          <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 40c0-16 8-16 16-24s16-8 16-8" strokeLinecap="round"/><circle cx="8" cy="40" r="3" fill="currentColor"/><circle cx="40" cy="8" r="3"/></svg>,
  eye:           <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 24s8-12 20-12 20 12 20 12-8 12-20 12S4 24 4 24z"/><circle cx="24" cy="24" r="5"/><circle cx="24" cy="24" r="2" fill="currentColor"/></svg>,
  constellation: <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="24" cy="10" r="2" fill="currentColor"/><circle cx="10" cy="24" r="2" fill="currentColor"/><circle cx="38" cy="24" r="2" fill="currentColor"/><circle cx="16" cy="38" r="2" fill="currentColor"/><circle cx="34" cy="36" r="2" fill="currentColor"/><line x1="24" y1="10" x2="10" y2="24"/><line x1="24" y1="10" x2="38" y2="24"/><line x1="10" y1="24" x2="16" y2="38"/><line x1="38" y1="24" x2="34" y2="36"/><line x1="16" y1="38" x2="34" y2="36"/></svg>,
  orbit:         <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="24" cy="24" r="4" fill="currentColor"/><ellipse cx="24" cy="24" rx="20" ry="8"/><ellipse cx="24" cy="24" rx="20" ry="8" transform="rotate(60 24 24)" opacity=".5"/><ellipse cx="24" cy="24" rx="20" ry="8" transform="rotate(120 24 24)" opacity=".3"/></svg>,
  zodiac:        <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="24" cy="24" r="18"/><circle cx="24" cy="24" r="12" opacity=".4"/>{[0,30,60,90,120,150,180,210,240,270,300,330].map(a=><line key={a} x1={24+18*Math.cos(a*Math.PI/180)} y1={24+18*Math.sin(a*Math.PI/180)} x2={24+12*Math.cos(a*Math.PI/180)} y2={24+12*Math.sin(a*Math.PI/180)} opacity=".6"/>)}</svg>,
  body:          <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="24" cy="10" r="5"/><line x1="24" y1="15" x2="24" y2="32"/><line x1="24" y1="20" x2="14" y2="26"/><line x1="24" y1="20" x2="34" y2="26"/><line x1="24" y1="32" x2="16" y2="42"/><line x1="24" y1="32" x2="32" y2="42"/><circle cx="24" cy="24" r="2" fill="currentColor" opacity=".5"/></svg>,
  stages:        <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="24" cy="24" r="18"/>{[0,1,2,3,4,5,6,7].map(i=>{const a=(i*45-90)*Math.PI/180;return <circle key={i} cx={24+16*Math.cos(a)} cy={24+16*Math.sin(a)} r="2.5" fill="currentColor" opacity={i===0?1:0.5}/>})}</svg>,
  figures:       <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="16" cy="14" r="4"/><circle cx="32" cy="14" r="4"/><circle cx="24" cy="30" r="4"/><path d="M16 18v8l8 4 8-4v-8" opacity=".4"/></svg>,
  theorists:     <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="8" y="8" width="14" height="18" rx="2"/><rect x="26" y="8" width="14" height="18" rx="2"/><rect x="17" y="22" width="14" height="18" rx="2"/><line x1="12" y1="14" x2="18" y2="14" opacity=".4"/><line x1="30" y1="14" x2="36" y2="14" opacity=".4"/><line x1="21" y1="28" x2="27" y2="28" opacity=".4"/></svg>,
  film:          <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="6" y="10" width="36" height="28" rx="3"/><path d="M6 16h36M6 32h36"/><line x1="12" y1="10" x2="12" y2="16"/><line x1="18" y1="10" x2="18" y2="16"/><line x1="30" y1="10" x2="30" y2="16"/><line x1="36" y1="10" x2="36" y2="16"/><polygon points="20,21 20,29 30,25" fill="currentColor" opacity=".6"/></svg>,
  lecture:       <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="8" y="6" width="32" height="24" rx="2"/><line x1="16" y1="34" x2="32" y2="34"/><line x1="24" y1="30" x2="24" y2="34"/><circle cx="24" cy="18" r="6" opacity=".4"/><path d="M20 16l6 4-6 4z" fill="currentColor"/></svg>,
  salon:         <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="14" cy="20" r="4"/><circle cx="34" cy="20" r="4"/><circle cx="24" cy="14" r="4"/><path d="M8 34c0-4 3-8 6-8h0c2 2 6 2 8 0h4c2 2 6 2 8 0h0c3 0 6 4 6 8" opacity=".5"/></svg>,
  personas:      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="24" cy="24" r="16"/><circle cx="24" cy="24" r="6"/><circle cx="24" cy="24" r="2" fill="currentColor"/>{[0,60,120,180,240,300].map(a=><circle key={a} cx={24+13*Math.cos(a*Math.PI/180)} cy={24+13*Math.sin(a*Math.PI/180)} r="2" fill="currentColor" opacity=".5"/>)}</svg>,
  voice:         <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="20" y="8" width="8" height="18" rx="4"/><path d="M14 24c0 6 4 10 10 10s10-4 10-10"/><line x1="24" y1="34" x2="24" y2="40"/><line x1="18" y1="40" x2="30" y2="40"/></svg>,
  memory:        <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="24" cy="24" r="16"/><path d="M24 8v16l10 6" strokeLinecap="round"/><circle cx="24" cy="24" r="2" fill="currentColor"/></svg>,
  guild:         <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M24 6l4 8h8l-6 6 2 8-8-4-8 4 2-8-6-6h8z" fill="currentColor" opacity=".15"/><path d="M24 6l4 8h8l-6 6 2 8-8-4-8 4 2-8-6-6h8z"/></svg>,
  'guild-member': <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="24" cy="14" r="6"/><path d="M12 38c0-7 5-12 12-12s12 5 12 12"/><path d="M24 26v6"/><path d="M20 30l4-4 4 4" opacity=".5"/></svg>,
  shared:        <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="16" cy="16" r="5"/><circle cx="32" cy="16" r="5"/><circle cx="24" cy="34" r="5"/><line x1="16" y1="21" x2="24" y2="29"/><line x1="32" y1="21" x2="24" y2="29"/><line x1="19" y1="18" x2="29" y2="18" opacity=".4"/></svg>,
  panorama:      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5"><ellipse cx="24" cy="24" rx="20" ry="14"/><path d="M4 24c4-2 10-4 20-4s16 2 20 4" opacity=".4"/><ellipse cx="24" cy="24" rx="20" ry="14" transform="rotate(90 24 24)" opacity=".3"/></svg>,
  globe:         <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="24" cy="24" r="18"/><ellipse cx="24" cy="24" rx="8" ry="18"/><path d="M6 24h36" opacity=".4"/><path d="M8 16h32" opacity=".3"/><path d="M8 32h32" opacity=".3"/></svg>,
};

function HighlightIcon({ name }) {
  return <div className="dfp-hl-icon">{ICONS[name] || ICONS.constellation}</div>;
}

/* ─── Animated hero ring SVG ─── */
function HeroRing({ accent }) {
  return (
    <svg className="dfp-hero-ring" viewBox="0 0 200 200" fill="none">
      <circle cx="100" cy="100" r="80" stroke={accent} strokeWidth="0.5" opacity="0.15" />
      <circle cx="100" cy="100" r="60" stroke={accent} strokeWidth="0.5" opacity="0.1" className="dfp-ring-rotate" />
      <circle cx="100" cy="100" r="40" stroke={accent} strokeWidth="0.5" opacity="0.2" className="dfp-ring-rotate-reverse" />
      {[0, 60, 120, 180, 240, 300].map(a => (
        <circle
          key={a}
          cx={100 + 80 * Math.cos(a * Math.PI / 180)}
          cy={100 + 80 * Math.sin(a * Math.PI / 180)}
          r="2"
          fill={accent}
          opacity="0.3"
          className="dfp-ring-dot"
          style={{ animationDelay: `${a / 100}s` }}
        />
      ))}
    </svg>
  );
}

/* ─── Hero Gate ─── */
function FeatureGateSection({ title, subtitle, tagline, accent }) {
  return (
    <section className="dfp-gate">
      <HeroRing accent={accent} />
      <div className="dfp-gate-line" style={{ background: accent }} />
      <h1 className="dfp-gate-title" style={{ color: accent }}>{title}</h1>
      <p className="dfp-gate-subtitle">{subtitle}</p>
      {tagline && <p className="dfp-gate-tagline">{tagline}</p>}
      <div className="dfp-scroll-hint" aria-hidden="true">&#8964;</div>
    </section>
  );
}

/* ─── Highlight Cards ─── */
function HighlightsSection({ highlights, accent }) {
  const [ref, visible] = useReveal();
  return (
    <section ref={ref} className={`dfp-highlights ${visible ? 'dfp-visible' : ''}`}>
      {highlights.map((h, i) => (
        <div key={i} className="dfp-hl-card" style={{ '--hl-accent': accent, animationDelay: `${0.15 + i * 0.12}s` }}>
          <HighlightIcon name={h.icon} />
          <h3 className="dfp-hl-label">{h.label}</h3>
          <p className="dfp-hl-desc">{h.desc}</p>
        </div>
      ))}
    </section>
  );
}

/* ─── CTA Section ─── */
function FeatureCTASection({ ctaText, ctaLink, accent }) {
  return (
    <section className="dfp-cta-section">
      <Link to={ctaLink} className="dfp-cta" style={{ color: accent, borderColor: accent }}>
        {ctaText} &rarr;
      </Link>
    </section>
  );
}

/* ─── White Paper Accordion ─── */
function WhitePaperSection({ title, sections, accent }) {
  const [open, setOpen] = useState(false);
  const [openIdx, setOpenIdx] = useState(null);

  const toggleIdx = useCallback((i) => {
    setOpenIdx(prev => prev === i ? null : i);
  }, []);

  const sectionTitle = (s) => {
    if (s.heading) return s.heading;
    if (s.type === 'quote') return 'Reflection';
    return s.type.charAt(0).toUpperCase() + s.type.slice(1);
  };

  return (
    <section className="dfp-whitepaper">
      <button
        className={`dfp-wp-toggle ${open ? 'dfp-wp-open' : ''}`}
        onClick={() => setOpen(o => !o)}
        style={{ '--wp-accent': accent }}
      >
        <span className="dfp-wp-toggle-label">{title}</span>
        <span className="dfp-wp-toggle-hint">{open ? 'Close' : 'Read More'}</span>
        <svg className={`dfp-wp-chevron ${open ? 'dfp-wp-chevron-open' : ''}`} width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="3,5 7,9 11,5" /></svg>
      </button>

      {open && (
        <div className="dfp-wp-body">
          {sections.map((s, i) => (
            <div key={i} className="dfp-wp-item">
              <button
                className={`dfp-wp-item-header ${openIdx === i ? 'dfp-wp-item-active' : ''}`}
                onClick={() => toggleIdx(i)}
                style={{ '--wp-accent': accent }}
              >
                <span className="dfp-wp-item-type">{s.type}</span>
                <span>{sectionTitle(s)}</span>
                <svg className={`dfp-wp-chevron ${openIdx === i ? 'dfp-wp-chevron-open' : ''}`} width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="3,4 6,8 9,4" /></svg>
              </button>
              {openIdx === i && (
                <div className="dfp-wp-item-body">
                  <WPSectionContent section={s} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* Render individual section content inside accordion */
function WPSectionContent({ section }) {
  switch (section.type) {
    case 'narrative':
      return (
        <div className="dfp-wp-narrative">
          {section.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
          {section.emphasis && <p className="dfp-wp-emphasis"><em>{section.emphasis}</em></p>}
        </div>
      );
    case 'features':
      return (
        <div className="dfp-wp-features">
          {section.items.map((item, i) => (
            <div key={i} className="dfp-wp-feature-item" style={{ borderLeftColor: item.accent }}>
              <strong>{item.title}</strong>
              <p>{item.description}</p>
            </div>
          ))}
        </div>
      );
    case 'quote':
      return (
        <blockquote className="dfp-wp-quote">
          {section.text}
          {section.attribution && <cite>&mdash; {section.attribution}</cite>}
        </blockquote>
      );
    case 'showcase':
      return (
        <div className="dfp-wp-showcase">
          {section.description && <p>{section.description}</p>}
          <ul>
            {section.highlights.map((h, i) => <li key={i}>{h}</li>)}
          </ul>
        </div>
      );
    case 'comparison':
      return (
        <div className="dfp-wp-comparison">
          <div className="dfp-wp-comp-side">
            <h4>{section.left.label}</h4>
            <p>{section.left.text}</p>
          </div>
          <div className="dfp-wp-comp-side dfp-wp-comp-highlight">
            <h4>{section.right.label}</h4>
            <p>{section.right.text}</p>
          </div>
        </div>
      );
    default:
      return null;
  }
}

/* ─── Navigation Arrows ─── */
function FeatureNavArrows({ currentId }) {
  const navigate = useNavigate();
  const idx = DISCOVER_FEATURE_ORDER.indexOf(currentId);
  const prevId = idx > 0
    ? DISCOVER_FEATURE_ORDER[idx - 1]
    : DISCOVER_FEATURE_ORDER[DISCOVER_FEATURE_ORDER.length - 1];
  const nextId = idx < DISCOVER_FEATURE_ORDER.length - 1
    ? DISCOVER_FEATURE_ORDER[idx + 1]
    : DISCOVER_FEATURE_ORDER[0];
  const prevDef = DISCOVER_FEATURE_DEFS[prevId];
  const nextDef = DISCOVER_FEATURE_DEFS[nextId];

  const go = (id) => {
    window.scrollTo(0, 0);
    navigate(`/discover/${id}`);
  };

  return (
    <>
      <button className="dfp-nav-arrow dfp-nav-prev" onClick={() => go(prevId)} title={prevDef.title}>
        <span className="dfp-nav-arrow-icon">&#8249;</span>
        <span className="dfp-nav-arrow-label">{prevDef.title}</span>
      </button>
      <button className="dfp-nav-arrow dfp-nav-next" onClick={() => go(nextId)} title={nextDef.title}>
        <span className="dfp-nav-arrow-label">{nextDef.title}</span>
        <span className="dfp-nav-arrow-icon">&#8250;</span>
      </button>
    </>
  );
}

/* ─── Main Page ─── */
export default function DiscoverFeaturePage() {
  const { featureId } = useParams();
  const def = DISCOVER_FEATURE_DEFS[featureId];

  if (!def) {
    return (
      <div className="dfp-not-found">
        <h1>Feature not found</h1>
        <Link to="/discover">Back to Discover</Link>
      </div>
    );
  }

  return (
    <div className="dfp-page">
      <FeatureGateSection
        title={def.title}
        subtitle={def.subtitle}
        tagline={def.tagline}
        accent={def.accent}
      />
      <HighlightsSection highlights={def.highlights} accent={def.accent} />
      <FeatureCTASection ctaText={def.ctaText} ctaLink={def.ctaLink} accent={def.accent} />
      <WhitePaperSection
        title={def.whitePaperTitle}
        sections={def.sections}
        accent={def.accent}
      />
      <FeatureNavArrows currentId={def.id} />
    </div>
  );
}
