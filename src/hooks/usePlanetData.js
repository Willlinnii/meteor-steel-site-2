import { useMemo } from 'react';

import coreData from '../data/chronosphaera.json';
import deitiesData from '../data/chronosphaeraDeities.json';
import archetypesData from '../data/chronosphaeraArchetypes.json';
import artistsData from '../data/chronosphaeraArtists.json';
import hebrewData from '../data/chronosphaeraHebrew.json';
import modernData from '../data/chronosphaeraModern.json';
import sharedData from '../data/chronosphaeraShared.json';
import storiesData from '../data/chronosphaeraStories.json';
import theologyData from '../data/chronosphaeraTheology.json';

export function findBySin(arr, sin) {
  return arr.find(item => item.sin === sin) || null;
}

export function findByMetal(arr, metal) {
  return arr.find(item => item.metal === metal) || null;
}

export default function usePlanetData() {
  return useMemo(() => {
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
}

export { archetypesData, artistsData, modernData, storiesData, theologyData };
