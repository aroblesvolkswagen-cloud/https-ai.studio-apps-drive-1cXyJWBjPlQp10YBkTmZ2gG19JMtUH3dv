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
    <div className="p-4 glass glass-noise flex flex-col h-full">
      <div className="glass-specular"></div>
      <div className="glass-glare"></div>
      <h3 className="font-semibold text-text-strong mb-4 text-center">{title}</h3>
      <div className="flex-grow">
        {kpis.map((kpi, index) => (
          <div key={index} className="flex justify-between items-center p-2 border-b border-white/10 last:border-b-0">
            <span className="text-sm font-medium text-text-muted">{kpi.name}</span>
            <span className="text-lg font-bold text-venki-cyan">{kpi.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KPICard;