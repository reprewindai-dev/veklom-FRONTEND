import React from 'react';

interface SparklineTrendProps {
  history?: number[];
  trend?: 'up' | 'down' | 'stable';
  width?: number;
  height?: number;
}

export function SparklineTrend({
  history,
  trend,
  width = 60,
  height = 18
}: SparklineTrendProps) {
  const points = history && history.length >= 2 ? history : [50, 50, 50, 50, 50];
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;

  const coords = points.map((val, idx) => {
    const x = (idx / (points.length - 1)) * width;
    const y = height - ((val - min) / range) * (height - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const pointsString = coords.join(' ');
  const lastCoord = coords[coords.length - 1].split(',');

  const firstVal = points[0];
  const lastVal = points[points.length - 1];
  const isUp = trend === 'up' || (lastVal > firstVal);
  const isDown = trend === 'down' || (lastVal < firstVal);

  const strokeColor = isUp ? '#14bd96' : isDown ? '#f43f5e' : '#38bdf8';
  const fillColor = isUp ? 'rgba(20, 189, 150, 0.15)' : isDown ? 'rgba(244, 63, 94, 0.15)' : 'rgba(56, 189, 248, 0.15)';

  const areaPoints = `0,${height} ${pointsString} ${width},${height}`;

  return (
    <div className="inline-flex items-center gap-1" title={`Historical Trust Trajectory: ${points.join(' → ')}`}>
      <svg width={width} height={height} className="overflow-visible">
        <polygon points={areaPoints} fill={fillColor} />
        <polyline
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={pointsString}
        />
        <circle
          cx={lastCoord[0]}
          cy={lastCoord[1]}
          r="2"
          fill={strokeColor}
          className="animate-pulse"
        />
      </svg>
    </div>
  );
}

export default SparklineTrend;
