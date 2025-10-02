import React from 'react';

interface Kpi {
  name: string;
  value: string | number;
}

interface KPICardProps {
  title: string;
  kpis: Kpi[];
}

const KPICard: React.FC<KPICardProps> = ({ title, kpis }) => {
  return (
    <div className="p-4 neumorphic-card flex flex-col h-full">
      <h3 className="font-semibold text-white mb-4 text-center">{title}</h3>
      <div className="flex-grow">
        {kpis.map((kpi, index) => (
          <div key={index} className="flex justify-between items-center p-2 border-b border-blue-800 last:border-b-0">
            <span className="text-sm font-medium text-gray-300">{kpi.name}</span>
            <span className="text-lg font-bold text-cyan-300">{kpi.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KPICard;