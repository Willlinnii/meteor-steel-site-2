import React from 'react';

const PLANET_COLORS = {
  Moon:    '#c8d8e8',
  Mercury: '#a8b8c0',
  Venus:   '#d4956a',
  Sun:     '#f0c040',
  Mars:    '#c04040',
  Jupiter: '#8899cc',
  Saturn:  '#7a7a8a',
};

export default function PlanetNode({ planet, metal, cx, cy, selected, onClick }) {
  const color = PLANET_COLORS[planet] || '#aaa';
  const r = selected ? 14 : 11;

  return (
    <g className="planet-node" onClick={onClick} style={{ cursor: 'pointer' }}>
      {selected && (
        <circle cx={cx} cy={cy} r={r + 6} fill="none" stroke={color} strokeWidth="1" opacity="0.4">
          <animate attributeName="r" values={`${r + 4};${r + 8};${r + 4}`} dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.4;0.15;0.4" dur="2s" repeatCount="indefinite" />
        </circle>
      )}
      <circle
        cx={cx} cy={cy} r={r}
        fill={color}
        fillOpacity={selected ? 0.9 : 0.7}
        stroke={color}
        strokeWidth={selected ? 2 : 1}
        filter={selected ? `url(#glow-${planet})` : undefined}
      />
      <text
        x={cx} y={cy + r + 14}
        textAnchor="middle"
        fill={selected ? color : '#a8a8b8'}
        fontSize={selected ? '11' : '10'}
        fontFamily="Cinzel, serif"
        fontWeight={selected ? '700' : '400'}
      >
        {planet}
      </text>
      <text
        x={cx} y={cy + r + 26}
        textAnchor="middle"
        fill={selected ? color : '#888'}
        fontSize="8"
        fontFamily="Crimson Pro, serif"
        opacity="0.7"
      >
        {metal}
      </text>
    </g>
  );
}
