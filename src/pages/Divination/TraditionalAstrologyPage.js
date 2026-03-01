import React from 'react';
import { NatalChartDisplay, NatalChartInput } from './natalChartComponents';
import { useProfile } from '../../profile/ProfileContext';
import '../Profile/ProfilePage.css';

export default function TraditionalAstrologyPage() {
  const { natalChart, updateNatalChart } = useProfile();

  return (
    <div className="divination-traditional">
      <NatalChartDisplay chart={natalChart} />
      <NatalChartInput existingChart={natalChart} onSave={updateNatalChart} />
    </div>
  );
}
