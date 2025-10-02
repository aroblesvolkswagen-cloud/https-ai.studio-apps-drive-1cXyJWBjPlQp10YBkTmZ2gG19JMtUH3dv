import React from 'react';

interface DashboardCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: 'increase' | 'decrease';
  icon: React.ReactNode;
  iconColorClass?: string;
  valueClassName?: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ title, value, change, changeType, icon, iconColorClass = 'text-accent-cyan', valueClassName = 'text-text-strong' }) => {
  const changeColor = changeType === 'increase' ? 'text-green-400' : 'text-red-400';
  const changeIcon = changeType === 'increase' ? '▲' : '▼';

  return (
    <div className="glass glass-noise p-6">
      <div className="glass-specular"></div>
      <div className="glass-glare"></div>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-text-muted">{title}</p>
          <p className={`text-3xl font-bold ${valueClassName}`}>{value}</p>
        </div>
        <div className={`glass w-12 h-12 rounded-full flex items-center justify-center ${iconColorClass}`}>
           {icon}
        </div>
      </div>
      {change && (
        <p className={`mt-2 text-sm font-medium ${changeColor}`}>
          {changeIcon} {change}
        </p>
      )}
    </div>
  );
};

export default DashboardCard;