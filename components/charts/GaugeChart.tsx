import React from 'react';

interface GaugeChartProps {
  value: number;
  label: string;
  max?: number;
}

const GaugeChart: React.FC<GaugeChartProps> = ({ value, label, max = 2 }) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const rotation = (percentage / 100) * 180 - 90;

  const getGradientColor = (p: number) => {
    if (p < 50) return 'from-red-500 to-yellow-500';
    if (p < 75) return 'from-yellow-500 to-green-400';
    return 'from-green-400 to-green-600';
  };

  return (
    <div className="p-4 glass glass-noise flex flex-col items-center justify-between h-full">
      <h3 className="font-semibold text-text-strong mb-2 text-center">{label}</h3>
      <div className="relative w-64 h-32 overflow-hidden">
        <div className={`absolute top-0 left-0 w-full h-full rounded-t-full bg-gradient-to-r ${getGradientColor(percentage)}`}></div>
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
          <div className="w-56 h-28 rounded-t-full" style={{ background: 'var(--glass-bg-strong)'}}></div>
        </div>
        <div 
          className="absolute top-0 left-1/2 w-1 h-32 origin-bottom transition-transform duration-500"
          style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }}
        >
          <div className="w-1 h-1/2 bg-text-muted"></div>
          <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-text-muted rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
        </div>
      </div>
      <div className="text-4xl font-bold text-text-strong mt-[-1rem]">{value.toFixed(2)}</div>
      <div className="flex justify-between w-64 text-base text-text-muted px-3">
        <span>0</span>
        <span>{max}</span>
      </div>
    </div>
  );
};

export default GaugeChart;