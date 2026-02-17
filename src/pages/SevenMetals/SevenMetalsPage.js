import React, { useState, useMemo } from 'react';
import OrbitalDiagram from '../../components/sevenMetals/OrbitalDiagram';
import MetalDetailPanel from '../../components/sevenMetals/MetalDetailPanel';
import './SevenMetalsPage.css';

import coreData from '../../data/sevenMetals.json';
import deitiesData from '../../data/sevenMetalsDeities.json';
import archetypesData from '../../data/sevenMetalsArchetypes.json';
import artistsData from '../../data/sevenMetalsArtists.json';
import hebrewData from '../../data/sevenMetalsHebrew.json';
import modernData from '../../data/sevenMetalsModern.json';
import sharedData from '../../data/sevenMetalsShared.json';
import storiesData from '../../data/sevenMetalsStories.json';
import theologyData from '../../data/sevenMetalsTheology.json';

function findBySin(arr, sin) {
  return arr.find(item => item.sin === sin) || null;
}

function findByMetal(arr, metal) {
  return arr.find(item => item.metal === metal) || null;
}

export default function SevenMetalsPage() {
  const [selectedPlanet, setSelectedPlanet] = useState('Sun');
  const [activeTab, setActiveTab] = useState('overview');
  const [activeCulture, setActiveCulture] = useState(null);

  const mergedData = useMemo(() => {
    const map = {};
    coreData.forEach(item => {
      map[item.planet] = {
        core: item,
        deities: findByMetal(deitiesData, item.metal),
        archetype: findBySin(archetypesData, item.sin),
        artists: findBySin(artistsData, item.sin),
        hebrew: findByMetal(hebrewData, item.metal),
        modern: findBySin(modernData, item.sin),
        shared: sharedData,
        stories: findBySin(storiesData, item.sin),
        theology: findBySin(theologyData, item.sin),
      };
    });
    return map;
  }, []);

  const currentData = mergedData[selectedPlanet] || null;

  return (
    <div className="seven-metals-page">
      <div className="metals-layout">
        <div className="metals-diagram-col">
          <OrbitalDiagram
            selectedPlanet={selectedPlanet}
            onSelectPlanet={setSelectedPlanet}
          />
        </div>
        <div className="metals-detail-col">
          {currentData ? (
            <>
              <h2 className="metals-heading">
                {currentData.core.planet} — {currentData.core.metal}
                <span className="metals-sub">{currentData.core.day} · {currentData.core.sin} / {currentData.core.virtue}</span>
              </h2>
              <MetalDetailPanel
                data={currentData}
                activeTab={activeTab}
                onSelectTab={setActiveTab}
                activeCulture={activeCulture}
                onSelectCulture={setActiveCulture}
              />
            </>
          ) : (
            <p className="metals-empty">Select a planet to explore its metal.</p>
          )}
        </div>
      </div>
    </div>
  );
}
