import React from 'react';
import { ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, Label, Cell } from 'recharts';

interface ParetoChartProps {
  data: { name: string; Frecuencia: number; Cumulativo: number }[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 text-sm rounded-xl glass glass-strong text-text-default">
        <p className="font-bold text-accent-cyan">{`${label}`}</p>
        <p>{`Costo: $${payload[0].value.toFixed(2)}`}</p>
        <p style={{ color: 'var(--accent-peach)' }}>{`Acumulado: ${payload[1].value.toFixed(1)}%`}</p>
      </div>
    );
  }
  return null;
};


const ParetoChartComponent: React.FC<ParetoChartProps> = ({ data }) => {
  const chartColors = [
    'rgba(1, 174, 240, 0.7)', // --venki-cyan with opacity
    'rgba(238, 0, 140, 0.7)', // --venki-magenta with opacity
    'rgba(255, 242, 0, 0.7)', // --venki-yellow with opacity
  ];
  
  const dynamicWidth = Math.max(500, data.length * 100);

  return (
    <div style={{ width: '100%', overflowX: 'auto', paddingBottom: '1rem' }}>
        <ResponsiveContainer width={dynamicWidth} height={300}>
            <ComposedChart
            data={data}
            margin={{
                top: 20, right: 30, left: 20, bottom: 20,
            }}
            >
            <defs>
                <filter id="line-shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="2" dy="2" stdDeviation="3" floodColor="var(--accent-peach)" floodOpacity="0.5"/>
                </filter>
                {chartColors.map((color, index) => (
                    <linearGradient key={`gradient-${index}`} id={`barGradient${index}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.8} />
                    <stop offset="100%" stopColor={color} stopOpacity={0.4} />
                    </linearGradient>
                ))}
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" />
            
            <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12, fill: 'var(--text-muted)' }} 
                axisLine={{ stroke: 'var(--glass-border)' }}
                tickLine={{ stroke: 'var(--glass-border)' }}
                interval={0}
                angle={-30}
                textAnchor="end"
                height={60}
            />

            <YAxis yAxisId="left" orientation="left" stroke="var(--accent-cyan)" tick={{ fill: 'var(--accent-cyan)', fontSize: 12 }}>
                <Label value="Costo" angle={-90} position="insideLeft" style={{ textAnchor: 'middle', fill: 'var(--accent-cyan)' }} />
            </YAxis>
            
            <YAxis yAxisId="right" orientation="right" stroke="var(--accent-peach)" domain={[0, 100]} tickFormatter={(tick) => `${tick}%`} tick={{ fill: 'var(--accent-peach)', fontSize: 12 }}>
                <Label value="Porcentaje Acumulado" angle={-90} position="insideRight" style={{ textAnchor: 'middle', fill: 'var(--accent-peach)' }} />
            </YAxis>

            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }} />

            <Bar yAxisId="left" dataKey="Frecuencia" barSize={35} radius={[10, 10, 0, 0]}>
                {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`url(#barGradient${index % chartColors.length})`} />
                ))}
            </Bar>
            
            <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="Cumulativo" 
                stroke="var(--accent-peach)"
                strokeWidth={3}
                dot={{ r: 5, strokeWidth: 2, fill: '#fff', stroke: 'var(--accent-peach)' }}
                activeDot={{ r: 7, strokeWidth: 2, fill: '#fff', stroke: 'var(--accent-peach)' }}
                filter="url(#line-shadow)"
            />

            </ComposedChart>
        </ResponsiveContainer>
    </div>
  );
};

export default ParetoChartComponent;