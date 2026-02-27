import React, { useState, useEffect, useRef } from 'react';
import DODECAHEDRON_RESEARCH from '../../data/dodecahedronResearch';

// ── Dodecahedron gallery images (Wikimedia Commons, freely licensed) ──

const DODEC_GALLERY = [
  {
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Dodecaedron-X-37086-IMG_9258.JPG/960px-Dodecaedron-X-37086-IMG_9258.JPG',
    caption: 'Arles Thermae specimen',
    location: 'Museum of Ancient Arles, France',
    credit: 'Rama',
    license: 'Public Domain',
    link: 'https://commons.wikimedia.org/wiki/File:Dodecaedron-X-37086-IMG_9258.JPG',
  },
  {
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Pentagon-dodeca%C3%ABder_in_brons%2C_150_tot_400_NC%2C_vindplaats-_Tongeren%2C_Leopoldwal%2C_1939%2C_collectie_Gallo-Romeins_Museum_Tongeren%2C_4002.jpg/960px-Pentagon-dodeca%C3%ABder_in_brons%2C_150_tot_400_NC%2C_vindplaats-_Tongeren%2C_Leopoldwal%2C_1939%2C_collectie_Gallo-Romeins_Museum_Tongeren%2C_4002.jpg',
    caption: 'Tongeren specimen, 150–400 AD',
    location: 'Gallo-Romeins Museum, Tongeren, Belgium',
    credit: 'Gallo-Romeins Museum',
    license: 'CC0',
    link: 'https://commons.wikimedia.org/wiki/File:Pentagon-dodeca%C3%ABder_in_brons,_150_tot_400_NC,_vindplaats-_Tongeren,_Leopoldwal,_1939,_collectie_Gallo-Romeins_Museum_Tongeren,_4002.jpg',
  },
  {
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Dodecaedre_Vienne_28072011.jpg/960px-Dodecaedre_Vienne_28072011.jpg',
    caption: 'Beaded dodecahedron, Vienne',
    location: 'Musée des beaux-arts, Vienne, France',
    credit: 'Vassil',
    license: 'CC0',
    link: 'https://commons.wikimedia.org/wiki/File:Dodecaedre_Vienne_28072011.jpg',
  },
  {
    src: 'https://upload.wikimedia.org/wikipedia/commons/a/ac/Grand_dodeca%C3%A8dre_romain_-_Lyon.jpg',
    caption: 'Large specimen, Lyon',
    location: 'Musée gallo-romain de Fourvière, Lyon',
    credit: 'Romainbehar',
    license: 'CC0',
    link: 'https://commons.wikimedia.org/wiki/File:Grand_dodeca%C3%A8dre_romain_-_Lyon.jpg',
  },
  {
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Much_Hadham_Galllo-Roman_dodecahedron.jpg/960px-Much_Hadham_Galllo-Roman_dodecahedron.jpg',
    caption: 'Much Hadham specimen, 2018 find',
    location: 'Hertfordshire, England',
    credit: null,
    license: 'CC BY 2.0',
    link: 'https://commons.wikimedia.org/wiki/File:Much_Hadham_Galllo-Roman_dodecahedron.jpg',
  },
  {
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/2018_Rheinisches_Landesmuseum_Bonn%2C_Dodekaeder_%26_Ikosaeder.jpg/960px-2018_Rheinisches_Landesmuseum_Bonn%2C_Dodekaeder_%26_Ikosaeder.jpg',
    caption: 'Dodecahedra and icosahedron, 3rd c. AD',
    location: 'Rheinisches Landesmuseum, Bonn',
    credit: 'Kleon3',
    license: 'CC BY-SA 4.0',
    link: 'https://commons.wikimedia.org/wiki/File:2018_Rheinisches_Landesmuseum_Bonn,_Dodekaeder_%26_Ikosaeder.jpg',
  },
  {
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Ancient_Roman_dodecahedron%2C_Gallo-Roman_Museum_of_Tongeren%2C_Belgium_%2827543850102%29.jpg/960px-Ancient_Roman_dodecahedron%2C_Gallo-Roman_Museum_of_Tongeren%2C_Belgium_%2827543850102%29.jpg',
    caption: 'Atuatuca Tungrorum specimen',
    location: 'Gallo-Romeins Museum, Tongeren',
    credit: 'Carole Raddato',
    license: 'CC BY-SA 2.0',
    link: 'https://commons.wikimedia.org/wiki/File:Ancient_Roman_dodecahedron,_Gallo-Roman_Museum_of_Tongeren,_Belgium_(27543850102).jpg',
  },
  {
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Mus%C3%A9e_archeo_strasbourg_dodecaedres_en_bronze.JPG/960px-Mus%C3%A9e_archeo_strasbourg_dodecaedres_en_bronze.JPG',
    caption: 'Multiple specimens, Strasbourg',
    location: 'Musée archéologique, Strasbourg',
    credit: 'Chatsam',
    license: 'CC BY-SA 3.0',
    link: 'https://commons.wikimedia.org/wiki/File:Mus%C3%A9e_archeo_strasbourg_dodecaedres_en_bronze.JPG',
  },
  {
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/R%C3%B6mischer_Dodekaeder_im_Museum_Burg_Linn-Krefeld.jpg/960px-R%C3%B6mischer_Dodekaeder_im_Museum_Burg_Linn-Krefeld.jpg',
    caption: 'Krefeld specimen',
    location: 'Museum Burg Linn, Krefeld',
    credit: 'Fredvida',
    license: 'CC BY-SA 4.0',
    link: 'https://commons.wikimedia.org/wiki/File:R%C3%B6mischer_Dodekaeder_im_Museum_Burg_Linn-Krefeld.jpg',
  },
  {
    src: 'https://upload.wikimedia.org/wikipedia/commons/7/79/Roman_dodecahedron.jpg',
    caption: 'Saalburg specimen',
    location: 'Saalburg Roman Fort, near Frankfurt',
    credit: 'Itub',
    license: 'CC BY-SA 3.0',
    link: 'https://commons.wikimedia.org/wiki/File:Roman_dodecahedron.jpg',
  },
];

function DodecGallery() {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  useEffect(() => { checkScroll(); }, []);

  const scroll = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 280, behavior: 'smooth' });
  };

  return (
    <div className="dodec-gallery-wrap">
      {canScrollLeft && (
        <button className="dodec-gallery-arrow dodec-gallery-arrow-left" onClick={() => scroll(-1)} aria-label="Scroll left">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none"><path d="M15 4 L7 12 L15 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      )}
      <div className="dodec-gallery-track" ref={scrollRef} onScroll={checkScroll}>
        {DODEC_GALLERY.map((img, i) => (
          <a key={i} className="dodec-gallery-card" href={img.link} target="_blank" rel="noopener noreferrer">
            <img src={img.src} alt={img.caption} loading="lazy" />
            <span className="dodec-gallery-caption">
              <span className="dodec-gallery-caption-title">{img.caption}</span>
              <span className="dodec-gallery-caption-loc">{img.location}</span>
            </span>
          </a>
        ))}
      </div>
      {canScrollRight && (
        <button className="dodec-gallery-arrow dodec-gallery-arrow-right" onClick={() => scroll(1)} aria-label="Scroll right">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none"><path d="M9 4 L17 12 L9 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      )}
    </div>
  );
}

// ── Per-mode configuration ──────────────────────────────────────────

const MODE_CONFIG = {
  stars: {
    heading: 'Lantern of Phanes',
    tabs: [
      { id: 'overview', label: 'Overview' },
      { id: 'tradition', label: 'The Tradition' },
      { id: 'synthesis', label: 'The Synthesis' },
      { id: 'sources', label: 'Sources' },
    ],
  },
  roman: {
    heading: 'Roman Dodecahedron',
    tabs: [
      { id: 'overview', label: 'Overview' },
      { id: 'riddles', label: 'Riddles' },
      { id: 'theories', label: 'Proposed Theories' },
      { id: 'solution', label: 'The Solution' },
      { id: 'sources', label: 'Sources' },
    ],
  },
  die: {
    heading: 'Etruscan Dodecahedron',
    tabs: [
      { id: 'overview', label: 'Overview' },
    ],
  },
};

// Citations (shared across modes)
const CITATIONS = [
  {
    id: 1,
    short: 'Orphic Hymn 5, "To Protogonos"',
    text: 'O mighty first-begotten, hear my prayer, twofold, egg-born, and wandering through the air, bull-roarer, glorying in thy golden wings...',
    source: 'Orphic Hymns, trans. Thomas Taylor (1792)',
    url: 'https://www.theoi.com/Text/OrphicHymns1.html',
  },
  {
    id: 2,
    short: 'Iamblichus, Vita Pythagorica 88',
    text: 'Hippasus, because of having disclosed and given a diagram for the first time of the sphere from the twelve pentagons, perished in the sea since he committed impiety.',
    source: 'Iamblichus, On the Pythagorean Way of Life, trans. Guthrie (1920)',
    url: 'https://topostext.org/work.php?work_id=487',
  },
  {
    id: 3,
    short: 'Plato, Timaeus 55c',
    text: 'There still being one fifth construction, the god used it for the whole, decorating it.',
    source: 'Plato, Timaeus 55c, trans. W.R.M. Lamb, Loeb Classical Library',
    url: 'https://www.perseus.tufts.edu/hopper/text?doc=Perseus:text:1999.01.0180:text=Tim.:page=55',
  },
  {
    id: 4,
    short: 'Plutarch on Timaeus 55c',
    text: 'Plutarch interpreted Plato\'s cosmic assignment as referring to the twelve zodiacal constellations mapped onto the dodecahedron\'s twelve pentagonal faces, with each face decomposing into 30 scalene triangles yielding 360 total.',
    source: 'Plutarch, Quaestiones Platonicae V; De Iside et Osiride',
  },
  {
    id: 5,
    short: 'Euclid, Elements XIII.17',
    text: 'To construct a dodecahedron and comprehend it in a sphere.',
    source: 'Euclid, Elements, Book XIII, Proposition 17',
    url: 'https://mathcs.clarku.edu/~djoyce/elements/bookXIII/propXIII17.html',
  },
  {
    id: 6,
    short: 'Spitz Model A planetarium (1947)',
    text: 'Armand Spitz, reportedly at Einstein\'s suggestion, used a dodecahedral star globe for an affordable planetarium projector retailing at $500 — compared to Zeiss projectors costing orders of magnitude more.',
    source: 'Spitz Laboratories; Planetarium Projector Museum',
    url: 'https://www.mrdodecahedron.com/mrdodecahedronpodcast/armandspitz',
  },
  {
    id: 7,
    short: 'Plutarch, De defectu oraculorum 427d',
    text: '...the dodecahedron most resembles the sphere and is therefore appropriate for the cosmos...',
    source: 'Plutarch, De defectu oraculorum, Moralia V',
    url: 'https://penelope.uchicago.edu/Thayer/E/Roman/Texts/Plutarch/Moralia/De_defectu_oraculorum*.html',
  },
  {
    id: 8,
    short: 'Proclus, Commentary on the Timaeus (on 55c)',
    text: 'The dodecahedron is the image of the whole; its twelve pentagonal faces correspond to the twelve signs of the zodiac.',
    source: 'Proclus, In Platonis Timaeum commentaria, Diehl ed., Vol. II (5th c. CE)',
    url: null,
  },
  {
    id: 9,
    short: 'Proclus, Commentary on Euclid, Prologue',
    text: 'The purpose of the whole of the Elements is the construction of the five cosmic solids.',
    source: 'Proclus, In primum Euclidis, Friedlein ed., trans. Morrow (1970)',
    url: null,
  },
  {
    id: 10,
    short: 'Plotinus, Enneads IV.4.32',
    text: 'This universe is a sympathetic whole, like one living creature; the distant is near... in a living and unified being there is no part so remote as not to be near, through the very nature that binds the living unity in sympathy.',
    source: 'Plotinus, Enneads IV.4.32, trans. MacKenna (3rd c. CE)',
    url: 'https://en.wikisource.org/wiki/Plotinus_(MacKenna)/Volume_3/Ennead_4.4',
  },
  {
    id: 101,
    short: 'Sparavigna, "An Etruscan Dodecahedron" (2012)',
    text: 'First documented by De\' Stefani in 1885; a soapstone dodecahedron with numerical inscriptions from Monte Loffa, Lessini Mountains, dating to the Iron Age (pre-500 BCE).',
    source: 'A.C. Sparavigna, Polytechnic University of Turin (arXiv:1205.0706)',
    url: 'https://arxiv.org/abs/1205.0706',
  },
  {
    id: 102,
    short: 'Geneva zodiac dodecahedron (2nd–4th c. CE)',
    text: 'A solid lead-and-silver dodecahedron with Latin zodiac sign names on each face, found at the Cathedral of Saint-Pierre in Geneva (1982). A separate artifact from the hollow bronze Gallo-Roman dodecahedra.',
    source: 'Archaeological Museum of Geneva; Language Log analysis',
    url: 'https://languagelog.ldc.upenn.edu/nll/?p=64177',
  },
];

// Solution sub-tabs
const SOLUTION_SUBS = [
  { id: 'core', label: 'The Argument' },
  { id: 'shape', label: 'Why This Shape' },
  { id: 'system', label: 'The System' },
  { id: 'lineage', label: 'The Lineage' },
];

// ── Research data helpers ───────────────────────────────────────────

const sectionById = (id) =>
  DODECAHEDRON_RESEARCH.coreSections.find(s => s.id === id) ||
  DODECAHEDRON_RESEARCH.extensionSections?.find(s => s.id === id);

const coreArgument = sectionById('core-argument');
const theoriesFail = sectionById('other-theories-fail');
const alexandrianSystem = sectionById('alexandrian-system');
const diaspora = sectionById('dodecahedra-diaspora');

// ── Curated riddles ─────────────────────────────────────────────────

const RIDDLES = [
  {
    title: 'The Holes',
    body: 'Every dodecahedron has circular holes in each pentagonal face — but the holes are all different sizes, even on the same object. No two dodecahedrons share the same hole pattern. If these were functional openings, what function requires twelve holes of twelve different diameters?',
  },
  {
    title: 'No Two Alike',
    body: 'Over a hundred dodecahedrons have been found. Not a single pair is identical. Different sizes, different hole diameters, different alloy compositions, different weights. Whatever these were, they were never mass-produced or standardized. Each one was made to be unique.',
  },
  {
    title: 'The Knobs',
    body: 'Small spherical knobs protrude from each of the twenty vertices. They serve no obvious structural purpose. They add weight, complicate manufacturing, and appear on every single specimen. Why would every maker include them?',
  },
  {
    title: 'Coin-Sized Openings',
    body: 'The hole sizes fall within the range of Roman coin diameters. Not a perfect match to any single denomination — the sizes vary too much. But the range of hole sizes across specimens covers the range of coins in circulation. Coincidence, or specification?',
  },
  {
    title: 'Master Metallurgy',
    body: 'These are not crude objects. They required controlled alloying, precision casting, and skilled finishing — the highest level of ancient metalworking. Whoever made these had access to techniques that local smiths in Gaul and Britain did not possess.',
  },
  {
    title: 'Where They Are Found',
    body: 'Temples, military barracks, domestic sites, coin hoards. They appear across Gaul, the Rhine frontier, Britain, and Switzerland — but almost nowhere else in the Roman Empire. And critically: they are never found in metalworkers\' shops. The people who used them were not the people who made them.',
  },
  {
    title: 'They Appear, Then Vanish',
    body: 'The dodecahedrons appear in the 2nd century CE and vanish in the 4th. They emerge during the Roman currency crisis — when devaluation made coins untrustworthy — and disappear when Constantine restores a stable gold standard. The timing is precise.',
  },
  {
    title: 'The Hollow Interior',
    body: 'Every dodecahedron is hollow, with the holes connecting to the interior cavity. Objects can be placed inside. Water can flow through. The hollow construction adds fragility — ruling out any theory that requires physical stress. But it is essential for any theory involving displacement or submersion.',
  },
];

// ── Shared components ───────────────────────────────────────────────

function EntryBlock({ title, body }) {
  const paragraphs = Array.isArray(body) ? body : [body];
  return (
    <div className="dodec-content-entry">
      <h3 className="dodec-content-entry-title">{title}</h3>
      {paragraphs.map((p, i) => (
        <p key={i} className="dodec-content-entry-body">{p}</p>
      ))}
    </div>
  );
}

// Link to a tradition in the Chronosphaera 3D view
function ChronoLink({ tradition, ring = 'source', children }) {
  const href = `/chronosphaera?view=3d&tradition=${tradition}&ring=${ring}`;
  return (
    <a className="dodec-chrono-link" href={href} title={`View in Chronosphaera · ${tradition}`}>
      {children}<svg className="dodec-chrono-link-icon" viewBox="0 0 16 16" width="12" height="12" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1"/><ellipse cx="8" cy="8" rx="3" ry="6.5" stroke="currentColor" strokeWidth="0.8"/><line x1="1.5" y1="8" x2="14.5" y2="8" stroke="currentColor" strokeWidth="0.8"/></svg>
    </a>
  );
}

// ── Citation components ─────────────────────────────────────────────

function Cite({ n }) {
  const cite = CITATIONS.find(c => c.id === n);
  const handleClick = (e) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('dodec-cite-click', { detail: { id: n } }));
  };
  return (
    <span className="dodec-cite">
      <a href={`#dodec-cite-${n}`} title={cite?.short || ''} onClick={handleClick}>[{n}]</a>
    </span>
  );
}

function CitationsBlock({ ids }) {
  const cites = ids
    ? CITATIONS.filter(c => ids.includes(c.id))
    : CITATIONS;
  return (
    <div className="dodec-citations">
      <h4 className="dodec-citations-heading">Sources</h4>
      {cites.map(c => (
        <div key={c.id} id={`dodec-cite-${c.id}`} className="dodec-citation">
          <span className="dodec-citation-num">{c.id}</span>
          <div className="dodec-citation-body">
            <span className="dodec-citation-ref">{c.short}</span>
            {c.text && <p className="dodec-citation-text">"{c.text}"</p>}
            <span className="dodec-citation-source">
              {c.url
                ? <a href={c.url} target="_blank" rel="noopener noreferrer">{c.source}</a>
                : c.source}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Stars mode tabs ─────────────────────────────────────────────────

function StarsOverviewTab() {
  return (
    <div className="dodec-content-tab-inner">
      <p className="dodec-content-lead">
        You are looking at a dodecahedron projecting stars. 5,044 stars, 89
        constellations, 12 pentagonal faces — each face a window onto a region
        of the celestial sphere.
      </p>
      <EntryBlock
        title="The Name"
        body="Phanes — the Orphic god of light and creation — said to emerge from a cosmic egg. The lantern that bears his name is what you see here: a light source inside the shape Plato assigned to the cosmos. The name is ours. The threads are ancient."
      />
      <EntryBlock
        title="The Shape"
        body="The dodecahedron is the rarest Platonic solid and the only one with pentagonal faces. For the Pythagoreans it was sacred — a man was said to have perished at sea for revealing its construction. For Plato, it was the shape of the universe. For modern engineers, it is the natural geometry for projecting a full sphere from a single point. The Tradition tab traces this story from its earliest sources."
      />
      <EntryBlock
        title="An Unsolved Object"
        body="Over a hundred small hollow bronze dodecahedra have been found across the Roman frontier, dating from the 2nd to 4th centuries CE. No ancient text mentions them. No inscription identifies them. They remain one of the most debated artifacts in Roman archaeology. The Roman Dodecahedron mode explores what they were and what they might have been for."
      />
    </div>
  );
}

function StarsTraditionTab() {
  return (
    <div className="dodec-content-tab-inner">
      <p className="dodec-content-lead">
        The dodecahedron has been linked to the cosmos for as long as anyone has
        written about it. What follows is that tradition told in order — from
        the Pythagorean secret to the modern planetarium. No argument about what
        the shape "was for." Just what people said, what the geometry does, and
        where the threads lead.
      </p>
      <EntryBlock
        title={<span><ChronoLink tradition="pythagorean">The Pythagorean Secret</ChronoLink> (c. 500 BCE)</span>}
        body={[
          <span key="p1">Hippasus perished at sea for disclosing "the sphere from the twelve pentagons."<Cite n={2} /> The phrase is striking: not "the solid with twelve faces" but the sphere that arises from them — twelve pentagons defining a sphere. The oldest recorded description of the dodecahedron is already a description of projection geometry.</span>,
          <span key="p2">The Pythagoreans recognized it as the only regular solid encoding the golden ratio.<Cite n={5} /> They guarded it as the mathematical structure of the cosmos.</span>,
          'A note on the drowning: the man who revealed the cosmic shape perished at sea. In Plato\'s system (which inherits from the Pythagoreans), water is the icosahedron — the geometric dual of the dodecahedron.',
        ]}
      />
      <EntryBlock
        title="The Orphic Egg (date uncertain; texts 3rd c. BCE–2nd c. CE)"
        body={[
          <span key="p1">Orphic cosmogony: creation emerges from a cosmic egg. Phanes (Protogonos, "first-born") breaks forth radiating light in all directions.<Cite n={1} /></span>,
          'The image: an enclosed form that, when opened, projects light outward.',
        ]}
      />
      <EntryBlock
        title={<span><ChronoLink tradition="plato">Plato's Assignment</ChronoLink> (c. 360 BCE)</span>}
        body={[
          <span key="p1"><em>Timaeus</em> 55c: four solids assigned to four elements. The fifth — the dodecahedron — assigned to the cosmos itself: "the god used it for the whole, decorating it."<Cite n={3} /></span>,
          'This is the foundational text. Plato doesn\'t say constellations. He says the whole.',
          'But Plato goes further. The cosmos is not merely shaped like a dodecahedron — it is a single living being. The Timaeus describes it as a "living creature" (ζῷον) that contains all other living creatures within itself (30b–31a). It has no eyes, because there is nothing outside it to see. No ears, because there is nothing outside it to hear. It is complete, self-sufficient, and alive — a single organism whose body is the universe.',
        ]}
      />
      <EntryBlock
        title="Euclid's Construction (c. 300 BCE)"
        body={[
          <span key="p1">Elements XIII.17: "To construct a dodecahedron and comprehend it in a sphere."<Cite n={5} /></span>,
          <span key="p2">Proclus later argued that the entire <em>Elements</em> was organized to culminate in the construction of the five cosmic solids in Book XIII.<Cite n={9} /></span>,
        ]}
      />
      <EntryBlock
        title="Plutarch's Interpretation (c. 100 CE)"
        body={[
          <span key="p1"><em>De defectu oraculorum</em> 427d: the dodecahedron "most resembles the sphere" and is therefore appropriate for the cosmos.<Cite n={7} /></span>,
          <span key="p2"><em>Quaestiones Platonicae</em> V: Plutarch interprets Plato's cosmic assignment as the twelve zodiacal constellations mapped onto twelve pentagonal faces, each face decomposing into 30 scalene triangles yielding 360 total.<Cite n={4} /></span>,
          'This is the first explicit connection between the dodecahedron\'s faces and specific regions of the sky.',
        ]}
      />
      <EntryBlock
        title={<span><ChronoLink tradition="neoplatonist">Plotinus and the Living Cosmos</ChronoLink> (3rd c. CE)</span>}
        body={[
          <span key="p1">Plotinus takes Plato's living cosmos and gives it an interior life. The universe is "a sympathetic whole, like one living creature" — every part sensing every other part, not through organs but through the unity of the organism itself.<Cite n={10} /></span>,
          'Plato said the cosmos has no eyes because there is nothing outside it to see. Plotinus follows this through: the cosmos does not need sense organs because it <em>is</em> the sensing. To be sympathetic — to be one body — is fundamentally to perceive. Every part of the All is part of the same body, and that body feels itself everywhere at once (IV.4.24–27).',
          'This matters for the dodecahedron. If the cosmos is a living being that senses itself from within, then the shape assigned to the cosmos is not a container with windows — it is a body whose every face is continuous with what it perceives. Inside and outside are not separate. The geometry does not represent the cosmos. In the Neoplatonic frame, it participates in it.',
        ]}
      />
      <EntryBlock
        title={<span><ChronoLink tradition="neoplatonist">Proclus and the Neoplatonic Tradition</ChronoLink> (5th c. CE)</span>}
        body={[
          <span key="p1">Commentary on the <em>Timaeus</em>: "The dodecahedron is the image of the whole" (εἰκὼν τοῦ παντός). Twelve faces correspond to twelve zodiacal signs.<Cite n={8} /></span>,
          'Proclus attributes this to Pythagorean tradition — he is transmitting, not inventing.',
          'In the Neoplatonic hierarchy, mathematical forms are genuinely intermediate between the intelligible and the sensible. Geometry has ontological significance — the cosmic solids are not metaphors but structures.',
        ]}
      />
      <EntryBlock
        title="The Geometry of Projection"
        body={[
          '12 pentagonal faces. Point light source at center. Each face projects into a solid angle. Together they tile the entire celestial sphere. No gaps, no overlap.',
          'This is not metaphor — it is a geometric fact about the solid that every tradition described as cosmic.',
        ]}
      />
      <EntryBlock
        title="The Planetarium Lineage (1947–present)"
        body={[
          <span key="p1">Armand Spitz, reportedly at Einstein's suggestion, built his Model A planetarium with a dodecahedral star globe.<Cite n={6} /> Bulb inside, star patterns on faces, night sky projected onto a dome. The Gakken Pinhole Planetarium, same geometry, has sold over 500,000 units.</span>,
          'Dodecahedral star projectors are now used worldwide. The geometry that the ancients revered for cosmic reasons is the same geometry that modern engineers use for practical ones.',
        ]}
      />
      <EntryBlock
        title="The Thread"
        body={[
          'A thousand years separate the Pythagorean secret from Proclus. Another fifteen hundred separate Proclus from Spitz. Across that span, the same idea recurs: the dodecahedron is the shape of the cosmos, and its twelve faces map the whole.',
          'No single author held the complete picture. Each source added a piece — sacred geometry, cosmic assignment, zodiacal mapping, spherical tiling, practical projection. The tradition described in fragments what the geometry does in fact.',
        ]}
      />
    </div>
  );
}

// ── Stars synthesis tab ─────────────────────────────────────────────

function StarsSynthesisTab() {
  return (
    <div className="dodec-content-tab-inner">
      <p className="dodec-content-lead">
        The dodecahedron you see here has 12 faces mapped to the real night sky.
        5,044 stars from the Hipparcos catalog assigned to their nearest face.
        Toggle microcosm / macrocosm to see projection in action.
      </p>
      <p className="dodec-content-body">
        <span>Hippasus called it "the sphere from the twelve pentagons."<Cite n={2} /> Plato assigned it to the cosmos.<Cite n={3} /> Plutarch mapped those faces to the zodiac.<Cite n={4} /> Proclus transmitted the same reading five centuries later.<Cite n={8} /> Spitz built a planetarium around it.<Cite n={6} /></span>
      </p>
      <p className="dodec-content-body">
        What you see here is what the tradition described in pieces: a light inside the shape of the universe, projecting the night sky through twelve pentagonal windows. We do not claim a specific ancient lantern artifact. We do not claim the Orphic texts describe a physical device. We claim the threads — cosmogony, geometry, reverence, physics — are mutually consistent, and that assembling them produces what you are looking at.
      </p>
    </div>
  );
}

// ── Roman mode tabs ─────────────────────────────────────────────────

function RomanOverviewTab() {
  return (
    <div className="dodec-content-tab-inner">
      <p className="dodec-content-lead">
        Over a hundred small, hollow bronze objects — twelve pentagonal faces,
        twenty protruding knobs, circular holes of varying sizes — have been
        found across the former Roman provinces of Gaul, Germania, and Britain.
        They date from the 2nd to 4th centuries CE. No ancient text mentions
        them. No inscription identifies them. After two centuries of study, they
        remain one of the most debated artifacts in Roman archaeology.
      </p>
      <DodecGallery />
      <p className="dodec-content-body">
        They are exquisitely crafted. Each one is unique — different alloys,
        different hole sizes, different dimensions. They appear during a period
        of acute monetary crisis in the western empire, when Roman currency was
        being systematically devalued and populations in Gaul could no longer
        trust the face value of their coins.
      </p>
      <p className="dodec-content-body">
        They vanish from the archaeological record at precisely the moment
        Constantine restores a stable gold standard. Whatever problem they
        solved, that problem appears to have been solved by other means in the
        4th century.
      </p>
      <p className="dodec-content-body">
        The shape itself carries weight. In Plato's <em>Timaeus</em>, the
        dodecahedron is assigned to the cosmos as a whole — the fifth solid, the
        container of the universe.<Cite n={3} /> For anyone educated in the
        Platonic tradition, this was not an arbitrary geometry. It was the shape
        of ultimate order.
      </p>
      <p className="dodec-content-body">
        The question is not just what they were used for. The question is what
        kind of system produced them, what population carried them, and what
        problem — pressing enough to justify master metallurgy and Platonic
        symbolism in a single object — they were built to solve.
      </p>
    </div>
  );
}

function RiddlesTab() {
  return (
    <div className="dodec-content-tab-inner">
      <p className="dodec-content-lead">
        Any valid theory of the Roman dodecahedron must account for all of
        the following. Most proposed theories explain one or two. None of the
        conventional explanations explains more than that.
      </p>
      {RIDDLES.map((r, i) => (
        <EntryBlock key={i} title={r.title} body={r.body} />
      ))}
    </div>
  );
}

function TheoriesTab() {
  if (!theoriesFail) return null;
  return (
    <div className="dodec-content-tab-inner">
      <p className="dodec-content-lead">{theoriesFail.summary}</p>
      {theoriesFail.entries.map(entry => (
        <EntryBlock key={entry.id} title={entry.title} body={entry.body} />
      ))}
    </div>
  );
}

// ── Solution sub-tab content ────────────────────────────────────────

function CoreSubTab() {
  if (!coreArgument) return null;
  return (
    <>
      <p className="dodec-content-lead">{coreArgument.summary}</p>
      {coreArgument.entries.map(entry => (
        <EntryBlock key={entry.id} title={entry.title} body={entry.body} />
      ))}
    </>
  );
}

function ShapeSubTab() {
  return (
    <>
      <p className="dodec-content-lead">
        The dodecahedron is not an arbitrary shape. It is the only geometry in
        the ancient world that satisfies every constraint the object needed to
        meet simultaneously. No simpler form works.
      </p>
      <EntryBlock
        title="A Cage, Not a Container"
        body={[
          'The object must be hollow, with openings on every face, so that water flows freely through it during submersion. It must hold objects inside — coins, weights, trade goods — while allowing complete displacement measurement. It is a cage: open enough for water, closed enough for contents.',
          'A sphere with holes is structurally weak. A cube with holes concentrates stress at sharp edges. The dodecahedron distributes twelve openings across twelve faces with no two adjacent holes sharing an edge, maintaining structural integrity even when hollow and perforated.',
        ]}
      />
      <EntryBlock
        title="Stable in Every Orientation"
        body={[
          'The dodecahedron has twenty vertices, each capped with a knob. Set it down on any surface and it rests on three knobs — a natural tripod. Hang it from a single vertex and three faces point downward, forming a natural cradle for contents.',
          'This is not true of a cube (which sits flat but has no natural hanging orientation) or a sphere (which rolls). The dodecahedron is geometrically optimized for both resting and suspension.',
        ]}
      />
      <EntryBlock
        title="Twelve Faces, Twelve Variables"
        body={[
          'Each face has a hole of a different size. Twelve faces means twelve independent variables — twelve different aperture diameters, each measurable independently. This gives every dodecahedron a unique geometric fingerprint that is easy to verify but extremely difficult to replicate.',
          'No simpler polyhedron offers this many independent faces. A cube has six. An octahedron has eight but with triangular faces too small for useful apertures. The dodecahedron is the minimum Platonic solid that provides enough independent faces for a robust identity signature.',
        ]}
      />
      <EntryBlock
        title="The Knobs as Functional Elements"
        body={[
          'Twenty vertex knobs serve multiple roles. They create stable tripod resting points. They provide attachment points for suspension — hang it from a knob by thread or wire and submerge it. They add mass at the vertices, lowering the center of gravity and stabilizing the object in water.',
          'If the dodecahedron were also used as a projection device — a lantern with a light source inside — the knobs would serve as natural retaining points for cards or membranes placed over the apertures.',
        ]}
      />
      <EntryBlock
        title="The Platonic Constraint"
        body={[
          <span key="pc1">For any population educated in the Pythagorean or Platonic tradition, the dodecahedron was not just a useful shape — it was the shape of the cosmos itself.<Cite n={3} /> Using it for a trust instrument would have carried symbolic authority: the geometry of ultimate order applied to the problem of earthly honesty.</span>,
          'This symbolic weight is not separate from the practical function. It reinforces it. A verification device shaped as the cosmos carries an implicit claim: this object embodies the same order it is measuring against. Form and function are unified.',
        ]}
      />
      <EntryBlock
        title="Why Nothing Else Works"
        body={[
          'The object must be: hollow (for displacement), perforated (for water flow), a cage (to hold contents), stable at rest (tripod vertex support), suspendable (for submersion), structurally sound despite perforation, difficult to counterfeit (twelve independent variables), and symbolically meaningful to a Platonic-literate population.',
          'The dodecahedron satisfies all of these constraints simultaneously. No other ancient geometry does. The shape is not decorative — it is the engineering solution.',
        ]}
      />
    </>
  );
}

function SystemSubTab() {
  return (
    <>
      <p className="dodec-content-lead">
        The dodecahedron is not a measuring device. It is a component in a
        verification system — one element in a loop that checks the honesty
        of the entire measurement chain at once.
      </p>
      <EntryBlock
        title="The Verification Loop"
        body={[
          'Place the dodecahedron on a merchant\'s scale. You know its true weight. If the scale reads correctly, the scale is now verified. But you don\'t remove the dodecahedron — you add your goods inside it and weigh both together. In one act, you have verified the instrument and measured the goods.',
          'Now submerge it. You know its true displacement volume. If the water level matches, the volumetric vessel is honest. Add a coin inside and submerge again — the difference in displacement is the coin\'s volume. Compare that against its weight and you have its density. If the density matches the known value for gold or silver, the coin is genuine.',
          'The system is: dodecahedron verifies scale, scale measures goods, water verifies volume, volume plus weight reveals density, density reveals purity. Each step checks the next. Trust flows through the entire chain because the dodecahedron anchors the first link.',
        ]}
      />
      <EntryBlock
        title="Three Confirmations from One Object"
        body={[
          'Weight, volume, and density are three independent physical properties. Most ancient verification tools check one: a weight stone checks mass, a touchstone checks surface composition, a displacement vessel checks volume. Each can be fooled independently.',
          'The dodecahedron checks all three in a single procedure. Weight can be faked by hollowing an object. Volume can be faked by altering an alloy\'s composition. But density — the ratio of weight to volume — cannot be faked without altering both simultaneously. And if you check all three against known values using a single trusted reference object, the system closes. No single deception can beat all three checks at once.',
        ]}
      />
      <EntryBlock
        title="The Absence of Wear"
        body={[
          'At first glance, the dodecahedron\'s smooth surfaces seem to argue against practical use — bronze records handling, and these show remarkably little wear. This has led some to conclude the objects were ceremonial or unused.',
          'But consider how the device would actually be used. Coins dropped into a water-filled bronze chamber do not scrape or strike with force. Water reduces impact, eliminates friction, and prevents the directional wear that microscopes detect. A softer metal falling slowly through water onto harder bronze leaves no striations, no polishing, no abrasion.',
          'Combined with the care that any precision instrument receives — drying, oiling, wrapping — the lack of visible wear is not evidence against use. It is consistent with an object designed to work in a medium that preserves it, maintained by people who understood its value.',
        ]}
      />
      <EntryBlock
        title="An Etruscan Predecessor"
        body={[
          <span key="ml1">The tradition may be older than Rome. A soapstone dodecahedron found at Monte Loffa in northern Italy — within the Rhaetic sphere of influence, historically linked to Etruscan culture — bears numerical inscriptions on its pentagonal faces. It dates to centuries before the Roman specimens.<Cite n={101} /></span>,
          'This earlier object is solid, not hollow. It would not function as a hydrostatic cage. But it could function as a simpler displacement and weight-verification device — a known-weight, known-volume reference object for testing scales and checking purity in the Etruscan trade networks that connected the Mediterranean to Gaul through the Alpine passes.',
          'If correct, the Roman dodecahedra are not inventions without precedent. They are technological descendants — evolved from a solid cosmological standard into a hollow, perforated, multi-function verification cage adapted to the far more complex demands of an empire-wide currency crisis.',
        ]}
      />
      <EntryBlock
        title="Why They Vanish"
        body={[
          'When Constantine restores a stable gold standard with the solidus — a coin whose value could be trusted on its face — the cascade that created the dodecahedra reverses. If you can trust the stamp, you don\'t need to verify the metal. If you don\'t need to verify the metal, you don\'t need hydrostatic measurement. If you don\'t need hydrostatic measurement, you don\'t need the cage.',
          'The dodecahedra disappear from the archaeological record not because the population that carried them disappeared, but because the problem they solved was solved by other means. The instrument became unnecessary when the system it compensated for was repaired.',
        ]}
      />
    </>
  );
}

function LineageSubTab() {
  return (
    <>
      <p className="dodec-content-lead">
        The dodecahedra did not appear from nowhere. They emerged from a specific
        intellectual and engineering tradition — Alexandrian — that had been
        refining the tools of trust, measurement, and sacred geometry for
        centuries before the objects appeared on the Roman frontier.
      </p>
      {alexandrianSystem && alexandrianSystem.entries.map(entry => (
        <EntryBlock key={entry.id} title={entry.title} body={entry.body} />
      ))}
      {diaspora && (
        <>
          {diaspora.entries.find(e => e.id === 'timeframe') && (
            <EntryBlock
              title={diaspora.entries.find(e => e.id === 'timeframe').title}
              body={diaspora.entries.find(e => e.id === 'timeframe').body}
            />
          )}
          {diaspora.entries.find(e => e.id === 'gaul-intersection') && (
            <EntryBlock
              title={diaspora.entries.find(e => e.id === 'gaul-intersection').title}
              body={diaspora.entries.find(e => e.id === 'gaul-intersection').body}
            />
          )}
          {diaspora.entries.find(e => e.id === 'synchronization') && (
            <EntryBlock
              title={diaspora.entries.find(e => e.id === 'synchronization').title}
              body={diaspora.entries.find(e => e.id === 'synchronization').body}
            />
          )}
          {diaspora.entries.find(e => e.id === 'responsible-framing') && (
            <EntryBlock
              title={diaspora.entries.find(e => e.id === 'responsible-framing').title}
              body={diaspora.entries.find(e => e.id === 'responsible-framing').body}
            />
          )}
        </>
      )}
    </>
  );
}

const SOLUTION_SUB_COMPONENTS = {
  core: CoreSubTab,
  shape: ShapeSubTab,
  system: SystemSubTab,
  lineage: LineageSubTab,
};

function SolutionTab() {
  const [activeSub, setActiveSub] = useState('core');
  const SubContent = SOLUTION_SUB_COMPONENTS[activeSub];

  return (
    <div className="dodec-content-tab-inner">
      <div className="dodec-content-subtabs">
        {SOLUTION_SUBS.map(sub => (
          <button
            key={sub.id}
            className={`dodec-content-subtab ${activeSub === sub.id ? 'dodec-content-subtab-active' : ''}`}
            onClick={() => setActiveSub(sub.id)}
          >
            {sub.label}
          </button>
        ))}
      </div>
      <SubContent />
    </div>
  );
}

// ── Sources tabs (per-mode) ──────────────────────────────────────────

const STARS_CITE_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const ROMAN_CITE_IDS = [3, 101, 102];

function StarsSourcesTab() {
  return (
    <div className="dodec-content-tab-inner">
      <CitationsBlock ids={STARS_CITE_IDS} />
    </div>
  );
}

function RomanSourcesTab() {
  return (
    <div className="dodec-content-tab-inner">
      <CitationsBlock ids={ROMAN_CITE_IDS} />
    </div>
  );
}

// ── Die mode tabs ───────────────────────────────────────────────────

function DieOverviewTab() {
  return (
    <div className="dodec-content-tab-inner">
      <p className="dodec-content-lead">
        Content coming soon.
      </p>
    </div>
  );
}

// ── Tab component registry ──────────────────────────────────────────

const TAB_COMPONENTS = {
  stars: {
    overview: StarsOverviewTab,
    tradition: StarsTraditionTab,
    synthesis: StarsSynthesisTab,
    sources: StarsSourcesTab,
  },
  roman: {
    overview: RomanOverviewTab,
    riddles: RiddlesTab,
    theories: TheoriesTab,
    solution: SolutionTab,
    sources: RomanSourcesTab,
  },
  die: {
    overview: DieOverviewTab,
  },
};

// ── Main component ──────────────────────────────────────────────────

export default function DodecahedronContent({ mode = 'stars', calcOpen, onCalcToggle, onSolutionSelect }) {
  const config = MODE_CONFIG[mode] || MODE_CONFIG.stars;
  const [activeTab, setActiveTab] = useState(config.tabs[0].id);

  // Reset to first tab when mode changes
  useEffect(() => {
    const cfg = MODE_CONFIG[mode] || MODE_CONFIG.stars;
    setActiveTab(cfg.tabs[0].id);
  }, [mode]);

  // Navigate to Sources tab when an inline citation is clicked
  useEffect(() => {
    const handler = (e) => {
      setActiveTab('sources');
      setTimeout(() => {
        document.getElementById(`dodec-cite-${e.detail.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 80);
    };
    window.addEventListener('dodec-cite-click', handler);
    return () => window.removeEventListener('dodec-cite-click', handler);
  }, []);

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    if (tabId === 'solution' && onSolutionSelect) {
      onSolutionSelect();
    }
  };

  const TabContent = TAB_COMPONENTS[mode]?.[activeTab] || (() => null);

  return (
    <div className="dodec-content">
      <div className="dodec-content-handle">
        <div className="dodec-content-handle-bar" />
      </div>

      <h2 className="dodec-content-heading">{config.heading}</h2>

      {config.tabs.length > 1 && (
        <div className="dodec-content-tabs">
          {config.tabs.map(tab => (
            <button
              key={tab.id}
              className={`dodec-content-tab ${activeTab === tab.id ? 'dodec-content-tab-active' : ''}`}
              onClick={() => handleTabClick(tab.id)}
            >
              {tab.label}
            </button>
          ))}
          {mode === 'roman' && onCalcToggle && (
            <button
              className={`dodec-calc-tab-btn ${calcOpen ? 'dodec-calc-tab-btn-active' : ''}`}
              onClick={onCalcToggle}
              aria-label={calcOpen ? 'Close calculator' : 'Open calculator'}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <line x1="12" y1="3" x2="12" y2="20" stroke="currentColor" strokeWidth="1.5" />
                <line x1="7" y1="20" x2="17" y2="20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="4" y1="7" x2="20" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M4 7 L3 13 Q5.5 15 8 13 L7 7" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.12" />
                <path d="M17 7 L16 13 Q18.5 15 21 13 L20 7" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.12" />
              </svg>
            </button>
          )}
        </div>
      )}

      <div className="dodec-content-body-area">
        <TabContent />
      </div>
    </div>
  );
}
