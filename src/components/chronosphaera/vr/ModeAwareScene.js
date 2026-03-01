import React from 'react';
import OrbitalScene from './OrbitalScene';
import StageRing3D from './StageRing3D';
import CalendarRing3D from './CalendarRing3D';
import MedicineWheel3D from './MedicineWheel3D';
import ChakraColumn3D from './ChakraColumn3D';

// Stage ring color themes
const MONOMYTH_COLOR = 'rgba(201, 169, 97, 0.6)';
const MONOMYTH_SELECTED = '#f0c040';
const METEOR_STEEL_COLOR = 'rgba(160, 160, 180, 0.6)';
const METEOR_STEEL_SELECTED = '#a0a0b4';
const STARLIGHT_COLOR = 'rgba(139, 157, 195, 0.6)';
const STARLIGHT_SELECTED = '#8b9dc3';
const STORY_COLOR = 'rgba(180, 140, 100, 0.6)';
const STORY_SELECTED = '#b48c64';

/**
 * Mode router for inline 3D view.
 * Orbital-based modes render OrbitalScene with optional overlay children.
 * Medicine-wheel and chakra get their own dedicated scenes.
 */
export default function ModeAwareScene({
  // Page-level mode flags
  showMedicineWheel,
  chakraViewMode,
  // Orbital selection props (passed through)
  selectedPlanet,
  onSelectPlanet,
  selectedSign,
  onSelectSign,
  selectedCardinal,
  onSelectCardinal,
  selectedEarth,
  onSelectEarth,
  // Calendar props
  showCalendar,
  selectedMonth,
  onSelectMonth,
  // Stage ring props
  showMonomyth,
  showMeteorSteel,
  monomythStages,
  selectedMonomythStage,
  onSelectMonomythStage,
  showFallenStarlight,
  showStoryOfStories,
  starlightStages,
  selectedStarlightStage,
  onSelectStarlightStage,
  // Medicine wheel props
  wheels,
  selectedWheelItem,
  onSelectWheelItem,
  quadrantColorHexes,
  isTraditionView,
  // Chakra props
  orderLabel,
  chakraOrdering,
  // Clock/zodiac mode props
  clockMode,
  zodiacMode,
  showClock,
  layoutMode,
  // Beyond ring props
  beyondRings,
  selectedBeyondRing,
  onSelectBeyondRing,
  activePerspective,
}) {
  // Use explicit layoutMode when provided, otherwise derive from clockMode
  const derivedMode = layoutMode === 'helio' ? 'heliocentric'
    : layoutMode === 'geo' ? 'geocentric'
    : clockMode === '12h' ? 'heliocentric' : 'geocentric';

  // Common orbital props
  const orbitalProps = {
    mode: derivedMode,
    selectedPlanet,
    onSelectPlanet,
    selectedSign,
    onSelectSign,
    selectedCardinal,
    onSelectCardinal,
    selectedEarth,
    onSelectEarth,
    clockMode,
    zodiacMode,
    showClock,
    beyondRings,
    selectedBeyondRing,
    onSelectBeyondRing,
    activePerspective,
  };

  // Medicine wheel mode — dedicated 3D scene
  if (showMedicineWheel) {
    return (
      <MedicineWheel3D
        wheels={wheels}
        selectedWheelItem={selectedWheelItem}
        onSelectWheelItem={onSelectWheelItem}
        quadrantColorHexes={quadrantColorHexes}
        isTraditionView={isTraditionView}
      />
    );
  }

  // Chakra mode — dedicated 3D scene
  if (chakraViewMode) {
    return (
      <ChakraColumn3D
        ordering={chakraOrdering}
        selectedPlanet={selectedPlanet}
        onSelectPlanet={onSelectPlanet}
      />
    );
  }

  // Determine which stage ring overlay to show
  let stageOverlay = null;

  if (showMonomyth && monomythStages) {
    stageOverlay = (
      <StageRing3D
        stages={monomythStages}
        selectedStage={selectedMonomythStage}
        onSelectStage={onSelectMonomythStage}
        color={showMeteorSteel ? METEOR_STEEL_COLOR : MONOMYTH_COLOR}
        selectedColor={showMeteorSteel ? METEOR_STEEL_SELECTED : MONOMYTH_SELECTED}
      />
    );
  } else if (showFallenStarlight && starlightStages) {
    stageOverlay = (
      <StageRing3D
        stages={starlightStages}
        selectedStage={selectedStarlightStage}
        onSelectStage={onSelectStarlightStage}
        color={showStoryOfStories ? STORY_COLOR : STARLIGHT_COLOR}
        selectedColor={showStoryOfStories ? STORY_SELECTED : STARLIGHT_SELECTED}
      />
    );
  }

  // Calendar ring overlay
  let calendarOverlay = null;
  if (showCalendar && !showMonomyth && !showFallenStarlight) {
    calendarOverlay = (
      <CalendarRing3D
        selectedMonth={selectedMonth}
        onSelectMonth={onSelectMonth}
      />
    );
  }

  // All orbital-based modes
  return (
    <OrbitalScene {...orbitalProps}>
      {stageOverlay}
      {calendarOverlay}
    </OrbitalScene>
  );
}
