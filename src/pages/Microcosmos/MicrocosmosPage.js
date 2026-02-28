import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { usePageTracking } from '../../coursework/CourseworkContext';
import { useXRMode } from '../../App';
import { BODY_SYSTEMS } from '../../components/microcosmos/BodySystemDefs';
import BodyScene from '../../components/microcosmos/BodyScene';
import BodyButtonStack from '../../components/microcosmos/BodyButtonStack';
import BodyContentPanel from '../../components/microcosmos/BodyContentPanel';
import './MicrocosmosPage.css';

export default function MicrocosmosPage() {
  const { track } = usePageTracking('microcosmos');
  const [activeSystem, setActiveSystem] = useState(null);
  const [selectedPart, setSelectedPart] = useState(null);
  const [is2D, setIs2D] = useState(false);

  // XR Mode: auto-enable 3D when global xrMode is on
  const { xrMode } = useXRMode();
  useEffect(() => { if (xrMode) setIs2D(false); }, [xrMode]);

  const systemColorMap = useMemo(
    () => Object.fromEntries(BODY_SYSTEMS.map((s) => [s.id, s.color])),
    []
  );

  const handleToggleSystem = useCallback(
    (id) => {
      setActiveSystem((prev) => {
        const next = prev === id ? null : id;
        track(`system.${next ?? 'clear'}`);
        return next;
      });
      setSelectedPart(null);
    },
    [track]
  );

  const handleToggle2D = useCallback(() => {
    setIs2D((prev) => {
      track(`camera.${prev ? '3d' : '2d'}`);
      return !prev;
    });
  }, [track]);

  const handleSelectPart = useCallback(
    (part) => {
      if (part) {
        setSelectedPart(part);
        track(`part.${part.id}`);
      } else {
        setSelectedPart(null);
      }
    },
    [track]
  );

  return (
    <div className="microcosmos-page">
      <div className="microcosmos-viewer-center">
        <BodyScene
          is2D={is2D}
          activeSystem={activeSystem}
          systemColorMap={systemColorMap}
          selectedPart={selectedPart?.id}
          onSelectPart={handleSelectPart}
        />
      </div>

      <BodyButtonStack
        activeSystem={activeSystem}
        onToggleSystem={handleToggleSystem}
        is2D={is2D}
        onToggle2D={handleToggle2D}
      />

      <BodyContentPanel
        activeSystem={activeSystem}
        selectedPart={selectedPart}
      />
    </div>
  );
}
