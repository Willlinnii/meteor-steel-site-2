import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import sites from '../../data/mythicEarthSites.json';
import useGoogleMapsApi from '../../hooks/useGoogleMapsApi';
import StreetViewPanorama from './StreetViewPanorama';
import './SacredSites360Page.css';

export default function SacredSites360Page() {
  const streetViewSites = useMemo(
    () => sites.filter(s => s.streetView),
    []
  );

  const regions = useMemo(() => {
    const set = new Set(streetViewSites.map(s => s.region));
    return ['All', ...Array.from(set).sort()];
  }, [streetViewSites]);

  const [selectedSite, setSelectedSite] = useState(streetViewSites[0] || null);
  const [regionFilter, setRegionFilter] = useState('All');

  const filtered = regionFilter === 'All'
    ? streetViewSites
    : streetViewSites.filter(s => s.region === regionFilter);

  const mapsKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
  const { isLoaded, error: mapsError } = useGoogleMapsApi(mapsKey);
  const sv = selectedSite
    ? (typeof selectedSite.streetView === 'object' ? selectedSite.streetView : {})
    : {};
  const heading = sv.heading ?? 0;
  const pitch = sv.pitch ?? 0;
  const fov = sv.fov ?? 90;

  return (
    <div className="sacred360-page">
      <div className="sacred360-header">
        <h1 className="sacred360-title">Sacred Sites 360</h1>
        <p className="sacred360-subtitle">
          Explore the world's sacred sites in immersive 360 Street View panoramas.
        </p>
        <Link className="sacred360-back" to="/mythic-earth">
          View on Mythic Earth Globe
        </Link>
      </div>

      <div className="sacred360-layout">
        {/* Site picker */}
        <div className="sacred360-picker">
          <div className="sacred360-regions">
            {regions.map(r => (
              <button
                key={r}
                className={`sacred360-region-btn${regionFilter === r ? ' active' : ''}`}
                onClick={() => setRegionFilter(r)}
              >
                {r}
              </button>
            ))}
          </div>

          <div className="sacred360-site-list">
            {filtered.map(site => (
              <button
                key={site.id}
                className={`sacred360-site-card${selectedSite?.id === site.id ? ' active' : ''}`}
                onClick={() => setSelectedSite(site)}
              >
                <span className="sacred360-site-name">{site.name}</span>
                <span className="sacred360-site-region">{site.region}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Panorama viewer */}
        <div className="sacred360-viewer">
          {selectedSite ? (
            <>
              <h2 className="sacred360-viewer-title">{selectedSite.name}</h2>
              <p className="sacred360-viewer-region">{selectedSite.region}</p>
              <div className="sacred360-iframe-wrap">
                {mapsKey && isLoaded ? (
                  <StreetViewPanorama
                    key={selectedSite.id}
                    lat={selectedSite.lat}
                    lng={selectedSite.lng}
                    heading={heading}
                    pitch={pitch}
                    fov={fov}
                    name={selectedSite.name}
                  />
                ) : mapsKey && !isLoaded && !mapsError ? (
                  <div className="sacred360-fallback">
                    <p>Loading Street View…</p>
                  </div>
                ) : mapsError ? (
                  <div className="sacred360-fallback">
                    <p>Failed to load Google Maps API.</p>
                    <a
                      href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${selectedSite.lat},${selectedSite.lng}&heading=${heading}&pitch=${pitch}&fov=${fov}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="sacred360-fallback-link"
                    >
                      Open in Google Street View
                    </a>
                  </div>
                ) : (
                  <div className="sacred360-fallback">
                    <p>Add a <code>REACT_APP_GOOGLE_MAPS_API_KEY</code> to your <code>.env</code> for embedded Street View.</p>
                    <a
                      href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${selectedSite.lat},${selectedSite.lng}&heading=${heading}&pitch=${pitch}&fov=${fov}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="sacred360-fallback-link"
                    >
                      Open in Google Street View
                    </a>
                  </div>
                )}
              </div>
              <p className="sacred360-viewer-desc">{selectedSite.description}</p>
            </>
          ) : (
            <div className="sacred360-empty">Select a site to begin exploring.</div>
          )}
        </div>
      </div>
    </div>
  );
}
