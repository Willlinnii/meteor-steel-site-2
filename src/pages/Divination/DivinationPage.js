import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DivinationToggle from './DivinationToggle';
import './DivinationPage.css';

const TarotPage = lazy(() => import('./TarotPage'));
const TraditionalAstrologyPage = lazy(() => import('./TraditionalAstrologyPage'));
const RecursiveChartPage = lazy(() => import('../RecursiveChart/RecursiveChartPage'));
const DiceRollerPage = lazy(() => import('./DiceRollerPage'));
const IChingPage = lazy(() => import('./IChingPage'));
const GeomancyPage = lazy(() => import('./GeomancyPage'));
const SortesPage = lazy(() => import('./SortesPage'));
const CowrieShellsPage = lazy(() => import('./CowrieShellsPage'));
const ThrowingSticksPage = lazy(() => import('./ThrowingSticksPage'));
const SpinningTopPage = lazy(() => import('./SpinningTopPage'));

const loading = (
  <div className="celestial-loading">
    <span className="celestial-loading-spinner" />
  </div>
);

export default function DivinationPage() {
  return (
    <div className="divination-page">
      <DivinationToggle />
      <Suspense fallback={loading}>
        <Routes>
          <Route path="tarot" element={<TarotPage />} />
          <Route path="traditional-astrology" element={<TraditionalAstrologyPage />} />
          <Route path="mythouse-astrology" element={<RecursiveChartPage />} />
          <Route path="dice" element={<DiceRollerPage />} />
          <Route path="i-ching" element={<IChingPage />} />
          <Route path="geomancy" element={<GeomancyPage />} />
          <Route path="sortes" element={<SortesPage />} />
          <Route path="cowrie" element={<CowrieShellsPage />} />
          <Route path="sticks" element={<ThrowingSticksPage />} />
          <Route path="top" element={<SpinningTopPage />} />
          <Route path="*" element={<Navigate to="mythouse-astrology" replace />} />
        </Routes>
      </Suspense>
    </div>
  );
}
